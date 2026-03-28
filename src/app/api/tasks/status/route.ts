import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";

export async function PATCH(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

    const { taskId, status } = await req.json();

    if (!taskId || !status) {
      return new NextResponse("Missing taskId or status", { status: 400 });
    }

    // 1. Fetch user and task
    const users = await sql`SELECT * FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`;
    const user = users[0] as any;
    if (!user) return new NextResponse("User not found", { status: 404 });

    const tasks = await sql`SELECT * FROM "Task" WHERE id = ${taskId} LIMIT 1`;
    const task = tasks[0] as any;
    if (!task) return new NextResponse("Task not found", { status: 404 });

    // 2. Validate Ownership
    if (task.ownerId !== user.id && user.role !== 'MANAGER') {
      return new NextResponse("Access Denied", { status: 403 });
    }

    // 3. Update Status
    await sql`
      UPDATE "Task" SET status = ${status} WHERE id = ${taskId}
    `;

    return NextResponse.json({ message: "Status updated", status });
  } catch (error: any) {
    console.error("[TASK_STATUS_UPDATE]", error);
    return new NextResponse(error.message || "Internal Error", { status: 500 });
  }
}
