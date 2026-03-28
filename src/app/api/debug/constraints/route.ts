import { sql } from "@/lib/core/neon";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Run Migrations
    await sql`ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS submission_note TEXT`;
    await sql`ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS manager_suggestion TEXT`;
    await sql`ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()`;
    
    // 2. Return State
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'task_submissions'
    `;
    return NextResponse.json({ success: true, columns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}


