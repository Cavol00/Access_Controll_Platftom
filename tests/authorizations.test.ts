import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { DatabaseSync } from "node:sqlite";

// Database in memoria e chiave finta, come negli altri test.
process.env.DB_PATH = ":memory:";
process.env.SIMULATOR_API_KEY = "chiave-di-test";

let server: Server;
let baseUrl: string;
let db: DatabaseSync;
let adminToken: string;
let tecnicoToken: string;

before(async () => {
  const { app } = await import("../src/app.js");
  db = (await import("../src/db.js")).db;
  const { hashPassword } = await import("../src/auth/passwords.js");
  const operators = await import("../src/repositories/operators.repository.js");
  operators.create("admin.prova", hashPassword("password-di-prova"), "admin_sicurezza");
  operators.create("tecnico.prova", hashPassword("password-di-prova"), "admin_tecnico");

  // Tre aree con un varco ciascuna e due badge, senza autorizzazioni.
  db.exec(`
    INSERT INTO buildings (id, name) VALUES (1, 'Sede di prova');
    INSERT INTO areas (id, building_id, name) VALUES (1, 1, 'Laboratorio'), (2, 1, 'Magazzino'), (3, 1, 'Uffici');
    INSERT INTO doors (id, area_id, code) VALUES (1, 1, 'VARCO-LAB'), (2, 2, 'VARCO-MAG'), (3, 3, 'VARCO-UFF');
    INSERT INTO employees (id, name, email) VALUES (1, 'Dipendente A', 'a@example.test'), (2, 'Dipendente B', 'b@example.test');
    INSERT INTO badges (id, code, employee_id) VALUES (1, 'BADGE-A', 1), (2, 'BADGE-B', 2);
  `);

  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  adminToken = await loginAs("admin.prova");
  tecnicoToken = await loginAs("tecnico.prova");
});

after(() => {
  server.close();
});

async function loginAs(username: string): Promise<string> {
  const res = await fetch(baseUrl + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "password-di-prova" }),
  });
  return (await res.json()).token;
}

function authorize(body: unknown, token: string = adminToken) {
  return fetch(baseUrl + "/api/authorizations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

async function access(badge_code: string, door_code: string, requested_at?: string) {
  const res = await fetch(baseUrl + "/api/access-events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": "chiave-di-test" },
    body: JSON.stringify({ badge_code, door_code, requested_at }),
  });
  return (await res.json()).result as string;
}

function revoke(id: number | string, token: string = adminToken) {
  return fetch(`${baseUrl}/api/authorizations/${id}/revoke`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("creare autorizzazioni (T12)", () => {
  test("un badge autorizzato su due aree riceve ACCESS_GRANTED sui varchi di entrambe", async () => {
    assert.equal(await access("BADGE-A", "VARCO-LAB"), "ACCESS_DENIED");
    assert.equal((await authorize({ badge_id: 1, area_id: 1 })).status, 201);
    assert.equal((await authorize({ badge_id: 1, area_id: 2 })).status, 201);
    assert.equal(await access("BADGE-A", "VARCO-LAB"), "ACCESS_GRANTED");
    assert.equal(await access("BADGE-A", "VARCO-MAG"), "ACCESS_GRANTED");
    assert.equal(await access("BADGE-A", "VARCO-UFF"), "ACCESS_DENIED");
  });

  test("dopo la data di fine l'accesso è negato", async () => {
    const res = await authorize({
      badge_id: 2,
      area_id: 3,
      valid_from: "2026-01-01T00:00:00Z",
      valid_to: "2026-06-30T23:59:59Z",
    });
    assert.equal(res.status, 201);
    assert.equal(await access("BADGE-B", "VARCO-UFF", "2026-03-01T09:00:00Z"), "ACCESS_GRANTED");
    assert.equal(await access("BADGE-B", "VARCO-UFF", "2026-07-01T09:00:00Z"), "ACCESS_DENIED");
  });

  test("il registro delle modifiche riporta chi ha creato l'autorizzazione e quando", () => {
    const rows = db
      .prepare("SELECT authorization_id, action, changed_by, changed_at FROM authorization_changes ORDER BY id")
      .all() as { authorization_id: number; action: string; changed_by: string; changed_at: string }[];
    assert.equal(rows.length, 3);
    for (const row of rows) {
      assert.equal(row.action, "CREATED");
      assert.equal(row.changed_by, "admin.prova");
      assert.ok(row.changed_at);
    }
  });

  test("la stessa coppia badge-area una seconda volta: 409", async () => {
    const res = await authorize({ badge_id: 1, area_id: 1 });
    assert.equal(res.status, 409);
  });

  test("badge inesistente: 400, e nessuna riga nel registro", async () => {
    const prima = (db.prepare("SELECT COUNT(*) AS n FROM authorization_changes").get() as { n: number }).n;
    const res = await authorize({ badge_id: 999, area_id: 1 });
    assert.equal(res.status, 400);
    const dopo = (db.prepare("SELECT COUNT(*) AS n FROM authorization_changes").get() as { n: number }).n;
    assert.equal(dopo, prima);
  });

  test("data di fine prima della data di inizio: 400", async () => {
    const res = await authorize({ badge_id: 2, area_id: 1, valid_from: "2026-05-01T00:00:00Z", valid_to: "2026-04-01T00:00:00Z" });
    assert.equal(res.status, 400);
  });

  test("l'elenco delle autorizzazioni: 200", async () => {
    const res = await fetch(baseUrl + "/api/authorizations", { headers: { Authorization: `Bearer ${adminToken}` } });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).length, 3);
  });

  test("senza login: 401; con un ruolo non ammesso: 403", async () => {
    assert.equal((await fetch(baseUrl + "/api/authorizations")).status, 401);
    assert.equal((await authorize({ badge_id: 2, area_id: 2 }, tecnicoToken)).status, 403);
  });
});

describe("revocare autorizzazioni (T13)", () => {
  test("dopo la revoca l'accesso è negato, lo storico precedente resta identico e il registro riporta chi e quando", async () => {
    const storicoPrima = db.prepare("SELECT * FROM access_events ORDER BY id").all();

    const res = await revoke(1);
    assert.equal(res.status, 200);
    assert.ok(((await res.json()) as { revoked_at: string | null }).revoked_at);

    assert.equal(await access("BADGE-A", "VARCO-LAB"), "ACCESS_DENIED");
    assert.equal(await access("BADGE-A", "VARCO-MAG"), "ACCESS_GRANTED");

    const storicoDopo = db.prepare("SELECT * FROM access_events ORDER BY id").all() as unknown[];
    assert.deepEqual(storicoDopo.slice(0, storicoPrima.length), storicoPrima);
    assert.equal(storicoDopo.length, storicoPrima.length + 2);

    const changesRes = await fetch(baseUrl + "/api/authorizations/changes", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(changesRes.status, 200);
    const changes = (await changesRes.json()) as {
      authorization_id: number; action: string; changed_by: string; changed_at: string;
    }[];
    const revoca = changes.find((change) => change.action === "REVOKED");
    assert.deepEqual(
      {
        authorization_id: revoca?.authorization_id,
        action: revoca?.action,
        changed_by: revoca?.changed_by,
      },
      { authorization_id: 1, action: "REVOKED", changed_by: "admin.prova" },
    );
    assert.ok(revoca?.changed_at);

    const elenco = (await (await fetch(baseUrl + "/api/authorizations", {
      headers: { Authorization: `Bearer ${adminToken}` },
    })).json()) as { id: number; revoked_at: string | null }[];
    assert.equal(elenco.length, 3);
    assert.ok(elenco.find((authorization) => authorization.id === 1)?.revoked_at);
  });

  test("revoca due volte: 409; autorizzazione inesistente: 404; id non valido: 400", async () => {
    assert.equal((await revoke(1)).status, 409);
    assert.equal((await revoke(999)).status, 404);
    assert.equal((await revoke("abc")).status, 400);
  });

  test("registro e revoca senza login: 401; con ruolo non ammesso: 403", async () => {
    assert.equal((await fetch(baseUrl + "/api/authorizations/changes")).status, 401);
    assert.equal((await fetch(baseUrl + "/api/authorizations/changes", {
      headers: { Authorization: `Bearer ${tecnicoToken}` },
    })).status, 403);
    assert.equal((await revoke(2, tecnicoToken)).status, 403);
    assert.equal((await revoke(2, "")).status, 401);
  });
});
