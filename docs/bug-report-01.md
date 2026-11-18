# Bug report — 01

| Progetto | Team / cliente | Data | Versione | Autore |
|---|---|---|---|---|
| Access Control Platform | LeCucciole / cliente simulato (docente) | 18/11/2026 | v0.1 | Gianmarco Tonelli |

Issue: #68.

## Sintomo

Nella stessa risposta dell'API gli orari arrivano in due formati diversi:

- quelli calcolati dal server in JavaScript (`requested_at`, `revoked_at`, `checked_at`) sono in ISO 8601 con fuso: `2026-11-18T12:54:34.664Z`;
- quelli scritti dal database (`recorded_at` dello storico, `changed_at` del registro delle modifiche, e quindi `last_event_at` di `/api/status`) non hanno fuso: `2026-11-18 12:54:34`.

Un client JavaScript, per esempio la console web, legge il secondo formato come **ora locale**. In Italia (UTC+1) un evento risulta così registrato un'ora **prima** di essere stato richiesto. Anche confrontare o ordinare questi orari come testo dà risultati sbagliati: `"2026-11-18 23:00:00" < "2026-11-18T01:00:00.000Z"` è vero, perché lo spazio viene prima della `T`.

## Passi per riprodurre

Da `main` (commit `f168451`), con un database nuovo e un operatore `admin_sicurezza`:

1. `POST /api/access-events` con header `X-API-Key` e corpo `{"badge_code":"BADGE-X","door_code":"VARCO-X"}`.
2. La risposta contiene:
   `"requested_at":"2026-11-18T12:54:34.664Z"` e `"recorded_at":"2026-11-18 12:54:34"`.
3. `GET /api/status` (con login) risponde:
   `"last_event_at":"2026-11-18 12:54:34","checked_at":"2026-11-18T12:54:34.687Z"`.
4. `POST /api/authorizations` e poi `POST /api/authorizations/1/revoke`, quindi `GET /api/authorizations/changes`:
   `"changed_at":"2026-11-18 12:54:34"`, mentre la revoca ha `"revoked_at":"2026-11-18T12:54:34.728Z"`.
5. In un client con fuso Europe/Rome, `new Date("2026-11-18 12:54:34").toISOString()` dà `2026-11-18T11:54:34.000Z`: un'ora prima di `requested_at`.

Si riproduce sempre, non solo a volte.

## Causa

In `schema.sql` le due colonne prendono il valore predefinito da SQLite:

- riga 56: `recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`;
- riga 79: `changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`.

`CURRENT_TIMESTAMP` restituisce l'ora UTC nel formato `YYYY-MM-DD HH:MM:SS`, senza la `T` e senza la `Z`. Chi lo legge non può sapere che è UTC. Gli altri orari invece li scrive il codice con `Date.toISOString()` (per esempio `accessEvents.repository.ts`, `requestedAt.toISOString()`), che produce ISO 8601 con la `Z`.

C'era anche un test che fissava il formato sbagliato come se fosse quello giusto: `tests/authorization-changes.test.ts` controllava `changed_at` con `/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/`.

## Correzione

In `schema.sql` il valore predefinito delle due colonne diventa `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`, che produce esattamente il formato di `toISOString()`, millisecondi compresi. Il test che fissava il vecchio formato è stato aggiornato. Il test di regressione `tests/orari.test.ts` impedisce che il bug torni.

## Test aggiunto

| Test | Percorso | Verifica |
|---|---|---|
| recorded_at dello storico è ISO 8601 UTC, come requested_at | `tests/orari.test.ts` | formato con `T` e `Z`, e meno di 5 secondi da `requested_at` |
| last_event_at dello stato è ISO 8601 UTC, come checked_at | `tests/orari.test.ts` | `/api/status` restituisce i due orari nello stesso formato |
| changed_at del registro delle modifiche è ISO 8601 UTC, come revoked_at | `tests/orari.test.ts` | le righe CREATED e REVOKED hanno `changed_at` in ISO 8601 UTC |

Verificato davvero:

- senza la correzione (commit del solo test) i 3 test falliscono, per esempio `The input did not match the regular expression ... Input: '2026-11-18 12:55:03'`;
- con la correzione passano.

## Verifica di regressione

Suite completa eseguita il 18/11/2026 dopo la correzione: `npm run typecheck` senza errori, e `npm test` dà **79/79** test passati (76 di prima più i 3 nuovi).

**Impatto da sapere:** `schema.sql` usa `CREATE TABLE IF NOT EXISTS`, quindi un database **già esistente** mantiene il vecchio valore predefinito. L'ho verificato: con il vecchio file `.sqlite` gli eventi nuovi escono ancora come `2026-11-18 12:55:33`. In sviluppo i dati sono di prova: si cancella `data/access-control.sqlite` e lo schema lo ricrea al primo avvio. Le righe già scritte non si possono convertire, perché i trigger rifiutano gli UPDATE sullo storico, ed è giusto così.
