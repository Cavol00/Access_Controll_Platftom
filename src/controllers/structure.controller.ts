import { Router, type RequestHandler } from "express";
import { requireRole } from "../middleware/requireRole.js";
import * as structureService from "../services/structure.service.js";

/**
 * Controller della struttura fisica (T08): edifici, aree e varchi. Tutte le
 * rotte sono riservate all'amministratore sicurezza (RF2).
 */
export const structureRouter = Router();
const admin = requireRole("admin_sicurezza");

/** Esegue il gestore e passa ogni errore al gestore centralizzato. */
function handle(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    try {
      fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

structureRouter.get("/buildings", admin, (_req, res) => {
  res.json(structureService.listBuildings());
});
structureRouter.post("/buildings", admin, handle((req, res) => {
  res.status(201).json(structureService.createBuilding(req.body));
}));
structureRouter.delete("/buildings/:id", admin, handle((req, res) => {
  structureService.deleteBuilding(structureService.parseId(String(req.params.id)));
  res.status(204).end();
}));

structureRouter.get("/areas", admin, (_req, res) => {
  res.json(structureService.listAreas());
});
structureRouter.post("/areas", admin, handle((req, res) => {
  res.status(201).json(structureService.createArea(req.body));
}));
structureRouter.delete("/areas/:id", admin, handle((req, res) => {
  structureService.deleteArea(structureService.parseId(String(req.params.id)));
  res.status(204).end();
}));

structureRouter.get("/doors", admin, (_req, res) => {
  res.json(structureService.listDoors());
});
structureRouter.post("/doors", admin, handle((req, res) => {
  res.status(201).json(structureService.createDoor(req.body));
}));
structureRouter.delete("/doors/:id", admin, handle((req, res) => {
  structureService.deleteDoor(structureService.parseId(String(req.params.id)));
  res.status(204).end();
}));
