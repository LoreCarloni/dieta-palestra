"use strict";

// ---------- Scheda Fumo: contatore, risparmio, traguardi e aiuto per le voglie ----------
// Usa lo stato S, save(), render() e le utilità definite in app.js. I dati stanno in S.fumo.

const FUMO_TRAGUARDI = [
  { h: 0.34, t: "20 minuti", d: "Frequenza cardiaca e pressione iniziano a scendere." },
  { h: 12, t: "12 ore", d: "Il monossido di carbonio nel sangue si normalizza." },
  { h: 24, t: "1 giorno", d: "Il primo giorno è passato: le voglie più forti arrivano a ondate di pochi minuti." },
  { h: 48, t: "2 giorni", d: "Gusto e olfatto cominciano a tornare." },
  { h: 72, t: "3 giorni", d: "La nicotina è in gran parte eliminata dal corpo." },
  { h: 24 * 14, t: "2 settimane", d: "Circolazione e respiro migliorano in modo percepibile." },
  { h: 24 * 30, t: "1 mese", d: "Tosse e fiato corto tendono a diminuire." },
  { h: 24 * 90, t: "3 mesi", d: "La funzione polmonare migliora in modo misurabile." },
  { h: 24 * 365, t: "1 anno", d: "Il rischio di malattia coronarica scende a circa la metà di quello di un fumatore." },
];

const fumoNow = () => Date.now();
const fumoEuro = (n) => n.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

function fumoStats() {
  const f = S.fumo;
  const ms = Math.max(0, fumoNow() - new Date(f.start).getTime());
  const hours = ms / 3600000;
  const days = hours / 24;
  const avoided = days * f.perDay;
  const saved = (avoided / f.packSize) * f.packPrice;
  return { ms, hours, days, avoided, saved, minutes: avoided * 11 };
}

function fumoDuration(ms) {
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
  if (d > 0) return `${d} ${d === 1 ? "giorno" : "giorni"} e ${h} ${h === 1 ? "ora" : "ore"}`;
  if (h > 0) return `${h} ${h === 1 ? "ora" : "ore"} e ${mm} minuti`;
  return `${mm} minuti`;
}

// Cose concrete da fare invece di fumare. Ad ogni apertura se ne scelgono tre, in base all'ora.
const FUMO_AZIONI = [
  { t: "Mangiando una mela o una carota.", when: "sempre" },
  { t: "Bevendo un sorso d'acqua e posando il bicchiere lontano dal pacchetto.", when: "sempre" },
  { t: "Camminando per due minuti, anche solo in corridoio.", when: "sempre" },
  { t: "Sistemando una cosa in camera: il letto, la scrivania, il tavolo.", when: "sempre" },
  { t: "Lavandoti le mani e il viso con acqua fredda.", when: "sempre" },
  { t: "Scrivendo su un foglio tre cose che farai nell'ora successiva, senza sigaretta.", when: "sempre" },
  { t: "Mettendo le sigarette in un cassetto lontano e chiudendolo.", when: "sempre" },
  { t: "Scrivendo o chiamando una persona e raccontandole come stai andando.", when: "sempre" },
  { t: "Guardando fuori dalla finestra per un minuto, respirando piano.", when: "sempre" },
  { t: "Facendoti una doccia e cambiando la maglietta.", when: "mattina" },
  { t: "Aprendo la finestra e preparando la colazione.", when: "mattina" },
  { t: "Preparando la borsa o la giornata di oggi, una cosa alla volta.", when: "mattina" },
  { t: "Lavandoti i denti e mettendoti il pigiama.", when: "sera" },
  { t: "Preparando il letto e posando tutto quello che hai in mano.", when: "sera" },
  { t: "Pianificando la mattina: sveglia, bagno, denti, colazione, senza sigaretta.", when: "sera" },
];
let fumoAzioniAperte = null;
function fumoAzioniDiOggi() {
  if (!fumoAzioniAperte) {
    const h = new Date().getHours();
    const fascia = h < 11 ? "mattina" : h >= 20 ? "sera" : null;
    const pool = FUMO_AZIONI.filter((a) => a.when === "sempre" || a.when === fascia);
    const mixed = [...pool].sort(() => Math.random() - 0.5);
    fumoAzioniAperte = mixed.slice(0, 3);
  }
  return fumoAzioniAperte;
}

// Azioni piccole da fare al posto di fumare. Si possono aggiungere dalla scheda Fumo.
const FUMO_PREVISIONE_BASE = [
  "Mangiando una mela o una carota",
  "Camminando per due minuti",
  "Respirando sul balcone",
  "Seduto con gli occhi chiusi per un minuto",
  "Respirando lentamente per cinque respiri",
  "Lavorando su una piccola cosa",
  "Sistemando una cosa sul tavolo",
  "Lavandoti il viso con acqua fredda",
];
// Vecchie formulazioni salvate: vengono convertite alla lettura.
const FUMO_PREVISIONE_VECCHIE = {
  "Bevi un bicchiere d'acqua": "Mangiando una mela o una carota",
  "Alzati e cammina per due minuti": "Camminando per due minuti",
  "Esci in balcone e respira": "Respirando sul balcone",
  "Siediti e chiudi gli occhi per un minuto": "Seduto con gli occhi chiusi per un minuto",
  "Fai cinque respiri lenti": "Respirando lentamente per cinque respiri",
  "Torna al lavoro su una piccola cosa": "Lavorando su una piccola cosa",
  "Sistema una cosa sul tavolo": "Sistemando una cosa sul tavolo",
  "Lavati il viso con acqua fredda": "Lavandoti il viso con acqua fredda",
};
// Le azioni fatte più spesso stanno in cima. A parità di uso resta l'ordine originale.
function fumoPrevisione() {
  const list = ((S.fumo && S.fumo.acts) || FUMO_PREVISIONE_BASE).map((x) => FUMO_PREVISIONE_VECCHIE[x] || x);
  const counts = {};
  ((S.fumo && S.fumo.log) || []).forEach((e) => {
    if (e.kind !== "act") return;
    const t = FUMO_PREVISIONE_VECCHIE[e.text] || e.text;
    counts[t] = (counts[t] || 0) + 1;
  });
  return list
    .map((text, i) => ({ text, i, n: counts[text] || 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.text);
}

// Registro del giorno: azioni fatte e sigarette fumate, in ordine di ora.
function fumoDiaryCard() {
  const day = view.fumoDay || todayKey();
  const log = (S.fumo && S.fumo.log) || [];
  const rows = log.map((e, idx) => ({ ...e, idx })).filter((e) => keyOf(new Date(e.at)) === day).sort((a, b) => a.at.localeCompare(b.at));
  const acts = rows.filter((e) => e.kind === "act").length;
  const smoked = rows.filter((e) => e.kind === "smoke").reduce((a, e) => a + (e.n || 1), 0);
  const hhmm = (iso) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const lines = rows.map((e) => `<div class="fumo-item fumo-timed"><div class="muted small" style="font-variant-numeric:tabular-nums">${esc(hhmm(e.at))}:</div><div class="fumo-text">${e.kind === "act" ? `Hai fatto: ${esc(e.text)}` : `Hai fumato ${e.n || 1} ${(e.n || 1) === 1 ? "sigaretta" : "sigarette"}`}</div>${e.kind === "smoke" ? `<div class="fumo-tools"><button class="btn ghost small-btn" data-act="fumo-log-edit" data-idx="${e.idx}">Modifica</button><button class="btn danger small-btn" data-act="fumo-log-del" data-idx="${e.idx}">Elimina</button></div>` : ""}</div>`).join("");
  return `
    <section class="card">
      <div class="row" style="align-items:center">
        <button class="btn ghost small-btn" data-act="fumo-day-prev">Giorno prima</button>
        <strong style="text-align:center">${esc(fmtDate(day))}</strong>
        <button class="btn ghost small-btn" data-act="fumo-day-next" ${day >= todayKey() ? "disabled" : ""}>Giorno dopo</button>
      </div>
      <p class="muted small" style="text-align:center">Azioni fatte: ${acts} · Sigarette fumate: ${smoked}</p>
      ${lines || `<p class="muted small">Nessuna voce per questo giorno.</p>`}
      <form id="fumo-add-form" class="form" style="margin-top:12px">
        <p class="muted small" style="margin:0 0 6px">Hai dimenticato di registrare qualcosa? Aggiungilo qui con l'ora in cui è successo.</p>
        <select name="kind"><option value="smoke">Ho fumato</option><option value="act">Ho fatto un'azione</option></select>
        <input name="time" type="time" value="${day === todayKey() ? new Date().toTimeString().slice(0, 5) : "12:00"}" required>
        <input name="text" maxlength="80" placeholder="Quante sigarette (1 se non scrivi nulla), oppure cosa hai fatto">
        <button class="btn ghost wide" type="submit">Aggiungi al registro</button>
      </form>
    </section>`;
}

// Stile delle righe con i tasti: il testo ha la priorità, i tasti scendono sotto quando non ci stanno.
(function () {
  const st = document.createElement("style");
  st.textContent = ".fumo-item{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 0;border-bottom:1px solid var(--line)}" +
    ".fumo-item .muted{font-size:0.8rem}" +
    ".fumo-text{width:100%;min-width:0;overflow-wrap:anywhere;white-space:normal}" +
    ".fumo-tools{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}" +
    ".fumo-timed{display:grid;grid-template-columns:50px 1fr;column-gap:10px;row-gap:4px;align-items:start}" +
    ".fumo-timed > :nth-child(1){grid-column:1;grid-row:1 / span 2;align-self:center}" +
    ".fumo-timed > .fumo-text{grid-column:2}" +
    ".fumo-timed > .fumo-tools{grid-column:2}";
  document.head.appendChild(st);
})();
// Sezione Giornata: attività della giornata e sigarette, con possibilità di aggiungere ciò che si è dimenticato.
function renderGiornata() {
  const day = view.giornataDay || todayKey();
  const acts = ((S.giornata && S.giornata.log) || []).map((e, idx) => ({ ...e, kind: "act", idx }));
  const smokes = ((S.fumo && S.fumo.log) || []).map((e, idx) => ({ ...e, idx })).filter((e) => e.kind === "smoke").map((e) => ({ ...e, kind: "smoke", fromFumo: true }));
  const rows = [...acts, ...smokes].filter((e) => keyOf(new Date(e.at)) === day).sort((a, b) => a.at.localeCompare(b.at));
  const nAct = acts.filter((e) => keyOf(new Date(e.at)) === day).length;
  const nSmoke = rows.filter((e) => e.kind === "smoke").reduce((a, e) => a + (e.n || 1), 0);
  const minTot = rows.filter((e) => e.kind === "act").reduce((a, e) => a + (e.min || 0), 0);
  const hhmm = (iso) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const lines = rows.map((e) => `<div class="fumo-item fumo-timed"><div class="muted small" style="font-variant-numeric:tabular-nums">${esc(hhmm(e.at))}:</div><div class="fumo-text">${e.kind === "act" ? esc(e.text) + (e.min ? ` · ${e.min} min` : "") : `Hai fumato ${e.n || 1} ${(e.n || 1) === 1 ? "sigaretta" : "sigarette"}`}</div>${e.kind === "smoke" ? `<div class="fumo-tools"><button class="btn ghost small-btn" data-act="fumo-log-edit" data-idx="${e.idx}">Modifica</button><button class="btn danger small-btn" data-act="fumo-log-del" data-idx="${e.idx}">Elimina</button></div>` : ""}</div>`).join("");
  return `
    <section class="card">
      <div class="row" style="align-items:center">
        <button class="btn ghost small-btn" data-act="giornata-prev">Giorno prima</button>
        <strong style="text-align:center">${esc(fmtDate(day))}</strong>
        <button class="btn ghost small-btn" data-act="giornata-next" ${day >= todayKey() ? "disabled" : ""}>Giorno dopo</button>
      </div>
      <p class="muted small" style="text-align:center">Attività: ${nAct}${minTot ? ` (${minTot} min)` : ""} · Sigarette fumate: ${nSmoke}</p>
      ${lines || `<p class="muted small">Nessuna voce per questo giorno.</p>`}
      <form id="giornata-add-form" class="form" style="margin-top:12px">
        <p class="muted small" style="margin:0 0 6px">Hai dimenticato di registrare qualcosa? Aggiungilo qui con l'ora in cui è successo.</p>
        <select name="kind"><option value="act">Attività</option><option value="smoke">Sigarette fumate</option></select>
        <input name="time" type="time" value="${day === todayKey() ? new Date().toTimeString().slice(0, 5) : "12:00"}" required>
        <input name="min" type="number" min="1" max="1440" step="1" placeholder="Durata in minuti (facoltativo)">
        <button class="btn ghost wide" type="button" data-act="giornata-from-last">Dall'ultima sigaretta fino a adesso</button>
        <input name="text" list="giornata-suggest" maxlength="80" placeholder="Cosa hai fatto, per esempio studiare o fare la doccia">
        <datalist id="giornata-suggest">
          <option value="Ho studiato"></option>
          <option value="Ho lavorato all'app"></option>
          <option value="Ho preparato una email"></option>
          <option value="Ho fatto la doccia"></option>
          <option value="Ho fatto meditazione"></option>
          <option value="Mi sono rilassato"></option>
          <option value="Ho letto"></option>
          <option value="Ho fatto una passeggiata"></option>
        </datalist>
        <button class="btn ghost wide" type="submit">Aggiungi</button>
      </form>
    </section>`;
}

// Lista delle azioni della previsione: compare solo dopo aver toccato la casella di ricerca.
function fumoPlanHtml() {
  return fumoPrevisione().map((a, i) => `<div class="fumo-item"><div class="fumo-text">${esc(a)}</div><div class="fumo-tools"><button class="btn ghost small-btn" data-act="fumo-act" data-i="${i}">Fatto</button><button class="btn ghost small-btn" data-act="fumo-plan-edit" data-i="${i}">Modifica</button><button class="btn danger small-btn" data-act="fumo-plan-del" data-i="${i}">Elimina</button></div></div>`).join("");
}

// Cosa stai facendo al posto di fumare: si scrive o si cerca tra le azioni già usate.
function fumoCandidati() {
  const past = (S.fumo.log || []).filter((e) => e.kind === "act").map((e) => e.text);
  return [...new Set([...fumoPrevisione(), ...past])];
}

// Ricerca per radice: "respirando" trova "respira" e "respiri", "cam" trova "cammina".
function fumoMatch(candidate, query) {
  if (!query) return true;
  const words = candidate.toLowerCase().split(/[^a-zàèéìòù]+/).filter(Boolean);
  const tokens = query.split(/\s+/).filter(Boolean);
  return tokens.every((t) => words.some((w) =>
    w.startsWith(t) || t.startsWith(w) || (t.length >= 5 && w.length >= 5 && w.slice(0, 5) === t.slice(0, 5))));
}

function fumoHitsHtml(q) {
  const norm = (q || "").trim().toLowerCase();
  const list = fumoCandidati().filter((x) => fumoMatch(x, norm));
  const rows = list.slice(0, 8).map((t) => `<div class="fumo-item"><div class="fumo-text">${esc(t)}</div><div class="fumo-tools"><button class="link" data-act="fumo-log-text" data-t="${esc(t)}">Fatto</button></div></div>`).join("");
  const exact = list.some((x) => x.toLowerCase() === norm);
  const fresh = norm && !exact ? `<div class="fumo-item"><div class="fumo-text">Nuova azione: ${esc(q.trim())}</div><div class="fumo-tools"><button class="link" data-act="fumo-log-text" data-t="${esc(q.trim())}">Registra</button></div></div>` : "";
  return rows + fresh || `<p class="muted small">Scrivi qualcosa: per esempio "bevi", "passeggiata", "doccia".</p>`;
}

function fumoSearchCard() {
  return `
    <section class="card">
      <h2>Cosa stai facendo al posto di fumare?</h2>
      <input id="fumo-q" maxlength="80" placeholder="Scrivi o cerca un'azione" autocomplete="off">
      <div id="fumo-hits" style="margin-top:8px"></div>
    </section>`;
}

// Le azioni compaiono solo quando si tocca la casella o si scrive.
document.addEventListener("focusin", (e) => {
  if (e.target.id !== "fumo-q") return;
  view.fumoPlanOpen = true;
  const pl = $("#fumo-plan");
  if (pl) pl.innerHTML = fumoPlanHtml();
  const h = $("#fumo-hits");
  if (h) h.innerHTML = fumoHitsHtml(e.target.value);
});

document.addEventListener("input", (e) => {
  if (e.target.id !== "fumo-q") return;
  const h = $("#fumo-hits");
  if (h) h.innerHTML = fumoHitsHtml(e.target.value);
});

function fumoHMS(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// Il cronometro grande della scheda Fumo si aggiorna ogni secondo, senza rifare la pagina.
if (!window.fumoLiveStarted) {
  window.fumoLiveStarted = true;
  setInterval(() => {
    const el = document.getElementById("fumo-live");
    if (el && S.fumo) el.textContent = fumoHMS(fumoNow() - new Date(S.fumo.start).getTime());
  }, 1000);
}

function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderFumo() {
  if (!S.fumo) return renderFumoSetup();
  if (view.fumoEdit) return renderFumoSetup(true);
  const f = S.fumo, st = fumoStats();
  const tecOggi = fumoPensieroDiOggi();
  const perDay = f.smokedDays || {};
  const dayKeys = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), -i));
  const smokedToday = perDay[todayKey()] || 0;
  const weekRows = dayKeys.map((k) => `<div class="row"><div>${esc(fmtDate(k, { weekday: "short", day: "numeric", month: "short" }))}</div><div class="row-r">${perDay[k] || 0}</div></div>`).join("");
  const done = FUMO_TRAGUARDI.filter((m) => st.hours >= m.h);
  const next = FUMO_TRAGUARDI.find((m) => st.hours < m.h);
  const today = new Date().toDateString();
  const resistedToday = (f.resisted || []).filter((t) => new Date(t).toDateString() === today).length;
  const pctNext = next ? Math.min(100, Math.round((st.hours / next.h) * 100)) : 100;
  return `
    <section class="card" style="text-align:center;padding:18px 10px">
      <div class="muted small">Senza fumare da</div>
      <div id="fumo-live" style="font-size:3rem;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1">${esc(fumoHMS(st.ms))}</div>
      <div class="muted small">Dal ${esc(new Date(f.start).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}</div>
    </section>
    ${fumoDiaryCard()}
    ${fumoSearchCard()}
    <section class="card">
      <p class="stat-v" style="text-align:center;font-size:1.6rem;margin:0 0 8px">Resisti!</p>
      <ul style="margin:0;padding-left:20px">${fumoAzioniDiOggi().map((a) => `<li style="margin:6px 0">${esc(a.t)}</li>`).join("")}</ul>
    </section>
    <section class="card">
      <h2>Previsione della giornata</h2>
      <p class="muted small">Quando hai voglia di fumare, scegli una di queste azioni. Ogni azione fatta al posto della sigaretta conta.</p>
      <div id="fumo-plan">${view.fumoPlanOpen ? fumoPlanHtml() : ""}</div>
      <form id="fumo-acts-form" class="form" style="margin-top:10px">
        <input name="act" maxlength="80" placeholder="Aggiungi un'azione">
        <button class="btn ghost wide" type="submit">Aggiungi</button>
      </form>
    </section>
    <section class="card" style="text-align:center"><p>${esc(tecOggi.t)}</p></section>
    <div class="btns" style="justify-content:center;gap:18px;margin-bottom:16px">
      <button class="btn primary" data-act="fumo-craving" style="${FUMO_ROUND}">${fumoActive() ? "Riprendi il conto" : "Ho voglia di fumare"}</button>
      <button class="btn danger" data-act="fumo-lit-now" style="${FUMO_ROUND}">Sto fumando</button>
    </div>
    <section class="card">
      ${f.attempts && f.attempts.length ? `<div class="muted small">Ultima resistenza: ${Math.floor(f.attempts[f.attempts.length - 1].seconds / 60)} minuti e ${f.attempts[f.attempts.length - 1].seconds % 60} secondi</div>` : ""}
    </section>
    <section class="card">
      <div class="stats">
        <div class="stat"><div class="muted small">Azioni fatte al posto di fumare</div><div class="stat-v">${(S.fumo && S.fumo.actCount) || 0}</div></div>
        <div class="stat"><div class="muted small">Sigarette evitate</div><div class="stat-v">${r0(st.avoided)}</div></div>
        <div class="stat"><div class="muted small">Sigarette fumate oggi</div><div class="stat-v">${smokedToday}</div></div>
        <div class="stat"><div class="muted small">Sigarette fumate in totale</div><div class="stat-v">${f.smoked || 0}</div></div>
        <div class="stat"><div class="muted small">Soldi risparmiati</div><div class="stat-v">${fumoEuro(st.saved)}</div></div>
        <div class="stat"><div class="muted small">Vita recuperata (stima)</div><div class="stat-v">${st.minutes >= 1440 ? r1(st.minutes / 1440) + " giorni" : st.minutes >= 60 ? r1(st.minutes / 60) + " ore" : r0(st.minutes) + " min"}</div></div>
      </div>
      <p class="muted small">La stima della vita recuperata conta 11 minuti per sigaretta evitata ed è solo indicativa.</p>
    </section>
    <p class="muted small">Voglie superate oggi: ${resistedToday}. In totale: ${(f.resisted || []).length} superate su ${(f.cravings || []).length} registrate.</p>
    <section class="card">
      <h3>Prossimo traguardo</h3>
      ${next ? `<p><strong>${esc(next.t)}</strong>: ${esc(next.d)}</p>${bar(pctNext, 100)}<div class="muted small">${pctNext}% del tempo</div>` : "<p>Hai superato tutti i traguardi in elenco. Continua così.</p>"}
    </section>
    ${done.length ? `<section class="card"><h3>Traguardi raggiunti</h3>${done.map((m) => `<p class="small"><strong>${esc(m.t)}</strong>: ${esc(m.d)}</p>`).join("")}<p class="muted small">Indicazioni generali di salute pubblica: i tempi variano da persona a persona.</p></section>` : ""}
    <section class="card"><h3>Sigarette fumate per giorno</h3>${weekRows}</section>
    <section class="card"><h3>Traguardi di riduzione</h3>${fumoRiduzioni().map((m) => `<p class="small"><strong>${m.ok ? "Raggiunto" : "Da raggiungere"}:</strong> ${esc(m.t)}</p>`).join("")}<p class="muted small">Il confronto è tra un giorno e il precedente, sulle sigarette registrate con "Ho fumato".</p></section>
    ${f.reason ? `<section class="card"><h3>Il tuo motivo</h3><p>${esc(f.reason)}</p></section>` : ""}
    <section class="card">
      <h3>Impostazioni</h3>
      <div class="btns">
        <button class="btn ghost" data-act="fumo-edit">Modifica dati</button>
      </div>
      <p class="muted small">Se hai fumato, non è un fallimento: riparti da adesso. I giorni fatti prima restano nello storico${f.best ? ` (record: ${esc(fumoDuration(f.best))})` : ""}.</p>
    </section>`;
}

function renderFumoSetup(editing) {
  const f = S.fumo || { perDay: 15, packPrice: 6.5, packSize: 20, reason: "", start: new Date().toISOString() };
  return `
    <section class="card">
      <h3>${editing ? "Modifica dati" : "Smettere di fumare"}</h3>
      <p class="muted small">${editing ? "" : "Pochi dati per calcolare risparmio e traguardi. Restano solo sul tuo dispositivo."}</p>
      <form id="fumo-form" class="form">
        <label>Quando hai smesso (o smetti)
          <input type="datetime-local" name="start" value="${toLocalInput(new Date(f.start))}" required></label>
        <label>Sigarette al giorno prima di smettere
          <input type="number" name="perDay" min="1" max="100" step="1" value="${f.perDay}" required></label>
        <label>Prezzo di un pacchetto in euro
          <input type="number" name="packPrice" min="0.5" max="30" step="0.1" value="${f.packPrice}" required></label>
        <label>Sigarette per pacchetto
          <input type="number" name="packSize" min="1" max="50" step="1" value="${f.packSize}" required></label>
        <label>Il tuo motivo per smettere
          <textarea name="reason" rows="2" maxlength="200">${esc(f.reason || "")}</textarea></label>
        <button class="btn primary wide" type="submit">Salva</button>
        ${editing ? `<button class="btn ghost wide" type="button" data-act="fumo-cancel">Annulla</button>` : ""}
      </form>
    </section>`;
}

// Pensieri per le voglie: uno diverso ogni giorno. Non sono tecniche da eseguire, ma un modo diverso di guardare la sigaretta.
const FUMO_PENSIERI = [
  { id: "sollievo", t: "Quello che senti come sollievo è il bisogno creato dalla nicotina. Accendendola non guadagni niente: torni solo alla condizione di prima." },
  { id: "scelta", t: "Non devi decidere di non fumare per sempre. Basta non accendere questa sigaretta adesso." },
  { id: "passa", t: "Una voglia dura pochi minuti, anche se sembra infinita. Ogni volta che passa senza fumare, dimostri a te stesso che puoi farlo." },
  { id: "privazione", t: "Sembra una privazione, ma stai liberandoti di una dipendenza che ogni giorno occupa la tua mente." },
  { id: "forza", t: "Chi smette non resiste con la forza: smette di credere che la sigaretta sia necessaria, e questo cambia tutto." },
  { id: "capelli", t: "Il fumo restringe i piccoli vasi del corpo, anche quelli che nutrono i capelli. Ogni ora senza sigaretta è un'ora in cui non li stringi." },
  { id: "sopracciglia", t: "Il grigio arriva comunque con il tempo. Quello che puoi decidere è quanto in fretta arriva." },
  { id: "pelle", t: "Il fumo accelera l'invecchiamento della pelle. Ogni giorno senza sigarette è un giorno in cui la pelle ha meno cose da sopportare." },
  { id: "specchio", t: "Tra un mese guardati allo specchio. Non serve un cambiamento perfetto: basta notare che sei già diverso da ieri." },
  { id: "respiro", t: "Un respiro profondo adesso vale più di una boccata." },
  { id: "motivo", t: "Pensa al motivo che hai scritto. Era la tua ragione quando eri lucido, e lo è ancora." },
  { id: "ricomincio", t: "Anche se hai fumato ieri, oggi è un altro giorno: il conto ricomincia da adesso." },
  { id: "chi_ami", t: "Chi ti vuole bene preferisce vederti respirare meglio, non solo smettere." },
  { id: "odore", t: "Vestiti, casa, mani: il fumo si sente prima di quanto pensi. Smettere è anche tornare a sentire l'aria pulita." },
  { id: "soldi", t: "Il prezzo di un pacchetto basta per comprare qualcosa che ti piace davvero." },
  { id: "minuto", t: "Questo minuto passa anche se fumi. Prova a vedere quanti ne passano senza." },
  { id: "gusto", t: "Il gusto del cibo torna più in fretta di quanto immagini: ti accorgerai del pane che sa di pane." },
  { id: "non_sentirsi_bene", t: "Non devi sentirti bene per smettere: basta non accendere." },
  { id: "ritaglio_1", t: "Non stai rinunciando a un piacere. Stai smettendo di pagare per il malessere che la sigaretta ha creato." },
  { id: "ritaglio_2", t: "Ogni volta che accendi, la dipendenza ti convince che ti serve. Non ti serve." },
  { id: "ritaglio_3", t: "La sigaretta non ti dà piacere: ti toglie l'astinenza che lei stessa ha causato." },
  { id: "ritaglio_4", t: "Il pensiero che ti manca qualcosa è la trappola. Non ti manca niente." },
  { id: "ritaglio_5", t: "Non devi essere forte. Devi capire che la sigaretta non ti aggiunge niente." },
  { id: "ritaglio_6", t: "Fumare non ti rilassa: ti rilassa smettere di aver bisogno della sigaretta." },
  { id: "ritaglio_7", t: "Hai detto tante volte che è l'ultima. Non è una questione di forza, è una questione di capire come funziona." },
  { id: "ritaglio_8", t: "La voglia è un segnale della dipendenza, non una verità su di te." },
  { id: "ritaglio_9", t: "Ogni sigaretta che non accendi è una prova che la dipendenza non ti comanda." },
  { id: "ritaglio_10", t: "Quello che ti sembra un sacrificio è la fine di un abbonamento che non avresti mai voluto sottoscrivere." },
  { id: "ritaglio_11", t: "Non c'è niente di speciale in una sigaretta. È solo quello che il corpo ti chiede, e puoi dirgli di no." },
];

// Una frase per ogni apertura dell'app: viene scelta una volta al caricamento e resta quella finché la pagina è aperta.
let fumoFraseAperta = null;
function fumoPensieroDiOggi() {
  if (!fumoFraseAperta) fumoFraseAperta = FUMO_PENSIERI[Math.floor(Math.random() * FUMO_PENSIERI.length)];
  return fumoFraseAperta;
}

function fumoPensieroById(id) {
  return FUMO_PENSIERI.find((t) => t.id === id) || FUMO_PENSIERI[0];
}

// Traguardi legati alla riduzione: ogni giorno si confronta con il precedente, a partire dal giorno di inizio.
function fumoRiduzioni() {
  const perDay = (S.fumo && S.fumo.smokedDays) || {};
  const count = (k) => perDay[k] || 0;
  const startKey = keyOf(new Date(S.fumo.start));
  const days = Array.from({ length: 30 }, (_, i) => addDays(todayKey(), i - 29)).filter((k) => k >= startKey);
  let run = 0, bestRun = 0, zeroRun = 0, bestZero = 0;
  for (let i = 0; i < days.length; i++) {
    if (i > 0 && count(days[i]) < count(days[i - 1])) run++; else if (i > 0) run = 0;
    bestRun = Math.max(bestRun, run);
    zeroRun = count(days[i]) === 0 ? zeroRun + 1 : 0;
    bestZero = Math.max(bestZero, zeroRun);
  }
  return [
    { ok: bestRun >= 1, t: "Un giorno con meno sigarette del giorno prima" },
    { ok: bestRun >= 3, t: "Tre giorni di fila con meno sigarette del giorno prima" },
    { ok: bestRun >= 7, t: "Sette giorni di fila con meno sigarette del giorno prima" },
    { ok: bestZero >= 7, t: "Una settimana senza sigarette registrate" },
  ];
}

// Dialogo per le voglie: pensiero del giorno e conto alla rovescia.
let fumoTimer = null;
const FUMO_ROUND = "width:124px;height:124px;border-radius:50%;padding:8px;line-height:1.2;white-space:normal;font-size:0.95rem;";
// Voglia in corso: resta registrata finché non la chiudi con "Ce l'ho fatta" o "Ho appena acceso". Dopo 12 ore decade.
function fumoActive() {
  const act = S.fumo && S.fumo.active;
  if (!act) return null;
  if (fumoNow() - act.start > 12 * 3600000) { S.fumo.active = null; save(); return null; }
  return act;
}

function fumoClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), sec = total % 60;
  if (h > 0) return `${h} ${h === 1 ? "ora" : "ore"} e ${m} ${m === 1 ? "minuto" : "minuti"}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function fumoCravingDialog(minutes) {
  const act = fumoActive();
  if (act) return fumoShowCraving(act);
  const tec = fumoPensieroDiOggi();
  const start = fumoNow();
  minutes = minutes || 10;
  S.fumo.cravings = S.fumo.cravings || [];
  S.fumo.cravings.push(new Date(start).toISOString());
  S.fumo.active = { start, end: start + minutes * 60000, mins: minutes, tech: tec.id };
  save();
  fumoShowCraving(S.fumo.active);
}

// Rotella per scegliere i minuti: parte da 1 e li sceglie l'utente scorrendo.
const FUMO_ITEM_H = 40;
function fumoOpenPicker() {
  const items = Array.from({ length: 60 }, (_, i) => `<div style="height:${FUMO_ITEM_H}px;line-height:${FUMO_ITEM_H}px;scroll-snap-align:center;font-size:1.3rem">${i + 1}</div>`).join("");
  const pad = `<div style="height:${FUMO_ITEM_H * 2}px"></div>`;
  openDialog(`
    <h3>Quanti minuti riesci ad aspettare?</h3>
    <p class="muted small">Scorri la rotella fino al numero che vuoi.</p>
    <div id="fumo-wheel" style="height:${FUMO_ITEM_H * 3}px;overflow-y:auto;scroll-snap-type:y mandatory;border:1px solid var(--line);border-radius:12px;text-align:center">${pad}${items}${pad}</div>
    <p class="stat-v" id="fumo-wheel-val" style="text-align:center;font-size:1.6rem">1 minuto</p>
    <button class="btn primary wide" data-act="fumo-wait">Inizia</button>
    <button class="btn ghost wide" data-act="dlg-close">Annulla</button>`);
  const w = $("#fumo-wheel");
  w.addEventListener("scroll", () => {
    const m = Math.min(60, Math.max(1, Math.round(w.scrollTop / FUMO_ITEM_H)));
    $("#fumo-wheel-val").textContent = `${m} ${m === 1 ? "minuto" : "minuti"}`;
  }, { passive: true });
}

function fumoSelectedMinutes() {
  const w = $("#fumo-wheel");
  return Math.min(60, Math.max(1, Math.round(w.scrollTop / FUMO_ITEM_H)));
}

function fumoShowCraving(act) {
  const tec = fumoPensieroById(act.tech);
  openDialog(`
    <h3>Cronometro</h3>
    <div id="fumo-count" style="font-size:3rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums"></div>
    <div class="bar" style="margin:10px 0"><span id="fumo-bar" style="width:0%"></span></div>
    <p id="fumo-breath" class="small" style="text-align:center"></p>
    <p>${esc(tec.t)}</p>
    ${S.fumo.reason ? `<p class="small"><strong>Il tuo motivo:</strong> ${esc(S.fumo.reason)}</p>` : ""}
    <p class="small" style="margin:12px 0 6px;font-weight:600">Fai una di queste al posto della sigaretta:</p>
    ${fumoPrevisione().map((a, i) => `<button class="btn ghost wide" data-act="fumo-act" data-i="${i}" style="margin-top:6px">${esc(a)}</button>`).join("")}
    <button class="btn primary wide" data-act="fumo-done">Ce l'ho fatta</button>
    <button class="btn danger wide" data-act="fumo-lit">Ho appena acceso la sigaretta</button>`);
  clearInterval(fumoTimer);
  const target = act.mins * 60000;
  const tick = () => {
    const c = $("#fumo-count");
    if (!c || !dlg().open) { clearInterval(fumoTimer); return; }
    const elapsed = Math.max(0, fumoNow() - act.start);
    c.textContent = fumoHMS(elapsed);
    $("#fumo-bar").style.width = Math.min(100, Math.round((elapsed / target) * 100)) + "%";
    $("#fumo-breath").textContent = elapsed < target
      ? `Conto alla rovescia: ${fumoClock(target - elapsed)}`
      : "Obiettivo superato. Continua così.";
  };
  tick();
  fumoTimer = setInterval(tick, 500);
}

// Chiamata da act() in app.js: restituisce true se l'azione è gestita qui.
function fumoAct(a, el) {
  switch (a) {
    case "fumo-craving": fumoCravingDialog(); return true;
    case "tab-fumo": view.tab = "fumo"; resetScroll = true; render(); return true;
    case "fumo-wait": {
      fumoCravingDialog(fumoSelectedMinutes());
      return true;
    }
    case "fumo-plan-edit": {
      const i = parseInt(el.dataset.i);
      const text = fumoPrevisione()[i] || "";
      openDialog(`
        <h3>Modifica l'azione</h3>
        <form id="fumo-item-form" class="form" data-kind="plan" data-idx="${i}">
          <input name="text" maxlength="80" value="${esc(text)}" autofocus>
          <button class="btn primary wide" type="submit">Salva</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">Annulla</button>
        </form>`);
      return true;
    }
    case "fumo-plan-del": {
      const i = parseInt(el.dataset.i);
      if (!confirm("Eliminare questa azione dalla previsione?")) return true;
      S.fumo.acts = fumoPrevisione().filter((_, k) => k !== i);
      save(); render(); toast("Azione eliminata");
      return true;
    }
    case "fumo-log-edit": {
      const idx = parseInt(el.dataset.idx);
      const e = (S.fumo.log || [])[idx];
      if (!e) return true;
      const field = e.kind === "act"
        ? `<input name="text" maxlength="80" value="${esc(e.text)}" autofocus>`
        : `<input name="n" type="number" min="1" max="100" step="1" value="${e.n || 1}" autofocus>`;
      openDialog(`
        <h3>${e.kind === "act" ? "Modifica l'azione" : "Modifica le sigarette"}</h3>
        <form id="fumo-item-form" class="form" data-kind="log" data-idx="${idx}">
          ${field}
          <button class="btn primary wide" type="submit">Salva</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">Annulla</button>
        </form>`);
      return true;
    }
    case "fumo-log-del": {
      const idx = parseInt(el.dataset.idx);
      const e = (S.fumo.log || [])[idx];
      if (!e || !confirm("Eliminare questa voce del registro?")) return true;
      S.fumo.log = S.fumo.log.filter((_, k) => k !== idx);
      if (e.kind === "act") S.fumo.actCount = Math.max(0, (S.fumo.actCount || 0) - 1);
      if (e.kind === "smoke") {
        const n = e.n || 1, day = keyOf(new Date(e.at));
        S.fumo.smoked = Math.max(0, (S.fumo.smoked || 0) - n);
        if (S.fumo.smokedDays && S.fumo.smokedDays[day]) S.fumo.smokedDays[day] = Math.max(0, S.fumo.smokedDays[day] - n);
      }
      save(); render(); toast("Voce eliminata");
      return true;
    }
    case "giornata-from-last": {
      const f = $("#giornata-add-form");
      if (!f) return true;
      const smokes = ((S.fumo && S.fumo.log) || []).filter((e) => e.kind === "smoke").map((e) => new Date(e.at).getTime()).filter((t) => t <= fumoNow());
      const last = smokes.length ? Math.max(...smokes) : (S.fumo && S.fumo.start ? new Date(S.fumo.start).getTime() : null);
      if (!last) { toast("Non c'è un'ultima sigaretta da cui partire"); return true; }
      const d = new Date(last);
      f.querySelector('[name=kind]').value = "act";
      f.querySelector('[name=time]').value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      f.querySelector('[name=min]').value = Math.max(1, Math.round((fumoNow() - last) / 60000));
      toast("Compilato dall'ultima sigaretta: scrivi cosa hai fatto");
      return true;
    }
    case "giornata-prev": view.giornataDay = addDays(view.giornataDay || todayKey(), -1); render(); return true;
    case "giornata-next": { const d = addDays(view.giornataDay || todayKey(), 1); view.giornataDay = d > todayKey() ? todayKey() : d; render(); return true; }
    case "fumo-day-prev": view.fumoDay = addDays(view.fumoDay || todayKey(), -1); render(); return true;
    case "fumo-day-next": { const d = addDays(view.fumoDay || todayKey(), 1); view.fumoDay = d > todayKey() ? todayKey() : d; render(); return true; }
    case "fumo-log-text": {
      const text = String(el.dataset.t || "").trim();
      if (!text) return true;
      const now = new Date(fumoNow()).toISOString();
      S.fumo.actCount = (S.fumo.actCount || 0) + 1;
      S.fumo.log = [...(S.fumo.log || []), { at: now, kind: "act", text }];
      if (!fumoPrevisione().includes(text)) S.fumo.acts = [...fumoPrevisione(), text];
      save(); toast(`Fatto: ${text}`);
      if (!dlg().open) render();
      return true;
    }
    case "fumo-act": {
      const list = fumoPrevisione();
      const text = list[parseInt(el && el.dataset.i)] || "";
      S.fumo.actCount = (S.fumo.actCount || 0) + 1;
      S.fumo.actLog = [...(S.fumo.actLog || []), { at: new Date(fumoNow()).toISOString(), text }];
      S.fumo.log = [...(S.fumo.log || []), { at: new Date(fumoNow()).toISOString(), kind: "act", text }];
      save(); toast(`Fatto: ${text}`);
      if (!dlg().open) render();
      return true;
    }
    case "fumo-done":
      clearInterval(fumoTimer);
      S.fumo.active = null;
      S.fumo.resisted = S.fumo.resisted || [];
      S.fumo.resisted.push(new Date().toISOString());
      closeDialog(); save(); render(); toast("Ottimo, voglia superata");
      return true;
    case "fumo-edit": view.fumoEdit = true; resetScroll = true; render(); return true;
    case "fumo-cancel": view.fumoEdit = false; render(); return true;
    case "fumo-lit":
    case "fumo-lit-now": {
      const act = S.fumo.active;
      clearInterval(fumoTimer);
      const now = fumoNow();
      // Il tempo resistito è quello dall'ultima sigaretta, cioè lo stesso conteggio di "Senza fumare da".
      const started = new Date(S.fumo.start).getTime();
      const elapsed = Math.max(0, now - started);
      const m = Math.floor(elapsed / 60000), sec = Math.floor((elapsed % 60000) / 1000);
      S.fumo.attempts = S.fumo.attempts || [];
      S.fumo.attempts.push({ at: new Date(now).toISOString(), seconds: Math.round(elapsed / 1000) });
      S.fumo.active = null;
      S.fumo.smoked = (S.fumo.smoked || 0) + 1;
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[todayKey()] = (S.fumo.smokedDays[todayKey()] || 0) + 1;
      S.fumo.log = [...(S.fumo.log || []), { at: new Date(now).toISOString(), kind: "smoke", n: 1 }];
      S.fumo.best = Math.max(S.fumo.best || 0, fumoStats().ms);
      S.fumo.start = new Date(now).toISOString();
      save(); resetScroll = true;
      openDialog(`
        <h3>Hai resistito ${m} ${m === 1 ? "minuto" : "minuti"} e ${sec} ${sec === 1 ? "secondo" : "secondi"}</h3>
        <p class="muted small">Il conto del tempo senza fumare riparte da adesso. Puoi ricominciare quando vuoi.</p>
        <p>${esc(fumoPensieroDiOggi().t)}</p>
        <button class="btn primary wide" data-act="dlg-close">Ok</button>`);
      render();
      return true;
    }
  }
  return false;
}

document.addEventListener("submit", (e) => {
  if (e.target.id === "giornata-add-form") {
    e.preventDefault();
    const fd = new FormData(e.target);
    const day = view.giornataDay || todayKey();
    const [hh, mm] = String(fd.get("time") || "").split(":").map(Number);
    const when = parseKey(day);
    when.setHours(hh || 0, mm || 0, 0, 0);
    if (when > new Date()) { toast("L'ora è nel futuro"); return; }
    const at = when.toISOString();
    const text = String(fd.get("text") || "").trim();
    if (fd.get("kind") === "smoke") {
      if (!S.fumo) { toast("Imposta prima la data di inizio nella scheda Fumo"); return; }
      const n = Math.max(1, parseInt(text) || 1);
      S.fumo.log = [...(S.fumo.log || []), { at, kind: "smoke", n }];
      S.fumo.smoked = (S.fumo.smoked || 0) + n;
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[day] = (S.fumo.smokedDays[day] || 0) + n;
    } else {
      if (!text) { toast("Scrivi cosa hai fatto"); return; }
      S.giornata = S.giornata || { log: [] };
      const min = Math.max(0, parseInt(fd.get("min")) || 0);
      S.giornata.log = [...S.giornata.log, min ? { at, text, min } : { at, text }];
    }
    save(); render(); toast("Aggiunto");
    return;
  }
  if (e.target.id === "fumo-add-form") {
    e.preventDefault();
    const fd = new FormData(e.target);
    const day = view.fumoDay || todayKey();
    const [hh, mm] = String(fd.get("time") || "").split(":").map(Number);
    const when = parseKey(day);
    when.setHours(hh || 0, mm || 0, 0, 0);
    if (when > new Date()) { toast("L'ora è nel futuro"); return; }
    const at = when.toISOString();
    const kind = fd.get("kind");
    const text = String(fd.get("text") || "").trim();
    if (kind === "smoke") {
      const n = Math.max(1, parseInt(text) || 1);
      S.fumo.log = [...(S.fumo.log || []), { at, kind: "smoke", n }];
      S.fumo.smoked = (S.fumo.smoked || 0) + n;
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[day] = (S.fumo.smokedDays[day] || 0) + n;
    } else {
      if (!text) { toast("Scrivi cosa hai fatto"); return; }
      S.fumo.log = [...(S.fumo.log || []), { at, kind: "act", text }];
      S.fumo.actCount = (S.fumo.actCount || 0) + 1;
      if (!fumoPrevisione().includes(text)) S.fumo.acts = [...fumoPrevisione(), text];
    }
    save(); render(); toast("Aggiunto al registro");
    return;
  }
  if (e.target.id === "fumo-item-form") {
    e.preventDefault();
    const f = e.target, fd = new FormData(f);
    const idx = parseInt(f.dataset.idx);
    if (f.dataset.kind === "plan") {
      const text = String(fd.get("text") || "").trim();
      if (!text) return;
      S.fumo.acts = fumoPrevisione().map((a, k) => (k === idx ? text : a));
    } else {
      const entry = (S.fumo.log || [])[idx];
      if (!entry) return;
      if (entry.kind === "act") {
        const text = String(fd.get("text") || "").trim();
        if (!text) return;
        entry.text = text;
      } else {
        const n = Math.max(1, parseInt(fd.get("n")) || 1);
        const diff = n - (entry.n || 1), day = keyOf(new Date(entry.at));
        entry.n = n;
        S.fumo.smoked = Math.max(0, (S.fumo.smoked || 0) + diff);
        S.fumo.smokedDays = S.fumo.smokedDays || {};
        S.fumo.smokedDays[day] = Math.max(0, (S.fumo.smokedDays[day] || 0) + diff);
      }
    }
    closeDialog(); save(); render(); toast("Modifica salvata");
    return;
  }
  if (e.target.id === "fumo-acts-form") {
    e.preventDefault();
    const text = String(new FormData(e.target).get("act") || "").trim();
    if (!text) return;
    S.fumo.acts = [...fumoPrevisione(), text];
    save(); render(); toast("Azione aggiunta");
    return;
  }
  if (e.target.id !== "fumo-form") return;
  e.preventDefault();
  const fd = new FormData(e.target);
  const prev = S.fumo || {};
  const start = new Date(fd.get("start"));
  S.fumo = {
    ...prev,
    start: (start > new Date() ? new Date() : start).toISOString(),
    perDay: parseFloat(fd.get("perDay")),
    packPrice: parseFloat(fd.get("packPrice")),
    packSize: parseFloat(fd.get("packSize")),
    reason: String(fd.get("reason") || "").trim(),
    cravings: prev.cravings || [],
  };
  view.fumoEdit = false;
  save(); resetScroll = true; render(); toast("Dati salvati");
});
