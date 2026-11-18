import { db } from "../db.js";

/**
 * Repository delle autorizzazioni (T12, T13). Ogni creazione e ogni revoca
 * scrive anche la sua riga nel registro delle modifiche
 * (authorization_changes), nella stessa transazione: o succedono entrambe,
 * o nessuna.
 */

export interface Authorization {
  id: number;
  badge_id: number;
  area_id: number;
  valid_from: string | null;
  valid_to: string | null;
  revoked_at: string | null;
}

export interface AuthorizationChange {
  id: number;
  authorization_id: number;
  action: "CREATED" | "REVOKED";
  changed_by: string;
  changed_at: string;
}

const SELECT_AUTHORIZATION = "SELECT id, badge_id, area_id, valid_from, valid_to, revoked_at FROM authorizations";

export function listAuthorizations(): Authorization[] {
  return db.prepare(`${SELECT_AUTHORIZATION} ORDER BY id`).all() as unknown as Authorization[];
}

export function findById(id: number): Authorization | undefined {
  return db.prepare(`${SELECT_AUTHORIZATION} WHERE id = ?`).get(id) as unknown as Authorization | undefined;
}

export function listChanges(): AuthorizationChange[] {
  return db.prepare("SELECT id, authorization_id, action, changed_by, changed_at FROM authorization_changes ORDER BY id")
    .all() as unknown as AuthorizationChange[];
}

export function badgeExists(id: number): boolean {
  return db.prepare("SELECT 1 FROM badges WHERE id = ?").get(id) !== undefined;
}

export function areaExists(id: number): boolean {
  return db.prepare("SELECT 1 FROM areas WHERE id = ?").get(id) !== undefined;
}

export function pairExists(badgeId: number, areaId: number): boolean {
  return db.prepare("SELECT 1 FROM authorizations WHERE badge_id = ? AND area_id = ?").get(badgeId, areaId) !== undefined;
}

export function createWithChange(
  badgeId: number,
  areaId: number,
  validFrom: string | null,
  validTo: string | null,
  changedBy: string,
): Authorization {
  db.exec("BEGIN");
  try {
    const created = db
      .prepare("INSERT INTO authorizations (badge_id, area_id, valid_from, valid_to) VALUES (?, ?, ?, ?)")
      .run(badgeId, areaId, validFrom, validTo);
    const id = Number(created.lastInsertRowid);
    db.prepare("INSERT INTO authorization_changes (authorization_id, action, changed_by) VALUES (?, 'CREATED', ?)")
      .run(id, changedBy);
    db.exec("COMMIT");
    return db.prepare(`${SELECT_AUTHORIZATION} WHERE id = ?`).get(id) as unknown as Authorization;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function revokeWithChange(id: number, changedBy: string): Authorization {
  db.exec("BEGIN");
  try {
    db.prepare("UPDATE authorizations SET revoked_at = ? WHERE id = ?").run(new Date().toISOString(), id);
    db.prepare("INSERT INTO authorization_changes (authorization_id, action, changed_by) VALUES (?, 'REVOKED', ?)")
      .run(id, changedBy);
    db.exec("COMMIT");
    return findById(id) as Authorization;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
