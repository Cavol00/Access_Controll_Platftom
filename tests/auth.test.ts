import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { DatabaseSync } from "node:sqlite";

process.env.DB_PATH = ":memory:";
process.env.SIMULATOR_API_KEY = "chiave-di-test";
const PASSWORD = "password-di-prova-123";
let server: Server;
let baseUrl: string;
let db: DatabaseSync;

before(async () => {
  const { app } = await import("../src/app.js");
  db = (await import("../src/db.js")).db;
  const { hashPassword } = await import("../src/auth/passwords.js");
  const operators = await import("../src/repositories/operators.repository.js");
  operators.create("admin.prova", hashPassword(PASSWORD), "admin_sicurezza");
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

function login(body: unknown) {
  return fetch(baseUrl + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login (T06)", () => {
  test("credenziali giuste: 200 con token, ruolo e scadenza", async () => {
    const res = await login({ username: "admin.prova", password: PASSWORD });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(typeof body.token, "string");
    assert.ok(body.token.length >= 32);
    assert.equal(body.role, "admin_sicurezza");
    assert.ok(Date.parse(body.expires_at) > Date.now());
  });

  test("password sbagliata: 401 con 'credenziali non valide'", async () => {
    const res = await login({ username: "admin.prova", password: "sbagliata-123" });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "credenziali non valide" });
  });

  test("utente inesistente: stesso 401 e stesso messaggio della password sbagliata", async () => {
    const res = await login({ username: "nessuno", password: PASSWORD });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "credenziali non valide" });
  });

  test("senza password: 400", async () => {
    const res = await login({ username: "admin.prova" });
    assert.equal(res.status, 400);
  });

  test("nel database non c'è nessuna password in chiaro", () => {
    const row = db.prepare("SELECT password_hash FROM operators WHERE username = ?").get("admin.prova") as { password_hash: string };
    assert.match(row.password_hash, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/i);
    assert.ok(!row.password_hash.includes(PASSWORD));
  });
});
