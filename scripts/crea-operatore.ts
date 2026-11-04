import { createInterface } from "node:readline/promises";
import { hashPassword } from "../src/auth/passwords.js";
import * as operators from "../src/repositories/operators.repository.js";
import { ROLES, type Role } from "../src/types.js";

async function main(): Promise<void> {
  const [username, role] = process.argv.slice(2);
  if (!username || !(ROLES as readonly string[]).includes(role)) {
    console.error(`Uso: npm run crea-operatore -- <username> <ruolo>\nRuoli: ${ROLES.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = await rl.question("Password (almeno 8 caratteri): ");
  rl.close();
  if (password.length < 8) {
    console.error("Password troppo corta.");
    process.exitCode = 1;
    return;
  }

  const id = operators.create(username, hashPassword(password), role as Role);
  console.log(`Operatore creato: id ${id}, ${username}, ruolo ${role}`);
}

void main();
