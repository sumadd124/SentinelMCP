import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { issueCapabilityToken, verifyCapabilityToken } from "../src/security/capability.js";
import { db, runMigrations } from "../src/ledger/database.js";

describe("Capability Token Security Engine", () => {
  beforeAll(async () => {
    await runMigrations();
  });

  beforeEach(async () => {
    await db.execute("DELETE FROM nonces;");
  });

  it("should issue and verify a valid capability token", async () => {
    const token = issueCapabilityToken({
      action: "execute_transfer",
      scope: "accounts:ACC_1001:*",
      expiresInSeconds: 300,
    });

    const verification = await verifyCapabilityToken(token, "execute_transfer");
    if (!verification.valid) {
      console.error("Verification failed unexpectedly:", verification.error);
    }
    expect(verification.valid).toBe(true);
    expect(verification.claims?.action).toBe("execute_transfer");
  });

  it("should prevent replay attacks by rejecting a used nonce", async () => {
    const token = issueCapabilityToken({
      action: "execute_transfer",
      scope: "accounts:ACC_1001:*",
      expiresInSeconds: 300,
    });

    const firstUse = await verifyCapabilityToken(token, "execute_transfer");
    expect(firstUse.valid).toBe(true);

    const secondUse = await verifyCapabilityToken(token, "execute_transfer");
    expect(secondUse.valid).toBe(false);
    expect(secondUse.error).toContain("Token replay detected");
  });

  it("should reject token when action does not match requested permission", async () => {
    const token = issueCapabilityToken({
      action: "read_invoice",
      scope: "invoices:*",
      expiresInSeconds: 300,
    });

    const verification = await verifyCapabilityToken(token, "execute_transfer");
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("Token action mismatch");
  });

  it("should reject an expired capability token", async () => {
    const expiredToken = issueCapabilityToken({
      action: "execute_transfer",
      scope: "accounts:*",
      expiresInSeconds: -10, // already expired
    });

    const verification = await verifyCapabilityToken(expiredToken, "execute_transfer");
    expect(verification.valid).toBe(false);
    expect(verification.error).toContain("Token expired");
  });
});