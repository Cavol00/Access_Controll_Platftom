import { createHash, randomBytes } from "node:crypto";
import type { Role } from "../types.js";

export interface Session {
  operatorId: number;
  username: string;
  role: Role;
  expiresAt: Date;
}

const DURATION_MS = 8 * 60 * 60 * 1000;
const sessions = new Map<string, Session>();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSession(operatorId: number, username: string, role: Role): { token: string; session: Session } {
  const token = randomBytes(32).toString("hex");
  const session = { operatorId, username, role, expiresAt: new Date(Date.now() + DURATION_MS) };
  sessions.set(hashToken(token), session);
  return { token, session };
}

export function findSession(token: string): Session | undefined {
  const key = hashToken(token);
  const session = sessions.get(key);
  if (!session) return undefined;
  if (session.expiresAt.getTime() <= Date.now()) {
    sessions.delete(key);
    return undefined;
  }
  return session;
}
