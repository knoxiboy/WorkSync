"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  CheckSquare, 
  Clock, 
  Target, 
  Brain,
  Timer,
  Coffee,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Activity,
  Layout
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmployeeDashboard({ 
  profile, 
  tasks,
  notifications
}: { 
  profile: any, 
  tasks: any[],
  notifications: any[]
}) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [timer, setTimer] = useState(1500); // 25 mins

  const myTasks = tasks.filter(t => t.status !== "completed");
  const urgentTasks = myTasks.filter(t => t.priority === "high");

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* --- HERO: EXECUTION HUB --- */}
      <section className={cn(
        "relative p-10 rounded-[2.5rem] overflow-hidden glass-panel border transition-all duration-1000",
        isFocusMode ? "border-primary/40 neon-glow-cyan bg-black/60 pt-20" : "border-white/10 bg-black/20"
      )}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10" />
        
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="space-y-4 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight uppercase leading-none italic">
                Execution Hub
              </h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium tracking-tight">
              Welcome back, <span className="text-white font-bold">{profile?.name}</span>. AI identified <span className="text-primary font-black underline">{urgentTasks.length} high-priority</span> targets.
            </p>
          </div>

          {/* FOCUS MODE TOGGLE */}
          <div className="p-2 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-2">
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={cn(
                "h-12 px-6 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-[10px] transition-all",
                isFocusMode ? "bg-primary text-black neon-glow-cyan" : "bg-transparent text-muted-foreground hover:bg-white/5"
              )}
            >
              {isFocusMode ? <Zap className="w-4 h-4 fill-current" /> : <Brain className="w-4 h-4" />}
              {isFocusMode ? "Focus Active" : "Enter Deep Work"}
            </button>
            {isFocusMode && (
              <div className="px-4 text-lg font-mono font-bold text-primary">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>

        {/* FOCUS OVERLAY */}
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/20 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-primary animate-pulse" />
              <div className="text-xs font-bold tracking-[0.3em] uppercase opacity-50">Current Focus Task</div>
            </div>
            <h2 className="text-3xl font-black italic">{urgentTasks[0]?.title || "Analyze Neural Buffers"}</h2>
            <div className="flex gap-4">
              <Badge className="bg-primary/20 text-primary border border-primary/20 py-1.5 px-4 font-black uppercase tracking-widest text-[10px]">98% Confidence Match</Badge>
              <Badge className="bg-white/5 border-white/10 py-1.5 px-4 font-black uppercase tracking-widest text-[10px]">Due in 4h</Badge>
            </div>
          </motion.div>
        )}
      </section>

      {/* --- GRID: TASKS + INTEL --- */}
      {!isFocusMode && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          {/* TASK OPS AREA */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Task Synchronization
              </h2>
              <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{myTasks.length} Active Targets</span>
            </div>

            <div className="space-y-4">
              {myTasks.length > 0 ? (
                myTasks.map((task, i) => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "p-6 rounded-[2rem] border transition-all duration-500 hover:scale-[1.01] group",
                      task.priority === 'high' ? "bg-red-500/5 border-red-500/20" : "bg-black/40 border-white/5"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{task.title}</h3>
                          {task.priority === 'high' && <Badge className="bg-red-500 text-white border-none text-[8px] uppercase tracking-widest">Urgent</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                      </div>
                      <Badge className="bg-white/5 border-white/10 text-muted-foreground text-[8px] uppercase tracking-widest">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground uppercase">
                           <Clock className="w-3 h-3" />
                           {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'NO_DEADLINE'}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[9px] text-primary uppercase font-bold">
                           <Activity className="w-3.5 h-3.5" />
                           {Math.floor(Math.random() * 20) + 80}% Fit
                        </div>
                      </div>
                      <Button variant="ghost" className="h-8 pr-0 hover:bg-transparent group-hover:translate-x-2 transition-transform">
                        <span className="text-[10px] font-black uppercase tracking-widest mr-2">Begin Execution</span>
                        <ArrowRight className="w-4 h-4 text-primary" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 flex flex-col items-center justify-center opacity-20 text-center gap-4">
                  <CheckSquare className="w-16 h-16 text-primary" />
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase">No targets remaining</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: PERSONAL NEURAL INTEL */}
          <div className="space-y-8">
            {/* PRODUCTIVITY GRAPH MOCK */}
            <div className="rounded-[2.5rem] bg-black/40 border-white/5 p-8 space-y-6 border">
               <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight italic text-primary">Neural Stats</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Productivity Entropy</p>
              </div>
              
              <div className="h-32 flex items-end gap-1 px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.random() * 80 + 20}%` }}
                    className="flex-1 bg-linear-to-t from-primary/20 to-primary/80 rounded-t-sm"
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase">Focused Hours</div>
                  <div className="text-xl font-black tracking-tight">32.4h</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <div className="text-[9px] font-bold text-muted-foreground uppercase">Sync Load</div>
                  <div className="text-xl font-black tracking-tight text-primary">Low</div>
                </div>
              </div>
            </div>

            {/* RECENT NOTIFICATIONS / CHAT */}
            <div className="rounded-[2.5rem] bg-black/40 border-white/5 p-8 space-y-6 border">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Recent Context
              </h2>
              
              <div className="space-y-4">
                {notifications.slice(0, 3).map((note, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black text-foreground uppercase truncate tracking-tight">{note.title}</div>
                      <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">{note.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
