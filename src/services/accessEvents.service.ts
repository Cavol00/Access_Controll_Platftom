import { decideAccess } from "../domain/accessDecision.js";
import { ValidationError } from "../errors.js";
import * as events from "../repositories/accessEvents.repository.js";
import * as rules from "../repositories/accessRules.repository.js";
import type { AccessEvent, AccessRequest } from "../types.js";

/**
 * Servizio dello storico accessi: valida la richiesta, legge i fatti dal
 * database, fa decidere al motore e registra l'esito. L'esito non arriva mai
 * dal client: anche se il corpo contiene un campo `result`, viene ignorato.
 */

export function listEvents(): AccessEvent[] {
  return events.findAll();
}

export function requestAccess(body: unknown): AccessEvent {
  const request = parseRequest(body);

  const badge = rules.findBadgeByCode(request.badge_code);
  const door = rules.findDoorByCode(request.door_code);
  const authorizations = badge && door ? rules.findAuthorizations(badge.id, door.area_id) : [];

  const decision = decideAccess(badge, door !== undefined, authorizations, request.requested_at);
  return events.insert(request.badge_code, request.door_code, door?.area_id ?? null, request.requested_at, decision);
}

/** Valida il corpo della POST: servono badge e varco, l'orario è facoltativo. */
function parseRequest(body: unknown): AccessRequest {
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const { badge_code, door_code, requested_at } = source;

  if (
    typeof badge_code !== "string" || badge_code.trim() === "" ||
    typeof door_code !== "string" || door_code.trim() === ""
  ) {
    throw new ValidationError("badge_code e door_code sono obbligatori");
  }

  let at = new Date();
  if (requested_at !== undefined && requested_at !== null) {
    at = new Date(String(requested_at));
    if (Number.isNaN(at.getTime())) {
      throw new ValidationError("requested_at deve essere una data ISO 8601");
    }
  }

  return { badge_code: badge_code.trim(), door_code: door_code.trim(), requested_at: at };
}
