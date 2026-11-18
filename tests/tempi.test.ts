import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { DatabaseSync } from "node:sqlite";

// T16: tempi di risposta e storico sotto carico. Database in memoria e chiave
// finta, come negli altri test.
process.env.DB_PATH = ":memory:";
process.env.SIMULATOR_API_KEY = "chiave-di-test";

// Soglia data dal cliente il 23/09/2026 (domanda #1, requisito RNF1).
const SOGLIA_MS = 5000;

let server: Server;
let baseUrl: string;
let db: DatabaseSync;

before(async () => {
  const { app } = await import("../src/app.js");
  db = (await import("../src/db.js")).db;
  db.exec(`
    INSERT INTO buildings (id, name) VALUES (1, 'Sede di prova');
    INSERT INTO areas (id, building_id, name) VALUES (1, 1, 'Laboratorio');
    INSERT INTO doors (id, area_id, code) VALUES (1, 1, 'VARCO-LAB');
    INSERT INTO employees (id, name, email) VALUES (1, 'Dipendente A', 'a@example.test');
    INSERT INTO badges (id, code, employee_id) VALUES (1, 'BADGE-OK', 1);
    INSERT INTO authorizations (badge_id, area_id) VALUES (1, 1);
  `);
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

function requestAccess(badge_code: string) {
  return fetch(baseUrl + "/api/access-events", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": "chiave-di-test" },
    body: JSON.stringify({ badge_code, door_code: "VARCO-LAB" }),
  });
}

function countEvents(): number {
  return (db.prepare("SELECT COUNT(*) AS n FROM access_events").get() as { n: number }).n;
}

describe("tempi di risposta (T16, RNF1)", () => {
  test("una richiesta di accesso riceve l'esito entro 5 secondi", async () => {
    const inizio = performance.now();
    const res = await requestAccess("BADGE-OK");
    const durata = performance.now() - inizio;
    assert.equal(res.status, 201);
    assert.equal((await res.json()).result, "ACCESS_GRANTED");
    assert.ok(durata < SOGLIA_MS, `risposta in ${Math.round(durata)} ms`);
  });

  test("50 richieste insieme: tutte ricevono l'esito entro 5 secondi", async () => {
    const inizio = performance.now();
    const risposte = await Promise.all(
      Array.from({ length: 50 }, (_, i) => requestAccess(i % 2 === 0 ? "BADGE-OK" : "BADGE-SCONOSCIUTO")),
    );
    const durata = performance.now() - inizio;
    assert.ok(risposte.every((r) => r.status === 201));
    assert.ok(durata < SOGLIA_MS, `50 risposte in ${Math.round(durata)} ms`);
  });
});

describe("storico sotto carico (T16, voce 2)", () => {
  test("N richieste producono esattamente N righe nuove, anche se arrivano insieme", async () => {
    const prima = countEvents();
    await Promise.all(Array.from({ length: 30 }, () => requestAccess("BADGE-OK")));
    assert.equal(countEvents(), prima + 30);
  });

  test("un tentativo di modificare lo storico non ha effetto", () => {
    const primo = db.prepare("SELECT result, reason FROM access_events ORDER BY id LIMIT 1").get();
    assert.throws(() => db.exec("UPDATE access_events SET result = 'ACCESS_DENIED'"), /non è modificabile/);
    assert.throws(() => db.exec("DELETE FROM access_events"), /non è modificabile/);
    assert.deepEqual(db.prepare("SELECT result, reason FROM access_events ORDER BY id LIMIT 1").get(), primo);
  });
});
