# Backlog iniziale — Access Control Platform / Aurea Precision Components S.p.A.

| | |
|---|---|
| **Team** | LeCucciole — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| **Cliente** | Aurea Precision Components S.p.A. |
| **Data** | 20/10/2026 |

Voci ordinate per valore e rischio: prima ciò che, se sbagliato, costringerebbe
a cambiare l'architettura. Ogni "Fatto quando" si verifica con un sì o un no.
Le risposte del cliente alle domande aperte (`domande-cliente.md`) sono già
incluse. Ogni voce è una o più issue su GitHub; la voce 3 ha priorità alta.

## Voci

### 1. Valutare una richiesta di accesso

Come simulatore lettore badge voglio inviare badge, varco e orario e ricevere
`ACCESS_GRANTED` o `ACCESS_DENIED`, per sapere se aprire il varco.

**Fatto quando:**
- la risposta contiene sempre `ACCESS_GRANTED` o `ACCESS_DENIED`, mai altro
- un badge autorizzato sull'area del varco riceve `ACCESS_GRANTED`
- lo stesso badge su un varco di un'altra area riceve `ACCESS_DENIED`
- badge sconosciuto, badge disattivato o varco sconosciuto ricevono `ACCESS_DENIED`
- la risposta arriva entro 5 secondi (soglia data dal cliente)
- due richieste identiche, con la stessa configurazione, ricevono lo stesso esito

*Perché qui:* è il cuore del sistema; se il modello badge → area → varco è
sbagliato, cambia tutto il resto.

### 2. Registrare ogni tentativo

Come amministratore sicurezza voglio che ogni tentativo di accesso, concesso o
negato, resti registrato con esito e motivazione, per poter ricostruire chi ha
provato ad accedere, dove e quando.

**Fatto quando:**
- dopo N richieste di accesso lo storico contiene esattamente N righe nuove
- ogni riga riporta badge, varco, area, data e ora, esito e motivazione
- nessuna funzione del sistema permette di modificare o cancellare una riga dello storico

*Perché qui:* è un criterio di accettazione del cliente e decide la struttura
dei dati (storico immutabile).

### 3. Accesso degli operatori con credenziali e ruolo

**Priorità: alta** — oggi nessun endpoint richiede autenticazione, e per una
piattaforma di controllo accessi è il difetto più grave (riscontro del
docente, 15/10/2026). Va fatta subito dopo la voce 1, prima di aggiungere
altri endpoint di configurazione.

Come amministratore sicurezza voglio che la console si usi solo dopo il login,
e che ogni operatore possa fare solo ciò che il suo ruolo consente, per
impedire modifiche ai permessi da parte di chi non è autorizzato.

**Fatto quando:**
- senza login nessuna funzione amministrativa è utilizzabile
- con password errata il login viene rifiutato
- un operatore che tenta un'operazione non permessa al suo ruolo viene respinto con un errore
  esplicito
- nessuna password o chiave è scritta nel codice sorgente

*Perché qui:* senza autenticazione chiunque raggiunga l'API può leggere lo
storico e, quando esisteranno, modificare i permessi; inoltre il modello dei
ruoli condiziona le voci 7–9.

### 4. Edifici, aree e varchi

Come amministratore sicurezza voglio definire edifici, aree e varchi, per
descrivere nel sistema la struttura fisica della sede.

**Fatto quando:**
- posso creare ed eliminare edifici, aree e varchi
- ogni area appartiene a un edificio, ogni varco a una sola area
- una richiesta di accesso su un varco appena creato viene valutata, non
  respinta come "varco sconosciuto"

*Perché qui:* senza struttura fisica non si può autorizzare nulla.

### 5. Dipendenti e badge

Come amministratore sicurezza voglio registrare un dipendente con il suo badge
e poterlo disattivare, per controllare quali badge sono in uso.

**Fatto quando:**
- posso creare un dipendente e assegnargli un badge
- un secondo badge per lo stesso dipendente viene rifiutato con un errore
  comprensibile (un badge per dipendente, confermato dal cliente)
- un badge disattivato riceve `ACCESS_DENIED` anche se ha autorizzazioni attive

*Perché qui:* serve prima di poter autorizzare.

### 6. Autorizzare un badge su una o più aree

Come amministratore sicurezza voglio autorizzare un badge su una o più aree,
anche con una data di fine, per stabilire chi può entrare dove e fino a quando.

**Fatto quando:**
- dopo l'autorizzazione il badge riceve `ACCESS_GRANTED` sui varchi di quell'area
- lo stesso badge può essere autorizzato su più aree contemporaneamente
  (confermato dal cliente)
- dopo la data di fine, l'accesso a quell'area viene negato

*Perché qui:* è la regola su cui lavora la voce 1.

### 7. Revocare un'autorizzazione

Come amministratore sicurezza voglio revocare un'autorizzazione, per togliere
un accesso quando cambia il ruolo di un dipendente.

**Fatto quando:**
- la prima richiesta dopo la revoca riceve `ACCESS_DENIED`
- gli eventi registrati prima della revoca restano invariati
- un registro delle modifiche (audit log) riporta chi ha revocato, quale
  autorizzazione e quando

*Perché qui:* è un criterio di accettazione del cliente ("le modifiche ai
permessi influenzano le richieste successive").

### 8. Consultare lo storico

Come amministratore sicurezza voglio consultare lo storico filtrandolo per
badge, varco ed esito, per analizzare i tentativi negati.

**Fatto quando:**
- ogni filtro restituisce solo eventi che lo soddisfano
- filtrando per esito "negati" compaiono solo eventi `ACCESS_DENIED`
- nella console i negati sono distinguibili dai concessi a colpo d'occhio

*Perché qui:* è un criterio di accettazione del cliente, ma dipende dalle
voci 2 e 3.

### 9. Il responsabile di area governa solo la propria area

Come responsabile di area voglio vedere lo storico e gestire le autorizzazioni
solo delle mie aree, per controllare gli accessi del mio reparto senza toccare
quelli degli altri.

**Fatto quando:**
- lo storico mostra solo eventi delle sue aree, anche interrogando il sistema
  senza passare dalla console
- può creare e revocare autorizzazioni sulle sue aree
- un'autorizzazione su un'area non sua viene rifiutata con un errore esplicito

*Perché qui:* è una richiesta esplicita del cliente e cambia il modello dei
permessi, ma si appoggia alle voci 3, 6 e 7.

### 10. Monitorare lo stato del sistema

Come amministratore tecnico voglio sapere se il backend e il database
funzionano e quando è arrivata l'ultima richiesta dal simulatore, per
diagnosticare un problema di comunicazione.

**Fatto quando:**
- esiste un controllo di stato che risponde positivamente quando il backend è attivo
- lo stato dettagliato indica se il database è raggiungibile e l'ora
  dell'ultimo evento ricevuto dal simulatore
- la procedura di avvio e verifica è scritta nella documentazione

*Perché qui:* utile all'esercizio, ma non blocca nessun'altra funzionalità.

## Fuori dal backlog iniziale

- **Fasce orarie ricorrenti** (es. accesso solo 8–18 nei giorni feriali): il
  cliente le indica come evoluzione futura. La v1 prevede solo una data di
  fine (voce 6).
- **Rilevamento automatico dei tentativi "anomali"**: in attesa di una
  definizione dal cliente (domanda #5). La v1 evidenzia i negati (voce 8).
- **Esportazione degli eventi verso sistemi esterni**: integrazione futura
  dichiarata dal cliente, fuori dal perimetro della v1.
