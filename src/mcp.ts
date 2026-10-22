import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ToolRegistry } from "./tools/registry.js";
import { PolicyEnforcer } from "./security/policy.js";
import { TransactionLedger } from "./ledger/transactions.js";
import { broadcaster, logger } from "./telemetry/events.js";

export function createMcpServer(): McpServer {
  const mcp = new McpServer(
    { name: "SentinelMCP-Gateway", version: "1.0.0" },
    { capabilities: { tools: {}, logging: {} } }
  );

  const registry = ToolRegistry.getInstance();

  for (const tool of registry.getAll()) {
    mcp.tool(tool.name, tool.description, tool.schema.shape, async (args) => {
      const txId = await TransactionLedger.createTransaction("mcp-client");
      const context = {
        transactionId: txId,
        clientId: "mcp-client",
        timestamp: new Date().toISOString(),
      };

      broadcaster.broadcast({
        type: "TOOL_REQUEST",
        toolName: tool.name,
        transactionId: txId,
        params: args,
      });

      // 1. Evaluate policy & guardrails
      const verdict = await PolicyEnforcer.evaluate(tool.name, tool.policy, args, txId);

      if (!verdict.authorized) {
        await TransactionLedger.failTransaction(txId, verdict.reason || "Policy denied");

        broadcaster.broadcast({
          type: "TOOL_VERDICT",
          toolName: tool.name,
          transactionId: txId,
          verdict: "BLOCKED",
          reason: verdict.reason,
        });

        return {
          isError: true,
          content: [{ type: "text", text: `[SENTINEL_GATEWAY_DENIED] ${verdict.reason}` }],
        };
      }

      broadcaster.broadcast({
        type: "TOOL_VERDICT",
        toolName: tool.name,
        transactionId: txId,
        verdict: "ALLOWED",
      });

      // 2. Execute handler
      try {
        const result = await tool.handler(args, context);
        await TransactionLedger.recordStepSuccess(txId, tool.name, args, result);
await TransactionLedger.completeTransaction(txId);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (executionError) {
        const errMessage = executionError instanceof Error ? executionError.message : String(executionError);
        logger.error(`Execution failed on '${tool.name}', initiating reverse saga rollback: ${errMessage}`);

        broadcaster.broadcast({
          type: "SAGA_ROLLBACK_INITIATED",
          toolName: tool.name,
          transactionId: txId,
          reason: errMessage,
        });

        await TransactionLedger.failTransaction(txId, errMessage);

        return {
          isError: true,
          content: [{ type: "text", text: `[SENTINEL_EXECUTION_FAILED_ROLLED_BACK] ${errMessage}` }],
        };
      }
    });
  }

  return mcp;
}

export const mcpServer = createMcpServer();