import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ManagerDashboard } from "./ManagerDashboard";
import { EmployeeDashboard } from "./EmployeeDashboard";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { company: true }
  });

  if (!dbUser || !dbUser.companyId || !dbUser.company) {
    redirect("/onboarding");
  }

  const allTasks = await prisma.task.findMany({
    where: {
      OR: [
        { user: { companyId: dbUser.companyId } },
        { meeting: { companyId: dbUser.companyId } }
      ]
    },
    include: { user: true, evaluation: true }
  });

  const alerts = await prisma.alert.findMany({
    where: {
      taskId: { in: allTasks.map((t: any) => t.id) }
    },
    orderBy: { sentAt: 'desc' },
    take: 10
  });

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
