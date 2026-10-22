import { describe, it, expect, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/mcp.js";
import { runMigrations } from "../src/ledger/database.js";
import "../src/tools/handlers.js";

describe("MCP Gateway Integration", () => {
  beforeAll(async () => {
    await runMigrations();
  });

  it("should discover registered tools via standard MCP client protocol", async () => {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    const client = new Client(
      { name: "sentinel-integration-client", version: "1.0.0" },
      { capabilities: {} }
    );

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    try {
      const toolsResult = await client.listTools();

      expect(toolsResult).toBeDefined();
      expect(Array.isArray(toolsResult.tools)).toBe(true);
      expect(toolsResult.tools.length).toBeGreaterThan(0);

      const toolNames = toolsResult.tools.map((t) => t.name);
      expect(toolNames).toContain("execute_transfer");
    } finally {
      await client.close();
      await server.close();
    }
  });
});