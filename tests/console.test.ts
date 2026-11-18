import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// Database in memoria, come negli altri test: data/ non viene toccato.
process.env.DB_PATH = ":memory:";
process.env.SIMULATOR_API_KEY = "chiave-di-test";
let server: Server;
let baseUrl: string;

before(async () => {
  const { app } = await import("../src/app.js");
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

describe("Console web (#67)", () => {
  test("GET / serve la pagina HTML con il form di login", async () => {
    const res = await fetch(baseUrl + "/");
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /text\/html/);
    const html = await res.text();
    assert.match(html, /id="form-login"/);
    assert.match(html, /<script src="app.js">/);
  });

  test("lo script e il foglio di stile della pagina vengono serviti", async () => {
    const js = await fetch(baseUrl + "/app.js");
    assert.equal(js.status, 200);
    assert.match(js.headers.get("content-type") ?? "", /javascript/);
    const css = await fetch(baseUrl + "/style.css");
    assert.equal(css.status, 200);
    assert.match(css.headers.get("content-type") ?? "", /text\/css/);
  });

  test("la pagina non apre lo storico: senza login l'API risponde 401", async () => {
    const res = await fetch(baseUrl + "/api/access-events");
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: "login richiesto" });
  });

  test("i file statici non nascondono il 404 JSON delle rotte inesistenti", async () => {
    const res = await fetch(baseUrl + "/api/non-esiste");
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "Risorsa non trovata" });
  });
});
