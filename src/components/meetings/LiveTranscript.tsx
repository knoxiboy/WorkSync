"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  CheckCircle2, 
  User, 
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptRow {
  id: string;
  sender: string;
  text: string;
  time: string;
  isTask?: boolean;
}

const MOCK_STREAM = [
  { sender: "Divyanshu", text: "We need to finalize the auth service migration by Friday.", time: "10:12:01" },
  { sender: "AI Orchestrator", text: "Analyzing priority for auth migration...", time: "10:12:05" },
  { sender: "Ayush", text: "I'll take the lead on the frontend refactor.", time: "10:12:15", isTask: true },
  { sender: "Divyanshu", text: "Great, let's sync tomorrow at 10 AM.", time: "10:12:30" },
];

export function LiveTranscript() {
  const [entries, setEntries] = useState<TranscriptRow[]>([]);
  const [spawnedTask, setSpawnedTask] = useState<TranscriptRow | null>(null);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < MOCK_STREAM.length) {
        const newEntry = { ...MOCK_STREAM[i], id: Math.random().toString() };
        setEntries(prev => [...prev, newEntry]);
        
        if (newEntry.isTask) {
          setSpawnedTask(newEntry);
          setTimeout(() => setSpawnedTask(null), 3000);
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden relative">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-bold text-xs tracking-widest uppercase">Live Neural Transcript</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
          <span>LATENCY: 42ms</span>
          <span className="text-emerald-500">ENCRYPTED</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hud-scrollbar p-6 space-y-6">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              className="flex gap-4 group relative"
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/30 transition-colors">
                  <User className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                </div>
                <div className="w-px flex-1 bg-white/5 my-2" />
              </div>

              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{entry.sender}</span>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">{entry.time}</span>
                </div>
                
                <p className={cn(
                  "text-sm leading-relaxed transition-all duration-500",
                  entry.isTask ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {entry.text}
                </p>

                {entry.isTask && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 w-fit"
                  >
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Intent Identified: New Task</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- TASK BIRTH ANIMATION OVERLAY --- */}
      <AnimatePresence>
        {spawnedTask && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, x: 100, filter: "blur(20px)" }}
            className="absolute bottom-12 right-12 z-50 pointer-events-none"
          >
            <div className="p-1 rounded-2xl bg-linear-to-br from-primary via-secondary to-primary animate-shimmer overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.4)]">
              <div className="bg-black/90 backdrop-blur-3xl rounded-[15px] p-5 w-72">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center neon-glow-cyan">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Spawning Task</div>
                    <div className="text-xs font-bold text-white">Action Item Detected</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                      "{spawnedTask.text}"
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>DUE: FRIDAY</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <span>SYNCING</span>
                      <motion.span 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >•</motion.span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-end gap-2">
                  <ArrowRight className="w-4 h-4 text-primary animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">Listening for System Pulse...</span>
        </div>
      </div>
    </div>
  );
}
