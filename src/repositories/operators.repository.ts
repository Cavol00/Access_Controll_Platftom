import { db } from "../db.js";
import type { Role } from "../types.js";

export interface OperatorRow {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  active: number;
}

export function findByUsername(username: string): OperatorRow | undefined {
  return db.prepare("SELECT id, username, password_hash, role, active FROM operators WHERE username = ?").get(username) as unknown as OperatorRow | undefined;
}

export function create(username: string, passwordHash: string, role: Role): number {
  const created = db.prepare("INSERT INTO operators (username, password_hash, role) VALUES (?, ?, ?)").run(username, passwordHash, role);
  return Number(created.lastInsertRowid);
}
