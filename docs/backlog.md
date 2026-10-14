# Backlog iniziale — Access Control Platform / Aurea Precision Components S.p.A.

| | |
|---|---|
| **Team** | *(nome team — da definire)* — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| **Cliente** | Aurea Precision Components S.p.A. |
| **Data** | 23/09/2026 |

## Voci

### 1.

Come simulatore lettore badge voglio inviare una richiesta di accesso (badge,
varco, timestamp) e ricevere `ACCESS_GRANTED` o `ACCESS_DENIED`, per
verificare in tempo reale se un dipendente può entrare in un'area.

**Fatto quando:**
- la richiesta restituisce sempre uno dei due esiti
- un badge con permesso attivo sull'area riceve `GRANTED`
- un badge senza permesso riceve `DENIED`
- l'esito è deterministico: stessa richiesta, stessa configurazione, stessa risposta

### 2.

Come amministratore sicurezza voglio configurare edifici, aree e varchi, per
definire il perimetro fisico su cui si applicano le autorizzazioni.

**Fatto quando:**
- posso creare, modificare ed eliminare edifici, aree e varchi
- ogni varco è associato a una sola area
- le modifiche sono visibili subito nella configurazione

### 3.

Come amministratore sicurezza voglio creare utenti e badge virtuali e
associarli ad aree autorizzate, per stabilire chi può accedere dove.

**Fatto quando:**
- posso creare un utente con uno o più badge
- posso associare o rimuovere un'autorizzazione tra un badge e un'area
- un badge senza autorizzazioni non ottiene mai `GRANTED`

### 4.

Come sistema voglio registrare ogni tentativo di accesso con esito e
motivazione, per mantenere uno storico affidabile e verificabile.

**Fatto quando:**
- ogni richiesta valutata genera una riga di storico
- la riga contiene badge, varco, area, timestamp, esito e motivazione
- lo storico non è modificabile dagli operatori

### 5.

Come amministratore sicurezza voglio consultare e filtrare lo storico degli
accessi per badge, area, varco e periodo, per analizzare eventi e anomalie.

**Fatto quando:**
- posso filtrare almeno per badge, area e intervallo di date
- i tentativi negati sono visivamente distinti dagli altri
- la ricerca restituisce solo risultati coerenti con i filtri applicati

### 6.

Come responsabile di area voglio consultare lo storico degli accessi solo per
le aree di mia competenza, per non vedere dati che non mi riguardano.

**Fatto quando:**
- la lista mostra solo gli eventi delle aree assegnate al responsabile
- un responsabile non vede eventi di altre aree nemmeno chiamando l'API a mano
- le aree di competenza di un responsabile sono configurabili dall'amministratore sicurezza

### 7.

Come amministratore sicurezza voglio modificare o revocare un'autorizzazione
esistente, per adeguare gli accessi quando cambia il ruolo di un dipendente.

**Fatto quando:**
- dopo la modifica, le richieste successive riflettono il nuovo permesso
- le richieste già registrate nello storico non cambiano
- la modifica stessa è tracciata: chi l'ha fatta, cosa ha cambiato, quando

### 8.

Come operatore (amministratore sicurezza o tecnico) voglio autenticarmi prima
di accedere alla console, per garantire che solo personale autorizzato
configuri il sistema.

**Fatto quando:**
- senza autenticazione non è possibile usare nessuna funzione della console
- le operazioni disponibili dipendono dal ruolo dell'operatore
- un tentativo di accesso non autorizzato viene respinto e registrato

### 9.

Come amministratore tecnico voglio monitorare lo stato dei componenti, in
particolare la comunicazione tra simulatore e backend, per diagnosticare
rapidamente un malfunzionamento.

**Fatto quando:**
- esiste una vista o un endpoint che mostra lo stato dei componenti principali
- un'interruzione di comunicazione è visibile entro pochi secondi
- esiste una procedura documentata per la verifica

### 10.

Come amministratore sicurezza voglio poter definire fasce orarie o
autorizzazioni temporanee per un badge, per gestire casi come consulenti
esterni o turni straordinari.

**Fatto quando:**
- un'autorizzazione può avere una data/ora di inizio e fine opzionali
- fuori dalla fascia configurata l'accesso viene negato anche se l'autorizzazione esiste
- *voce a rischio: può restare fuori dal primo rilascio se il tempo non basta*
