import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";
import { requireSimulatorKey } from "../middleware/simulatorKey.js";
import * as accessEventsService from "../services/accessEvents.service.js";

/**
 * Controller dello storico accessi: traduce HTTP ↔ servizio. Solo GET e POST:
 * lo storico non ha PUT, PATCH né DELETE. La POST arriva dal lettore badge e
 * richiede la sua chiave (T10); la GET la usano gli operatori e richiede il
 * login con un ruolo ammesso (T07). Il responsabile di area arriverà con T18,
 * insieme al filtro sulle sue aree.
 */
export const accessEventsRouter = Router();

accessEventsRouter.get("/", requireRole("admin_sicurezza"), (_req, res) => {
  res.json(accessEventsService.listEvents());
});

accessEventsRouter.post("/", requireSimulatorKey, (req, res, next) => {
  try {
    res.status(201).json(accessEventsService.requestAccess(req.body));
  } catch (error) {
    next(error);
  }
});
