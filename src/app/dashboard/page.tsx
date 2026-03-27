import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon";
import { ManagerDashboard } from "./ManagerDashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";


export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUsers = await sql`
    SELECT u.*, row_to_json(c.*) as company
    FROM "User" u
    LEFT JOIN "Company" c ON u."companyId" = c.id
    WHERE u."clerkId" = ${userId}
    LIMIT 1
  `;
  
  const dbUser: any = dbUsers[0];

  if (!dbUser || !dbUser.companyId || !dbUser.company) {
    redirect("/onboarding");
  }

  const allTasks = await sql`
    SELECT t.*, 
           (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t."ownerId") as user,
           (SELECT row_to_json(e.*) FROM "Evaluation" e WHERE e."taskId" = t.id) as evaluation
    FROM "Task" t
    WHERE t."ownerId" IN (SELECT id FROM "User" WHERE "companyId" = ${dbUser.companyId})
       OR t."meetingId" IN (SELECT id FROM "Meeting" WHERE "companyId" = ${dbUser.companyId})
  `;

  const taskIds = allTasks.map((t: any) => t.id);
  const escalations = taskIds.length > 0 ? await sql`
    SELECT e.*, t.title as "taskTitle"
    FROM "task_escalations" e
    JOIN "Task" t ON e."taskId" = t.id
    WHERE e."companyId" = ${dbUser.companyId}
    ORDER BY e."createdAt" DESC
    LIMIT 10
  ` : [];

  const alerts = taskIds.length > 0 ? await sql`
    SELECT * FROM "Alert"
    WHERE "taskId" = ANY(${taskIds})
    ORDER BY "sentAt" DESC
    LIMIT 10
  ` : [];

  // Calculate performance (Phase 10)
  const performanceMap: Record<string, { total: number, scores: number[] }> = {};
  allTasks.forEach((task: any) => {
    const name = task.user?.name || task.owner;
    if (!performanceMap[name]) performanceMap[name] = { total: 0, scores: [] };
    performanceMap[name].total++;
    if (task.evaluation) {
      performanceMap[name].scores.push(task.evaluation.score);
    }
  });

  const performance = Object.entries(performanceMap).map(([name, stats]) => ({
    name,
    score: stats.scores.length > 0
      ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length)
      : 0
  })).sort((a, b) => b.score - a.score);

  if (dbUser.role === "MANAGER") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <ManagerDashboard
          company={dbUser.company}
          tasks={allTasks}
          alerts={alerts}
          escalations={escalations}
          performance={performance}
        />
      </div>
    );
  } else {
    const myTasks = allTasks.filter((t: any) => t.ownerId === dbUser.id);
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <EmployeeDashboard user={dbUser} tasks={myTasks} />
      </div>
    );
  }
}
