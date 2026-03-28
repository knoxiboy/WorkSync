import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";
import { randomBytes } from "crypto";
import { runMeetingExtractionPipeline } from "@/lib/ai/agents";

const createId = () => randomBytes(12).toString('hex');

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUsers = await sql`
      SELECT u.*, row_to_json(c.*) as company
      FROM "User" u
      LEFT JOIN "Company" c ON u."companyId" = c.id
      WHERE u."clerkId" = ${userId}
      LIMIT 1
    `;
    const dbUser = dbUsers[0] as any;

    if (!dbUser || !dbUser.companyId) {
      return NextResponse.json({ error: "User or company not found" }, { status: 404 });
    }

    const { transcript, roomId } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const mId = roomId || createId();
    const meetings = await sql`
      INSERT INTO "Meeting" (id, transcript, "companyId", "createdAt")
      VALUES (${mId}, ${transcript}, ${dbUser.companyId}, NOW())
      ON CONFLICT (id) DO UPDATE SET transcript = EXCLUDED.transcript
      RETURNING *
    `;
    const meeting = meetings[0] as any;

    // Fetch team members for the orchestrator
    const companyUsers = await sql`SELECT * FROM "User" WHERE "companyId" = ${dbUser.companyId}`;
    const teamMembers = companyUsers.map((u: any) => u.name);

    // Run the multi-agent pipeline
    const pipelineResult = await runMeetingExtractionPipeline(
      transcript,
      teamMembers,
      meeting.id
    );

    // Store meeting summary
    try {
      await sql`
        UPDATE "Meeting" SET "summary" = ${pipelineResult.summary.summary} WHERE id = ${meeting.id}
      `;
    } catch {
      // summary column may not exist yet, that's ok
    }

    // Create tasks with pending_review status
    const createdTasks = [];
    for (const item of pipelineResult.tasks) {
      const { task: title, owner, deadline, priority, dependsOnTaskTitle } = item;
      
      const matchedUser = companyUsers.find((u: any) => 
        u.name.toLowerCase().includes(owner.toLowerCase())
      ) as any;

      // We store the original extracted item object on the DB record temporarily to use in the second pass
      const newTaskResults = await sql`
        INSERT INTO "Task" (id, title, owner, "ownerId", deadline, priority, status, "meetingId", "createdAt")
        VALUES (${createId()}, ${title}, ${owner}, ${matchedUser ? matchedUser.id : null}, ${deadline}, ${priority || "medium"}, 'pending_review', ${meeting.id}, NOW())
        RETURNING *
      `;
      const newTask = newTaskResults[0];
      (newTask as any).dependsOnTaskTitle = dependsOnTaskTitle;
      createdTasks.push(newTask);
    }

    // Second pass: link dependencies
    for (const t of createdTasks) {
      if ((t as any).dependsOnTaskTitle) {
        const blockerTask = createdTasks.find(bt => bt.title.toLowerCase() === (t as any).dependsOnTaskTitle.toLowerCase());
        if (blockerTask) {
          await sql`
            UPDATE "Task" SET "blockedById" = ${blockerTask.id} WHERE id = ${t.id}
          `;
          t.blockedById = blockerTask.id;
        }
      }
    }

    return NextResponse.json({ 
      meetingId: meeting.id, 
      tasks: createdTasks,
      summary: pipelineResult.summary,
      confidence: pipelineResult.overallConfidence,
      warnings: pipelineResult.warnings,
      retried: pipelineResult.retried,
      agentCount: 3
    });
  } catch (error: any) {
    console.error("[MEETING_EXTRACT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
