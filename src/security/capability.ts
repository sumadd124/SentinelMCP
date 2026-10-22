import crypto from "node:crypto";
import { config } from "../config.js";
import { db } from "../ledger/database.js";

export interface CapabilityClaims {
  action: string;
  scope: string;
  nonce: string;
  expiresAt: number;
  maxAmount?: number;
}

export interface IssueTokenOptions {
  action: string;
  scope: string;
  expiresInSeconds?: number;
  maxAmount?: number;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  claims?: CapabilityClaims;
}

const TOKEN_SECRET = config.CAPABILITY_SECRET || "sentinel-local-dev-secret-32-chars-min";

export function issueCapabilityToken(options: IssueTokenOptions): string {
  const nonce = crypto.randomUUID();
  const expiresIn = options.expiresInSeconds ?? 300;
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const claims: CapabilityClaims = {
    action: options.action,
    scope: options.scope,
    nonce,
    expiresAt,
    maxAmount: options.maxAmount,
  };

  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export async function verifyCapabilityToken(
  rawToken: string,
  expectedAction: string,
  requestedAmount?: number
): Promise<VerificationResult> {
  if (!rawToken || !rawToken.includes(".")) {
    return { valid: false, error: "Malformed capability token format" };
  }

  const [payloadBase64, providedSignature] = rawToken.split(".");

  // 1. Constant-time signature verification
  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { valid: false, error: "Invalid cryptographic capability signature" };
  }

  // 2. Decode claims
  let claims: CapabilityClaims;
  try {
    claims = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, error: "Failed to deserialize token claims payload" };
  }

  // 3. Expiration verification
  const currentTimestamp = Math.floor(Date.now() / 1000);
  if (claims.expiresAt <= currentTimestamp) {
    return { valid: false, error: "Token expired", claims };
  }

  // 4. Action authorization check
  if (claims.action !== expectedAction) {
    return {
      valid: false,
      error: `Token action mismatch: expected '${expectedAction}', received '${claims.action}'`,
      claims,
    };
  }

  // 5. Amount limit ceiling check
  if (
    requestedAmount !== undefined &&
    claims.maxAmount !== undefined &&
    requestedAmount > claims.maxAmount
  ) {
    return {
      valid: false,
      error: `Token amount limit exceeded: max authorized is ${claims.maxAmount}, requested ${requestedAmount}`,
      claims,
    };
  }

  // 6. Nonce replay check
  try {
    const existingNonce = await db.execute({
      sql: "SELECT nonce FROM nonces WHERE nonce = ?",
      args: [claims.nonce],
    });

    if (existingNonce.rows.length > 0) {
      return { valid: false, error: "Token replay detected: nonce has already been consumed", claims };
    }

    await db.execute({
      sql: "INSERT INTO nonces (nonce, expires_at, used_at) VALUES (?, ?, ?)",
      args: [claims.nonce, claims.expiresAt, currentTimestamp],
    });
  } catch (dbErr) {
    return {
      valid: false,
      error: `Replay store database error: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`,
      claims,
    };
  }

  return { valid: true, claims };
}

export class CapabilityTokenManager {
  static issue(options: IssueTokenOptions): string {
    return issueCapabilityToken(options);
  }

  static async verify(rawToken: string, expectedAction: string): Promise<VerificationResult> {
    return verifyCapabilityToken(rawToken, expectedAction);
  }

  static async verifyAndConsume(
    rawToken: string,
    expectedAction: string,
    requestedAmount?: number,
    _transactionId?: string
  ): Promise<VerificationResult> {
    return verifyCapabilityToken(rawToken, expectedAction, requestedAmount);
  }
}