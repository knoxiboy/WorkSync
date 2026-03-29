"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ShieldCheck, 
  Brain, 
  Check, 
  X, 
  Clock, 
  Zap, 
  AlertCircle,
  Activity,
  Layers,
  ArrowRight,
  User,
  ShieldAlert,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AgentPipelineViewer } from "@/components/ai/AgentPipelineViewer";

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

  useEffect(() => {
    fetch("/api/agent-log?limit=6")
      .then(r => r.json())
      .then(d => setAuditLogs(d.logs || []))
      .catch(() => {});
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
      toast.success(`${selectedIds.length} task(s) finalized.`);
      setSelectedIds([]);
      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* --- HERO: COMMAND DECK OVERVIEW --- */}
      <section className="relative p-10 rounded-[2.5rem] overflow-hidden glass-panel border border-white/10 group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] -z-10 group-hover:bg-primary/20 transition-all duration-1000" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center neon-glow-cyan border border-primary/20">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-4xl font-black tracking-tight uppercase leading-none italic">
                  Command Deck
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-bold">
                  {company.name} Neural Hub v3.0
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase">System Stable</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold tracking-widest uppercase">98.2% Accuracy</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/meeting">
              <Button size="lg" className="h-16 px-8 rounded-3xl bg-primary hover:bg-primary/80 text-black font-black uppercase tracking-widest group neon-glow-cyan">
                <Zap className="w-5 h-5 mr-3 fill-current group-hover:animate-bounce" />
                Initiate Neural Session
              </Button>
            </Link>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          {[
            { label: "Total Backlog", value: total, icon: Layers, color: "text-blue-400" },
            { label: "Verified Work", value: completed, icon: ShieldCheck, color: "text-emerald-400" },
            { label: "Active Sprint", value: inProgress, icon: Activity, color: "text-cyan-400" },
            { label: "Mission Risk", value: overdue, icon: ShieldAlert, color: "text-red-400", critical: overdue > 0 },
          ].map((metric) => (
            <div key={metric.label} className={cn(
              "p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02]",
              metric.critical ? "bg-red-500/5 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "bg-white/5 border-white/5"
            )}>
              <metric.icon className={cn("w-5 h-5 mb-4", metric.color)} />
              <div className="text-3xl font-black mb-1">{metric.value}</div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* --- MIDDLE SECTION: PIPELINE + PENDING --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NEURAL PIPELINE PREVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Orchestration Flow
            </h2>
          </div>
          <AgentPipelineViewer activeStep={3} />
        </div>

        {/* PENDING APPROVAL GATE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Human-in-the-Loop Gate
            </h2>
            {pendingTasks.length > 0 && (
              <Badge className="bg-primary/20 text-primary border border-primary/20 text-[9px] uppercase tracking-widest animate-pulse">
                {pendingTasks.length} Awaiting
              </Badge>
            )}
          </div>

          <Card className="rounded-[2.5rem] bg-black/40 border-white/5 p-6 h-[280px] overflow-y-auto hud-scrollbar relative">
            <AnimatePresence mode="popLayout">
              {pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {pendingTasks.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => toggleSelect(task.id)}
                      className={cn(
                        "p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 group",
                        selectedIds.includes(task.id) 
                          ? "bg-primary/10 border-primary/40 neon-glow-cyan" 
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded flex items-center justify-center border transition-all",
                        selectedIds.includes(task.id) ? "bg-primary border-primary" : "bg-white/5 border-white/10"
                      )}>
                        {selectedIds.includes(task.id) && <Check className="w-3.5 h-3.5 text-black font-black" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate group-hover:text-primary transition-colors">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Match: {task.owner}</span>
                          <span className="text-[10px] text-primary font-mono ml-auto">{Math.round((task.resourceFitScore || 0) * 100)}% FIT</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-3">
                  <Check className="w-12 h-12 text-primary" />
                  <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Queue Clean</p>
                </div>
              )}
            </AnimatePresence>

            {selectedIds.length > 0 && (
              <div className="sticky bottom-0 left-0 right-0 pt-4 bg-linear-to-t from-black to-transparent">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleApprove("approve")}
                    className="flex-1 rounded-xl h-12 bg-primary text-black font-black uppercase tracking-widest text-[10px] neon-glow-cyan"
                  >
                    Confirm Assignment
                  </Button>
                  <Button 
                     onClick={() => handleApprove("reject")}
                     variant="outline" 
                     className="rounded-xl h-12 border-white/10 text-white font-black uppercase tracking-widest text-[10px]"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* --- BOTTOM SECTION: BACKLOG + RISK HEATMAP --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <Card className="lg:col-span-2 rounded-[2.5rem] bg-black/20 border-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 h-full flex flex-col justify-center opacity-[0.02] pointer-events-none">
            <Layers className="w-64 h-64 -mr-32" />
          </div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight italic">Execution Trace</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Global Backlog Index</p>
            </div>
          </div>

          <div className="space-y-1">
            {activeTasks.length > 0 ? (
              activeTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="group grid grid-cols-12 items-center py-4 px-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5">
                  <div className="col-span-6 flex flex-col">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">{task.title}</span>
                    <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">ID: {task.id.split('-')[0]}</span>
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[9px] font-bold">
                        {(task.user?.name || task.owner)[0]}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">{task.user?.name || task.owner}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge className={cn(
                      "text-[8px] font-black tracking-widest uppercase py-0.5",
                      task.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"
                    )}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-20 italic">No cycles active</p>
            )}
          </div>
        </Card>

        {/* RISK HEATMAP MOCK */}
        <Card className="rounded-[2.5rem] bg-black/40 border-white/5 p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black uppercase tracking-tight italic text-red-400">Hazard Matrix</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">SLA Violation Probability</p>
          </div>

          <div className="grid grid-cols-4 grid-rows-4 gap-2 h-48">
            {Array.from({ length: 16 }).map((_, i) => {
              const hue = Math.floor(Math.random() * 20);
              return (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className={cn(
                    "rounded-md border",
                    i % 5 === 0 ? "bg-red-500/40 border-red-500/50 neon-glow-purple" : 
                    i % 3 === 0 ? "bg-orange-500/20 border-orange-500/30" : 
                    "bg-white/5 border-white/10"
                  )}
                />
              );
            })}
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span>Escalation Protocol</span>
              <span className="text-red-400">Active</span>
            </div>
            {escalations.slice(0, 2).map((esc, i) => (
              <div key={i} className="flex gap-3 items-center p-3 rounded-2xl bg-red-500/5 border border-red-500/10">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-foreground truncate">{esc.taskTitle}</div>
                  <div className="text-[9px] text-red-500/70 font-mono uppercase">CRITICAL_DELAY_DETECTED</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
