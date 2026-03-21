import cron from "node-cron";
import { prisma } from "./db";

export function initCron() {
  // Run every hour: 0 * * * *
  cron.schedule("0 * * * *", async () => {
    console.log("Running deadline escalation check...");
    try {
      const now = new Date().toISOString();
      const overdueTasks = await prisma.task.findMany({
        where: {
          deadline: {
            lt: now,
          },
          status: {
            not: "completed",
          },
        },
      });

      for (const task of overdueTasks) {
        // Create an alert if it doesn't already have one for this task recently
        // Simplified: just create an alert
        await prisma.alert.create({
          data: {
            taskId: task.id,
            message: `Task "${task.title}" is overdue! Deadline was ${task.deadline}.`,
          },
        });
        console.log(`Alert created for task: ${task.id}`);
      }
    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
}
