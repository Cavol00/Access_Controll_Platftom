import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { config } from "../config.js";
import { UnauthorizedError } from "../errors.js";

/**
 * Lascia passare solo le richieste che arrivano dal lettore badge (oggi il
 * simulatore): devono avere l'header `X-API-Key` uguale alla chiave in .env.
 * Il confronto usa timingSafeEqual, che impiega lo stesso tempo qualunque sia
 * il punto in cui le due chiavi differiscono, così il tempo di risposta non
 * aiuta a indovinare la chiave un carattere alla volta.
 */
export const requireSimulatorKey: RequestHandler = (req, _res, next) => {
  const received = Buffer.from(req.header("X-API-Key") ?? "");
  const expected = Buffer.from(config.simulatorApiKey);
  const valid = received.length === expected.length && timingSafeEqual(received, expected);
  next(valid ? undefined : new UnauthorizedError("chiave del lettore badge mancante o non valida"));
};
