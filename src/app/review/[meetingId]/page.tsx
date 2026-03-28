"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Loader2, CheckCircle2, X, ArrowLeft, Sparkles, 
  Brain, ShieldCheck, AlertCircle, Zap, Bot
} from "lucide-react";

interface PendingTask {
  id: string;
  title: string;
  owner: string;
  deadline: string | null;
  priority: string;
}

interface AgentLog {
  id: string;
  agentName: string;
  agentRole: string;
  reasoning: string;
  confidence: number;
  durationMs: number;
  createdAt: string;
}

export default function ReviewPage() {
  const params = useParams();
  const meetingId = params.meetingId as string;
  const router = useRouter();
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch pending tasks for this meeting
        const tasksRes = await fetch(`/api/review?meetingId=${meetingId}`);
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          setTasks(data.tasks || []);
          setSummary(data.summary || "");
          setSelected(new Set((data.tasks || []).map((t: PendingTask) => t.id)));
        }

        // Fetch agent decision logs
        const logsRes = await fetch(`/api/agent-log?meetingId=${meetingId}`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setAgentLogs(logsData.logs || []);
        }
      } catch (err) {
        console.error("Failed to fetch review data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [meetingId]);

  const toggleTask = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const approveIds = [...selected];
      const rejectIds = tasks.filter(t => !selected.has(t.id)).map(t => t.id);

      if (approveIds.length > 0) {
        await fetch("/api/tasks/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: approveIds, action: "approve" }),
        });
      }
      if (rejectIds.length > 0) {
        await fetch("/api/tasks/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds: rejectIds, action: "reject" }),
        });
      }

      toast.success(`${approveIds.length} tasks approved, ${rejectIds.length} rejected`);
      router.push("/dashboard");
    } catch (err) {
      toast.error("Failed to process tasks");
    } finally {
      setApproving(false);
    }
  };

  const handleApproveAll = async () => {
    setSelected(new Set(tasks.map(t => t.id)));
    // Let state update, then approve
    setTimeout(() => handleApprove(), 100);
  };

  const getAgentIcon = (name: string) => {
    if (name.includes("Transcript")) return <Brain className="w-4 h-4" />;
    if (name.includes("Orchestrator")) return <Zap className="w-4 h-4" />;
    if (name.includes("Validation")) return <ShieldCheck className="w-4 h-4" />;
    if (name.includes("Self-Correction")) return <AlertCircle className="w-4 h-4" />;
    return <Bot className="w-4 h-4" />;
  };

  const getAgentColor = (name: string) => {
    if (name.includes("Transcript")) return "text-blue-500 bg-blue-50 border-blue-200";
    if (name.includes("Orchestrator")) return "text-indigo-500 bg-indigo-50 border-indigo-200";
    if (name.includes("Validation")) return "text-green-500 bg-green-50 border-green-200";
    if (name.includes("Self-Correction")) return "text-orange-500 bg-orange-50 border-orange-200";
    return "text-slate-500 bg-slate-50 border-slate-200";
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="text-slate-500 font-medium text-sm">Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-500/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Skip Review</span>
          </button>
          <Badge className="bg-indigo-600 text-white border-none px-4 py-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Human-in-the-Loop Review
          </Badge>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Meeting Summary */}
        {summary && (
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-500" /> Meeting Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-5 rounded-2xl border border-slate-100">
                {summary}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Tasks for Review */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Extracted Tasks ({tasks.length})
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {selected.size}/{tasks.length} selected
                </span>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic text-sm">
                No tasks were extracted from this meeting.
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer group ${
                      selected.has(task.id) 
                        ? "border-indigo-300 bg-white shadow-md shadow-indigo-100" 
                        : "border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            selected.has(task.id) 
                              ? "bg-indigo-600 border-indigo-600" 
                              : "border-slate-300"
                          }`}>
                            {selected.has(task.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <h3 className="font-bold text-slate-900">{task.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 mt-2 ml-7">
                          <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                          <span className="text-xs text-slate-500">
                            → {task.owner}
                          </span>
                          {task.deadline && (
                            <span className="text-xs text-slate-400">
                              Due: {task.deadline}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {tasks.length > 0 && (
              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                  {approving ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                  )}
                  Approve {selected.size} / Reject {tasks.length - selected.size}
                </Button>
                <Button
                  onClick={handleApproveAll}
                  disabled={approving}
                  variant="outline"
                  className="h-14 rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold px-8"
                >
                  Approve All
                </Button>
              </div>
            )}
          </div>

          {/* Right: Agent Decision Trail */}
          <div className="space-y-6">
            <h2 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-500" /> Agent Decision Trail
            </h2>

            {agentLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 italic text-sm">
                Agent logs will appear here after processing.
              </div>
            ) : (
              <div className="space-y-3">
                {agentLogs.map((log, i) => (
                  <Card key={log.id} className="border-none shadow-sm bg-white overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${getAgentColor(log.agentName)}`}>
                          {getAgentIcon(log.agentName)}
                          {log.agentName}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.durationMs}ms
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {log.reasoning}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full transition-all" 
                            style={{ width: `${Math.round(log.confidence * 100)}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {Math.round(log.confidence * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
