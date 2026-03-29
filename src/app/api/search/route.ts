/**
 * Tier 3: Cross-Meeting Context Search — WorkSync (WorkSyncAI)
 * 
 * Synthesizes cross-meeting knowledge from transcripts and task histories.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@/lib/core/neon";
import Groq from "groq-sdk";
import { logAgentDecision } from "@/lib/services/agentLog";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET(req: Request) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });

  // 1. Fetch user's company
  const users = await sql`SELECT "companyId" FROM "User" WHERE "clerkId" = ${clerkId} LIMIT 1`;
  if (users.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const companyId = users[0].companyId;

  // 2. Retrieve transcripts and task data
  const transcripts = await sql`
    SELECT id, title, transcript, "createdAt" 
    FROM "Meeting" 
    WHERE "companyId" = ${companyId} 
    ORDER BY "createdAt" DESC 
    LIMIT 5
  `;
  
  const tasks = await sql`
    SELECT t.title, t.description, t.status, u.name as owner
    FROM "Task" t
    JOIN "User" u ON t."ownerId" = u.id
    WHERE u."companyId" = ${companyId}
    ORDER BY t."createdAt" DESC
    LIMIT 10
  `;

  // 3. AI Synthesis (RAG Simulation)
  const start = Date.now();
  const context = `
    MEETINGS HISTORY:
    ${transcripts.map(m => `[${m.createdAt}] ${m.title}: ${m.transcript.substring(0, 1000)}`).join('\n\n')}
    
    TASKS HISTORY:
    ${tasks.map(t => `${t.title} (${t.status}) - Assigned to ${t.owner}`).join('\n')}
  `;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the WorkSync AI Knowledge Strategist. Use the provided meeting transcripts and task history to answer the user's cross-project query.
        
        Guidelines:
        - If the information isn't in the context, be honest.
        - provide specific dates and names where possible.
        - Summarize decisions and progress.
        
        Return ONLY valid JSON:
        {
          "answer": "...",
          "sources": [ { "type": "meeting", "title": "...", "date": "..." } ],
          "confidence": 0.9
        }`
      },
      {
        role: "user",
        content: `CONTEXT: ${context}\n\nQUERY: ${query}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content);
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Search Synthesis Agent",
    agentRole: "Synthesizes cross-meeting knowledge and task histories for strategic retrieval",
    input: query,
    output: content.substring(0, 2000),
    confidence: result.confidence || 0.8,
    reasoning: `Synthesized answer from ${transcripts.length} meetings and ${tasks.length} tasks matching query intent.`,
    durationMs
  });

  return NextResponse.json(result);
}
