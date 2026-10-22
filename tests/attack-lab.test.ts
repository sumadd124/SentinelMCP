import { describe, it, expect } from "vitest";
import { buildApp } from "../src/index.js";

describe("Stage 10 & 11: Security Intelligence Foundation & Attack Lab API", () => {
  it("executes all 4 Attack Lab scenarios end-to-end against real security subsystems", async () => {
    const app = await buildApp();

    // Scenario A: Token Replay Attack
    const replayRes = await app.inject({
      method: "POST",
      url: "/api/attack-lab/run",
      payload: { scenarioId: "TOKEN_REPLAY" },
    });
    expect(replayRes.statusCode).toBe(200);
    const replayData = replayRes.json();
    expect(replayData.attackStatus).toBe("ATTACK_MITIGATED");
    expect(replayData.firstRequest.verdict).toBe("ALLOWED");
    expect(replayData.replayAttempt.verdict).toBe("BLOCKED");
    expect(replayData.replayAttempt.denialReason).toContain("Token replay detected");

    // Scenario B: Unauthorized Tool Access
    const unauthRes = await app.inject({
      method: "POST",
      url: "/api/attack-lab/run",
      payload: { scenarioId: "UNAUTHORIZED_ACCESS" },
    });
    expect(unauthRes.statusCode).toBe(200);
    const unauthData = unauthRes.json();
    expect(unauthData.attackStatus).toBe("ATTACK_MITIGATED");
    expect(unauthData.firstRequest.verdict).toBe("ALLOWED");
    expect(unauthData.replayAttempt.verdict).toBe("BLOCKED");
    expect(unauthData.replayAttempt.denialReason).toContain("Token action mismatch");

    // Scenario C: Expired Token
    const expiredRes = await app.inject({
      method: "POST",
      url: "/api/attack-lab/run",
      payload: { scenarioId: "EXPIRED_TOKEN" },
    });
    expect(expiredRes.statusCode).toBe(200);
    const expiredData = expiredRes.json();
    expect(expiredData.attackStatus).toBe("ATTACK_MITIGATED");
    expect(expiredData.replayAttempt.verdict).toBe("BLOCKED");
    expect(expiredData.replayAttempt.denialReason).toContain("Token expired");

    // Scenario D: Saga Multi-Step Rollback
    const sagaRes = await app.inject({
      method: "POST",
      url: "/api/attack-lab/run",
      payload: { scenarioId: "SAGA_ROLLBACK" },
    });
    expect(sagaRes.statusCode).toBe(200);
    const sagaData = sagaRes.json();
    expect(sagaData.attackStatus).toBe("ROLLED_BACK_CLEANLY");
    expect(sagaData.finalTransactionStatus).toBe("ROLLED_BACK");
    expect(sagaData.stateVerification.initialBalance).toBe(1000);
    expect(sagaData.stateVerification.midTransactionBalance).toBe(750);
    expect(sagaData.stateVerification.restoredBalance).toBe(1000);
    expect(sagaData.stateVerification.recordCompensatedAndRemoved).toBe(true);

    // Stage 10 APIs: Verify /api/audit/events and /api/transactions return persisted records
    const auditRes = await app.inject({
      method: "GET",
      url: "/api/audit/events",
    });
    expect(auditRes.statusCode).toBe(200);
    expect(auditRes.json().events.length).toBeGreaterThan(0);

    const txRes = await app.inject({
      method: "GET",
      url: "/api/transactions",
    });
    expect(txRes.statusCode).toBe(200);
    expect(txRes.json().transactions.length).toBeGreaterThan(0);
    expect(txRes.json().steps.length).toBeGreaterThan(0);

    await app.close();
  });
});
