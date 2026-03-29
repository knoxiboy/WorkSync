"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Mic2, 
  CheckSquare, 
  GitPullRequest, 
  Users, 
  Settings,
  Terminal,
  Activity,
  ChevronRight,
  ChevronLeft,
  Command as CommandIcon,
  Bell,
  Search
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ href, icon: Icon, label, active }: NavItemProps) => (
  <Link href={href}>
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300",
        active 
          ? "bg-primary/20 text-primary border border-primary/20 neon-glow-cyan" 
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="text-sm font-medium tracking-wide">{label}</span>
      {active && (
        <motion.div 
          layoutId="activeNav"
          className="ml-auto w-1 h-1 rounded-full bg-primary"
        />
      )}
    </motion.div>
  </Link>
);

export function MissionControlShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [systemState, setSystemState] = useState<"idle" | "processing" | "alert">("idle");

  // Mock system state changes
  useEffect(() => {
    if (pathname?.includes("meeting")) setSystemState("processing");
    else setSystemState("idle");
  }, [pathname]);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-primary/30">
      {/* --- LEFT PANEL: CONTEXT NAVIGATION --- */}
      <aside className="w-64 flex flex-col glass-border bg-black/20 backdrop-blur-xl z-50">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-secondary flex items-center justify-center neon-glow-cyan">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">WorkSync</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Mission Control</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 custom-scrollbar overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold px-3 mb-4">Core Systems</div>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Command Deck" active={pathname === "/dashboard"} />
          <NavItem href="/meetings/live" icon={Mic2} label="Live Intel" active={pathname?.includes("/meeting")} />
          <NavItem href="/tasks" icon={CheckSquare} label="Task Ops" active={pathname === "/tasks"} />
          <NavItem href="/pull-requests" icon={GitPullRequest} label="Code Review" active={pathname === "/pull-requests"} />
          
          <div className="pt-8 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold px-3 mb-4">Personnel</div>
          <NavItem href="/team" icon={Users} label="Team Nexus" active={pathname === "/team"} />
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 bg-white/2">
          <NavItem href="/settings" icon={Settings} label="System Config" active={pathname === "/settings"} />
          <div className="mt-4 flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-lg" } }} />
            <div className="flex flex-col ml-3 flex-1 overflow-hidden">
              <span className="text-xs font-medium truncate">System Admin</span>
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full animate-pulse",
                  systemState === "idle" ? "bg-green-500" : "bg-primary"
                )} />
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {systemState === "idle" ? "Online" : "Processing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- CENTER: ACTIVE WORKSPACE --- */}
      <main className="flex-1 relative flex flex-col min-w-0 bg-[#080808]">
        {/* TOP BAR: GLOBAL COMMAND HUD */}
        <header className="h-16 flex items-center justify-between px-8 glass-border border-l-0 border-r-0 bg-black/10 backdrop-blur-md z-40">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-muted-foreground hover:text-foreground cursor-pointer transition-all group">
              <CommandIcon className="w-4 h-4" />
              <span className="text-xs font-semibold tracking-wide">Command Intel</span>
              <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono">⌘K</kbd>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-foreground font-bold">82%</span>
                <span>System Load</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search global nexus..." 
                className="bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 w-64 transition-all"
              />
            </div>
            
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-all group">
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 neon-glow-purple" />
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto hud-scrollbar relative p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* --- RIGHT PANEL: AI ACTIVITY STREAM --- */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="glass-border bg-black/20 backdrop-blur-xl z-50 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm tracking-tight">Activity Nexus</span>
              </div>
              <button 
                onClick={() => setIsRightPanelOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto hud-scrollbar p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">Live Agents</span>
                  <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] text-primary font-bold animate-pulse">Running</div>
                </div>
                
                {[
                  { agent: "Contextual Cleaner", status: "Parsing...", model: "Llama 3.1 8B", time: "2m ago" },
                  { agent: "Insight Architect", status: "Idle", model: "Llama 3.3 70B", time: "10m ago" },
                  { agent: "Risk Predictor", status: "Alerting", model: "Llama 3.3 70B", time: "Just now", critical: true },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "p-3 rounded-xl border transition-all",
                    item.critical ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/5"
                  )}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-foreground">{item.agent}</span>
                      <span className="text-[10px] text-muted-foreground">{item.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1.5 h-1.5 rounded-full", item.critical ? "bg-red-500" : "bg-primary")} />
                        <span className="text-[10px] font-medium text-muted-foreground">{item.status}</span>
                      </div>
                      <span className="text-[9px] font-mono text-muted-foreground/50">{item.model}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold block mb-4">Neural Logs</span>
                <div className="space-y-3 font-mono text-[10px]">
                  {[
                    "[09:42:12] Agent:Matcher identified 'frontend-fix'...",
                    "[09:42:15] confidence_score generated: 0.942",
                    "[09:43:01] task_birth animation triggered...",
                    "[09:43:05] validation_loop success."
                  ].map((log, i) => (
                    <div key={i} className="text-muted-foreground flex gap-2">
                      <span className="text-primary/50 shrink-0">›</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!isRightPanelOpen && (
        <button 
          onClick={() => setIsRightPanelOpen(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-l-xl bg-white/5 border border-r-0 border-white/10 text-muted-foreground hover:text-foreground transition-all z-50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
