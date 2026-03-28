import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";
import { parseGitHubUrl } from "@/lib/integrations/github-parser";
import { fetchGitHubWork } from "@/lib/integrations/github";
import { evaluateSubmission } from "@/lib/ai/evaluateSubmission";

export async function DELETE(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const { submissionId } = await params;

    // 1. Fetch user and submission
    const user = (await sql`SELECT id, role FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`)[0] as any;
    const submission = (await sql`SELECT * FROM "task_submissions" WHERE id = ${submissionId} LIMIT 1`)[0] as any;

    if (!submission) return new NextResponse("Submission not found", { status: 404 });

    // 2. Validate Ownership/Manager
    if (submission.userId !== user.id && user.role !== 'MANAGER') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Delete
    await sql`DELETE FROM "task_submissions" WHERE id = ${submissionId}`;

    // 4. Update Task Status if no submissions left or if it was the latest
    // For simplicity, we'll check if any other submissions exist for this task
    const remaining = await sql`SELECT id FROM "task_submissions" WHERE "taskId" = ${submission.taskId} ORDER BY "createdAt" DESC LIMIT 1`;
    
    if (remaining.length === 0) {
      await sql`UPDATE "Task" SET status = 'in_progress' WHERE id = ${submission.taskId}`;
    } else {
       // Optional: Re-calculate task status based on the now-latest submission
       // For now, staying as is or reverting to in_progress to be safe is fine
    }

    return NextResponse.json({ message: "Submission deleted" });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const { submissionId } = await params;
    const { githubUrl, submissionNote } = await req.json();

    console.log(`[PATCH_SUBMIT] Updating submission ${submissionId} | New URL: ${githubUrl}`);

    // 1. Fetch data
    const user = (await sql`SELECT id, role FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`)[0] as any;
    const submission = (await sql`SELECT * FROM "task_submissions" WHERE id = ${submissionId} LIMIT 1`)[0] as any;
    
    if (!submission) {
      console.warn(`[PATCH_SUBMIT] Submission ${submissionId} not found`);
      return new NextResponse("Submission not found", { status: 404 });
    }

    const task = (await sql`SELECT * FROM "Task" WHERE id = ${submission.taskId} LIMIT 1`)[0] as any;

    // 2. Validate Ownership
    if (submission.userId !== user.id && user.role !== 'MANAGER') {
      console.warn(`[PATCH_SUBMIT] Unauthorized attempt by user ${user.id}`);
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Update Link/Note
    const githubMetadata = parseGitHubUrl(githubUrl);
    if (!githubMetadata) return new NextResponse("Invalid GitHub URL", { status: 400 });

    console.log(`[PATCH_SUBMIT] Meta detected: ${githubMetadata.type}. Updating base fields...`);
    await sql`
      UPDATE "task_submissions"
      SET "githubUrl" = ${githubUrl},
          "submission_note" = ${submissionNote || null},
          "submissionType" = ${githubMetadata.type},
          "updatedAt" = NOW()
      WHERE id = ${submissionId}
    `;

    // 4. Trigger RE-EVALUATION
    console.log(`[PATCH_SUBMIT] Fetching fresh diff from GitHub...`);
    const work = await fetchGitHubWork(githubMetadata);
    if (work) {
      console.log(`[PATCH_SUBMIT] Sending to "Brutal" AI Evaluation...`);
      const evaluation = await evaluateSubmission(task.title, task.description || "", work);
      if (evaluation) {
        console.log(`[PATCH_SUBMIT] AI Evaluation complete. Score: ${evaluation.score}. Updating DB...`);
        await sql`
          UPDATE "task_submissions"
          SET 
            "evaluationStatus" = ${evaluation.status},
            "score" = ${evaluation.score},
            "feedback" = ${evaluation.summary},
            "issues" = ${JSON.stringify(evaluation.issues)},
            "suggestions" = ${JSON.stringify(evaluation.suggestions)},
            "manager_suggestion" = ${evaluation.managerSuggestion},
            "updatedAt" = NOW()
          WHERE id = ${submissionId}
        `;

        // Update Task Status
        const newStatus = evaluation.status === 'approved' ? 'completed' : 'needs_improvement';
        await sql`UPDATE "Task" SET status = ${newStatus} WHERE id = ${task.id}`;

        console.log(`[PATCH_SUBMIT] Task ${task.id} updated to ${newStatus}`);
        return NextResponse.json({ message: "Updated and Re-evaluated", evaluation });
      } else {
         console.error(`[PATCH_SUBMIT] AI evaluation returned null`);
      }
    } else {
       console.error(`[PATCH_SUBMIT] Failed to fetch work from GitHub`);
    }

    return NextResponse.json({ message: "Updated, evaluation failed" });
  } catch (error: any) {
    console.error("[PATCH_SUBMIT_CRITICAL_ERROR]", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
