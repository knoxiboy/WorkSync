import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sql } from "@/lib/neon";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TaskSubmissionForm } from "@/components/TaskSubmissionForm";
import { TaskStatusControl } from "@/components/TaskStatusControl";
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
  Play
} from "lucide-react";
import Link from "next/link";

export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const { taskId } = await params;

  // 1. Fetch Task, User, and Submissions
  const tasks = await sql`
    SELECT t.*, 
           (SELECT row_to_json(u.*) FROM "User" u WHERE u.id = t."ownerId") as user,
           (SELECT row_to_json(m.*) FROM "Meeting" m WHERE m.id = t."meetingId") as meeting
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
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 group">
                {task.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 font-medium text-sm">
                <div className="flex items-center gap-1.5"><User className="w-4 h-4" /> {task.user?.name || task.owner}</div>
                <div className="flex items-center gap-1.5 text-indigo-600/80"><Calendar className="w-4 h-4" /> Due: {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US') : 'No Deadline'}</div>
                <div className="flex items-center gap-1.5 text-slate-400 capitalize"><Code className="w-4 h-4" /> ID: {task.id.slice(0, 8)}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <TaskStatusControl taskId={task.id} currentStatus={task.status} />
               <Badge className={`${getStatusColor(task.status)} border-none px-6 py-2 text-sm font-black tracking-[0.2em] shadow-lg shadow-indigo-500/20`}>
                 {task.status.replace('_', ' ').toUpperCase()}
               </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Task Context/Description */}
            <Card className="border-none shadow-sm bg-white overflow-hidden group">
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" /> Task Specification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed font-medium">
                  {task.description || "Refer to the meeting intelligence for full specifications."}
                </div>
                
                {task.meeting && (
                  <Link href={`/meeting/${task.meetingId}`} className="block p-4 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group/meeting">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover/meeting:border-indigo-200 group-hover/meeting:shadow-sm">
                          <History className="w-5 h-5 text-slate-400 group-hover/meeting:text-indigo-500 transition-colors" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">Meeting Context</div>
                          <div className="text-xs text-slate-500">View origin meeting & transcript</div>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 rotate-180 text-slate-400 group-hover/meeting:translate-x-1 transition-all" />
                    </div>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Submission Area */}
            {task.status !== 'completed' && task.ownerId === (await sql`SELECT id FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`)[0]?.id && (
              <Card className="border-none shadow-xl shadow-indigo-500/5 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <GitPullRequest className="w-24 h-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5 text-indigo-500" /> GitHub Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TaskSubmissionForm taskId={task.id} />
                </CardContent>
              </Card>
            )}

            {/* Submissions History */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-400" /> Evaluation History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic text-sm">No submissions recorded for this task.</div>
                ) : (
                  submissions.map((sub: any) => (
                    <div key={sub.id} className="p-6 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-6">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${sub.score >= 80 ? 'bg-green-100 text-green-700' : sub.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {sub.score || '--'}
                             </div>
                             <div>
                               <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                 {sub.submissionType.toUpperCase()} SUBMISSION
                                 <Badge variant="outline" className={sub.evaluationStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}>
                                    {sub.evaluationStatus.replace('_', ' ').toUpperCase()}
                                 </Badge>
                               </div>
                               <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono">{new Date(sub.createdAt).toLocaleString()}</div>
                             </div>
                          </div>
                          <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                             <ExternalLink className="w-4 h-4" />
                          </a>
                       </div>
                       
                       {/* AI Feedback */}
                       <div className="space-y-4">
                          <div className="text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100 italic shadow-sm">
                             "{sub.feedback || "AI is distilling the results..."}"
                          </div>
                          
                          {sub.issues && (
                            <div className="space-y-2 text-xs">
                               <div className="font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> System Identified Issues</div>
                               <div className="flex flex-wrap gap-2">
                                  {JSON.parse(sub.issues).map((issue: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-100 py-1">{issue}</Badge>
                                  ))}
                               </div>
                            </div>
                          )}

                          {sub.suggestions && (
                            <div className="space-y-2 text-xs">
                               <div className="font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3" /> High-impact Improvements</div>
                               <div className="flex flex-wrap gap-2">
                                  {JSON.parse(sub.suggestions).map((sug: string, i: number) => (
                                    <Badge key={i} variant="outline" className="bg-white text-indigo-600 border-indigo-100 py-1">{sug}</Badge>
                                  ))}
                               </div>
                            </div>
                          )}
                          
                          {sub.score && (
                            <div className="space-y-1.5">
                               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  <span>Confidence in Completion</span>
                                  <span>{Math.round(sub.completionConfidence * 100)}%</span>
                               </div>
                               <Progress value={sub.completionConfidence * 100} className="h-1.5" />
                            </div>
                          )}
                       </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            {/* System Context Card */}
            <Card className="border-none shadow-sm bg-slate-900 text-white selection:bg-indigo-500">
               <CardHeader>
                 <CardTitle className="text-lg flex items-center gap-2 font-bold">
                   <ShieldCheck className="w-5 h-5 text-indigo-400" /> Performance Loop
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-6">
                 <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium capitalize">
                       This task is monitored by the ANTIGRAVITY execution engine. Submissions are automatically judged for technical accuracy and project goal alignment.
                    </p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">System Monitoring Active</span>
                    </div>
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
               </CardContent>
            </Card>

            {/* Timeline/Activity placeholder */}
            <div className="p-6 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
               <History className="w-8 h-8 text-slate-300" />
               <div>
                  <div className="text-sm font-bold text-slate-900">Task Timeline</div>
                  <div className="text-xs text-slate-500">Activity logging coming in Phase 7</div>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
