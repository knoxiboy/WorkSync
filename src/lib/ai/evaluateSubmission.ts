/**
 * Multi-Agent PR Evaluation Engine — ANTIGRAVITY (WorkSyncAI)
 * 
 * Agent 1: Code Review Agent — evaluates code quality and best practices
 * Agent 2: Task Alignment Agent — checks if code implements the assigned task
 * Reconciliation Agent — resolves disagreements between the two agents
 */

import Groq from "groq-sdk";
import { logAgentDecision } from "../agentLog";
import { GitHubWork } from "../github";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface EvaluationResponse {
  score: number;
  status: "approved" | "needs_improvement";
  summary: string;
  issues: string[];
  suggestions: string[];
  managerSuggestion: string;
  completionConfidence: number;
}

// ────────────────────────────────────────
// Agent 1: Code Review Agent
// ────────────────────────────────────────
interface CodeReviewResult {
  codeQualityScore: number;
  securityIssues: string[];
  bestPracticeViolations: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
}

async function runCodeReviewAgent(
  work: GitHubWork,
  taskId: string
): Promise<CodeReviewResult> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Code Review Agent. You focus ONLY on code quality, security, and best practices — NOT on whether the code matches a specific task.

Evaluate:
1. Code quality (readability, structure, naming)
2. Security vulnerabilities (injections, exposed secrets, unsafe operations)
3. Best practice violations (error handling, edge cases, performance)
4. What the code does well

Return ONLY valid JSON:
{
  "codeQualityScore": 0-100,
  "securityIssues": ["issue1"],
  "bestPracticeViolations": ["violation1"],
  "strengths": ["strength1"],
  "suggestions": ["suggestion1"],
  "summary": "Brief assessment"
}`,
      },
      {
        role: "user",
        content: `PR TITLE: ${work.title}
PR DESCRIPTION: ${work.description}

CODE DIFF:
${work.diff.substring(0, 10000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as CodeReviewResult;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Code Review Agent",
    agentRole: "Evaluates code quality, security, and best practices",
    input: `PR: ${work.title}`,
    output: content.substring(0, 2000),
    confidence: (result.codeQualityScore || 50) / 100,
    reasoning: `Code quality: ${result.codeQualityScore}/100. Found ${result.securityIssues?.length || 0} security issues, ${result.bestPracticeViolations?.length || 0} violations, ${result.strengths?.length || 0} strengths.`,
    durationMs,
    taskId,
  });

  return result;
}

// ────────────────────────────────────────
// Agent 2: Task Alignment Agent
// ────────────────────────────────────────
interface TaskAlignmentResult {
  alignmentScore: number;
  implementedRequirements: string[];
  missingRequirements: string[];
  extraWork: string[];
  completionConfidence: number;
  summary: string;
}

async function runTaskAlignmentAgent(
  taskTitle: string,
  taskDescription: string,
  work: GitHubWork,
  taskId: string
): Promise<TaskAlignmentResult> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Task Alignment Agent. You check whether a code submission actually implements the assigned task — NOT the code quality.

Evaluate:
1. Does the code address the task's goal?
2. What requirements are implemented vs missing?
3. Is there extra/unrelated work?
4. How confident are you that this task is complete?

Return ONLY valid JSON:
{
  "alignmentScore": 0-100,
  "implementedRequirements": ["req1"],
  "missingRequirements": ["req1"],
  "extraWork": ["extra1"],
  "completionConfidence": 0.0-1.0,
  "summary": "Brief alignment assessment"
}`,
      },
      {
        role: "user",
        content: `TASK TITLE: ${taskTitle}
TASK DESCRIPTION: ${taskDescription || "N/A"}

SUBMISSION TITLE: ${work.title}
SUBMISSION DESCRIPTION: ${work.description}

CODE DIFF:
${work.diff.substring(0, 10000)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as TaskAlignmentResult;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Task Alignment Agent",
    agentRole: "Verifies that code changes actually implement the assigned task",
    input: `Task: "${taskTitle}" | PR: "${work.title}"`,
    output: content.substring(0, 2000),
    confidence: result.completionConfidence || 0.5,
    reasoning: `Alignment: ${result.alignmentScore}/100. Implemented ${result.implementedRequirements?.length || 0} requirements, missing ${result.missingRequirements?.length || 0}. Completion confidence: ${result.completionConfidence}`,
    durationMs,
    taskId,
  });

  return result;
}

// ────────────────────────────────────────
// Reconciliation Agent (only if agents disagree)
// ────────────────────────────────────────
async function runReconciliationAgent(
  codeReview: CodeReviewResult,
  alignment: TaskAlignmentResult,
  taskTitle: string,
  taskId: string
): Promise<EvaluationResponse> {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are the Reconciliation Agent. Two other agents have reviewed the same code submission and gave different assessments. Your job is to make the FINAL call.

Agent 1 (Code Review) scored ${codeReview.codeQualityScore}/100
Agent 2 (Task Alignment) scored ${alignment.alignmentScore}/100

Weigh both perspectives and produce a single, balanced evaluation.

Return ONLY valid JSON:
{
  "score": 0-100,
  "status": "approved" | "needs_improvement",
  "summary": "Final balanced assessment",
  "issues": ["merged issues from both agents"],
  "suggestions": ["merged suggestions"],
  "completionConfidence": 0.0-1.0
}`,
      },
      {
        role: "user",
        content: `TASK: ${taskTitle}

CODE REVIEW AGENT SAYS:
${codeReview.summary}
Issues: ${[...codeReview.securityIssues, ...codeReview.bestPracticeViolations].join("; ")}
Strengths: ${codeReview.strengths.join("; ")}

TASK ALIGNMENT AGENT SAYS:
${alignment.summary}
Implemented: ${alignment.implementedRequirements.join("; ")}
Missing: ${alignment.missingRequirements.join("; ")}
Confidence: ${alignment.completionConfidence}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content || "{}";
  const result = JSON.parse(content) as EvaluationResponse;
  const durationMs = Date.now() - start;

  await logAgentDecision({
    agentName: "Reconciliation Agent",
    agentRole: "Resolves disagreements between Code Review and Task Alignment agents",
    input: `Code Review: ${codeReview.codeQualityScore}/100 | Alignment: ${alignment.alignmentScore}/100 (spread: ${Math.abs(codeReview.codeQualityScore - alignment.alignmentScore)})`,
    output: content.substring(0, 2000),
    confidence: result.completionConfidence || 0.7,
    reasoning: `Reconciled a ${Math.abs(codeReview.codeQualityScore - alignment.alignmentScore)}-point disagreement. Final score: ${result.score}/100, status: ${result.status}`,
    durationMs,
    taskId,
  });

  return result;
}

// ────────────────────────────────────────
// Main Pipeline Entrypoint
// ────────────────────────────────────────
export async function evaluateSubmission(
  taskTitle: string,
  taskDescription: string,
  work: GitHubWork,
  taskId?: string
): Promise<EvaluationResponse | null> {
  try {
    const tid = taskId || "unknown";

    // Run both agents in parallel
    const [codeReview, alignment] = await Promise.all([
      runCodeReviewAgent(work, tid),
      runTaskAlignmentAgent(taskTitle, taskDescription, work, tid),
    ]);

    const spread = Math.abs(codeReview.codeQualityScore - alignment.alignmentScore);

    // If agents agree (spread < 30), merge results directly
    if (spread < 30) {
      const avgScore = Math.round((codeReview.codeQualityScore + alignment.alignmentScore) / 2);
      const result: EvaluationResponse = {
        score: avgScore,
        status: avgScore >= 70 ? "approved" : "needs_improvement",
        summary: `Code Review: ${codeReview.summary} | Alignment: ${alignment.summary}`,
        issues: [
          ...codeReview.securityIssues,
          ...codeReview.bestPracticeViolations,
          ...alignment.missingRequirements.map(r => `Missing: ${r}`),
        ],
        suggestions: [...codeReview.suggestions],
        managerSuggestion: avgScore >= 70 ? "APPROVE: Task fully fulfilled" : "REJECT: Significant gaps found",
        completionConfidence: alignment.completionConfidence,
      };

      await logAgentDecision({
        agentName: "Evaluation Merger",
        agentRole: "Combines Code Review and Task Alignment results when agents agree",
        input: `Code: ${codeReview.codeQualityScore} | Alignment: ${alignment.alignmentScore} | Spread: ${spread}`,
        output: JSON.stringify(result).substring(0, 2000),
        confidence: result.completionConfidence,
        reasoning: `Agents agreed within ${spread} points. Merged directly with avg score ${avgScore}. Status: ${result.status}`,
        durationMs: 0,
        taskId: tid,
      });

      return result;
    }

    // If agents disagree (spread >= 30), bring in the Reconciliation Agent
    return await runReconciliationAgent(codeReview, alignment, taskTitle, tid);
  } catch (error) {
    console.error("Multi-agent evaluation failed", error);
    return null;
  }
}
