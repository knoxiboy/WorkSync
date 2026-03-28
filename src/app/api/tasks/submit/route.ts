import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";
import { randomBytes } from "crypto";
import { parseGitHubUrl } from "@/lib/github-parser";
import { fetchGitHubWork } from "@/lib/github";
import { evaluateSubmission } from "@/lib/ai/evaluateSubmission";

const createId = () => randomBytes(12).toString('hex');

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskId, githubUrl, submissionNote } = await req.json();
    console.log(`[SUBMIT_API] Received submission for task ${taskId} | URL: ${githubUrl} | Note: ${submissionNote?.substring(0, 30)}...`);

    if (!taskId || !githubUrl) {
      return new NextResponse("Missing taskId or githubUrl", { status: 400 });
    }

    // 1. Fetch task and user
    const users = await sql`SELECT * FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`;
    const user = users[0] as any;
    if (!user) return new NextResponse("User not found", { status: 404 });

    const tasks = await sql`SELECT * FROM "Task" WHERE id = ${taskId} LIMIT 1`;
    const task = tasks[0] as any;
    if (!task) return new NextResponse("Task not found", { status: 404 });

    // 2. Validate Ownership
    if (task.ownerId !== user.id && user.role !== 'MANAGER') {
      console.warn(`[SUBMIT_API] Access Denied for user ${user.id} on task ${taskId}`);
      return new NextResponse("Access Denied: You are not assigned to this task.", { status: 403 });
    }

    console.log(`[SUBMIT_API] Validated user ${user.id} for task ${taskId}`);

    // 3. Parse GitHub URL
    const githubMetadata = parseGitHubUrl(githubUrl);
    if (!githubMetadata) {
      return new NextResponse("Invalid GitHub URL. Must be a PR, Commit, or Repo link.", { status: 400 });
    }

    // 4. Create Submission Record
    const submissionId = createId();
    console.log(`[SUBMIT_API] Creating submission record ${submissionId}`);
    await sql`
      INSERT INTO "task_submissions" (
        "id", "taskId", "userId", "companyId", "githubUrl", "submissionType", "submission_note", "createdAt"
      ) VALUES (
        ${submissionId}, ${taskId}, ${user.id}, ${user.companyId}, ${githubUrl}, ${githubMetadata.type}, ${submissionNote || null}, NOW()
      )
    `;

    // 4.5 Update Task Status to 'submitted' immediately
    await sql`UPDATE "Task" SET status = 'submitted' WHERE id = ${taskId}`;
    console.log(`[SUBMIT_API] Task ${taskId} status set to SUBMITTED`);

    // 5. Trigger AI Evaluation (Synchronous for now)
    console.log(`[SUBMIT_API] Fetching code from GitHub...`);
    const work = await fetchGitHubWork(githubMetadata);
    
    if (work) {
      // Send to multi-agent AI for evaluation
      console.log(`[SUBMIT_API] Sending to multi-agent AI for evaluation...`);
      const evaluation = await evaluateSubmission(task.title, task.description || "", work, taskId);
      
      if (evaluation) {
        console.log(`[SUBMIT_API] AI Evaluation 0-100: ${evaluation.score} | Result: ${evaluation.status}`);
        // Update submission with evaluation results
        await sql`
          UPDATE "task_submissions"
          SET 
            "evaluationStatus" = ${evaluation.status},
            "score" = ${evaluation.score},
            "feedback" = ${evaluation.summary},
            "issues" = ${JSON.stringify(evaluation.issues)},
            "suggestions" = ${JSON.stringify(evaluation.suggestions)},
            "manager_suggestion" = ${evaluation.managerSuggestion},
            "completionConfidence" = ${evaluation.completionConfidence}
          WHERE id = ${submissionId}
        `;

        // Update Task Status
        const newStatus = evaluation.status === 'approved' ? 'completed' : 'needs_improvement';
        await sql`
          UPDATE "Task" SET status = ${newStatus} WHERE id = ${taskId}
        `;

        return NextResponse.json({ 
          message: "Submitted and Evaluated", 
          submissionId, 
          evaluation,
          newStatus
        });
      }
    }

    // If diff fetching or evaluation failed, just mark as submitted
    await sql`UPDATE "Task" SET status = 'submitted' WHERE id = ${taskId}`;
    return NextResponse.json({ message: "Submitted, evaluation pending", submissionId });

  } catch (error: any) {
    console.error("[TASK_SUBMIT]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
