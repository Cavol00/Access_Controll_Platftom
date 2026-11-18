import { Router } from "express";
import { requireRole } from "../middleware/requireRole.js";
import * as statusService from "../services/status.service.js";

/**
 * Stato dettagliato del sistema (T17), riservato agli amministratori.
 * Il controllo pubblico resta GET /health, in app.ts.
 */
export const statusRouter = Router();

statusRouter.get("/", requireRole("admin_tecnico", "admin_sicurezza"), (_req, res) => {
  res.json(statusService.getStatus());
});
