# Domande al cliente — Access Control Platform / Aurea Precision Components S.p.A.

| | |
|---|---|
| **Team** | *(nome team — da definire)* — Dario D'Alessandro, Nicolò Florean, Gianmarco Tonelli |
| **Cliente** | Aurea Precision Components S.p.A. |
| **Data** | 23/09/2026 |

## Domande risolte dal cliente

| # | Domanda | Risposta del cliente (23/09/2026) | Cosa è cambiato nel progetto |
|---|---|---|---|
| 1 | "Rapida e prevedibile" per la valutazione di una richiesta di accesso: qual è la soglia di tempo concreta accettabile? | **5 secondi** | RNF1 aggiornato con la soglia; aggiunto un test (`RNF1` in `tests/api.test.ts`) che verifica che una richiesta di accesso risponda sotto i 5 secondi |
| 3 | Un utente può avere più badge attivi contemporaneamente? Un badge può essere condiviso da più utenti? | **No, un badge per dipendente** | `badges.employee_id` è ora `UNIQUE` (`src/db/schema.sql`): un dipendente ha esattamente un badge, un badge appartiene a esattamente un dipendente. Il seed è stato aggiornato (il badge disattivato ora appartiene a un quarto dipendente dedicato, non più condiviso con un altro badge) |
| 4 | Un'area può avere più varchi, e un varco può dare accesso a più aree contemporaneamente? | **Un badge può aprire più aree, se configurato così** — la flessibilità richiesta sta nell'autorizzazione badge↔area, non nel varco | Nessuna modifica al modello varco↔area (resta 1 varco = 1 area, non era in discussione): confermato che un badge può già essere autorizzato su più aree contemporaneamente tramite più righe in `authorizations` — il seed lo dimostra (BADGE-TEST-001 è autorizzato su Laboratorio *e* Magazzino) |
| 6 | Un responsabile di area può anche modificare le autorizzazioni della propria area, o solo consultarle? | **Sì: il responsabile di area può consultare *e modificare* le autorizzazioni della propria area di riferimento** | Nuovo requisito RF10. `POST/DELETE /api/authorizations` ora accettano anche il ruolo `responsabile_area`, limitato alle aree assegnate (`area_managers`); lettura di `GET /api/badges` e `GET /api/areas` estesa allo stesso ruolo (quest'ultima filtrata alle sole aree di competenza) per poter compilare il form. Nuovo caso d'uso UC6, nuovi test `RF10` |

## Domande ancora aperte

| # | Domanda | Perché è ambigua | Impatto se cambia la risposta |
|---|---|---|---|
| 2 | Se il backend non è raggiungibile o non risponde in tempo a una richiesta del simulatore, il varco deve negare per default (fail-closed) o è previsto un comportamento diverso? | La richiesta non specifica cosa succede in caso di guasto o timeout del sistema di decisione | Cambia la logica del simulatore e il livello di ridondanza richiesto al backend |
| 5 | Cosa si intende esattamente per "tentativo anomalo" da evidenziare (es. ripetuti tentativi falliti nello stesso intervallo, accesso fuori orario, badge segnalato come smarrito)? | La richiesta menziona "tentativi negati o anomali" e l'uso dell'AI per "evidenziare pattern" ma non definisce una regola o soglia | Determina se basta segnalare i tentativi negati o serve una logica di rilevamento pattern più complessa |

## Decisioni prese in attesa di risposta (domande 2 e 5)

| # | Decisione presa | Perché |
|---|---|---|
| 2 | Assunto per ora: comportamento fail-closed (nessun accesso concesso se il backend non risponde) | Principio di sicurezza prudenziale, coerente col punto 13 della richiesta ("un badge non autorizzato viene respinto") — da confermare col cliente prima di considerarlo definitivo |
| 5 | "Anomalo" non è stato implementato come regola automatica: nello storico si evidenziano e si filtrano solo i tentativi negati (`ACCESS_DENIED`) | In assenza di una definizione dal cliente, evidenziare tutti i negati è l'unico comportamento che non richiede di indovinare una soglia (es. quanti tentativi falliti in quanto tempo contano come "anomalia") |
