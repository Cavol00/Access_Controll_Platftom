# Access Control Platform

| | |
|---|---|
| **Cliente** | Aurea Precision Components S.p.A. |
| **Team** | *LeCucciole* |
| **Membri** | Dario D'Alessandro<br>Nicolò Florean<br>Gianmarco Tonelli |
| **Data** | 30/09/2026 |
| **Versione** | v0.1 |

## Cosa fa questo progetto

Sistema centralizzato per gestire chi può entrare in quali aree dell'azienda
(uffici, reparti, laboratori, magazzino, sala sistemi): valuta ogni richiesta
di accesso di un badge a un varco, concede o nega l'ingresso in base ai
permessi configurati e conserva lo storico di tutti i tentativi per analisi e
audit. Dettagli in [`docs/requirements.md`](./docs/requirements.md).

## Stack

```
Stack:    Node.js + TypeScript + Express
Frontend: HTML/CSS/JavaScript senza framework, servito dal backend
Database: SQLite (modulo nativo node:sqlite)
```

## Come si esegue

```
npm install
npm run dev              # avvia l'API su http://localhost:3000
```

Il database SQLite viene creato in `data/access-control.sqlite` al primo
avvio, applicando lo schema in `schema.sql`.

## Struttura del repository

```
.
├── README.md                questo file
├── CONTRIBUTING.md          come contribuire: branch, commit, Definition of Done
├── schema.sql               schema del database (tabelle e vincoli)
├── dati_db_test.sql         dati di test da caricare nel database
├── lezione-4-http-rest-api-test.md  materiale della lezione 4
├── src/
│   ├── server.ts            entrypoint: monta i router e avvia il server
│   ├── db.ts                apertura SQLite e applicazione dello schema
│   ├── types.ts             modelli (DTO) condivisi
│   ├── errors.ts            errori applicativi (validazione, non trovato)
│   ├── controllers/         adapter HTTP verso i servizi
│   ├── services/            regole del cliente e validazione
│   └── repositories/        accesso ai dati (unico punto con l'SQL)
└── docs/
    ├── requirements.md      requisiti (lezione 1)
    ├── use-cases.md         casi d'uso (lezione 1)
    ├── architecture-v1.md   architettura (lezione 1)
    ├── backlog.md           backlog iniziale (lezione 1)
    ├── domande-cliente.md   domande al cliente e risposte (lezione 1)
    ├── data-model.md        modello dati: entità, relazioni, schema (lezione 3)
    ├── api.md               contratto API — template, DA COMPILARE (lezione 4)
    └── openapi.yaml         contratto OpenAPI — template, DA COMPILARE (lezione 4)
```

## Stato del progetto

**Fatto — fino alla lezione 3**

- Schema dati completo in `schema.sql` (dipendenti, badge, edifici, aree,
  varchi, autorizzazioni, segnalazioni) e documentato in
  [`docs/data-model.md`](./docs/data-model.md).
- Backend collegato a SQLite e riorganizzato a livelli (controller → servizio
  → repository), con un CRUD delle segnalazioni (`GET/POST/PUT
  /api/segnalazioni`) e `GET /health`.
- Persistenza verificata: le segnalazioni sopravvivono al riavvio del server.
- Dati di test pronti in [`dati_db_test.sql`](./dati_db_test.sql).

**Da fare — lezione 4** (richieste in
[`lezione-4-http-rest-api-test.md`](./lezione-4-http-rest-api-test.md))

- [ ] Compilare il contratto dell'API: `docs/api.md` **oppure**
      `docs/openapi.yaml` (ora sono solo template vuoti) con i 3-4 endpoint
      principali, parametri/corpo e **tutte** le risposte, errori compresi.
- [ ] Aggiungere la cartella `tests/` con test automatici che girano contro
      l'API reale: per ogni endpoint happy path + almeno un caso di errore
      (`400` input non valido, `404` risorsa inesistente, `500` errore server).
- [ ] Collegare il **frontend** ad almeno un endpoint reale (niente mock).
- [ ] Aggiungere la **paginazione** agli endpoint di lista (`page`/`pageSize`)
      e completare gli endpoint REST mancanti.
- [ ] Trasferire il backlog in issue; tenere il contratto aggiornato **nello
      stesso commit** del codice che lo implementa.

## Come contribuire

Branch strategy, convenzioni di commit e Definition of Done sono in
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — leggetelo prima di aprire il primo
branch.
