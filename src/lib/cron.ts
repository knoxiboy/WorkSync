import cron from "node-cron";
import { sql } from "./neon";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString('hex');

export function initCron() {
  // Run every hour: 0 * * * *
  cron.schedule("0 * * * *", async () => {
    console.log("Running deadline escalation check...");
    try {
      const now = new Date().toISOString();
      const overdueTasks = await sql`
        SELECT * FROM "Task"
        WHERE deadline < ${now}
          AND status != 'completed'
      `;

      for (const task of overdueTasks) {
        // Create an alert 
        await sql`
          INSERT INTO "Alert" (id, "taskId", message, "sentAt")
          VALUES (${createId()}, ${task.id}, ${`Task "${task.title}" is overdue! Deadline was ${task.deadline}.`}, NOW())
        `;
        console.log(`Alert created for task: ${task.id}`);
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
}
