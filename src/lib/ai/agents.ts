/**
 * Multi-Agent Pipeline — WorkSync (WorkSyncAI)
 * 
 * Agent 1: Transcript Analyzer — cleans & structures raw transcript
 * Agent 2: Task Orchestrator — extracts actionable tasks
 * Agent 3: Validation Agent — cross-checks and verifies tasks
 */

import Groq from "groq-sdk";
import { logAgentDecision } from "../services/agentLog";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ────────────────────────────────────────
// Agent 1: Transcript Analyzer
// ────────────────────────────────────────
export interface MeetingSummary {
  speakers: string[];
  topics: string[];
  keyDecisions: string[];
  actionItems: string[];
  summary: string;
}

async function runTranscriptAnalyzer(
  transcript: string,
  meetingId: string
): Promise<MeetingSummary> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Transcript Analyzer agent in a multi-agent workflow system. 
Your job is to take raw, messy meeting transcripts and produce a clean, structured summary.

Identify:
- All unique speakers mentioned
- Main topics discussed  
- Key decisions made
- Potential action items (raw, not yet structured as tasks)
- A concise 2-3 sentence executive summary

Return ONLY valid JSON with this structure:
{
  "speakers": ["name1", "name2"],
  "topics": ["topic1", "topic2"],
  "keyDecisions": ["decision1", "decision2"],
  "actionItems": ["raw action item 1", "raw action item 2"],
  "summary": "Executive summary of the meeting"
}`,
      },
      { role: "user", content: transcript },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as MeetingSummary;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Transcript Analyzer",
    agentRole: "Cleans raw transcript, identifies speakers, topics, decisions, and action items",
    input: transcript.substring(0, 500),
    output: content.substring(0, 2000),
    confidence: 0.9,
    reasoning: `Identified ${result.speakers?.length || 0} speakers, ${result.topics?.length || 0} topics, ${result.keyDecisions?.length || 0} decisions, and ${result.actionItems?.length || 0} raw action items`,
    durationMs,
    meetingId,
  });

  return result;
}

// ────────────────────────────────────────
// Agent 2: Task Orchestrator
// ────────────────────────────────────────
export interface ExtractedTask {
  task: string;
  owner: string;
  deadline: string | null;
  priority: "high" | "medium" | "low";
  dependsOnTaskTitle: string | null;
}

async function runTaskOrchestrator(
  summary: MeetingSummary,
  teamMembers: string[],
  meetingId: string
): Promise<ExtractedTask[]> {
  const start = Date.now();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Task Orchestrator agent. You receive a structured meeting summary from the Transcript Analyzer agent and convert it into precise, actionable developer tasks.

Guidelines:
- owner: Match to one of these team members: ${teamMembers.join(", ")}. Use first name only.
- deadline: YYYY-MM-DD format. TODAY IS: ${today}. If "by tomorrow" → calculate tomorrow. If unclear → null.
- priority: "high" | "medium" | "low" based on urgency signals in the context.
- dependsOnTaskTitle: If this task is blocked by or depends on another task being extracted, provide the EXACT title of that blocking task. Otherwise, null.
- Each task should be specific and actionable, not vague.

Return ONLY valid JSON: { "tasks": [{ "task": "...", "owner": "...", "deadline": "...", "priority": "...", "dependsOnTaskTitle": null }] }`,
      },
      {
        role: "user",
        content: `MEETING SUMMARY: ${summary.summary}

KEY DECISIONS: ${summary.keyDecisions.join("; ")}

RAW ACTION ITEMS: ${summary.actionItems.join("; ")}

SPEAKERS: ${summary.speakers.join(", ")}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const parsed = JSON.parse(content);
  const tasks: ExtractedTask[] = Array.isArray(parsed) 
    ? parsed 
    : (parsed.tasks || Object.values(parsed)[0] || []);
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Task Orchestrator",
    agentRole: "Converts meeting summary into structured, assignable developer tasks",
    input: JSON.stringify(summary).substring(0, 500),
    output: content.substring(0, 2000),
    confidence: 0.85,
    reasoning: `Extracted ${tasks.length} tasks from ${summary.actionItems.length} raw action items, matched to team: [${teamMembers.join(", ")}]`,
    durationMs,
    meetingId,
  });

  return tasks;
}

// ────────────────────────────────────────
// Agent 3: Validation Agent
// ────────────────────────────────────────
export interface ValidatedTask extends ExtractedTask {
  confidence: number;
  validationNote: string;
}

export interface ValidationResult {
  tasks: ValidatedTask[];
  overallConfidence: number;
  removedCount: number;
  warnings: string[];
}

async function runValidationAgent(
  tasks: ExtractedTask[],
  originalTranscript: string,
  meetingId: string
): Promise<ValidationResult> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Validation Agent. You review tasks extracted by the Task Orchestrator and verify them against the original transcript.

Your checks:
1. Does each task genuinely appear in the transcript? Remove hallucinated tasks.
2. Are there duplicate or overlapping tasks? Merge them.
3. Are deadlines realistic? Flag impossible ones.
4. Is the owner assignment reasonable? Flag mismatches.
5. If dependsOnTaskTitle is set, does that blocking task actually exist in the extracted list? If not, set it to null.
6. Add a confidence score (0.0–1.0) for each task.

Return ONLY valid JSON:
{
  "tasks": [{ "task": "...", "owner": "...", "deadline": "...", "priority": "...", "dependsOnTaskTitle": null, "confidence": 0.95, "validationNote": "Confirmed in transcript" }],
  "overallConfidence": 0.85,
  "removedCount": 1,
  "warnings": ["Task X was hallucinated and removed"]
}`,
      },
      {
        role: "user",
        content: `TASKS TO VALIDATE:
${JSON.stringify(tasks, null, 2)}

ORIGINAL TRANSCRIPT (for cross-checking):
${originalTranscript.substring(0, 4000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as ValidationResult;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Validation Agent",
    agentRole: "Cross-checks extracted tasks against original transcript for accuracy",
    input: JSON.stringify(tasks).substring(0, 500),
    output: content.substring(0, 2000),
    confidence: result.overallConfidence || 0.8,
    reasoning: `Validated ${result.tasks?.length || 0} tasks, removed ${result.removedCount || 0} hallucinated/duplicate tasks. Warnings: ${result.warnings?.join("; ") || "None"}`,
    durationMs,
    meetingId,
  });

  return result;
}

// ────────────────────────────────────────
// Main Pipeline: Run all 3 agents
// ────────────────────────────────────────
export interface PipelineResult {
  summary: MeetingSummary;
  tasks: ValidatedTask[];
  overallConfidence: number;
  warnings: string[];
  retried: boolean;
}

export async function runMeetingExtractionPipeline(
  transcript: string,
  teamMembers: string[],
  meetingId: string
): Promise<PipelineResult> {
  // Agent 1: Analyze transcript
  const summary = await runTranscriptAnalyzer(transcript, meetingId);

  // Agent 2: Extract tasks
  let tasks = await runTaskOrchestrator(summary, teamMembers, meetingId);

  // Agent 3: Validate tasks
  let validation = await runValidationAgent(tasks, transcript, meetingId);

  // Self-correction: if confidence is low, re-run orchestrator with feedback
  let retried = false;
  if (validation.overallConfidence < 0.6 && validation.warnings.length > 0) {
    retried = true;

    await logAgentDecision({
      agentName: "Self-Correction Controller",
      agentRole: "Detects low confidence and triggers re-extraction",
      input: `Confidence: ${validation.overallConfidence}, Warnings: ${validation.warnings.join("; ")}`,
      output: "Triggering re-run of Task Orchestrator with validation feedback",
      confidence: 1.0,
      reasoning: `Overall confidence ${validation.overallConfidence} is below threshold 0.6. Re-running with ${validation.warnings.length} warnings as additional context.`,
      durationMs: 0,
      meetingId,
    });

    // Re-run with warnings as additional context
    const enrichedSummary: MeetingSummary = {
      ...summary,
      actionItems: [
        ...summary.actionItems,
        `VALIDATION FEEDBACK: ${validation.warnings.join(". ")}`,
      ],
    };
    tasks = await runTaskOrchestrator(enrichedSummary, teamMembers, meetingId);
    validation = await runValidationAgent(tasks, transcript, meetingId);
  }

  return {
    summary,
    tasks: validation.tasks || [],
    overallConfidence: validation.overallConfidence || 0.8,
    warnings: validation.warnings || [],
    retried,
  };
}
