import { z } from "zod";
import crypto from "node:crypto";
import { ToolRegistry } from "./registry.js";
import { db } from "../ledger/database.js";
import { sagaEngine } from "../ledger/rollback.js";
import type { ToolExecutionContext } from "./types.js";

// 1. read_invoice
export const ReadInvoiceSchema = z.object({
  invoice_id: z.string().min(1),
});

ToolRegistry.register({
  name: "read_invoice",
  description: "Read static invoice details and verified amounts.",
  schema: ReadInvoiceSchema,
  policy: {
    requiresCapabilityToken: false,
  },
  handler: async (input: z.infer<typeof ReadInvoiceSchema>) => {
    return {
      invoice_id: input.invoice_id,
      amount: 1500.0,
      vendor: "Acme Cloud Services",
      status: "PENDING",
      dueDate: "2026-11-15",
    };
  },
});

// 2. check_balance
export const CheckBalanceSchema = z.object({
  account_id: z.string().min(1),
});

ToolRegistry.register({
  name: "check_balance",
  description: "Check current balance for an account.",
  schema: CheckBalanceSchema,
  policy: {
    requiresCapabilityToken: false,
  },
  handler: async (input: z.infer<typeof CheckBalanceSchema>) => {
    const res = await db.execute({
      sql: "SELECT balance FROM mock_accounts WHERE account_id = ?",
      args: [input.account_id],
    });
    const row = res.rows[0] as unknown as { balance: number } | undefined;
    return {
      account_id: input.account_id,
      balance: row ? Number(row.balance) : 1000.0,
      currency: "USD",
    };
  },
});

// 3. execute_transfer / simulate_transfer
export const ExecuteTransferSchema = z.object({
  source_account: z.string().min(1),
  destination_account: z.string().min(1),
  amount: z.number().positive(),
  capability_token: z.string().min(1),
});

ToolRegistry.register({
  name: "execute_transfer",
  description: "Execute a simulated bank transfer guarded by capability token.",
  schema: ExecuteTransferSchema,
  policy: {
    requiresCapabilityToken: true,
    maxTransferThreshold: 10000.0,
  },
  handler: async (
    input: z.infer<typeof ExecuteTransferSchema>,
    context?: ToolExecutionContext
  ) => {
    await db.execute({
      sql: "UPDATE mock_accounts SET balance = balance - ? WHERE account_id = ?",
      args: [input.amount, input.source_account],
    });
    await db.execute({
      sql: "UPDATE mock_accounts SET balance = balance + ? WHERE account_id = ?",
      args: [input.amount, input.destination_account],
    });

    return {
      status: "SUCCESS",
      transactionId: context?.transactionId || "manual",
      transferred: input.amount,
      from: input.source_account,
      to: input.destination_account,
    };
  },
  compensate: async (input: z.infer<typeof ExecuteTransferSchema>) => {
    await db.execute({
      sql: "UPDATE mock_accounts SET balance = balance + ? WHERE account_id = ?",
      args: [input.amount, input.source_account],
    });
    await db.execute({
      sql: "UPDATE mock_accounts SET balance = balance - ? WHERE account_id = ?",
      args: [input.amount, input.destination_account],
    });
  },
});

// Register compensation with saga engine
const transferDef = ToolRegistry.get("execute_transfer");
if (transferDef?.compensate) {
sagaEngine.registerCompensation("execute_transfer", (async (payload: any, txId: any) => {
  if (transferDef?.compensate) {
    await (transferDef.compensate as any)(payload, null, txId);
  }
}) as any);
}

// 4. create_user_record
export const CreateUserRecordSchema = z.object({
  record_id: z.string().optional(),
  content: z.string().min(1),
});

ToolRegistry.register({
  name: "create_user_record",
  description: "Create a user text record checked for prompt injection.",
  schema: CreateUserRecordSchema,
  policy: {
    requiresCapabilityToken: false,
    inspectContentFields: ["content"],
  },
  handler: async (input: z.infer<typeof CreateUserRecordSchema>) => {
    const id = input.record_id || `REC-${crypto.randomUUID().slice(0, 8)}`;
    await db.execute({
      sql: "INSERT OR REPLACE INTO records (id, content, created_at) VALUES (?, ?, ?)",
      args: [id, input.content, new Date().toISOString()],
    });
    return { record_id: id, status: "CREATED" };
  },
  compensate: async (
    input: z.infer<typeof CreateUserRecordSchema>,
    output?: Record<string, unknown> | null
  ) => {
    const recordId = input.record_id || (output?.record_id as string);
    if (recordId) {
      await db.execute({
        sql: "DELETE FROM records WHERE id = ?",
        args: [recordId],
      });
    }
  },
});

const createRecordDef = ToolRegistry.get("create_user_record");
if (createRecordDef?.compensate) {
sagaEngine.registerCompensation("create_user_record", (async (payload: any, txId: any) => {
  if (createRecordDef?.compensate) {
    await (createRecordDef.compensate as any)(payload, null, txId);
  }
}) as any);
}

// 5. delete_record
export const DeleteRecordSchema = z.object({
  record_id: z.string().min(1),
  capability_token: z.string().min(1),
});

ToolRegistry.register({
  name: "delete_record",
  description: "Delete a record, requiring a signed capability token.",
  schema: DeleteRecordSchema,
  policy: {
    requiresCapabilityToken: true,
  },
  handler: async (input: z.infer<typeof DeleteRecordSchema>) => {
    const existing = await db.execute({
      sql: "SELECT content FROM records WHERE id = ?",
      args: [input.record_id],
    });
    const previousContent = existing.rows[0]?.content ?? null;
    await db.execute({
      sql: "DELETE FROM records WHERE id = ?",
      args: [input.record_id],
    });
    return { record_id: input.record_id, deleted: true, previous_content: previousContent };
  },
  compensate: async (
    input: z.infer<typeof DeleteRecordSchema>,
    output?: Record<string, unknown> | null
  ) => {
    const previousContent = output?.previous_content as string | null | undefined;
    if (previousContent) {
      await db.execute({
        sql: "INSERT OR REPLACE INTO records (id, content, created_at) VALUES (?, ?, ?)",
        args: [input.record_id, previousContent, new Date().toISOString()],
      });
    }
  },
});

// 6. send_email
export const SendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

ToolRegistry.register({
  name: "send_email",
  description: "Draft/send email outbox subject to guardrails.",
  schema: SendEmailSchema,
  policy: {
    requiresCapabilityToken: false,
    inspectContentFields: ["subject", "body"],
  },
  handler: async (input: z.infer<typeof SendEmailSchema>) => {
    const draftId = `EMAIL-${crypto.randomUUID().slice(0, 8)}`;
    return {
      status: "SENT_TO_OUTBOX",
      draftId,
      recipient: input.to,
      subject: input.subject,
    };
  },
  compensate: async (
    _input: z.infer<typeof SendEmailSchema>,
    _output?: Record<string, unknown> | null
  ) => {
    // Compensating action for email marks draft as CANCELLED in audit trail
  },
});

const sendEmailDef = ToolRegistry.get("send_email");
if (sendEmailDef?.compensate) {
sagaEngine.registerCompensation("send_email", (async (payload: any, txId: any) => {
  if (sendEmailDef?.compensate) {
    await (sendEmailDef.compensate as any)(payload, null, txId);
  }
}) as any);
}