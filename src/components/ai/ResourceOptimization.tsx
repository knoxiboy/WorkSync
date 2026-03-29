/**
 * Tier 3: Resource Optimization — WorkSync (WorkSyncAI)
 * 
 * Interactive component to predict task-to-talent fitment and flag skill gaps.
 */

"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  Target, 
  AlertCircle,
  Zap,
  TrendingDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface OptimizationResult {
  matchScore: number;
  recommendation: string;
  skillGaps: string[];
  capacityRisk: "low" | "medium" | "high";
  reasoning: string;
}

export function ResourceOptimization({ taskId }: { taskId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/optimize`, { method: 'POST' });
      if (!res.ok) throw new Error("Optimization analysis failed");
      const data = await res.json();
      setResult(data);
      toast.success("AI-driven assignment audit complete.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`border-none shadow-sm transition-all duration-500 overflow-hidden ${result ? 'bg-slate-900 text-white border border-white/5' : 'bg-white text-slate-900 border border-slate-100'}`}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${result ? 'text-indigo-400' : 'text-slate-400'}`}>
          <ShieldCheck className="w-4 h-4" /> Talent Selection Loop
        </CardTitle>
        {!result && (
          <Button 
            size="sm" 
            onClick={handleOptimize} 
            disabled={loading}
            className="h-7 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-[9px] uppercase tracking-widest px-4 border border-white/10"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <TrendingDown className="w-3 h-3 mr-2" />}
            Analyze Fit
          </Button>
        )}
      </CardHeader>
      
      {result && (
        <CardContent className="pt-0 space-y-6">
          <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl font-black text-indigo-400 mb-1 z-10">{Math.round(result.matchScore * 100)}%</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest z-10">Match Precision</div>
          </div>

          <div className="space-y-4">
             <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 italic text-sm font-semibold text-indigo-100 leading-relaxed shadow-lg">
                "{result.recommendation}"
             </div>

             {result.skillGaps.length > 0 && (
                <div className="space-y-2">
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                      <Zap className="w-3 h-3 text-indigo-400" /> Skill Gaps Identified
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {result.skillGaps.map((skill, index) => (
                         <Badge key={index} variant="outline" className="bg-white/5 border-white/10 text-slate-300 font-bold text-[9px] uppercase py-0.5">
                            {skill}
                         </Badge>
                      ))}
                   </div>
                </div>
             )}

             <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                   <AlertCircle className={`w-3.5 h-3.5 ${result.capacityRisk === 'high' ? 'text-red-400 animate-pulse transition-all' : 'text-green-400'}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Risk Assessment</span>
                </div>
                <Badge className={`text-[9px] font-bold border-none ${
                    result.capacityRisk === 'high' ? 'bg-red-500 text-white' : 
                    result.capacityRisk === 'medium' ? 'bg-orange-500 text-white' : 
                    'bg-green-500 text-white'
                }`}>
                    {result.capacityRisk.toUpperCase()} RISK
                </Badge>
             </div>
          </div>
        </CardContent>
      )}

      {!result && !loading && (
        <CardContent className="pt-0 pb-4 text-center">
          <p className="text-[10px] text-slate-400 font-medium italic">
            Predict executor compatibility and capacity bottlenecks using AI.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
