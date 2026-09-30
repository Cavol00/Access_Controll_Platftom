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

Non ancora eseguibile da questo repository: il codice applicativo non è
ancora stato caricato. Una volta presente:

```
npm install
cp .env.example .env     # poi valorizzare JWT_SECRET e SIMULATOR_API_KEY
npm run seed             # dati di test
npm run dev              # avvia l'API e la console web
```

## Struttura del repository

```
.
├── README.md                questo file
├── CONTRIBUTING.md          come contribuire: branch, commit, Definition of Done
└── docs/
    ├── requirements.md      requisiti (lezione 1)
    ├── use-cases.md         casi d'uso (lezione 1)
    ├── architecture-v1.md   architettura (lezione 1)
    ├── backlog.md           backlog iniziale (lezione 1)
    └── domande-cliente.md   domande al cliente e risposte (lezione 1)
```

## Stato del progetto

Lezione 2: repository creato, branch strategy concordata, documenti della
lezione 1 caricati in `docs/`. Da fare: trasferire il backlog in issue.

## Come contribuire

Branch strategy, convenzioni di commit e Definition of Done sono in
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — leggetelo prima di aprire il primo
branch.
