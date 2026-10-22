import crypto from "node:crypto";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ToolRegistry } from "../tools/registry.js";
import { verifyCapabilityToken } from "../security/capability.js";
import { guardrailProvider } from "../security/guardrail.js";
import { broadcaster, logger } from "../telemetry/events.js";
import type { ToolDefinition, ToolExecutionContext } from "../tools/types.js";

// Helper to convert Zod raw shape keys into basic JSON Schema properties
function zodSchemaToJsonSchema(schema: any): {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
} {
  const shape = schema.shape || {};
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = (value as any)?._def?.typeName;
    let propType = "string";
    if (zodType === "ZodNumber") propType = "number";
    if (zodType === "ZodBoolean") propType = "boolean";
    if (zodType === "ZodArray") propType = "array";
    if (zodType === "ZodObject") propType = "object";

    properties[key] = {
      type: propType,
      description: (value as any)?.description || undefined,
    };

    if (zodType !== "ZodOptional" && zodType !== "ZodNullable") {
      required.push(key);
    }
  }

  return {
    type: "object",
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

export async function startStdioServer(): Promise<void> {
  const mcpServer = new Server(
    {
      name: "sentinelmcp-gateway",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 1. Tool discovery
  mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
    const registry = ToolRegistry.getInstance();
    const tools = registry.getAll().map((def: ToolDefinition) => ({
      name: def.name,
      description: def.description,
      inputSchema: zodSchemaToJsonSchema(def.schema),
    }));
    return { tools };
  });

  // 2. Intercept and evaluate tool execution
  mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const rawArgs = (request.params.arguments as Record<string, unknown>) || {};
    const registry = ToolRegistry.getInstance();
    const tool = registry.get(name);

    if (!tool) {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool "${name}" is not registered in SentinelMCP.`
      );
    }

    broadcaster.emit("telemetry", {
      type: "TOOL_REQUEST",
      tool: name,
      params: rawArgs,
      timestamp: new Date().toISOString(),
    });

    // Guardrail Check
    const stringifiedArgs = JSON.stringify(rawArgs);
    const assessment = await guardrailProvider.inspectText(stringifiedArgs);

    if (!assessment.allowed) {
      broadcaster.emit("telemetry", {
        type: "TOOL_VERDICT",
        tool: name,
        verdict: "BLOCKED",
        reason: assessment.reason || "Guardrail policy violation",
        timestamp: new Date().toISOString(),
      });
      return {
        content: [
          {
            type: "text",
            text: `[SECURITY BLOCK] SentinelMCP intercepted invocation: ${assessment.reason || "Guardrail violation"}`,
          },
        ],
        isError: true,
      };
    }

    // Token Capability Check for sensitive operations
    if (tool.policy.requiresCapabilityToken) {
      const token = typeof rawArgs._capabilityToken === "string" ? rawArgs._capabilityToken : "";
      const requestedAmount = typeof rawArgs.amount === "number" ? rawArgs.amount : undefined;

      const verified = await verifyCapabilityToken(token, name, requestedAmount);

      if (!verified.valid) {
        broadcaster.emit("telemetry", {
          type: "TOOL_VERDICT",
          tool: name,
          verdict: "BLOCKED",
          reason: `Invalid or missing capability token: ${verified.error}`,
          timestamp: new Date().toISOString(),
        });
        return {
          content: [
            {
              type: "text",
              text: `[CAPABILITY DENIED] SentinelMCP requires a valid signed capability token to execute "${name}". Error: ${verified.error}`,
            },
          ],
          isError: true,
        };
      }
    }

    broadcaster.emit("telemetry", {
      type: "TOOL_VERDICT",
      tool: name,
      verdict: "ALLOWED",
      timestamp: new Date().toISOString(),
    });

    // Create execution context
    const context: ToolExecutionContext = {
      transactionId: crypto.randomUUID(),
      clientId: "stdio-client",
      timestamp: new Date().toISOString(),
    };

    try {
      const result = await tool.handler(rawArgs as any, context);
      return {
        content: [
          {
            type: "text",
            text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: "text",
            text: `Tool execution error: ${message}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("SentinelMCP Stdio Transport connected for external agents.");
}