// NEW: src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, ownerId, deadline, priority, meetingId } = await req.json();

    if (!title || !ownerId) {
      return NextResponse.json({ error: "Title and owner are required" }, { status: 400 });
    }

    const matchedUser = await prisma.user.findUnique({ where: { id: ownerId } });

    // Ensure the meeting record exists before linking the task
    if (meetingId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      if (!dbUser || !dbUser.companyId) {
        return NextResponse.json({ error: "User or company not found" }, { status: 404 });
      }

      await prisma.meeting.upsert({
        where: { id: meetingId },
        update: {}, 
        create: {
          id: meetingId,
          transcript: "",
          companyId: dbUser.companyId,
        },
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        owner: matchedUser?.name || "Unknown",
        ownerId,
        deadline,
        priority: priority || "medium",
        status: "todo",
        meetingId
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_CREATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
