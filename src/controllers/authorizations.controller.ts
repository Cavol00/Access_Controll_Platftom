import { Router } from "express";
import type { Session } from "../auth/sessions.js";
import { requireRole } from "../middleware/requireRole.js";
import * as authorizationsService from "../services/authorizations.service.js";

/**
 * Controller delle autorizzazioni (T12, T13), riservato all'amministratore
 * sicurezza. Il responsabile di area arriverà con T19, limitato alle sue aree.
 */

export const authorizationsRouter = Router();

const admin = requireRole("admin_sicurezza");

authorizationsRouter.get("/", admin, (_req, res) => {
  res.json(authorizationsService.listAuthorizations());
});

authorizationsRouter.post("/", admin, (req, res, next) => {
  try {
    // requireRole ha messo in res.locals.operator la sessione di chi ha fatto il login.
    const operator = res.locals.operator as Session;
    res.status(201).json(authorizationsService.createAuthorization(req.body, operator.username));
  } catch (error) {
    next(error);
  }
});

authorizationsRouter.get("/changes", admin, (_req, res) => {
  res.json(authorizationsService.listChanges());
});

authorizationsRouter.post("/:id/revoke", admin, (req, res, next) => {
  try {
    const operator = res.locals.operator as Session;
    res.json(authorizationsService.revokeAuthorization(Number(req.params.id), operator.username));
  } catch (error) {
    next(error);
  }
});
