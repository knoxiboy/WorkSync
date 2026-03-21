"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";

interface EvaluationResult {
  score: number;
  correctness: number;
  quality: number;
  completeness: number;
  issues: string[];
  suggestions: string[];
  verdict: 'completed' | 'needs_improvement';
}

export function PRSubmissionDialog({ taskId, taskTitle, ownerClerkId }: { taskId: string, taskTitle: string, ownerClerkId?: string }) {
  const { user } = useUser();
  const isOwner = user?.id === ownerClerkId || !ownerClerkId;
  const [repo, setRepo] = useState("");
  const [prNumber, setPrNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [open, setOpen] = useState(false);

  const handleEvaluate = async () => {
    if (!repo || !prNumber) return toast.error("Please provide repo (owner/repo) and PR number");

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, repo, prNumber: parseInt(prNumber) }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setResult(data);
      toast.success("Evaluation completed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate PR");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Dialog open={open} onOpenChange={isOwner ? setOpen : undefined}>
      <DialogTrigger render={
        <Button 
          variant={isOwner ? "outline" : "ghost"} 
          size="sm" 
          disabled={!isOwner}
          className={!isOwner ? "text-slate-400 cursor-not-allowed opacity-50" : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"}
          title={!isOwner ? "Only the assigned developer can submit a PR for evaluation." : ""}
        >
          {isOwner ? "Submit PR" : <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</div>}
        </Button>
      }>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluate PR - {taskTitle}</DialogTitle>
          <DialogDescription>
            Enter the details of the GitHub Pull Request for evaluation.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Repository (owner/repo)</label>
              <Input placeholder="rahul/my-app" value={repo} onChange={(e) => setRepo(e.target.value)} disabled={loading} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">PR Number</label>
              <Input type="number" placeholder="123" value={prNumber} onChange={(e) => setPrNumber(e.target.value)} disabled={loading} />
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-center py-6 border rounded-xl bg-slate-50 relative overflow-hidden">
               <div className="text-center z-10">
                 <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
                 <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">Total Score</div>
               </div>
               <div className={`absolute bottom-0 left-0 h-1 w-full ${getProgressColor(result.score)}`}></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1">
                 <div className="text-xs text-slate-500">Correctness</div>
                 <Progress value={result.correctness} className="h-1.5" />
               </div>
               <div className="space-y-1">
                 <div className="text-xs text-slate-500">Quality</div>
                 <Progress value={result.quality} className="h-1.5" />
               </div>
               <div className="space-y-1">
                 <div className="text-xs text-slate-500">Completeness</div>
                 <Progress value={result.completeness} className="h-1.5" />
               </div>
            </div>

            {result.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-700">Identified Issues</h4>
                <div className="flex flex-wrap gap-2">
                  {result.issues.map((issue, i) => (
                    <Badge key={i} variant="destructive" className="bg-red-50 text-red-700 border-red-200">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-blue-700">AI Suggestions</h4>
                <div className="flex flex-wrap gap-2">
                  {result.suggestions.map((suggestion, i) => (
                    <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className={`p-4 rounded-lg border flex items-center gap-3 ${result.verdict === 'completed' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-yellow-50 border-yellow-200 text-yellow-800'}`}>
               {result.verdict === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
               <span className="font-semibold">
                 {result.verdict === 'completed' ? 'Task Completed ✓' : 'Needs Improvement'}
               </span>
            </div>
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <Button onClick={handleEvaluate} disabled={loading} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Evaluating...</> : "Evaluate"}
            </Button>
          ) : (
            <Button onClick={() => setOpen(false)} className="w-full">Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
