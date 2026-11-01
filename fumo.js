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

function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderFumo() {
  if (!S.fumo) return renderFumoSetup();
  if (view.fumoEdit) return renderFumoSetup(true);
  const f = S.fumo, st = fumoStats();
  const done = FUMO_TRAGUARDI.filter((m) => st.hours >= m.h);
  const next = FUMO_TRAGUARDI.find((m) => st.hours < m.h);
  const today = new Date().toDateString();
  const cravingsToday = (f.cravings || []).filter((t) => new Date(t).toDateString() === today).length;
  const pctNext = next ? Math.min(100, Math.round((st.hours / next.h) * 100)) : 100;
  return `
    <section class="card">
      <div class="muted small">Senza fumare da</div>
      <div class="stat-v" style="font-size:1.6rem">${esc(fumoDuration(st.ms))}</div>
      <div class="muted small">Dal ${esc(new Date(f.start).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}</div>
    </section>
    <section class="card">
      <div class="stats">
        <div class="stat"><div class="muted small">Sigarette evitate</div><div class="stat-v">${r0(st.avoided)}</div></div>
        <div class="stat"><div class="muted small">Soldi risparmiati</div><div class="stat-v">${fumoEuro(st.saved)}</div></div>
        <div class="stat"><div class="muted small">Vita recuperata (stima)</div><div class="stat-v">${st.minutes >= 1440 ? r1(st.minutes / 1440) + " giorni" : st.minutes >= 60 ? r1(st.minutes / 60) + " ore" : r0(st.minutes) + " min"}</div></div>
      </div>
      <p class="muted small">La stima della vita recuperata conta 11 minuti per sigaretta evitata ed è solo indicativa.</p>
    </section>
    <button class="btn primary wide" data-act="fumo-craving">Ho voglia di fumare</button>
    <p class="muted small">Voglie registrate oggi: ${cravingsToday}. Superate in totale: ${(f.cravings || []).length}.</p>
    <section class="card">
      <h3>Prossimo traguardo</h3>
      ${next ? `<p><strong>${esc(next.t)}</strong>: ${esc(next.d)}</p>${bar(pctNext, 100)}<div class="muted small">${pctNext}% del tempo</div>` : "<p>Hai superato tutti i traguardi in elenco. Continua così.</p>"}
    </section>
    ${done.length ? `<section class="card"><h3>Traguardi raggiunti</h3>${done.map((m) => `<p class="small"><strong>${esc(m.t)}</strong>: ${esc(m.d)}</p>`).join("")}<p class="muted small">Indicazioni generali di salute pubblica: i tempi variano da persona a persona.</p></section>` : ""}
    ${f.reason ? `<section class="card"><h3>Il tuo motivo</h3><p>${esc(f.reason)}</p></section>` : ""}
    <section class="card">
      <h3>Impostazioni</h3>
      <div class="btns">
        <button class="btn ghost" data-act="fumo-edit">Modifica dati</button>
        <button class="btn danger" data-act="fumo-relapse">Ho fumato</button>
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

// Dialogo per le voglie: conto alla rovescia di 10 minuti con respirazione guidata.
let fumoTimer = null;
function fumoCravingDialog() {
  S.fumo.cravings = S.fumo.cravings || [];
  S.fumo.cravings.push(new Date().toISOString());
  save();
  const end = fumoNow() + 10 * 60 * 1000;
  openDialog(`
    <h3>Resisti 10 minuti</h3>
    <p class="muted small">Una voglia dura di solito pochi minuti e poi cala, anche se non fai niente.</p>
    <div class="stat-v" id="fumo-count" style="font-size:2.4rem;text-align:center">10:00</div>
    <p id="fumo-breath" style="text-align:center;font-weight:600"></p>
    <ul class="small">
      <li>Bevi un bicchiere d'acqua lentamente.</li>
      <li>Cammina per due minuti o cambia stanza.</li>
      <li>Lavati i denti o mastica qualcosa.</li>
    </ul>
    ${S.fumo.reason ? `<p class="small"><strong>Il tuo motivo:</strong> ${esc(S.fumo.reason)}</p>` : ""}
    <button class="btn primary wide" data-act="fumo-done">Ce l'ho fatta</button>`);
  clearInterval(fumoTimer);
  const tick = () => {
    const c = $("#fumo-count");
    if (!c || !dlg().open) { clearInterval(fumoTimer); return; }
    const left = Math.max(0, end - fumoNow());
    c.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
    // ciclo di 12 secondi: inspira 4, trattieni 2, espira 6
    const s = Math.floor((10 * 60 * 1000 - left) / 1000) % 12;
    $("#fumo-breath").textContent = s < 4 ? "Inspira dal naso" : s < 6 ? "Trattieni" : "Espira lentamente";
    if (left === 0) { clearInterval(fumoTimer); c.textContent = "Fatto"; }
  };
  tick();
  fumoTimer = setInterval(tick, 500);
}

// Chiamata da act() in app.js: restituisce true se l'azione è gestita qui.
function fumoAct(a) {
  switch (a) {
    case "fumo-craving": fumoCravingDialog(); return true;
    case "fumo-done": clearInterval(fumoTimer); closeDialog(); toast("Ottimo, voglia superata"); return true;
    case "fumo-edit": view.fumoEdit = true; resetScroll = true; render(); return true;
    case "fumo-cancel": view.fumoEdit = false; render(); return true;
    case "fumo-relapse":
      if (confirm("Registrare che hai fumato e ripartire da adesso?")) {
        S.fumo.best = Math.max(S.fumo.best || 0, fumoStats().ms);
        S.fumo.start = new Date().toISOString();
        save(); resetScroll = true; render(); toast("Si riparte, un giorno alla volta");
      }
      return true;
  }
  return false;
}

document.addEventListener("submit", (e) => {
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
