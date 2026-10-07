# Modello dei dati

## Entità principali

| Entità | Attributi principali |
|---|---|
| Dipendente | id, nome, email, attivo |
| Badge | id, codice, dipendente, attivo |
| Edificio | id, nome, indirizzo |
| Area | id, edificio, nome |
| Varco | id, area, codice |
| Autorizzazione | id, badge, area, validità, revoca |
| Segnalazione | id, badge, varco, data/ora, esito, motivazione |

## Relazioni

- Un dipendente possiede un badge.
- Un edificio contiene più aree e un'area appartiene a un edificio.
- Un'area ha più varchi e un varco appartiene a una sola area.
- Un badge può avere autorizzazioni su più aree.
- Una segnalazione registra un tentativo di accesso fatto da un badge su un varco.
