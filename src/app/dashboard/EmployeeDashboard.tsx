"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRSubmissionDialog } from "@/components/PRSubmissionDialog";

export function EmployeeDashboard({ user, tasks }: { user: any, tasks: any[] }) {
  const todo = tasks.filter(t => t.status === "todo");
  const inProgress = tasks.filter(t => t.status === "in_progress");
  const done = tasks.filter(t => t.status === "completed");

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-2">
        <div className="font-medium">{task.title}</div>
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline">{task.priority}</Badge>
          {task.deadline && (
            <span className="text-slate-500">Due: {new Date(task.deadline).toLocaleDateString('en-US')}</span>
          )}
        </div>
        {task.status !== "completed" && (
          <div className="pt-2">
            <PRSubmissionDialog taskId={task.id} taskTitle={task.title} ownerClerkId={task.user?.clerkId} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-100 p-4 rounded-xl">
          <h2 className="font-semibold mb-4 text-slate-700 flex items-center justify-between">
            To Do <Badge variant="secondary">{todo.length}</Badge>
          </h2>
          {todo.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
        
        <div className="bg-slate-100 p-4 rounded-xl">
          <h2 className="font-semibold mb-4 text-blue-700 flex items-center justify-between">
            In Progress <Badge variant="secondary">{inProgress.length}</Badge>
          </h2>
          {inProgress.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
        
        <div className="bg-slate-100 p-4 rounded-xl">
          <h2 className="font-semibold mb-4 text-green-700 flex items-center justify-between">
            Done <Badge variant="secondary">{done.length}</Badge>
          </h2>
          {done.map(t => <TaskCard key={t.id} task={t} />)}
        </div>
      </div>
    </div>
  );
}
