# Attori e casi d'uso — Access Control Platform / Aurea Precision Components S.p.A.

| | |
|---|---|
| **Team** | LeCucciole — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| **Cliente** | Aurea Precision Components S.p.A. |
| **Data** | 04/11/2026 |
| **Versione** | v1 |

## Attori

| Attore | Cosa ottiene dal sistema |
|---|---|
| Simulatore lettore badge | invia richieste di accesso (badge, varco, timestamp) e riceve l'esito |
| Amministratore sicurezza | configura utenti, badge, edifici, aree, varchi e autorizzazioni; consulta l'intero storico |
| Amministratore tecnico | gestisce configurazione, monitoraggio e funzionamento della piattaforma |
| Responsabile di area | consulta lo storico e gestisce le autorizzazioni, limitatamente alle aree di propria competenza |
| Dipendente | titolare di un badge; agisce indirettamente sul sistema tramite il simulatore |

## Casi d'uso

### UC1 — Valutazione di una richiesta di accesso

- **Attore**: Simulatore lettore badge
- **Precondizione**: il simulatore raggiunge l'API
- **Risultato osservabile**: il simulatore riceve `ACCESS_GRANTED` o
  `ACCESS_DENIED` coerente con le autorizzazioni configurate; l'evento è
  registrato nello storico con esito e motivazione. Anche quando il badge o il
  varco non esistono, il tentativo è registrato con il relativo esito e la
  motivazione
- **Stato**: implementato (`POST /api/access-events`)

### UC2 — Configurazione di utenti, badge e autorizzazioni

- **Attore**: Amministratore sicurezza
- **Precondizione**: amministratore autenticato
- **Risultato osservabile**: un nuovo utente/badge esiste nel sistema, oppure
  una nuova autorizzazione badge-area è attiva e influenza le richieste di
  accesso valutate da quel momento in poi
- **Stato**: da fare: T09/T12; l'autenticazione dell'operatore non è ancora
  implementata

### UC3 — Consultazione dello storico accessi

- **Attore**: Amministratore sicurezza / Responsabile di area
- **Precondizione**: operatore autenticato
- **Risultato osservabile**: viene mostrato l'elenco filtrabile dei tentativi
  di accesso, con i tentativi negati o anomali evidenziati; il responsabile
  di area vede solo gli eventi delle aree a lui assegnate
- **Stato**: da fare: T14/T18; l'autenticazione dell'operatore non è ancora
  implementata

### UC4 — Revoca o modifica di un'autorizzazione

- **Attore**: Amministratore sicurezza (su qualunque area) / Responsabile di
  area (solo sulle aree di propria competenza)
- **Precondizione**: l'autorizzazione da modificare esiste; se l'attore è un
  responsabile di area, l'autorizzazione riguarda una delle sue aree
- **Risultato osservabile**: le richieste di accesso successive alla modifica
  riflettono il nuovo permesso; le richieste già registrate nello storico
  restano invariate
- **Stato**: da fare: T13/T19; l'autenticazione dell'operatore non è ancora
  implementata

### UC5 — Monitoraggio dello stato dei componenti

- **Attore**: Amministratore tecnico
- **Precondizione**: amministratore tecnico autenticato
- **Risultato osservabile**: viene mostrato lo stato di salute dei componenti
  principali (in particolare la comunicazione simulatore-backend),
  permettendo di diagnosticare un'anomalia
- **Stato**: da fare: T17; l'autenticazione dell'amministratore tecnico non è
  ancora implementata

### UC6 — Un responsabile di area autorizza un badge sulla propria area

- **Attore**: Responsabile di area
- **Precondizione**: responsabile autenticato; l'area indicata è tra quelle
  di sua competenza (altrimenti l'operazione è rifiutata, vedi RF10)
- **Risultato osservabile**: il badge indicato risulta autorizzato su
  quell'area dal momento della richiesta; un tentativo sulla stessa area ma
  non di sua competenza viene respinto con errore, non silenziosamente
  ignorato
- **Stato**: da fare: T19; l'autenticazione del responsabile di area non è
  ancora implementata

*Questa funzionalità deriva dalla risposta del cliente/docente alla domanda #6,
registrata in `docs/domande-cliente.md`.*
