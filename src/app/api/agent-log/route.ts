import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const meetingId = url.searchParams.get("meetingId");
    const taskId = url.searchParams.get("taskId");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    let logs;
    if (meetingId) {
      logs = await sql`
        SELECT * FROM "agent_decision_log"
        WHERE "meetingId" = ${meetingId}
        ORDER BY "createdAt" ASC
        LIMIT ${limit}
      `;
    } else if (taskId) {
      logs = await sql`
        SELECT * FROM "agent_decision_log"
        WHERE "taskId" = ${taskId}
        ORDER BY "createdAt" ASC
        LIMIT ${limit}
      `;
    } else {
      // Return recent agent activity
      logs = await sql`
        SELECT * FROM "agent_decision_log"
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("[AGENT_LOG_FETCH]", error);
    return NextResponse.json({ logs: [] });
  }
}
