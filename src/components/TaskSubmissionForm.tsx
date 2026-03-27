"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export function TaskSubmissionForm({ taskId }: { taskId: string }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return toast.error("Please enter a GitHub URL");

    setLoading(true);
    try {
      const res = await fetch("/api/tasks/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, githubUrl: url }),
      });

      if (!res.ok) {
         const errorText = await res.text();
         throw new Error(errorText || "Submission failed");
      }

      const data = await res.json();
      toast.success(data.message || "Work submitted successfully!");
      setUrl("");
      router.refresh(); // Refresh the page to show new submission
    } catch (err: any) {
      toast.error(err.message || "Failed to submit work");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-slate-400">GitHub Link (PR, Commit, or Repo)</label>
        <div className="flex gap-2">
          <Input 
            type="url" 
            placeholder="https://github.com/owner/repo/pull/123" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
          />
          <Button 
            type="submit" 
            disabled={loading || !url}
            className="bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 rounded-xl px-6 group"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <div className="flex items-center gap-2">
                <span>Submit</span>
                <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            )}
          </Button>
        </div>
        <p className="text-[10px] text-slate-400">
           Submit a Pull Request for the most accurate AI evaluation.
        </p>
      </div>
    </form>
  );
}
