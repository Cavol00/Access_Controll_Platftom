import { before, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { DatabaseSync } from "node:sqlite";

process.env.DB_PATH = ":memory:";

let db: DatabaseSync;

before(async () => {
  db = (await import("../src/db.js")).db;
  db.exec(`
    INSERT INTO buildings (id, name) VALUES (1, 'Sede di prova');
    INSERT INTO areas (id, building_id, name) VALUES (1, 1, 'Laboratorio');
    INSERT INTO employees (id, name, email) VALUES (1, 'Dipendente A', 'a@example.test');
    INSERT INTO badges (id, code, employee_id) VALUES (1, 'BADGE-OK', 1);
    INSERT INTO authorizations (id, badge_id, area_id) VALUES (1, 1, 1);
  `);
});

describe("registro delle modifiche alle autorizzazioni", () => {
  test("registra autore e timestamp di una modifica", () => {
    db.prepare(
      "INSERT INTO authorization_changes (authorization_id, action, changed_by) VALUES (1, 'CREATED', 'admin.prova')",
    ).run();
    const row = db.prepare(
      "SELECT action, changed_by, changed_at FROM authorization_changes",
    ).get() as { action: string; changed_by: string; changed_at: string };

    assert.equal(row.action, "CREATED");
    assert.equal(row.changed_by, "admin.prova");
    assert.match(row.changed_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test("rifiuta un'azione diversa da CREATED o REVOKED", () => {
    assert.throws(
      () => db.exec("INSERT INTO authorization_changes (authorization_id, action, changed_by) VALUES (1, 'DELETED', 'x')"),
      /CHECK constraint failed/,
    );
  });

  test("rifiuta una riga senza autore", () => {
    assert.throws(
      () => db.exec("INSERT INTO authorization_changes (authorization_id, action) VALUES (1, 'REVOKED')"),
      /NOT NULL constraint failed: authorization_changes.changed_by/,
    );
  });

  test("rifiuta un'autorizzazione inesistente", () => {
    assert.throws(
      () => db.exec("INSERT INTO authorization_changes (authorization_id, action, changed_by) VALUES (999, 'REVOKED', 'x')"),
      /FOREIGN KEY constraint failed/,
    );
  });

  test("rifiuta UPDATE e DELETE del registro", () => {
    assert.throws(
      () => db.exec("UPDATE authorization_changes SET changed_by = 'altro'"),
      /il registro delle modifiche non è modificabile/,
    );
    assert.throws(
      () => db.exec("DELETE FROM authorization_changes"),
      /il registro delle modifiche non è modificabile/,
    );
  });
});
