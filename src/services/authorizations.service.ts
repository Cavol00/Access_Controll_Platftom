import { ConflictError, ValidationError } from "../errors.js";
import * as authorizations from "../repositories/authorizations.repository.js";

/**
 * Servizio delle autorizzazioni (T12): un badge viene autorizzato su un'area,
 * con una data di inizio e una di fine facoltative. Chi la crea viene scritto
 * nel registro delle modifiche.
 */

export const listAuthorizations = authorizations.listAuthorizations;

function optionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} deve essere una data ISO 8601`);
  return date.toISOString();
}

export function createAuthorization(body: unknown, changedBy: string): authorizations.Authorization {
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const { badge_id, area_id } = source;
  if (typeof badge_id !== "number" || !Number.isInteger(badge_id) ||
      typeof area_id !== "number" || !Number.isInteger(area_id)) {
    throw new ValidationError("badge_id e area_id sono obbligatori e devono essere numeri interi");
  }
  const validFrom = optionalDate(source.valid_from, "valid_from");
  const validTo = optionalDate(source.valid_to, "valid_to");
  if (validFrom && validTo && validTo <= validFrom) {
    throw new ValidationError("valid_to deve essere successiva a valid_from");
  }
  if (!authorizations.badgeExists(badge_id)) throw new ValidationError("badge_id non corrisponde a un badge");
  if (!authorizations.areaExists(area_id)) throw new ValidationError("area_id non corrisponde a un'area");
  if (authorizations.pairExists(badge_id, area_id)) {
    throw new ConflictError("il badge ha già un'autorizzazione su quest'area");
  }
  return authorizations.createWithChange(badge_id, area_id, validFrom, validTo, changedBy);
}
