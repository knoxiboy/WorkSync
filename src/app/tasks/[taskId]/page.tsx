import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TaskSubmissionForm } from "@/components/TaskSubmissionForm";
import { TaskStatusControl } from "@/components/TaskStatusControl";
import { TaskTimeline } from "@/components/TaskTimeline";
import { SubmissionActions } from "@/components/SubmissionActions";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  GitPullRequest,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  Sparkles,
  Bot,
  Brain
} from "lucide-react";
import Link from "next/link";

export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { taskId } = await params;

  // 0. Fetch current user
  const curUsers = await sql`SELECT id, role FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`;
  const currentUser = curUsers[0] as any;

  // 1. Fetch Task, User, Submissions, and Blocker
  const tasks = await sql`
    SELECT t.*, 
           (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t."ownerId") as user,
           (SELECT row_to_json(m.*) FROM "Meeting" m WHERE m.id = t."meetingId") as meeting,
           (SELECT row_to_json(b.*) FROM "Task" b WHERE b.id = t."blockedById") as blocker
    FROM "Task" t
    WHERE t.id = ${taskId}
    LIMIT 1
  `;
  const task: any = tasks[0];

  if (!task) redirect("/dashboard");

  const submissions = await sql`
    SELECT * FROM "task_submissions"
    WHERE "taskId" = ${taskId}
    ORDER BY "createdAt" DESC
  `;

  // Fetch agent decision logs for this task
  let agentLogs: any[] = [];
  try {
    agentLogs = await sql`
      SELECT * FROM "agent_decision_log"
      WHERE "taskId" = ${taskId} OR "meetingId" = ${task.meetingId}
      ORDER BY "createdAt" ASC
    `;
  } catch { /* table may not exist yet */ }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'approved': return 'bg-green-500 hover:bg-green-600';
      case 'needs_improvement': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'submitted': return 'bg-blue-500 hover:bg-blue-600';
      case 'in_progress': return 'bg-indigo-500 hover:bg-indigo-600';
      case 'pending': return 'bg-slate-500 hover:bg-slate-600';
      default: return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-500/30">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest leading-none">Back to Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-indigo-100 bg-indigo-50/50 text-indigo-700 font-bold px-3 py-1">
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Task Title Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <Badge variant="outline" className="text-[10px] font-black tracking-widest bg-slate-100 border-none px-2 py-0.5">TASK ARCHIVE</Badge>
                 <span className="text-[10px] text-slate-400 font-mono">#{task.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">
                {task.title}
              </h1>
            </div>
            <div className="flex items-center gap-4">
               {task.blocker && (
                 <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10 px-4 py-2 font-bold tracking-wider uppercase text-xs">
                   Blocked By: {task.blocker.title}
                 </Badge>
               )}
               <TaskStatusControl taskId={task.id} currentStatus={task.status} />
               <Badge className={`${getStatusColor(task.status)} border-none px-6 py-2.5 text-xs font-black tracking-[0.2em] shadow-lg shadow-indigo-500/20`}>
                 {task.status.replace('_', ' ').toUpperCase()}
               </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Task Context/Description */}
            <Card className="border-none shadow-sm bg-white overflow-hidden group">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-500" /> Task Specification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-semibold text-lg">
                  {task.description || "Refer to the meeting intelligence for full specifications."}
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/50">
                      <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Owner</div>
                      <div className="text-sm font-black text-slate-900 flex items-center gap-2"><User className="w-3 h-3" /> {task.user?.name || task.owner}</div>
                   </div>
                   <div className="p-4 rounded-xl bg-orange-50/30 border border-orange-100/50">
                      <div className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1">Due Date</div>
                      <div className="text-sm font-black text-slate-900 flex items-center gap-2"><Calendar className="w-3 h-3" /> {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US') : 'ASAP'}</div>
                   </div>
                </div>
                
                {task.meeting && (
                  <Link href={`/meeting/${task.meetingId}`} className="block p-4 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group/meeting">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover/meeting:border-indigo-200 transition-all">
                          <History className="w-4 h-4 text-slate-400 group-hover/meeting:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 uppercase">View Meeting Context</div>
                          <div className="text-[10px] text-slate-400 font-medium">Trace back to the source transcript</div>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 rotate-180 text-slate-400 group-hover/meeting:translate-x-1 transition-all" />
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Submissions History & AI Feed */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
               <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History className="w-4 h-4" /> Final Evaluation Logic
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-6">
                {submissions.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Code className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Awaiting First Submission</p>
                  </div>
                ) : (
                  submissions.map((sub: any) => (
                     <div key={sub.id} className="p-4 sm:p-6 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl transition-all space-y-6 group/sub">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-sm ${sub.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                 {sub.score || '--'}
                              </div>
                              <div>
                                <div className="text-[10px] sm:text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                                  {sub.submissionType} Submission
                                  <Badge variant="outline" className={`px-2 py-0.5 text-[8px] sm:text-[9px] font-black uppercase border-none ${sub.evaluationStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                                     {sub.evaluationStatus}
                                  </Badge>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 sm:mt-1 uppercase flex items-center gap-2">
                                  {new Date(sub.createdAt).toLocaleString()}
                                  {sub.updatedAt && new Date(sub.updatedAt).getTime() > new Date(sub.createdAt).getTime() + 1000 && (
                                    <span className="text-indigo-500 font-black tracking-widest text-[8px] bg-indigo-50 px-1 rounded">EDITED</span>
                                  )}
                                </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <SubmissionActions 
                                 submissionId={sub.id} 
                                 initialUrl={sub.githubUrl} 
                                 initialNote={sub.submission_note || ""} 
                                 isOwner={sub.userId === currentUser.id}
                                 isManager={currentUser.role === 'MANAGER'}
                              />
                              <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                                 <ExternalLink className="w-3 h-3" /> OPEN IN GITHUB
                              </a>
                           </div>
                        </div>
                       
                       {/* Submission Note */}
                       {sub.submission_note && (
                        <div className="p-4 rounded-xl bg-orange-50/30 border border-orange-100/50 relative shadow-sm">
                           <div className="text-[10px] font-black uppercase text-orange-600 mb-1 flex items-center gap-1.5">
                              <User className="w-3 h-3" /> Developer Context
                           </div>
                           <p className="text-xs text-slate-700 italic leading-relaxed">"{sub.submission_note}"</p>
                        </div>
                       )}

                        {/* AI Technical Analysis */}
                        <div className="space-y-6">
                           <div className="text-sm font-medium text-slate-700 leading-relaxed bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative group/tech">
                              <div className="absolute -top-2.5 left-6 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1 group-hover/tech:scale-105 transition-transform">
                                <Sparkles className="w-2.5 h-2.5" /> Technical Analysis
                              </div>
                              <div className="whitespace-pre-wrap">
                                {sub.feedback || "AI analysis algorithm in progress..."}
                              </div>
                           </div>

                           {/* Manager Insight Card */}
                           {sub.manager_suggestion && (
                             <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden ring-1 ring-white/10">
                                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Manager's Key Insight
                                </div>
                                <div className="text-sm font-bold leading-relaxed relative z-10 italic">
                                   "{sub.manager_suggestion}"
                                </div>
                             </div>
                           )}
                           
                           {/* Issues and Suggestions - Side by Side on md+, Stacked on mobile */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {sub.issues && (
                              <div className="p-5 rounded-2xl bg-white border border-red-100 shadow-sm space-y-3">
                                 <div className="text-[10px] font-black text-red-500 uppercase tracking-[0.1em] flex items-center gap-2">
                                    <AlertCircle className="w-3 h-3" /> Gaps Identified
                                 </div>
                                 <ul className="space-y-3">
                                    {(typeof sub.issues === 'string' ? JSON.parse(sub.issues) : sub.issues).map((issue: string, i: number) => (
                                      <li key={i} className="text-[11px] font-bold text-slate-600 flex items-start gap-2.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1 flex-shrink-0" />
                                        {issue}
                                      </li>
                                    ))}
                                 </ul>
                              </div>
                             )}

                             {sub.suggestions && (
                               <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-3">
                                  <div className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.1em] flex items-center gap-2">
                                     <Zap className="w-3 h-3" /> Optimization Logic
                                  </div>
                                  <ul className="space-y-3">
                                     {(typeof sub.suggestions === 'string' ? JSON.parse(sub.suggestions) : sub.suggestions).map((sug: string, i: number) => (
                                       <li key={i} className="text-[11px] font-bold text-slate-600 flex items-start gap-2.5">
                                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 flex-shrink-0" />
                                         {sug}
                                       </li>
                                     ))}
                                  </ul>
                               </div>
                             )}
                           </div>
                        </div>
                     </div>
                  ))
                )}
               </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* Submission Area */}
            {task.status !== 'completed' && task.ownerId === (await sql`SELECT id FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`)[0]?.id && (
              <Card className="border-none shadow-2xl shadow-indigo-500/10 bg-white ring-1 ring-slate-200">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-indigo-500" /> Dispatch Submission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskSubmissionForm taskId={task.id} />
                </CardContent>
              </Card>
            )}

            {/* System Monitoring */}
            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
               <div className="p-6 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                       <div className="text-xs font-black uppercase tracking-wider">Gatekeeper Active</div>
                       <div className="text-[10px] text-slate-400 font-mono">Verifying mission alignment</div>
                    </div>
                 </div>

                 <TaskTimeline currentStatus={task.status} submissions={submissions} />
                 
                 <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">Sync Pipeline: Operational</span>
                    </div>
                    <Badge variant="outline" className="text-[8px] bg-white/5 border-white/10 text-slate-400">V1.0.4</Badge>
                 </div>
                   <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-widest leading-none">Status Level</span>
                       <Badge variant="outline" className="border-indigo-400/30 text-indigo-300 font-black">{task.status.toUpperCase()}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-400 font-bold uppercase tracking-widest leading-none">Visibility</span>
                       <span className="text-slate-200 font-bold">Public Space</span>
                    </div>
                 </div>
               </div>
            </Card>

            {/* AI Decision Trail */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold">
                  <Bot className="w-5 h-5 text-indigo-500" /> AI Decision Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentLogs.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 italic text-sm">
                    No agent decisions recorded yet for this task.
                  </div>
                ) : (
                  agentLogs.map((log: any) => (
                    <div key={log.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">{log.agentName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{log.durationMs}ms</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{log.reasoning}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-indigo-500 h-full" style={{ width: `${Math.round(log.confidence * 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600">{Math.round(log.confidence * 100)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
