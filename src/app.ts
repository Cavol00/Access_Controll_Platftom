import express, { type ErrorRequestHandler } from "express";
import { reportsRouter } from "./controllers/reports.controller.js";
import { AppError } from "./errors.js";

/**
 * Crea l'app: monta i router e il gestore degli errori centralizzato.
 * Non si mette in ascolto: lo fa server.ts, così i test possono importarla.
 */
export const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/segnalazioni", reportsRouter);

/**
 * Un errore applicativo diventa il suo status; un JSON malformato è un 400;
 * qualunque altro errore è un 500, senza dettagli interni nella risposta.
 */
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: "Corpo della richiesta non è JSON valido" });
    return;
  }
  console.error("Errore non gestito:", error);
  res.status(500).json({ error: "Errore interno del server" });
};
app.use(errorHandler);