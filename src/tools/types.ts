import { z } from "zod";

export interface SecurityPolicyDefinition {
  requiresCapabilityToken: boolean;
  inspectContentFields?: string[];
  maxTransferThreshold?: number;
}

export type CompensationFunction<
  TInput = Record<string, unknown>,
  TOutput = Record<string, unknown>
> = (
  input: TInput,
  output?: TOutput | null,
  transactionId?: string
) => Promise<void> | void;

export interface ToolExecutionContext {
  transactionId: string;
  clientId: string;
  timestamp: string;
}

export interface ToolDefinition<
  TSchema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>
> {
  name: string;
  description: string;
  schema: TSchema;
  policy: SecurityPolicyDefinition;
  handler: (
    input: z.infer<TSchema>,
    context: ToolExecutionContext
  ) => Promise<Record<string, unknown>>;
  compensate?: CompensationFunction<z.infer<TSchema>>;
}