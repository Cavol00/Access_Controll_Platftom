import { Router } from "express";
import { requireSimulatorKey } from "../middleware/simulatorKey.js";
import * as accessEventsService from "../services/accessEvents.service.js";

/**
 * Controller dello storico accessi: traduce HTTP ↔ servizio. Solo GET e POST:
 * lo storico non ha PUT, PATCH né DELETE. La POST arriva dal lettore badge e
 * richiede la sua chiave (T10).
 */
export const accessEventsRouter = Router();

accessEventsRouter.get("/", (_req, res) => {
  res.json(accessEventsService.listEvents());
});

accessEventsRouter.post("/", requireSimulatorKey, (req, res, next) => {
  try {
    res.status(201).json(accessEventsService.requestAccess(req.body));
  } catch (error) {
    next(error);
  }
});
