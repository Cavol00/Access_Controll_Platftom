import { ConflictError, NotFoundError, ValidationError } from "../errors.js";
import * as structure from "../repositories/structure.repository.js";

/**
 * Servizio della struttura fisica (T08): valida i dati e applica le regole.
 * Un'area appartiene a un edificio che esiste, un varco a un'area che esiste,
 * e non si cancella niente che sia ancora usato (risponde 409): in particolare
 * un'area che compare nello storico resta, perché lo storico non si tocca.
 */

type Body = Record<string, unknown>;

function asBody(body: unknown): Body {
  return (typeof body === "object" && body !== null ? body : {}) as Body;
}

function requiredText(body: Body, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${field} è obbligatorio`);
  }
  return value.trim();
}

function requiredId(body: Body, field: string): number {
  const value = body[field];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new ValidationError(`${field} deve essere un numero intero`);
  }
  return value;
}

/** Gli id nell'URL arrivano come testo: se non sono un intero, la risorsa non esiste. */
export function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id)) throw new NotFoundError();
  return id;
}

// Edifici
export const listBuildings = structure.listBuildings;

export function createBuilding(body: unknown): structure.Building {
  const b = asBody(body);
  const address = typeof b.address === "string" && b.address.trim() !== "" ? b.address.trim() : null;
  return structure.createBuilding(requiredText(b, "name"), address);
}

export function deleteBuilding(id: number): void {
  if (!structure.findBuilding(id)) throw new NotFoundError("edificio non trovato");
  if (structure.countAreasOfBuilding(id) > 0) {
    throw new ConflictError("l'edificio ha ancora delle aree: eliminatele prima");
  }
  structure.deleteBuilding(id);
}

// Aree
export const listAreas = structure.listAreas;

export function createArea(body: unknown): structure.Area {
  const b = asBody(body);
  const buildingId = requiredId(b, "building_id");
  const name = requiredText(b, "name");
  if (!structure.findBuilding(buildingId)) throw new ValidationError("building_id non corrisponde a un edificio");
  return structure.createArea(buildingId, name);
}

export function deleteArea(id: number): void {
  if (!structure.findArea(id)) throw new NotFoundError("area non trovata");
  if (structure.countUsesOfArea(id) > 0) {
    throw new ConflictError("l'area ha ancora varchi, autorizzazioni o eventi nello storico: non si può eliminare");
  }
  structure.deleteArea(id);
}

// Varchi
export const listDoors = structure.listDoors;

export function createDoor(body: unknown): structure.Door {
  const b = asBody(body);
  const areaId = requiredId(b, "area_id");
  const code = requiredText(b, "code");
  if (!structure.findArea(areaId)) throw new ValidationError("area_id non corrisponde a un'area");
  if (structure.doorCodeExists(code)) throw new ConflictError("esiste già un varco con questo codice");
  return structure.createDoor(areaId, code);
}

export function deleteDoor(id: number): void {
  if (!structure.findDoor(id)) throw new NotFoundError("varco non trovato");
  structure.deleteDoor(id);
}
