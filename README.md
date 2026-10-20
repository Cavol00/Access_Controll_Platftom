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

Aurea Precision Components S.p.A., azienda di produzione meccanica di
precisione, gestisce oggi i permessi di accesso alle sue aree (uffici, reparti
produttivi, laboratori, magazzino, sala sistemi) in modo frammentato. Alcune di
queste aree devono essere accessibili solo a personale autorizzato. Senza un
sistema centrale non si può garantire che entri solo chi ne ha diritto, né
ricostruire dopo chi ha tentato di accedere, dove e quando.

L'azienda chiede una piattaforma centralizzata che:

- gestisca utenti, badge, edifici, aree, varchi e autorizzazioni;
- valuti ogni richiesta di accesso (badge, varco, timestamp) e risponda
  `ACCESS_GRANTED` o `ACCESS_DENIED` secondo regole configurate;
- registri ogni tentativo con esito e motivazione, e permetta agli
  amministratori di consultare lo storico e vedere i tentativi negati.

### Vincoli principali

- Nella prima fase non ci sono lettori badge reali: un simulatore software
  invia le richieste come se arrivassero dai varchi.
- I badge devono essere dati di test.
- La dimostrazione deve includere utenti con permessi diversi e più aree.
- La decisione di concedere o negare l'accesso deve restare completamente
  deterministica, basata sulle regole configurate. L'AI può solo supportare
  gli operatori, ad esempio sintetizzando pattern anomali.
- L'architettura deve restare modulare e pronta a più sedi, più varchi e
  futuri dispositivi reali.

## Stack

| | |
|---|---|
| **Backend** | Node.js 22.9 o superiore (sviluppato su Node 24), TypeScript, Express 5 |
| **Database** | SQLite tramite il modulo `node:sqlite` integrato in Node: nessun server da installare |
| **Test** | `node:test` eseguito con `tsx` |
| **Frontend** | non ancora presente |

## Come si esegue

```bash
npm install
cp .env.example .env     # una volta sola: .env non è nel repository
npm run dev              # avvia il backend direttamente dal TypeScript
```

Per avviare la versione compilata, il TypeScript va prima tradotto in `dist/`:

```bash
npm run build            # compila src/ in dist/
npm start                # avvia dist/server.js
```

Altri comandi:

```bash
npm test                 # test automatici (database in memoria, non tocca data/)
npm run typecheck        # controllo dei tipi su src/ e tests/, senza generare file
```

Verifica rapida: con il backend avviato, `curl http://localhost:3000/health`
deve rispondere `{"status":"ok"}`. Le API sono descritte in
[`docs/api.md`](./docs/api.md).

## Struttura del repository

```
.
├── README.md             questo file
├── CONTRIBUTING.md       branch, commit, review, Definition of Done
├── package.json          dipendenze e comandi
├── tsconfig.json         controllo dei tipi (src/ e tests/)
├── tsconfig.build.json   compilazione di src/ in dist/
├── schema.sql            tabelle del database
├── dati_db_test.sql      dati di prova, solo inventati
├── src/
│   ├── server.ts         avvia l'app sulla porta letta da .env
│   ├── app.ts            monta le rotte e il gestore degli errori
│   ├── config.ts         legge la configurazione da variabili d'ambiente
│   ├── db.ts             apre il database e applica schema.sql
│   ├── controllers/      traduzione HTTP ↔ servizio
│   ├── services/         regole e validazione
│   └── repositories/     unico punto che contiene SQL
├── tests/                test automatici
└── docs/                 requisiti, casi d'uso, architettura, backlog,
                          modello dati, API, uso dell'AI
```

## Backlog e attività

Il backlog è in [`docs/backlog.md`](./docs/backlog.md). Le attività sono
issue su GitHub, ciascuna con un assegnatario, e il loro stato si segue sulla
[board del progetto](https://github.com/users/Cavol00/projects/1)
(da fare → in corso → in revisione → fatto).

## Come contribuire

Branch strategy, convenzioni di commit e Definition of Done sono in
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — leggetelo prima di aprire il primo
branch.