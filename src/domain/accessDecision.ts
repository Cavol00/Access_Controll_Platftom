import type { Decision } from "../types.js";

/** I fatti sul badge che servono per decidere. */
export interface BadgeFacts {
  active: boolean;
  employeeActive: boolean;
}

/** I fatti su un'autorizzazione del badge sull'area del varco. */
export interface AuthorizationFacts {
  valid_from: string | null;
  valid_to: string | null;
  revoked_at: string | null;
}

/**
 * Motore di decisione: funzione pura, senza database né HTTP. Riceve i fatti
 * già letti (badge, varco, autorizzazioni del badge sull'area del varco) e
 * l'orario della richiesta, e restituisce sempre ACCESS_GRANTED o
 * ACCESS_DENIED. Nel dubbio nega (fail-closed): si concede solo se tutte le
 * condizioni sono verificate.
 */
export function decideAccess(
  badge: BadgeFacts | undefined,
  doorExists: boolean,
  authorizations: AuthorizationFacts[],
  at: Date,
): Decision {
  if (!badge) return { result: "ACCESS_DENIED", reason: "badge sconosciuto" };
  if (!doorExists) return { result: "ACCESS_DENIED", reason: "varco sconosciuto" };
  if (!badge.active) return { result: "ACCESS_DENIED", reason: "badge disattivato" };
  if (!badge.employeeActive) return { result: "ACCESS_DENIED", reason: "dipendente non attivo" };

  const valid = authorizations.some((a) => isValidAt(a, at));
  if (!valid) return { result: "ACCESS_DENIED", reason: "nessuna autorizzazione valida sull'area del varco" };

  return { result: "ACCESS_GRANTED", reason: "autorizzazione valida" };
}

/** Un'autorizzazione vale se è già iniziata, non è scaduta e non è stata revocata. */
function isValidAt(a: AuthorizationFacts, at: Date): boolean {
  const time = at.getTime();
  if (a.valid_from !== null && Date.parse(a.valid_from) > time) return false;
  if (a.valid_to !== null && Date.parse(a.valid_to) <= time) return false;
  if (a.revoked_at !== null && Date.parse(a.revoked_at) <= time) return false;
  return true;
}
