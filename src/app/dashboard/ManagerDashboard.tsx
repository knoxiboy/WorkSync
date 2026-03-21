"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { PRSubmissionDialog } from "@/components/PRSubmissionDialog";
import { Sparkles, ArrowRight, Zap, ShieldCheck } from "lucide-react";

export function ManagerDashboard({ 
  company, 
  tasks, 
  alerts,
  performance 
}: { 
  company: any, 
  tasks: any[], 
  alerts: any[],
  performance: any[]
}) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed").length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{company.name} Hub</h1>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Antigravity Active</Badge>
          </div>
          <p className="text-slate-500 font-medium text-sm">Monitoring platform performance and team execution loop.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400 font-mono hidden md:block">Invite: {company.inviteCode}</p>
          <Link href="/meeting">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 rounded-full px-6">
              Start AI Meeting
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Backlog</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-slate-900">{total}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-green-500">Verified Work</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{completed}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-500">Active Sprint</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-blue-600">{inProgress}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white border-l-4 border-l-red-500 shadow-red-100">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-500">At Risk (Overdue)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-red-600">{overdue}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Engine (Phase 10) */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white">
          <CardHeader><CardTitle className="text-lg">Team Performance Analytics</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-6">
              {performance.map(p => (
                <div key={p.name} className="flex items-center justify-between group">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-slate-700 text-sm">{p.name}</span>
                      <span className="text-xs font-bold text-indigo-600">{p.score}% Accuracy</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full transition-all duration-1000" 
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {performance.length === 0 && <p className="text-slate-400 text-center py-4 text-sm italic">No evaluation data collected yet.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Escalation System (Phase 9) */}
        <Card className="border-none shadow-sm bg-slate-900 text-white leading-relaxed">
          <CardHeader><CardTitle className="text-white flex items-center gap-2 text-lg font-bold truncate">System Alerts <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-slate-500 text-sm">All systems nominal. No escalations.</p>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs shadow-inner">
                    <p className="text-slate-300 mb-1">{alert.message}</p>
                    <p className="text-slate-500 uppercase font-black text-[9px] tracking-widest">{new Date(alert.sentAt).toLocaleString('en-US')}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Execution Backlog</CardTitle>
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-slate-50">Export Report</Button>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">No active tasks in the loop. Start a meeting to trigger intelligence extraction.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Definition</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned To</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Execution State</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map(task => (
                  <TableRow key={task.id} className="group transition-colors hover:bg-slate-50/50">
                    <TableCell className="py-4">
                      <div className="font-semibold text-slate-700">{task.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Deadline: {task.deadline ? (
                          isNaN(new Date(task.deadline).getTime()) 
                            ? task.deadline 
                            : new Date(task.deadline).toLocaleDateString('en-US')
                        ) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                          {(task.user?.name || task.owner)[0]}
                        </div>
                        <span className="text-sm text-slate-600">{task.user?.name || task.owner}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={task.status === 'completed' ? 'default' : 'secondary'} className={task.status === 'completed' ? 'bg-green-500 hover:bg-green-600 border-none' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-none'}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'text-slate-400 border-slate-200'}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {task.status !== "completed" ? (
                        <PRSubmissionDialog taskId={task.id} taskTitle={task.title} ownerClerkId={task.user?.clerkId} />
                      ) : (
                        <div className="text-green-600 font-bold text-xs uppercase tracking-tighter">Verified ✓</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
