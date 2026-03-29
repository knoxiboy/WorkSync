"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Settings, 
  Video, 
  Mic, 
  Share2, 
  PhoneOff,
  Activity,
  Maximize2,
  Terminal,
  BrainCircuit,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveTranscript } from "./LiveTranscript";
import { AgentPipelineViewer } from "../ai/AgentPipelineViewer";

const PARTICIPANTS = [
  { id: 1, name: "Divyanshu", role: "Manager", active: true, video: true },
  { id: 2, name: "Ayush", role: "Contributor", active: false, video: true },
  { id: 3, name: "WorkSync AI", role: "Orchestrator", active: true, video: "ai" },
];

export function LiveMeetingRoom() {
  const [activeTab, setActiveTab] = useState<"transcript" | "pipeline">("transcript");

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 p-2">
      {/* LEFT: VIDEO GRID (ZEN CYBORG) */}
      <div className="flex-[2] flex flex-col gap-4">
        <div className="flex-1 grid grid-cols-2 gap-4">
          {PARTICIPANTS.filter(p => p.video).map((p) => (
            <motion.div 
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "relative rounded-3xl overflow-hidden glass-panel border border-white/10 group transition-all duration-500 hover:border-primary/40",
                p.video === "ai" && "neon-glow-cyan"
              )}
            >
              {/* VIDEO MOCK */}
              <div className={cn(
                "absolute inset-0 bg-linear-to-br transition-all duration-700",
                p.video === "ai" 
                  ? "from-primary/20 via-black to-secondary/20" 
                  : "from-white/5 to-black/40"
              )}>
                {p.video === "ai" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="w-48 h-48 rounded-full bg-primary/20 blur-3xl" 
                    />
                    <BrainCircuit className="w-16 h-16 text-primary shadow-[0_0_20px_var(--primary)] animate-pulse" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <Users className="w-24 h-24 text-white/5" />
                  </div>
                )}
              </div>

              {/* OVERLAYS */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                <div className={cn("w-1.5 h-1.5 rounded-full", p.active ? "bg-emerald-500 animate-pulse" : "bg-white/20")} />
                <span className="text-[10px] font-bold tracking-tight uppercase">{p.name} • {p.role}</span>
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 rounded-xl bg-black/60 hover:bg-white/10 transition-colors">
                  <Maximize2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- INTERACTIVE CONTROL BAR --- */}
        <div className="h-20 glass-panel rounded-3xl flex items-center justify-between px-8 bg-black/40">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <Activity className="w-4 h-4 text-primary" />
            LIVE LINK: WS-942-NEURAL
          </div>

          <div className="flex items-center gap-4">
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group">
              <Mic className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group">
              <Video className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 group">
              <Share2 className="w-5 h-5 text-white/60 group-hover:text-white" />
            </button>
            <button className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500 text-red-500 hover:text-white transition-all active:scale-95 neon-glow-purple">
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-white/10" />
            <button className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 group transition-all">
              <Settings className="w-4 h-4 text-muted-foreground group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: INTELLIGENCE PANEL (DETACHABLE) */}
      <div className="flex-[1] flex flex-col gap-6 max-h-full">
        {/* TABS */}
        <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5">
          {[
            { id: "transcript", label: "Neural Feed", icon: MessageSquare },
            { id: "pipeline", label: "Agent Trace", icon: Terminal },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === tab.id 
                  ? "bg-primary/20 text-foreground border border-primary/20 neon-glow-cyan" 
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === "transcript" ? (
              <motion.div 
                key="transcript"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <LiveTranscript />
              </motion.div>
            ) : (
              <motion.div 
                key="pipeline"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full"
              >
                <div className="flex flex-col gap-6 h-full overflow-y-auto hud-scrollbar pr-2 pb-8">
                  <AgentPipelineViewer activeStep={2} />
                  
                  <div className="p-6 glass-panel rounded-3xl space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary tracking-widest uppercase">
                      <BrainCircuit className="w-4 h-4" />
                      Neural Matching Matrix
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Context Accuracy", value: 94 },
                        { label: "Person Match Score", value: 82 },
                        { label: "Risk Mitigation", value: 99 },
                      ].map((item) => (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="text-white">{item.value}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.value}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-primary"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
