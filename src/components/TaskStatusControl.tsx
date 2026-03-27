"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

export function TaskStatusControl({ taskId, currentStatus }: { taskId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStartWorking = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: "in_progress" }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success("Task is now in progress!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error starting task");
    } finally {
      setLoading(false);
    }
  };

  if (currentStatus !== 'todo' && currentStatus !== 'pending') return null;

  return (
    <Button 
      onClick={handleStartWorking} 
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 rounded-2xl px-8 h-12 font-black tracking-widest uppercase text-xs group transition-all"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 fill-current group-hover:scale-110 transition-transform" />}
      Start Execution
    </Button>
  );
}
