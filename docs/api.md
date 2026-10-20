## Test collegati

Tutti i test sono in `tests/segnalazioni.test.ts` e si lanciano con `npm test`.

- `POST /api/segnalazioni` → "con dati validi crea l'evento e risponde 201",
  "senza result risponde 400", "con un esito diverso da … risponde 400",
  "con JSON malformato risponde 400, non 500"
- `GET /api/segnalazioni` → "risponde 200 con la lista …",
  "se il database non è disponibile … risponde 500"
- `PUT /api/segnalazioni/:id` → "su un evento esistente risponde 200",
  "su un id inesistente risponde 404", "con dati non validi risponde 400"
- `GET /health` → "risponde 200 con status ok"
