import { Router } from "express";
import * as reportsService from "../services/reports.service.js";

/**
 * Controller delle segnalazioni: traduce HTTP ↔ servizio. Riceve la richiesta,
 * delega al servizio e formatta la risposta; non contiene regole di dominio né
 * SQL. Gli errori applicativi risalgono al gestore centralizzato.
 */
export const reportsRouter = Router();

reportsRouter.get("/", (_req, res) => {
  res.json(reportsService.listReports());
});

reportsRouter.get("/:id", (req, res, next) => {
  try {
    res.json(reportsService.getReport(req.params.id));
  } catch (error) {
    next(error);
  }
});

reportsRouter.post("/", (req, res, next) => {
  try {
    res.status(201).json(reportsService.createReport(req.body));
  } catch (error) {
    next(error);
  }
});

reportsRouter.put("/:id", (req, res, next) => {
  try {
    res.json(reportsService.updateReport(req.params.id, req.body));
  } catch (error) {
    next(error);
  }
});
