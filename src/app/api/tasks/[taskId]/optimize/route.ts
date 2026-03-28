/**
 * Tier 3: Resource Optimization API — ANTIGRAVITY (WorkSyncAI)
 * 
 * Interactively predict task-to-talent fitment via UI.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";
import { optimizeResource } from "@/lib/ai/resourceAgent";

export async function POST(req: Request, { params }: { params: { taskId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;

  // 1. Fetch task and owner
  const tasks = await sql`
    SELECT t.id, t.title, t.description, t."ownerId", u.name, u.role
    FROM "Task" t
    JOIN "User" u ON t."ownerId" = u.id
    WHERE t.id = ${taskId} 
    LIMIT 1
  `;
  if (tasks.length === 0) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const task = tasks[0];

  // 2. Run Resource Optimization Agent
  const optimization = await optimizeResource(
    task.title, 
    task.description || "", 
    task.name, 
    task.role, 
    task.id
  );

  return NextResponse.json(optimization);
}
