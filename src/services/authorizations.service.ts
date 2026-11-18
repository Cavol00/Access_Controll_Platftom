import { ConflictError, NotFoundError, ValidationError } from "../errors.js";
import * as authorizations from "../repositories/authorizations.repository.js";

/**
 * Servizio delle autorizzazioni (T12, T13): un badge viene autorizzato su
 * un'area e l'autorizzazione può essere revocata senza cancellarla. Creazione
 * e revoca scrivono chi le ha fatte nel registro delle modifiche.
 */

export const listAuthorizations = authorizations.listAuthorizations;
export const listChanges = authorizations.listChanges;

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

export function revokeAuthorization(id: number, changedBy: string): authorizations.Authorization {
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("id deve essere un numero intero positivo");
  const authorization = authorizations.findById(id);
  if (!authorization) throw new NotFoundError("autorizzazione non trovata");
  if (authorization.revoked_at !== null) throw new ConflictError("l'autorizzazione è già revocata");
  return authorizations.revokeWithChange(id, changedBy);
}
