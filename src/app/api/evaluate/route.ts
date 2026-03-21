import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskId, repo, prNumber } = await req.json();

    if (!taskId || !repo || !prNumber) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { user: true }
    });

    if (!task) return new NextResponse("Task not found", { status: 404 });

    // Check if the current user is the owner of the task
    // If task.user is null, it means it's an unassigned task (e.g. matched by name only but no record)
    // In that case, we might allow it or block it. User said "only that guy can submit PR who is assigned"
    if (task.user && task.user.clerkId !== userId) {
      return new NextResponse("Access Denied: You are not assigned to this task.", { status: 403 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) return new NextResponse("GitHub token not configured", { status: 500 });

    // 1. Fetch PR files/diff from GitHub
    // Format: repo = "owner/repo"
    const filesUrl = `https://api.github.com/repos/${repo}/pulls/${prNumber}/files`;
    const filesRes = await fetch(filesUrl, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!filesRes.ok) {
      return new NextResponse("Failed to fetch PR details from GitHub", { status: filesRes.status });
    }

    const files = await filesRes.json();
    let diffString = files.map((f: any) => `File: ${f.filename}\n${f.patch}`).join('\n\n');
    
    // Truncate to avoid token limits (approx 8000 chars as requested)
    if (diffString.length > 8000) {
      diffString = diffString.substring(0, 8000) + "... (truncated)";
    }

    // 2. AI Evaluation with GROQ
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a strict senior code reviewer. Return ONLY valid JSON, no markdown, no extra text.",
        },
        {
          role: "user",
          content: `Task assigned: ${task.title}\n\nCode diff submitted:\n${diffString}\n\nEvaluate whether this code completes the task. Return JSON:\n{\n  "score": number (0-100),\n  "correctness": number (0-100),\n  "quality": number (0-100),\n  "completeness": number (0-100),\n  "issues": string[],\n  "suggestions": string[],\n  "verdict": "completed" | "needs_improvement"\n}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiContent = response.choices[0].message.content;
    if (!aiContent) throw new Error("No AI response");

    const evaluationData = JSON.parse(aiContent);

    // 3. Save Evaluation & Update Task
    const evaluation = await prisma.evaluation.create({
      data: {
        taskId: task.id,
        score: evaluationData.score,
        correctness: evaluationData.correctness,
        quality: evaluationData.quality,
        completeness: evaluationData.completeness,
        issues: evaluationData.issues,
        suggestions: evaluationData.suggestions,
        verdict: evaluationData.verdict,
      },
    });

    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: evaluationData.verdict === "completed" ? "completed" : "needs_improvement",
      },
    });

    return NextResponse.json(evaluation);

  } catch (error) {
    console.error("[EVALUATE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
