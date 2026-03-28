import { NextResponse } from "next/server";
import { sql } from "@/lib/core/neon";
import { createId } from "@paralleldrive/cuid2";
import { runFollowUpAgent } from "@/lib/ai/followUpAgent";
import { sendFollowUpNudge } from "@/lib/integrations/notifications";

export async function GET() {
  try {
    // Find unstarted tasks from meetings older than 24h
    // that haven't been followed up on yet
    const staleTasks = await sql`
      SELECT t.*, m.summary as "meetingSummary",
             (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t."ownerId") as user
      FROM "Task" t
      JOIN "Meeting" m ON t."meetingId" = m.id
      WHERE t.status IN ('todo', 'pending_review')
        AND m."createdAt" <= NOW() - INTERVAL '1 DAY'
        AND NOT EXISTS (
          SELECT 1 FROM "Alert" a 
          WHERE a."taskId" = t.id 
            AND a.message LIKE 'FOLLOW_UP:%'
        )
      LIMIT 20
    `;

    if (staleTasks.length === 0) {
      return NextResponse.json({ message: "No stale tasks needing follow-up." });
    }

    const nudges = [];
    for (const task of staleTasks) {
      // Draft the context-aware nudge message
      const nudgeMessage = await runFollowUpAgent(task, task.meetingSummary || "Discussed action items in team meeting.");

      // Save Alert
      const alertMessage = `FOLLOW_UP: ${nudgeMessage}`;
      await sql`
        INSERT INTO "Alert" (id, "taskId", message, "sentAt")
        VALUES (${createId()}, ${task.id}, ${alertMessage}, NOW())
      `;

      // Trigger email notification
      if (task.user?.email) {
        await sendFollowUpNudge(task.user.email, task.user.name, task.title, nudgeMessage);
      }

      nudges.push({
        taskId: task.id,
        nudge: nudgeMessage
      });
    }

    return NextResponse.json({ success: true, nudges });
  } catch (error: any) {
    console.error("[CRON_FOLLOW_UP]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
