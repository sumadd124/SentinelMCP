import { client } from "./database.js";
import crypto from "node:crypto";
import { sagaEngine } from "./rollback.js";
import { logger } from "../telemetry/events.js";

export class TransactionLedger {
  static async createTransaction(initiator = "system"): Promise<string> {
    const id = `tx_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    await client.execute({
      sql: "INSERT INTO transactions (id, status, initiator, client_id, created_at, updated_at) VALUES (?, 'STARTED', ?, ?, ?, ?)",
      args: [id, initiator, initiator, now, now],
    });
    return id;
  }

  static async recordStepSuccess(
    transactionId: string,
    toolName: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    compensationPayload?: Record<string, unknown>
  ): Promise<void> {
    const stepId = `stp_${crypto.randomUUID()}`;
    const countRes = await client.execute({
      sql: "SELECT count(*) as count FROM transaction_steps WHERE transaction_id = ?",
      args: [transactionId],
    });
    const stepOrder = Number(countRes.rows[0]?.count ?? 0) + 1;

    await client.execute({
      sql: `INSERT INTO transaction_steps (id, transaction_id, step_order, tool_name, input_payload, output_payload, status, compensation_payload, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'SUCCESS', ?, ?)`,
      args: [
        stepId,
        transactionId,
        stepOrder,
        toolName,
        JSON.stringify(input),
        JSON.stringify(output),
        compensationPayload ? JSON.stringify(compensationPayload) : null,
        new Date().toISOString(),
      ],
    });
  }

  static async failTransaction(transactionId: string, reason: string): Promise<void> {
    logger.error(`Failing transaction ${transactionId}: ${reason}`);
    await sagaEngine.rollbackTransaction(transactionId);
  }

  static async completeTransaction(transactionId: string): Promise<void> {
    await client.execute({
      sql: "UPDATE transactions SET status = 'COMPLETED', updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), transactionId],
    });
  }

  static async blockTransaction(transactionId: string): Promise<void> {
    await client.execute({
      sql: "UPDATE transactions SET status = 'BLOCKED', updated_at = ? WHERE id = ?",
      args: [new Date().toISOString(), transactionId],
    });
  }
}