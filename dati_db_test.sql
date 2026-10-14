-- =============================================================================
-- dati_db_test.sql — dati di test per Access Control Platform
-- -----------------------------------------------------------------------------
-- Solo INSERT: non cancella né elimina nulla.
-- Da incollare in DB Browser for SQLite -> scheda "Execute SQL" -> play (F5).
--
-- Ordine importante: prima le tabelle "padre" (buildings, employees), poi quelle
-- che le referenziano (areas, doors, badges, authorizations, reports).
--
-- Nota: gli `id` sono indicati esplicitamente per poterli referenziare tra le
-- tabelle. Se nel database hai già righe con questi stessi id, compare un
-- errore di chiave duplicata: in quel caso togli gli `id` dalle INSERT e
-- riferisciti alle tabelle con una sotto-query (esempio in fondo al file).
-- =============================================================================

PRAGMA foreign_keys = ON;


-- -----------------------------------------------------------------------------
-- 1. buildings — Edifici (id, nome, indirizzo)
-- -----------------------------------------------------------------------------
INSERT INTO buildings (id, name, address) VALUES
  (1, 'Sede Nord', 'Via Industriale 1'),
  (2, 'Sede Sud',  'Via del Porto 22');

-- -----------------------------------------------------------------------------
-- 2. areas — Aree (id, edificio, nome). Un edificio ha più aree.
-- -----------------------------------------------------------------------------
INSERT INTO areas (id, building_id, name) VALUES
  (1, 1, 'Uffici'),
  (2, 1, 'Laboratorio'),
  (3, 1, 'Magazzino'),
  (4, 2, 'Sala Sistemi'),
  (5, 2, 'Uffici Amministrativi'),
  (6, 2, 'Officina');

-- -----------------------------------------------------------------------------
-- 3. doors — Varchi (id, area, codice). Un'area ha più varchi; il codice è unico.
-- -----------------------------------------------------------------------------
INSERT INTO doors (id, area_id, code) VALUES
  (1, 1, 'VARCO-UFF-NORD'),
  (2, 2, 'VARCO-LAB-01'),
  (3, 3, 'VARCO-MAGAZZINO'),
  (4, 4, 'VARCO-SALA-SISTEMI'),
  (5, 5, 'VARCO-UFF-SUD'),
  (6, 6, 'VARCO-OFFICINA'),
  (7, 2, 'VARCO-LAB-02');

-- -----------------------------------------------------------------------------
-- 4. employees — Dipendenti (id, nome, email unica, attivo 0/1)
-- -----------------------------------------------------------------------------
INSERT INTO employees (id, name, email, active) VALUES
  (1, 'Mario Rossi',    'mario.rossi@aurea.example',    1),
  (2, 'Giulia Bianchi', 'giulia.bianchi@aurea.example', 1),
  (3, 'Luca Verdi',     'luca.verdi@aurea.example',     1),
  (4, 'Anna Neri',      'anna.neri@aurea.example',      1),
  (5, 'Paolo Gialli',   'paolo.gialli@aurea.example',   1),
  (6, 'Ex Dipendente',  'ex.dipendente@aurea.example',  0);

-- -----------------------------------------------------------------------------
-- 5. badges — Badge (id, codice unico, dipendente UNIVOCO, attivo 0/1)
--    Un dipendente ha esattamente un badge, quindi employee_id è UNIQUE.
-- -----------------------------------------------------------------------------
INSERT INTO badges (id, code, employee_id, active) VALUES
  (1, 'BADGE-TEST-001', 1, 1),
  (2, 'BADGE-TEST-002', 2, 1),
  (3, 'BADGE-TEST-003', 3, 1),
  (4, 'BADGE-TEST-004', 4, 1),
  (5, 'BADGE-TEST-005', 5, 1),
  (6, 'BADGE-TEST-006', 6, 0);

-- -----------------------------------------------------------------------------
-- 6. authorizations — Autorizzazioni (badge -> area).
--    UNIQUE(badge_id, area_id): un badge non può avere due righe sulla stessa area.
--    valid_from / valid_to = fascia di validità (NULL = sempre valida)
--    revoked_at            = se valorizzato, l'autorizzazione è revocata
-- -----------------------------------------------------------------------------
INSERT INTO authorizations (badge_id, area_id, valid_from, valid_to, revoked_at) VALUES
  (1, 1, NULL, NULL, NULL),                          -- Rossi: Uffici
  (1, 2, NULL, NULL, NULL),                          -- Rossi: anche Laboratorio
  (2, 2, NULL, NULL, NULL),                          -- Bianchi: Laboratorio
  (3, 3, NULL, NULL, NULL),                          -- Verdi: Magazzino
  (3, 6, NULL, NULL, NULL),                          -- Verdi: anche Officina
  (4, 4, '2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z', NULL),  -- Neri: Sala Sistemi (a tempo)
  (4, 5, NULL, NULL, NULL),                          -- Neri: Uffici Amministrativi
  (5, 6, NULL, NULL, '2026-09-01T00:00:00Z');        -- Gialli: Officina, REVOCATA

-- -----------------------------------------------------------------------------
-- 7. reports — Segnalazioni (storico tentativi di accesso).
--    badge_id / door_id possono essere NULL (es. badge o varco sconosciuto).
--    result ammette solo 'ACCESS_GRANTED' o 'ACCESS_DENIED'.
--    requested_at in ISO 8601.
-- -----------------------------------------------------------------------------
INSERT INTO reports (badge_id, door_id, requested_at, result, reason) VALUES
  (1, 1,    '2026-10-14T08:00:00Z', 'ACCESS_GRANTED', 'Badge autorizzato su Uffici'),
  (2, 1,    '2026-10-14T08:05:00Z', 'ACCESS_DENIED',  'Nessuna autorizzazione su Uffici'),
  (1, 2,    '2026-10-14T08:10:00Z', 'ACCESS_GRANTED', 'Badge autorizzato su Laboratorio'),
  (3, 2,    '2026-10-14T08:15:00Z', 'ACCESS_DENIED',  'Nessuna autorizzazione su Laboratorio'),
  (3, 3,    '2026-10-14T08:20:00Z', 'ACCESS_GRANTED', 'Badge autorizzato su Magazzino'),
  (6, 1,    '2026-10-14T08:25:00Z', 'ACCESS_DENIED',  'Badge disattivato'),
  (4, 4,    '2026-10-14T09:00:00Z', 'ACCESS_GRANTED', 'Autorizzazione valida su Sala Sistemi'),
  (4, 1,    '2026-10-14T09:05:00Z', 'ACCESS_DENIED',  'Nessuna autorizzazione su Uffici'),
  (5, 6,    '2026-10-14T09:10:00Z', 'ACCESS_DENIED',  'Autorizzazione revocata'),
  (NULL, NULL, '2026-10-14T09:15:00Z', 'ACCESS_DENIED', 'Badge sconosciuto'),
  (1, NULL, '2026-10-14T09:20:00Z', 'ACCESS_DENIED',  'Varco non specificato'),
  (2, 2,    '2026-10-14T12:30:00Z', 'ACCESS_GRANTED', 'Accesso in orario di lavoro'),
  (2, 2,    '2026-10-14T23:30:00Z', 'ACCESS_DENIED',  'Fuori fascia oraria'),
  (4, 4,    '2027-01-05T10:00:00Z', 'ACCESS_DENIED',  'Autorizzazione scaduta');

COMMIT;

-- =============================================================================
-- VARIANTE SENZA id ESPLICITI
-- Se hai già dati e non vuoi usare gli id, inserisci senza id e collega le
-- tabelle con una sotto-query sulla chiave naturale. Esempio:
--
--   INSERT INTO areas (building_id, name)
--     VALUES ((SELECT id FROM buildings WHERE name = 'Sede Nord'), 'Laboratorio');
--
-- =============================================================================
