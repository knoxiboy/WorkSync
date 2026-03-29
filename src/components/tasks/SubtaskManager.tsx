/**
 * Tier 3: Sub-task Manager — WorkSync (WorkSyncAI)
 * 
 * Interactive component to decompose a task and manage sub-tasks with AI guidance.
 */

"use client";

import { useState } from "react";
import { 
  Zap, 
  Loader2, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  LayoutList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SubTask {
  title: string;
  description: string;
  estimatedHours: number;
  priority: "high" | "medium" | "low";
}

export function SubtaskManager({ taskId, initialSubtasks = [] }: { taskId: string, initialSubtasks?: SubTask[] }) {
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>(initialSubtasks);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDecompose = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/decompose`, { method: 'POST' });
      if (!res.ok) throw new Error("Decomposition failed");
      const data = await res.json();
      setSubtasks(data.subtasks);
      setIsExpanded(true);
      toast.success("AI generated a refined execution roadmap!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm bg-indigo-50/10 border border-indigo-500/10 overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 flex items-center gap-2">
          <LayoutList className="w-4 h-4" /> Atomic Decomposition
        </CardTitle>
        {subtasks.length === 0 ? (
          <Button 
            size="sm" 
            onClick={handleDecompose} 
            disabled={loading}
            className="h-7 bg-indigo-600 hover:bg-indigo-500 rounded-full font-bold text-[9px] uppercase tracking-widest px-4"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Zap className="w-3 h-3 mr-2 fill-current" />}
            Generate Sub-tasks
          </Button>
        ) : (
          <Badge variant="outline" className="bg-indigo-500 text-white border-none font-bold text-[9px]">
            {subtasks.length} SUB-UNITS
          </Badge>
        )}
      </CardHeader>
      
      {subtasks.length > 0 && (
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-2">
            {subtasks.map((st, i) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm flex items-start justify-between gap-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-800">{st.title}</span>
                    <Badge variant="outline" className={`text-[8px] font-black px-1.5 h-4 border-none ${
                        st.priority === 'high' ? 'bg-red-500 text-white' : 
                        st.priority === 'medium' ? 'bg-indigo-100 text-indigo-600' : 
                        'bg-slate-100 text-slate-500'
                    }`}>
                        {st.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{st.description}</p>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap pt-1">
                   <Clock className="w-3 h-3 text-slate-300" />
                   <span className="text-[10px] font-bold text-slate-400">{st.estimatedHours}h</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t border-indigo-100/50 flex items-center justify-between">
            <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Total Estimated Effort</span>
            <span className="text-xs font-black text-indigo-600">{subtasks.reduce((acc, curr) => acc + curr.estimatedHours, 0)} Hours</span>
          </div>
        </CardContent>
      )}

      {subtasks.length === 0 && !loading && (
        <CardContent className="pt-0 pb-4 text-center">
          <p className="text-[10px] text-slate-400 font-medium italic">
            Automate sub-task creation to increase execution precision.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
