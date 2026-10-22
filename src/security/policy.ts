import { CapabilityTokenManager } from "./capability.js";
import { guardrailProvider } from "./guardrail.js";
import { client } from "../ledger/database.js";

export interface PolicyCheckResult {
  authorized: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityPolicyDefinition {
  requiresCapabilityToken: boolean;
  inspectContentFields?: string[];
  maxTransferThreshold?: number;
}

export class PolicyEnforcer {
  static async evaluate(
    toolName: string,
    policy: SecurityPolicyDefinition,
    params: Record<string, unknown>,
    transactionId?: string
  ): Promise<PolicyCheckResult> {
    if (policy.inspectContentFields && policy.inspectContentFields.length > 0) {
      const aggregatedContent = policy.inspectContentFields
        .map((field) => String(params[field] ?? ""))
        .filter(Boolean)
        .join("\n");

      if (aggregatedContent.trim().length > 0) {
        const assessment = await guardrailProvider.inspectText(aggregatedContent);
        if (!assessment.allowed) {
          await this.logAudit(toolName, "BLOCKED", assessment.reason ?? "Guardrail rejection");
          return {
            authorized: false,
            reason: `Security Gateway Blocked Input: ${assessment.reason} (Provider: ${assessment.provider})`,
          };
        }
      }
    }

    if (policy.requiresCapabilityToken) {
      const token = params.capability_token as string | undefined;
      if (!token) {
        await this.logAudit(toolName, "BLOCKED", "Missing required capability token");
        return {
          authorized: false,
          reason: `Policy Enforcement Error: Tool '${toolName}' strictly requires a signed HMAC capability token.`,
        };
      }

      const amount = typeof params.amount === "number" ? params.amount : undefined;
      const tokenResult = await CapabilityTokenManager.verifyAndConsume(token, toolName, amount, transactionId);

      if (!tokenResult.valid) {
        await this.logAudit(toolName, "BLOCKED", tokenResult.error ?? "Invalid token");
        return {
          authorized: false,
          reason: `Capability authorization denied: ${tokenResult.error}`,
        };
      }
    }

    await this.logAudit(toolName, "ALLOWED", "Policies satisfied");
    return { authorized: true };
  }

  private static async logAudit(toolName: string, verdict: "ALLOWED" | "BLOCKED", reason: string): Promise<void> {
    await client.execute({
      sql: "INSERT INTO audit_events (event_type, tool_name, verdict, reason, timestamp) VALUES (?, ?, ?, ?, ?)",
      args: ["TOOL_INVOCATION", toolName, verdict, reason, new Date().toISOString()],
    });
  }
}