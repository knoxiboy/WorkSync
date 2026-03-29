/**
 * WorkSync Escalation Engine
 * Automatically detects stalled or risky tasks.
 */

import { sql } from "@/lib/core/neon";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString('hex');

export async function runEscalationCheck() {
  const escalations = [];
  
  try {
    // 1. Fetch overdue tasks with no submission
    const overdueTasks = await sql`
      SELECT t.*, u."companyId"
      FROM "Task" t
      JOIN "User" u ON t."ownerId" = u.id
      WHERE t.deadline IS NOT NULL 
        AND t.deadline < TO_CHAR(NOW(), 'YYYY-MM-DD')
        AND t.status NOT IN ('completed', 'approved', 'submitted')
        AND NOT EXISTS (
          SELECT 1 FROM "task_escalations" e 
          WHERE e."taskId" = t.id AND e.reason = 'overdue'
        )
    `;

    for (const task of overdueTasks) {
      const id = createId();
      await sql`
        INSERT INTO "task_escalations" (id, "taskId", "userId", "companyId", reason, severity, "createdAt")
        VALUES (${id}, ${task.id}, ${task.ownerId}, ${task.companyId}, 'overdue', 'high', NOW())
      `;
      
      // Also create an Alert for the manager
      await sql`
        INSERT INTO "Alert" (id, "taskId", message, "sentAt")
        VALUES (${createId()}, ${task.id}, 'CRITICAL: Task "' || ${task.title} || '" is overdue with no submission.', NOW())
      `;
      
      escalations.push({ id, taskId: task.id, reason: 'overdue' });
    }

    // 2. Fetch tasks in 'needs_improvement' for more than 48 hours
    const stalledTasks = await sql`
      SELECT t.*, u."companyId", s."createdAt" as "submittedAt"
      FROM "Task" t
      JOIN "User" u ON t."ownerId" = u.id
      JOIN "task_submissions" s ON t.id = s."taskId"
      WHERE t.status = 'needs_improvement'
        AND s."evaluationStatus" = 'needs_improvement'
        AND s."createdAt" < NOW() - INTERVAL '48 hours'
        AND NOT EXISTS (
          SELECT 1 FROM "task_escalations" e 
          WHERE e."taskId" = t.id AND e.reason = 'stalled_improvement'
        )
    `;

    for (const task of stalledTasks) {
      const id = createId();
      await sql`
        INSERT INTO "task_escalations" (id, "taskId", "userId", "companyId", reason, severity, "createdAt")
        VALUES (${id}, ${task.id}, ${task.ownerId}, ${task.companyId}, 'stalled_improvement', 'medium', NOW())
      `;
      
      await sql`
        INSERT INTO "Alert" (id, "taskId", message, "sentAt")
        VALUES (${createId()}, ${task.id}, 'WARNING: Task "' || ${task.title} || '" has been in "Needs Improvement" for >48h.', NOW())
      `;

      escalations.push({ id, taskId: task.id, reason: 'stalled_improvement' });
    }

    return { success: true, count: escalations.length, escalations };
  } catch (error) {
    console.error("Escalation check failed", error);
    return { success: false, error };
  }
}
