export const ACCESS_RESULTS = ["ACCESS_GRANTED", "ACCESS_DENIED"] as const;

export type AccessResult = (typeof ACCESS_RESULTS)[number];

/** Segnalazione come la espone l'API (DTO). */
export interface Report {
  id: number;
  badge_id: number | null;
  door_id: number | null;
  requested_at: string;
  result: AccessResult;
  reason: string;
}

/** Dati accettati in creazione (POST) e sostituzione (PUT). */
export interface ReportInput {
  badge_id: number | null;
  door_id: number | null;
  requested_at: string | null;
  result: AccessResult;
  reason: string;
}
