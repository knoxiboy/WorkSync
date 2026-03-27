import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/neon";
import Groq from "groq-sdk";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString('hex');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a task extraction assistant for a developer platform called WorkSyncAI. 
          Extract all actionable developer tasks from the meeting transcript. 
          
          Guidelines:
          - owner: Use only the first name of the person mentioned.
          - deadline: Provide a strict YYYY-MM-DD format based on context. 
            TODAY IS: Friday, March 20, 2026. 
            If someone says "by tomorrow", use 2026-03-21.
            If no deadline is implied, use null.
          - priority: "high" | "medium" | "low".
          
          Return ONLY a valid JSON object with a "tasks" key containing an array of objects.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    let extractedData;
    try {
      const parsed = JSON.parse(content);
      extractedData = Array.isArray(parsed) ? parsed : (parsed.tasks || Object.values(parsed)[0]);
      
      if (!Array.isArray(extractedData)) {
          throw new Error("Invalid format from AI");
      }
    } catch (e) {
      console.error("AI Parse Error:", e, content);
      return NextResponse.json({ error: "Failed to parse AI response", raw: content }, { status: 500 });
    }

    const companyUsers = await sql`SELECT * FROM "User" WHERE "companyId" = ${dbUser.companyId}`;

    const createdTasks = [];
    for (const item of extractedData) {
      const { task: title, owner, deadline, priority } = item;
      
      const matchedUser = companyUsers.find((u: any) => 
        u.name.toLowerCase().includes(owner.toLowerCase())
      ) as any;

      const newTaskResults = await sql`
        INSERT INTO "Task" (id, title, owner, "ownerId", deadline, priority, status, "meetingId", "createdAt")
        VALUES (${createId()}, ${title}, ${owner}, ${matchedUser ? matchedUser.id : null}, ${deadline}, ${priority || "medium"}, 'todo', ${meeting.id}, NOW())
        RETURNING *
      `;
      createdTasks.push(newTaskResults[0]);
    }

    return NextResponse.json({ meetingId: meeting.id, tasks: createdTasks });
  } catch (error: any) {
    console.error("[MEETING_EXTRACT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
