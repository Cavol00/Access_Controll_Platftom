import type { RequestHandler } from "express";
import { findSession } from "../auth/sessions.js";
import { ForbiddenError, UnauthorizedError } from "../errors.js";
import type { Role } from "../types.js";

/**
 * Protegge una rotta per gli operatori della console (T07). L'operatore manda
 * il token ricevuto al login nell'header `Authorization: Bearer <token>`.
 * Token mancante, sconosciuto o scaduto risponde 401; token valido ma ruolo
 * non ammesso risponde 403. La sessione autorizzata resta in res.locals.
 */
export function requireRole(...allowed: Role[]): RequestHandler {
  return (req, res, next) => {
    const header = req.header("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const session = token ? findSession(token) : undefined;
    if (!session) {
      next(new UnauthorizedError("login richiesto"));
      return;
    }
    if (!allowed.includes(session.role)) {
      next(new ForbiddenError());
      return;
    }
    res.locals.operator = session;
    next();
  };
}
