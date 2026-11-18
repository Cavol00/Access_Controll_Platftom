import { db } from "../db.js";

/** Letture per lo stato del sistema (T17): il database risponde? quando è arrivato l'ultimo evento? */

export function databaseReachable(): boolean {
  try {
    db.prepare("SELECT 1").get();
    return true;
  } catch {
    return false;
  }
}

export function lastEventAt(): string | null {
  const row = db.prepare("SELECT MAX(recorded_at) AS last FROM access_events").get() as { last: string | null };
  return row.last;
}
