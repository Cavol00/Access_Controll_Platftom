import { Router } from "express";
import * as accessEventsService from "../services/accessEvents.service.js";

/**
 * Controller dello storico accessi: traduce HTTP ↔ servizio. Solo GET e POST:
 * lo storico non ha PUT, PATCH né DELETE.
 */
export const accessEventsRouter = Router();

accessEventsRouter.get("/", (_req, res) => {
  res.json(accessEventsService.listEvents());
});

accessEventsRouter.post("/", (req, res, next) => {
  try {
    res.status(201).json(accessEventsService.requestAccess(req.body));
  } catch (error) {
    next(error);
  }
});
