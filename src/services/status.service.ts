import * as status from "../repositories/status.repository.js";

/**
 * Stato dettagliato del sistema (T17, voce 10): serve all'amministratore
 * tecnico per capire se un problema di comunicazione dipende dal database o
 * dal simulatore che non manda più richieste.
 */
export interface SystemStatus {
  backend: "attivo";
  database: "raggiungibile" | "non raggiungibile";
  last_event_at: string | null;
  checked_at: string;
}

export function getStatus(): SystemStatus {
  const reachable = status.databaseReachable();
  return {
    backend: "attivo",
    database: reachable ? "raggiungibile" : "non raggiungibile",
    last_event_at: reachable ? status.lastEventAt() : null,
    checked_at: new Date().toISOString(),
  };
}
