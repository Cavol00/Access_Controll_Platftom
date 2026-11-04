/**
 * Errori applicativi, distinti per responsabilità:
 * - `ValidationError` → l'input non va bene (400);
 * - `UnauthorizedError` → manca una credenziale valida (401);
 * - `ForbiddenError` → la credenziale c'è ma il ruolo non basta (403);
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

export class UnauthorizedError extends AppError {
  constructor(message = "Credenziali mancanti o non valide") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Operazione non permessa al tuo ruolo") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Risorsa non trovata") {
    super(404, message);
  }
}
