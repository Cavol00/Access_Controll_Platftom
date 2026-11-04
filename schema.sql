PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  employee_id INTEGER NOT NULL UNIQUE REFERENCES employees(id),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS buildings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  building_id INTEGER NOT NULL REFERENCES buildings(id),
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS doors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area_id INTEGER NOT NULL REFERENCES areas(id),
  code TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS authorizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  area_id INTEGER NOT NULL REFERENCES areas(id),
  valid_from TEXT,
  valid_to TEXT,
  revoked_at TEXT,
  UNIQUE (badge_id, area_id)
);

-- Storico dei tentativi di accesso. Badge e varco sono salvati come codici
-- (testo), non come chiavi esterne: anche un badge o un varco sconosciuto deve
-- lasciare una riga, e una chiave esterna lo impedirebbe.
CREATE TABLE IF NOT EXISTS access_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  badge_code TEXT NOT NULL,
  door_code TEXT NOT NULL,
  area_id INTEGER REFERENCES areas(id),
  requested_at TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('ACCESS_GRANTED', 'ACCESS_DENIED')),
  reason TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Lo storico non si modifica e non si cancella, nemmeno con una query scritta
-- a mano: il database stesso rifiuta UPDATE e DELETE.
CREATE TRIGGER IF NOT EXISTS access_events_no_update
BEFORE UPDATE ON access_events
BEGIN
  SELECT RAISE(ABORT, 'lo storico degli accessi non è modificabile');
END;

CREATE TRIGGER IF NOT EXISTS access_events_no_delete
BEFORE DELETE ON access_events
BEGIN
  SELECT RAISE(ABORT, 'lo storico degli accessi non è modificabile');
END;

-- Registro immutabile delle modifiche alle autorizzazioni.
CREATE TABLE IF NOT EXISTS authorization_changes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  authorization_id INTEGER NOT NULL REFERENCES authorizations(id),
  action TEXT NOT NULL CHECK (action IN ('CREATED', 'REVOKED')),
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS authorization_changes_no_update
BEFORE UPDATE ON authorization_changes
BEGIN
  SELECT RAISE(ABORT, 'il registro delle modifiche non è modificabile');
END;

CREATE TRIGGER IF NOT EXISTS authorization_changes_no_delete
BEFORE DELETE ON authorization_changes
BEGIN
  SELECT RAISE(ABORT, 'il registro delle modifiche non è modificabile');
END;
