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

## Backlog

1. Valutare una richiesta di accesso

Come simulatore lettore badge voglio inviare badge, varco e timestamp e ricevere ACCESS_GRANTED o ACCESS_DENIED, per sapere se aprire il varco.

Fatto quando:
la risposta contiene sempre ACCESS_GRANTED o ACCESS_DENIED, mai altro
un badge autorizzato sull’area del varco riceve ACCESS_GRANTED
lo stesso badge su un varco di un’altra area riceve ACCESS_DENIED
badge sconosciuto, badge disattivato o varco sconosciuto ricevono ACCESS_DENIED
la risposta arriva entro 5 secondi (soglia data dal cliente)
due richieste identiche, con la stessa configurazione, ricevono lo stesso esito

2. Registrare ogni tentativo

Come amministratore sicurezza voglio che ogni tentativo di accesso, concesso o negato, resti registrato con esito e motivazione, per poter ricostruire chi ha provato ad accedere, dove e quando.

Fatto quando:
dopo N richieste di accesso lo storico contiene esattamente N righe nuove
ogni riga riporta badge, varco, area, data e ora, esito e motivazione
nessuna API permette di modificare o cancellare una riga dello storico


3. Accesso degli operatori con credenziali e ruolo

Come amministratore sicurezza voglio che la console si usi solo dopo il login, e che ogni operatore possa fare solo ciò che il suo ruolo consente, per impedire modifiche ai permessi da parte di chi non è autorizzato.

Fatto quando:
senza login, ogni API amministrativa risponde 401
con password errata il login viene rifiutato
un operatore che chiama un’operazione non permessa al suo ruolo riceve 403
nessuna password o chiave è scritta nel codice sorgente


4. Edifici, aree e varchi

Come amministratore sicurezza voglio definire edifici, aree e varchi, per descrivere nel sistema la struttura fisica della sede.

Fatto quando:
posso creare ed eliminare edifici, aree e varchi
ogni area appartiene a un edificio, ogni varco a una sola area
una richiesta di accesso su un varco appena creato viene valutata, non respinta come “varco sconosciuto”


5. Dipendenti e badge

Come amministratore sicurezza voglio registrare un dipendente con il suo badge e poterlo disattivare, per controllare quali badge sono in uso.

Fatto quando:
posso creare un dipendente e assegnargli un badge
un secondo badge per lo stesso dipendente viene rifiutato con un errore comprensibile (un badge per dipendente, confermato dal cliente)
un badge disattivato riceve ACCESS_DENIED anche se ha autorizzazioni attive


6. Autorizzare un badge su una o più aree

Come amministratore sicurezza voglio autorizzare un badge su una o più aree, anche con una data di fine, per stabilire chi può entrare dove e fino a quando.

Fatto quando:
dopo l’autorizzazione il badge riceve ACCESS_GRANTED sui varchi di quell’area
lo stesso badge può essere autorizzato su più aree contemporaneamente
dopo la data di fine, l’accesso a quell’area viene negato


7. Revocare un’autorizzazione

Come amministratore sicurezza voglio revocare un’autorizzazione, per togliere un accesso quando cambia il ruolo di un dipendente.

Fatto quando:
la prima richiesta dopo la revoca riceve ACCESS_DENIED
gli eventi registrati prima della revoca restano invariati
l’audit log riporta chi ha revocato, quale autorizzazione e quando


8. Consultare lo storico

Come amministratore sicurezza voglio consultare lo storico filtrandolo per badge, varco ed esito, per analizzare i tentativi negati.

Fatto quando:
ogni filtro restituisce solo eventi che lo soddisfano
filtrando per esito “negati” compaiono solo eventi ACCESS_DENIED
nella console i negati hanno un’etichetta diversa dai concessi


9. Il responsabile di area governa solo la propria area

Come responsabile di area voglio vedere lo storico e gestire le autorizzazioni solo delle mie aree, per controllare gli accessi del mio reparto senza toccare quelli degli altri.

Fatto quando:
lo storico mostra solo eventi delle sue aree, anche chiamando l’API a mano
può creare e revocare autorizzazioni sulle sue aree
un’autorizzazione su un’area non sua viene rifiutata con 403


10. Monitorare lo stato del sistema

Come amministratore tecnico voglio sapere se il backend e il database funzionano e quando è arrivata l’ultima richiesta dal simulatore, per diagnosticare un problema di comunicazione.

Fatto quando:
GET /api/health risponde 200 quando il backend è attivo
l’endpoint di stato dettagliato indica se il database è raggiungibile e l’ora dell’ultimo evento ricevuto dal simulatore
la procedura di avvio e verifica è scritta in docs/installazione.md


## Come contribuire

Branch strategy, convenzioni di commit e Definition of Done sono in
[`CONTRIBUTING.md`](./CONTRIBUTING.md) — leggetelo prima di aprire il primo
branch.



