/**
 * Tier 3: Global AI Search — WorkSync (WorkSyncAI)
 * 
 * RAG-style search across meeting transcripts and task histories.
 */

"use client";

import { useState } from "react";
import { 
  Search, 
  Loader2, 
  Sparkles, 
  X, 
  ChevronRight,
  MessageSquare,
  FileText
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        nativeButton={false}
        render={
          <div className="relative group cursor-pointer">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="w-full md:w-80 bg-slate-100 border-none rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-slate-500 flex items-center justify-between group-hover:bg-indigo-50 transition-all">
               <span>Search across meetings...</span>
               <Badge variant="outline" className="text-[8px] bg-white border-none shadow-sm">AI POWERED</Badge>
            </div>
          </div>
        }
      />
      
      <DialogContent className="max-w-2xl bg-white border-none shadow-2xl p-0 overflow-hidden sm:rounded-3xl">
        <form onSubmit={handleSearch} className="p-6 border-b border-slate-100">
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
             <Input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything (e.g., 'What was decided about the auth refactor?')"
                className="pl-12 h-14 bg-slate-50 border-none text-base font-medium rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/20 shadow-inner"
             />
             <Button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold gap-2 shadow-lg shadow-indigo-600/20"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Sync-Search
             </Button>
          </div>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
               <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
               </div>
               <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Consulting the Knowledge Loop...</div>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-3">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AI Synthesized Intelligence</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800 leading-relaxed p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100 relative">
                     <div className="absolute top-4 right-4 text-[10px] font-black text-indigo-400 bg-white px-2 py-0.5 rounded shadow-sm border border-indigo-50">CONFIDENCE: {Math.round(result.confidence * 100)}%</div>
                     {result.answer}
                  </div>
               </div>

               {result.sources?.length > 0 && (
                 <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Verifiable Sources</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {result.sources.map((src: any, i: number) => (
                         <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 group cursor-default hover:bg-white hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                               {src.type === 'meeting' ? <MessageSquare className="w-4 h-4 text-slate-400" /> : <FileText className="w-4 h-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="text-xs font-bold text-slate-900 truncate">{src.title}</div>
                               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{src.date}</div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          )}

          {!result && !loading && (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
               <Search className="w-12 h-12 mb-4" />
               <p className="text-sm font-bold uppercase tracking-widest">Awaiting Knowledge Request</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
