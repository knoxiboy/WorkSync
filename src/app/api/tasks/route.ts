// NEW: src/app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString('hex');

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, ownerId, deadline, priority, meetingId } = await req.json();

    if (!title || !ownerId) {
      return NextResponse.json({ error: "Title and owner are required" }, { status: 400 });
    }

    const matchedUsers = await sql`SELECT * FROM "User" WHERE id = ${ownerId} LIMIT 1`;
    const matchedUser = matchedUsers[0] as any;

    // Ensure the meeting record exists before linking the task
    if (meetingId) {
      const dbUsers = await sql`SELECT * FROM "User" WHERE "clerkId" = ${userId} LIMIT 1`;
      const dbUser = dbUsers[0] as any;

      if (!dbUser || !dbUser.companyId) {
        return NextResponse.json({ error: "User or company not found" }, { status: 404 });
      }

      await sql`
        INSERT INTO "Meeting" (id, transcript, "companyId", "createdAt")
        VALUES (${meetingId}, '', ${dbUser.companyId}, NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }

    const newTasks = await sql`
      INSERT INTO "Task" (id, title, owner, "ownerId", deadline, priority, status, "meetingId", "createdAt")
      VALUES (${createId()}, ${title}, ${matchedUser?.name || "Unknown"}, ${ownerId}, ${deadline}, ${priority || "medium"}, 'todo', ${meetingId}, NOW())
      RETURNING *
    `;
    const task = newTasks[0];

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASK_CREATE]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
