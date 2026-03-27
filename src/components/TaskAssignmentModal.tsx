"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Calendar, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useRemoteParticipants, useLocalParticipant } from "@livekit/components-react";

interface User {
  id: string;
  name: string;
  clerkId: string;
}

interface TaskAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
}

export function TaskAssignmentModal({ isOpen, onClose, meetingId }: TaskAssignmentModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    ownerId: "",
    deadline: "",
    priority: "medium",
  });

  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const resp = await fetch("/api/company/users");
      const data = await resp.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      toast.error("Failed to load company users");
    } finally {
      setFetchingUsers(false);
    }
  };

  // Filter users to only those currently in the meeting
  const activeIdentities = [
    localParticipant?.identity,
    ...remoteParticipants.map(p => p.identity)
  ].filter(Boolean);

  const activeUsers = users.filter(u => activeIdentities.includes(u.clerkId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.ownerId) {
      toast.error("Please fill in the task and assignee");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, meetingId }),
      });

      if (resp.ok) {
        toast.success("Task assigned successfully!");
        onClose();
        setFormData({ title: "", ownerId: "", deadline: "", priority: "medium" });
      } else {
        toast.error("Failed to assign task");
      }
    } catch (e) {
      toast.error("Error creating task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900/90 backdrop-blur-2xl border-white/10 text-white rounded-3xl shadow-2xl overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            Assign New Task
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Directly delegate a task to a team member during the session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Assign To</label>
            <div className="relative">
              <select
                value={formData.ownerId}
                onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all"
                disabled={fetchingUsers}
              >
                <option value="" disabled className="bg-slate-900">Select Employee...</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900">
                    {u.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                {fetchingUsers ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3 rotate-45" />}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Task Description</label>
            <Input
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="h-11 bg-white/5 border-white/10 rounded-xl px-4 text-sm focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Deadline</label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="h-11 bg-white/5 border-white/10 rounded-xl px-4 text-sm focus:ring-indigo-500/50 [color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none transition-all bg-no-repeat bg-[right_1rem_center]"
              >
                <option value="low" className="bg-slate-900">Low</option>
                <option value="medium" className="bg-slate-900">Medium</option>
                <option value="high" className="bg-slate-900">High</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4 gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 h-12 rounded-2xl border-white/5 text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 group relative overflow-hidden transition-all active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assign Task</span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
