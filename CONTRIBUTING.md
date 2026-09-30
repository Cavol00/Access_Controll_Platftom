# CONTRIBUTING

| | |
|---|---|
| **Progetto** | Access Control Platform — Aurea Precision Components S.p.A. |
| **Team** | LeCucciole — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| **Data** | 30/09/2026 |
| **Versione** | v0.1 |

Queste regole valgono per **tutti** i membri del team, comprese le persone che
le hanno scritte. Se una regola non viene rispettata da nessuno, cambiatela
qui — non ignoratela in silenzio.

## Branch strategy

```
main        sempre funzionante, nessun commit diretto
feature/    nuova funzionalità
fix/        correzione di un bug
docs/       solo documentazione
```

> Esempi: `feature/valutazione-accesso`, `fix/filtro-storico-periodo`,
> `docs/architecture-v2`.

Un branch vive il tempo di un'attività: nasce da `main` aggiornato, si
sviluppa, si integra con una Pull Request e si chiude (GitHub lo cancella
automaticamente dopo il merge). Non deve durare più di qualche giorno.

```bash
git switch main && git pull
git switch -c feature/nome-attivita
# ... lavoro e commit ...
git push -u origin feature/nome-attivita
gh pr create --base main
```

## Convenzioni di commit

Formato: prefisso + descrizione al presente, che dice il "cosa", non il "come"
(il come si legge nel diff).

```
feat:   nuova funzionalità
fix:    correzione di un bug
docs:   solo documentazione
test:   aggiunta o modifica di test
```

> Esempio: `feat: aggiungi filtro storico accessi per area`

Niente messaggi come "wip", "fix", "cose varie": chi legge la storia tra un
mese deve capire perché quel commit esiste.

## Pull request e review

- **Chi può fare merge su `main`?** Chiunque nel team, ma solo tramite Pull
  Request approvata.
- **Quante approvazioni servono?** 1, da un membro che non ha scritto il codice.
- **Cosa NON è accettabile in una review?** Approvare senza aver letto il
  diff; bloccare una PR per una preferenza di stile senza motivarla; fare
  merge della propria PR senza approvazione.

## Gestione dei conflitti

Se un conflitto non si risolve in 10 minuti, si chiama un altro membro del
team prima di forzare una scelta da soli. Mai `git push --force` su `main`.

## Definition of Done

Una issue è fatta quando:

- il codice è mergiato su `main` tramite PR approvata
- tutti i criteri "Fatto quando" della voce di backlog sono soddisfatti
- esiste un modo di verificarla (test automatico o passi manuali descritti nella PR)
- la documentazione in `docs/` è aggiornata se la modifica la riguarda
- nessun secret, credenziale o file `.env` è presente nel codice (RNF4)
- la issue collegata è spostata in "fatto"

## Issue e board

Le issue vivono in GitHub Issues di questo repository, la board in GitHub
Projects. Stati:

```
da fare → in corso → in revisione → fatto
```
