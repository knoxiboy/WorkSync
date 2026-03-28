import { NextResponse } from "next/server";
import { sql } from "@/lib/core/neon";
import { createId } from "@paralleldrive/cuid2";
import { runVelocityAnalyzer } from "@/lib/ai/velocityAgent";
import { sendRiskAlertEmail } from "@/lib/integrations/notifications";

// Example format: GET /api/cron/bottlenecks
export async function GET() {
  try {
    // 1. Fetch all active tasks with deadlines (not completed or rejected)
    const activeTasks = await sql`
      SELECT t.*, 
             (SELECT row_to_json(b.*) FROM "Task" b WHERE b.id = t."blockedById") as blocker,
             (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t."ownerId") as user
      FROM "Task" t
      WHERE t.status IN ('todo', 'in_progress', 'pending_review')
        AND t.deadline IS NOT NULL
    `;

    // 2. Filter tasks due within the next ~3 days 
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + 3);

    const checkableTasks = activeTasks.filter((t: any) => {
      const deadlineDate = new Date(t.deadline);
      return !isNaN(deadlineDate.getTime()) && deadlineDate <= thresholdDate;
    });

    if (checkableTasks.length === 0) {
      return NextResponse.json({ message: "No tasks due soon. Skipping bottleneck check." });
    }

    // 3. Check assignee workload
    const alertsGenerated = [];
    for (const task of checkableTasks) {
      if (!task.ownerId) continue;

      // Count assignee's active tasks
      const workloadRows = await sql`
        SELECT COUNT(*) as count FROM "Task"
        WHERE "ownerId" = ${task.ownerId} 
          AND status IN ('todo', 'in_progress')
      `;
      const workloadCount = parseInt(workloadRows[0]?.count || "0", 10);

      // Run Velocity Analyzer
      const analysis = await runVelocityAnalyzer(task, workloadCount, task.blocker);

      if (analysis.isAtRisk) {
        // Create an alert (escalation)
        const alertId = createId();
        await sql`
          INSERT INTO "task_escalations" (id, "taskId", "companyId", reason, severity, resolved, "createdAt", "updatedAt")
          VALUES (
            ${alertId}, 
            ${task.id}, 
            (SELECT "companyId" FROM "User" WHERE id = ${task.ownerId} LIMIT 1), 
            ${analysis.reason}, 
            'high', 
            false, 
            NOW(), 
            NOW()
          )
        `;

        // Update task priority to high
        await sql`UPDATE "Task" SET priority = 'high' WHERE id = ${task.id}`;

        // Also add to generic Alert table just in case
        await sql`
          INSERT INTO "Alert" (id, "taskId", message, "sentAt")
          VALUES (${createId()}, ${task.id}, ${'PREDICTIVE BOTTLENECK: ' + analysis.reason}, NOW())
        `;
        
        // Trigger email notification
        if (task.user?.email) {
          await sendRiskAlertEmail(task.user.email, task.user.name, task.title, analysis.reason);
        }

        alertsGenerated.push({
          taskId: task.id,
          reason: analysis.reason
        });
      }
    }

    return NextResponse.json({ success: true, alertsGenerated });
  } catch (error: any) {
    console.error("[CRON_BOTTLENECK]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
