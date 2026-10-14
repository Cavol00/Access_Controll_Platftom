| | |
|---|---|
| Team | LeCucciole — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| Data | 14/10/2026 |
| Versione | v1 — lezione 3 |

Entità e relazioni
Le entità vengono dai casi d'uso (use-cases.md): sono i sostantivi che
devono esistere anche dopo un riavvio del backend.

| Caso d'uso | Entità candidate |
|---|---|
| UC1 · il simulatore invia badge, varco e orario | Badge, Varco, EventoAccesso |
| UC2 · l'amministratore configura dipendenti, badge e autorizzazioni | Dipendente, Badge, Autorizzazione |
| RF2 · definire edifici, aree e varchi | Edificio, Area, Varco |
| UC3 · consultare lo storico | EventoAccesso |
| UC4 · revocare un'autorizzazione | attributo revocata_il di Autorizzazione |

Entità
| Entità | Attributi (tipo) | Relazioni |
|---|---|---|
| Edificio | id (intero), nome (testo, unico) | ← molte Aree |
| Area | id (intero), nome (testo), edificio_id | → Edificio · ← molti Varchi · ← molte Autorizzazioni |
| Varco | id (intero), codice (testo, unico), area_id | → una sola Area |
| Dipendente | id (intero), nome (testo), attivo (sì/no) | ← un Badge |
| Badge | id (intero), codice (testo, unico), dipendente_id (unico), attivo (sì/no) | → Dipendente, uno a uno · ← molte Autorizzazioni |
| Autorizzazione | id (intero), badge_id, area_id, valida_dal (data/ora), valida_fino (data/ora, facoltativa), revocata_il (data/ora, facoltativa), creata_il (data/ora) | → Badge · → Area |
| EventoAccesso | id (intero), codice_badge (testo), codice_varco (testo), area_id (facoltativo), richiesto_il (data/ora), esito (ACCESS_GRANTED/ACCESS_DENIED), motivazione (testo), registrato_il (data/ora) | → Area, se il varco esisteva |

→ = "riferisce", ← = "è referenziata da".
Sostantivi scartati
| Sostantivo | Perché non è un'entità |
|---|---|
| storico accessi | è l'insieme degli EventoAccesso: una query |
| tentativi negati | query su EventoAccesso con esito ACCESS_DENIED |
| esito, motivazione | attributi di EventoAccesso |
| permesso | sinonimo di Autorizzazione |
| simulatore, lettore badge | componenti del sistema, non dati da conservare |
| sessione dell'operatore collegato | stato temporaneo: vive in memoria |

Cosa va nel database
| Dato | In memoria | Nel database |
|---|---|---|
| Sessione dell'operatore collegato | ✓ | |
| Edifici, aree, varchi, dipendenti, badge | | ✓ |
| Autorizzazioni, anche quelle revocate | | ✓ |
| Eventi di accesso | | ✓ |

Il cliente non prevede file allegati, quindi non serve uno storage per file.

Operazioni e chi le può fare
Per ora è un'annotazione: l'autorizzazione vera arriva più avanti nel corso.

| Operazione | Su Badge | Su Autorizzazione | Chi |
|---|---|---|---|
| Create | assegna un badge a un dipendente | autorizza un badge su un'area | Amministratore sicurezza; per le autorizzazioni anche il Responsabile di area, solo sulle sue aree |
| Read | consulta un badge | elenca le autorizzazioni | Amministratore sicurezza, Responsabile di area |
| Update | disattiva o riattiva | revoca (imposta revocata_il) | come Create |
| Delete | elimina un badge assegnato per errore | non previsto: si revoca, non si cancella | Amministratore sicurezza |

Entità previste, non ancora nello schema
Operatore (chi usa la console: username, password cifrata, ruolo) e
l'associazione con le aree di cui è responsabile.
VoceAudit (chi ha cambiato quale permesso e quando).

Entrano nello schema quando si costruiscono autenticazione e permessi.
## Schema delle tabelle.
erDiagram
  edifici ||--o{ aree : contiene
  aree ||--o{ varchi : ha
  dipendenti ||--|| badge : possiede
  badge ||--o{ autorizzazioni : riceve
  aree ||--o{ autorizzazioni : riguarda
  aree |o--o{ eventi_accesso : registra

```
CREATE TABLE edifici (
  id   INTEGER PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE
);

CREATE TABLE aree (
  id          INTEGER PRIMARY KEY,
  nome        TEXT NOT NULL,
  edificio_id INTEGER NOT NULL REFERENCES edifici(id),
  UNIQUE (nome, edificio_id)
);

CREATE TABLE varchi (
  id      INTEGER PRIMARY KEY,
  codice  TEXT NOT NULL UNIQUE,
  area_id INTEGER NOT NULL REFERENCES aree(id)
);

CREATE TABLE dipendenti (
  id     INTEGER PRIMARY KEY,
  nome   TEXT NOT NULL,
  attivo INTEGER NOT NULL DEFAULT 1 CHECK (attivo IN (0, 1))
);

CREATE TABLE badge (
  id            INTEGER PRIMARY KEY,
  codice        TEXT NOT NULL UNIQUE,
  dipendente_id INTEGER NOT NULL UNIQUE REFERENCES dipendenti(id),
  attivo        INTEGER NOT NULL DEFAULT 1 CHECK (attivo IN (0, 1))
);

CREATE TABLE autorizzazioni (
  id          INTEGER PRIMARY KEY,
  badge_id    INTEGER NOT NULL REFERENCES badge(id),
  area_id     INTEGER NOT NULL REFERENCES aree(id),
  valida_dal  TEXT NOT NULL,
  valida_fino TEXT CHECK (valida_fino IS NULL OR valida_fino > valida_dal),
  revocata_il TEXT,
  creata_il   TEXT NOT NULL
);

CREATE TABLE eventi_accesso (
  id            INTEGER PRIMARY KEY,
  codice_badge  TEXT NOT NULL,
  codice_varco  TEXT NOT NULL,
  area_id       INTEGER REFERENCES aree(id),
  richiesto_il  TEXT NOT NULL,
  esito         TEXT NOT NULL CHECK (esito IN ('ACCESS_GRANTED', 'ACCESS_DENIED')),
  motivazione   TEXT NOT NULL,
  registrato_il TEXT NOT NULL
);
```
