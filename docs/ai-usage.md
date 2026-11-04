## Uso dell'AI — Access Control Platform

Ogni uso significativo dell'AI va registrato qui da chi lo ha fatto: cosa ha
chiesto, cosa ha ottenuto, come lo ha verificato, cosa ha tenuto o corretto.
Un caso senza verifica descritta non conta.

## Caso 1 — Bozze dei documenti della lezione 1

**Data**: 23/09/2026 — **Chi**: Gianmarco Tonelli

**Cosa abbiamo chiesto**: di generare, a partire dalla traccia del cliente e dai
template del corso, una bozza di requirements, use-cases, architecture-v1,
backlog e domande-cliente, scrivendo direttamente il testo invece di guidarci
passo passo.

**Cosa abbiamo ottenuto**: i cinque documenti. Nella stessa sessione l'AI ha
generato anche un'applicazione completa di esempio (backend, simulatore, console,
seed dei dati), che non abbiamo usato e che non è mai entrata nel repository
(Caso 2). I documenti descrivevano quell'applicazione: per questo citavano
`src/db/schema.sql`, `tests/api.test.ts`, la tabella `area_managers`, gli
endpoint `/api/authorizations` e un seed con `BADGE-TEST-001`, che nel nostro
codice non esistono.

**Errore nostro**: li abbiamo committati in `docs/progetto-scolastico-main/`
senza confrontarli con il nostro codice e senza tracciarli qui. Lo ha segnalato
il docente nel riscontro del 15/10/2026.

**Cosa abbiamo verificato e come** (dopo il riscontro):
- ogni documento è stato riletto dal suo responsabile contro la traccia del
  cliente e il codice di `main`: requirements Gianmarco, use-cases e backlog
  Nicolò, architecture-v1 e domande-cliente Dario
- ricerca con `grep` in `docs/` di tutti i riferimenti a file, tabelle ed
  endpoint inesistenti: nessun risultato dopo le correzioni
- ogni documento corretto è passato da una PR approvata da un altro membro

**Cosa abbiamo tenuto o corretto, e perché**:
- requirements (Gianmarco): tenuti obiettivi, requisiti funzionali e non
  funzionali, perché corrispondono alla traccia punto per punto; corretti il
  team e la versione, il percorso dello schema (`schema.sql`, non
  `src/db/schema.sql`) e la nota di RF10, che parlava di una richiesta "dopo la
  prima consegna" mentre è la risposta del cliente alla domanda #6 del
  23/09/2026; tolto un esempio rimasto dal template del corso
- use-cases (Nicolò): *(da completare nella sua PR)*
- backlog (Nicolò): portato in `docs/backlog.md` con l'autenticazione a
  priorità alta (PR #48)
- architecture-v1 e domande-cliente (Dario): *(da completare nella sua PR)*

**Dati sensibili nei prompt**: nessuno; la traccia è un caso di studio del corso.

## Caso 2 — Applicazione di esempio generata e scartata

**Data**: 23/09/2026 — **Chi**: Gianmarco Tonelli

**Cosa abbiamo chiesto**: di implementare l'intera applicazione descritta nei
documenti del Caso 1.

**Cosa abbiamo ottenuto**: un'applicazione completa (backend, simulatore,
console web, test), rimasta solo sul computer di Gianmarco.

**Cosa abbiamo verificato e come**: l'abbiamo avviata e provata in locale, ma
abbiamo deciso di non usarla: il codice del repository lo abbiamo costruito noi,
lezione per lezione, a partire dal commit `0f0b438` del 30/09/2026.

**Cosa abbiamo tenuto o corretto, e perché**: niente di quel codice è nel
repository, perché il corso chiede di costruire e saper motivare ogni scelta
passo per passo. Ne erano rimaste tracce solo nei documenti della lezione 1,
corrette come descritto nel Caso 1.

**Dati sensibili nei prompt**: nessuno.

## Caso 3 — Risposte del cliente integrate nei documenti

**Data**: 23/09/2026 — **Chi**: Gianmarco Tonelli

**Cosa abbiamo chiesto**: il 23/09/2026 il cliente (il docente) ha risposto alle
domande 1, 3, 4 e 6 di `domande-cliente.md`. Abbiamo chiesto all'AI di
aggiornare i documenti di conseguenza.

**Cosa abbiamo ottenuto**: RNF1 con la soglia di 5 secondi (domanda #1); un
badge per dipendente (domanda #3); un badge autorizzabile su più aree (domanda
#4); RF10 e UC6, il responsabile di area che consulta e modifica le
autorizzazioni della propria area (domanda #6); la tabella delle risposte in
`domande-cliente.md`.

**Cosa abbiamo verificato e come**: le quattro risposte corrispondono a quelle
date dal docente il 23/09/2026, compresa la #6, che è una sua risposta e non una
nostra proposta.

**Cosa abbiamo tenuto o corretto, e perché**: tenute le risposte e i requisiti
che ne derivano. La colonna "Cosa è cambiato nel progetto" di
`domande-cliente.md` citava file dell'applicazione del Caso 2: la riscrive Dario
sui file reali. In RF10 la frase "dopo la prima consegna" era sbagliata ed è
stata corretta.

**Dati sensibili nei prompt**: nessuno.

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

## Caso 6 — Esito calcolato dal server e storico non modificabile

**Data**: 04/11/2026 — **Chi**: Gianmarco Tonelli

**Cosa abbiamo chiesto**: come correggere la POST che riceveva l'esito dal
client (riscontro del docente del 15/10/2026: "l'esito lo calcola il server"),
mantenendo i livelli controller / servizio / repository della PR #1.

**Cosa abbiamo ottenuto**: tabella `access_events` con i codici di badge e
varco come testo e due trigger che rifiutano UPDATE e DELETE; motore di
decisione come funzione pura in `src/domain/accessDecision.ts`; due repository,
un servizio e un controller per `/api/access-events`; 24 test; `docs/api.md`
compilato sul template del corso; diagramma dei requisiti aggiornato.

**Cosa abbiamo verificato e come**:
- `npm test`: 24/24; `npx tsc --noEmit`: nessun errore
- controprova: commentata la regola "badge disattivato" nel motore, il test
  unitario corrispondente è fallito; ripristinata, tutti i test sono tornati
  verdi
- prova manuale con `curl` sui dati di `dati_db_test.sql`: BADGE-TEST-001 su
  VARCO-LAB-01 riceve ACCESS_GRANTED; un badge inesistente con
  `"result": "ACCESS_GRANTED"` nel corpo riceve ACCESS_DENIED, "badge
  sconosciuto": l'esito inviato dal client è ignorato

**Cosa abbiamo tenuto o corretto, e perché**: abbiamo tenuto i codici di badge
e varco come testo nello storico, invece di chiavi esterne, perché anche un
badge o un varco sconosciuto deve lasciare una riga (voce 2 del backlog).
Abbiamo deciso che un accesso negato risponda 201 e non 403: la richiesta è
valida ed è stato creato un evento; il 403 vorrebbe dire che il client non può
chiamare l'API. Abbiamo messo le regole in una funzione pura separata, così si
testano senza database e la stessa richiesta dà sempre lo stesso esito.

**Dati sensibili nei prompt**: nessuno.

## Caso 7 — Registro delle modifiche alle autorizzazioni

**Data**: 04/11/2026 — **Chi**: Nicolò Florean

**Cosa abbiamo chiesto**: come prevedere un registro immutabile delle modifiche
alle autorizzazioni prima degli endpoint che le creano e le revocano.

**Cosa abbiamo ottenuto**: la tabella `authorization_changes`, con azione
`CREATED`/`REVOKED`, autore obbligatorio e timestamp del database, due trigger
che rifiutano UPDATE e DELETE, cinque test e l'aggiornamento del modello dati.

**Cosa abbiamo verificato e come**:
- il test di baseline ha superato 24 test; dopo l'aggiunta, `npm test` ha
  superato 29 test, inclusi i cinque test del registro;
- `npm run typecheck`, `npm run build` e `git diff --check` sono terminati senza
  errori;
- nella controprova controllata, rimossi temporaneamente i trigger, il test di
  immutabilità è fallito; i trigger sono stati ripristinati prima del commit.

**Cosa abbiamo tenuto o corretto, e perché**: `changed_by` resta testo perché
gli operatori e il login non esistono ancora; quando arriverà l'autenticazione
potrà essere collegato all'identità dell'operatore senza anticipare T06.

**Dati sensibili nei prompt**: nessuno.
