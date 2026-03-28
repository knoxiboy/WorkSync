import { NextResponse } from "next/server";
import { sql } from "@/lib/core/neon";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "agent_decision_log" (
        "id" TEXT PRIMARY KEY,
        "agentName" TEXT NOT NULL,
        "agentRole" TEXT NOT NULL,
        "input" TEXT,
        "output" TEXT,
        "confidence" REAL DEFAULT 0,
        "reasoning" TEXT,
        "durationMs" INTEGER DEFAULT 0,
        "meetingId" TEXT,
        "taskId" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    return NextResponse.json({ success: true, message: "agent_decision_log table created" });
  } catch (error: any) {
    console.error("[MIGRATE_AGENT_LOG]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
