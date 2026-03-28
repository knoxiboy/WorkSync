/**
 * Tier 3: Predictive Resource Optimization Agent — ANTIGRAVITY (WorkSyncAI)
 * 
 * Analyzes team capacity and skills to optimize task assignments.
 */

import Groq from "groq-sdk";
import { logAgentDecision } from "../services/agentLog";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface OptimizationResult {
  matchScore: number;
  recommendation: string;
  skillGaps: string[];
  capacityRisk: "low" | "medium" | "high";
  reasoning: string;
}

export async function optimizeResource(
  taskTitle: string,
  taskDescription: string,
  ownerName: string,
  ownerRole: string,
  taskId: string
): Promise<OptimizationResult> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Resource Optimization Agent. Your job is to predict if a task is correctly matched to an owner based on their role and task specs.
        
        Guidelines:
        - matchScore: 0.0 - 1.0.
        - skillGaps: Identify missing skills required for this task.
        - capacityRisk: Assess if this task might cause a bottleneck for the owner.
        - Provide a clear recommendation (e.g., "Good match", "Needs senior oversight", "Re-assign to specialized engineer").
        
        Return ONLY valid JSON:
        {
          "matchScore": 0.85,
          "recommendation": "...",
          "skillGaps": ["..."],
          "capacityRisk": "low",
          "reasoning": "..."
        }`
      },
      {
        role: "user",
        content: `TASK: ${taskTitle}\nDESCRIPTION: ${taskDescription}\nOWNER: ${ownerName} (Role: ${ownerRole})`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as OptimizationResult;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Resource Agent",
    agentRole: "Analyzes task-to-talent fitment and flags strategic resource gaps",
    input: `Task: ${taskTitle}, Owner: ${ownerName}`,
    output: content.substring(0, 2000),
    confidence: 0.9,
    reasoning: result.reasoning,
    durationMs,
    taskId
  });

  return result;
}
