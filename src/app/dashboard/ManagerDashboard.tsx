"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Sparkles, ShieldCheck, Brain, Check, X, Clock, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { GlobalSearch } from "@/components/ai/GlobalSearch";

export function ManagerDashboard({ 
  company, 
  tasks, 
  alerts,
  escalations,
  performance,
  allProfiles,
  activeProfileId
}: { 
  company: any, 
  tasks: any[], 
  alerts: any[],
  escalations: any[],
  performance: any[],
  allProfiles: any[],
  activeProfileId: string
}) {
  const pendingTasks = tasks.filter(t => t.status === "pending_review");
  const activeTasks  = tasks.filter(t => t.status !== "pending_review");

  const total      = activeTasks.length;
  const completed  = activeTasks.filter(t => t.status === "completed").length;
  const inProgress = activeTasks.filter(t => t.status === "in_progress").length;
  const overdue    = activeTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed").length;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [approving, setApproving]     = useState(false);
  const [auditLogs, setAuditLogs]     = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Load recent agent decisions for the audit trail
  useEffect(() => {
    setAuditLoading(true);
    fetch("/api/agent-log?limit=6")
      .then(r => r.json())
      .then(d => setAuditLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setAuditLoading(false));
  }, []);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleApprove = async (action: "approve" | "reject") => {
    if (!selectedIds.length) {
      toast.error("Select at least one task first.");
      return;
    }
    setApproving(true);
    try {
      const res = await fetch("/api/tasks/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedIds, action }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${selectedIds.length} task(s) ${action === "approve" ? "approved & assigned" : "rejected"}.`);
      setSelectedIds([]);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setApproving(false);
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 0.85) return "text-green-400";
    if (c >= 0.6)  return "text-yellow-400";
    return "text-red-400";
  };

  const agentColor: Record<string, string> = {
    "Transcript Analyzer":       "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Task Orchestrator":         "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "Validation Agent":          "bg-green-500/10 text-green-400 border-green-500/20",
    "Self-Correction Controller":"bg-orange-500/10 text-orange-400 border-orange-500/20",
    "PR Review Agent":           "bg-pink-500/10 text-pink-400 border-pink-500/20",
    "Bottleneck Monitor":        "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <WorkspaceSwitcher profiles={allProfiles} activeProfileId={activeProfileId} />
          <GlobalSearch />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase italic leading-none">{company.name} Hub</h1>
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 uppercase tracking-widest text-[10px] font-bold">Manager</Badge>
            </div>
            <p className="text-slate-500 font-medium text-xs tracking-tight">Monitoring platform performance and team execution loop.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-400 font-mono hidden md:block">Invite: {company.inviteCode}</p>
          <Link href="/analytics">
            <Button variant="outline" size="lg" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-full px-6">
              Analytics Hub
            </Button>
          </Link>
          <Link href="/meeting">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 rounded-full px-6">
              Start AI Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* ── HUMAN-IN-THE-LOOP: Pending Approval Gate ── */}
      {pendingTasks.length > 0 && (
        <Card className="border-2 border-amber-400/40 shadow-lg shadow-amber-500/10 bg-amber-50/50 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                Human Approval Gate
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-white text-[10px] uppercase tracking-widest border-none">
                  {pendingTasks.length} Awaiting Review
                </Badge>
                {selectedIds.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-700">{selectedIds.length} selected</span>
                )}
              </div>
            </div>
            <p className="text-xs text-amber-700">AI extracted tasks from the meeting. Review and approve before they are assigned to the team.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {pendingTasks.map(task => (
                <label
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                    selectedIds.includes(task.id)
                      ? "bg-amber-100 border-amber-400"
                      : "bg-white border-amber-200 hover:border-amber-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-amber-500"
                    checked={selectedIds.includes(task.id)}
                    onChange={() => toggleSelect(task.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm truncate">{task.title}</div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-500">👤 {task.user?.name || task.owner}</span>
                      {task.deadline && <span className="text-[10px] text-slate-500">📅 {task.deadline}</span>}
                      <Badge variant="outline" className={`text-[9px] border ${task.priority === "high" ? "bg-red-50 text-red-600 border-red-100" : "text-slate-400 border-slate-200"}`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                disabled={!selectedIds.length || approving}
                onClick={() => handleApprove("approve")}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold gap-2 rounded-xl"
              >
                <Check className="w-4 h-4" />
                Approve & Assign
              </Button>
              <Button
                disabled={!selectedIds.length || approving}
                variant="outline"
                onClick={() => handleApprove("reject")}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 font-bold gap-2 rounded-xl"
              >
                <X className="w-4 h-4" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Engine */}
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
                      <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${p.score}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {performance.length === 0 && <p className="text-slate-400 text-center py-4 text-sm italic">No evaluation data collected yet.</p>}
            </div>
          </CardContent>
        </Card>

        {/* Escalation System */}
        <Card className="border-none shadow-sm bg-slate-900 text-white leading-relaxed overflow-hidden">
          <CardHeader><CardTitle className="text-white flex items-center gap-2 text-lg font-bold truncate">Executive Escalations <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" /></CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {escalations.length === 0 ? (
                <p className="text-slate-500 text-sm italic">All systems nominal. No escalations.</p>
              ) : (
                escalations.slice(0, 5).map(esc => (
                  <Link href={`/tasks/${esc.taskId}`} key={esc.id} className="block group/esc">
                    <div className={`p-4 rounded-2xl border transition-all ${
                      esc.severity === 'critical' ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20' : 
                      esc.severity === 'high' ? 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20' : 
                      'bg-slate-800 border-slate-700 hover:bg-slate-700'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest ${esc.severity === 'critical' || esc.severity === 'high' ? 'bg-red-500 text-white border-none' : 'text-slate-400 border-slate-700'}`}>
                          {esc.severity || 'low'}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-mono capitalize">{esc.reason?.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-100 group-hover/esc:text-indigo-300 transition-colors truncate">{esc.taskTitle}</p>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-tighter">{new Date(esc.createdAt).toLocaleString()}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── AI AUDIT TRAIL ── */}
      <Card className="border-none shadow-sm bg-slate-950 text-white overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg font-bold">
            <Brain className="w-5 h-5 text-indigo-400" />
            AI Agent Decision Audit Trail
            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] uppercase tracking-widest ml-1 border">Live</Badge>
          </CardTitle>
          <p className="text-slate-500 text-xs">Every AI decision is logged here for full auditability.</p>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <Zap className="w-4 h-4 animate-pulse text-indigo-400" /> Loading agent activity...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center opacity-30">
              <Brain className="w-10 h-10 mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest">No agent activity yet.</p>
              <p className="text-xs mt-1">Run a meeting to populate the audit trail.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log: any) => (
                <div key={log.id} className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-widest border ${agentColor[log.agentName] || "bg-slate-800 text-slate-400 border-slate-700"}`}>
                      {log.agentName}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className={`text-[11px] font-black ${confidenceColor(log.confidence)}`}>
                        {Math.round(log.confidence * 100)}% confidence
                      </span>
                      <span className="text-[10px] text-slate-600 font-mono">{log.durationMs}ms</span>
                      <span className="text-[10px] text-slate-600">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {log.reasoning && (
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{log.reasoning}</p>
                  )}
                </div>
              ))}
              <Link href="/api/agent-log?limit=50" target="_blank">
                <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 text-[10px] uppercase tracking-widest w-full mt-2 hover:bg-white/5">
                  View Full Audit Log →
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Backlog Table */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Execution Backlog</CardTitle>
          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-slate-50">Export Report</Button>
        </CardHeader>
        <CardContent>
          {activeTasks.length === 0 ? (
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
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Deadline</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned To</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Execution State</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTasks.map(task => (
                  <TableRow key={task.id} className="group transition-colors hover:bg-slate-50/50">
                    <TableCell className="py-4">
                      <Link href={`/tasks/${task.id}`} className="hover:underline decoration-indigo-300 decoration-2 underline-offset-4">
                        <div className="font-semibold text-slate-700">{task.title}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-slate-500 font-mono">
                        {task.deadline ? (
                          isNaN(new Date(task.deadline).getTime())
                            ? task.deadline
                            : new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        ) : (
                          <span className="text-slate-300">N/A</span>
                        )}
                      </div>
                      {task.blocker && (
                        <div className="text-[10px] text-red-500 font-bold mt-1 bg-red-50 w-fit px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest">
                          BLOCKED BY: {task.blocker.title}
                        </div>
                      )}
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
                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-bold uppercase tracking-widest text-[10px]">
                          Audit Details
                        </Button>
                      </Link>
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
