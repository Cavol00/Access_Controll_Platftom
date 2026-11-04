import { db } from "../db.js";
import type { AccessEvent, Decision } from "../types.js";

/**
 * Repository dello storico accessi. Espone solo inserimento e lettura: non
 * esiste una funzione di modifica o cancellazione, e il database la
 * rifiuterebbe comunque (trigger in schema.sql).
 */

const SELECT_EVENT =
  "SELECT id, badge_code, door_code, area_id, requested_at, result, reason, recorded_at FROM access_events";

export function findAll(): AccessEvent[] {
  return db.prepare(`${SELECT_EVENT} ORDER BY requested_at DESC, id DESC`).all() as unknown as AccessEvent[];
}

export function insert(
  badgeCode: string,
  doorCode: string,
  areaId: number | null,
  requestedAt: Date,
  decision: Decision,
): AccessEvent {
  const created = db
    .prepare(
      `INSERT INTO access_events (badge_code, door_code, area_id, requested_at, result, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(badgeCode, doorCode, areaId, requestedAt.toISOString(), decision.result, decision.reason);
  return db.prepare(`${SELECT_EVENT} WHERE id = ?`).get(created.lastInsertRowid) as unknown as AccessEvent;
}
