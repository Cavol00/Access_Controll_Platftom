export const ACCESS_RESULTS = ["ACCESS_GRANTED", "ACCESS_DENIED"] as const;

export type AccessResult = (typeof ACCESS_RESULTS)[number];

/** Riga dello storico come la espone l'API (DTO). */
export interface AccessEvent {
  id: number;
  badge_code: string;
  door_code: string;
  area_id: number | null;
  requested_at: string;
  result: AccessResult;
  reason: string;
  recorded_at: string;
}

/** Quello che il lettore badge invia: solo badge, varco e, se vuole, l'orario. */
export interface AccessRequest {
  badge_code: string;
  door_code: string;
  requested_at: Date;
}

/** Esito calcolato dal server, con la motivazione da registrare. */
export interface Decision {
  result: AccessResult;
  reason: string;
}
