import { db } from "../db.js";
import type { Report, ReportInput } from "../types.js";

/**
 * Repository delle segnalazioni: è l'unico punto che conosce l'SQL e il nome
 * delle tabelle. Il resto del backend chiama queste funzioni, mai `db` diretto.
 */

const SELECT_REPORT = "SELECT id, badge_id, door_id, requested_at, result, reason FROM reports";

export function findAll(): Report[] {
  return db
    .prepare(`${SELECT_REPORT} ORDER BY requested_at DESC, id DESC`)
    .all() as unknown as Report[];
}

export function findById(id: number | string): Report | undefined {
  return db.prepare(`${SELECT_REPORT} WHERE id = ?`).get(id) as unknown as Report | undefined;
}

export function create(input: ReportInput): Report {
  const created = db
    .prepare(
      `INSERT INTO reports (badge_id, door_id, requested_at, result, reason)
       VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)`,
    )
    .run(input.badge_id, input.door_id, input.requested_at, input.result, input.reason);

  return findById(created.lastInsertRowid as number) as Report;
}

/** Aggiorna la segnalazione; ritorna `undefined` se l'id non esiste. */
export function update(id: number | string, input: ReportInput): Report | undefined {
  const updated = db
    .prepare(
      `UPDATE reports
       SET badge_id = ?, door_id = ?, requested_at = COALESCE(?, requested_at), result = ?, reason = ?
       WHERE id = ?`,
    )
    .run(input.badge_id, input.door_id, input.requested_at, input.result, input.reason, id);

  if (updated.changes === 0) return undefined;
  return findById(id);
}

/** Verifica dell'esistenza di una chiave esterna: badge. */
export function badgeExists(id: number): boolean {
  return db.prepare("SELECT 1 FROM badges WHERE id = ?").get(id) !== undefined;
}

/** Verifica dell'esistenza di una chiave esterna: varco. */
export function doorExists(id: number): boolean {
  return db.prepare("SELECT 1 FROM doors WHERE id = ?").get(id) !== undefined;
}
