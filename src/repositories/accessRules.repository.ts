import { db } from "../db.js";
import type { AuthorizationFacts, BadgeFacts } from "../domain/accessDecision.js";

/**
 * Letture che servono al motore di decisione: badge, varco e autorizzazioni.
 * Solo SELECT: questo repository non modifica niente.
 */

export interface BadgeRow extends BadgeFacts {
  id: number;
}

export function findBadgeByCode(code: string): BadgeRow | undefined {
  const row = db
    .prepare(
      `SELECT b.id, b.active, e.active AS employee_active
       FROM badges b JOIN employees e ON e.id = b.employee_id
       WHERE b.code = ?`,
    )
    .get(code) as { id: number; active: number; employee_active: number } | undefined;
  if (!row) return undefined;
  return { id: row.id, active: row.active === 1, employeeActive: row.employee_active === 1 };
}

export function findDoorByCode(code: string): { id: number; area_id: number } | undefined {
  return db.prepare("SELECT id, area_id FROM doors WHERE code = ?").get(code) as
    | { id: number; area_id: number }
    | undefined;
}

export function findAuthorizations(badgeId: number, areaId: number): AuthorizationFacts[] {
  return db
    .prepare("SELECT valid_from, valid_to, revoked_at FROM authorizations WHERE badge_id = ? AND area_id = ?")
    .all(badgeId, areaId) as unknown as AuthorizationFacts[];
}
