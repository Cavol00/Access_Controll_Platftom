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
let tecnicoToken: string;
let responsabileToken: string;

before(async () => {
  const { app } = await import("../src/app.js");
  db = (await import("../src/db.js")).db;
  const { hashPassword } = await import("../src/auth/passwords.js");
  const operators = await import("../src/repositories/operators.repository.js");
  operators.create("tecnico.prova", hashPassword("password-di-prova"), "admin_tecnico");
  operators.create("responsabile.prova", hashPassword("password-di-prova"), "responsabile_area");

  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  tecnicoToken = await loginAs("tecnico.prova");
  responsabileToken = await loginAs("responsabile.prova");
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

function readStatus(token: string | null = tecnicoToken) {
  return fetch(baseUrl + "/api/status", { headers: token ? { Authorization: `Bearer ${token}` } : {} });
}

describe("stato del sistema (T17)", () => {
  test("il controllo pubblico /health risponde con il backend attivo", async () => {
    const res = await fetch(baseUrl + "/health");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: "ok" });
  });

  test("lo stato dettagliato senza login: 401", async () => {
    assert.equal((await readStatus(null)).status, 401);
  });

  test("lo stato dettagliato con un ruolo non ammesso (responsabile_area): 403", async () => {
    assert.equal((await readStatus(responsabileToken)).status, 403);
  });

  test("con login: database raggiungibile e nessun evento ancora ricevuto", async () => {
    const res = await readStatus();
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.database, "raggiungibile");
    assert.equal(body.last_event_at, null);
  });

  test("dopo una richiesta del simulatore indica l'ora dell'ultimo evento", async () => {
    await fetch(baseUrl + "/api/access-events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": "chiave-di-test" },
      body: JSON.stringify({ badge_code: "BADGE-QUALUNQUE", door_code: "VARCO-QUALUNQUE" }),
    });
    const body = await (await readStatus()).json();
    assert.equal(typeof body.last_event_at, "string");
  });

  // Deve restare l'ultimo: chiude il database.
  test("se il database non risponde lo stato lo dice, invece di dare errore", async () => {
    db.close();
    const res = await readStatus();
    assert.equal(res.status, 200);
    assert.equal((await res.json()).database, "non raggiungibile");
  });
});
