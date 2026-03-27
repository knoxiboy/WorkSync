import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, Target, Clock, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const users = await sql`SELECT * FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`;
  const dbUser = users[0] as any;

  if (!dbUser || dbUser.role !== 'MANAGER') redirect("/dashboard");

  // 1. Team Aggregate Metrics
  const teamStats = await sql`
    SELECT 
      COUNT(*) as total_tasks,
      COUNT(CASE WHEN status IN ('completed', 'approved') THEN 1 END) as completed_tasks,
      COUNT(CASE WHEN status = 'needs_improvement' THEN 1 END) as improvement_tasks,
      COUNT(CASE WHEN deadline < TO_CHAR(NOW(), 'YYYY-MM-DD') AND status NOT IN ('completed', 'approved') THEN 1 END) as overdue_tasks
    FROM "Task"
    WHERE "ownerId" IN (SELECT id FROM "User" WHERE "companyId" = ${dbUser.companyId})
  `;
  const stats = teamStats[0] as any;

  // 2. Developer Performance
  const devStats = await sql`
    SELECT 
      u.id, 
      u.name, 
      COUNT(DISTINCT t.id) as total_tasks,
      COUNT(DISTINCT CASE WHEN t.status IN ('completed', 'approved') THEN t.id END) as completed_tasks,
      COUNT(DISTINCT CASE WHEN t.status = 'needs_improvement' THEN t.id END) as improvement_tasks,
      COUNT(DISTINCT CASE WHEN t.deadline < TO_CHAR(NOW(), 'YYYY-MM-DD') AND t.status NOT IN ('completed', 'approved') THEN t.id END) as overdue_tasks,
      ROUND(AVG(sub.score)) as avg_score
    FROM "User" u
    LEFT JOIN "Task" t ON u.id = t."ownerId"
    LEFT JOIN "task_submissions" sub ON t.id = sub."taskId"
    WHERE u."companyId" = ${dbUser.companyId}
    GROUP BY u.id, u.name
    ORDER BY avg_score DESC NULLS LAST
  `;

  const completionRate = stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-8 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group mb-2">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest leading-none">Management Hub</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Performance Analytics</h1>
              <Badge className="bg-slate-900 text-white border-none px-2 py-1"><TrendingUp className="w-3.5 h-3.5 mr-1" /> Live</Badge>
            </div>
            <p className="text-slate-500 font-medium text-sm mt-1">Measuring engineering execution velocity and AI-verified accuracy.</p>
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] rounded-xl px-6 h-10 hover:bg-slate-100">
             Export Technical Audit
          </Button>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                       <Target className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                       <div className="text-2xl font-black tracking-tight text-slate-900">{completionRate}%</div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Completion Velocity</div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                       <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                       <div className="text-2xl font-black tracking-tight text-slate-900">{stats.total_tasks}</div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Allocated Tasks</div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center">
                       <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                       <div className="text-2xl font-black tracking-tight text-slate-900">{stats.overdue_tasks}</div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">At Risk (Overdue)</div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-slate-900 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                 <ShieldCheck className="w-12 h-12" />
              </div>
              <CardContent className="p-6">
                 <div>
                    <div className="text-2xl font-black tracking-tight">{stats.completed_tasks}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verified Units</div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Developer Performance Detail */}
        <Card className="border-none shadow-sm bg-white overflow-hidden">
           <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between pb-6">
              <CardTitle className="text-lg flex items-center gap-2">
                 <Users className="w-5 h-5 text-indigo-500" /> Executive Execution Standings
              </CardTitle>
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                 Ranked by AI Accuracy Score
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <Table>
                 <TableHeader>
                    <TableRow className="bg-slate-50/50">
                       <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Developer Identity</TableHead>
                       <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Task Allocation</TableHead>
                       <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Execution Success</TableHead>
                       <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">AI Accuracy</TableHead>
                       <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Risk Factor</TableHead>
                       <TableHead className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Velocity</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {devStats.map((dev: any) => (
                       <TableRow key={dev.id} className="group hover:bg-slate-50/50 transition-colors">
                          <TableCell className="px-6 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-500/20">
                                   {dev.name[0]}
                                </div>
                                <div>
                                   <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{dev.name}</div>
                                   <div className="text-[10px] text-slate-400 uppercase tracking-tighter">Verified Developer</div>
                                </div>
                             </div>
                          </TableCell>
                          <TableCell className="font-bold text-slate-600">{dev.total_tasks} Units</TableCell>
                          <TableCell className="text-center font-bold text-slate-600">
                             {dev.completed_tasks} / {dev.total_tasks}
                          </TableCell>
                          <TableCell className="text-center">
                             <div className={`text-sm font-black ${dev.avg_score >= 80 ? 'text-green-600' : dev.avg_score >= 60 ? 'text-yellow-600' : 'text-slate-300'}`}>
                                {dev.avg_score ? `${dev.avg_score}%` : '--'}
                             </div>
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className={`border-none ${dev.overdue_tasks > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {dev.overdue_tasks > 0 ? `${dev.overdue_tasks} High Risk` : 'Nominal'}
                             </Badge>
                          </TableCell>
                          <TableCell className="text-right px-6 py-5">
                             <div className="inline-flex items-center gap-1.5 text-slate-900 font-black text-sm">
                                {Math.round((dev.completed_tasks / (dev.total_tasks || 1)) * 100)}%
                                <TrendingUp className={`w-3.5 h-3.5 ${dev.completed_tasks > 0 ? 'text-green-500' : 'text-slate-200'}`} />
                             </div>
                          </TableCell>
                       </TableRow>
                    ))}
                 </TableBody>
              </Table>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
