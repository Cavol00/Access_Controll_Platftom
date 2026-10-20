## Uso dell'AI — Access Control Platform

Ogni uso significativo dell'AI va registrato qui da chi lo ha fatto: cosa ha
chiesto, cosa ha ottenuto, come lo ha verificato, cosa ha tenuto o corretto.
Un caso senza verifica descritta non conta.

## Caso 4 — Test automatici delle API (laboratorio 4, punto 4)

**Data**: 14/10/2026

**Cosa abbiamo chiesto**: come rendere testabile `server.ts` e quali test
scrivere per ogni endpoint (happy path, 400, 404, 500).

**Cosa abbiamo ottenuto**: la separazione `src/app.ts` / `src/server.ts`, un
gestore degli errori JSON (400 per JSON malformato, 500 per errori non
gestiti), 10 test in `tests/segnalazioni.test.ts` con database in memoria e
porta effimera.

**Cosa abbiamo verificato e come**:
- `npm test`: 10/10 passati
- `npm run build && npm start`: il server si avvia come prima sulla porta di `.env`
- prova manuale: `curl -X POST .../api/segnalazioni -H 'Content-Type: application/json' -d '{rotto'`
  → `400` con `{"error":"Corpo della richiesta non è JSON valido"}`
- controprova: abbiamo cambiato a mano un `assert.equal(res.status, 404)` in
  `405` e verificato che `npm test` fallisse, poi l'abbiamo rimesso

**Cosa abbiamo tenuto o corretto, e perché**: *(da completare)*

**Dati sensibili nei prompt**: nessuno.
