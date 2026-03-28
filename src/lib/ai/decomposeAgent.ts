/**
 * Tier 3: Auto-Scaling Sub-Task Decomposition Agent — ANTIGRAVITY (WorkSyncAI)
 * 
 * Breaks down complex tasks into atomic, executable sub-tasks.
 */

import Groq from "groq-sdk";
import { logAgentDecision } from "../services/agentLog";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface SubTask {
  title: string;
  description: string;
  estimatedHours: number;
  priority: "high" | "medium" | "low";
}

export interface DecompositionResult {
  subtasks: SubTask[];
  totalComplexity: "low" | "medium" | "high" | "heroic";
  reasoning: string;
}

export async function decomposeTask(
  taskTitle: string,
  taskDescription: string,
  taskId: string
): Promise<DecompositionResult> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Task Decomposition Agent. Your mission is to take a high-level task and break it down into atomic, executable sub-tasks for a developer.
        
        Guidelines:
        - Each sub-task must be clear and distinct.
        - provide estimatedHours (realistic for a senior developer).
        - assess totalComplexity of the original task.
        - Provide a brief reasoning for the breakdown.
        
        Return ONLY valid JSON:
        {
          "subtasks": [
            { "title": "...", "description": "...", "estimatedHours": 2, "priority": "high" }
          ],
          "totalComplexity": "medium",
          "reasoning": "..."
        }`
      },
      {
        role: "user",
        content: `TASK TITLE: ${taskTitle}\nTASK DESCRIPTION: ${taskDescription}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as DecompositionResult;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Decomposition Agent",
    agentRole: "Breaks broad tasks into atomic, manageable sub-units with time estimates",
    input: `Task: ${taskTitle}`,
    output: content.substring(0, 2000),
    confidence: 0.95,
    reasoning: result.reasoning,
    durationMs,
    taskId
  });

  return result;
}
