import { verifyPassword } from "../auth/passwords.js";
import { createSession } from "../auth/sessions.js";
import { UnauthorizedError, ValidationError } from "../errors.js";
import * as operators from "../repositories/operators.repository.js";
import type { Role } from "../types.js";

export interface LoginResult {
  token: string;
  username: string;
  role: Role;
  expires_at: string;
}

export function login(body: unknown): LoginResult {
  const source = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const { username, password } = source;
  if (typeof username !== "string" || username === "" || typeof password !== "string" || password === "") {
    throw new ValidationError("username e password sono obbligatori");
  }

  const operator = operators.findByUsername(username);
  if (!operator || operator.active !== 1 || !verifyPassword(password, operator.password_hash)) {
    throw new UnauthorizedError("credenziali non valide");
  }

  const { token, session } = createSession(operator.id, operator.username, operator.role);
  return { token, username: session.username, role: session.role, expires_at: session.expiresAt.toISOString() };
}
