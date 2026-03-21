import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { company: true },
    });

    if (!dbUser || !dbUser.companyId) {
      return NextResponse.json({ error: "User or company not found" }, { status: 404 });
    }

    const { transcript, roomId } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    // 1. Upsert Meeting record using roomId if provided, otherwise create new
    const meeting = await prisma.meeting.upsert({
      where: { id: roomId || "new-meeting" }, // Fallback for safety, though roomId should be there
      update: { transcript },
      create: {
        id: roomId,
        transcript,
        companyId: dbUser.companyId,
      },
    });

    // 2. Call GROQ to extract tasks
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
      // The prompt asks for an array, but response_format: 'json_object' might wrap it or GPT might produce a root object.
      // We'll handle both cases.
      const parsed = JSON.parse(content);
      extractedData = Array.isArray(parsed) ? parsed : (parsed.tasks || Object.values(parsed)[0]);
      
      if (!Array.isArray(extractedData)) {
          throw new Error("Invalid format from AI");
      }
    } catch (e) {
      console.error("AI Parse Error:", e, content);
      return NextResponse.json({ error: "Failed to parse AI response", raw: content }, { status: 500 });
    }

    // 3. Fetch all users in the company for fuzzy matching
    const companyUsers = await prisma.user.findMany({
      where: { companyId: dbUser.companyId },
    });

    // 4. Process and create tasks
    const createdTasks = [];
    for (const item of extractedData) {
      const { task, owner, deadline, priority } = item;
      
      // Fuzzy match owner
      const matchedUser = companyUsers.find((u: any) => 
        u.name.toLowerCase().includes(owner.toLowerCase())
      );

      const newTask = await prisma.task.create({
        data: {
          title: task,
          owner: owner,
          ownerId: matchedUser ? matchedUser.id : null,
          deadline: deadline,
          priority: priority || "medium",
          status: "todo",
          meetingId: meeting.id,
        },
      });
      createdTasks.push(newTask);
    }

    return NextResponse.json({ meetingId: meeting.id, tasks: createdTasks });
  } catch (error: any) {
    console.error("[MEETING_EXTRACT]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
