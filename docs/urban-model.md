# Modello relazionale

Le tabelle sono create dal file [`schema.sql`](../schema.sql), separato dal
codice dell'applicazione.

- Ogni tabella ha una chiave primaria `id` autoincrementale.
- Le relazioni sono rappresentate da chiavi esterne.
- I codici di badge e varco sono univoci.
- Una segnalazione può avere esito `ACCESS_GRANTED` o `ACCESS_DENIED`.
- Le chiavi esterne impediscono riferimenti a entità inesistenti.
