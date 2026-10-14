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
    └── data-model.md        modello dati: entità, relazioni, schema (lezione 3)
```

## Stato del progetto

Lezione 3: schema dati in `schema.sql`, backend collegato a SQLite e
riorganizzato a livelli (controller → servizio → repository), con un flusso
CRUD delle segnalazioni che persiste ai riavvii. Il modello è documentato in
[`docs/data-model.md`](./docs/data-model.md). Da fare: trasferire il backlog
in issue.

## Come contribuire

Branch strategy, convenzioni di commit e Definition of Done sono in
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — leggetelo prima di aprire il primo
branch.
