import { NextResponse } from "next/server";
import { sql } from "@/lib/core/neon";

/**
 * DB Migration endpoint — adds all missing columns/tables
 * Hit GET /api/debug/migrate once to sync DB with Prisma schema
 */
export async function GET() {
  const results: Record<string, string> = {};

  // 1. Add blockedById to Task table
  try {
    await sql`ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "blockedById" TEXT`;
    results["Task.blockedById"] = "✓ ok";
  } catch (e: any) {
    results["Task.blockedById"] = `error: ${e.message}`;
  }

  // 2. Add summary to Meeting table
  try {
    await sql`ALTER TABLE "Meeting" ADD COLUMN IF NOT EXISTS "summary" TEXT`;
    results["Meeting.summary"] = "✓ ok";
  } catch (e: any) {
    results["Meeting.summary"] = `error: ${e.message}`;
  }

  // 3. Create task_escalations table
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "task_escalations" (
        "id"        TEXT PRIMARY KEY,
        "taskId"    TEXT NOT NULL,
        "companyId" TEXT NOT NULL,
        "reason"    TEXT,
        "severity"  TEXT DEFAULT 'medium',
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    results["task_escalations"] = "✓ ok";
  } catch (e: any) {
    results["task_escalations"] = `error: ${e.message}`;
  }

  // 4. Ensure AgentDecisionLog table exists (Prisma should have created it, but just in case)
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "AgentDecisionLog" (
        "id"         TEXT PRIMARY KEY,
        "agentName"  TEXT NOT NULL,
        "agentRole"  TEXT NOT NULL,
        "input"      TEXT,
        "output"     TEXT,
        "confidence" FLOAT NOT NULL DEFAULT 0,
        "reasoning"  TEXT,
        "durationMs" INT NOT NULL DEFAULT 0,
        "meetingId"  TEXT,
        "taskId"     TEXT,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    results["AgentDecisionLog"] = "✓ ok";
  } catch (e: any) {
    results["AgentDecisionLog"] = `error: ${e.message}`;
  }

  // 5. Verify Task table now has blockedById
  try {
    const cols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'Task' AND column_name = 'blockedById'
    `;
    results["Task.blockedById_verify"] = cols.length > 0 ? "✓ exists" : "✗ still missing";
  } catch (e: any) {
    results["Task.blockedById_verify"] = `error: ${e.message}`;
  }

  console.log("[MIGRATE] Results:", results);
  return NextResponse.json({ success: true, results });
}
