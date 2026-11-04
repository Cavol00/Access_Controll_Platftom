import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { DatabaseSync } from "node:sqlite";

// Database in memoria: ogni esecuzione parte da tabelle vuote e il file in
// data/ non viene mai toccato. DB_PATH va impostato prima di importare l'app,
// perché db.ts apre il database nel momento dell'import.
process.env.DB_PATH = ":memory:";
// Chiave del lettore badge usata solo nei test: non è quella di nessun .env.
const API_KEY = "chiave-di-test";
process.env.SIMULATOR_API_KEY = API_KEY;

let server: Server;
let baseUrl: string;
let db: DatabaseSync;
// Token degli operatori di prova, ottenuti con il login in before().
let adminToken: string;
let tecnicoToken: string;

before(async () => {
  const { app } = await import("../src/app.js");
  db = (await import("../src/db.js")).db;

  // Dati di prova minimi: due aree, un varco per area, un badge autorizzato
  // solo sulla prima, un badge disattivato, un badge con autorizzazione revocata.
  db.exec(`
    INSERT INTO buildings (id, name) VALUES (1, 'Sede di prova');
    INSERT INTO areas (id, building_id, name) VALUES (1, 1, 'Laboratorio'), (2, 1, 'Magazzino');
    INSERT INTO doors (id, area_id, code) VALUES (1, 1, 'VARCO-LAB'), (2, 2, 'VARCO-MAG');
    INSERT INTO employees (id, name, email, active) VALUES
      (1, 'Dipendente A', 'a@example.test', 1),
      (2, 'Dipendente B', 'b@example.test', 1),
      (3, 'Dipendente C', 'c@example.test', 1);
    INSERT INTO badges (id, code, employee_id, active) VALUES
      (1, 'BADGE-OK', 1, 1),
      (2, 'BADGE-OFF', 2, 0),
      (3, 'BADGE-REVOCATO', 3, 1);
    INSERT INTO authorizations (badge_id, area_id, valid_from, valid_to, revoked_at) VALUES
      (1, 1, NULL, NULL, NULL),
      (2, 1, NULL, NULL, NULL),
      (3, 1, NULL, NULL, '2026-01-01T00:00:00Z');
  `);

  // Porta 0: il sistema operativo sceglie una porta libera.
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;

  const { hashPassword } = await import("../src/auth/passwords.js");
  const operators = await import("../src/repositories/operators.repository.js");
  operators.create("admin.prova", hashPassword("password-di-prova"), "admin_sicurezza");
  operators.create("tecnico.prova", hashPassword("password-di-prova"), "admin_tecnico");
  adminToken = await loginAs("admin.prova");
  tecnicoToken = await loginAs("tecnico.prova");
});

async function loginAs(username: string): Promise<string> {
  const res = await fetch(baseUrl + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: "password-di-prova" }),
  });
  return (await res.json()).token;
}

function readEvents(token: string | null = adminToken) {
  return fetch(baseUrl + "/api/access-events", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

after(() => {
  server.close();
});

function requestAccess(body: unknown, apiKey: string | null = API_KEY) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey !== null) headers["X-API-Key"] = apiKey;
  return fetch(baseUrl + "/api/access-events", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("GET /health", () => {
  test("risponde 200 con status ok", async () => {
    const res = await fetch(baseUrl + "/health");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });
});

describe("POST /api/access-events", () => {
  test("badge autorizzato sull'area del varco: 201 e ACCESS_GRANTED", async () => {
    const res = await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-LAB" });
    assert.equal(res.status, 201);
    const event = await res.json();
    assert.equal(event.result, "ACCESS_GRANTED");
    assert.equal(event.area_id, 1);
    assert.equal(typeof event.id, "number");
  });

  test("stesso badge su un varco di un'altra area: ACCESS_DENIED", async () => {
    const event = await (await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-MAG" })).json();
    assert.equal(event.result, "ACCESS_DENIED");
  });

  test("badge sconosciuto: 201, ACCESS_DENIED e tentativo registrato", async () => {
    const res = await requestAccess({ badge_code: "BADGE-INESISTENTE", door_code: "VARCO-LAB" });
    assert.equal(res.status, 201);
    const event = await res.json();
    assert.equal(event.result, "ACCESS_DENIED");
    assert.equal(event.reason, "badge sconosciuto");
  });

  test("varco sconosciuto: ACCESS_DENIED", async () => {
    const event = await (await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-INESISTENTE" })).json();
    assert.equal(event.result, "ACCESS_DENIED");
    assert.equal(event.area_id, null);
  });

  test("badge disattivato: ACCESS_DENIED", async () => {
    const event = await (await requestAccess({ badge_code: "BADGE-OFF", door_code: "VARCO-LAB" })).json();
    assert.equal(event.reason, "badge disattivato");
  });

  test("autorizzazione revocata: ACCESS_DENIED", async () => {
    const event = await (await requestAccess({ badge_code: "BADGE-REVOCATO", door_code: "VARCO-LAB" })).json();
    assert.equal(event.result, "ACCESS_DENIED");
  });

  test("l'esito inviato dal client viene ignorato: decide il server", async () => {
    const event = await (await requestAccess({
      badge_code: "BADGE-INESISTENTE",
      door_code: "VARCO-LAB",
      result: "ACCESS_GRANTED",
    })).json();
    assert.equal(event.result, "ACCESS_DENIED");
  });

  test("senza badge_code: 400", async () => {
    const res = await requestAccess({ door_code: "VARCO-LAB" });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).error);
  });

  test("con requested_at non valido: 400", async () => {
    const res = await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-LAB", requested_at: "ieri" });
    assert.equal(res.status, 400);
  });

  test("con JSON malformato: 400, non 500", async () => {
    const res = await fetch(baseUrl + "/api/access-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ questo non è json",
    });
    assert.equal(res.status, 400);
  });
});

describe("chiave del lettore badge (T10)", () => {
  test("senza X-API-Key: 401 e nessuna riga nello storico", async () => {
    const before = (await (await readEvents()).json()).length;
    const res = await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-LAB" }, null);
    assert.equal(res.status, 401);
    assert.ok((await res.json()).error);
    const after = (await (await readEvents()).json()).length;
    assert.equal(after, before);
  });

  test("con una X-API-Key sbagliata: 401", async () => {
    const res = await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-LAB" }, "chiave-sbagliata");
    assert.equal(res.status, 401);
  });
});

describe("ruoli sullo storico (T07)", () => {
  test("senza login: 401", async () => {
    const res = await readEvents(null);
    assert.equal(res.status, 401);
  });

  test("con un token inventato: 401", async () => {
    const res = await readEvents("token-inventato");
    assert.equal(res.status, 401);
  });

  test("con un ruolo non ammesso (admin_tecnico): 403", async () => {
    const res = await readEvents(tecnicoToken);
    assert.equal(res.status, 403);
  });

  test("con il ruolo giusto (admin_sicurezza): 200", async () => {
    const res = await readEvents(adminToken);
    assert.equal(res.status, 200);
  });
});

describe("GET /api/access-events", () => {
  test("N richieste producono N righe nuove nello storico", async () => {
    const before = (await (await readEvents()).json()).length;
    await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-LAB" });
    await requestAccess({ badge_code: "BADGE-OFF", door_code: "VARCO-LAB" });
    await requestAccess({ badge_code: "BADGE-OK", door_code: "VARCO-MAG" });

    const res = await readEvents();
    assert.equal(res.status, 200);
    assert.equal((await res.json()).length, before + 3);
  });
});

describe("lo storico non è modificabile", () => {
  test("PUT e DELETE sull'API rispondono 404", async () => {
    const put = await fetch(baseUrl + "/api/access-events/1", { method: "PUT" });
    const del = await fetch(baseUrl + "/api/access-events/1", { method: "DELETE" });
    assert.equal(put.status, 404);
    assert.equal(del.status, 404);
  });

  test("anche dal database UPDATE e DELETE vengono rifiutati", () => {
    assert.throws(() => db.exec("UPDATE access_events SET result = 'ACCESS_GRANTED'"), /non è modificabile/);
    assert.throws(() => db.exec("DELETE FROM access_events"), /non è modificabile/);
  });
});

// Deve restare l'ultimo blocco del file: chiude il database e da qui in poi
// ogni richiesta che lo usa fallisce.
describe("errore del server", () => {
  test("se il database non è disponibile GET /api/access-events risponde 500 senza dettagli interni", async () => {
    db.close();
    const res = await readEvents();
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: "Errore interno del server" });
  });
});
