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
  const tecOggi = fumoTecnicaDiOggi();
  const perDay = f.smokedDays || {};
  const dayKeys = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), -i));
  const smokedToday = perDay[todayKey()] || 0;
  const weekRows = dayKeys.map((k) => `<div class="row"><div>${esc(fmtDate(k, { weekday: "short", day: "numeric", month: "short" }))}</div><div class="row-r">${perDay[k] || 0}</div></div>`).join("");
  const tecStats = f.tech || {};
  const tecRows = FUMO_TECNICHE.filter((t) => tecStats[t.id]).map((t) => `<p class="small"><strong>${esc(t.n)}</strong>: utile ${tecStats[t.id].helped} volte su ${tecStats[t.id].tries}</p>`).join("");
  const done = FUMO_TRAGUARDI.filter((m) => st.hours >= m.h);
  const next = FUMO_TRAGUARDI.find((m) => st.hours < m.h);
  const today = new Date().toDateString();
  const resistedToday = (f.resisted || []).filter((t) => new Date(t).toDateString() === today).length;
  const pctNext = next ? Math.min(100, Math.round((st.hours / next.h) * 100)) : 100;
  return `
    <div class="btns">
      <button class="btn primary" data-act="fumo-craving">${f.active && f.active.end > fumoNow() ? "Riprendi il conto" : "Ho voglia di fumare"}</button>
      <button class="btn danger" data-act="fumo-relapse">Ho fumato</button>
    </div>
    <section class="card">
      <div class="muted small">Senza fumare da</div>
      <div class="stat-v" style="font-size:1.6rem">${esc(fumoDuration(st.ms))}</div>
      <div class="muted small">Dal ${esc(new Date(f.start).toLocaleString("it-IT", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }))}</div>
    </section>
    <section class="card">
      <div class="stats">
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
    <section class="card"><h3>Tecnica di oggi</h3><p><strong>${esc(tecOggi.n)}</strong>: ${esc(tecOggi.t)}</p>${tecRows}</section>
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
        <label>Durata del conto alla rovescia per le voglie
          <select name="timer">${[10, 15, 20].map((m) => `<option value="${m}" ${(f.timer || 10) === m ? "selected" : ""}>${m} minuti</option>`).join("")}</select></label>
        <label>Il tuo motivo per smettere
          <textarea name="reason" rows="2" maxlength="200">${esc(f.reason || "")}</textarea></label>
        <button class="btn primary wide" type="submit">Salva</button>
        ${editing ? `<button class="btn ghost wide" type="button" data-act="fumo-cancel">Annulla</button>` : ""}
      </form>
    </section>`;
}

// Tecniche per le voglie. Ogni giorno l'app propone una tecnica diversa finché non ne ha provate tutte.
// Poi tiene quelle che hanno aiutato almeno la metà delle volte e scarta le altre.
const FUMO_TECNICHE = [
  { id: "respiro", n: "Respirazione lenta", t: "Inspira dal naso per quattro secondi, trattieni due, espira per sei." },
  { id: "acqua", n: "Bicchiere d'acqua", t: "Bevi un bicchiere d'acqua lentamente, sorseggiando." },
  { id: "cammino", n: "Due minuti di cammino", t: "Cammina per due minuti, anche in casa." },
  { id: "stanza", n: "Cambia stanza", t: "Spostati in un'altra stanza e tieni le mani occupate." },
  { id: "gomma", n: "Mastica qualcosa", t: "Mastica una gomma senza zucchero o una carota." },
  { id: "denti", n: "Lavati i denti", t: "Lavati i denti o sciacquati la bocca: il sapore della sigaretta si attenua." },
  { id: "persona", n: "Scrivi a qualcuno", t: "Manda un messaggio a una persona che sostiene la tua scelta." },
  { id: "motivo", n: "Rileggi il motivo", t: "Leggi ad alta voce il tuo motivo per smettere." },
];

function fumoTecnicaDiOggi() {
  const stats = (S.fumo && S.fumo.tech) || {};
  const get = (id) => stats[id] || { tries: 0, helped: 0 };
  const score = (id) => (get(id).helped + 1) / (get(id).tries + 2);
  const dayIdx = Math.floor(fumoNow() / 86400000);
  const untried = FUMO_TECNICHE.filter((t) => !stats[t.id]);
  if (untried.length) return untried[dayIdx % untried.length];
  const good = FUMO_TECNICHE.filter((t) => score(t.id) >= 0.5);
  if (good.length) return good[dayIdx % good.length];
  // Nessuna ha funzionato abbastanza: prova quella usata meno.
  return [...FUMO_TECNICHE].sort((a, b) => get(a.id).tries - get(b.id).tries)[0];
}

// Dialogo per le voglie: tecnica del giorno e conto alla rovescia di 10 minuti.
let fumoTimer = null;
function fumoCravingDialog() {
  // Se il conto alla rovescia è ancora in corso (chiuso per sbaglio o per usare un'altra app), riprende da dove era.
  const act = S.fumo.active;
  if (act && act.end > fumoNow()) return fumoShowCraving(act.end, fumoTecnicaById(act.tech), act.mins);
  const tec = fumoTecnicaDiOggi();
  const mins = S.fumo.timer || 10;
  const end = fumoNow() + mins * 60 * 1000;
  S.fumo.cravings = S.fumo.cravings || [];
  S.fumo.cravings.push(new Date().toISOString());
  S.fumo.lastTech = tec.id;
  S.fumo.active = { end, tech: tec.id, mins };
  save();
  fumoShowCraving(end, tec, mins);
}

function fumoTecnicaById(id) {
  return FUMO_TECNICHE.find((t) => t.id === id) || FUMO_TECNICHE[0];
}

function fumoShowCraving(end, tec, mins) {
  const total = mins * 60 * 1000;
  openDialog(`
    <h3>Resisti ${mins} minuti</h3>
    <p class="muted small">Una voglia dura di solito pochi minuti e poi cala.</p>
    <div class="stat-v" id="fumo-count" style="font-size:2.4rem;text-align:center">${mins}:00</div>
    <p id="fumo-breath" style="text-align:center;font-weight:600"></p>
    <p><strong>Tecnica di oggi: ${esc(tec.n)}.</strong> ${esc(tec.t)}</p>
    ${S.fumo.reason ? `<p class="small"><strong>Il tuo motivo:</strong> ${esc(S.fumo.reason)}</p>` : ""}
    <button class="btn primary wide" data-act="fumo-done">Ce l'ho fatta</button>`);
  clearInterval(fumoTimer);
  const tick = () => {
    const c = $("#fumo-count");
    if (!c || !dlg().open) { clearInterval(fumoTimer); return; }
    const left = Math.max(0, end - fumoNow());
    c.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
    // ciclo di 12 secondi: inspira 4, trattieni 2, espira 6
    const s = Math.floor((total - left) / 1000) % 12;
    $("#fumo-breath").textContent = s < 4 ? "Inspira dal naso" : s < 6 ? "Trattieni" : "Espira lentamente";
    if (left === 0) { clearInterval(fumoTimer); c.textContent = "Fatto"; }
  };
  tick();
  fumoTimer = setInterval(tick, 500);
}

// Chiamata da act() in app.js: restituisce true se l'azione è gestita qui.
function fumoAct(a, el) {
  switch (a) {
    case "fumo-craving": fumoCravingDialog(); return true;
    case "fumo-done":
      clearInterval(fumoTimer);
      S.fumo.active = null;
      S.fumo.resisted = S.fumo.resisted || [];
      S.fumo.resisted.push(new Date().toISOString());
      save();
      openDialog(`
        <h3>Ti ha aiutato la tecnica?</h3>
        <p class="muted small">Serve a scegliere le tecniche dei prossimi giorni.</p>
        <button class="btn primary wide" data-act="fumo-helped" data-v="1">Sì</button>
        <button class="btn ghost wide" data-act="fumo-helped" data-v="0">No</button>`);
      return true;
    case "fumo-helped": {
      const id = S.fumo.lastTech;
      if (id) {
        S.fumo.tech = S.fumo.tech || {};
        const x = S.fumo.tech[id] || { tries: 0, helped: 0 };
        x.tries++;
        if (el && el.dataset.v === "1") x.helped++;
        S.fumo.tech[id] = x;
      }
      S.fumo.lastTech = null;
      closeDialog(); save(); render(); toast("Registrato");
      return true;
    }
    case "fumo-edit": view.fumoEdit = true; resetScroll = true; render(); return true;
    case "fumo-cancel": view.fumoEdit = false; render(); return true;
    case "fumo-relapse":
      openDialog(`
        <h3>Quante sigarette hai fumato?</h3>
        <p class="muted small">Il conto riparte da adesso, ma le sigarette restano registrate nel totale.</p>
        <input id="fumo-n" type="number" min="1" max="100" step="1" value="1" autofocus>
        <button class="btn primary wide" data-act="fumo-relapse-confirm">Registra e ripartire</button>
        <button class="btn ghost wide" data-act="dlg-close">Annulla</button>`);
      return true;
    case "fumo-relapse-confirm": {
      const n = Math.max(1, parseInt($("#fumo-n").value) || 1);
      S.fumo.smoked = (S.fumo.smoked || 0) + n;
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[todayKey()] = (S.fumo.smokedDays[todayKey()] || 0) + n;
      S.fumo.best = Math.max(S.fumo.best || 0, fumoStats().ms);
      S.fumo.start = new Date().toISOString();
      S.fumo.lastTech = null;
      closeDialog(); save(); resetScroll = true; render(); toast("Si riparte, un giorno alla volta");
      return true;
    }
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
    timer: parseInt(fd.get("timer")) || 10,
    cravings: prev.cravings || [],
  };
  view.fumoEdit = false;
  save(); resetScroll = true; render(); toast("Dati salvati");
});
