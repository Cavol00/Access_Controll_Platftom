import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// Bug report 01 (#68): gli orari scritti dal database devono avere lo stesso
// formato di requested_at, cioè ISO 8601 in UTC con la "Z" finale.
process.env.DB_PATH = ":memory:";
process.env.SIMULATOR_API_KEY = "chiave-di-test";

// Il formato di Date.toISOString(), per esempio 2026-11-18T12:54:34.664Z.
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

let server: Server;
let baseUrl: string;
let adminToken: string;

before(async () => {
  const { app } = await import("../src/app.js");
  const { db } = await import("../src/db.js");
  const { hashPassword } = await import("../src/auth/passwords.js");
  const operators = await import("../src/repositories/operators.repository.js");
  operators.create("admin.prova", hashPassword("password-di-prova"), "admin_sicurezza");
  db.exec(`
    INSERT INTO buildings (id, name) VALUES (1, 'Sede di prova');
    INSERT INTO areas (id, building_id, name) VALUES (1, 1, 'Laboratorio');
    INSERT INTO employees (id, name, email) VALUES (1, 'Dipendente A', 'a@example.test');
    INSERT INTO badges (id, code, employee_id) VALUES (1, 'BADGE-OK', 1);
  `);

  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  const login = await fetch(baseUrl + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin.prova", password: "password-di-prova" }),
  });
  adminToken = (await login.json()).token;
});

after(() => {
  server.close();
});

function asAdmin(path: string, method = "GET", body?: unknown) {
  return fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("formato degli orari (bug report 01)", () => {
  test("recorded_at dello storico è ISO 8601 UTC, come requested_at", async () => {
    const res = await fetch(baseUrl + "/api/access-events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": "chiave-di-test" },
      body: JSON.stringify({ badge_code: "BADGE-OK", door_code: "VARCO-QUALUNQUE" }),
    });
    const event = await res.json();

    assert.match(event.requested_at, ISO_UTC);
    assert.match(event.recorded_at, ISO_UTC);
    // Registrato subito dopo la richiesta: i due orari distano pochi secondi,
    // non l'ora di differenza che si vede se recorded_at è letto come ora locale.
    const gap = Date.parse(event.recorded_at) - Date.parse(event.requested_at);
    assert.ok(Math.abs(gap) < 5000, `recorded_at dista ${gap} ms da requested_at`);
  });

  test("last_event_at dello stato è ISO 8601 UTC, come checked_at", async () => {
    const body = await (await asAdmin("/api/status")).json();
    assert.match(body.checked_at, ISO_UTC);
    assert.match(body.last_event_at, ISO_UTC);
  });

  test("changed_at del registro delle modifiche è ISO 8601 UTC, come revoked_at", async () => {
    await asAdmin("/api/authorizations", "POST", { badge_id: 1, area_id: 1 });
    const revoked = await (await asAdmin("/api/authorizations/1/revoke", "POST")).json();
    const changes = await (await asAdmin("/api/authorizations/changes")).json();

    assert.match(revoked.revoked_at, ISO_UTC);
    assert.equal(changes.length, 2);
    for (const change of changes) {
      assert.match(change.changed_at, ISO_UTC);
    }
  });
});
