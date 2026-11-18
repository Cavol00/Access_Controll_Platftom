// Console web minima (#67): login dell'operatore e storico degli accessi.
// La pagina è servita dal backend stesso, quindi le fetch usano percorsi
// relativi (stessa origine, niente CORS).

// Il token del login resta solo in questa variabile: ricaricando la pagina
// si perde e bisogna rifare il login. Non va scritto nel codice né salvato.
let token = null;

const $ = (id) => document.getElementById(id);

function mostraMessaggio(testo) {
  $("messaggio").textContent = testo;
  $("messaggio").hidden = false;
}

function nascondiMessaggio() {
  $("messaggio").hidden = true;
}

function mostraLogin() {
  token = null;
  $("vista-storico").hidden = true;
  $("vista-login").hidden = false;
  $("password").value = "";
}

// Legge il campo "error" che il backend manda con ogni errore. Se il corpo non
// è JSON (per esempio un proxy che risponde HTML) usa il testo di riserva.
async function erroreDalServer(res, riserva) {
  try {
    const body = await res.json();
    return body.error ?? riserva;
  } catch {
    return riserva;
  }
}

async function login(username, password) {
  let res;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    mostraMessaggio("Server non raggiungibile.");
    return;
  }
  // Prima si controlla res.ok, solo dopo si legge il corpo come risultato.
  if (!res.ok) {
    mostraMessaggio(await erroreDalServer(res, "Login non riuscito."));
    return;
  }
  const sessione = await res.json();
  token = sessione.token;
  nascondiMessaggio();
  $("operatore").textContent = `${sessione.username} (${sessione.role})`;
  $("vista-login").hidden = true;
  $("vista-storico").hidden = false;
  await caricaStorico();
}

async function caricaStorico() {
  let res;
  try {
    res = await fetch("/api/access-events", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    mostraMessaggio("Server non raggiungibile.");
    return;
  }
  if (res.status === 401) {
    mostraLogin();
    mostraMessaggio("Sessione scaduta o non valida: rifai il login.");
    return;
  }
  if (res.status === 403) {
    $("tabella-storico").hidden = true;
    $("storico-vuoto").hidden = true;
    mostraMessaggio("Il tuo ruolo non è ammesso a vedere lo storico degli accessi.");
    return;
  }
  if (!res.ok) {
    mostraMessaggio(await erroreDalServer(res, "Errore nel caricamento dello storico."));
    return;
  }
  nascondiMessaggio();
  mostraStorico(await res.json());
}

function mostraStorico(eventi) {
  const righe = $("righe-storico");
  righe.replaceChildren();
  for (const evento of eventi) {
    const tr = document.createElement("tr");
    const concesso = evento.result === "ACCESS_GRANTED";
    tr.className = concesso ? "concesso" : "negato";
    const celle = [
      new Date(evento.requested_at).toLocaleString("it-IT"),
      evento.badge_code,
      evento.door_code,
      concesso ? "Concesso" : "Negato",
      evento.reason,
    ];
    celle.forEach((testo, i) => {
      const td = document.createElement("td");
      // textContent, non innerHTML: un codice badge che contiene HTML viene
      // mostrato come testo e non eseguito.
      td.textContent = testo;
      if (i === 3) td.className = "esito";
      tr.append(td);
    });
    righe.append(tr);
  }
  $("tabella-storico").hidden = eventi.length === 0;
  $("storico-vuoto").hidden = eventi.length !== 0;
}

$("form-login").addEventListener("submit", (evento) => {
  evento.preventDefault(); // senza, il browser ricaricherebbe la pagina
  login($("username").value.trim(), $("password").value);
});
$("aggiorna").addEventListener("click", caricaStorico);
$("logout").addEventListener("click", () => {
  mostraLogin();
  nascondiMessaggio();
});
