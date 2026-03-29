"use client";

import React, { useState, useEffect } from "react";
import { 
  Command, 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command";
import { 
  Search, 
  LayoutDashboard, 
  Mic2, 
  CheckSquare, 
  GitPullRequest, 
  Users, 
  Settings,
  Brain,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";

export function GlobalCommandHUD() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-3xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-lg bg-primary/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase">Neural Intel Interface v3.0</span>
          </div>
          <CommandInput placeholder="Type a command or search neural nexus..." className="h-12 text-sm border-none bg-transparent" />
        </div>
        
        <CommandList className="max-h-[400px] hud-scrollbar bg-black/40 backdrop-blur-3xl p-2">
          <CommandEmpty className="py-6 text-center text-xs text-muted-foreground uppercase font-bold tracking-widest opacity-20">
            No results found in current context matrix.
          </CommandEmpty>
          
          <CommandGroup heading="Core Modules" className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/30 px-3 py-2">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold">Go to Command Deck</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                G D
              </kbd>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/meetings/live"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <Mic2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold">Initiate Live Session</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                G L
              </kbd>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-white/5 my-2" />

          <CommandGroup heading="Neural Intelligence" className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/30 px-3 py-2">
            <CommandItem onSelect={() => runCommand(() => console.log("AI Search"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">Analyze Productivity Entropy</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => console.log("Risk Analysis"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <Search className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold">Audit Hazard Matrix</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="bg-white/5 my-2" />

          <CommandGroup heading="Personnel & Ops" className="text-[9px] uppercase tracking-widest font-black text-muted-foreground/30 px-3 py-2">
            <CommandItem onSelect={() => runCommand(() => router.push("/tasks"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">Task Synchronization</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/team"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold">Team Nexus Members</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))} className="rounded-xl flex gap-3 p-3 transition-all hover:bg-primary/10">
              <Settings className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold">System Configuration</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        
        <div className="p-4 border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-muted-foreground/30">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-white/5">↑↓</kbd> Navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-white/5">↵</kbd> Select</span>
          </div>
          <span className="text-primary italic">WorkSync AI Nexus Suite</span>
        </div>
      </CommandDialog>
    </>
  );
}
