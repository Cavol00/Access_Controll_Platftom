import { db } from "../db.js";

/**
 * Repository della struttura fisica della sede: edifici, aree e varchi (T08).
 * È l'unico punto che conosce l'SQL di queste tre tabelle.
 */

export interface Building {
  id: number;
  name: string;
  address: string | null;
}

export interface Area {
  id: number;
  building_id: number;
  name: string;
}

export interface Door {
  id: number;
  area_id: number;
  code: string;
}

function count(sql: string, id: number): number {
  return (db.prepare(sql).get(id) as { n: number }).n;
}

// Edifici
export function listBuildings(): Building[] {
  return db.prepare("SELECT id, name, address FROM buildings ORDER BY id").all() as unknown as Building[];
}
export function findBuilding(id: number): Building | undefined {
  return db.prepare("SELECT id, name, address FROM buildings WHERE id = ?").get(id) as unknown as Building | undefined;
}
export function createBuilding(name: string, address: string | null): Building {
  const created = db.prepare("INSERT INTO buildings (name, address) VALUES (?, ?)").run(name, address);
  return findBuilding(Number(created.lastInsertRowid)) as Building;
}
export function countAreasOfBuilding(id: number): number {
  return count("SELECT COUNT(*) AS n FROM areas WHERE building_id = ?", id);
}
export function deleteBuilding(id: number): void {
  db.prepare("DELETE FROM buildings WHERE id = ?").run(id);
}

// Aree
export function listAreas(): Area[] {
  return db.prepare("SELECT id, building_id, name FROM areas ORDER BY id").all() as unknown as Area[];
}
export function findArea(id: number): Area | undefined {
  return db.prepare("SELECT id, building_id, name FROM areas WHERE id = ?").get(id) as unknown as Area | undefined;
}
export function createArea(buildingId: number, name: string): Area {
  const created = db.prepare("INSERT INTO areas (building_id, name) VALUES (?, ?)").run(buildingId, name);
  return findArea(Number(created.lastInsertRowid)) as Area;
}
export function countUsesOfArea(id: number): number {
  return (
    count("SELECT COUNT(*) AS n FROM doors WHERE area_id = ?", id) +
    count("SELECT COUNT(*) AS n FROM authorizations WHERE area_id = ?", id) +
    count("SELECT COUNT(*) AS n FROM access_events WHERE area_id = ?", id)
  );
}
export function deleteArea(id: number): void {
  db.prepare("DELETE FROM areas WHERE id = ?").run(id);
}

// Varchi
export function listDoors(): Door[] {
  return db.prepare("SELECT id, area_id, code FROM doors ORDER BY id").all() as unknown as Door[];
}
export function findDoor(id: number): Door | undefined {
  return db.prepare("SELECT id, area_id, code FROM doors WHERE id = ?").get(id) as unknown as Door | undefined;
}
export function doorCodeExists(code: string): boolean {
  return db.prepare("SELECT 1 FROM doors WHERE code = ?").get(code) !== undefined;
}
export function createDoor(areaId: number, code: string): Door {
  const created = db.prepare("INSERT INTO doors (area_id, code) VALUES (?, ?)").run(areaId, code);
  return findDoor(Number(created.lastInsertRowid)) as Door;
}
export function deleteDoor(id: number): void {
  db.prepare("DELETE FROM doors WHERE id = ?").run(id);
}
