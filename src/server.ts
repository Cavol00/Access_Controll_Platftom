import express, { type ErrorRequestHandler } from "express";
import { reportsRouter } from "./controllers/reports.controller.js";
import { AppError } from "./errors.js";

/**
 * Entrypoint: monta i router, collega il gestore degli errori centralizzato e
 * avvia il server. La logica sta nei livelli sottostanti.
 */
const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/segnalazioni", reportsRouter);

/** Un errore applicativo diventa il suo status; qualunque altro è un 500. */
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  console.error("Errore non gestito:", error);
  res.status(500).json({ error: "Errore interno del server" });
};
app.use(errorHandler);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
