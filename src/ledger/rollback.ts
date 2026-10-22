import { client } from "./database.js";
import { logger } from "../telemetry/events.js";

export type CompensationFunction = (
  stepInput: Record<string, unknown>,
  stepOutput: Record<string, unknown> | null,
  compensationPayload: Record<string, unknown> | null
) => Promise<void>;

export class SagaRollbackEngine {
  private handlers = new Map<string, CompensationFunction>();

  registerCompensation(toolName: string, fn: CompensationFunction): void {
    this.handlers.set(toolName, fn);
  }

  async rollbackTransaction(transactionId: string): Promise<boolean> {
    logger.warn(`Initiating Saga rollback for transaction: ${transactionId}`);

    const res = await client.execute({
      sql: "SELECT * FROM transaction_steps WHERE transaction_id = ? AND status = 'SUCCESS' ORDER BY step_order DESC",
      args: [transactionId],
    });

    const steps = res.rows as unknown as Array<{
      id: string;
      step_order: number;
      tool_name: string;
      input_payload: string;
      output_payload: string | null;
      compensation_payload: string | null;
    }>;

    if (steps.length === 0) {
      logger.info(`No successful steps to compensate for transaction ${transactionId}`);
      await client.execute({
        sql: "UPDATE transactions SET status = 'ROLLED_BACK', updated_at = ? WHERE id = ?",
        args: [new Date().toISOString(), transactionId],
      });
      return true;
    }

    let allSucceeded = true;

    for (const step of steps) {
      const handler = this.handlers.get(step.tool_name);
      if (!handler) {
        logger.error(`No compensation handler registered for tool: ${step.tool_name}. Saga broken.`);
        allSucceeded = false;
        await client.execute({
          sql: "UPDATE transaction_steps SET status = 'COMPENSATION_FAILED' WHERE id = ?",
          args: [step.id],
        });
        break;
      }

      try {
        const input = JSON.parse(step.input_payload);
        const output = step.output_payload ? JSON.parse(step.output_payload) : null;
        const comp = step.compensation_payload ? JSON.parse(step.compensation_payload) : null;

        await handler(input, output, comp);

        await client.execute({
          sql: "UPDATE transaction_steps SET status = 'COMPENSATED' WHERE id = ?",
          args: [step.id],
        });
        logger.info(`Successfully compensated step ${step.id} (${step.tool_name})`);
      } catch (err) {
        logger.error(`Failed to compensate step ${step.id} (${step.tool_name}):`, { error: String(err) });
        await client.execute({
          sql: "UPDATE transaction_steps SET status = 'COMPENSATION_FAILED' WHERE id = ?",
          args: [step.id],
        });
        allSucceeded = false;
        break;
      }
    }

    const finalStatus = allSucceeded ? "ROLLED_BACK" : "ROLLBACK_FAILED";
    await client.execute({
      sql: "UPDATE transactions SET status = ?, updated_at = ? WHERE id = ?",
      args: [finalStatus, new Date().toISOString(), transactionId],
    });

    return allSucceeded;
  }
}

export const sagaEngine = new SagaRollbackEngine();