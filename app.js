"use strict";

// ---------- Stato e persistenza ----------
const KEY = "dieta-palestra-v1";
const emptyDay = () => ({ meals: [], drinks: [], ex: [], steps: 0, weight: null, rest: false, closed: false, note: "" });
const defaultState = () => ({
  profile: null,
  days: {},
  customFoods: [],
  habits: {},
  measures: [],
  measureDay: 1,
  required: ["colazione", "pranzo", "cena"],
  wanted: [],
  reminders: { misure: "07:30", colazione: "08:00", pranzo: "13:30", acqua: "16:00", cena: "20:30", chiusura: "22:30" },
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}
let S = load();
S.reminders = { ...defaultState().reminders, ...S.reminders };
S.measures = S.measures || [];
S.required = S.required || ["colazione", "pranzo", "cena"];
S.wanted = S.wanted || [];
const isReq = (sl) => S.required.includes(sl.id);
if (S.measureDay === undefined) S.measureDay = 1;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { alert("Impossibile salvare i dati: " + e.message); }
}

// ---------- Utilità ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const r0 = (n) => Math.round(n || 0);
const r1 = (n) => Math.round((n || 0) * 10) / 10;
const uid = () => Math.random().toString(36).slice(2, 10);
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
const todayKey = () => keyOf(new Date());
const fmtDate = (k, opts = { weekday: "long", day: "numeric", month: "long" }) => parseKey(k).toLocaleDateString("it-IT", opts);
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

let view = { tab: "oggi", date: todayKey(), period: 7 };

// Pasti abituali: salvati per pasto, inseriti in automatico una sola volta al giorno se l'opzione e' attiva.
function applyHabits(k) {
  if (!S.profile || k !== todayKey()) return;
  Object.entries(S.habits || {}).forEach(([slot, h]) => {
    if (!h.auto || !h.items.length) return;
    const d = day(k, true);
    d.autoDone = d.autoDone || {};
    if (d.autoDone[slot]) return;
    d.autoDone[slot] = true;
    if (!d.meals.some((m) => m.slot === slot)) d.meals.push(...h.items.map((m) => ({ ...m, id: uid(), slot })));
  });
  save();
}

function day(k, create = false) {
  if (!S.days[k]) {
    if (!create) return emptyDay();
    S.days[k] = emptyDay();
  }
  return S.days[k];
}

function weightAt(k) {
  const ks = Object.keys(S.days).filter((x) => x <= k && S.days[x].weight).sort();
  return ks.length ? S.days[ks[ks.length - 1]].weight : S.profile.weight;
}

// ---------- Calcoli ----------
function targets(k) {
  const p = S.profile;
  const w = weightAt(k);
  const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === "m" ? 5 : -161);
  const tdee = bmr * p.activity;
  const deficit = (p.rate * 7700) / 7;
  const floor = p.sex === "m" ? 1500 : 1200;
  const kcal = Math.max(Math.round((tdee - deficit) / 10) * 10, floor);
  const refW = Math.min(w, (p.goalWeight || w) + 10);
  const protein = Math.round(1.8 * refW);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round((w * 35) / 50) * 50;
  return { w, bmr, tdee, deficit, kcal, protein, fat, carbs, water };
}

function totals(k) {
  const d = day(k);
  const w = weightAt(k);
  const t = { kcal: 0, p: 0, c: 0, f: 0, alcKcal: 0, water: 0, exKcal: 0, exNet: 0, exMin: 0, strength: 0, steps: d.steps || 0 };
  d.meals.forEach((m) => { t.kcal += m.kcal; t.p += m.p; t.c += m.c; t.f += m.f; });
  d.drinks.forEach((x) => { t.kcal += x.kcal; t.c += x.c; if (x.hydr) t.water += x.ml; if (x.alc) t.alcKcal += x.kcal; });
  d.ex.forEach((e) => { t.exKcal += e.kcal; t.exNet += e.net; t.exMin += e.min; if (/pesi|circuito|functional/i.test(e.name)) t.strength++; });
  const stepNet = Math.max(0, t.steps - 4000) * 0.0005 * w;
  t.exKcal += stepNet; t.exNet += stepNet;
  const tg = targets(k);
  t.waterTarget = tg.water + Math.round((t.exMin * 8) / 50) * 50;
  t.expenditure = tg.tdee + t.exNet;
  t.balance = t.kcal - t.expenditure;
  return t;
}

function slotsDone(k) {
  const d = day(k);
  return SLOTS.filter((s) => d.meals.some((m) => m.slot === s.id)).map((s) => s.id);
}
function isTracked(k) {
  const d = S.days[k];
  if (!d) return false;
  if (d.closed) return true;
  const done = slotsDone(k);
  return ["colazione", "pranzo", "cena"].filter((id) => done.includes(id)).length >= 2;
}

function periodStats(endKey, n) {
  const keys = [];
  for (let i = n - 1; i >= 0; i--) keys.push(addDays(endKey, -i));
  const tracked = keys.filter(isTracked);
  const rows = keys.map((k) => ({ k, tracked: isTracked(k), t: totals(k), tg: targets(k), d: day(k) }));
  const tr = rows.filter((r) => r.tracked);
  const avg = (f) => (tr.length ? tr.reduce((a, r) => a + f(r), 0) / tr.length : 0);
  const weights = keys.filter((k) => S.days[k] && S.days[k].weight).map((k) => ({ k, w: S.days[k].weight }));
  const exMin = rows.reduce((a, r) => a + r.t.exMin, 0);
  const strength = rows.reduce((a, r) => a + r.t.strength, 0);
  const alc = rows.reduce((a, r) => a + r.t.alcKcal, 0);
  const sumBalance = tr.reduce((a, r) => a + r.t.balance, 0);
  const isWeekend = (k) => [0, 6].includes(parseKey(k).getDay());
  const we = tr.filter((r) => isWeekend(r.k)), wd = tr.filter((r) => !isWeekend(r.k));
  const m = (arr) => (arr.length ? arr.reduce((a, r) => a + r.t.kcal, 0) / arr.length : null);
  return {
    keys, rows, n, tracked: tracked.length,
    kcal: avg((r) => r.t.kcal), target: avg((r) => r.tg.kcal), p: avg((r) => r.t.p), pTarget: avg((r) => r.tg.protein),
    c: avg((r) => r.t.c), f: avg((r) => r.t.f), water: avg((r) => r.t.water), waterTarget: avg((r) => r.t.waterTarget),
    balance: avg((r) => r.t.balance), bmr: avg((r) => r.tg.bmr), exMin, strength, alc, sumBalance,
    estLossKg: -sumBalance / 7700,
    weights, weightDelta: weights.length >= 2 ? weights[weights.length - 1].w - weights[0].w : null,
    weekendKcal: m(we), weekdayKcal: m(wd),
    waterDays: tr.filter((r) => r.t.water >= r.t.waterTarget * 0.9).length,
    onTargetDays: tr.filter((r) => Math.abs(r.t.kcal - r.tg.kcal) <= 150 || r.t.kcal < r.tg.kcal).length,
  };
}

// ---------- Rendering principale ----------
function render() {
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === view.tab));
  const main = $("#main");
  if (!S.profile) { view.tab = "profilo"; main.innerHTML = renderProfile(true); return; }
  main.innerHTML = { oggi: renderToday, misure: renderMeasures, report: renderReport, coach: renderCoach, profilo: () => renderProfile(false) }[view.tab]();
  window.scrollTo(0, 0);
}

function bar(value, target, cls = "") {
  const over = value > target * 1.05;
  return `<div class="bar ${cls} ${over ? "over" : ""}"><span style="width:${pct(value, target)}%"></span></div>`;
}

function renderToday() {
  const k = view.date;
  const d = day(k);
  const t = totals(k);
  const tg = targets(k);
  const done = slotsDone(k);
  const isToday = k === todayKey();
  const remaining = tg.kcal - t.kcal;

  const checklist = [
    ...(measureDue(k) ? [{ label: "Peso e misure della settimana", ok: false, act: "tab-misure" }] : []),
    ...SLOTS.filter(isReq).map((s) => ({ label: s.label, ok: done.includes(s.id), act: "food", slot: s.id })),
    { label: `Acqua ${r1(t.water / 1000)} di ${r1(t.waterTarget / 1000)} litri`, ok: t.water >= t.waterTarget, act: "water" },
    { label: d.rest ? "Giorno di riposo" : "Allenamento o passi", ok: d.ex.length > 0 || t.steps >= 7000 || d.rest, act: "exercise" },
    { label: "Chiudi la giornata", ok: d.closed, act: "close" },
  ];
  const todo = checklist.filter((c) => !c.ok).length;

  const slotHtml = SLOTS.map((s) => {
    const items = d.meals.filter((m) => m.slot === s.id);
    const kc = items.reduce((a, m) => a + m.kcal, 0);
    if (!items.length && !isReq(s) && s.id !== "spuntino" && s.id !== "merenda") {
      return `<div class="slot empty"><div class="slot-h"><b>${s.label}</b><button class="link" data-act="food" data-slot="${s.id}">Aggiungi</button></div></div>`;
    }
    return `<div class="slot ${items.length ? "" : "empty"}">
      <div class="slot-h"><b>${s.label}</b><span class="muted">${items.length ? r0(kc) + " kcal" : ""}</span></div>
      ${items.map((m) => `<div class="row"><div><div>${esc(m.name)}</div><div class="muted small">${m.g ? r0(m.g) + " g, " : ""}P ${r0(m.p)} C ${r0(m.c)} G ${r0(m.f)}</div></div><div class="row-r"><span>${r0(m.kcal)}</span><button class="link mv" data-act="move-meal" data-id="${m.id}">Sposta</button><button class="x" data-act="del-meal" data-id="${m.id}" aria-label="Elimina">×</button></div></div>`).join("")}
      <div class="slot-actions"><button class="link" data-act="food" data-slot="${s.id}">Aggiungi alimento</button>${hasYesterday(k, s.id) ? `<button class="link" data-act="copy-slot" data-slot="${s.id}">Come ieri</button>` : ""}${items.length ? `<button class="link" data-act="save-habit" data-slot="${s.id}">Salva come abituale</button>` : ""}</div>
      ${habitHtml(s.id, items.length)}
    </div>`;
  }).join("");

  return `
  <div class="datebar">
    <button class="icon" data-act="prev-day" aria-label="Giorno precedente">‹</button>
    <div class="center"><div class="date">${isToday ? "Oggi" : esc(fmtDate(k, { weekday: "long" }))}</div><div class="muted small">${esc(fmtDate(k, { day: "numeric", month: "long", year: "numeric" }))}</div></div>
    <button class="icon" data-act="next-day" aria-label="Giorno successivo" ${isToday ? "disabled" : ""}>›</button>
  </div>

  <section class="card hero">
    <div class="hero-main">
      <div><div class="big">${r0(t.kcal)}</div><div class="muted small">kcal assunte</div></div>
      <div class="hero-mid"><div class="big ${remaining < 0 ? "bad" : "good"}">${r0(Math.abs(remaining))}</div><div class="muted small">${remaining < 0 ? "kcal oltre obiettivo" : "kcal rimanenti"}</div></div>
      <div><div class="big">${r0(t.exKcal)}</div><div class="muted small">kcal bruciate</div></div>
    </div>
    ${bar(t.kcal, tg.kcal)}
    <div class="macros">
      <div><span class="muted small">Proteine</span><b>${r0(t.p)} di ${tg.protein} g</b>${bar(t.p, tg.protein, "p")}</div>
      <div><span class="muted small">Carboidrati</span><b>${r0(t.c)} di ${tg.carbs} g</b>${bar(t.c, tg.carbs, "c")}</div>
      <div><span class="muted small">Grassi</span><b>${r0(t.f)} di ${tg.fat} g</b>${bar(t.f, tg.fat, "f")}</div>
    </div>
    <div class="muted small">Bilancio stimato del giorno: <b class="${t.balance > 0 ? "bad" : "good"}">${t.balance > 0 ? "surplus" : "deficit"} di ${r0(Math.abs(t.balance))} kcal</b> (consumo ${r0(t.expenditure)} kcal)</div>
  </section>

  <section class="card">
    <h2>Da inserire ${isToday ? "oggi" : "in questo giorno"} <span class="pill ${todo ? "" : "ok"}">${todo ? todo + " da fare" : "Completo"}</span></h2>
    <div class="checklist">
      ${checklist.map((c) => `<button class="check ${c.ok ? "ok" : ""}" data-act="${c.act}" ${c.slot ? `data-slot="${c.slot}"` : ""}><span class="dot"></span>${esc(c.label)}</button>`).join("")}
    </div>
  </section>

  <section class="card">
    <h2>Pasti</h2>
    ${slotHtml}
  </section>

  <section class="card">
    <h2>Bevande</h2>
    <div class="water">
      <div class="water-n"><b>${r1(t.water / 1000)} L</b><span class="muted small"> di ${r1(t.waterTarget / 1000)} L</span></div>
      ${bar(t.water, t.waterTarget, "w")}
      <div class="btns">
        <button class="btn" data-act="add-water" data-ml="250">Bicchiere 250 ml</button>
        <button class="btn" data-act="add-water" data-ml="500">Bottiglietta 500 ml</button>
        <button class="btn ghost" data-act="drink">Altra bevanda</button>
      </div>
    </div>
    ${d.drinks.map((x) => `<div class="row"><div><div>${esc(x.name)}</div><div class="muted small">${r0(x.ml)} ml${x.alc ? ", alcolico" : ""}</div></div><div class="row-r"><span>${r0(x.kcal)}</span><button class="x" data-act="del-drink" data-id="${x.id}" aria-label="Elimina">×</button></div></div>`).join("")}
  </section>

  <section class="card">
    <h2>Attività</h2>
    ${d.ex.map((e) => `<div class="row"><div><div>${esc(e.name)}</div><div class="muted small">${r0(e.min)} minuti${e.note ? ", " + esc(e.note) : ""}</div></div><div class="row-r"><span>${r0(e.kcal)}</span><button class="x" data-act="del-ex" data-id="${e.id}" aria-label="Elimina">×</button></div></div>`).join("")}
    <div class="field inline"><label for="steps">Passi del giorno</label><input id="steps" type="number" inputmode="numeric" min="0" step="100" value="${d.steps || ""}" placeholder="0" data-change="steps"></div>
    <div class="btns">
      <button class="btn" data-act="exercise">Aggiungi allenamento</button>
      <button class="btn ghost" data-act="toggle-rest">${d.rest ? "Annulla riposo" : "Giorno di riposo"}</button>
    </div>
  </section>

  <section class="card">
    <h2>Peso e note</h2>
    <div class="field inline"><label for="weight">Peso (kg)</label><input id="weight" type="number" inputmode="decimal" step="0.1" min="30" max="300" value="${d.weight ?? ""}" placeholder="${r1(weightAt(k))}" data-change="weight"></div>
    <div class="field"><label for="note">Note (fame, sonno, stress, ciclo, sgarri)</label><textarea id="note" rows="2" data-change="note">${esc(d.note)}</textarea></div>
    <button class="btn ${d.closed ? "ghost" : "primary"} wide" data-act="close">${d.closed ? "Riapri la giornata" : "Ho inserito tutto: chiudi la giornata"}</button>
  </section>`;
}

function habitHtml(slot, hasItems) {
  const h = (S.habits || {})[slot];
  if (!h || !h.items.length) return "";
  const names = h.items.map((m) => m.name).join(", ");
  return `<div class="habit"><div class="small muted">Abituale: ${esc(names)}</div>
    <div class="slot-actions">${hasItems ? "" : `<button class="btn small-btn primary" data-act="add-habit" data-slot="${slot}">Aggiungi abituale</button>`}
    <button class="link" data-act="toggle-auto" data-slot="${slot}">${h.auto ? "Automatico: attivo" : "Aggiungi ogni giorno in automatico"}</button>
    <button class="link" data-act="del-habit" data-slot="${slot}">Rimuovi</button></div></div>`;
}

function hasYesterday(k, slot) {
  const y = S.days[addDays(k, -1)];
  return y && y.meals.some((m) => m.slot === slot);
}


// ---------- Peso e misure settimanali ----------
const MEAS_FIELDS = [["weight", "Peso (kg)"], ["waist", "Vita ombelico (cm)"], ["low", "Vita bassa (cm)"], ["thigh", "Coscia (cm)"]];
const num1 = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : null; };
const fmtN = (n) => (n === null || n === undefined ? "n.d." : n.toLocaleString("it-IT", { maximumFractionDigits: 1 }));
const sortedMeasures = () => S.measures.slice().sort((a, b) => a.date.localeCompare(b.date));
const lastWith = (f, list = sortedMeasures()) => list.filter((m) => m[f] !== null && m[f] !== undefined);

function measureDue(k) {
  if (k !== todayKey()) return false;
  const done = S.measures.some((m) => m.date > addDays(k, -7) && m.date <= k && (m.waist !== null || m.weight !== null));
  if (done) return false;
  return parseKey(k).getDay() === S.measureDay || S.measures.length === 0 || sortedMeasures().slice(-1)[0].date <= addDays(k, -8);
}

function deltaText(list, f, unit) {
  const l = lastWith(f, list);
  if (l.length < 2) return "primo valore";
  const diff = l[l.length - 1][f] - l[l.length - 2][f];
  if (Math.abs(diff) < 0.05) return "invariato rispetto all'ultima volta";
  return `${diff < 0 ? "meno" : "più"} ${fmtN(Math.abs(diff))} ${unit} rispetto all'ultima volta`;
}

function lineChart(list, f, label) {
  const pts = lastWith(f, list);
  if (pts.length < 2) return `<p class="muted small">${label}: servono almeno due misurazioni per vedere l'andamento.</p>`;
  const W = 320, H = 130, pad = 6;
  const t0 = parseKey(pts[0].date).getTime(), t1 = parseKey(pts[pts.length - 1].date).getTime();
  const vs = pts.map((m) => m[f]);
  const mn = Math.min(...vs) - 0.5, mx = Math.max(...vs) + 0.5;
  const X = (m) => pad + ((parseKey(m.date).getTime() - t0) / Math.max(1, t1 - t0)) * (W - pad * 2);
  const Y = (m) => H - pad - ((m[f] - mn) / (mx - mn)) * (H - pad * 2);
  return `<div class="muted small">${label}</div>
  <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${label}"><polyline points="${pts.map((m) => `${X(m)},${Y(m)}`).join(" ")}" class="wline"/>${pts.map((m) => `<circle cx="${X(m)}" cy="${Y(m)}" r="3.5" class="wdot"><title>${m.date}: ${fmtN(m[f])}</title></circle>`).join("")}</svg>
  <div class="muted small axis"><span>${fmtDate(pts[0].date, { day: "numeric", month: "short" })}: ${fmtN(pts[0][f])}</span><span>${fmtDate(pts[pts.length - 1].date, { day: "numeric", month: "short" })}: ${fmtN(pts[pts.length - 1][f])}</span></div>`;
}

function renderMeasures() {
  const list = sortedMeasures();
  const e = view.mEdit || { date: todayKey(), weight: null, waist: null, low: null, thigh: null, note: "" };
  const inp = (f, l) => `<div class="field"><label for="m-${f}">${l}</label><input id="m-${f}" type="text" inputmode="decimal" value="${e[f] ?? ""}" placeholder="${fmtN(lastWith(f, list).slice(-1)[0]?.[f] ?? null) === "n.d." ? "" : fmtN(lastWith(f, list).slice(-1)[0][f])}"></div>`;
  const wLast = lastWith("waist", list), wFirst = wLast[0], wEnd = wLast[wLast.length - 1];
  const due = measureDue(todayKey());
  const dayName = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"][S.measureDay];
  return `
  <section class="card ${due ? "due" : ""}">
    <h2>${view.mEdit ? "Modifica misurazione" : "Nuova misurazione"} ${due ? '<span class="pill">Da fare oggi</span>' : ""}</h2>
    <p class="muted small">Una volta a settimana, di ${dayName}, al mattino, dopo il bagno e prima di mangiare. Lascia vuoto ciò che non misuri.</p>
    <div class="field"><label for="m-date">Data</label><input id="m-date" type="date" value="${e.date}" max="${todayKey()}"></div>
    <div class="grid2">${inp("weight", "Peso (kg)")}${inp("waist", "Vita ombelico (cm)")}${inp("low", "Vita bassa (cm)")}${inp("thigh", "Coscia (cm)")}</div>
    <div class="field"><label for="m-note">Note (come ti svegli, gonfiore, ciclo)</label><input id="m-note" type="text" value="${esc(e.note || "")}"></div>
    <button class="btn primary wide" data-act="save-measure">${view.mEdit ? "Salva modifiche" : "Salva misurazione"}</button>
    ${view.mEdit ? '<button class="btn ghost wide" data-act="cancel-measure">Annulla</button><button class="btn danger wide" data-act="del-measure">Elimina</button>' : ""}
  </section>
  ${list.length ? `<section class="card">
    <h2>Andamento</h2>
    <div class="stats">
      <div class="stat"><div class="muted small">Vita ombelico</div><div class="stat-v">${fmtN(wEnd?.waist ?? null)}${wEnd ? " cm" : ""}</div><div class="muted small">${deltaText(list, "waist", "cm")}</div></div>
      <div class="stat"><div class="muted small">Dall'inizio</div><div class="stat-v">${wFirst && wEnd && wFirst !== wEnd ? (Math.abs(wEnd.waist - wFirst.waist) < 0.05 ? "invariato" : `${wEnd.waist < wFirst.waist ? "meno " : "più "}${fmtN(Math.abs(wEnd.waist - wFirst.waist))} cm`) : "n.d."}</div><div class="muted small">vita ombelico</div></div>
      <div class="stat"><div class="muted small">Peso</div><div class="stat-v">${fmtN(lastWith("weight", list).slice(-1)[0]?.weight ?? null)}${lastWith("weight", list).length ? " kg" : ""}</div><div class="muted small">${deltaText(list, "weight", "kg")}</div></div>
      <div class="stat"><div class="muted small">Coscia</div><div class="stat-v">${fmtN(lastWith("thigh", list).slice(-1)[0]?.thigh ?? null)}${lastWith("thigh", list).length ? " cm" : ""}</div><div class="muted small">${deltaText(list, "thigh", "cm")}</div></div>
    </div>
    <p class="small">Per la pancia contano più la vita all'ombelico e come ti svegli la mattina del peso: il peso può restare uguale mentre la pancia scende.</p>
    ${lineChart(list, "waist", "Vita ombelico, misura principale")}
    ${lineChart(list, "low", "Vita bassa")}
    ${lineChart(list, "weight", "Peso")}
    ${lineChart(list, "thigh", "Coscia")}
  </section>
  <section class="card">
    <h2>Storico</h2>
    <div class="table mtable">
      <div class="tr th"><span>Data</span><span>Peso</span><span>Ombel.</span><span>Bassa</span><span>Coscia</span></div>
      ${list.slice().reverse().map((m) => `<button class="tr" data-act="edit-measure" data-id="${m.id}"><span>${esc(fmtDate(m.date, { day: "numeric", month: "short", year: "2-digit" }))}</span><span>${fmtN(m.weight)}</span><span>${fmtN(m.waist)}</span><span>${fmtN(m.low)}</span><span>${fmtN(m.thigh)}</span></button>`).join("")}
    </div>
    <p class="muted small">Tocca una riga per modificarla o eliminarla.</p>
  </section>` : `<section class="card"><h2>Storico</h2><p class="muted small">Nessuna misurazione. Se hai già dei valori in un'altra app, puoi caricarli adesso.</p><button class="btn wide" data-act="seed-measures">Carica le mie misure precedenti</button></section>`}
  <section class="card">
    <h2>Come misurare</h2>
    <details class="workout"><summary><b>Peso</b></summary><ul><li>Bilancia su pavimento duro, sempre la stessa</li><li>Senza vestiti</li><li>Una volta a settimana, stesso giorno</li></ul></details>
    <details class="workout"><summary><b>Vita ombelico, misura principale</b></summary><ul><li>Metro esattamente sull'ombelico</li><li>Orizzontale intorno al corpo</li><li>Respirazione normale, non contrarre l'addome</li></ul></details>
    <details class="workout"><summary><b>Vita bassa</b></summary><ul><li>2 o 3 cm sotto l'ombelico</li><li>Metro orizzontale, corpo rilassato</li></ul></details>
    <details class="workout"><summary><b>Coscia</b></summary><ul><li>Metà coscia, circa 15 cm sotto l'inguine</li><li>Peso distribuito su entrambe le gambe</li><li>Muscolo rilassato</li></ul></details>
  </section>`;
}

// ---------- Report ----------
function renderReport() {
  const st = periodStats(todayKey(), view.period);
  const W = 320, H = 140, pad = 4;
  const maxK = Math.max(...st.rows.map((r) => Math.max(r.t.kcal, r.tg.kcal)), 1) * 1.1;
  const bw = (W - pad * 2) / st.rows.length;
  const bars = st.rows.map((r, i) => {
    const h = (r.t.kcal / maxK) * H;
    const cls = !r.tracked ? "nt" : r.t.kcal > r.tg.kcal + 150 ? "hi" : "okb";
    return `<rect class="${cls}" x="${pad + i * bw + bw * 0.15}" y="${H - h}" width="${bw * 0.7}" height="${h}" rx="2"><title>${fmtDate(r.k, { day: "numeric", month: "short" })}: ${r0(r.t.kcal)} kcal</title></rect>`;
  }).join("");
  const ty = H - (st.rows[st.rows.length - 1].tg.kcal / maxK) * H;
  const kcalChart = `<svg viewBox="0 0 ${W} ${H + 2}" class="chart" role="img" aria-label="Calorie giornaliere">${bars}<line x1="0" x2="${W}" y1="${ty}" y2="${ty}" class="target"/></svg>`;

  let weightChart = `<p class="muted small">Registra il peso almeno due volte per vedere l'andamento.</p>`;
  if (st.weights.length >= 2) {
    const ws = st.weights.map((x) => x.w);
    const mn = Math.min(...ws) - 0.5, mx = Math.max(...ws) + 0.5;
    const idx = (k) => st.keys.indexOf(k);
    const pts = st.weights.map((x) => `${pad + idx(x.k) * bw + bw / 2},${H - ((x.w - mn) / (mx - mn)) * H}`).join(" ");
    weightChart = `<svg viewBox="0 0 ${W} ${H + 2}" class="chart" role="img" aria-label="Andamento peso"><polyline points="${pts}" class="wline"/>${st.weights.map((x) => `<circle cx="${pad + idx(x.k) * bw + bw / 2}" cy="${H - ((x.w - mn) / (mx - mn)) * H}" r="3" class="wdot"><title>${x.w} kg</title></circle>`).join("")}</svg>
    <div class="muted small axis"><span>${r1(mx)} kg</span><span>${r1(mn)} kg</span></div>`;
  }

  const stat = (label, val, sub = "") => `<div class="stat"><div class="muted small">${label}</div><div class="stat-v">${val}</div>${sub ? `<div class="muted small">${sub}</div>` : ""}</div>`;
  return `
  <div class="seg">${[7, 14, 30].map((n) => `<button data-act="period" data-n="${n}" class="${view.period === n ? "active" : ""}">${n} giorni</button>`).join("")}</div>
  <section class="card">
    <h2>Riepilogo ultimi ${view.period} giorni</h2>
    <div class="stats">
      ${stat("Giorni registrati", `${st.tracked} su ${st.n}`, st.tracked < st.n * 0.7 ? "Precisione bassa" : "Buona precisione")}
      ${stat("Media kcal", r0(st.kcal), `obiettivo ${r0(st.target)}`)}
      ${stat("Bilancio medio", `${st.balance > 0 ? "più " : "meno "}${r0(Math.abs(st.balance))}`, "kcal al giorno")}
      ${stat("Grasso perso stimato", `${r1(Math.max(0, st.estLossKg))} kg`, "dai dati registrati")}
      ${stat("Peso reale", st.weightDelta === null ? "n.d." : `${st.weightDelta > 0 ? "più " : st.weightDelta < 0 ? "meno " : ""}${r1(Math.abs(st.weightDelta))} kg`, "prima e ultima pesata")}
      ${stat("Proteine medie", `${r0(st.p)} g`, `obiettivo ${r0(st.pTarget)} g`)}
      ${stat("Acqua media", `${r1(st.water / 1000)} L`, `${st.waterDays} giorni a obiettivo`)}
      ${stat("Movimento", `${r0(st.exMin)} min`, `${st.strength} sedute di forza`)}
      ${stat("Calorie da alcol", r0(st.alc), "nel periodo")}
      ${stat("Giorni in linea", `${st.onTargetDays} su ${st.tracked}`, "entro obiettivo")}
    </div>
  </section>
  <section class="card"><h2>Calorie giornaliere</h2>${kcalChart}<div class="legend small"><span class="lg okb"></span>in linea <span class="lg hi"></span>sopra obiettivo <span class="lg nt"></span>non completo <span class="lg tl"></span>obiettivo</div></section>
  <section class="card"><h2>Peso</h2>${weightChart}</section>
  <section class="card">
    <h2>Dettaglio giorni</h2>
    <div class="table">
      <div class="tr th"><span>Giorno</span><span>kcal</span><span>Prot</span><span>Acqua</span><span>Mov</span></div>
      ${st.rows.slice().reverse().map((r) => `<button class="tr" data-act="goto" data-k="${r.k}"><span>${esc(fmtDate(r.k, { weekday: "short", day: "numeric" }))}${r.tracked ? "" : " *"}</span><span class="${r.t.kcal > r.tg.kcal + 150 ? "bad" : ""}">${r0(r.t.kcal)}</span><span>${r0(r.t.p)}</span><span>${r1(r.t.water / 1000)}</span><span>${r0(r.t.exMin)}</span></button>`).join("")}
    </div>
    <p class="muted small">L'asterisco indica giorni non completi. Tocca un giorno per aprirlo.</p>
  </section>
  <section class="card">
    <h2>Condividi con il tuo coach</h2>
    <p class="muted small">Copia il report e incollalo in una conversazione con Claude per un'analisi approfondita.</p>
    <div class="btns"><button class="btn primary" data-act="copy-report">Copia report testuale</button></div>
  </section>`;
}

function reportText(n) {
  const st = periodStats(todayKey(), n);
  const p = S.profile;
  const tg = targets(todayKey());
  const L = [];
  L.push(`REPORT DIETA E ALLENAMENTO, ultimi ${n} giorni (fino al ${fmtDate(todayKey(), { day: "numeric", month: "long", year: "numeric" })})`);
  L.push(`Profilo: ${p.sex === "m" ? "uomo" : "donna"}, ${p.age} anni, ${p.height} cm, peso attuale ${r1(tg.w)} kg, obiettivo ${p.goalWeight} kg, ritmo ${p.rate} kg a settimana.`);
  L.push(`Metabolismo basale ${r0(tg.bmr)} kcal, consumo base ${r0(tg.tdee)} kcal, obiettivo ${tg.kcal} kcal, proteine ${tg.protein} g, carboidrati ${tg.carbs} g, grassi ${tg.fat} g, acqua ${tg.water} ml.`);
  L.push(`Giorni registrati: ${st.tracked} su ${n}. Media kcal ${r0(st.kcal)}, proteine ${r0(st.p)} g, carboidrati ${r0(st.c)} g, grassi ${r0(st.f)} g, acqua ${r1(st.water / 1000)} L.`);
  L.push(`Bilancio medio ${r0(st.balance)} kcal al giorno, grasso perso stimato ${r1(st.estLossKg)} kg, variazione peso reale ${st.weightDelta === null ? "non disponibile" : r1(st.weightDelta) + " kg"}.`);
  L.push(`Movimento ${r0(st.exMin)} minuti totali, ${st.strength} sedute di forza. Calorie da alcol ${r0(st.alc)}.`);
  const wanted = prunedWanted();
  if (wanted.length) L.push(`ALIMENTI DA AGGIUNGERE ALLA LISTA: ${wanted.map((w) => w.name).join(", ")}`);
  const ms = sortedMeasures().slice(-4);
  if (ms.length) L.push(`MISURE recenti (peso, vita ombelico, vita bassa, coscia): ${ms.map((m) => `${m.date} ${fmtN(m.weight)} kg, ${fmtN(m.waist)}, ${fmtN(m.low)}, ${fmtN(m.thigh)}`).join(" | ")}`);
  L.push("");
  st.rows.forEach((r) => {
    L.push(`${fmtDate(r.k, { weekday: "short", day: "numeric", month: "short" })}${r.tracked ? "" : " (incompleto)"}: ${r0(r.t.kcal)} kcal, P ${r0(r.t.p)} C ${r0(r.t.c)} G ${r0(r.t.f)}, acqua ${r0(r.t.water)} ml, passi ${r.t.steps}, peso ${r.d.weight ?? "n.d."}`);
    SLOTS.forEach((s) => {
      const items = r.d.meals.filter((m) => m.slot === s.id);
      if (items.length) L.push(`  ${s.label}: ${items.map((m) => `${m.name}${m.g ? " " + r0(m.g) + "g" : ""} (${r0(m.kcal)})`).join(", ")}`);
    });
    if (r.d.drinks.length) L.push(`  Bevande: ${r.d.drinks.map((x) => `${x.name} ${r0(x.ml)}ml (${r0(x.kcal)})`).join(", ")}`);
    if (r.d.ex.length) L.push(`  Attività: ${r.d.ex.map((e) => `${e.name} ${r0(e.min)} min (${r0(e.kcal)} kcal)${e.note ? " " + e.note : ""}`).join(", ")}`);
    if (r.d.rest) L.push("  Giorno di riposo");
    if (r.d.note) L.push(`  Note: ${r.d.note}`);
  });
  return L.join("\n");
}

// ---------- Coach ----------
function coachAdvice() {
  const st = periodStats(addDays(todayKey(), isTracked(todayKey()) && day(todayKey()).closed ? 0 : -1), 7);
  const st14 = periodStats(todayKey(), 14);
  const p = S.profile;
  const tg = targets(todayKey());
  const out = [];
  const add = (lvl, title, text) => out.push({ lvl, title, text });

  if (st.tracked < 5) add("warn", "Registra con costanza", `Negli ultimi 7 giorni hai registrato ${st.tracked} giornate complete. Senza almeno 5 giorni su 7 i numeri non sono affidabili. Pesa gli alimenti, conta l'olio e chiudi la giornata ogni sera.`);
  if (st.tracked >= 3) {
    if (st.kcal > st.target + 150) add("bad", "Sei sopra l'obiettivo", `Media ${r0(st.kcal)} kcal contro un obiettivo di ${r0(st.target)}. Sono circa ${r0(st.kcal - st.target)} kcal in più al giorno. Controlla condimenti, snack fuori pasto e bevande.`);
    else if (st.kcal < st.bmr * 0.95) add("warn", "Stai mangiando troppo poco", `Media ${r0(st.kcal)} kcal, sotto il tuo metabolismo basale (${r0(st.bmr)}). Rischi di perdere muscolo, avere più fame e rallentare. Meglio un deficit moderato e sostenibile.`);
    else add("good", "Calorie in linea", `Media ${r0(st.kcal)} kcal con obiettivo ${r0(st.target)}. Continua così.`);

    if (st.p < st.pTarget * 0.85) add("bad", "Proteine basse", `Media ${r0(st.p)} g contro ${r0(st.pTarget)} g. Le proteine proteggono il muscolo e saziano. Aggiungi una fonte a ogni pasto: yogurt greco o skyr a colazione, carne bianca, pesce, uova, legumi o fiocchi di latte a pranzo e cena.`);
    else add("good", "Proteine a posto", `Media ${r0(st.p)} g al giorno.`);

    if (st.water < st.waterTarget * 0.8) add("warn", "Bevi di più", `Media ${r1(st.water / 1000)} litri contro ${r1(st.waterTarget / 1000)}. Tieni una bottiglia sempre vicina e bevi un bicchiere prima di ogni pasto.`);
    if (st.weekendKcal && st.weekdayKcal && st.weekendKcal - st.weekdayKcal > 400) add("warn", "Il weekend annulla la settimana", `Nel weekend mangi in media ${r0(st.weekendKcal - st.weekdayKcal)} kcal in più rispetto ai giorni feriali. Pianifica in anticipo uscite e pasti fuori.`);
  }
  if (st.alc > 700) add("warn", "Alcol", `Negli ultimi 7 giorni hai bevuto ${r0(st.alc)} kcal di alcolici. L'alcol blocca l'uso dei grassi come energia e aumenta la fame. Limitalo a una o due occasioni a settimana.`);
  if (st.exMin < 150) add("warn", "Muoviti di più", `${r0(st.exMin)} minuti di attività negli ultimi 7 giorni. L'obiettivo minimo è 150 minuti a settimana, più 7000 o 10000 passi al giorno.`);
  else add("good", "Movimento", `${r0(st.exMin)} minuti negli ultimi 7 giorni.`);
  if (st.strength < 2) add("warn", "Allenamento di forza", `Solo ${st.strength} sedute di forza. Per dimagrire mantenendo il muscolo servono almeno 2 o 3 sedute con i pesi a settimana. Trovi il piano qui sotto.`);

  if (st14.weights.length >= 4 && st14.tracked >= 9) {
    const exp = st14.estLossKg;
    const real = -(st14.weightDelta || 0);
    if (exp > 0.6 && real < 0.2) add("warn", "Il peso non scende come previsto", `Secondo i dati dovresti aver perso circa ${r1(exp)} kg in 14 giorni, ma la bilancia dice ${r1(real)} kg. Le cause più comuni sono porzioni sottostimate, olio non contato, assaggi e bevande dimenticate. Per una settimana pesa tutto con la bilancia da cucina.`);
  }
  return { out, st, tg };
}

function projection() {
  const st = periodStats(todayKey(), 14);
  const p = S.profile;
  const w = weightAt(todayKey());
  const toLose = w - p.goalWeight;
  if (toLose <= 0) return "Hai raggiunto il peso obiettivo. Imposta il ritmo su mantenimento nel profilo.";
  const kgWeek = st.tracked >= 5 ? (-st.balance * 7) / 7700 : p.rate;
  if (kgWeek <= 0.05) return `Ti mancano ${r1(toLose)} kg. Con il bilancio attuale non stai perdendo peso: serve un deficit reale.`;
  const weeks = toLose / kgWeek;
  const end = new Date(); end.setDate(end.getDate() + Math.round(weeks * 7));
  return `Ti mancano ${r1(toLose)} kg. Al ritmo ${st.tracked >= 5 ? "registrato" : "impostato"} di ${kgWeek < 1 ? r0(kgWeek * 1000) + " grammi" : r1(kgWeek) + " kg"} a settimana arrivi all'obiettivo verso ${end.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}.`;
}

const WORKOUTS = {
  "Full body A": ["Squat o leg press", "Panca piana o piegamenti", "Rematore con manubrio", "Affondi alternati", "Plank 30 a 45 secondi"],
  "Full body B": ["Stacco rumeno", "Lento avanti con manubri", "Lat machine o trazioni assistite", "Hip thrust", "Crunch o dead bug"],
  "Parte alta": ["Panca piana", "Rematore", "Lento avanti", "Lat machine", "Curl bicipiti", "Push down tricipiti"],
  "Parte bassa": ["Squat", "Stacco rumeno", "Affondi", "Leg curl", "Polpacci in piedi", "Plank"],
  "Cardio zona 2": ["35 a 45 minuti a ritmo in cui riesci ancora a parlare: camminata in salita, bici, ellittica"],
  "Intervalli": ["Riscaldamento 5 minuti", "8 a 10 ripetizioni da 30 secondi forte e 90 secondi piano", "Defaticamento 5 minuti"],
};
const PLANS = {
  2: ["Full body A", "Full body B"],
  3: ["Full body A", "Cardio zona 2", "Full body B"],
  4: ["Parte alta", "Parte bassa", "Cardio zona 2", "Full body A"],
  5: ["Parte alta", "Parte bassa", "Cardio zona 2", "Parte alta", "Parte bassa"],
  6: ["Parte alta", "Parte bassa", "Cardio zona 2", "Parte alta", "Parte bassa", "Intervalli"],
};

function renderCoach() {
  const { out, tg } = coachAdvice();
  const k = todayKey();
  const t = totals(k);
  const p = S.profile;
  const sets = p.level === "intermedio" ? "4 serie da 8 a 10 ripetizioni" : "3 serie da 10 a 12 ripetizioni";
  const plan = PLANS[p.trainDays] || PLANS[3];
  return `
  <section class="card">
    <h2>Oggi ti restano</h2>
    <div class="stats three">
      <div class="stat"><div class="muted small">Calorie</div><div class="stat-v ${tg.kcal - t.kcal < 0 ? "bad" : ""}">${r0(tg.kcal - t.kcal)}</div></div>
      <div class="stat"><div class="muted small">Proteine</div><div class="stat-v">${r0(Math.max(0, tg.protein - t.p))} g</div></div>
      <div class="stat"><div class="muted small">Acqua</div><div class="stat-v">${r1(Math.max(0, t.waterTarget - t.water) / 1000)} L</div></div>
    </div>
    <p class="small">${esc(projection())}</p>
  </section>
  <section class="card">
    <h2>Analisi degli ultimi 7 giorni</h2>
    ${out.map((a) => `<div class="advice ${a.lvl}"><b>${esc(a.title)}</b><p>${esc(a.text)}</p></div>`).join("")}
  </section>
  <section class="card">
    <h2>Il tuo piano settimanale</h2>
    <p class="muted small">${p.trainDays} allenamenti a settimana, livello ${esc(p.level)}. Esercizi di forza: ${sets}, recupero 60 a 90 secondi. Ogni giorno punta ad almeno 8000 passi. Aumenta il carico quando completi tutte le ripetizioni con facilità.</p>
    ${plan.map((w, i) => `<details class="workout"><summary><b>Giorno ${i + 1}</b> ${esc(w)}</summary><ul>${WORKOUTS[w].map((x) => `<li>${esc(x)}</li>`).join("")}</ul><button class="btn small-btn" data-act="log-workout" data-w="${esc(w)}">Registra come fatto oggi</button></details>`).join("")}
  </section>
  <section class="card">
    <h2>Regole d'oro</h2>
    <ul class="rules">
      <li>Pesa gli alimenti da crudi e conta sempre l'olio: un cucchiaio vale circa 90 kcal.</li>
      <li>Non mangiare le calorie dell'allenamento: il deficit lo crea la dieta, l'allenamento protegge il muscolo.</li>
      <li>Pesati ogni mattina a digiuno e guarda la media della settimana, non il singolo giorno.</li>
      <li>Dormi almeno 7 ore: dormire poco aumenta la fame del giorno dopo.</li>
      <li>Metà piatto di verdura a pranzo e cena.</li>
    </ul>
    <p class="muted small">Le indicazioni sono stime generali e non sostituiscono il parere di un medico o di un nutrizionista, soprattutto in presenza di patologie.</p>
  </section>`;
}

// ---------- Profilo ----------
function renderProfile(first) {
  const p = S.profile || { sex: "m", age: 35, height: 175, weight: 85, goalWeight: 75, rate: 0.5, activity: 1.2, trainDays: 3, level: "principiante" };
  const opt = (v, cur, label) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${label}</option>`;
  const tg = S.profile ? targets(todayKey()) : null;
  return `
  ${first ? `<section class="card intro"><h2>Benvenuto</h2><p>Inserisci i tuoi dati: calcolo calorie, proteine e acqua per il tuo obiettivo. I dati restano solo su questo dispositivo.</p></section>` : ""}
  <form class="card" id="profile-form">
    <h2>I tuoi dati</h2>
    <div class="grid2">
      <div class="field"><label>Sesso</label><select name="sex">${opt("m", p.sex, "Uomo")}${opt("f", p.sex, "Donna")}</select></div>
      <div class="field"><label>Età</label><input name="age" type="number" inputmode="numeric" min="14" max="99" required value="${p.age}"></div>
      <div class="field"><label>Altezza (cm)</label><input name="height" type="number" inputmode="numeric" min="120" max="230" required value="${p.height}"></div>
      <div class="field"><label>Peso iniziale (kg)</label><input name="weight" type="number" inputmode="decimal" step="0.1" min="30" max="300" required value="${p.weight}"></div>
      <div class="field"><label>Peso obiettivo (kg)</label><input name="goalWeight" type="number" inputmode="decimal" step="0.1" min="30" max="300" required value="${p.goalWeight}"></div>
      <div class="field"><label>Ritmo</label><select name="rate">${opt(0, p.rate, "Mantenimento")}${opt(0.25, p.rate, "Lento, 250 g a settimana")}${opt(0.5, p.rate, "Consigliato, 500 g a settimana")}${opt(0.75, p.rate, "Veloce, 750 g a settimana")}</select></div>
    </div>
    <div class="field"><label>Attività quotidiana, allenamenti esclusi</label><select name="activity">${opt(1.2, p.activity, "Sedentaria, lavoro alla scrivania")}${opt(1.375, p.activity, "Leggera, spesso in piedi")}${opt(1.55, p.activity, "Moderata, lavoro in movimento")}${opt(1.725, p.activity, "Alta, lavoro fisico")}</select></div>
    <div class="grid2">
      <div class="field"><label>Allenamenti a settimana</label><select name="trainDays">${[2, 3, 4, 5, 6].map((n) => opt(n, p.trainDays, n)).join("")}</select></div>
      <div class="field"><label>Livello</label><select name="level">${opt("principiante", p.level, "Principiante")}${opt("intermedio", p.level, "Intermedio")}</select></div>
    </div>
    <button class="btn primary wide" type="submit">${first ? "Inizia" : "Salva"}</button>
  </form>
  ${tg ? `<section class="card"><h2>I tuoi obiettivi giornalieri</h2>
    <div class="stats">
      <div class="stat"><div class="muted small">Calorie</div><div class="stat-v">${tg.kcal}</div></div>
      <div class="stat"><div class="muted small">Proteine</div><div class="stat-v">${tg.protein} g</div></div>
      <div class="stat"><div class="muted small">Carboidrati</div><div class="stat-v">${tg.carbs} g</div></div>
      <div class="stat"><div class="muted small">Grassi</div><div class="stat-v">${tg.fat} g</div></div>
      <div class="stat"><div class="muted small">Acqua</div><div class="stat-v">${r1(tg.water / 1000)} L</div></div>
      <div class="stat"><div class="muted small">Metabolismo basale</div><div class="stat-v">${r0(tg.bmr)}</div></div>
    </div>
    <p class="muted small">Calcolo Mifflin St Jeor. Gli obiettivi si aggiornano in automatico quando registri un nuovo peso.</p></section>
  <section class="card">
    <h2>Promemoria giornalieri</h2>
    <p class="muted small">Scarica il file e aprilo: il calendario del telefono ti avviserà ogni giorno agli orari scelti, con il link diretto all'app.</p>
    <div class="grid2">
      ${Object.entries({ misure: "Peso e misure (settimanale)", colazione: "Colazione", pranzo: "Pranzo", acqua: "Controllo acqua", cena: "Cena", chiusura: "Chiusura giornata" }).map(([k, l]) => `<div class="field"><label>${l}</label><input type="time" value="${esc(S.reminders[k] || "")}" data-change="rem" data-k="${k}"></div>`).join("")}
    </div>
    <div class="field"><label>Pasti da registrare ogni giorno (compaiono nella lista da inserire)</label>
      <div class="chips">${SLOTS.map((sl) => `<label class="chip tick"><input type="checkbox" data-change="reqslot" data-id="${sl.id}" ${isReq(sl) ? "checked" : ""}> ${sl.label}</label>`).join("")}</div></div>
    <div class="field"><label>Giorno di peso e misure</label><select data-change="mday">${["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"].map((n, i) => `<option value="${i}" ${S.measureDay === i ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <button class="btn wide" data-act="ics">Scarica promemoria per il calendario</button>
  </section>
  <section class="card">
    <h2>Alimenti da aggiungere</h2>
    ${prunedWanted().length ? `<p class="muted small">Cercati e non trovati. Arrivano con il report settimanale e li aggiungo alla lista.</p><div class="chips">${S.wanted.map((w, i) => `<span class="chip">${esc(w.name)} <button class="x mini" data-act="del-wanted" data-i="${i}" aria-label="Rimuovi">×</button></span>`).join("")}</div>` : `<p class="muted small">Nessun alimento in attesa. Quando cerchi qualcosa che non trovo, comparirà qui.</p>`}
    <button class="btn wide" data-act="import-dialog">Incolla una lista di alimenti</button>
  </section>
  <section class="card">
    <h2>Dati e backup</h2>
    <p class="muted small">I dati sono salvati solo in questo browser. Fai un backup ogni tanto.</p>
    <div class="btns">
      <button class="btn" data-act="export">Esporta backup</button>
      <label class="btn ghost">Importa backup<input type="file" accept="application/json" id="import" hidden></label>
      <button class="btn danger" data-act="reset">Cancella tutto</button>
    </div>
  </section>` : ""}`;
}

// ---------- Finestre di inserimento ----------
const dlg = () => $("#dlg");
function openDialog(html) {
  const d = dlg();
  $("#dlg-body").innerHTML = html;
  if (!d.open) d.showModal();
  const f = d.querySelector("[autofocus]");
  if (f) setTimeout(() => f.focus(), 50);
}
function closeDialog() { if (dlg().open) dlg().close(); }
document.addEventListener("close", (e) => { if (e.target.id === "dlg") stopScan(); }, true);

function recentFoods() {
  const seen = new Map();
  Object.keys(S.days).sort().reverse().slice(0, 30).forEach((k) => S.days[k].meals.forEach((m) => { if (m.ref && !seen.has(m.name)) seen.set(m.name, m.ref); }));
  return [...seen.values()].slice(0, 12);
}
function allFoods() { return [...S.customFoods.map((f) => ({ ...f, cat: "I miei alimenti" })), ...FOODS]; }

function foodDialog(slot) {
  const slotSel = SLOTS.map((s) => `<option value="${s.id}" ${s.id === slot ? "selected" : ""}>${s.label}</option>`).join("");
  openDialog(`
    <h3>Aggiungi alimento</h3>
    <div class="field"><label>Pasto</label><select id="f-slot">${slotSel}</select></div>
    <input id="f-search" type="search" placeholder="Cerca: pasta, pollo, mela" autocomplete="off" autofocus>
    <div id="f-list" class="list"></div>
    <div class="btns"><button class="btn" data-act="scan-barcode">Scansiona codice a barre</button><button class="btn ghost" data-act="custom-food">Alimento non in lista</button><button class="btn ghost" data-act="import-dialog">Incolla una lista</button><button class="btn ghost" data-act="quick-kcal">Solo calorie</button></div>`);
  renderFoodList("");
}
const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\bcroissant\b/g, "cornetto").replace(/\bbrioche\b/g, "cornetto");
const foodItem = (f) => `<button class="item" data-act="pick-food" data-food="${esc(JSON.stringify(f))}"><span>${esc(f.name)}</span><span class="muted small">${r0(f.kcal)} kcal per 100 g</span></button>`;

// Alimenti cercati e non trovati: finiscono nel report, così posso aggiungerli alla lista con valori da fonti affidabili.
function prunedWanted() {
  S.wanted = S.wanted.filter((w) => { const t = norm(w.name).split(/\s+/).filter((x) => x.length > 1); return !allFoods().some((f) => t.every((x) => norm(f.name).includes(x))); });
  return S.wanted;
}
let wantedTimer = null;
function trackMissing(q) {
  clearTimeout(wantedTimer);
  wantedTimer = setTimeout(() => {
    const box = $("#f-search");
    if (!box || box.value.trim() !== q || !dlg().open) return;
    const key = norm(q).trim();
    if (key.length < 3 || S.wanted.some((w) => norm(w.name).trim() === key)) return;
    S.wanted.push({ name: q, date: todayKey() });
    save();
  }, 1500);
}

function renderFoodList(q) {
  const ql = q.trim();
  const recents = ql ? [] : recentFoods();
  const tokens = norm(ql).split(/\s+/).filter((t) => t.length > 1 && !["al", "alla", "di", "con", "e", "il", "la"].includes(t));
  const list = ql ? allFoods().filter((f) => { const n = norm(f.name); return tokens.every((t) => n.includes(t)); }).slice(0, 40) : [];
  if (!ql) {
    $("#f-list").innerHTML = (recents.length ? `<div class="muted small">Usati di recente</div>${recents.map(foodItem).join("")}` : "") +
      `<div class="muted small">Categorie</div><div class="chips">${[...new Set(allFoods().map((f) => f.cat))].map((c) => `<button class="chip" data-act="food-cat" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    return;
  }
  $("#f-list").innerHTML = list.length ? list.map(foodItem).join("") : `<p class="muted small">Nessun risultato. L'ho segnato nella lista degli alimenti da aggiungere. Intanto usa il codice a barre, "Alimento non in lista" o "Solo calorie".</p>`;
  if (!list.length && ql.length >= 3) trackMissing(ql);
}

// ---------- Importazione di una lista di alimenti ----------
// Una riga per alimento: Nome; kcal; proteine; carboidrati; grassi; porzione (grammi, facoltativa). Valori per 100 g.
function parseFoodList(text) {
  const foods = [], errors = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#") || /^nome\b/i.test(line)) return;
    const parts = line.split(/\t|;|\|/).map((x) => x.trim());
    const [name, kcal, p, c, f, portion] = [parts[0], num1(parts[1]), num1(parts[2]), num1(parts[3]), num1(parts[4]), num1(parts[5])];
    const bad = !name || [kcal, p, c, f].some((v) => v === null || v < 0) || kcal > 950 || p + c + f > 105;
    if (parts.length < 5 || bad) return errors.push(`riga ${i + 1}: ${line.slice(0, 40)}`);
    foods.push({ name, kcal: Math.round(kcal), p, c, f, portion: portion > 0 ? Math.round(portion) : 100, cat: "I miei alimenti" });
  });
  return { foods, errors };
}
function importDialog() {
  openDialog(`
    <h3>Incolla una lista di alimenti</h3>
    <p class="muted small">Una riga per alimento, valori per 100 g, separati da punto e virgola: nome; kcal; proteine; carboidrati; grassi; porzione in grammi. Esempio:</p>
    <pre class="ex">Croissant al pistacchio bar; 413; 6,2; 45,3; 22,3; 80
Mozzarella di bufala; 288; 16,7; 0,4; 24,4; 125</pre>
    <div class="field"><textarea id="imp-text" rows="8" placeholder="Incolla qui la lista" autofocus></textarea></div>
    <button class="btn primary wide" data-act="import-list">Aggiungi alla lista</button>`);
}

// ---------- Codice a barre ----------
// Il codice identifica la confezione esatta; i valori arrivano da Open Food Facts, vanno confrontati con l'etichetta la prima volta.
let scanner = null;
let zxingPromise = null;
function loadZxing() {
  if (window.ZXing) return Promise.resolve();
  if (!zxingPromise) zxingPromise = new Promise((ok, ko) => {
    const el = document.createElement("script");
    el.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
    el.onload = ok; el.onerror = () => { zxingPromise = null; ko(new Error("zxing")); };
    document.head.appendChild(el);
  });
  return zxingPromise;
}
function stopScan() { if (scanner) { try { scanner.reset(); } catch {} scanner = null; } }

function barcodeDialog() {
  openDialog(`
    <h3>Scansiona il codice a barre</h3>
    <video id="bc-video" playsinline muted></video>
    <p class="muted small" id="bc-status">Inquadra il codice a barre sulla confezione.</p>
    <div class="field"><label for="bc-manual">Oppure scrivi le cifre sotto le barre</label><input id="bc-manual" type="text" inputmode="numeric" placeholder="8000000000000"></div>
    <button class="btn primary wide" data-act="bc-lookup">Cerca codice</button>`);
  startScan();
}
async function startScan() {
  const status = (t) => { const el = $("#bc-status"); if (el) el.textContent = t; };
  try {
    await loadZxing();
    if (!dlg().open || !$("#bc-video")) return;
    const hints = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]]]);
    scanner = new ZXing.BrowserMultiFormatReader(hints, 300);
    await scanner.decodeFromVideoDevice(null, "bc-video", (res) => {
      if (res) { const code = res.getText(); stopScan(); lookupBarcode(code); }
    });
  } catch {
    status("Fotocamera non disponibile. Scrivi il codice a mano qui sotto.");
  }
}

function offProduct(p, code) {
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"] ?? (n.energy_100g != null ? n.energy_100g / 4.184 : null);
  if (!p.product_name || kcal == null || !Number.isFinite(+kcal)) return null;
  const brand = p.brands ? ` (${p.brands.split(",")[0].trim()})` : "";
  const missing = ["proteins_100g", "carbohydrates_100g", "fat_100g"].some((k) => n[k] == null);
  return { name: p.product_name + brand, kcal: Math.round(kcal), p: r1(+n.proteins_100g || 0), c: r1(+n.carbohydrates_100g || 0), f: r1(+n.fat_100g || 0), portion: Math.round(+p.serving_quantity) || 100, cat: "I miei alimenti", barcode: code, missing };
}

async function lookupBarcode(raw) {
  const code = String(raw).replace(/\D/g, "");
  if (code.length < 8) return toast("Codice non valido");
  const slot = dlg().dataset.slot;
  const known = S.customFoods.find((f) => f.barcode === code);
  if (known) return qtyDialog(known, slot);
  openDialog(`<h3>Ricerca del prodotto</h3><p class="muted small">Codice ${esc(code)}...</p>`);
  dlg().dataset.slot = slot;
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,brands,nutriments,serving_quantity`);
    const j = r.ok ? await r.json() : null;
    const f = j && j.status === 1 ? offProduct(j.product, code) : null;
    if (!f) {
      openDialog(`<h3>Prodotto non trovato</h3><p class="muted small">Il codice ${esc(code)} non ha valori nutrizionali nel database. Inserisci i valori dall'etichetta.</p><button class="btn primary wide" data-act="custom-food">Inserisci dall'etichetta</button>`);
      dlg().dataset.slot = slot;
      return;
    }
    openDialog(`<h3>${esc(f.name)}</h3>
      <p class="small">Per 100 g: <b>${f.kcal} kcal</b>, proteine ${f.p} g, carboidrati ${f.c} g, grassi ${f.f} g</p>
      <p class="muted small">${f.missing ? "Alcuni valori mancano nel database. " : ""}Confronta questi numeri con la tabella sulla confezione prima di confermare: se coincidono, il prodotto resta salvato e non dovrai rifarlo.</p>
      <button class="btn primary wide" data-act="bc-confirm">I valori coincidono, usa questo prodotto</button>
      <button class="btn ghost wide" data-act="custom-food">Non coincidono, inserisco io</button>`);
    dlg().dataset.slot = slot;
    dlg().dataset.pending = JSON.stringify(f);
  } catch {
    openDialog(`<h3>Ricerca non riuscita</h3><p class="muted small">Controlla la connessione, oppure inserisci i valori dall'etichetta.</p><button class="btn primary wide" data-act="custom-food">Inserisci dall'etichetta</button>`);
    dlg().dataset.slot = slot;
  }
}

function foodCat(c) {
  $("#f-list").innerHTML = allFoods().filter((f) => f.cat === c).map((f) => `<button class="item" data-act="pick-food" data-food="${esc(JSON.stringify(f))}"><span>${esc(f.name)}</span><span class="muted small">${r0(f.kcal)} kcal per 100 g</span></button>`).join("");
}
function qtyDialog(f, slot) {
  openDialog(`
    <h3>${esc(f.name)}</h3>
    <p class="muted small">Per 100 g: ${r0(f.kcal)} kcal, proteine ${f.p} g, carboidrati ${f.c} g, grassi ${f.f} g</p>
    <div class="field"><label>Quantità in grammi</label><input id="q-g" type="number" inputmode="decimal" min="1" step="1" value="${f.portion || 100}" autofocus></div>
    <div class="chips">${[0.5, 1, 1.5, 2].map((x) => `<button class="chip" data-act="qty" data-g="${Math.round((f.portion || 100) * x)}">${Math.round((f.portion || 100) * x)} g</button>`).join("")}</div>
    <div id="q-prev" class="preview"></div>
    <button class="btn primary wide" data-act="save-food">Aggiungi</button>`);
  dlg().dataset.food = JSON.stringify(f);
  dlg().dataset.slot = slot;
  updateQtyPreview();
}
function updateQtyPreview() {
  const f = JSON.parse(dlg().dataset.food);
  const g = parseFloat($("#q-g").value) || 0;
  $("#q-prev").innerHTML = `<b>${r0((f.kcal * g) / 100)} kcal</b> <span class="muted small">P ${r1((f.p * g) / 100)} C ${r1((f.c * g) / 100)} G ${r1((f.f * g) / 100)}</span>`;
}

function drinkDialog() {
  openDialog(`
    <h3>Aggiungi bevanda</h3>
    <div class="list">${DRINKS.map((x, i) => `<button class="item" data-act="pick-drink" data-i="${i}"><span>${esc(x.name)}</span><span class="muted small">${r0(x.kcal)} kcal per 100 ml</span></button>`).join("")}</div>`);
}
function drinkQty(i) {
  const x = DRINKS[i];
  openDialog(`
    <h3>${esc(x.name)}</h3>
    <div class="field"><label>Quantità in ml</label><input id="d-ml" type="number" inputmode="numeric" min="1" value="${x.portion}" autofocus></div>
    <div class="chips">${[x.portion, x.portion * 2].map((m) => `<button class="chip" data-act="dqty" data-ml="${m}">${m} ml</button>`).join("")}</div>
    <button class="btn primary wide" data-act="save-drink" data-i="${i}">Aggiungi</button>`);
}

function exerciseDialog(prefill = {}) {
  openDialog(`
    <h3>Aggiungi allenamento</h3>
    <div class="field"><label>Attività</label><select id="e-type">${EXERCISES.map((e, i) => `<option value="${i}" ${e.name === prefill.name ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Durata in minuti</label><input id="e-min" type="number" inputmode="numeric" min="1" value="${prefill.min || 45}" autofocus></div>
    <div class="field"><label>Note (esercizi, carichi, sensazioni)</label><input id="e-note" type="text" value="${esc(prefill.note || "")}"></div>
    <button class="btn primary wide" data-act="save-ex">Aggiungi</button>`);
}

function customFoodDialog() {
  openDialog(`
    <h3>Nuovo alimento</h3>
    <p class="muted small">Copia i valori per 100 g dall'etichetta. Lo trovi poi tra "I miei alimenti".</p>
    <div class="field"><label>Nome</label><input id="c-name" type="text" autofocus></div>
    <div class="grid2">
      <div class="field"><label>kcal per 100 g</label><input id="c-kcal" type="number" inputmode="decimal" min="0"></div>
      <div class="field"><label>Porzione tipica (g)</label><input id="c-portion" type="number" inputmode="decimal" min="1" value="100"></div>
      <div class="field"><label>Proteine</label><input id="c-p" type="number" inputmode="decimal" min="0" step="0.1" value="0"></div>
      <div class="field"><label>Carboidrati</label><input id="c-c" type="number" inputmode="decimal" min="0" step="0.1" value="0"></div>
      <div class="field"><label>Grassi</label><input id="c-f" type="number" inputmode="decimal" min="0" step="0.1" value="0"></div>
    </div>
    <button class="btn primary wide" data-act="save-custom">Salva e continua</button>`);
}

function quickKcalDialog() {
  openDialog(`
    <h3>Inserimento rapido</h3>
    <p class="muted small">Usalo solo quando non puoi pesare, ad esempio al ristorante. Stima per eccesso.</p>
    <div class="field"><label>Descrizione</label><input id="k-name" type="text" placeholder="Pranzo al ristorante" autofocus></div>
    <div class="grid2">
      <div class="field"><label>kcal totali</label><input id="k-kcal" type="number" inputmode="numeric" min="0"></div>
      <div class="field"><label>Proteine stimate (g)</label><input id="k-p" type="number" inputmode="numeric" min="0" value="0"></div>
    </div>
    <button class="btn primary wide" data-act="save-quick">Aggiungi</button>`);
}

function weightDialog() {
  const d = day(view.date);
  openDialog(`
    <h3>Peso di oggi</h3>
    <p class="muted small">Al mattino, a digiuno, dopo il bagno.</p>
    <div class="field"><label>Peso (kg)</label><input id="w-val" type="number" inputmode="decimal" step="0.1" value="${d.weight ?? r1(weightAt(view.date))}" autofocus></div>
    <button class="btn primary wide" data-act="save-weight">Salva</button>`);
}

// ---------- Promemoria calendario ----------
function ymdOfNext(wd) {
  const d = new Date();
  d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7));
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function buildIcs() {
  const url = location.href.split("#")[0];
  const labels = { misure: "Peso e misure della settimana: mattina, dopo il bagno, prima di mangiare", colazione: "Registra la colazione", pranzo: "Registra il pranzo", acqua: "Controlla quanta acqua hai bevuto", cena: "Registra la cena", chiusura: "Completa e chiudi la giornata" };
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//dieta-palestra//IT", "CALSCALE:GREGORIAN"];
  Object.entries(S.reminders).forEach(([k, time]) => {
    if (!time) return;
    if (!labels[k]) return;
    const hm = time.replace(":", "");
    const rule = k === "misure" ? `RRULE:FREQ=WEEKLY;BYDAY=${["SU", "MO", "TU", "WE", "TH", "FR", "SA"][S.measureDay]}` : "RRULE:FREQ=DAILY";
    const start = k === "misure" ? ymdOfNext(S.measureDay) : ymd;
    lines.push("BEGIN:VEVENT", `UID:dieta-palestra-${k}@local`, `DTSTAMP:${stamp}`, `DTSTART:${start}T${hm}00`, `DTEND:${start}T${hm}00`,
      rule, `SUMMARY:${labels[k]}`, `DESCRIPTION:Apri l'app: ${url}`, `URL:${url}`, "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${labels[k]}`, "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function download(name, content, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("show"), 2000);
}

// ---------- Azioni ----------
function act(a, el) {
  const k = view.date;
  const val = (id) => $(id).value;
  const num = (id) => parseFloat($(id).value);
  switch (a) {
    case "prev-day": view.date = addDays(k, -1); break;
    case "next-day": if (k < todayKey()) view.date = addDays(k, 1); break;
    case "goto": view.date = el.dataset.k; view.tab = "oggi"; break;
    case "period": view.period = +el.dataset.n; break;
    case "food": return foodDialog(el.dataset.slot || defaultSlot());
    case "scan-barcode": dlg().dataset.slot = $("#f-slot").value; return barcodeDialog();
    case "bc-lookup": stopScan(); return lookupBarcode($("#bc-manual").value);
    case "bc-confirm": {
      const f = JSON.parse(dlg().dataset.pending);
      delete f.missing;
      S.customFoods = S.customFoods.filter((x) => x.barcode !== f.barcode).concat(f);
      save();
      return qtyDialog(f, dlg().dataset.slot);
    }
    case "food-cat": return foodCat(el.dataset.c);
    case "pick-food": return qtyDialog(JSON.parse(el.dataset.food), $("#f-slot").value);
    case "qty": $("#q-g").value = el.dataset.g; return updateQtyPreview();
    case "save-food": {
      const f = JSON.parse(dlg().dataset.food);
      const g = num("#q-g");
      if (!(g > 0)) return toast("Inserisci la quantità");
      const ref = { name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, portion: f.portion, cat: f.cat };
      day(k, true).meals.push({ id: uid(), slot: dlg().dataset.slot, name: f.name, g, kcal: (f.kcal * g) / 100, p: (f.p * g) / 100, c: (f.c * g) / 100, f: (f.f * g) / 100, ref });
      closeDialog(); toast("Aggiunto"); break;
    }
    case "custom-food": dlg().dataset.slot = $("#f-slot").value; return customFoodDialog();
    case "save-custom": {
      const f = { name: val("#c-name").trim(), kcal: num("#c-kcal"), p: num("#c-p") || 0, c: num("#c-c") || 0, f: num("#c-f") || 0, portion: num("#c-portion") || 100 };
      if (!f.name || !(f.kcal >= 0)) return toast("Nome e kcal sono obbligatori");
      S.customFoods = S.customFoods.filter((x) => x.name !== f.name).concat(f);
      save();
      return qtyDialog({ ...f, cat: "I miei alimenti" }, dlg().dataset.slot);
    }
    case "quick-kcal": dlg().dataset.slot = $("#f-slot").value; return quickKcalDialog();
    case "save-quick": {
      const kc = num("#k-kcal");
      if (!(kc > 0)) return toast("Inserisci le calorie");
      const p = num("#k-p") || 0;
      day(k, true).meals.push({ id: uid(), slot: dlg().dataset.slot, name: val("#k-name").trim() || "Stima", g: null, kcal: kc, p, c: Math.max(0, (kc * 0.45) / 4), f: Math.max(0, (kc - p * 4 - kc * 0.45) / 9) });
      closeDialog(); toast("Aggiunto"); break;
    }
    case "copy-slot": {
      const src = S.days[addDays(k, -1)].meals.filter((m) => m.slot === el.dataset.slot);
      day(k, true).meals.push(...src.map((m) => ({ ...m, id: uid() })));
      toast("Copiato da ieri"); break;
    }
    case "save-habit": {
      const items = day(k).meals.filter((m) => m.slot === el.dataset.slot).map(({ id, ...m }) => m);
      const old = S.habits[el.dataset.slot];
      S.habits[el.dataset.slot] = { items, auto: old ? old.auto : false };
      toast("Salvato come pasto abituale"); break;
    }
    case "add-habit": {
      const h = S.habits[el.dataset.slot];
      day(k, true).meals.push(...h.items.map((m) => ({ ...m, id: uid(), slot: el.dataset.slot })));
      toast("Pasto abituale aggiunto"); break;
    }
    case "toggle-auto": {
      const h = S.habits[el.dataset.slot];
      h.auto = !h.auto;
      if (h.auto && k === todayKey()) { const d = day(k, true); d.autoDone = d.autoDone || {}; d.autoDone[el.dataset.slot] = true; }
      toast(h.auto ? "Da domani si inserisce da solo" : "Automatico disattivato"); break;
    }
    case "tab-misure": view.tab = "misure"; break;
    case "save-measure": {
      const m = { id: view.mEdit?.id || uid(), date: val("#m-date"), weight: num1(val("#m-weight")), waist: num1(val("#m-waist")), low: num1(val("#m-low")), thigh: num1(val("#m-thigh")), note: val("#m-note").trim() };
      if (!m.date) return toast("Inserisci la data");
      if (MEAS_FIELDS.every(([f]) => m[f] === null)) return toast("Inserisci almeno un valore");
      if (m.weight !== null && !(m.weight > 30 && m.weight < 300)) return toast("Peso non valido");
      const same = S.measures.find((x) => x.date === m.date && x.id !== m.id);
      if (same) { MEAS_FIELDS.forEach(([f]) => { if (m[f] === null) m[f] = same[f]; }); m.note = m.note || same.note; S.measures = S.measures.filter((x) => x.id !== same.id); }
      S.measures = S.measures.filter((x) => x.id !== m.id).concat(m);
      if (m.weight !== null) day(m.date, true).weight = m.weight;
      view.mEdit = null; toast("Misurazione salvata"); break;
    }
    case "edit-measure": view.mEdit = S.measures.find((x) => x.id === el.dataset.id); break;
    case "cancel-measure": view.mEdit = null; break;
    case "seed-measures": {
      const seed = [["2026-02-05", 67.5, null], ["2026-09-05", null, 90.5], ["2026-09-10", 65.7, 91], ["2026-09-21", 66, 91.5]];
      seed.forEach(([date, weight, waist]) => S.measures.push({ id: uid(), date, weight, waist, low: null, thigh: null, note: "" }));
      toast("Misure caricate"); break;
    }
    case "del-measure": if (confirm("Eliminare questa misurazione?")) { S.measures = S.measures.filter((x) => x.id !== view.mEdit?.id); view.mEdit = null; } break;
    case "import-dialog": return importDialog();
    case "import-list": {
      const { foods, errors } = parseFoodList(val("#imp-text"));
      if (!foods.length) return toast(errors.length ? "Nessuna riga valida, controlla il formato" : "Incolla almeno una riga");
      const names = new Set(foods.map((f) => f.name.toLowerCase()));
      S.customFoods = S.customFoods.filter((x) => !names.has(x.name.toLowerCase())).concat(foods);
      closeDialog();
      toast(`${foods.length} alimenti aggiunti${errors.length ? `, ${errors.length} righe non lette` : ""}`);
      if (errors.length) alert("Righe non lette:\n" + errors.join("\n"));
      break;
    }
    case "del-wanted": S.wanted.splice(+el.dataset.i, 1); break;
    case "del-habit": delete S.habits[el.dataset.slot]; break;
    case "move-meal": {
      const m = day(k).meals.find((x) => x.id === el.dataset.id);
      if (!m) return;
      return openDialog(`<h3>Sposta ${esc(m.name)}</h3><p class="muted small">Scegli il pasto di destinazione.</p>
        <div class="list">${SLOTS.map((sl) => `<button class="item" data-act="do-move" data-id="${m.id}" data-slot="${sl.id}" ${sl.id === m.slot ? "disabled" : ""}><span>${sl.label}</span><span class="muted small">${sl.id === m.slot ? "pasto attuale" : ""}</span></button>`).join("")}</div>`);
    }
    case "do-move": {
      const m = day(k, true).meals.find((x) => x.id === el.dataset.id);
      if (m) m.slot = el.dataset.slot;
      closeDialog(); toast("Alimento spostato"); break;
    }
    case "del-meal": { const d = day(k, true); d.meals = d.meals.filter((m) => m.id !== el.dataset.id); break; }
    case "add-water": {
      const ml = +el.dataset.ml;
      day(k, true).drinks.push({ id: uid(), name: "Acqua", ml, kcal: 0, c: 0, hydr: true, alc: false });
      toast(`Più ${ml} ml di acqua`); break;
    }
    case "water": return act("add-water", { dataset: { ml: 250 } });
    case "drink": return drinkDialog();
    case "pick-drink": return drinkQty(+el.dataset.i);
    case "dqty": $("#d-ml").value = el.dataset.ml; return;
    case "save-drink": {
      const x = DRINKS[+el.dataset.i];
      const ml = num("#d-ml");
      if (!(ml > 0)) return toast("Inserisci la quantità");
      day(k, true).drinks.push({ id: uid(), name: x.name, ml, kcal: (x.kcal * ml) / 100, c: (x.c * ml) / 100, hydr: x.hydr, alc: x.alc });
      closeDialog(); toast("Aggiunto"); break;
    }
    case "del-drink": { const d = day(k, true); d.drinks = d.drinks.filter((m) => m.id !== el.dataset.id); break; }
    case "exercise": return exerciseDialog();
    case "log-workout": {
      view.date = todayKey();
      const w = el.dataset.w;
      const cardio = /cardio/i.test(w), hiit = /intervalli/i.test(w);
      return exerciseDialog({ name: cardio ? "Camminata in salita" : hiit ? "HIIT" : "Pesi moderato", min: cardio ? 40 : hiit ? 25 : 60, note: w });
    }
    case "save-ex": {
      const e = EXERCISES[+val("#e-type")];
      const min = num("#e-min");
      if (!(min > 0)) return toast("Inserisci la durata");
      const w = weightAt(k);
      day(k, true).ex.push({ id: uid(), name: e.name, met: e.met, min, kcal: (e.met * w * min) / 60, net: ((e.met - 1) * w * min) / 60, note: val("#e-note").trim() });
      day(k, true).rest = false;
      closeDialog(); toast("Allenamento registrato"); break;
    }
    case "del-ex": { const d = day(k, true); d.ex = d.ex.filter((m) => m.id !== el.dataset.id); break; }
    case "toggle-rest": { const d = day(k, true); d.rest = !d.rest; break; }
    case "weight": return weightDialog();
    case "save-weight": {
      const w = num("#w-val");
      if (!(w > 30 && w < 300)) return toast("Peso non valido");
      day(k, true).weight = w; closeDialog(); toast("Peso salvato"); break;
    }
    case "close": {
      const d = day(k, true);
      if (!d.closed) {
        const missing = SLOTS.filter((s) => isReq(s) && !d.meals.some((m) => m.slot === s.id)).map((s) => s.label.toLowerCase());
        if (missing.length && !confirm(`Mancano: ${missing.join(", ")}. Chiudere comunque la giornata?`)) return;
      }
      d.closed = !d.closed; if (d.closed) toast("Giornata chiusa"); break;
    }
    case "copy-report": {
      const txt = reportText(view.period);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Report copiato"), () => download(`report-${todayKey()}.txt`, txt, "text/plain"));
      return;
    }
    case "ics": return download("promemoria-dieta.ics", buildIcs(), "text/calendar");
    case "export": return download(`backup-dieta-${todayKey()}.json`, JSON.stringify(S, null, 2), "application/json");
    case "reset":
      if (confirm("Cancellare tutti i dati? Operazione irreversibile.") && confirm("Sei sicuro?")) { S = defaultState(); save(); }
      break;
    case "dlg-close": return closeDialog();
    default: return;
  }
  save();
  render();
}

function defaultSlot() {
  const h = new Date().getHours();
  return h < 10 ? "colazione" : h < 12 ? "spuntino" : h < 15 ? "pranzo" : h < 18 ? "merenda" : "cena";
}

// ---------- Eventi ----------
document.addEventListener("click", (e) => {
  const nav = e.target.closest(".nav button");
  if (nav) { view.tab = nav.dataset.tab; view.mEdit = null; if (view.tab === "oggi") view.date = todayKey(); return render(); }
  const el = e.target.closest("[data-act]");
  if (el) { e.preventDefault(); act(el.dataset.act, el); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "f-search") renderFoodList(e.target.value);
  if (e.target.id === "q-g") updateQtyPreview();
});
document.addEventListener("change", (e) => {
  const t = e.target;
  const c = t.dataset.change;
  if (c === "steps") { day(view.date, true).steps = Math.max(0, parseInt(t.value) || 0); save(); render(); }
  if (c === "weight") { const w = parseFloat(t.value); day(view.date, true).weight = w > 30 && w < 300 ? w : null; save(); render(); }
  if (c === "note") { day(view.date, true).note = t.value; save(); }
  if (c === "reqslot") { S.required = SLOTS.map((x) => x.id).filter((id) => (id === t.dataset.id ? t.checked : S.required.includes(id))); save(); }
  if (c === "mday") { S.measureDay = +t.value; save(); }
  if (c === "rem") { S.reminders[t.dataset.k] = t.value; save(); }
  if (t.id === "import" && t.files[0]) {
    t.files[0].text().then((txt) => {
      try {
        const data = JSON.parse(txt);
        if (!data.days) throw new Error("formato");
        if (confirm("Sostituire i dati attuali con il backup?")) { S = { ...defaultState(), ...data }; save(); render(); toast("Backup importato"); }
      } catch { alert("File di backup non valido"); }
    });
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "profile-form") return;
  e.preventDefault();
  const fd = new FormData(e.target);
  const n = (x) => parseFloat(fd.get(x));
  S.profile = { sex: fd.get("sex"), age: n("age"), height: n("height"), weight: n("weight"), goalWeight: n("goalWeight"), rate: n("rate"), activity: n("activity"), trainDays: n("trainDays"), level: fd.get("level") };
  save();
  toast("Profilo salvato");
  view.tab = "oggi"; view.date = todayKey();
  render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && dlg().open && e.target.tagName === "INPUT") {
    const primary = dlg().querySelector(".btn.primary");
    if (primary) { e.preventDefault(); primary.click(); }
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && view.tab === "oggi" && !dlg().open) { applyHabits(todayKey()); render(); }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
applyHabits(todayKey());
render();
