import { NextResponse } from "next/server";
import { sql } from "@/lib/core/neon";

export async function GET() {
  try {
    // Add blockedById to Task
    await sql`
      ALTER TABLE "Task" 
      ADD COLUMN IF NOT EXISTS "blockedById" TEXT;
    `;

    // Ensure Alert table exists for later
    await sql`
      CREATE TABLE IF NOT EXISTS "Alert" (
        "id" TEXT NOT NULL,
        "taskId" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
      );
    `;

    return NextResponse.json({ success: true, message: "Migration for Tier 2 features applied." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
