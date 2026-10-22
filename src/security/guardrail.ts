import {
  BedrockRuntimeClient,
  ApplyGuardrailCommand,
  type ApplyGuardrailCommandOutput
} from "@aws-sdk/client-bedrock-runtime";
import { config } from "../config.js";
import { logger } from "../telemetry/events.js";

export interface GuardrailAssessment {
  allowed: boolean;
  action: "GUARDRAIL_INTERVENED" | "NONE";
  provider: "AWS_BEDROCK" | "LOCAL_DEMO";
  reason?: string;
}

export interface IGuardrailProvider {
  inspectText(content: string): Promise<GuardrailAssessment>;
}

/**
 * Deterministic local guardrail checking for injection, malicious intent, or prompt attacks.
 */
class LocalDemoGuardrailProvider implements IGuardrailProvider {
  private blockedPatterns: RegExp[] = [
    /drop\s+table/i,
    /ignore\s+previous\s+instructions/i,
    /<script.*?>/i,
    /delete\s+all\s+records/i,
    /system\s+override/i,
    /exploit/i
  ];

  async inspectText(content: string): Promise<GuardrailAssessment> {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(content)) {
        return {
          allowed: false,
          action: "GUARDRAIL_INTERVENED",
          provider: "LOCAL_DEMO",
          reason: `[Local Demo Guardrail] Matched prohibited pattern: ${pattern.source}`,
        };
      }
    }

    return {
      allowed: true,
      action: "NONE",
      provider: "LOCAL_DEMO",
    };
  }
}

/**
 * Production AWS Bedrock Guardrail provider
 */
class BedrockGuardrailProvider implements IGuardrailProvider {
  private client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: config.AWS_REGION,
    });
  }

  async inspectText(content: string): Promise<GuardrailAssessment> {
    if (!config.BEDROCK_GUARDRAIL_ID) {
      logger.error("AWS Bedrock enabled but BEDROCK_GUARDRAIL_ID is missing. Failing closed.");
      return {
        allowed: false,
        action: "GUARDRAIL_INTERVENED",
        provider: "AWS_BEDROCK",
        reason: "Configuration error: Missing Bedrock Guardrail Identifier",
      };
    }

    try {
      const command = new ApplyGuardrailCommand({
        guardrailIdentifier: config.BEDROCK_GUARDRAIL_ID,
        guardrailVersion: config.BEDROCK_GUARDRAIL_VERSION,
        source: "INPUT",
        content: [{ text: { text: content } }],
      });

      const response: ApplyGuardrailCommandOutput = await this.client.send(command);

      if (response.action === "GUARDRAIL_INTERVENED") {
        return {
          allowed: false,
          action: "GUARDRAIL_INTERVENED",
          provider: "AWS_BEDROCK",
          reason: "AWS Bedrock Guardrails intervened and blocked untrusted content.",
        };
      }

      return {
        allowed: true,
        action: "NONE",
        provider: "AWS_BEDROCK",
      };
    } catch (err: unknown) {
      logger.error("Bedrock runtime request failed. Failing closed for security.", { error: String(err) });
      return {
        allowed: false,
        action: "GUARDRAIL_INTERVENED",
        provider: "AWS_BEDROCK",
        reason: `Bedrock Guardrail inspection error: ${(err as Error).message}. Closed-fail active.`,
      };
    }
  }
}

export const guardrailProvider: IGuardrailProvider = config.BEDROCK_ENABLED
  ? new BedrockGuardrailProvider()
  : new LocalDemoGuardrailProvider();