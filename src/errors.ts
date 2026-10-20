/**
 * Errori applicativi, distinti per responsabilità:
 * - `ValidationError` → l'input non va bene (400);
 * - `NotFoundError`   → la risorsa richiesta non esiste (404).
 *
 * Ogni errore porta con sé lo status HTTP, così il controller non deve
 * indovinarlo e l'errore non viene mai ingoiato in silenzio.
 */

export class AppError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = "Dati della richiesta non validi") {
    super(400, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Risorsa non trovata") {
    super(404, message);
  }
}
