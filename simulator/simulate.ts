import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Simulatore del lettore badge (T11): legge gli scenari da scenari.json, manda
 * ogni richiesta a POST /api/access-events con la chiave del lettore e stampa
 * l'esito. È un programma separato dal backend: lo usa solo via HTTP, come
 * farebbe un lettore vero.
 *
 * Uso: npm run simulate   (con il backend già avviato in un altro terminale)
 */

interface Scenario {
  descrizione: string;
  badge_code: string;
  door_code: string;
  requested_at?: string;
  atteso: "ACCESS_GRANTED" | "ACCESS_DENIED";
}

const BASE_URL = process.env.SIMULATOR_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const API_KEY = process.env.SIMULATOR_API_KEY ?? "";
// Stessa soglia del requisito RNF1: oltre i 5 secondi il lettore lascia il varco chiuso.
const TIMEOUT_MS = 5000;

async function main(): Promise<void> {
  if (!API_KEY) {
    console.error("Manca SIMULATOR_API_KEY: copiate .env.example in .env e impostate la chiave.");
    process.exit(1);
  }

  const scenari = JSON.parse(readFileSync(join(__dirname, "scenari.json"), "utf8")) as Scenario[];
  console.log(`Simulatore lettore badge → ${BASE_URL} (${scenari.length} scenari)\n`);

  let corrispondenti = 0;
  for (const [i, s] of scenari.entries()) {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/api/access-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ badge_code: s.badge_code, door_code: s.door_code, requested_at: s.requested_at }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      // Backend spento o lento: il lettore non resta bloccato e il varco resta chiuso.
      const motivo = error instanceof Error && error.name === "TimeoutError"
        ? `nessuna risposta entro ${TIMEOUT_MS / 1000} secondi`
        : "backend non raggiungibile (è avviato?)";
      console.error(`Errore: ${motivo} su ${BASE_URL}. Varco lasciato chiuso, simulazione interrotta.`);
      process.exit(1);
    }

    if (res.status === 401) {
      console.error("Errore: chiave rifiutata dal backend (401). Controllate SIMULATOR_API_KEY in .env.");
      process.exit(1);
    }
    const body = (await res.json()) as { result?: string; reason?: string; error?: string };
    if (!res.ok) {
      console.log(`${i + 1}. ${s.descrizione}\n   ✗ risposta ${res.status}: ${body.error}\n`);
      continue;
    }

    const ok = body.result === s.atteso;
    if (ok) corrispondenti++;
    console.log(`${i + 1}. ${s.descrizione}`);
    console.log(`   ${ok ? "✓" : "✗"} ${body.result} — ${body.reason}${ok ? "" : ` (atteso ${s.atteso})`}\n`);
  }

  console.log(`Esiti come attesi: ${corrispondenti}/${scenari.length}`);
  process.exit(corrispondenti === scenari.length ? 0 : 1);
}

void main();
