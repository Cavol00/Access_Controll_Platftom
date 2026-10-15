import express from "express";
import type { NextFunction, Request, Response } from "express";
import { db } from "./db.js";

export const app = express();
app.use(express.json());

app.get("/api/segnalazioni", (_req, res) => {
  const rows = db.prepare("SELECT * FROM reports ORDER BY requested_at DESC, id DESC").all();
  res.json(rows);
});

app.post("/api/segnalazioni", (req, res) => {
  const { badge_id, door_id, result, reason, requested_at } = req.body;
  if (!result || !reason || !["ACCESS_GRANTED", "ACCESS_DENIED"].includes(result)) {
    return res.status(400).json({ error: "result e reason sono obbligatori" });
  }
  try {
    const statement = db.prepare(`
      INSERT INTO reports (badge_id, door_id, requested_at, result, reason)
      VALUES (?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)
    `);
    const created = statement.run(badge_id ?? null, door_id ?? null, requested_at ?? null, result, reason);
    return res.status(201).json(db.prepare("SELECT * FROM reports WHERE id = ?").get(created.lastInsertRowid));
  } catch {
    return res.status(400).json({ error: "badge_id o door_id non validi" });
  }
});

app.put("/api/segnalazioni/:id", (req, res) => {
  const { result, reason, requested_at, badge_id, door_id } = req.body;
  if (!result || !reason || !["ACCESS_GRANTED", "ACCESS_DENIED"].includes(result)) {
    return res.status(400).json({ error: "result e reason sono obbligatori" });
  }
  const updated = db.prepare(`
    UPDATE reports SET badge_id = ?, door_id = ?, requested_at = COALESCE(?, requested_at), result = ?, reason = ?
    WHERE id = ?
  `).run(badge_id ?? null, door_id ?? null, requested_at ?? null, result, reason, req.params.id);
  if (!updated.changes) return res.status(404).json({ error: "Segnalazione non trovata" });
  return res.json(db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id));
});

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Gestore degli errori: deve stare dopo tutte le rotte e avere 4 parametri,
// altrimenti Express non lo riconosce come tale.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // JSON malformato nel corpo: è un errore del client, non del server.
  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: "Corpo della richiesta non è JSON valido" });
  }
  // Il dettaglio resta nel log del server, al client non arrivano SQL o stack trace.
  console.error(err);
  return res.status(500).json({ error: "Errore interno del server" });
});