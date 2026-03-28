import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const meetingId = url.searchParams.get("meetingId");

    if (!meetingId) {
      return new NextResponse("meetingId is required", { status: 400 });
    }

    // Fetch pending tasks for this meeting
    const tasks = await sql`
      SELECT * FROM "Task"
      WHERE "meetingId" = ${meetingId} AND status = 'pending_review'
      ORDER BY "createdAt" ASC
    `;

    // Fetch meeting summary
    let summary = "";
    try {
      const meetings = await sql`SELECT "summary" FROM "Meeting" WHERE id = ${meetingId} LIMIT 1`;
      summary = meetings[0]?.summary || "";
    } catch {
      // summary column may not exist
    }

    return NextResponse.json({ tasks, summary });
  } catch (error: any) {
    console.error("[REVIEW_FETCH]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
