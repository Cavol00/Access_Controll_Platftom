# Lezione 4 · HTTP, REST, progettazione delle API e test

- **Corso:** UF14 · Architettura delle applicazioni (Trilogis Srl)
- **Data e orario:** 14/10/2026 · 08:30 – 12:30 · 4 ore · aula TS5
- **Docente:** Nicola Dorigatti (nicola.dorigatti@trilogis.it · trilogis.it)
- **Obiettivo:** oggi il contratto tra frontend e backend diventa scritto, leggibile e verificabile: OpenAPI e i primi test delle API.

---

## La giornata

| Ora | Argomento |
|-----|-----------|
| 08:30 | HTTP: richiesta, risposta, metodi, status code |
| 09:45 | JSON, principi REST |
| 10:15 | Pausa |
| 10:30 | Progettazione dell'API, contratto OpenAPI, test |
| 11:15 | **Laboratorio**: endpoint, OpenAPI, test, integrazione |
| 12:15 | Giro di consegne e chiusura |

- A fine giornata almeno un endpoint reale è documentato, testato e chiamato dal frontend.
- Gli esempi di codice usano JavaScript e Python: il vostro stack può essere un altro, il principio no.

---

## Parte 1 — Il protocollo che già usate

Argomenti: 1. Richiesta e risposta · 2. Metodi HTTP · 3. Status code

### 1. Una conversazione, resa esplicita

Dalla lezione 3 il backend legge e scrive sul database. Oggi rendete **esplicito** il modo in cui frontend e backend si parlano: **HTTP**.

- **HTTP** è il protocollo richiesta-risposta che usa ogni chiamata tra browser e API.
- Ogni richiesta è **un'operazione compiuta**: non esiste "quasi fatta" o un esito nascosto nel testo di un errore.
- Il client manda **metodo + percorso + intestazioni + (eventuale) corpo**.
- Il server risponde con **status + intestazioni + (eventuale) corpo**.
- Tutto ciò che serve per capire cosa è successo sta in questi elementi, non in un messaggio a schermo.

### 1. Vedere l'HTTP con i propri occhi

`curl -v` mostra esattamente cosa parte dal client (`>`) e cosa torna dal server (`<`):

```
$ curl -v https://api.nordfacility.it/interventi/42
> GET /interventi/42 HTTP/1.1
> Host: api.nordfacility.it
> Accept: application/json
>
< HTTP/1.1 200 OK
< Content-Type: application/json
<
{ "id": 42, "edificio": "Sede Nord", "stato": "assegnato" }
```

*Prima di chiedervi perché "una chiamata non funziona", guardate cosa è partito davvero.*

### 1. Anatomia di richiesta e risposta

**Richiesta · client → server**

- **Riga di richiesta:** `GET /interventi/42 HTTP/1.1`
- **Intestazioni (headers):**
  ```
  Host: api.nordfacility.it
  Accept: application/json
  Authorization: Bearer eyJhbGci...
  ```
- *(riga vuota)*
- **Corpo (body):** assente — una GET di norma non invia corpo (POST/PUT/PATCH lo usano per i dati)

**Risposta · server → client**

- **Riga di stato:** `HTTP/1.1 200 OK`
- **Intestazioni (headers):**
  ```
  Content-Type: application/json
  Content-Length: 61
  Cache-Control: no-store
  ```
- *(riga vuota)*
- **Corpo (body):** `{ "id": 42, "stato": "assegnato" }` — la rappresentazione della risorsa

Stessa struttura per ogni chiamata: riga iniziale, intestazioni, riga vuota, corpo — cambia solo il contenuto.

### 2. I metodi HTTP

| Metodo | Uso | Esempio Smart Maintenance |
|--------|-----|---------------------------|
| GET | legge una risorsa | `GET /interventi/42` |
| POST | crea una risorsa | `POST /interventi` |
| PUT | sostituisce l'intera risorsa | `PUT /interventi/42` |
| PATCH | modifica alcuni campi | `PATCH /interventi/42` |
| DELETE | elimina una risorsa | `DELETE /interventi/42/allegati/7` |

Il metodo dichiara l'intenzione: chi legge la richiesta sa già cosa aspettarsi, prima ancora di leggere il corpo.

### 2. Idempotenza: quando ripetere non fa danno

> **Idempotente** = ripetere la stessa richiesta più volte produce lo stesso risultato della prima.

- **GET, PUT, DELETE** sono idempotenti per contratto. **POST no.**
- **Errore tipico:** rete lenta, l'utente clicca due volte "Crea intervento" → **due interventi duplicati**, perché ogni `POST` ne crea uno nuovo.
- **Soluzione pratica:** header `Idempotency-Key` generato dal client; il server ignora una seconda richiesta con la stessa chiave.

```
POST /interventi
Idempotency-Key: 8f14e45f-ceea-4abc-9a3f-2b1e7c0d5f11

{ "edificio": "sede-nord", "categoria": "elettrico" }
```

### 3. Status code: dire la verità sull'esito

- **2xx** — ha funzionato: la richiesta è stata capita ed eseguita.
- **4xx** — hai sbagliato tu (client): dati non validi, permessi, risorsa inesistente.
- **5xx** — ha sbagliato il server: bug, timeout, servizio non disponibile.
- Il client **deve distinguere** 4xx da 5xx: un 4xx non si ripete da solo, un 5xx spesso sì.

> **Errore tipico:** rispondere sempre `200 OK` con `{"success": false}` nel corpo. Il client non può reagire senza leggere il body a mano — e chi integra la vostra API non lo sa fare.

### 3. I codici che usate ogni giorno

| Codice | Significa | Esempio Smart Maintenance |
|--------|-----------|---------------------------|
| 200 OK | richiesta riuscita | `GET /interventi/42` trovato |
| 201 Created | risorsa creata | `POST /interventi` → nuovo intervento |
| 204 No Content | riuscita, nessun corpo | `DELETE /interventi/42/allegati/7` |
| 400 Bad Request | dati non validi | categoria mancante |
| 401 Unauthorized | non sei autenticato | token assente o scaduto |
| 403 Forbidden | autenticato, non autorizzato | tecnico chiude un intervento non suo |
| 404 Not Found | risorsa inesistente | `GET /interventi/999999` |
| 409 Conflict | stato incompatibile | chiudere un intervento già chiuso |

---

## Parte 2 — Dati e stile architetturale

Argomenti: 4. JSON · 5. Principi REST

### 4. JSON: la lingua franca dei body

- Oggetti `{}`, liste `[]`, chiavi sempre tra **virgolette doppie**, niente commenti, niente virgola finale.
- Tipi disponibili: stringa, numero, booleano, `null`, array, oggetto — niente date native: si usa una **stringa ISO 8601**.
- **Errore tipico:** confondere `null` (il campo esiste, vuoto) con un campo **assente** (mai inviato). In un `PATCH` parziale la differenza cambia il comportamento.

```json
{
  "id": 42,
  "edificio": "Sede Nord",
  "stato": "assegnato",
  "assegnatoA": "m.bianchi",
  "creatoIl": "2026-10-14T09:30:00Z",
  "allegati": ["foto-1.jpg"]
}
```

### 5. Principi REST: le risorse hanno un indirizzo

- **REST** è uno stile architetturale: ogni cosa è una **risorsa** con un **URI** stabile.
- Risorse = **sostantivi plurali**: `/interventi`, `/tecnici`, `/edifici` — non `/creaIntervento` o `/getInterventi`.
- L'**operazione** la dice il metodo HTTP, non il nome del percorso.
- Risorse annidate quando una appartiene all'altra: `/interventi/42/allegati`, `/interventi/42/allegati/7`.

> **Errore tipico:** `/api/interventoCreate?edificio=sede-nord`. È un URL che funziona, ma non è un'API REST: il verbo è nel nome, non nel metodo.

### 5. Client-server, stateless, rappresentazioni

- **Stateless:** ogni richiesta porta **tutto ciò che serve** a essere capita da sola (token, filtri) — il server non "ricorda" la richiesta precedente.
- Conseguenza pratica: potete riavviare il backend, o smistarlo su più istanze, senza rompere nulla (lezioni 3 e 5).
- Una risorsa può avere più **rappresentazioni**: JSON oggi, magari un export CSV domani — l'URI resta lo stesso, cambia solo `Accept`.
- Il contratto REST è tra client e server: nessuno dei due deve sapere come è fatto l'altro **dentro**.

---

## Parte 3 — Dal caso d'uso al contratto

Argomenti: 6. Progettazione dell'API · 7. Contratto e documentazione

### 6. Dai casi d'uso agli endpoint

Metodo meccanico: **caso d'uso → verbo + risorsa → endpoint**. Dalla lezione 1:

> "Il tecnico aggiorna lo stato di un intervento assegnato" → `PATCH /interventi/{id}`

| Caso d'uso | Endpoint |
|------------|----------|
| Il segnalatore crea un intervento | `POST /interventi` |
| Il tecnico vede i suoi interventi | `GET /interventi?assegnatoA=me` |
| Il tecnico aggiunge una foto | `POST /interventi/{id}/allegati` |
| Il responsabile assegna un tecnico | `POST /interventi/{id}/assegnazioni` |
| Il responsabile chiude un intervento | `PATCH /interventi/{id}` |

### 6. Parametri, filtri e paginazione

```
GET /interventi?stato=aperto&edificio=sede-nord&page=2&pageSize=20 HTTP/1.1
```

→ `200 OK`

```json
{
  "dati": [ { "id": 42, "stato": "aperto" } ],
  "pagina": 2,
  "totalePagine": 14,
  "totaleElementi": 271
}
```

- Il **path** identifica la risorsa (`/interventi/42`); la **query string** filtra, ordina, pagina.
- Senza paginazione, la lista con 5.000 interventi (requisito non funzionale, lezione 1) torna intera: lenta per il server, inutile a schermo.

### 6. Il ciclo di vita di una risorsa

Stati dell'intervento e transizioni:

- **Aperto** (appena creato) —*assegna*→ **Assegnato** (un tecnico è responsabile)
- **Assegnato** —*avvia*→ **In lavorazione** (il tecnico è sul posto)
- **In lavorazione** —*risolve*→ **Risolto** (in attesa di verifica)
- **Risolto** —*chiude*→ **Chiuso** (stato finale)
- **Aperto** —*annulla*→ **Annullato** (non si procede)
- **Assegnato** —*annulla*→ **Annullato**

Ogni transizione è un `PATCH` sullo stesso endpoint: il verbo non cambia, cambia il valore di `stato`.

### 7. Il contratto scritto: OpenAPI

La lezione 1 lo aveva promesso: *"il formato preciso è la lezione 4"*. Eccolo: **OpenAPI** (ex Swagger) descrive l'API in un file leggibile da umani e da macchine.

```yaml
paths:
  /interventi/{id}:
    get:
      summary: Dettaglio di un intervento
      parameters:
        - name: id
          in: path
          schema: { type: integer }
      responses:
        '200': { description: Intervento trovato }
        '404': { description: Intervento inesistente }
```

### 7. Perché scriverlo davvero

- Genera automaticamente una **documentazione interattiva** (Swagger UI): chi consuma l'API la prova senza chiedervi nulla.
- Permette di **validare** le richieste prima che arrivino al vostro codice.
- È la base per **generare client** in altri linguaggi, senza indovinare i campi.
- Se il contratto e il codice divergono, **il contratto ha vinto**: aggiornatelo nello stesso commit.

> Un endpoint non documentato non esiste, per chi deve integrarlo.

---

## Parte 4 — Fidarsi, ma verificare

Argomento: 8. Test delle API

### 8. Cosa testare, sempre

| Categoria | Esempio Smart Maintenance | Esito atteso |
|-----------|---------------------------|--------------|
| Happy path | `GET /interventi/42` esistente | 200 + corpo corretto |
| Input non valido | `POST /interventi` senza edificio | 400 |
| Risorsa inesistente | `GET /interventi/999999` | 404 |
| Errore lato server | il database non risponde | 500, non un crash silenzioso |

Ogni endpoint del contratto ha **almeno** questi quattro test: se manca uno, l'endpoint non è finito.

### 8. Un test, per davvero

```python
def test_get_intervento_esistente():
    r = requests.get(f"{BASE}/interventi/42")
    assert r.status_code == 200
    assert r.json()["stato"] in ["aperto", "assegnato", "risolto"]

def test_get_intervento_inesistente():
    r = requests.get(f"{BASE}/interventi/999999")
    assert r.status_code == 404

def test_post_intervento_senza_edificio():
    r = requests.post(f"{BASE}/interventi", json={"categoria": "elettrico"})
    assert r.status_code == 400
```

Non pseudo-codice: fatelo girare contro l'API vera, non contro quella che immaginate.

### 8. Lo stesso contratto, dal frontend

Il frontend chiama l'API con lo **stesso contratto** che avete appena testato: nessuna sorpresa.

```javascript
const res = await fetch(`${API_BASE}/interventi?stato=aperto`);
if (!res.ok) {
  mostraErrore(res.status);   // 401, 404, 500: reazioni diverse
  return;
}
const { dati } = await res.json();
renderLista(dati);
```

- Se il test del backend passa ma il frontend riceve un errore, il problema è nel **contratto**, non nel codice: confrontate con l'OpenAPI.
- Da oggi: **un endpoint reale**, testato, collegato al frontend — non più un mock.

---

## Laboratorio · 60 minuti

1. **Endpoint dai casi d'uso — 10'**
   Riprendete `use-cases.md` (lezione 1): elencate gli endpoint mancanti per il vostro cliente.
2. **Provateli a mano — 15'**
   `curl`, Bruno o Postman sull'API già collegata al database (lezione 3).
3. **Scrivete il contratto — 15'**
   OpenAPI dei 3-4 endpoint principali. → `docs/api.md` oppure `openapi.yaml`
4. **Test automatici — 10'**
   Happy path + almeno un caso di errore per endpoint. → cartella `tests/`
5. **Un filo frontend-backend — 10'**
   Collegate una vista reale a un endpoint reale, non a un mock.

---

## Output atteso

```
docs/
└── api.md        oppure openapi.yaml — il contratto scritto
```

- **Endpoint REST** principali implementati e raggiungibili.
- **Test minimi** per ciascun endpoint: casi corretti e errori prevedibili.
- **Frontend collegato** ad almeno un endpoint reale.

Da oggi il contratto vive nel repository insieme al codice che lo implementa: se cambia uno, cambia anche l'altro.

---

## La prossima volta

**Lezione 5 — mercoledì 21/10 — Manolo Rinaldi**

**Container e orchestrazione applicativa con MicroK8s/Kubernetes**

- Dal processo al container: l'immagine della vostra API.
- Deployment, Service, ConfigMap e Secret su MicroK8s.
- L'API che avete appena contrattualizzato gira in un pod.

*Portate un backend che risponde davvero alle chiamate: da mercoledì lo mettete in un container.*

---

## Contatti

Nicola Dorigatti · nicola.dorigatti@trilogis.it
Trilogis Srl · trilogis.it
