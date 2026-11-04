import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { decideAccess } from "../src/domain/accessDecision.js";

// Test unitari del motore di decisione: nessun database, nessun server.
const now = new Date("2026-10-15T10:00:00Z");
const activeBadge = { active: true, employeeActive: true };
const always = { valid_from: null, valid_to: null, revoked_at: null };

describe("decideAccess", () => {
  test("badge attivo con autorizzazione valida: ACCESS_GRANTED", () => {
    assert.equal(decideAccess(activeBadge, true, [always], now).result, "ACCESS_GRANTED");
  });

  test("badge sconosciuto: ACCESS_DENIED", () => {
    assert.deepEqual(decideAccess(undefined, true, [], now), { result: "ACCESS_DENIED", reason: "badge sconosciuto" });
  });

  test("varco sconosciuto: ACCESS_DENIED", () => {
    assert.equal(decideAccess(activeBadge, false, [], now).reason, "varco sconosciuto");
  });

  test("badge disattivato: ACCESS_DENIED anche con autorizzazione valida", () => {
    assert.equal(decideAccess({ active: false, employeeActive: true }, true, [always], now).result, "ACCESS_DENIED");
  });

  test("nessuna autorizzazione sull'area: ACCESS_DENIED", () => {
    assert.equal(decideAccess(activeBadge, true, [], now).result, "ACCESS_DENIED");
  });

  test("autorizzazione scaduta: ACCESS_DENIED", () => {
    const expired = { ...always, valid_to: "2026-10-01T00:00:00Z" };
    assert.equal(decideAccess(activeBadge, true, [expired], now).result, "ACCESS_DENIED");
  });

  test("autorizzazione non ancora iniziata: ACCESS_DENIED", () => {
    const future = { ...always, valid_from: "2026-11-01T00:00:00Z" };
    assert.equal(decideAccess(activeBadge, true, [future], now).result, "ACCESS_DENIED");
  });

  test("autorizzazione revocata: ACCESS_DENIED", () => {
    const revoked = { ...always, revoked_at: "2026-10-10T00:00:00Z" };
    assert.equal(decideAccess(activeBadge, true, [revoked], now).result, "ACCESS_DENIED");
  });

  test("stessa richiesta, stesso esito", () => {
    assert.deepEqual(decideAccess(activeBadge, true, [always], now), decideAccess(activeBadge, true, [always], now));
  });
});
