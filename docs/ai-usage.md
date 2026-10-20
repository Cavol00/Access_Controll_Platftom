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

## Caso 5 — Integrazione di main nel refactor a livelli (PR #1)

**Data**: 20/10/2026 — **Chi**: Nicolò Florean

**Cosa abbiamo chiesto**: come risolvere i 5 conflitti tra la PR #1 e `main`
(.gitignore, README.md, docs/api.md, docs/dato-model.md, src/server.ts),
tenendo i livelli della PR e la separazione app.ts / server.ts di `main`.

**Cosa abbiamo ottenuto**: la scelta file per file — server.ts, README.md e
docs/api.md da main; app.ts riscritto con i router e il ramo SyntaxError;
.gitignore con le righe di entrambi; dato-model.md tenuto e data-model.md tolto.

**Cosa abbiamo verificato e come**:
- `npm test`: 10/10; `npx tsc --noEmit`: nessun errore
- `npm run build`: dist/ contiene controllers, services e repositories
- controprova: tolto il ramo SyntaxError da `src/app.ts`, `npm test` è passato a
  9 pass / 1 fail con "con JSON malformato risponde 400, non 500"; rimesso il
  blocco, 10/10

**Cosa abbiamo tenuto o corretto, e perché**: tenuto `dato-model.md`, che è la
versione di `main` e che il docente ha giudicato ben fatto (sostantivi scartati,
cosa va nel database), e tolto `data-model.md`, la nostra bozza che quelle parti
non conteneva. Su server.ts, README.md e docs/api.md abbiamo preso `main`,
perché Gianmarco li riscrive nei passi G2 e G3: fondere adesso sarebbe lavoro
buttato. app.ts invece è rimasto quello della PR, con i router e il ramo
SyntaxError, senza il quale un corpo non JSON diventerebbe un 500.

**Dati sensibili nei prompt**: nessuno.
