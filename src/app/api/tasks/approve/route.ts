import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskIds, action } = await req.json();

    if (!taskIds || !Array.isArray(taskIds) || !action) {
      return new NextResponse("Missing taskIds or action", { status: 400 });
    }

    // Verify user is a manager
    const users = await sql`SELECT * FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`;
    const user = users[0] as any;
    if (!user || user.role !== "MANAGER") {
      return new NextResponse("Only managers can approve tasks", { status: 403 });
    }

    if (action === "approve") {
      for (const taskId of taskIds) {
        await sql`
          UPDATE "Task" SET status = 'todo' WHERE id = ${taskId} AND status = 'pending_review'
        `;
      }
      return NextResponse.json({ message: `${taskIds.length} tasks approved`, count: taskIds.length });
    } else if (action === "reject") {
      for (const taskId of taskIds) {
        await sql`DELETE FROM "Task" WHERE id = ${taskId} AND status = 'pending_review'`;
      }
      return NextResponse.json({ message: `${taskIds.length} tasks rejected`, count: taskIds.length });
    }

    return new NextResponse("Invalid action. Use 'approve' or 'reject'.", { status: 400 });
  } catch (error: any) {
    console.error("[TASK_APPROVE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
