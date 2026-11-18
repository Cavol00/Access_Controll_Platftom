import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

// Database in memoria e chiave finta, come negli altri test.
process.env.DB_PATH = ":memory:";
process.env.SIMULATOR_API_KEY = "chiave-di-test";

let server: Server;
let baseUrl: string;
let adminToken: string;
let tecnicoToken: string;

before(async () => {
  const { app } = await import("../src/app.js");
  const { hashPassword } = await import("../src/auth/passwords.js");
  const operators = await import("../src/repositories/operators.repository.js");
  operators.create("admin.prova", hashPassword("password-di-prova"), "admin_sicurezza");
  operators.create("tecnico.prova", hashPassword("password-di-prova"), "admin_tecnico");

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

function call(method: string, path: string, body?: unknown, token: string = adminToken) {
  return fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("edifici, aree e varchi (T08)", () => {
  let buildingId: number;
  let areaId: number;
  let doorId: number;

  test("si crea un edificio: 201", async () => {
    const res = await call("POST", "/api/buildings", { name: "Sede di prova", address: "Via Prova 1" });
    assert.equal(res.status, 201);
    buildingId = (await res.json()).id;
    assert.equal(typeof buildingId, "number");
  });

  test("si crea un'area nell'edificio: 201", async () => {
    const res = await call("POST", "/api/areas", { building_id: buildingId, name: "Laboratorio" });
    assert.equal(res.status, 201);
    areaId = (await res.json()).id;
  });

  test("si crea un varco nell'area: 201", async () => {
    const res = await call("POST", "/api/doors", { area_id: areaId, code: "VARCO-NUOVO" });
    assert.equal(res.status, 201);
    doorId = (await res.json()).id;
  });

  test("le tre risorse si elencano", async () => {
    for (const path of ["/api/buildings", "/api/areas", "/api/doors"]) {
      const res = await call("GET", path);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).length, 1);
    }
  });

  test("un varco su un'area che non esiste viene rifiutato: 400", async () => {
    const res = await call("POST", "/api/doors", { area_id: 999, code: "VARCO-ORFANO" });
    assert.equal(res.status, 400);
  });

  test("un'area senza nome viene rifiutata: 400", async () => {
    const res = await call("POST", "/api/areas", { building_id: buildingId });
    assert.equal(res.status, 400);
  });

  test("un secondo varco con lo stesso codice: 409", async () => {
    const res = await call("POST", "/api/doors", { area_id: areaId, code: "VARCO-NUOVO" });
    assert.equal(res.status, 409);
  });

  test("una richiesta di accesso sul varco appena creato viene valutata, non respinta come varco sconosciuto", async () => {
    const res = await fetch(baseUrl + "/api/access-events", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": "chiave-di-test" },
      body: JSON.stringify({ badge_code: "BADGE-QUALUNQUE", door_code: "VARCO-NUOVO" }),
    });
    const event = await res.json();
    assert.equal(event.area_id, areaId);
    assert.notEqual(event.reason, "varco sconosciuto");
  });

  test("un edificio con aree non si elimina: 409", async () => {
    const res = await call("DELETE", `/api/buildings/${buildingId}`);
    assert.equal(res.status, 409);
  });

  test("un'area con varchi non si elimina: 409", async () => {
    const res = await call("DELETE", `/api/areas/${areaId}`);
    assert.equal(res.status, 409);
  });

  test("un'area che compare nello storico non si elimina, anche senza varchi: 409", async () => {
    assert.equal((await call("DELETE", `/api/doors/${doorId}`)).status, 204);
    const res = await call("DELETE", `/api/areas/${areaId}`);
    assert.equal(res.status, 409);
  });

  test("senza varchi né storico si eliminano nell'ordine area ed edificio: 204", async () => {
    const building = await (await call("POST", "/api/buildings", { name: "Sede da eliminare" })).json();
    const area = await (await call("POST", "/api/areas", { building_id: building.id, name: "Area da eliminare" })).json();
    const door = await (await call("POST", "/api/doors", { area_id: area.id, code: "VARCO-DA-ELIMINARE" })).json();
    assert.equal((await call("DELETE", `/api/doors/${door.id}`)).status, 204);
    assert.equal((await call("DELETE", `/api/areas/${area.id}`)).status, 204);
    assert.equal((await call("DELETE", `/api/buildings/${building.id}`)).status, 204);
  });

  test("eliminare una risorsa che non esiste: 404", async () => {
    const res = await call("DELETE", "/api/doors/999");
    assert.equal(res.status, 404);
  });
});

describe("protezione per ruolo (T08)", () => {
  test("senza login: 401", async () => {
    const res = await fetch(baseUrl + "/api/buildings");
    assert.equal(res.status, 401);
  });

  test("con un ruolo non ammesso (admin_tecnico): 403", async () => {
    const res = await call("POST", "/api/buildings", { name: "Non permesso" }, tecnicoToken);
    assert.equal(res.status, 403);
  });
});
