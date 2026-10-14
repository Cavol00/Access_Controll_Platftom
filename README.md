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

## Il problema 

Aurea Precision Components S.p.A., azienda di produzione meccanica di precisione, gestisce oggi i permessi di accesso alle sue aree
(uffici, reparti produttivi, laboratori, magazzino, sala sistemi) in modo frammentato. Alcune di queste aree devono essere accessibili 
solo a personale autorizzato. Senza un sistema centrale non si può garantire che entri solo chi ne ha diritto, né ricostruire dopo chi 
ha tentato di accedere, dove e quando.

L’azienda chiede una piattaforma centralizzata che:

gestisca utenti, badge, edifici, aree, varchi e autorizzazioni;
valuti ogni richiesta di accesso (badge, varco, timestamp) e risponda ACCESS_GRANTED o ACCESS_DENIED secondo regole configurate;
registri ogni tentativo con esito e motivazione, e permetta agli amministratori di consultare lo storico e vedere i tentativi negati.

Vincoli principali

Nella prima fase non ci sono lettori badge reali: un simulatore software invia le richieste come se arrivassero dai varchi.
I badge devono essere dati di test.
La dimostrazione deve includere utenti con permessi diversi e più aree.
La decisione di concedere o negare l’accesso deve restare completamente deterministica, basata sulle regole configurate. L’AI può solo
supportare gli operatori, ad esempio sintetizzando pattern anomali.
L’architettura deve restare modulare e pronta a più sedi, più varchi e futuri dispositivi reali.

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

## Come contribuire

Branch strategy, convenzioni di commit e Definition of Done sono in
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — leggetelo prima di aprire il primo
branch.
