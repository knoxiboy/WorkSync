/**
 * Agent Decision Log — WorkSync (WorkSyncAI)
 * Records every AI agent decision for full auditability.
 */

import { sql } from "../core/neon";
import { randomBytes } from "crypto";

const createId = () => randomBytes(12).toString("hex");

export interface AgentDecision {
  agentName: string;
  agentRole: string;
  input: string;
  output: string;
  confidence: number;
  reasoning: string;
  durationMs: number;
  meetingId?: string | null;
  taskId?: string | null;
}

export async function logAgentDecision(decision: AgentDecision): Promise<string> {
  const id = createId();
  const truncatedInput = decision.input.substring(0, 2000);
  const truncatedOutput = decision.output.substring(0, 5000);

  try {
    await sql`
      INSERT INTO "AgentDecisionLog" (
        "id", "agentName", "agentRole", "input", "output",
        "confidence", "reasoning", "durationMs",
        "meetingId", "taskId", "createdAt"
      ) VALUES (
        ${id}, ${decision.agentName}, ${decision.agentRole},
        ${truncatedInput}, ${truncatedOutput},
        ${decision.confidence}, ${decision.reasoning}, ${decision.durationMs},
        ${decision.meetingId || null}, ${decision.taskId || null}, NOW()
      )
    `;
  } catch (error) {
    console.error("[AGENT_LOG] Failed to log decision:", error);
  }

  return id;
}
