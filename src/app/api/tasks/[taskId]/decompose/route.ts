/**
 * Tier 3: Task Decomposition API — ANTIGRAVITY (WorkSyncAI)
 * 
 * Interactively break down a task into sub-tasks via UI.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";
import { decomposeTask } from "@/lib/ai/decomposeAgent";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString('hex');

export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;

  // 1. Fetch task
  const tasks = await sql`
    SELECT id, title, description, "companyId" 
    FROM "Task" 
    WHERE id = ${taskId} 
    LIMIT 1
  `;
  if (tasks.length === 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const task = tasks[0];

  // 2. Run Decomposition Agent
  const decomposition = await decomposeTask(task.title, task.description || "", task.id);

  // 3. Store sub-tasks in DB (Need to ensure sub-tasks table exists)
  // For the hackathon, we'll return the decomposition result to the UI first
  // and optionally persist it if the user confirms.
  
  return NextResponse.json(decomposition);
}
