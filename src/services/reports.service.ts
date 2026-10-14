import { NotFoundError, ValidationError } from "../errors.js";
import * as reports from "../repositories/reports.repository.js";
import { ACCESS_RESULTS, type AccessResult, type Report, type ReportInput } from "../types.js";

/**
 * Servizio delle segnalazioni: contiene le regole del cliente e la
 * validazione degli input. Non conosce né HTTP né SQL: chiama il repository e
 * solleva errori applicativi (`ValidationError`, `NotFoundError`).
 */

export function listReports(): Report[] {
  return reports.findAll();
}

export function getReport(id: number | string): Report {
  const report = reports.findById(id);
  if (!report) throw new NotFoundError("Segnalazione non trovata");
  return report;
}

export function createReport(body: unknown): Report {
  return reports.create(parseInput(body));
}

export function updateReport(id: number | string, body: unknown): Report {
  const report = reports.update(id, parseInput(body));
  if (!report) throw new NotFoundError("Segnalazione non trovata");
  return report;
}

/** Valida il corpo di POST/PUT e lo normalizza in `ReportInput`. */
function parseInput(body: unknown): ReportInput {
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const { result, reason, badge_id, door_id, requested_at } = source;

  if (
    typeof result !== "string" ||
    !(ACCESS_RESULTS as readonly string[]).includes(result) ||
    typeof reason !== "string" ||
    reason.length === 0
  ) {
    throw new ValidationError("result e reason sono obbligatori");
  }

  const badgeId = badge_id === undefined || badge_id === null ? null : Number(badge_id);
  const doorId = door_id === undefined || door_id === null ? null : Number(door_id);

  if (
    (badgeId !== null && !reports.badgeExists(badgeId)) ||
    (doorId !== null && !reports.doorExists(doorId))
  ) {
    throw new ValidationError("badge_id o door_id non validi");
  }

  return {
    badge_id: badgeId,
    door_id: doorId,
    requested_at: requested_at === undefined || requested_at === null ? null : String(requested_at),
    result: result as AccessResult,
    reason,
  };
}
