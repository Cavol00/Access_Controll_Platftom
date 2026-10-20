import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { DatabaseSync } from "node:sqlite";

// I test usano un database in memoria: ogni esecuzione parte da tabelle vuote
// e il file in data/ non viene mai toccato. DB_PATH va impostato prima di
// importare l'app, perché db.ts apre il database nel momento dell'import.
process.env.DB_PATH = ":memory:";

let server: Server;
let baseUrl: string;
let db: DatabaseSync;

before(async () => {
  const { app } = await import("../src/app.js");
  db = (await import("../src/db.js")).db;
  // Porta 0: il sistema operativo sceglie una porta libera, così i test
  // non si scontrano con un server già avviato sulla 3000.
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

function sendJson(method: string, path: string, body: unknown) {
  return fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json" },
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

describe("POST /api/segnalazioni", () => {
  test("con dati validi crea l'evento e risponde 201", async () => {
    const res = await sendJson("POST", "/api/segnalazioni", {
      result: "ACCESS_DENIED",
      reason: "badge sconosciuto",
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(typeof body.id, "number");
    assert.equal(body.result, "ACCESS_DENIED");
    assert.equal(body.reason, "badge sconosciuto");
  });

  test("senza result risponde 400", async () => {
    const res = await sendJson("POST", "/api/segnalazioni", { reason: "manca l'esito" });
    assert.equal(res.status, 400);
    assert.ok((await res.json()).error);
  });

  test("con un esito diverso da ACCESS_GRANTED/ACCESS_DENIED risponde 400", async () => {
    const res = await sendJson("POST", "/api/segnalazioni", { result: "APRI", reason: "esito inventato" });
    assert.equal(res.status, 400);
  });

  test("con JSON malformato risponde 400, non 500", async () => {
    const res = await fetch(baseUrl + "/api/segnalazioni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ questo non è json",
    });
    assert.equal(res.status, 400);
  });
});

describe("GET /api/segnalazioni", () => {
  test("risponde 200 con la lista che contiene l'evento appena creato", async () => {
    const created = await (await sendJson("POST", "/api/segnalazioni", {
      result: "ACCESS_GRANTED",
      reason: "autorizzazione valida",
    })).json();

    const res = await fetch(baseUrl + "/api/segnalazioni");
    assert.equal(res.status, 200);
    const rows = await res.json();
    assert.ok(Array.isArray(rows));
    assert.ok(rows.some((row: { id: number }) => row.id === created.id));
  });
});

describe("PUT /api/segnalazioni/:id", () => {
  test("su un evento esistente risponde 200 con i dati aggiornati", async () => {
    const created = await (await sendJson("POST", "/api/segnalazioni", {
      result: "ACCESS_DENIED",
      reason: "motivo iniziale",
    })).json();

    const res = await sendJson("PUT", `/api/segnalazioni/${created.id}`, {
      result: "ACCESS_DENIED",
      reason: "motivo aggiornato",
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).reason, "motivo aggiornato");
  });

  test("su un id inesistente risponde 404", async () => {
    const res = await sendJson("PUT", "/api/segnalazioni/999999", {
      result: "ACCESS_DENIED",
      reason: "non esiste",
    });
    assert.equal(res.status, 404);
  });

  test("con dati non validi risponde 400", async () => {
    const res = await sendJson("PUT", "/api/segnalazioni/1", { result: "ACCESS_GRANTED" });
    assert.equal(res.status, 400);
  });
});

// Deve restare l'ultimo blocco del file: chiude il database e da qui in poi
// ogni richiesta che lo usa fallisce.
describe("errore del server", () => {
  test("se il database non è disponibile GET /api/segnalazioni risponde 500 senza dettagli interni", async () => {
    db.close();
    const res = await fetch(baseUrl + "/api/segnalazioni");
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: "Errore interno del server" });
  });
});