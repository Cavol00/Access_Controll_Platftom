# API — Access Control Platform

| | |
|---|---|
| **Progetto** | Access Control Platform — Aurea Precision Components S.p.A. |
| **Team** | LeCucciole — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| **Data** | 04/11/2026 |
| **Versione** | v0.2 — storico accessi con esito calcolato dal server |

Qui sono documentati solo gli endpoint che esistono e rispondono. Il codice
che li implementa è in `src/controllers/`, i test in `tests/`.

**Autenticazione:** `POST /api/access-events` richiede la chiave del lettore
badge (T10); `GET /api/access-events` richiede il login di un operatore con
ruolo `admin_sicurezza` (T06, T07). Il responsabile di area arriverà con T18,
insieme al filtro sulle sue aree.

## Convenzioni generali

Tutte le richieste e le risposte sono JSON; gli endpoint applicativi stanno
sotto `/api`. Gli errori hanno sempre la forma `{ "error": "descrizione" }`
con lo status corretto, mai un `200 OK` con l'errore nel corpo. Un accesso
negato **non** è un errore HTTP: la richiesta è valida, è stata valutata e
registrata, quindi risponde `201` con `"result": "ACCESS_DENIED"`. Date e
orari sono stringhe ISO 8601 in UTC (es. `2026-10-15T08:00:00.000Z`).

## Endpoint

### `POST /api/auth/login`

Effettua il login di un operatore attivo. Il token restituito vale 8 ore; le
sessioni sono mantenute solo in memoria e dopo un riavvio è necessario rifare il
login. Gli operatori si creano con `npm run crea-operatore`.

**Corpo della richiesta**

```json
{ "username": "admin.sicurezza", "password": "password-di-prova" }
```

| Status | Quando | Corpo |
|---|---|---|
| `200 OK` | credenziali corrette | `{ "token": "9f3c...", "username": "admin.sicurezza", "role": "admin_sicurezza", "expires_at": "2026-11-04T18:00:00.000Z" }` |
| `400 Bad Request` | username o password mancanti | `{ "error": "username e password sono obbligatori" }` |
| `401 Unauthorized` | utente inesistente, password errata o operatore inattivo | `{ "error": "credenziali non valide" }` |

### Autorizzazioni (T12)

Un badge viene autorizzato su un'area e l'autorizzazione può essere revocata
senza cancellarla. Richiede il login con ruolo `admin_sicurezza` (header
`Authorization: Bearer <token>`): senza login `401`, con un altro ruolo `403`.
Ogni creazione e ogni revoca scrivono nel registro delle modifiche
(`authorization_changes`) chi l'ha fatta e quando, nella stessa transazione.

| Metodo e percorso | Corpo | Successo | Errori |
|---|---|---|---|
| `GET /api/authorizations` | — | `200` lista (anche quelle revocate) | — |
| `POST /api/authorizations` | `{ "badge_id": 1, "area_id": 2, "valid_from": "2026-01-01T00:00:00Z", "valid_to": "2026-12-31T23:59:59Z" }` (le date sono facoltative) | `201` autorizzazione creata | `400` badge o area inesistenti, date non valide o fine prima dell'inizio · `409` il badge ha già un'autorizzazione su quell'area |
| `POST /api/authorizations/:id/revoke` | — | `200` autorizzazione con `revoked_at`; la richiesta successiva riceve `ACCESS_DENIED` | `400` id non valido · `404` autorizzazione inesistente · `409` già revocata |
| `GET /api/authorizations/changes` | — | `200` registro: `authorization_id`, `action` (`CREATED`/`REVOKED`), `changed_by`, `changed_at` | — |

### `GET /health`

Dice se il backend è attivo. Serve all'amministratore tecnico e alla verifica
dopo l'avvio.

**Risposte**

| Status | Quando | Corpo (esempio) |
|---|---|---|
| `200 OK` | il backend risponde | `{ "status": "ok" }` |

### `GET /api/status` (T17)

Stato dettagliato del sistema, per l'amministratore tecnico: dice se il database
risponde e quando è arrivato l'ultimo evento dal simulatore. Richiede il login con
ruolo `admin_tecnico` o `admin_sicurezza`. Il controllo pubblico resta `GET /health`.

| Status | Quando | Corpo (esempio) |
|---|---|---|
| `200 OK` | login con un ruolo ammesso | `{ "backend": "attivo", "database": "raggiungibile", "last_event_at": "2026-11-18 09:00:00", "checked_at": "2026-11-18T09:05:00.000Z" }` |
| `200 OK` | il database non risponde | `{ "backend": "attivo", "database": "non raggiungibile", "last_event_at": null, ... }` |
| `401 Unauthorized` | senza login | `{ "error": "login richiesto" }` |
| `403 Forbidden` | ruolo non ammesso (es. `responsabile_area`) | `{ "error": "Operazione non permessa al tuo ruolo" }` |

### `POST /api/access-events`

Il lettore badge (oggi il simulatore) chiede l'accesso indicando solo badge e
varco: il server cerca il badge, il varco e la sua area, controlla le
autorizzazioni valide in quel momento, decide l'esito e registra il tentativo
nello storico. Un campo `result` inviato dal client viene ignorato.

**Corpo della richiesta**

```json
{ "badge_code": "BADGE-TEST-001", "door_code": "VARCO-LAB-01", "requested_at": "2026-10-15T08:00:00Z" }
```

| Nome | In | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|---|
| `X-API-Key` | header | testo | sì | chiave del lettore badge, uguale a `SIMULATOR_API_KEY` in `.env` |
| `badge_code` | body | testo | sì | codice del badge letto |
| `door_code` | body | testo | sì | codice del varco da cui arriva la richiesta |
| `requested_at` | body | data ISO 8601 | no | orario della lettura; se manca vale l'orario del server |

**Risposte**

| Status | Quando | Corpo (esempio) |
|---|---|---|
| `201 Created` | badge attivo con autorizzazione valida sull'area del varco | `{ "id": 1, "badge_code": "BADGE-TEST-001", "door_code": "VARCO-LAB-01", "area_id": 2, "requested_at": "2026-10-15T08:00:00.000Z", "result": "ACCESS_GRANTED", "reason": "autorizzazione valida", "recorded_at": "2026-10-15 08:00:00" }` |
| `201 Created` | badge o varco sconosciuto, badge disattivato, dipendente non attivo, nessuna autorizzazione valida (scaduta, revocata, su un'altra area) | `{ "id": 2, "badge_code": "BADGE-TEST-006", "door_code": "VARCO-UFF-NORD", "area_id": 1, "result": "ACCESS_DENIED", "reason": "badge disattivato", ... }` |
| `401 Unauthorized` | manca l'header `X-API-Key`, oppure la chiave è sbagliata: la richiesta non viene valutata né registrata | `{ "error": "chiave del lettore badge mancante o non valida" }` |
| `400 Bad Request` | manca `badge_code` o `door_code`, o è vuoto | `{ "error": "badge_code e door_code sono obbligatori" }` |
| `400 Bad Request` | `requested_at` non è una data | `{ "error": "requested_at deve essere una data ISO 8601" }` |
| `400 Bad Request` | il corpo non è JSON valido | `{ "error": "Corpo della richiesta non è JSON valido" }` |
| `500 Internal Server Error` | errore imprevisto, es. database non disponibile | `{ "error": "Errore interno del server" }` |

Motivazioni possibili in `reason`: `autorizzazione valida`, `badge sconosciuto`,
`varco sconosciuto`, `badge disattivato`, `dipendente non attivo`,
`nessuna autorizzazione valida sull'area del varco`.

### `GET /api/access-events`

Restituisce lo storico dei tentativi di accesso, dal più recente. Solo per
operatori con ruolo `admin_sicurezza`.

**Parametri**

| Nome | In | Tipo | Obbligatorio | Descrizione |
|---|---|---|---|---|
| `Authorization` | header | testo | sì | `Bearer <token>`, con il token ricevuto da `POST /api/auth/login` |

**Risposte**

| Status | Quando | Corpo (esempio) |
|---|---|---|
| `200 OK` | sempre, anche con storico vuoto | `[ { "id": 2, "badge_code": "BADGE-TEST-006", "result": "ACCESS_DENIED", ... }, { "id": 1, ... } ]` |
| `401 Unauthorized` | token mancante, inventato o scaduto | `{ "error": "login richiesto" }` |
| `403 Forbidden` | token valido, ma il ruolo non è `admin_sicurezza` | `{ "error": "Operazione non permessa al tuo ruolo" }` |
| `500 Internal Server Error` | database non disponibile | `{ "error": "Errore interno del server" }` |

Lo storico non si modifica: `PUT`, `PATCH` e `DELETE` su `/api/access-events`
non esistono e rispondono `404` con `{ "error": "Risorsa non trovata" }`.
Anche il database rifiuta `UPDATE` e `DELETE` sulla tabella `access_events`.

## Test collegati

Si lanciano con `npm test`.

- Autorizzazioni (T12) → `tests/authorizations.test.ts` › badge su due aree
  concesso su entrambe, negato dopo la data di fine, registro delle modifiche
  con autore e data, coppia duplicata 409, badge inesistente 400 senza righe
  nel registro, date invertite 400, elenco, 401 e 403
- Revoca delle autorizzazioni (T13) → `tests/authorizations.test.ts` › prima
  richiesta dopo la revoca negata, storico precedente identico, registro con
  chi ha revocato quale autorizzazione e quando, 409/404/400, 401 e 403

- `GET /health` → `tests/access-events.test.ts` › "risponde 200 con status ok"
- `POST /api/access-events` → `tests/access-events.test.ts` › "badge autorizzato
  sull'area del varco: 201 e ACCESS_GRANTED", "stesso badge su un varco di
  un'altra area", "badge sconosciuto", "varco sconosciuto", "badge disattivato",
  "autorizzazione revocata", "l'esito inviato dal client viene ignorato",
  "senza badge_code: 400", "con requested_at non valido: 400", "con JSON
  malformato: 400, non 500", "senza X-API-Key: 401 e nessuna riga nello
  storico", "con una X-API-Key sbagliata: 401"
- `GET /api/access-events` → "N richieste producono N righe nuove nello
  storico", "se il database non è disponibile … risponde 500"
- Ruoli sullo storico (T07) → "senza login: 401", "con un token inventato: 401",
  "con un ruolo non ammesso (admin_tecnico): 403", "con il ruolo giusto
  (admin_sicurezza): 200"
- Storico non modificabile → "PUT e DELETE sull'API rispondono 404", "anche dal
  database UPDATE e DELETE vengono rifiutati"
- Regole di decisione, senza HTTP né database → `tests/accessDecision.test.ts`
- Stato del sistema (T17) → `tests/status.test.ts` › /health pubblico, 401 senza
  login, 403 con ruolo non ammesso, database raggiungibile, ora dell'ultimo evento,
  database non raggiungibile
- Tempi e storico sotto carico (T16) → `tests/tempi.test.ts` › esito entro 5
  secondi, 50 richieste insieme entro 5 secondi, N richieste insieme → N righe,
  storico non modificabile

## Prova a mano

Con il backend avviato e i dati di `dati_db_test.sql` caricati:

```bash
curl -X POST http://localhost:3000/api/access-events \
  -H "Content-Type: application/json" \
  -H "X-API-Key: LA-CHIAVE-DEL-VOSTRO-.env" \
  -d '{"badge_code":"BADGE-TEST-001","door_code":"VARCO-LAB-01"}'
```

Risponde `201` con `"result": "ACCESS_GRANTED"`. Con `"badge_code":"BADGE-TEST-006"`
e `"door_code":"VARCO-UFF-NORD"` (badge disattivato) risponde `201` con
`"result": "ACCESS_DENIED"`.
