/**
 * AI Code Evaluation Engine for ANTIGRAVITY (WorkSyncAI)
 * Uses Groq (Llama 3) to judge whether code fulfills a task.
 */

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface EvaluationResponse {
  score: number;
  status: "approved" | "needs_improvement";
  summary: string;
  issues: string[];
  suggestions: string[];
  completionConfidence: number;
}

import { GitHubWork } from "../github";

export async function evaluateSubmission(
  taskTitle: string,
  taskDescription: string,
  work: GitHubWork
): Promise<EvaluationResponse | null> {
  try {
    const prompt = `
      Evaluate the following code submission against the assigned task.
      
      TASK TITLE: ${taskTitle}
      TASK DESCRIPTION: ${taskDescription || "N/A"}
      
      SUBMISSION TITLE: ${work.title}
      SUBMISSION DESCRIPTION: ${work.description}
      
      CODE CHANGES (DIFF):
      ${work.diff.substring(0, 10000)}
      
      Evaluate strictly for:
      1. Alignment with task goals.
      2. Technical completeness.
      3. Code quality and best practices.
      4. Missing edge cases.
      
      Return ONLY a valid JSON object with the following structure:
      {
        "score": number (0-100),
        "status": "approved" | "needs_improvement",
        "summary": "Short execution summary",
        "issues": ["list of specific problems found"],
        "suggestions": ["list of improvements"],
        "completionConfidence": number (0-1)
      }
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a senior technical architect and code reviewer. You output only structured JSON analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    return JSON.parse(content) as EvaluationResponse;
  } catch (error) {
    console.error("AI Evaluation failed", error);
    return null;
  }
}
