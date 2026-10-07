import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

mkdirSync("data", { recursive: true });
export const db = new DatabaseSync(join("data", "access-control.sqlite"));
db.exec(readFileSync("schema.sql", "utf8"));
