"use strict";

// ---------- Stato e persistenza ----------
const KEY = "dieta-palestra-v1";
const emptyDay = () => ({ meals: [], drinks: [], ex: [], steps: 0, weight: null, rest: false, closed: false, note: "" });
const defaultState = () => ({
  profile: null,
  days: {},
  customFoods: [],
  habits: {},
  dailyAuto: [],
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
S.wanted = S.wanted || [];
S.dailyAuto = S.dailyAuto || [];
S.plans = S.plans || [];
S.planMin = S.planMin || {};
// Quantità fisse della giornata, modificabili dalla scheda Oggi.
// I valori di partenza valgono solo per chi ha gia un profilo: un nuovo utente parte da una lista vuota.
S.myPlan = S.myPlan || (S.profile ? [
  { name: "Yogurt greco", qty: "2 vasetti da 150 g" },
  { name: "Proteine in polvere", qty: "30 g in tutto, 15 g per yogurt" },
  { name: "Albume", qty: "2 bicchieri da 100 g" },
  { name: "Pollo", qty: "300 g crudi a sera" },
] : []);
// Recupero: il target medico scende a 1250 kcal (una volta sola, senza toccare altri valori scelti dall'utente).
S.plannedDinner = S.plannedDinner || "";
// piano aggiornato: 10 g di polvere per ogni yogurt e ogni albume
S.myPlan.forEach((x) => {
  if (/yogurt/i.test(x.name)) x.qty = "2 vasetti da 150 g, con 10 g di polvere ciascuno";
  if (/albume/i.test(x.name)) x.qty = "3 bicchieri da 100 g, con 10 g di polvere ciascuno";
  if (/polvere/i.test(x.name)) x.qty = "10 g per yogurt e per albume";
  if (/pollo/i.test(x.name)) x.qty = "150 g di cotoletta a sera";
});
Object.values(S.habits || {}).forEach((h) => { if (h && h.auto) h.items.forEach((m) => { if (!S.dailyAuto.some((x) => x.name === m.name)) { const { auto, id, slot, ...rest } = m; S.dailyAuto.push(rest); } }); });
S.habits = {};
if (S.measureDay === undefined) S.measureDay = 1;
// Correzione una tantum: le cotolette registrate senza uovo, parmigiano e pangrattato
// (circa 226 kcal per 300 g di porzione). Il fattore segue i grammi della voce.
{
  let fixed = 0;
  Object.values(S.days).forEach((d) => (d.meals || []).forEach((m) => {
    if (!m.breadFix && /cotolett/i.test(m.name) && m.g >= 50) {
      const f = m.g / 300;
      m.kcal += 226 * f; m.p += 13.5 * f; m.c += 21.4 * f; m.f += 8.5 * f;
      m.breadFix = true; fixed++;
    }
  }));
  if (fixed) save();
}
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
// Previsione e cibi bloccati sono salvati per giorno: oggi o un giorno futuro (es. domani).
S.plansByDay = S.plansByDay || {};
{
  const oldP = S.plannedDinner || "", oldB = S.blockedToday || "";
  delete S.plannedDinner; delete S.blockedToday;
  if (oldP || oldB) { S.plansByDay[todayKey()] = S.plansByDay[todayKey()] || { p: oldP, b: oldB }; }
  const dayOfView = () => { try { return view.date; } catch (e) { return todayKey(); } }; // view non ancora inizializzata durante il caricamento
  const per = (key, field) => Object.defineProperty(S, key, { configurable: true, enumerable: false,
    get() { return (S.plansByDay[dayOfView()] || {})[field] || ""; },
    set(v) { const d = dayOfView(); S.plansByDay[d] = S.plansByDay[d] || {}; S.plansByDay[d][field] = v; } });
  per("plannedDinner", "p"); per("blockedToday", "b");
}

// Alimenti ripetuti ogni giorno: inseriti una sola volta all'apertura del giorno, ogni riga resta eliminabile.
function applyHabits(k) {
  if (!S.profile || k !== todayKey() || !S.dailyAuto.length) return;
  const d = day(k, true);
  if (d.autoDone) return;
  d.autoDone = true;
  d.meals.push(...S.dailyAuto.map((m) => ({ ...m, id: uid(), slot: "giorno", auto: true })));
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
  return ks.length ? S.days[ks[ks.length - 1]].weight : (S.profile ? S.profile.weight : 0);
}

// ---------- Calcoli ----------
function baseTargets(k) {
  const p = S.profile;
  const w = weightAt(k);
  const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === "m" ? 5 : -161);
  const tdee = bmr * p.activity;
  const deficit = (p.rate * 7700) / 7;
  const floor = p.minKcal || 0;
  const kcal = Math.max(Math.round((tdee - deficit) / 10) * 10, floor);
  const refW = Math.min(w, (p.goalWeight || w) + 10);
  const protein = Math.round(2.0 * refW);
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round((w * 35) / 50) * 50;
  return { w, bmr, tdee, deficit, kcal, protein, fat, carbs, water };
}

// Recupero dopo gli sgarri: nei 7 giorni dal primo sgarro il target scende di una quota fissa, ricalcolata ogni giorno.
function planFor(k) {
  const intake = (j) => day(j).meals.reduce((a, m) => a + m.kcal, 0) + day(j).drinks.reduce((a, x) => a + x.kcal, 0);
  const diffDays = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  // tutti gli sgarri delle ultime due settimane: il piano resta aperto finché il recupero non è finito
  const keys = [];
  for (let i = 13; i >= 0; i--) keys.push(addDays(k, -i));
  const sgarri = keys.filter(isTracked).filter((j) => intake(j) > baseTargets(j).kcal * 1.1);
  if (!sgarri.length) return null;
  const startKey = sgarri[0];
  const lastKey = sgarri[sgarri.length - 1];
  const extra = sgarri.reduce((a, j) => a + (intake(j) - baseTargets(j).kcal), 0);
  const capKcal = Math.max(10, Math.round((baseTargets(k).carbs * 0.3 * 4) / 10) * 10);
  // giorni necessari a recuperare il totale con il tetto giornaliero, e almeno sei giorni dopo l'ultimo sgarro
  const needed = Math.max(7, Math.ceil(extra / capKcal));
  const endKey = diffDays(startKey, addDays(lastKey, 6)) + 1 > needed ? addDays(lastKey, 6) : addDays(startKey, needed - 1);
  if (k > endKey) return null;
  const span = diffDays(startKey, endKey) + 1;
  const cutKcal = Math.min(capKcal, Math.round(extra / span / 10) * 10);
  if (cutKcal <= 0) return null;
  return { startKey, endKey, span, dayNo: diffDays(startKey, k) + 1, daysLeft: diffDays(k, endKey) + 1, cutKcal, count: sgarri.length };
}
// macro della giornata contando anche la cena prevista
function plannedHtml(k, t, tg) {
  if (!S.plannedDinner || k < todayKey() || S.days[k]?.closed) return "";
  const pd = parseDiary(S.plannedDinner);
  if (!pd.length) return "";
  const dk = pd.reduce((a, x) => a + x.kcal, 0), dp = pd.reduce((a, x) => a + x.p, 0), dc = pd.reduce((a, x) => a + x.c, 0), df = pd.reduce((a, x) => a + x.f, 0);
  const left = Math.round(tg.kcal - t.kcal - dk);
  const m = (cls, lbl, v, target) => `<div class="macro-btn"><span class="muted small">${lbl}</span><b>${r0(v)} di ${r0(target)} g</b>${bar(v, target, cls)}</div>`;
  return `<div class="plan-line"><div><b>Con quanto previsto</b> · kcal rimanenti <b class="${left < 0 ? "bad" : "good"}">${left}</b></div>
    <div class="macros">${m("p", "Proteine", t.p + dp, tg.protein)}${m("c", "Carboidrati", t.c + dc, tg.carbs)}${m("f", "Grassi", t.f + df, tg.fat)}</div></div>`;
}
// target concordato con il medico, usato solo durante il recupero
const medicalKcal = () => parseInt((((S.myPlan || []).find((x) => x.name === "Target kcal (medico)")) || {}).qty, 10) || 0;
function targets(k) {
  const b = baseTargets(k);
  const plan = planFor(k);
  // In deficit le proteine restano a 2 g per chilo; nei giorni di recupero salgono a 2,2 g per chilo, per proteggere il muscolo.
  const refW = Math.min(b.w, (S.profile.goalWeight || b.w) + 10);
  const protein = Math.round((plan ? 2.2 : 2.0) * refW);
  const med = medicalKcal();
  let kcal = plan ? (med > 0 ? med : Math.max(0, b.kcal - plan.cutKcal)) : b.kcal;
  // recupero: l'eccesso di carboidrati del giorno prima toglie grammi di carboidrati da oggi, le calorie restano quelle del target
  const debito = (S.carbDebt || {})[addDays(k, -1)] || 0;
  const planOut = plan ? { ...plan, cutKcal: b.kcal - kcal } : null;
  const fat = Math.round((kcal * 0.28) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4) - debito);
  return { ...b, kcal, protein, fat, carbs, plan: planOut };
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

function isTracked(k) {
  const d = S.days[k];
  if (!d) return false;
  return d.closed || d.meals.length >= 3;
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
let resetScroll = false;
let scrollToId = null;
// Previsione automatica: quando cambiano i cibi mangiati di oggi, la parte generata si ricalcola sul rimanente.
// Se le calorie sono gia superate, non propone altro. Le righe scritte a mano non vengono toccate.
// Ordine della giornata: colazione, pranzo, spuntini, cena. Usato sia per mostrare sia per segnare come mangiati.
const mealRank = (line) => {
  const n = foodKey(line);
  if (/yogurt|latte|cereal|polvere|albume|fiocchi|colazione|caffe|cappuccino/.test(n)) return 0;
  if (/pasta|riso|pane|pranzo/.test(n)) return 1;
  if (/frutta|mela|banana|spuntino|merenda|mandorl|noci|pistacchi/.test(n)) return 2;
  return 3;
};
const sortPlanLines = (text) => (text || "").split("\n").filter((x) => x.trim()).map((l, i) => ({ l, i, r: mealRank(l) })).sort((a, b) => a.r - b.r || a.i - b.i).map((x) => x.l);

function refreshForecast() {
  if (!S.profile) return; // primo avvio: prima il profilo, poi la previsione
  const k = view.date, future = k > todayKey();
  // i cibi da non suggerire (dolci, snack, marche di cioccolato) vengono tolti anche dalle previsioni gia salvate
  if (S.plannedDinner && NOT_FOR_DIET.test(S.plannedDinner)) {
    S.plannedDinner = S.plannedDinner.split("\n").filter((l) => !NOT_FOR_DIET.test(l)).join("\n");
    save();
  }
  // niente righe doppie: le ripetizioni accumulate in passato vengono tolte
  // stesso nome = stesso cibo: se c'e due volte (anche con grammi diversi) resta la prima riga
  const seenNames = new Set();
  const uniq = (S.plannedDinner || "").split("\n").filter((x) => {
    if (!x.trim()) return false;
    const key = foodKey(x).replace(/:.*$/, "").trim();
    if (seenNames.has(key)) return false;
    seenNames.add(key); return true;
  });
  const before = (S.plannedDinner || "").split("\n").filter((x) => x.trim());
  if (uniq.length !== before.length) { S.plannedDinner = uniq.join("\n"); save(); }
  if (future) {
    // giorno futuro senza previsione: l'app propone subito cosa mangiare; se c'e gia una previsione la lascia com'e
    // rigenera se la previsione e vuota o era solo quella generata in automatico
    if (S.plannedDinner && S.plannedDinner !== (S.autoLines || []).join("\n")) return;
    const gen = autoPlan(S.blockedToday || "", "", k).split("\n").filter((x) => x.trim());
    if (gen.length) { S.autoLines = gen; S.plannedDinner = gen.join("\n"); save(); }
    return;
  }
  // se la previsione supera il rimanente, tolgo le proposte automatiche anche se il ricalcolo non e attivo
  {
    const tgo = targets(k), to = totals(k);
    const plannedNow = parseDiary(S.plannedDinner || "").reduce((a, x) => a + x.kcal, 0);
    const autoRe0 = /^(albume|yogurt greco 0%|proteine in polvere|just whey|cotoletta di tacchino|petto di tacchino cotto|pane bianco|verdura cotta senza condimento)\b/i;
    if (plannedNow > tgo.kcal - to.kcal) {
      const before = (S.plannedDinner || "").split("\n").filter((x) => x.trim());
      const after = before.filter((x) => !(autoRe0.test(x.trim()) && !/bloccato/i.test(x)));
      if (after.length !== before.length) { S.plannedDinner = after.join("\n"); S.autoLines = []; save(); }
    }
  }
  if (!S.autoForecast) return;
  const t = totals(k), tg = targets(k);
  const snap = k + "|" + [t.kcal, t.p, t.c, t.f].map((x) => Math.round(x)).join("|");
  // se la previsione supera il rimanente va sempre ricontrollata, anche senza nuovi cibi
  const overNow = parseDiary(S.plannedDinner || "").reduce((a, x) => a + x.kcal, 0) > tg.kcal - t.kcal;
  if (snap === S.forecastSnap && !overNow) return;
  S.forecastSnap = snap;
  // tolgo le righe generate in precedenza, tengo quelle scritte a mano, poi aggiungo le nuove
  // via le proposte automatiche vecchie (albume, yogurt, tacchino, pane, verdura): si ricalcolano sul rimanente
  const autoRe = /^(albume|yogurt greco 0%|proteine in polvere|just whey|cotoletta di tacchino|petto di tacchino cotto|pane bianco|verdura cotta senza condimento)\b/i;
  const prev = new Set([...(S.autoLines || []), ...(S.autoAll || [])]);
  const kept = (S.plannedDinner || "").split("\n").filter((x) => x.trim() && !prev.has(x) && !(autoRe.test(x.trim()) && !/bloccato/i.test(x)));
  const gen = tg.kcal - t.kcal <= 0 ? [] : autoPlan(S.blockedToday || "", kept.join("\n"), k).split("\n").filter((x) => x.trim());
  S.autoAll = [...new Set([...(S.autoAll || []), ...gen])].slice(-300);
  S.autoLines = gen;
  S.plannedDinner = [...kept, ...gen].join("\n");
  save();
}

function render() {
  refreshForecast();
  const keepY = window.scrollY;
  document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === view.tab));
  const main = $("#main");
  if (!S.profile && view.tab !== "fumo" && view.tab !== "giornata") { view.tab = "profilo"; main.innerHTML = renderProfile(true); return; }
  main.innerHTML = { fumo: () => renderFumo(), giornata: () => renderGiornata(), oggi: renderToday, misure: renderMeasures, report: renderReport, coach: renderCoach, profilo: () => renderProfile(false) }[view.tab]();
  window.scrollTo(0, resetScroll ? 0 : keepY);
  if (scrollToId) { const el = document.getElementById(scrollToId); scrollToId = null; if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  resetScroll = false;
}

function bar(value, target, cls = "") {
  const over = value > target * 1.05;
  return `<div class="bar ${cls} ${over ? "over" : ""}"><span style="width:${pct(value, target)}%"></span></div>`;
}

// Barra dell'obiettivo: il tratto oltre il target è di un altro colore e mostra quanto si è sforato.
function kcalBar(v, target) {
  const scale = Math.max(v, target) || 1;
  const base = (Math.min(v, target) / scale) * 100;
  const extra = (Math.max(0, v - target) / scale) * 100;
  const perc = target > 0 ? Math.round((v / target) * 100) : 0;
  return `<div class="bar-over" role="img" aria-label="${perc} per cento dell'obiettivo"><span class="base" style="width:${base}%"></span><span class="extra" style="width:${extra}%"></span></div><div class="muted small">${perc}% dell'obiettivo</div>`;
}

// Alimenti abituali: una sola volta, dall'etichetta. Niente verdure, qualche fritto preferito.
// Cibi che non vanno suggeriti in una dieta: dolci, snack, fritti, pizza, salumi. Non entrano nei suggerimenti automatici.
const NOT_FOR_DIET = /cioccolat|\b(lindt|ferrero|milka|perugina|baci|ritter|bounty|snickers|twix|kit ?kat|oreo|haribo|magnum|algida|nesquik|pan di stelle|mulino bianco|mars|tuc|nutella|kinder)\b|excellence|gelato|patatine|pringles|merendin|torta|tiramis|brioche|croissant|cornetto|biscott|frollin|dolc|snack|caramell|barretta|galletta|fritt|crocchett|pizza|salame|wurstel|salsicc|mortadella/i;
const HABIT_FOODS = ["Cotoletta di pollo impanata", "Pane integrale", "Pasta di semola, cotta, bollita", "Olio extravergine d'oliva", "Frutta secca mista"];
function missingHabits() {
  const have = new Set(allFoods().map((f) => norm(f.name).trim()));
  return HABIT_FOODS.filter((n) => !have.has(norm(n).trim()));
}
// Avviso a comparsa, una volta al giorno, finche mancano alimenti abituali. "Piu tardi" lo rimanda a domani.
function habitDialog() {
  const missing = missingHabits();
  const done = HABIT_FOODS.length - missing.length;
  openDialog(`
    <h3>I tuoi alimenti abituali</h3>
    <p class="muted small">${done} di ${HABIT_FOODS.length} inseriti. Inseriscili una volta sola, dall'etichetta: poi li ritrovi in ricerca e i conti tornano per sempre.</p>
    ${missing.slice(0, 3).map((n) => `<div class="row"><span>${esc(n)}</span><button class="btn small-btn primary" data-act="habit-add" data-name="${esc(n)}">Inserisci</button></div>`).join("")}
    <button class="btn ghost wide" data-act="habit-later">Più tardi</button>`);
}
// Cotoletta di tacchino fatta come la prepara mamma: una sola volta, come alimento personale modificabile.
const MOM_CUTLET = { name: "Cotoletta di tacchino (come la fa mamma)", kcal: 218, p: 24.9, c: 7.6, f: 8.6, portion: 90, src: "Stima, non verificata (ricetta di famiglia)" };
// Proteine in polvere: alimento personale, da confermare con l'etichetta del prodotto.
const PROTEIN_POWDER = { name: "Proteine in polvere", kcal: 380, p: 78, c: 6, f: 5, portion: 10, src: "Stima, da controllare sull'etichetta" };
// Pasta zucca e pancetta salvato prima dell'elenco ingredienti: ricostruisco gli ingredienti dichiarati (una sola volta, i valori salvati restano)
// Cotoletta di tacchino della mamma: una cotoletta di 90 g. Un giro: 300 g di tacchino, 2 uova, 40 g di pane grattugiato, 30 g di parmigiano, 10 g di olio, circa 4 cotolette.
const MOM_CUTLET_VALORI = { kcal: 218, p: 24.9, c: 7.6, f: 8.6, portion: 90 };
// Tutte le cotolette di tacchino (della mamma): nei giorni passati, negli alimenti personali e nella previsione. Una sola volta.
const COTOLETTA_RE = /cotolett.*(tacchino|mamma)|(tacchino|mamma).*cotolett/i;
// Righe della previsione con la cotoletta: ricalcolo le kcal sui grammi della riga, qualunque sia il formato.
function riparaRigheCotoletta(testo) {
  return String(testo || "").split("\n").map((l) => {
    if (!/cotoletta di tacchino/i.test(l)) return l;
    const g = l.match(/(\d+)\s*g\b/);
    if (!g) return l;
    return l.replace(/(\d+)\s*kcal/i, `${Math.round(Number(g[1]) * 2.18)} kcal`);
  }).join("\n");
}
function fixAllCotolette() {
  if (S.cotolettaRigheOk) return;
  if (S.plannedDinner) S.plannedDinner = riparaRigheCotoletta(S.plannedDinner);
  Object.values(S.plansByDay || {}).forEach((pd) => { if (pd && pd.p) pd.p = riparaRigheCotoletta(pd.p); });
  S.cotolettaRigheOk = true; save();
}
function fixAllCotolette() {
  if (S.cotolettaTuttiOk) return;
  const vals = (g) => ({ kcal: Math.round(g * 2.18), p: Math.round(g * 0.249 * 10) / 10, c: Math.round(g * 0.076 * 10) / 10, f: Math.round(g * 0.086 * 10) / 10 });
  Object.values(S.days || {}).forEach((d) => (d.meals || []).forEach((m) => {
    if (COTOLETTA_RE.test(m.name) && m.g) Object.assign(m, vals(m.g));
  }));
  (S.customFoods || []).forEach((f) => { if (COTOLETTA_RE.test(f.name)) Object.assign(f, { kcal: 218, p: 24.9, c: 7.6, f: 8.6, portion: 90 }); });
  const riga = (txt) => String(txt || "").replace(/(Cotoletta di tacchino \(come la fa mamma\),\s*)(\d+)\s*g(\s*stima)?\s*(\d+)\s*kcal/gi, (_, pre, g, st) => `${pre}${g} g${st || ""} ${Math.round(Number(g) * 2.18)} kcal`);
  if (S.plannedDinner) S.plannedDinner = riga(S.plannedDinner);
  Object.values(S.plansByDay || {}).forEach((pd) => { if (pd && pd.p) pd.p = riga(pd.p); });
  S.cotolettaTuttiOk = true; save();
}
function fixMomCutletValues() {
  if (S.momCutletValuesFixed) return;
  const c = S.customFoods.find((x) => x.name === MOM_CUTLET.name);
  if (c) { Object.assign(c, MOM_CUTLET_VALORI); c.src = "Stima dalla ricetta di famiglia: 300 g di tacchino, 2 uova, 40 g di pane grattugiato, 30 g di parmigiano, 10 g di olio, diviso in circa 4 cotolette"; }
  S.momCutletValuesFixed = true; save();
}
function ensureDishParts() {
  if (S.dishPartsFixed) return;
  const d = S.customFoods.find((x) => norm(x.name).trim() === "pasta zucca e pancetta" && !x.parts);
  if (d) {
    d.parts = [{ name: "Pasta di semola", g: 45 }, { name: "Zucca gialla, fresca", g: 45 }, { name: "Pancetta", g: 15 }, { name: "Olio extravergine d'oliva", g: 10 }];
    // valori per 100 g: CREA per pasta, zucca e olio; pancetta stimata (400 kcal, 15 g P, 0 C, 36 g G)
    const per = { "pasta di semola": [341, 13.5, 72.7, 1.2], "zucca gialla, fresca": [29, 1.1, 3.5, 0.1], "pancetta": [400, 15, 0, 36], "olio extravergine d'oliva": [899, 0, 0, 99.9] };
    let tg = 0, tk = 0, tp = 0, tc = 0, tf = 0;
    d.parts.forEach((pt) => { const v = per[norm(pt.name).trim()]; tg += pt.g; if (v) { tk += v[0] * pt.g / 100; tp += v[1] * pt.g / 100; tc += v[2] * pt.g / 100; tf += v[3] * pt.g / 100; } });
    d.kcal = Math.round(tk / tg * 100); d.p = Math.round(tp / tg * 1000) / 10; d.c = Math.round(tc / tg * 1000) / 10; d.f = Math.round(tf / tg * 1000) / 10;
    d.portion = Math.round(tg); d.src = "Piatto composto, pancetta stimata";
  }
  S.dishPartsFixed = true; save();
}
// Ragu di vitellone e suino fatto da mamma: una sola volta, con le carni al 50 e 50 e un soffritto stimato di 150 g (modificabile)
function ensureRagu() {
  if (S.raguAdded) return;
  if (!S.customFoods.some((x) => norm(x.name).trim() === "ragu di vitellone e suino")) {
    const parts = [{ name: "Vitellone per ragù, tagli anteriori (crudo)", g: 250 }, { name: "Maiale per ragù, spalla (crudo)", g: 250 }, { name: "Olio extravergine d'oliva", g: 20 }, { name: "Cipolla", g: 50 }, { name: "Carota", g: 50 }, { name: "Sedano", g: 50 }];
    const per = { "vitellone per ragu, tagli anteriori (crudo)": [145, 20.5, 0, 7], "maiale per ragu, spalla (crudo)": [133, 19, 0, 6.3], "olio extravergine d'oliva": [899, 0, 0, 99.9], "cipolla": [28, 1, 5.7, 0.1], "carota": [41, 1.1, 7.6, 0.2], "sedano": [23, 2.3, 2.4, 0.2] };
    let tg = 0, tk = 0, tp = 0, tc = 0, tf = 0;
    parts.forEach((pt) => { const v = per[norm(pt.name).trim()]; tg += pt.g; if (v) { tk += v[0] * pt.g / 100; tp += v[1] * pt.g / 100; tc += v[2] * pt.g / 100; tf += v[3] * pt.g / 100; } });
    S.customFoods.push({ name: "Ragù di vitellone e suino", parts, kcal: Math.round(tk / tg * 100), p: Math.round(tp / tg * 1000) / 10, c: Math.round(tc / tg * 1000) / 10, f: Math.round(tf / tg * 1000) / 10, portion: Math.round(tg), src: "Piatto composto, ricetta di mamma: carni 50 e 50, soffritto stimato" });
  }
  // il ragu salvato prima risulta "stima": con i valori CREA di tutti gli ingredienti diventa verificato (i valori modificati restano)
  const rg = S.customFoods.find((x) => norm(x.name).trim() === "ragu di vitellone e suino");
  if (rg && /stima/i.test(rg.src || "")) rg.src = "CREA 2019: vitellone, suino, cipolla, carota, sedano; ricetta di mamma";
  S.raguAdded = true; save();
}
function ensureBarcodeSources() {
  let n = 0;
  S.customFoods.forEach((f) => { if (f.barcode && !f.src) { f.src = "Etichetta: codice a barre"; n++; } });
  if (n) save();
}
function ensureProteinPowder() {
  if (!S.customFoods.some((x) => x.name === PROTEIN_POWDER.name)) S.customFoods.push({ ...PROTEIN_POWDER });
}
// Voci McDonald's inserite solo con le calorie: una volta sola completo i macro dai valori ufficiali (per porzione).
const MCD_MACROS = [
  { re: /^big mac/i, p: 27, c: 42, f: 29 },
  { re: /^patatine grandi/i, p: 5.6, c: 51, f: 21 },
  { re: /^mcchicken/i, p: 21, c: 46, f: 19 },
  { re: /^cheeseburger/i, p: 16, c: 30, f: 13 },
  { re: /^chicken mcnuggets/i, p: 11, c: 14, f: 8.3 },
  { re: /^salsa agrodolce mcdonald/i, p: 0.2, c: 11, f: 0.3 },
];
function ensureMcdMacros() {
  if (S.mcdMacrosFixed) return;
  let n = 0;
  Object.values(S.days).forEach((d) => (d.meals || []).forEach((m) => {
    const hit = MCD_MACROS.find((x) => x.re.test(String(m.name)));
    if (hit && !(m.p || m.c || m.f) && m.kcal > 0) { m.p = hit.p; m.c = hit.c; m.f = hit.f; n++; }
  }));
  S.mcdMacrosFixed = true;
  if (n) save();
}
function ensureMomCutlet() {
  if (!S.momPortionFixed) { const c = S.customFoods.find((x) => x.name === MOM_CUTLET.name); if (c) { c.portion = 230; S.momPortionFixed = true; save(); } }
  if (S.momCutletAdded) return;
  if (!S.customFoods.some((x) => x.name === MOM_CUTLET.name)) S.customFoods.push({ ...MOM_CUTLET });
  fixMomCutletValues();
  fixAllCotolette();
  S.momCutletAdded = true; save();
}
function maybeHabitDialog() {
  if (!S.profile || S.habitSeen === todayKey() || !missingHabits().length) return;
  habitDialog();
}

// Chiave di confronto di una riga di cibo: nome senza grammi e senza la scritta "bloccato".
const foodKey = (line) => line.replace(/,?\s*bloccato\b/ig, "").replace(/[\d.,]+\s*g\b/ig, "").replace(/,\s*$/, "").trim().toLowerCase();
// Toglie dai cibi bloccati le righe appena spostate tra i mangiati.
function unblock(lines) {
  if (!S.blockedToday) return;
  // confronto sul gruppo del nome (le prime due parole): "Pane bianco" e "Pane bianco (tipo 00)" sono lo stesso cibo
  const keys = new Set(lines.map((l) => foodGroup(foodKey(l))));
  S.blockedToday = S.blockedToday.split("\n").filter((x) => x.trim() && !keys.has(foodGroup(foodKey(x)))).join("\n");
}

// Riepilogo della settimana, in evidenza in cima a Oggi: il conto conta sulla settimana, non sul singolo giorno.
// scostamento totale dei giorni registrati in una settimana che finisce a endKey
function weekDiff(endKey) {
  const ps = periodStats(endKey, 7);
  const tr = ps.rows.filter((r) => r.d.meals.length > 0);
  if (!tr.length) return null;
  return Math.round(tr.reduce((a, r) => a + r.t.kcal - r.tg.kcal, 0) / tr.length); // media al giorno
}
function weekCard() {
  const ps = periodStats(todayKey(), 7);
  const tr = ps.rows.filter((r) => r.d.meals.length > 0);
  const prev = weekDiff(addDays(todayKey(), -7));
  if (!tr.length) return `<section class="card week-card"><h2>Questa settimana</h2><p class="muted small">Nessun giorno registrato ancora.</p></section>`;
  const sumK = tr.reduce((a, r) => a + r.t.kcal, 0), sumT = tr.reduce((a, r) => a + r.tg.kcal, 0);
  const diffTot = Math.round(sumK - sumT);
  const diffDay = Math.round(diffTot / tr.length);
  const sumP = tr.reduce((a, r) => a + r.t.p, 0), sumPT = tr.reduce((a, r) => a + r.tg.protein, 0);
  const cls = diffTot > 0.05 * sumT ? "bad" : "good";
  const word = diffDay > 0 ? "sopra" : "sotto";
  return `<section class="card week-card"><h2>Questa settimana</h2>
    <div class="week-big ${cls}">${r0(Math.abs(diffTot))} kcal</div>
    <div class="muted small">nella settimana ${diffTot > 0 ? "sei sopra" : "sei sotto"} il target. In media, ${Math.abs(diffDay)} kcal al giorno ${word}.</div>
    <div class="muted small">Proteine: ${r0(sumP)} di ${r0(sumPT)} g in totale.</div>${prev !== null ? `<div class="prev-week">Settimana scorsa: ${prev > 0 ? "+" : ""}${r0(prev)} kcal al giorno</div>` : ""}</section>`;
}

function renderToday() {
  const k = view.date;
  const d = day(k);
  const t = totals(k);
  const tg = targets(k);
  const isToday = k === todayKey();
  const remaining = tg.kcal - t.kcal;

  const checklist = [
    ...(measureDue(k) ? [{ label: "Peso e misure della settimana", ok: false, act: "tab-misure" }] : []),
    { label: "Cosa hai mangiato oggi", ok: d.meals.length > 0, act: "food" },
    { label: d.rest ? "Giorno di riposo" : "Passi e allenamento (sezione Attività)", ok: d.ex.length > 0 || t.steps >= 7000 || d.rest, act: "goto-attivita" },
    { label: "Chiudi la giornata", ok: d.closed, act: "close" },
  ];
  const todo = checklist.filter((c) => !c.ok).length;

  const foodKcal = d.meals.reduce((a, m) => a + m.kcal, 0);
  const mealsHtml = `${(view.foodsOpen ? d.meals : []).map((m) => `<div class="row"><div class="tap" data-act="edit-entry" data-kind="meal" data-id="${m.id}"><div>${esc(m.name)} ${(() => { const fd = allFoods().find((f) => norm(f.name).trim() === norm(m.name).trim()); return fd ? sourceBadge(fd) : ""; })()}</div><div class="muted small">${m.auto ? "Inserito in automatico, eliminalo se non l'hai mangiato. " : ""}${SLOT_NAMES[m.slot] ? SLOT_NAMES[m.slot] + ", " : ""}${m.g ? (m.gEst ? "circa " : "") + r0(m.g) + " g, " : ""}P ${r0(m.p)} C ${r0(m.c)} G ${r0(m.f)}</div><button class="link small-link" data-act="edit-entry" data-kind="meal" data-id="${m.id}">Modifica</button> <button class="link small-link" data-act="toggle-repeat" data-id="${m.id}">${S.dailyAuto.some((x) => x.name === m.name) ? "Si ripete ogni giorno, tocca per smettere" : "Ripeti ogni giorno"}</button></div><div class="row-r"><span>${r0(m.kcal)}</span><button class="x" data-act="del-meal" data-id="${m.id}" aria-label="Elimina">×</button></div></div>`).join("")}
    ${d.meals.length ? "" : `<p class="muted small">Ancora nulla. Aggiungi quello che mangi durante la giornata.</p>`}`;

  return `
  ${view.date === todayKey() ? weekCard() : ""}
  <div class="datebar">
    <button class="icon" data-act="prev-day" aria-label="Giorno precedente">‹</button>
    <div class="center"><div class="date">${isToday ? "Oggi" : esc(fmtDate(k, { weekday: "long" }))}</div><div class="muted small">${esc(fmtDate(k, { day: "numeric", month: "long", year: "numeric" }))}</div></div>
    <button class="icon" data-act="next-day" aria-label="Giorno successivo">›</button>
  </div>

  <section class="card hero">
    <div class="hero-main">
      <div><div class="big ${remaining < 0 ? "bad" : "good"}">${r0(Math.abs(remaining))}</div><div class="muted small">${remaining < 0 ? "kcal oltre obiettivo" : "kcal rimanenti"}</div></div>
      <button class="macro-btn center hero-mid" data-act="macro" data-m="kcal"><div class="big">${r0(t.kcal)}</div><div class="muted small">kcal assunte</div></button>
      <div><div class="big">${r0(t.exKcal)}</div><div class="muted small">kcal bruciate</div></div>
    </div>
    <div class="goal-line">Obiettivo giornaliero: <b>${tg.kcal} kcal</b></div>
    ${tg.plan ? `<div class="plan-line tiny"><div>Target vero: <b>${tg.kcal + tg.plan.cutKcal}</b> kcal</div><div>Recupero, da seguire adesso: <b>${tg.kcal}</b> kcal, per altri ${tg.plan.daysLeft} giorni</div></div>` : ""}
    ${kcalBar(t.kcal, tg.kcal)}
    ${tg.kcal < tg.bmr ? `<p class="warn-line tiny">Sotto il metabolismo basale (${r0(tg.bmr)} kcal): da concordare con un medico.</p>` : ""}
    ${bar(t.kcal, tg.kcal)}
    <div class="macros">
      <button class="macro-btn" data-act="macro" data-m="p"><span class="muted small">Proteine <span class="info-dot" aria-hidden="true">i</span></span><b>${r0(t.p)} di ${tg.protein} g</b>${bar(t.p, tg.protein, "p")}</button>
      <button class="macro-btn" data-act="macro" data-m="c"><span class="muted small">Carboidrati</span><b>${r0(t.c)} di ${tg.carbs} g</b>${bar(t.c, tg.carbs, "c")}</button>
      <button class="macro-btn" data-act="macro" data-m="f"><span class="muted small">Grassi</span><b>${r0(t.f)} di ${tg.fat} g</b>${bar(t.f, tg.fat, "f")}</button>
    </div>
    ${plannedHtml(k, t, tg)}
  </section>

  <section class="card">
    <h2>Cosa hai mangiato <span class="muted small">${r0(foodKcal)} kcal</span><button class="icon-plus" data-act="food-menu" aria-label="Aggiungi">+</button></h2>
    ${view.foodMenu ? `<div class="food-menu">
      <button class="menu-item" data-act="food">Aggiungi alimento</button>
      <button class="menu-item" data-act="diary-dialog">Incolla un riepilogo</button>
      ${hasYesterday(k) ? `<button class="menu-item" data-act="copy-yesterday">Come ieri</button>` : ""}
      <button class="menu-item" data-act="copy-from-date">Copia da data</button>
    </div>` : ""}
    ${recalcChanges(k).length ? `<button class="btn wide" data-act="recalc">Ricalcola ${recalcChanges(k).length} ${recalcChanges(k).length === 1 ? "alimento" : "alimenti"} con i valori aggiornati</button>` : ""}
    ${mealsHtml}
    ${d.meals.length > 0 ? `<button class="btn ghost wide" data-act="toggle-foods">${view.foodsOpen ? "Chiudi" : `<span class="big-count">${d.meals.length}</span>`}</button>` : ""}
  </section>

  ${myPlanCard()}

  ${commentHtml(k)}

  <section class="card">
    <h2>Da inserire ${isToday ? "oggi" : "in questo giorno"} <span class="pill ${todo ? "" : "ok"}">${todo ? todo + " da fare" : "Completo"}</span></h2>
    <div class="checklist">
      ${checklist.map((c) => `<button class="check ${c.ok ? "ok" : ""}" data-act="${c.act}" ${c.slot ? `data-slot="${c.slot}"` : ""}><span class="dot"></span>${esc(c.label)}</button>`).join("")}
    </div>
  </section>

  <section class="card">
    <h2>Bevande</h2>
    <div class="water">
      <div class="water-n"><b>${r1(t.water / 1000)} L</b><span class="muted small"> di ${r1(t.waterTarget / 1000)} L</span></div>
      ${bar(t.water, t.waterTarget, "w")}
      <div class="btns">
        <button class="btn ghost" data-act="drink">Altra bevanda</button>
      </div>
    </div>
    ${d.drinks.map((x) => `<div class="row"><div class="tap" data-act="edit-entry" data-kind="drink" data-id="${x.id}"><div>${esc(x.name)}</div><div class="muted small">${r0(x.ml)} ml${x.alc ? ", alcolico" : ""}</div><button class="link small-link" data-act="edit-entry" data-kind="drink" data-id="${x.id}">Modifica</button></div><div class="row-r"><span>${r0(x.kcal)}</span><button class="x" data-act="del-drink" data-id="${x.id}" aria-label="Elimina">×</button></div></div>`).join("")}
  </section>

  <section class="card" id="sec-attivita">
    <h2>Attività</h2>
    <div class="steps-box">
      <label for="steps" class="muted small">Passi del giorno</label>
      <input id="steps" class="steps-input" type="number" inputmode="numeric" min="0" step="100" value="${d.steps || ""}" placeholder="0" data-change="steps">
    </div>
    ${(() => {
      const done = S.plans.flatMap((p) => p.days.filter((dd) => d.ex.some((e) => e.name === `${p.name}, giorno ${dd.label}`)).map((dd) => `giorno ${dd.label}`));
      return done.length ? `<p class="done-line">Palestra fatta: ${esc(done.join(", "))}</p>` : `<p class="muted small done-line">Palestra: nessun giorno ancora segnato</p>`;
    })()}
    ${d.ex.map((e) => `<div class="row"><div><div>${esc(e.name)}</div><div class="muted small">${r0(e.min)} minuti${e.note ? ", " + esc(e.note) : ""}</div></div><div class="row-r"><span>${r0(e.kcal)}</span><button class="x" data-act="del-ex" data-id="${e.id}" aria-label="Elimina">×</button></div></div>`).join("")}
    <div class="btns">
      <button class="btn primary" data-act="activity-dialog">Scrivi o incolla le attività</button>
      <button class="btn ghost" data-act="plans-dialog">Schede di allenamento</button>
      <button class="btn ghost" data-act="toggle-rest">${d.rest ? "Annulla riposo" : "Giorno di riposo"}</button>
    </div>
    ${S.plans.map((p) => `<div class="plan-quick"><span class="muted small">${esc(p.name)}</span><div class="btns">${p.days.filter((dd) => !d.ex.some((e) => e.name === `${p.name}, giorno ${dd.label}`)).map((dd) => `<button class="btn small-btn ghost" data-act="plan-quick" data-id="${p.id}" data-label="${esc(dd.label)}">Ho fatto giorno ${esc(dd.label)}</button>`).join("")}</div></div>`).join("")}
  </section>

  <section class="card">
    <h2>Peso, misure e note</h2>
    <button class="btn wide" data-act="measure-today">${d.weight ? `Peso ${r1(d.weight)} kg: modifica peso e misure` : "Inserisci peso e misure di oggi"}</button>
    <div class="field"><label for="note">Note (fame, sonno, stress, ciclo, sgarri)</label><textarea id="note" rows="2" data-change="note">${esc(d.note)}</textarea></div>
    <button class="btn ${d.closed ? "ghost" : "primary"} wide" data-act="close">${d.closed ? "Riapri la giornata" : "Ho inserito tutto: chiudi la giornata"}</button>
  </section>`;
}

function hasYesterday(k) {
  const y = S.days[addDays(k, -1)];
  return !!(y && y.meals.length);
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

function lowWaistComment(list) {
  const pts = lastWith("low", list);
  if (pts.length < 2) return "";
  const d = pts[pts.length - 1].low - pts[pts.length - 2].low;
  if (Math.abs(d) < 0.5) return `<p class="small">Vita bassa stabile rispetto alla misura precedente.</p>`;
  return d > 0
    ? `<p class="small bad">Vita bassa aumentata di ${fmtN(d)} cm rispetto alla misura precedente. Controlla cosa è cambiato nella dieta questa settimana.</p>`
    : `<p class="small good">Vita bassa diminuita di ${fmtN(-d)} cm rispetto alla misura precedente. Continua così.</p>`;
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
  const e = view.mEdit || { date: view.mDate || todayKey(), weight: view.mDate ? day(view.mDate).weight ?? null : null, waist: null, low: null, thigh: null, note: "" };
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
    ${lowWaistComment(list)}
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
    if (r.d.meals.length) L.push(`  Alimenti: ${r.d.meals.map((m) => `${m.name}${m.g ? " " + r0(m.g) + "g" : ""} (${r0(m.kcal)})`).join(", ")}`);
    if (r.d.drinks.length) L.push(`  Bevande: ${r.d.drinks.map((x) => `${x.name} ${r0(x.ml)}ml (${r0(x.kcal)})`).join(", ")}`);
    if (r.d.ex.length) L.push(`  Attività: ${r.d.ex.map((e) => `${e.name} ${r0(e.min)} min (${r0(e.kcal)} kcal)${e.note ? " " + e.note : ""}`).join(", ")}`);
    if (r.d.rest) L.push("  Giorno di riposo");
    if (r.d.note) L.push(`  Note: ${r.d.note}`);
  });
  return L.join("\n");
}

// ---------- Coach ----------
function coachAdvice() {
  const stEnd = addDays(todayKey(), isTracked(todayKey()) && day(todayKey()).closed ? 0 : -1);
  const st = periodStats(stEnd, 7);
  const sgSt = overview(stEnd, 7).over.length;
  const st14 = periodStats(todayKey(), 14);
  const p = S.profile;
  const tg = targets(todayKey());
  const out = [];
  const add = (lvl, title, text) => out.push({ lvl, title, text });

  if (st.tracked < 5) add("warn", "Registra con costanza", `Negli ultimi 7 giorni hai registrato ${st.tracked} giornate complete. Senza almeno 5 giorni su 7 i numeri non sono affidabili. Pesa gli alimenti, conta l'olio e chiudi la giornata ogni sera.`);
  if (st.tracked >= 3) {
    if (st.kcal > st.target + 150) add("bad", "Sei sopra l'obiettivo", `Media ${r0(st.kcal)} kcal contro un obiettivo di ${r0(st.target)}. Sono circa ${r0(st.kcal - st.target)} kcal in più al giorno. Controlla condimenti, snack fuori pasto e bevande.`);
    else if (st.kcal < st.bmr * 0.95) add("warn", "Stai mangiando troppo poco", `Media ${r0(st.kcal)} kcal, sotto il tuo metabolismo basale (${r0(st.bmr)}). Rischi di perdere muscolo, avere più fame e rallentare. Meglio un deficit moderato e sostenibile.`);
    else if (sgSt) add("warn", "Calorie in linea, ma con sgarri", `Media ${r0(st.kcal)} kcal con obiettivo ${r0(st.target)}, però nei 7 giorni hai ${sgSt} ${sgSt === 1 ? "sgarro" : "sgarri"}. La media nasconde i giorni fuori obiettivo: il prossimo passo è azzerarli.`);
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
// cibi che ti piacciono: fissi, senza grammi e senza legame con il giorno. Rigenera sceglie fra questi.
S.favFoods = S.favFoods || [];
function favCardHtml() {
  return `<section class="card"><h2>I miei cibi preferiti</h2><p class="muted small">Un cibo per riga, senza grammi. Restano finché non li cambi.</p><div class="field"><textarea id="fav-foods" rows="6" placeholder="Cotoletta di tacchino&#10;Ricotta&#10;Uova&#10;Albume&#10;Pasta integrale">${esc((S.favFoods || []).join("\n"))}</textarea></div><button class="btn primary" data-act="fav-save">Salva i preferiti</button></section>`;
}
function renderProfile(first) {
  const p = S.profile || { sex: "m", age: 35, height: 175, weight: 85, goalWeight: 75, rate: 0.5, activity: 1.2, trainDays: 3, level: "principiante" };
  const opt = (v, cur, label) => `<option value="${v}" ${String(v) === String(cur) ? "selected" : ""}>${label}</option>`;
  const tg = S.profile ? targets(todayKey()) : null;
  return `
  ${favCardHtml()}
  ${first ? `<section class="card intro"><h2>Benvenuto</h2><p>Inserisci i tuoi dati: calcolo calorie, proteine e acqua per il tuo obiettivo. I dati restano solo su questo dispositivo.</p></section>` : ""}
  <form class="card" id="profile-form">
    <h2>I tuoi dati</h2>
    <div class="grid2">
      <div class="field"><label>Come vuoi essere chiamato (facoltativo)</label><input name="name" type="text" maxlength="20" value="${esc(p.name || "")}" placeholder="Il tuo nome"></div>
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
    <div class="field"><label>Giorno di peso e misure</label><select data-change="mday">${["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"].map((n, i) => `<option value="${i}" ${S.measureDay === i ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    <button class="btn wide" data-act="ics">Scarica promemoria per il calendario</button>
  </section>
  <section class="card">
    <h2>Alimenti da aggiungere</h2>
    ${prunedWanted().length ? `<p class="muted small">Cercati e non trovati. Arrivano con il report settimanale e li aggiungo alla lista.</p><div class="chips">${S.wanted.map((w, i) => `<span class="chip">${esc(w.name)} <button class="x mini" data-act="del-wanted" data-i="${i}" aria-label="Rimuovi">×</button></span>`).join("")}</div>` : `<p class="muted small">Nessun alimento in attesa. Quando cerchi qualcosa che non trovo, comparirà qui.</p>`}
    <button class="btn wide" data-act="habit-open">Alimenti abituali</button>
    <button class="btn wide" data-act="import-dialog">Incolla una lista di alimenti</button>
  </section>
  <section class="card">
    <h2>Dati e backup</h2>
    <p class="muted small">Ricalcolo storico: confronta i pasti passati con i valori aggiornati e applica solo le voci che scegli.</p>
    <div class="btns"><button class="btn" data-act="hist-check">Confronta giornate passate</button></div>
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
// ordine dei pasti: colazione, pranzo, altro, cena; il target medico resta in fondo
// ordine fisso: yogurt, proteine in polvere, albume (colazione), pasta (pranzo), pollo (cena), poi il resto, target in fondo
const PLAN_ORDER = [/yogurt/i, /polvere|whey/i, /pasta|riso|pane/i, /albume/i, /pollo|tacchino|carne|pesce/i];
const planRank = (x) => (x.name === "Target kcal (medico)" ? 99 : (PLAN_ORDER.findIndex((re) => re.test(x.name)) + 1 || 50));
// Crea la previsione: tiene i pasti fissi e completa il resto con alimenti magri, pasta e verdura, fino al target.
// I cibi che mangi piu spesso negli ultimi 30 giorni, con la porzione tipica (mediana dei grammi).
// chiave dell'alimento: le prime due parole significative (fiocchi d'avena = fiocchi di avena integrali)
const foodGroup = (name) => norm(name).split(/[^a-z0-9]+/).filter((w) => w.length > 2).slice(0, 2).join(" ");
function favoriteFoods(k) {
  const count = new Map();
  const todayGroups = new Set(((S.days[k] || {}).meals || []).map((m) => foodGroup(m.name)));
  // i preferiti scelti da te entrano sempre per primi, senza aspettare la cronologia
  const pref = S.customFoods.filter((x) => x.fav && !todayGroups.has(foodGroup(x.name)) && !NOT_FOR_DIET.test(x.name))
    .map((x) => ({ name: x.name, g: x.portion || 100, per: [x.kcal, x.p, x.c, x.f] }));
  for (let i = 1; i <= 30; i++) {
    const d = S.days[addDays(k, -i)];
    if (!d || !d.meals) continue;
    d.meals.forEach((m) => {
      if (!m.name || !m.g || !(m.kcal > 0) || NOT_FOR_DIET.test(m.name)) return;
      const key = foodGroup(m.name);
      if (todayGroups.has(key)) return; // gia mangiato oggi, anche con un nome diverso
      // il tacchino generico non entra tra i preferiti: resta solo la cotoletta di famiglia
      if (/tacchino/i.test(m.name) && !/come la fa mamma/i.test(m.name)) return;
      const c = count.get(key) || { name: m.name, gs: [], n: 0, per: [0, 0, 0, 0], w: 0 };
      c.n++; c.gs.push(m.g);
      // valori per 100 g presi dal pasto registrato stesso, cosi non serve che il nome sia nel database
      const per = [m.kcal, m.p || 0, m.c || 0, m.f || 0].map((x) => x * 100 / m.g);
      c.per = per.map((x, i) => c.per[i] + x); c.w++;
      count.set(key, c);
    });
  }
  const out = [];
  [...count.values()].filter((c) => c.n >= 1).sort((a, b) => b.n - a.n).forEach((c) => {
    const gs = c.gs.slice().sort((a, b) => a - b);
    const g = Math.round(gs[Math.floor(gs.length / 2)] / 5) * 5;
    const per = c.per.map((x) => Math.round((x / c.w) * 10) / 10);
    if (g > 0 && per[0] > 0) out.push({ name: c.name, g, per });
  });
  return [...pref, ...out.filter((o) => !pref.some((x) => foodGroup(x.name) === foodGroup(o.name)))].slice(0, 12);
}
function autoPlan(blockedText = "", planText = "", k = todayKey()) {
  const t = totals(k), tg = targets(k);
  const src = [...blockedText.split("\n").filter((x) => x.trim()).map((l) => l.trim() + ", bloccato"), ...planText.split("\n").filter((x) => x.trim())];
  const each = src.map((l) => ({ line: l, fixed: /\b(fisso|bloccato)\b/i.test(l) || planText.includes(l), items: parseDiary(l.replace(/,?\s*(fisso|bloccato)\b/i, "")) }));
  const fixed = each.filter((x) => x.fixed);
  const fk = fixed.reduce((q, x) => q + x.items.reduce((w, i) => w + i.kcal, 0), 0);
  const fp = fixed.reduce((q, x) => q + x.items.reduce((w, i) => w + i.p, 0), 0);
  const fc = fixed.reduce((q, x) => q + x.items.reduce((w, i) => w + i.c, 0), 0);
  const ff = fixed.reduce((q, x) => q + x.items.reduce((w, i) => w + i.f, 0), 0);
  let needK = tg.kcal - t.kcal - fk, needP = tg.protein - t.p - fp, needC = tg.carbs - t.c - fc;
  const out = [];
  const add = (name, g, per) => { // per = [kcal, p, c, f] per 100 g
    // stesso alimento gia proposto: non lo raddoppio
    if (out.some((l) => l.startsWith(name + ","))) return;
    out.push(`${name}, ${g} g`);
    needK -= per[0] * g / 100; needP -= per[1] * g / 100; needC -= per[2] * g / 100;
  };
  const ALB = [45, 10.7, 0.8, 0.2], YOG = [57, 10, 3.6, 0.2], TAC = [135, 29, 0, 2], PAS = [340, 13.5, 64, 2.5];
  // proteine: yogurt greco 0% con 10 g di proteine in polvere (valori dal database e dall'alimento personale), poi albume e tacchino
  // prima i cibi che mangi di solito (ultimi 30 giorni), con la porzione che usi di solito
  const eatenToday = new Set(((S.days[k] || {}).meals || []).map((m) => norm(m.name).trim()));
  let picked = 0;
  favoriteFoods(k).forEach((fv) => {
    if (picked >= 3 || eatenToday.has(norm(fv.name).trim())) return;
    // il preferito e il cibo, non la quantita: la porzione abituale e solo un massimo, e si scende se le calorie o i carboidrati non entrano
    const gMax = fv.g;
    const gK = fv.per[0] > 0 ? Math.floor((needK + 150) / (fv.per[0] / 100) / 5) * 5 : gMax;
    const gC = fv.per[2] > 0 ? Math.floor((needC + 3) / (fv.per[2] / 100) / 5) * 5 : gMax;
    const gF = fv.per[3] > 0 ? Math.floor(((tg.fat - t.f - ff) + 2) / (fv.per[3] / 100) / 5) * 5 : gMax;
    const g = Math.min(gMax, gK, gC, gF);
    if (g < 10) return;
    add(fv.name, g, fv.per); picked++;
  });
  // cibi preferiti (sezione Profilo): Rigenera sceglie fra questi, decide lui la quantita, senza superare calorie e carboidrati
  (S.favFoods || []).forEach((nome) => {
    if (picked >= 6 || eatenToday.has(norm(nome).trim())) return;
    // piatto combinato: "Albume + JUST WHEY (GymBeam) + Latte parzialmente scremato" si propone come un unico piatto
    const pezzi = nome.split("+").map((x) => x.trim()).filter(Boolean);
    if (pezzi.length > 1) {
      const trovati = pezzi.map((pz) => ({ pz, hit: searchFoods(pz).find((x) => !x.perServing && norm(x.name).includes(norm(pz))) })).filter((x) => x.hit);
      if (trovati.length !== pezzi.length || trovati.some((x) => out.some((l) => l.startsWith(x.hit.name + ",")))) return;
      const base = (pz) => (/albume/i.test(pz) ? 150 : /whey|polvere/i.test(pz) ? 15 : /latte/i.test(pz) ? 100 : 100);
      const combo = trovati.map((x) => ({ ...x, g: base(x.pz), per: [x.hit.kcal, x.hit.p, x.hit.c, x.hit.f] }));
      const kCombo = combo.reduce((a, x) => a + x.per[0] * x.g / 100, 0);
      const cCombo = combo.reduce((a, x) => a + x.per[2] * x.g / 100, 0);
      const fatt = Math.min(1, kCombo > 0 ? (needK + 150) / kCombo : 1, cCombo > 0 ? (needC + 3) / cCombo : 1);
      if (fatt < 0.3) return;
      combo.forEach((x) => { const g = Math.max(10, Math.round(x.g * fatt / 5) * 5); add(x.hit.name, /whey|polvere/i.test(x.pz) ? Math.min(g, 15) : g, x.per); });
      picked++;
      return;
    }
    const hit = searchFoods(nome).find((x) => !x.perServing && norm(x.name).includes(norm(nome).trim()));
    if (!hit || out.some((l) => l.startsWith(hit.name + ","))) return;
    const per = [hit.kcal, hit.p, hit.c, hit.f];
    const pol = /whey|proteine in polvere/i.test(hit.name);
    const perG = (i) => (per[i] > 0 ? Math.floor(((i === 0 ? needK : i === 2 ? needC : tg.fat - t.f - ff)) / (per[i] / 100) / 5) * 5 : 200);
    let g = Math.min(200, perG(0), perG(2), perG(3));
    if (pol) g = Math.min(g, 15);
    if (g < 30) return;
    add(hit.name, g, per); picked++;
  });
  // proteine in polvere: solo se hai un integratore verificato (etichetta o codice a barre), mai valori generici
  const powder = allFoods().find((f) => /whey|proteine/i.test(f.name) && isVerified(f));
  const yog = byName("Yogurt greco 0%");
  if (needP > 5) { add("Yogurt greco 0%", 150, yog && yog.p > 0 ? [yog.kcal, yog.p, yog.c, yog.f] : [51, 9, 4, 0]); }
  // albume e tacchino entrano solo nelle calorie rimaste: niente sforamenti
  if (needP > 5) { const kmax = Math.floor(Math.max(0, needK) / 0.45 / 10) * 10; const ag = Math.min(400, kmax, Math.max(100, Math.ceil(needP / 0.107 / 10) * 10)); if (ag >= 100) add("Albume", ag, ALB); }
  // tacchino: solo la cotoletta di famiglia, con i suoi valori; niente petto generico
  const momCut = allFoods().find((f) => /come la fa mamma/i.test(f.name));
  if (needP > 5 && momCut && momCut.p > 0) { const kg = Math.floor(Math.max(0, needK) / (momCut.kcal / 100) / 10) * 10; const g = Math.min(230, kg, Math.round(needP / (momCut.p / 100) / 10) * 10); if (g >= 50) add(momCut.name, g, [momCut.kcal, momCut.p, momCut.c, momCut.f]); }
  // carboidrati: pasta solo se entra e se servono
  // pasta a pranzo: la quantità che entra nei carboidrati rimasti, anche se le calorie sono strette
  if (needC > 4) {
    const pg = Math.min(60, Math.round((needC / 0.64) / 5) * 5);
    if (pg >= 40) add("Pasta integrale", pg, PAS);
    else { const bg = Math.round((needC / 0.595) / 5) * 5; if (bg > 0) add("Pane bianco", bg, [268, 8.1, 59.5, 0.5]); }
  }
  // verdura: riempie senza calorie, solo quando le proteine sono coperte e restano calorie; altrimenti ci pensa la carne
  if (needP <= 5 && needK > 30) out.push("Verdura cotta senza condimento, 150 g: circa 30 kcal, 2 g di proteine, 6 g di carboidrati, 0 g di grassi");
  return out.join("\n");
}
// Ricerca nel database per la previsione: scegli un alimento e scrivi i grammi
function renderPbList(q) {
  const box = $("#pb-list");
  if (!box) return;
  const list = q.trim() ? searchFoods(q.trim()).slice(0, 8) : [];
  box.innerHTML = list.map((f) => `<button class="item" data-act="pb-pick" data-name="${esc(f.name)}"><span>${esc(f.name)}</span><span class="muted small">${r0(f.kcal)} kcal per 100 g</span></button>`).join("");
}
function renderPvList(q) {
  const box = $("#pv-list");
  if (!box) return;
  const list = q.trim() ? searchFoods(q.trim()).slice(0, 8) : [];
  box.innerHTML = list.map((f) => `<button class="item" data-act="pv-pick" data-name="${esc(f.name)}"><span>${esc(f.name)}</span><span class="muted small">${r0(f.kcal)} kcal per 100 g</span></button>`).join("");
}
// Righe della previsione in ordine di giornata: colazione, pranzo, spuntino, cena (senza titoli).
function planItemsHtml() {
  const lines = sortPlanLines(S.plannedDinner);
  if (!lines.length) return `<p class="muted small">Scrivi colazione, pranzo e cena, una riga per alimento con i grammi.</p>`;
  return lines.map((x, i) => {
    // nome completo senza grammi e senza la scritta "bloccato", cosi anche i nomi con parentesi (JUST WHEY (GymBeam)) si riconoscono
    const key = foodKey(x).replace(/:.*$/, "").trim();
    const fd = byName(key);
    const badge = fd ? sourceBadge(fd) : "";
    const shown = x.replace(/,?\s*bloccato\b/i, "").replace(/^Aggiungi alimento\s*/i, "");
    // calorie e carboidrati di questa riga: se un valore e assurdo si vede subito
    const it = parseDiary(x)[0];
    const nums = it ? `<span class="muted small">${Math.round(it.kcal)} kcal</span>` : `<span class="muted small">valori mancanti</span>`;
    return `<div class="plan-item"><button class="link plan-name" data-act="plan-values" data-i="${i}">${esc(shown)}</button> ${badge} ${nums}<div class="plan-acts"><button class="pa" data-act="plan-eat-one" data-i="${i}">Mangiato</button><button class="pa" data-act="plan-grams" data-i="${i}">${(x.match(/(\d+(?:[.,]\d+)?)\s*g\b/) || [0, "?"])[1]} g</button><button class="pa${/bloccato/i.test(x) ? " on" : ""}" data-act="plan-block-one" data-i="${i}">${/bloccato/i.test(x) ? "Bloccata" : "Blocca"}</button><button class="pa${(() => { const k2 = foodKey(x).replace(/:.*$/, "").trim(); const f2 = allFoods().find((f) => norm(f.name).trim().toLowerCase() === k2); return f2 && f2.fav ? " on" : ""; })()}" data-act="plan-fav" data-i="${i}">${(() => { const k2 = foodKey(x).replace(/:.*$/, "").trim(); const f2 = allFoods().find((f) => norm(f.name).trim().toLowerCase() === k2); return f2 && f2.fav ? "Preferito" : "Preferito"; })()}</button><button class="pa" data-act="plan-del-one" data-i="${i}" aria-label="Togli questa riga">×</button></div></div>`;
  }).join("");
}
function myPlanCard() {
  const k = view.date, left = targets(k).kcal - totals(k).kcal;
  const planned = parseDiary(S.plannedDinner || "").reduce((a, x) => a + x.kcal, 0);
  const over = planned - left;
  const warn = planned > 0 && over > 0 ?`<p class="warn-line">${left <= 0 ? `Il target di oggi è già superato: la previsione aggiunge ${r0(planned)} kcal.` : `Restano ${r0(left)} kcal, la previsione ne vale ${r0(planned)}.`} Togli qualche riga con × oppure mangia meno.</p>` : "";
  // sopra il target e senza righe previste: consiglio facoltativo con la scelta piu magra
  const optional = left < 0 && planned === 0 && k === todayKey() ? `<p class="muted small">Sei ${r0(-left)} kcal sopra il target di oggi. Se stasera vuoi comunque mangiare qualcosa di magro, la scelta più leggera è albume: 200 g, circa 90 kcal e 21 g di proteine. È facoltativo, decidi tu.</p>` : "";
  return `<section class="card"><h2 class="plan-h2">Previsione della giornata</h2><button class="link plan-edit" data-act="myplan-edit">Modifica previsione</button>${warn}${optional}${planItemsHtml()}<div class="btns"><button class="btn primary" data-act="fv-open">Aggiungi cibo o piatto</button>${S.plannedDinner ? `<button class="btn" data-act="plan-regen">Rigenera</button><button class="btn danger" data-act="plan-clear">Cancella</button>` : ""}</div></section>`;
}
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

// Doppioni tra i propri alimenti: stessi valori, nomi diversi (o uguali con spazi diversi).
function duplicateGroups() {
  const groups = [];
  // stesso nome (anche con valori diversi) o stessi valori con nomi diversi
  S.customFoods.forEach((f) => {
    const nameKey = "n:" + norm(f.name).trim();
    const valKey = "v:" + [f.kcal, f.p, f.c, f.f].map((x) => Math.round((+x || 0) * 2) / 2).join("|");
    [nameKey, valKey].forEach((key) => {
      const g = groups.find((x) => x.key === key);
      if (g) { if (!g.items.includes(f)) g.items.push(f); } else groups.push({ key, items: [f] });
    });
  });
  return groups.filter((g) => g.items.length > 1);
}
function duplicatesBanner() {
  const groups = duplicateGroups();
  if (!groups.length) return "";
  const names = groups.map((g) => g.items.map((x) => `"${esc(x.name)}"`).join(" e ")).join("; ");
  return `<div class="warn-line">Hai alimenti doppi: ${names}. <button class="link small-link" data-act="dedupe">Cancella i doppioni</button></div>`;
}
function foodDialog() {
  openDialog(`
    <h3>Aggiungi alimento</h3>
    ${duplicatesBanner()}
    <input id="f-slot" type="hidden" value="giorno">
    <input id="f-search" type="search" placeholder="Cerca: pasta, pollo, mela" autocomplete="off" autofocus>
    <div id="f-list" class="list"></div>
    <div class="btns"><button class="btn" data-act="scan-barcode">Scansiona codice a barre</button><label class="btn label-file">Leggi etichetta<input id="label-file" type="file" accept="image/*" class="visually-hidden"></label><button class="btn ghost" data-act="custom-food">Alimento non in lista</button><button class="btn ghost" data-act="import-dialog">Incolla una lista</button><button class="btn ghost" data-act="quick-kcal">Solo calorie</button></div>`);
  renderFoodList("");
}
const norm = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\bcroissant\b/g, "cornetto").replace(/\bbrioche\b/g, "cornetto");
// Un alimento e verificato solo se la fonte e una tabella ufficiale o un'etichetta, non una stima o un valore dichiarato.
const isVerified = (f) => !!(f.barcode || f.verified) || (/CREA|tabella|etichetta/i.test(f.src || "") && !/stima|dichiarat|calcolat/i.test(f.src || ""));
// controllo di coerenza: le calorie devono tornare con i macro, e nessun macro puo superare 100 g per 100 g
const valuesOk = (f) => {
  const k = +f.kcal || 0, p = +f.p || 0, c = +f.c || 0, fat = +f.f || 0;
  if (p > 100 || c > 100 || fat > 100) return false;
  const calc = 4 * p + 4 * c + 9 * fat;
  return k <= 0 || Math.abs(calc - k) <= Math.max(25, k * 0.25);
};
// Stime per gli ingredienti comuni non presenti nel database. Sono stime (per 100 g), e il piatto le dichiara come tali.
const STIMA_INGREDIENTI = {
  // fonte CREA (tabelle di composizione), per 100 g crudo
  "pancetta": { v: [337, 20.9, 0, 28.1], fonte: "CREA: pancetta tesa" },
  "passata di pomodoro": { v: [23, 1, 3.5, 0.2], fonte: "CREA: pomodori maturi" },
  "cipolla": { v: [28, 1.0, 5.7, 0.1], fonte: "CREA: cipolle crude" },
  "carota": { v: [41, 1.1, 7.6, 0.2], fonte: "CREA: carote crude" },
  "sedano": { v: [23, 2.3, 2.4, 0.2], fonte: "CREA: sedano crudo" },
  "spinaci": { v: [35, 3.4, 2.9, 0.7], fonte: "CREA: spinaci crudi" },
  // stime dichiarate (nessuna voce CREA trovata)
  "carne macinata": { v: [276, 25.4, 0, 18.6], fonte: "manzo macinato, categoria 20% di grasso (una fonte coerente)" },
  "macinato di manzo": { v: [276, 25.4, 0, 18.6], fonte: "manzo macinato, categoria 20% di grasso (una fonte coerente)" },
  "besciamella": { v: [218, 5.1, 13.6, 15.9], fonte: "media di 2 fonti (Coop, Cookidoo)" },
  "pasta fresca": { v: [340, 12, 66, 4], fonte: "stima" },
  "pasta all'uovo": { v: [340, 12, 66, 4], fonte: "stima" },
  "vino rosso": { v: [73, 0.1, 2.6, 0], fonte: "media di 3 fonti sulle calorie (carboidrati stimati)" },
  "brodo": { v: [5, 0.5, 0.5, 0.2], fonte: "stima" },
  "burro": { v: [758, 0.8, 1.1, 83.4], fonte: "CREA: burro" },
};
const stimaIngrediente = (nome) => { const n = norm(nome).trim(); const k = Object.keys(STIMA_INGREDIENTI).find((x) => n === x || n.startsWith(x)); return k ? { name: k, v: STIMA_INGREDIENTI[k].v, fonte: STIMA_INGREDIENTI[k].fonte } : null; };
// tra alimenti con lo stesso nome vince quello verificato
const byName = (name) => { const n = norm(name).trim(); const all = allFoods().filter((f) => norm(f.name).trim() === n); return all.find((f) => isVerified(f) && valuesOk(f)) || all[0] || null; };
// segno piccolo: spunta verde per i verificati, testo discreto per stime e valori da controllare
const sourceBadge = (f) => !valuesOk(f) ? `<span class="mark warn" title="da controllare">da controllare</span>` : isVerified(f) ? `<span class="mark ok" title="verificato">✓ ver.</span>` : `<span class="mark warn" title="stima">stima</span>`;
const foodItem = (f) => {
  const item = `<button class="item" data-act="pick-food" data-food="${esc(JSON.stringify(f))}"><span>${esc(f.name)} ${sourceBadge(f)}</span><span class="muted small">${r0(f.kcal)} kcal ${f.perServing ? "per porzione" : "per 100 g"}</span></button>`;
  return S.customFoods.some((x) => x.name === f.name) ? `<div class="item-row">${item}<button class="x" data-act="del-custom" data-name="${esc(f.name)}" aria-label="Elimina">×</button></div>` : item;
};

// Alimenti cercati e non trovati: finiscono nel report, così posso aggiungerli alla lista con valori da fonti affidabili.
function prunedWanted() {
  S.wanted = S.wanted.filter((w) => w.name.length <= 40 && !/kcal/i.test(w.name) && (() => { const t = norm(w.name).split(/\s+/).filter((x) => x.length > 1); return !allFoods().some((f) => t.every((x) => norm(f.name).includes(x))); })());
  return S.wanted;
}
let wantedTimer = null;
function trackMissing(q) {
  clearTimeout(wantedTimer);
  wantedTimer = setTimeout(() => {
    const box = $("#f-search");
    if (!box || box.value.trim() !== q || !dlg().open) return;
    const key = norm(q).trim();
    if (key.length < 3 || key.length > 40 || /kcal/.test(key) || S.wanted.some((w) => norm(w.name).trim() === key)) return;
    S.wanted.push({ name: q, date: todayKey() });
    save();
  }, 1500);
}

// ---------- Lista personale che impara dai pasti ----------
// Ogni alimento registrato entra nella lista personale (una sola volta per nome), così la ricerca lo ritrova anche se compare una volta sola.
function rememberFood(f) {
  const key = norm(f.name).trim();
  if (!key) return;
  const prev = S.customFoods.find((x) => norm(x.name).trim() === key);
  const seen = (prev && prev.seen ? prev.seen : 0) + 1;
  const keep = prev ? { ...prev } : {};
  S.customFoods = S.customFoods.filter((x) => norm(x.name).trim() !== key).concat({ ...keep, ...f, seen, cat: "I miei alimenti" });
}
// Ricerca tollerante: parole in qualsiasi ordine, accenti ignorati, piccoli errori di battitura (es. Tronky per Tronchi).
function lev(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function tokenScore(t, words) {
  let best = 0;
  for (const w of words) {
    if (w === t) return 3;
    if (w.startsWith(t)) best = Math.max(best, 2);
    else if (t.length >= 5 && lev(t, w.slice(0, t.length + 1)) <= Math.max(1, Math.floor(t.length * 0.2))) best = Math.max(best, 1); // tolleranza stretta: niente falsi abbinamenti tipo lasagna-banana
  }
  return best;
}
function searchFoods(q) {
  // nomi brevi come "Pane bianco" puntano all'alimento giusto del database
  const alias = Object.keys(FOOD_ALIAS).find((k) => norm(k).trim() === norm(q).trim());
  if (alias) q = FOOD_ALIAS[alias];
  const tokens = norm(q).split(/[^a-z0-9]+/).filter((t) => t.length > 1 && !["al", "alla", "di", "con", "e", "il", "la"].includes(t));
  if (!tokens.length) return [];
  return allFoods()
    .map((f) => {
      const words = norm(f.name).split(/[^a-z0-9]+/).filter(Boolean);
      const scores = tokens.map((t) => tokenScore(t, words));
      if (scores.some((x) => x === 0)) return null;
      return { f, score: scores.reduce((a, b) => a + b, 0) + (f.seen ? Math.min(f.seen, 10) * 0.1 : 0) };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.f)
    .slice(0, 40);
}

function renderFoodList(q) {
  const ql = q.trim();
  const recents = ql ? [] : recentFoods();
  const list = ql ? searchFoods(ql) : [];
  if (/kcal/i.test(ql) || ql.length > 60) {
    $("#f-list").innerHTML = `<p class="small">Sembra un riepilogo di più alimenti, non il nome di un alimento.</p><button class="btn primary wide" data-act="diary-from-search">Importa come riepilogo</button>`;
    return;
  }
  if (!ql) {
    $("#f-list").innerHTML = (recents.length ? `<div class="muted small">Usati di recente</div>${recents.map(foodItem).join("")}` : "") +
      `<div class="muted small">Categorie</div><div class="chips">${[...new Set(allFoods().map((f) => f.cat))].map((c) => `<button class="chip" data-act="food-cat" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>`;
    return;
  }
  $("#f-list").innerHTML = list.length ? list.map(foodItem).join("") : `<p class="muted small">Nessun risultato. L'ho segnato nella lista degli alimenti da aggiungere. Intanto usa il codice a barre, "Alimento non in lista" o "Solo calorie".</p>`;
  if (!list.length && ql.length >= 3) trackMissing(ql);
}

// ---------- Modifica di una voce e copia da data ----------
function entryList(k, kind) { return kind === "drink" ? day(k).drinks : day(k).meals; }
function editDialog(kind, id, k) {
  const it = entryList(k, kind).find((x) => x.id === id);
  if (!it) return;
  const qty = kind === "drink" ? it.ml : it.g;
  const fld = (fid, label, v, extra = "") => `<div class="field"><label for="${fid}">${label}</label><input id="${fid}" type="text" inputmode="decimal" value="${v === null || v === undefined ? "" : r1(v)}" ${extra}></div>`;
  openDialog(`
    <h3>Modifica</h3>
    <div class="field"><label for="ed-name">Nome</label><input id="ed-name" type="text" value="${esc(it.name)}"></div>
    <div class="grid2">
      ${qty ? fld("ed-qty", kind === "drink" ? "Quantità (ml)" : "Quantità (g)", qty) : ""}
      ${fld("ed-kcal", "Calorie (kcal)", it.kcal)}
      ${kind === "drink" ? fld("ed-c", "Carboidrati (g)", it.c) : fld("ed-p", "Proteine (g)", it.p) + fld("ed-c", "Carboidrati (g)", it.c) + fld("ed-f", "Grassi (g)", it.f)}
    </div>
    ${qty ? '<p class="muted small">Se cambi la quantità, calorie e macro si riscalano in proporzione; puoi poi correggerli a mano.</p>' : ""}
    <div class="field"><label for="ed-date">Data</label><input id="ed-date" type="date" value="${k}" max="${todayKey()}"></div>
    <div class="btns"><button class="btn ghost" data-act="ed-date-set" data-d="${addDays(k, -1)}">Giorno prima</button><button class="btn ghost" data-act="ed-date-set" data-d="${todayKey()}">Oggi</button></div>
    <button class="btn primary wide" data-act="save-entry">Salva modifiche</button>`);
  dlg().dataset.kind = kind; dlg().dataset.id = id; dlg().dataset.from = k;
  dlg().dataset.orig = JSON.stringify({ qty: qty || 0, kcal: it.kcal, p: it.p || 0, c: it.c || 0, f: it.f || 0 });
}
function scaleEdit(v) {
  const o = JSON.parse(dlg().dataset.orig);
  const q = num1(v);
  if (!(o.qty > 0) || !(q > 0)) return;
  const r = q / o.qty, set = (id, val) => { const el = $("#" + id); if (el) el.value = r1(val); };
  set("ed-kcal", o.kcal * r); set("ed-p", o.p * r); set("ed-c", o.c * r); set("ed-f", o.f * r);
}
function copyDialog() {
  openDialog(`
    <h3>Copia da data</h3>
    <p class="muted small">Scegli il giorno da cui copiare: gli alimenti selezionati si aggiungono a ${view.date === todayKey() ? "oggi" : esc(fmtDate(view.date, { day: "numeric", month: "long" }))}.</p>
    <div class="field"><label for="cp-date">Copia da</label><input id="cp-date" type="date" value="${addDays(view.date, -1)}" max="${todayKey()}"></div>
    <div id="cp-list"></div>`);
  renderCopyList(addDays(view.date, -1));
}
function renderCopyList(from) {
  const box = $("#cp-list");
  if (!box) return;
  if (!from || from === view.date) { box.innerHTML = `<p class="muted small">Scegli un giorno diverso da quello aperto.</p>`; return; }
  const d = day(from);
  const rows = d.meals.map((x, i) => ({ kind: "meal", i, x })).concat(d.drinks.map((x, i) => ({ kind: "drink", i, x })));
  if (!rows.length) { box.innerHTML = `<p class="muted small">Nessun alimento registrato in quel giorno.</p>`; return; }
  const tot = rows.reduce((a, r) => a + r.x.kcal, 0);
  box.innerHTML = `<p class="small">${rows.length} voci, ${r0(tot)} kcal in totale.</p>
    ${rows.map((r) => `<label class="di-chk cp-row"><input type="checkbox" data-cp="${r.kind}" data-i="${r.i}"> <span><b>${esc(r.x.name)}</b><br><span class="muted small">${r0(r.x.kcal)} kcal${r.kind === "drink" ? ", " + r0(r.x.ml) + " ml" : r.x.g ? ", " + r0(r.x.g) + " g" : ""}</span></span></label>`).join("")}
    <button class="btn primary wide" data-act="copy-run">Copia nel giorno aperto</button>`;
}

// ---------- Ricalcolo storico con anteprima ----------
// Confronta ogni alimento con grammi del diario con la lista attuale; mostra le differenze e applica solo quelle scelte.
function historyChanges() {
  const out = [];
  Object.keys(S.days).sort().forEach((k) => {
    S.days[k].meals.forEach((m) => {
      if (!m.g) return;
      const name = FOOD_ALIAS[(m.ref && m.ref.name) || m.name] || (m.ref && m.ref.name) || m.name;
      const cur = allFoods().find((f) => !f.perServing && norm(f.name) === norm(name));
      if (!cur) return;
      const n = { kcal: (cur.kcal * m.g) / 100, p: (cur.p * m.g) / 100, c: (cur.c * m.g) / 100, f: (cur.f * m.g) / 100 };
      if (Math.abs(n.kcal - m.kcal) > 1 || Math.abs(n.p - m.p) > 0.3 || Math.abs(n.c - m.c) > 0.3 || Math.abs(n.f - m.f) > 0.3) out.push({ k, id: m.id, m, cur, n });
    });
  });
  return out;
}
let histLinks = [];
function historyLinkCandidates() {
  const out = [];
  Object.keys(S.days).sort().forEach((k) => {
    S.days[k].meals.forEach((m) => {
      if (m.g || m.ref || !m.name || /^Stima$/.test(m.name)) return;
      const cands = searchFoods(m.name).filter((f) => !f.perServing).slice(0, 5);
      if (cands.length) out.push({ k, id: m.id, m, cands });
    });
  });
  return out;
}
function historyDialog() {
  const ch = historyChanges();
  const links = historyLinkCandidates();
  histLinks = links;
  if (!ch.length && !links.length) return openDialog(`<h3>Nessuna differenza</h3><p class="muted small">Non ci sono voci da aggiornare o da collegare.</p>`);
  const dk = ch.reduce((a, x) => a + (x.m.kcal - x.n.kcal), 0);
  dlg().dataset.hist = JSON.stringify(ch.map((x) => ({ k: x.k, id: x.id })));
  openDialog(`
    <h3>Ricalcolo con i valori aggiornati</h3>
    ${ch.length ? `<p class="muted small">${ch.length} voci con grammi cambiano. Prima di applicare, esporta un backup dal Profilo.</p>
    ${ch.map((x, i) => `<label class="di-chk cp-row"><input type="checkbox" data-hist="${i}" checked> <span><b>${esc(x.m.name)}</b> (${fmtDate(x.k, { day: "numeric", month: "short" })})<br><span class="muted small">${r0(x.m.kcal)} kcal, ora ${r0(x.n.kcal)} kcal, grammi ${r0(x.m.g)}</span></span></label>`).join("")}
    <button class="btn primary wide" data-act="hist-apply-verified">Applica tutte le voci da fonte verificata (CREA, INRAN, Consorzio)</button>
    <button class="btn ghost wide" data-act="hist-apply">Applica solo le voci selezionate</button>` : ""}
    ${links.length ? `<h3>Collega le voci senza grammi</h3><p class="muted small">Ho preselezionato l'alimento più simile e stimato i grammi dalle calorie della voce: controlla e correggi, poi conferma. Scegli "non collegare" per le voci da non toccare.</p>
    ${links.map((x, i) => `<div class="link-row"><div><b>${esc(x.m.name)}</b> <span class="muted small">(${fmtDate(x.k, { day: "numeric", month: "short" })}, ${r0(x.m.kcal)} kcal)</span></div>
      <select data-lk="${i}"><option value="">non collegare</option>${x.cands.map((f, j) => `<option value="${j}" ${j === 0 ? "selected" : ""}>${esc(f.name)}</option>`).join("")}</select>
      <input type="number" inputmode="numeric" min="1" data-lg="${i}" value="${x.cands[0].kcal ? Math.round((x.m.kcal * 100) / x.cands[0].kcal) : ""}" placeholder="grammi"></div>`).join("")}
    <button class="btn primary wide" data-act="hist-link">Collega e aggiorna le voci scelte</button>` : ""}`);
}

// ---------- Ricalcolo con i valori aggiornati ----------
const FOOD_ALIAS = { "Pane bianco": "Pane bianco (tipo 00)", "Mozzarella": "Mozzarella di vacca", "Parmigiano": "Parmigiano Reggiano", "Manzo magro (crudo)": "Manzo magro (fesa, crudo)", "Petto di tacchino (crudo)": "Fesa di tacchino (cruda)", "Lonza di maiale (cruda)": "Lonza di maiale (lombo leggero, crudo)" };
function recalcChanges(k) {
  const out = [];
  day(k).meals.forEach((m) => {
    if (!m.ref || !m.g) return;
    const name = FOOD_ALIAS[m.ref.name] || m.ref.name;
    const cur = allFoods().find((f) => f.name === name);
    if (!cur) return;
    const n = { kcal: (cur.kcal * m.g) / 100, p: (cur.p * m.g) / 100, c: (cur.c * m.g) / 100, f: (cur.f * m.g) / 100 };
    if (Math.abs(n.kcal - m.kcal) > 0.5 || Math.abs(n.p - m.p) > 0.2 || Math.abs(n.c - m.c) > 0.2 || Math.abs(n.f - m.f) > 0.2) out.push({ m, cur, n });
  });
  return out;
}

// ---------- Commento della giornata ----------
const SWEET_RE = /cioccolat|kinder|nutella|biscott|merendin|gelato|patatine|pringles|snack|dolc|torta|tiramis|brioche|croissant|cornetto|galletta|nocciol|caramell|barretta|crema/i;
// Panoramica di n giorni che finiscono a endKey: giorni tracciati, sgarri calorici e di grassi, medie.
function overview(endKey, n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(endKey, -i);
    if (!isTracked(k)) continue;
    const t = totals(k), tg = baseTargets(k);
    days.push({ k, kcal: t.kcal, f: t.f, tgK: tg.kcal, tgF: tg.fat, overK: t.kcal > tg.kcal * 1.1, overF: t.f > tg.fat * 1.2 });
  }
  const avg = (f) => (days.length ? days.reduce((a, d) => a + f(d), 0) / days.length : null);
  return { days, n, over: days.filter((d) => d.overK), overF: days.filter((d) => d.overF), avgK: avg((d) => d.kcal), avgF: avg((d) => d.f), tgK: avg((d) => d.tgK), tgF: avg((d) => d.tgF) };
}
const shortDay = (k) => fmtDate(k, { weekday: "short", day: "numeric" });

function dayComment(k) {
  const d = day(k), t = totals(k), tg = targets(k);
  if (!d.meals.length) return null;
  // il consiglio parte da quanto hai mangiato piu quanto e gia previsto: non suggerisce cio che c'e gia
  const pl = (k >= todayKey() && S.plannedDinner ? parseDiary(S.plannedDinner) : []).reduce((a, x) => ({ kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  const clean = (n) => String(n).replace(/\s*\(.*$/, "").replace(/\s+/g, " ").trim();
  const merged = {};
  d.meals.forEach((m) => { const key = clean(m.name).toLowerCase(); const x = merged[key] || { name: clean(m.name), kcal: 0, p: 0, c: 0, f: 0, g: 0 }; x.kcal += m.kcal; x.p += m.p; x.c += m.c; x.f += m.f; x.g += m.g || 0; merged[key] = x; });
  const items = Object.values(merged)
    .concat(d.drinks.map((x) => ({ name: x.name, kcal: x.kcal, p: 0, c: x.c, f: 0, g: x.ml })));
  const top = (key, n = 3) => items.filter((x) => x[key] > 0.4).sort((a, b) => b[key] - a[key]).slice(0, n);
  const list = (arr, key, unit) => arr.map((x) => `${shortName(x.name)} (${r0(x[key])} ${unit})`).join(", ");
  const ratio = t.kcal / tg.kcal;
  const verdict = ratio <= 1.05 ? { lvl: "good", text: "Giornata in linea" } : ratio <= 1.25 ? { lvl: "warn", text: "Giornata un po' sopra l'obiettivo" } : { lvl: "bad", text: "Giornata fuori obiettivo" };
  if (verdict.lvl === "good" && t.f > tg.fat * 1.25) { verdict.lvl = "warn"; verdict.text = "Calorie in linea ma grassi troppo alti"; }
  const lines = [];
  const diff = t.kcal - tg.kcal;
  // se la cena prevista supera il resto della giornata, niente consigli su pranzo e cena
  const overPlanned = !!S.plannedDinner && k >= todayKey() && parseDiary(S.plannedDinner).length > 0 && tg.kcal - t.kcal - parseDiary(S.plannedDinner).reduce((a, x) => a + x.kcal, 0) <= 0;
  lines.push({ lvl: ratio <= 1.05 ? "good" : verdict.lvl, text: diff > 0 ? `Hai assunto ${r0(t.kcal)} kcal contro un obiettivo di ${r0(tg.kcal)}: ${r0(diff)} kcal in più.` : `Hai assunto ${r0(t.kcal)} kcal su ${r0(tg.kcal)}: sei dentro l'obiettivo.` });
  if (diff > tg.kcal * 0.1) lines.push({ lvl: "bad", text: `Oggi: ${r0(diff)} kcal sopra il target, cioè ${Math.round((t.kcal / tg.kcal) * 100)}%. Le voci più pesanti sono ${list(top("kcal"), "kcal", "kcal")}.` });
  else if (diff > 0) lines.push({ lvl: "warn", text: `Oggi sei sopra di poco. Le voci più pesanti sono ${list(top("kcal"), "kcal", "kcal")}.` });
  const bySlot = (s) => d.meals.filter((m) => m.slot === s).reduce((a, m) => a + m.kcal, 0);
  const fOver = t.f - tg.fat;
  const wk = periodStats(k, 7);
  const wkOk = wk.tracked >= 3;
  if (fOver > tg.fat * 0.1) lines.push({ lvl: wkOk && wk.f <= wk.pTarget * 0 + tg.fat * 1.05 ? "warn" : "bad", text: `Grassi a ${r0(t.f)} g contro ${r0(tg.fat)} g: ${r0(fOver)} g in più, circa ${r0(fOver * 9)} kcal. Pesano soprattutto ${list(top("f"), "f", "g")}.` });
  if (wkOk) {
    const ov = overview(k, 7), prev = overview(addDays(k, -7), 7);
    const trend = ov.avgK !== null && prev.avgK !== null ? ov.avgK - prev.avgK : null;
    const sgK = ov.over.map((d) => `${shortDay(d.k)}: ${r0(d.kcal - d.tgK)} kcal in più`).join("; ");
    const sgF = ov.overF.map((d) => shortDay(d.k)).join(", ");
    const parts = [];
    parts.push(`Questa settimana hai tracciato ${ov.days.length} giorni su 7. Sgarri calorici: ${ov.over.length}${ov.over.length ? `: ${sgK}` : ""}. Giorni con grassi sopra il limite: ${ov.overF.length}${ov.overF.length ? ` (${sgF})` : ""}.`);
    parts.push(`Media settimanale: ${r0(ov.avgK)} kcal contro ${r0(ov.tgK)}, grassi ${r0(ov.avgF)} g contro ${r0(ov.tgF)}.`);
    if (trend !== null) parts.push(trend > 50 ? `Rispetto alla settimana scorsa stai mangiando di più (+${r0(trend)} kcal di media).` : trend < -50 ? `Rispetto alla settimana scorsa stai mangiando meno (${r0(trend)} kcal di media): buon segno.` : "Rispetto alla settimana scorsa il livello è stabile.");
    const m30 = overview(k, 30);
    if (m30.days.length >= 10) parts.push(`Ultimi 30 giorni: ${m30.over.length} sgarri calorici su ${m30.days.length} giorni tracciati, media ${r0(m30.avgK)} kcal.`);
    const ok = ov.over.length <= 1 && ov.overF.length <= 2;
    lines.push({ lvl: ok ? "good" : "bad", text: parts.join(" ") });
    const sg = ov.over.length, sgFat = ov.overF.length;
    const who = S.profile && S.profile.name ? S.profile.name : "";
    const greet = (t) => (who ? `${who}, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : t);
    const closing = sg === 0 && sgFat <= 1
      ? greet("Settimana in linea, senza sgarri calorici.")
      : sg <= 1 && sgFat <= 2
        ? greet(`Settimana quasi in linea: ${sg} ${sg === 1 ? "sgarro calorico" : "sgarri caloric"} e ${sgFat} giorni di grassi alti.`)
        : greet(`Questa settimana ci sono ${sg} sgarri calorici e ${sgFat} giorni di grassi alti. Conta la media dei giorni, non il singolo sgarro.`);
    lines.push({ lvl: sg <= 1 ? "good" : "bad", text: closing });
  }
  const cOver = t.c - tg.carbs;
  if (cOver > tg.carbs * 0.1) lines.push({ lvl: "warn", text: `Troppi carboidrati: ${r0(t.c)} g su ${r0(tg.carbs)}, ${r0(cOver)} g in più, circa ${r0(cOver * 4)} kcal. Vengono soprattutto da ${list(top("c"), "c", "g")}.` });
  if (t.p < tg.protein * 0.85) {
    // mancano grammi di proteine: suggerisco due alimenti magri del database, con la quantità che li copre
    const gap = tg.protein - t.p;
    const lean = allFoods().filter((f) => !f.perServing && f.p >= 18 && f.kcal > 0 && f.kcal <= 250 && !NOT_FOR_DIET.test(f.name)).sort((a, b) => b.p / b.kcal - a.p / a.kcal).slice(0, 2);
    const hints = lean.map((f) => `${shortName(f.name).toLowerCase()} circa ${Math.min(250, Math.round(gap / (f.p / 100) / 10) * 10)} g`).join(", oppure ");
    lines.push({ lvl: "warn", text: `Proteine basse: ${r0(t.p)} g su ${r0(tg.protein)}, mancano circa ${r0(gap)} g. ${overPlanned ? "La previsione è già piena: per aggiungere proteine conviene sostituire qualcosa di previsto con una fonte proteica." : `Per arrivarci con cibo vero: ${hints || "aggiungi una fonte magra a ogni pasto"}.`}` });
  }
  else lines.push({ lvl: "good", text: `Proteine a posto: ${r0(t.p)} g su ${r0(tg.protein)}.` });
  const sweet = items.filter((x) => SWEET_RE.test(x.name));
  const sweetKcal = sweet.reduce((a, x) => a + x.kcal, 0);
  if (sweetKcal >= Math.max(150, t.kcal * 0.12)) lines.push({ lvl: "warn", text: `Snack e dolci: ${r0(sweetKcal)} kcal, il ${Math.round((sweetKcal / t.kcal) * 100)}% della giornata (${sweet.sort((a, b) => b.kcal - a.kcal).slice(0, 3).map((x) => shortName(x.name)).join(", ")}). Sono calorie facili da evitare.` });
  if (t.alcKcal > 0) lines.push({ lvl: "warn", text: `Alcol: ${r0(t.alcKcal)} kcal. Non sazia e rallenta l'uso dei grassi come energia.` });
  if (t.exMin === 0 && t.steps < 5000) lines.push({ lvl: "warn", text: "Nessun movimento registrato: il consumo è solo quello di base." });
  else lines.push({ lvl: "good", text: `Movimento: ${r0(t.exMin)} minuti di allenamento e ${t.steps} passi.` });
  const pranzoLibero = !d.meals.some((m) => m.slot === "pranzo");
  // il pranzo con pochi carboidrati non si cucina a pasta: si usano fette di pane da 30 g
  const lunchCarbText = (c) => {
    const g = Math.round(c / 0.79 / 5) * 5;
    if (g >= 60) return `pasta: circa ${g} g a secco`;
    const n = Math.max(1, Math.round(c / 15));
    return `${n} fett${n > 1 ? "e" : "a"} di pane da 30 g`;
  };
  if (!d.closed && k === todayKey() && !overPlanned && !d.meals.some((m) => m.slot === "cena" && m.kcal >= 300)) {
    const rem = tg.kcal - t.kcal, remP = tg.protein - t.p, remF = tg.fat - t.f, remC = tg.carbs - t.c;
    const salumi = items.filter((x) => /prosciutt|salame|pancetta|bresaola|mortadella|speck|wurstel|salsicc|bacon/i.test(x.name));
    const parts = [];
    if (rem <= 0) parts.push(`Il budget di oggi è già coperto dai pasti registrati: non serve aggiungere altro. Se mangi ancora, scegli solo verdura.`);
    else if (rem < 250) parts.push(`Restano solo ${r0(rem)} kcal. Verdura e una fonte magra come 150 g di petto di pollo o pesce bianco, senza condimenti.`);
    else {
      const prot = remP > 15 ? `circa ${Math.min(250, Math.round(remP / 0.233 / 10) * 10)} g di petto di pollo o pesce bianco` : "una fonte magra di proteine";
      parts.push(`Restano circa ${r0(rem)} kcal${remP > 0 ? ` e ${r0(remP)} g di proteine` : ""}. ${pranzoLibero ? `A pranzo ${lunchCarbText(Math.min(Math.max(0, remC - 20) * 0.6, 63))} con verdura, senza secondo, tenendo 20 g di carboidrati per un dolce o uno spuntino. Per il resto della giornata` : "Per il resto della giornata"}: ${prot}, verdura abbondante${remC > 25 ? " e una piccola porzione di carboidrati" : ", senza pane o pasta"}${remF < 12 ? ", niente formaggi, fritti o olio in eccesso" : ", con olio misurato"}.`);
    }
    if (salumi.length >= 2) parts.push("Hai già mangiato più salumi: tanto sale, evita altri salumi e bevi acqua abbondante per non gonfiarti.");
    lines.push({ lvl: "tip", text: parts.join(" ") });
  }
  const remCarb = tg.carbs - t.c - pl.c;
  if (!d.closed && k === todayKey() && !overPlanned && remCarb > 25) {
    // grammi reali da mettere nel piatto: pasta a secco, legumi cotti o una fetta di pane
    if (pranzoLibero) {
      lines.push({ lvl: "tip", text: `Restano circa ${r0(remCarb)} g di carboidrati. A pranzo ${lunchCarbText(Math.min(Math.max(0, remCarb - 20) * 0.6, 63))}, tenendo 20 g per un dolce o uno spuntino. A cena al massimo una fetta di pane da 30 g.` });
    } else {
      const pastaG = Math.round(remCarb / 0.79 / 5) * 5;
      const legumiG = Math.min(250, Math.round(remCarb / 0.163 / 5) * 5);
      lines.push({ lvl: "tip", text: `Restano circa ${r0(remCarb)} g di carboidrati. Per esempio ${pastaG} g di pasta a secco, oppure ${legumiG} g di legumi cotti, oppure una fetta di pane da 30 g.` });
    }
  }
  const st7 = periodStats(k, 7);
  if (st7.tracked >= 3) {
    const perWeek = (st7.balance * 7) / 7700;
    const word = perWeek > 0 ? `sale di circa ${r1(perWeek)} kg a settimana` : `scende di circa ${r1(-perWeek)} kg a settimana`;
    const sg7 = overview(k, 7).over.length;
    const pace = perWeek > 0.05 ? "Con questo ritmo il peso stimato tende a salire." : sg7 >= 2 ? `Ci sono ${sg7} sgarri nei 7 giorni, quindi la stima è incerta.` : sg7 === 1 ? "Lo sgarro di questa settimana pesa sulla stima: il ritmo non è ancora affidabile." : "Con questo ritmo il peso stimato può scendere: continua così nelle misurazioni del lunedì.";
    lines.push({ lvl: perWeek > 0.05 || sg7 >= 2 ? "bad" : sg7 === 1 ? "warn" : "good", text: `Ritmo degli ultimi 7 giorni: il peso stimato ${word}. ${pace}` });
  }
  const tips = [];
  if (fOver > tg.fat * 0.1) tips.push(`riduci le fonti di grassi in cima, ${top("f", 2).map((x) => shortName(x.name)).join(" e ")}, e misura l'olio`);
  if (cOver > tg.carbs * 0.1) tips.push("tieni una sola fonte di carboidrati per pasto");
  if (sweetKcal >= 150) tips.push("limita il dolce a una porzione piccola e programmata");
  // Il recupero parte dal primo sgarro dei 7 giorni fino a oggi e si spalma sui giorni che restano nella finestra.
  const plan = tg.plan;
  const startKey = plan ? plan.startKey : null;
  const cutG = plan ? Math.round(plan.cutKcal / 4 / 5) * 5 : 0;
  const dayNo = plan ? plan.dayNo : 0, daysLeft = plan ? plan.daysLeft : 0;
  if (plan && plan.count >= 2) lines.push({ lvl: "warn", text: `Recupero: dal ${shortDay(startKey)} ci sono ${plan.count} sgarri. Il target resta ridotto per ${plan.span} giorni, fino al ${shortDay(plan.endKey)}.` });
  // alimento proteico che non compare nei pasti recenti: lo proponiamo quando mancano proteine
  let newFood = null;
  if (t.p + pl.p < tg.protein * 0.85 && !overPlanned && tg.kcal - t.kcal > 0) {
    const recent = new Set();
    Object.keys(S.days).filter((j) => j <= k && j > addDays(k, -30)).forEach((j) => S.days[j].meals.forEach((m) => recent.add(norm(m.name))));
    const pick = allFoods().filter((f) => !f.perServing && f.p >= 8 && f.kcal > 0 && f.kcal <= 120 && !recent.has(norm(f.name)) && !NOT_FOR_DIET.test(f.name)).sort((a, b) => b.p / b.kcal - a.p / a.kcal)[0];
    if (pick) {
      const gap = Math.round(tg.protein - t.p - pl.p);
      const n = Math.min(3, Math.ceil(gap / pick.p));
      newFood = { name: pick.name, gap, n, covered: Math.round(n * pick.p), rest: Math.max(0, gap - Math.round(n * pick.p)) };
    }
  }
  // tutto il percorso dall'inizio dell'uso dell'app
  let journey = null;
  const firstDay = Object.keys(S.days).filter((j) => S.days[j].meals.length).sort()[0];
  if (firstDay && firstDay <= k) {
    const n = Math.min(365, Math.round((parseKey(k) - parseKey(firstDay)) / 86400000) + 1);
    const all = overview(k, n);
    const pct = all.days.length ? Math.round((all.over.length / all.days.length) * 100) : 0;
    const lows = sortedMeasures().filter((x) => x.low !== null && x.low !== undefined);
    const lowText = lows.length >= 2 ? ` Vita bassa da ${fmtN(lows[0].low)} a ${fmtN(lows[lows.length - 1].low)} cm.` : "";
    journey = { over: all.over.length, days: all.days.length, pct, lowText };
  }
  // cena prevista: quanto resta per il resto della giornata
  if (S.plannedDinner && k >= todayKey() && !d.closed) {
    const pd = parseDiary(S.plannedDinner);
    const dk = pd.reduce((a, x) => a + x.kcal, 0), dp = pd.reduce((a, x) => a + x.p, 0);
    if (pd.length) {
      const leftK = Math.round(tg.kcal - t.kcal - dk), leftP = Math.round(tg.protein - t.p - dp);
      if (leftK <= 0) lines.push({ lvl: "bad", text: "Con quanto previsto non c'è spazio per il pranzo: niente pasta né pane, al massimo verdura e albume." });
      // pasti bloccati (scritti con la parola "bloccato"): si mangiano per forza, il resto va ridotto
      if (leftK < 0) {
        const each = S.plannedDinner.split("\n").filter((x) => x.trim()).map((l) => ({ fixed: /\b(fisso|bloccato)\b/i.test(l), items: parseDiary(l.replace(/,?\s*(fisso|bloccato)\b/i, "")) }));
        const fixedKcal = each.filter((x) => x.fixed).reduce((q, x) => q + x.items.reduce((w, i) => w + i.kcal, 0), 0);
        const free = each.filter((x) => !x.fixed).flatMap((x) => x.items).sort((p, q) => q.kcal - p.kcal);
        if (free.length && each.some((x) => x.fixed)) lines.push({ lvl: "bad", text: `Il pasto bloccato per oggi vale ${r0(fixedKcal)} kcal. Per restare nel target puoi togliere circa ${r0(-leftK)} kcal: per esempio ${free.slice(0, 3).map((x) => x.name).join(", ")}.` });
      }
      lines.push({ lvl: leftK < 0 ? "bad" : "warn", text: `Con la previsione: ${r0(dk)} kcal e ${r0(dp)} g di proteine in più. Restano ${leftK} kcal e ${leftP} g di proteine.` });
    }
  }
  const sgarriWeek = overview(k, 7).over.length;
  const sgarriPrev = overview(addDays(k, -7), 7).over.length;
  if (sgarriWeek >= 1 || sgarriPrev >= 1) {
    const cmp = sgarriWeek < sgarriPrev ? `${sgarriPrev - sgarriWeek} in meno della settimana prima` : sgarriWeek > sgarriPrev ? `${sgarriWeek - sgarriPrev} in più della settimana prima` : "come la settimana prima";
    lines.push({ lvl: sgarriWeek > sgarriPrev ? "bad" : sgarriWeek < sgarriPrev ? "good" : "warn", text: `Settimana: ${sgarriWeek} sgarri, la settimana prima ${sgarriPrev}. Sono ${cmp}.` });
  }
  if (wkOk && wk.kcal > tg.kcal * 1.05) tips.push("la settimana è sopra il target: domani scegli cibi a bassa densità, verdura e proteine, e lascia il pane fuori");
  lines.push({ lvl: "tip", text: tips.length ? `Recupero: ${tips.join("; ")}.` : "Recupero: resta sul target." });
  return { verdict, lines, journey, newFood, overPlanned, remCarb: tg.carbs - t.c - pl.c, lunchOpen: pranzoLibero, isToday: k === todayKey(), cut: cutG, from: startKey ? shortDay(startKey) : "", until: plan ? fmtDate(plan.endKey, { day: "numeric", month: "long" }) : "", count: plan ? plan.count : 0, of: plan ? plan.span : 7, dayNo, daysLeft };
}
function commentHtml(k) {
  const c = dayComment(k);
  if (!c) return "";
  const advice = (l) => `<div class="advice ${l.lvl === "tip" ? "" : l.lvl}"><p>${esc(l.text)}</p></div>`;
  const dinner = [];
  const rest = c.lines.filter((l) => !dinner.includes(l));
  const j = c.journey;
  const head = j && j.over ? `<p class="headline">Dall'inizio: ${j.over} giorni con sgarri su ${j.days} tracciati (${j.pct}%).</p>` : "";
  const fresh = c.newFood ? `<p class="action">Ti mancano ${c.newFood.gap} g di proteine. ${esc(c.newFood.name)}: ${c.newFood.n} ${c.newFood.n > 1 ? "bicchieri" : "bicchiere"} da 100 g, cioè ${c.newFood.covered} g. ${c.newFood.rest > 0 ? `Il resto, circa ${c.newFood.rest} g, da carne o pesce.` : ""}</p>` : "";
  return `<section class="card plan-card"><h2>Adesso<span class="pill ${c.verdict.lvl === "good" ? "ok" : ""}">${esc(c.verdict.text)}</span></h2>${head}${c.lines.filter((l) => l.text.startsWith("Previsto")).map(advice).join("")}${fresh}${dinner.map(advice).join("")}${rest.length ? `<details class="more"><summary>Dettagli (${rest.length})</summary>${rest.map(advice).join("")}</details>` : ""}</section>`;
}

// ---------- Dettaglio di un nutriente: da dove arriva ----------
const shortName = (n) => { const x = n.replace(/^Aggiungi alimento\s*/i, "").split(",")[0].trim(); return x.length > 38 ? x.slice(0, 36).trim() + "..." : x; };
function macroDialog(m, k) {
  const d = day(k), t = totals(k), tg = targets(k);
  const cfg = {
    kcal: { label: "Calorie", unit: "kcal", val: t.kcal, target: tg.kcal, key: "kcal", drinks: "kcal", tip: "Per ridurle agisci sulle voci in cima: porzioni più piccole, condimenti misurati, meno bevande zuccherate o alcoliche." },
    p: { label: "Proteine", unit: "g", val: t.p, target: tg.protein, key: "p", tip: "Le proteine proteggono il muscolo e saziano, e per chi si allena sono la priorità. In deficit il target è 2 g per chilo del peso di riferimento, e 2,2 g nei giorni di recupero: il muscolo resta mentre cala il grasso (la ricerca indica da circa 1,6 g per chilo in su, con prove più forti per il deficit). Parti da loro: per esempio 250 g di pollo o tacchino e 150 g di yogurt greco a sera, poi carboidrati e grassi riempiono le calorie rimaste. Se mancano, aggiungi uova, pesce o legumi." },
    c: { label: "Carboidrati", unit: "g", val: t.c, target: tg.carbs, key: "c", drinks: "c", tip: "Per ridurli, riduci pane, pasta, dolci e bevande zuccherate, e non mettere due fonti di carboidrati nello stesso pasto." },
    f: { label: "Grassi", unit: "g", val: t.f, target: tg.fat, key: "f", tip: "Un grammo di grasso vale 9 kcal. Misura l'olio, un cucchiaio vale circa 90 kcal. Occhio a formaggi, frutta secca, cioccolato, fritti e salumi." },
  }[m];
  const rows = d.meals.map((x) => ({ name: x.name, v: x[cfg.key] || 0, qty: x.g, qu: "g" }))
    .concat(cfg.drinks ? d.drinks.map((x) => ({ name: x.name, v: x[cfg.drinks] || 0, qty: x.ml, qu: "ml" })) : [])
    .filter((x) => x.v > 0.4).sort((a, b) => b.v - a.v);
  const total = rows.reduce((a, x) => a + x.v, 0);
  const diff = cfg.val - cfg.target;
  const over = diff > 0.5;
  const kind = m === "p" ? (diff < 0 ? "mancano" : "ok") : over ? "troppo" : "ok";
  const status = m === "p"
    ? (diff >= 0 ? `Obiettivo raggiunto, ${r0(diff)} ${cfg.unit} in più.` : `Ti mancano ${r0(-diff)} ${cfg.unit} per l'obiettivo.`)
    : (over ? `Sei oltre l'obiettivo di ${r0(diff)} ${cfg.unit}.` : `Sei entro l'obiettivo, ti restano ${r0(Math.max(0, -diff))} ${cfg.unit}.`);
  openDialog(`
    <h3>${cfg.label}: ${r0(cfg.val)} di ${r0(cfg.target)} ${cfg.unit}</h3>
    <p class="${kind === "troppo" || kind === "mancano" ? "bad" : "good"}"><b>${status}</b></p>
    ${rows.length ? rows.map((x) => `<div class="mrow"><div class="mrow-h"><span>${esc(shortName(x.name))}</span><b>${r0(x.v)} ${cfg.unit}</b></div>${x.qty ? `<div class="muted small">${r0(x.qty)} ${x.qu}</div>` : ""}${bar(x.v, total, cfg.key === "kcal" ? "" : cfg.key)}</div>`).join("")
      : `<p class="muted small">Non hai ancora inserito alimenti che ne contengano.</p>`}
    <p class="muted small">${cfg.tip}</p>`);
}

// ---------- Schede di allenamento ----------
// Testo di una scheda: una riga "Giorno A" (o B, C...) seguita dagli esercizi, una riga per esercizio.
function parsePlan(text) {
  const days = [];
  let cur = null;
  text.replace(/[  ]/g, " ").split(/\r?\n/).forEach((raw) => {
    const line = raw.replace(/^[\s\-•*·]+/, "").trim();
    if (!line) return;
    const h = line.match(/^(?:giorno|day|scheda)\s*([A-Za-z0-9]{1,3})\b[\s:.-]*(.*)$/i);
    if (h) { cur = { label: h[1].toUpperCase(), title: h[2].trim(), exercises: [] }; days.push(cur); return; }
    if (cur) cur.exercises.push(line);
  });
  return days.filter((d) => d.exercises.length);
}
function plansDialog() {
  const list = S.plans.map((p) => `<div class="plan">
      <div class="plan-h"><b>${esc(p.name)}</b><button class="link small-link" data-act="plan-del" data-id="${p.id}">Elimina</button></div>
      <div class="btns">${p.days.map((dd) => `<button class="btn small-btn" data-act="plan-day" data-id="${p.id}" data-label="${esc(dd.label)}">Giorno ${esc(dd.label)}</button>`).join("")}</div>
      <button class="link small-link" data-act="plan-copy" data-id="${p.id}">Copia questa scheda</button>
    </div>`).join("");
  openDialog(`
    <h3>Schede di allenamento</h3>
    ${list || `<p class="muted small">Nessuna scheda. Incollane una qui sotto.</p>`}
    <hr>
    <div class="field"><label for="pl-name">Nome della scheda</label><input id="pl-name" type="text" placeholder="Scheda ottobre"></div>
    <div class="field"><label for="pl-text">Scheda</label><textarea id="pl-text" rows="8" placeholder="Giorno A&#10;Squat 4x8 60 kg&#10;Panca piana 3x10 40 kg&#10;Giorno B&#10;Stacco 3x6 80 kg"></textarea></div>
    <button class="btn primary wide" data-act="plan-save">Salva scheda</button>`);
}
function planDayDialog(id, label) {
  const p = S.plans.find((x) => x.id === id);
  const dd = p && p.days.find((x) => x.label === label);
  if (!dd) return;
  openDialog(`
    <h3>Giorno ${esc(label)}: ${esc(p.name)}</h3>
    <ul class="plan-ex">${dd.exercises.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
    <div class="field"><label for="pd-min">Durata in minuti</label><input id="pd-min" type="number" inputmode="numeric" min="1" value="60" autofocus></div>
    <button class="btn primary wide" data-act="plan-log" data-id="${id}" data-label="${esc(label)}">Registra allenamento di oggi</button>`);
}

// ---------- Riepilogo allenamenti incollato ----------
// Una riga per attività: nome, minuti, note facoltative. Esempio: Krav Maga, 75 minuti, corso serale
function parseActivity(text) {
  const out = [], errors = [];
  text.replace(/[  ]/g, " ").split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/^[\s\-•*·\d.)]+(?=\D)/, "").trim();
    if (!line || /^(totale|giorno|riepilogo|nota|stasera|domani)/i.test(line)) return;
    const m = line.match(/(\d+(?:[.,]\d+)?)\s*(?:minuti|minuto|min\b|m\b|')/i) || line.match(/[,;|]\s*(\d+(?:[.,]\d+)?)\s*(?:$|[,;|])/);
    if (!m) return errors.push(`riga ${i + 1}: ${line.slice(0, 40)}`);
    const min = num1(m[1]);
    const name = line.slice(0, m.index).replace(/[,;|:\s-]+$/, "").replace(/\s+(di|per|da|circa)$/i, "").trim() || "Attività";
    const rest = line.slice(m.index + m[0].length).replace(/^[,;|\s-]+/, "").trim();
    const ALIAS = { corsetta: "Corsa leggera", corsa: "Corsa leggera", camminata: "Camminata veloce", bici: "Bicicletta moderata", bicicletta: "Bicicletta moderata", palestra: "Pesi moderato", pesi: "Pesi moderato", nuoto: "Nuoto moderato", yoga: "Yoga", krav: "Krav Maga" };
    const key = norm(name).split(/\s+/)[0];
    const hit = EXERCISES.find((e) => norm(e.name).includes(norm(name)) || norm(name).includes(norm(e.name)) || (ALIAS[key] && e.name.startsWith(ALIAS[key])));
    out.push({ name: hit ? hit.name : name, met: hit ? hit.met : 5, min, note: rest, generic: !hit });
  });
  return { out, errors };
}
function activityDialog() {
  openDialog(`
    <h3>Scrivi o incolla le attività</h3>
    <p class="muted small">Una riga per attività con i minuti, per esempio: Krav Maga, 75 minuti, corso serale. Le attività non in elenco usano una stima generica.</p>
    <div class="field"><textarea id="act-text" rows="7" placeholder="Incolla qui" autofocus></textarea></div>
    <button class="btn primary wide" data-act="activity-save">Aggiungi</button>`);
}

// ---------- Riepilogo incollato: suddivisione in pasti ----------
// Ogni riga con "kcal" diventa un alimento. Le intestazioni Colazione, Pranzo, Cena (anche davanti alla riga) assegnano il pasto.
const SLOT_WORDS = [/^colazione\b/i, /^spuntino( mattina)?\b/i, /^pranzo\b/i, /^merenda\b/i, /^cena\b/i];
const SLOT_NAMES = { colazione: "Colazione", pranzo: "Pranzo", cena: "Cena" };
// Dove di solito mangi questi cibi: serve quando non hai scelto un pasto.
const SLOT_RULES = [
  ["colazione", /yogurt|avena|latte|muesli|corn flakes|fiocchi|biscott|marmellata|miele|whey|proteine|albume/i],
  ["pranzo", /pasta|riso|spaghetti|penne|gnocchi|farro|orzo|couscous|lasagn/i],
  ["cena", /carne|manzo|vitello|pollo|tacchino|pesce|salmone|tonno|verdur|insalata|zucchin|zucca|pane|cotolett|salsiccia|frittata|tomino|pizza/i],
];
const slotFor = (slot, name) => (slot && slot !== "giorno" ? slot : (SLOT_RULES.find(([, re]) => re.test(name)) || ["giorno"])[0]);

const MACRO_WORDS = { p: "proteine|proteina|prot", c: "carboidrati|carboidrato|carbo|carb|zuccheri", f: "grassi|grasso|lipidi|lipide" };
function grabMacro(line, key) {
  const w = `(?:${MACRO_WORDS[key]})\\b\\.?`;
  const after = line.match(new RegExp(`${w}\\s*[:=]?\\s*(?:circa\\s+)?(\\d+(?:[.,]\\d+)?)`, "i"));
  if (after) return num1(after[1]);
  const before = line.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(?:g|gr|grammi|grammo)?\\s*(?:di\\s+)?${w}`, "i"));
  return before ? num1(before[1]) : null;
}
const NEWLINES = new RegExp("[\\r\\n" + String.fromCharCode(8232, 8233) + "]+");
function parseDiary(text) {
  const items = [];
  const clean = text.replace(new RegExp("[" + String.fromCharCode(8216, 8217) + "]", "g"), "'");
  const lines = [];
  clean.split(NEWLINES).forEach((raw) => {
    // più frasi sulla stessa riga: separale dopo il punto
    raw.replace(/([.!])\s+(?=[A-ZÀ-Ý])/g, "$1\n").split("\n").forEach((x) => lines.push(x));
  });
  let pendingName = null; // nome di un alimento scritto su una riga senza calorie, con le calorie sulla riga dopo
  lines.forEach((raw) => {
    // via elenchi e punti (1. 2) •) ma non i numeri delle calorie (70 kcal)
    let line = raw.replace(/^[\s\-•*·]*(\d+[.)]\s+|[\-•*·]\s*)(?=\S)/, "").trim();
    if (!line) return;
    for (const re of SLOT_WORDS) {
      if (re.test(line)) { line = line.replace(re, "").replace(/^[\s:–-]+/, ""); break; }
    }
    if (!line || /^(totale|giornata|in totale|ho stimato|stima per|riepilogo|aggiungi|due cose|stasera|nota|attenzione|sono stime|stime|ecco|ecco il|ecco i|valori|macro)\b/i.test(line)) return;
    const k = line.match(/(\d+(?:[.,]\d+)?)\s*(?:kcal|calorie|cal)\b/i);
    // solo grammi (o una porzione): calorie e macro li calcola l'app dal database
    const nameOnly = line.split(/[,:(]/)[0].replace(/\b(circa|una|un|uno|mezza|mezzo|porzione|piatto|di|da)\b/gi, "").replace(/\d+(?:[.,]\d+)?\s*%?|%/g, "").trim();
    // "Calorie", "Proteine", "Grassi" ecc. sono intestazioni dei macro, non alimenti: non vanno cercati nel database
    const MACRO_LABEL = /^(calorie|kcal|energia|proteine|carboidrati|carbo|grassi|lipidi|macro|valori|totale|p|c|g|f)$/i;
    const dbHit = !k && !MACRO_LABEL.test(nameOnly.trim()) && /^[A-Za-zÀ-ÿ]{3,}/.test(nameOnly) ? searchFoods(nameOnly).find((x) => !x.perServing) : null;
    const gramLine = line.match(/(\d+(?:[.,]\d+)?)\s*g\b(?!\s*di\b)/i);
    const dbG = dbHit ? (gramLine ? num1(gramLine[1]) : /porzione/i.test(line) ? dbHit.portion : null) : null;
    if (dbHit && dbG) {
      const r = dbG / 100;
      items.push({ name: dbHit.name, kcal: dbHit.kcal * r, p: dbHit.p * r, c: dbHit.c * r, f: dbHit.f * r, g: dbG, hasMacro: { p: true, c: true, f: true } });
      return;
    }
    if (!k) {
      // riga di sola descrizione dei macro: appartiene all'alimento precedente
      const last = items[items.length - 1];
      if (last) ["p", "c", "f"].forEach((key) => { const v = grabMacro(line, key); if (v !== null && !last.hasMacro[key]) { last[key] = v; last.hasMacro[key] = true; } });
      else if (!/^(calorie|kcal|energia|proteine|carboidrati|carbo|grassi|lipidi|macro|valori|totale)\b/i.test(line)) pendingName = line.replace(/[,:]\s*$/, "").trim();
      return;
    }
    const colon = line.indexOf(":");
    let name = (colon > 0 && colon < k.index ? line.slice(0, colon) : line.slice(0, k.index).replace(/\bcirca\b.*$/i, "")).replace(/[,\s\-–]+$/, "").trim();
    name = name.replace(/\s*\(.*$/, "").trim() || pendingName || "Alimento";
    if (/^(calorie|kcal|energia|proteine|carboidrati|carbo|grassi|lipidi|macro|valori|totale)$/i.test(name)) {
      // intestazione di un'altra riga: se prima c'era il nome dell'alimento, le calorie vanno a lui; altrimenti i macro vanno al precedente
      if (!items.length && pendingName) {
        items.push({ name: pendingName.charAt(0).toUpperCase() + pendingName.slice(1), kcal: num1(k[1]), p: 0, c: 0, f: 0, g: null, hasMacro: { p: false, c: false, f: false } });
        pendingName = null;
      }
      const prev = items[items.length - 1];
      if (prev) ["p", "c", "f"].forEach((key) => { const v = grabMacro(line.slice(k.index), key); if (v !== null && !prev.hasMacro[key]) { prev[key] = v; prev.hasMacro[key] = true; } });
      return;
    }
    const rest = line.slice(k.index);
    const item = { name: name.charAt(0).toUpperCase() + name.slice(1), kcal: num1(k[1]), p: 0, c: 0, f: 0, g: null, hasMacro: { p: false, c: false, f: false } };
    const gm = line.match(/(\d+(?:[.,]\d+)?)\s*g\b(?!\s*di\b)/i);
    if (gm) item.g = num1(gm[1]);
    ["p", "c", "f"].forEach((key) => { const v = grabMacro(rest, key); if (v !== null) { item[key] = v; item.hasMacro[key] = true; } });
    items.push(item);
    pendingName = null;
  });
  items.forEach((it) => {
    it.noMacro = !it.hasMacro.p && !it.hasMacro.c && !it.hasMacro.f;
    // riga con grammi e senza macro scritti: li prendo dal database con il nome completo (per esempio JUST WHEY (GymBeam))
    if (it.noMacro && it.g) {
      const hit = searchFoods(it.name).find((x) => !x.perServing && norm(x.name).includes(norm(it.name)));
      if (hit) { const r = it.g / 100; it.p = hit.p * r; it.c = hit.c * r; it.f = hit.f * r; it.kcal = hit.kcal * r; it.noMacro = false; }
    }
    delete it.hasMacro;
  });
  return items;
}

function diaryDialog(prefill = "") {
  openDialog(`
    <h3>Incolla un riepilogo dei pasti</h3>
    <p class="muted small">Una riga per alimento, con le calorie e, se vuoi, proteine, carboidrati e grassi, per esempio: Caffè con zucchero: circa 10 kcal, 2,5 g di carboidrati. Le righe di totale vengono ignorate.</p>
    <div class="field"><textarea id="di-text" rows="9" placeholder="Incolla qui il riepilogo" autofocus></textarea></div>
    <button class="btn primary wide" data-act="diary-parse">Analizza</button>`);
  if (prefill) $("#di-text").value = prefill;
}
function diaryPreview(items) {
  dlg().dataset.diary = JSON.stringify(items);
  openDialog(`
    <h3>Controlla gli alimenti</h3>
    <p class="muted small">Togli la spunta a ciò che non vuoi aggiungere. Sono stime: ${items.length} alimenti, ${r0(items.reduce((a, x) => a + x.kcal, 0))} kcal in totale.</p>
    ${items.map((it, i) => `<div class="di-row"><label class="di-chk"><input type="checkbox" data-di="chk" data-i="${i}" checked> <span><b>${esc(it.name)}</b><br><span class="muted small">${r0(it.kcal)} kcal, P ${r1(it.p)} C ${r1(it.c)} G ${r1(it.f)}</span>${it.noMacro ? ' <span class="bad small">macro non letti</span>' : ""}</span></label></div>`).join("")}
    <button class="btn primary wide" data-act="diary-save">Aggiungi al diario</button>`);
  dlg().dataset.diary = JSON.stringify(items);
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
    <video id="bc-video" autoplay playsinline muted></video>
    <p class="muted small" id="bc-status">Inquadra il codice a barre sulla confezione.</p>
    <label class="btn ghost wide label-file">Scatta una foto del codice<input id="bc-file" type="file" accept="image/*" capture="environment" class="visually-hidden"></label>
    <div class="field"><label for="bc-manual">Oppure scrivi le cifre sotto le barre</label><input id="bc-manual" type="text" inputmode="numeric" placeholder="8000000000000"></div>
    <button class="btn primary wide" data-act="bc-lookup">Cerca codice</button>`);
  // foto del codice: funziona anche quando la diretta della fotocamera resta nera
  const file = $("#bc-file");
  if (file) file.addEventListener("change", async () => {
    const f = file.files && file.files[0];
    if (!f) return;
    stopScan();
    const status = (t) => { const el = $("#bc-status"); if (el) el.textContent = t; };
    status("Leggo il codice dalla foto...");
    try {
      await loadZxing();
      const url = URL.createObjectURL(f);
      const hints = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]]]);
      const res = await new ZXing.BrowserMultiFormatReader(hints).decodeFromImageUrl(url);
      URL.revokeObjectURL(url);
      lookupBarcode(res.getText());
    } catch {
      status("Non riesco a leggere il codice dalla foto. Riprova più vicino e dritto, oppure scrivi le cifre a mano.");
    }
  });
  startScan();
}
async function startScan() {
  const status = (t) => { const el = $("#bc-status"); if (el) el.textContent = t; };
  try {
    await loadZxing();
    if (!dlg().open || !$("#bc-video")) return;
    const hints = new Map([[ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A, ZXing.BarcodeFormat.UPC_E]]]);
    scanner = new ZXing.BrowserMultiFormatReader(hints, 300);
    const onResult = (res) => { if (res) { const code = res.getText(); stopScan(); lookupBarcode(code); } };
    // camera posteriore esplicita, cosi il video non resta nero su iPhone
    try {
      await scanner.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: "environment" } } }, "bc-video", onResult);
    } catch {
      await scanner.decodeFromVideoDevice(null, "bc-video", onResult);
    }
    const v = $("#bc-video"); if (v) { v.muted = true; v.setAttribute("playsinline", ""); v.play && v.play().catch(() => {}); }
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
  return { name: p.product_name + brand, kcal: Math.round(kcal), p: r1(+n.proteins_100g || 0), c: r1(+n.carbohydrates_100g || 0), f: r1(+n.fat_100g || 0), portion: Math.round(+p.serving_quantity) || 100, cat: "I miei alimenti", barcode: code, missing, src: "Etichetta: codice a barre" };
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
  $("#f-list").innerHTML = allFoods().filter((f) => f.cat === c).map(foodItem).join("");
}
function qtyDialog(f, slot) {
  openDialog(`
    <h3>${esc(f.name)}</h3>
    <p class="muted small">Per 100 g: ${r0(f.kcal)} kcal, proteine ${f.p} g, carboidrati ${f.c} g, grassi ${f.f} g</p>
    <p class="muted small">${isVerified(f) ? `Verificato. Fonte: ${esc(f.src)}.` : `Stima non verificata${f.src ? ` (${esc(f.src)})` : ""}. Se hai l'etichetta del prodotto, usala per correggere i valori.`}</p>
    ${f.piece ? `<div class="field"><label for="q-n">Pezzi (da ${f.piece} g)</label><input id="q-n" type="text" inputmode="decimal" value="1" autofocus></div>` : ""}
    <div class="field"><label>${f.parts ? "Quanto ne mangi adesso (grammi del piatto)" : "Quantità in grammi"}</label><input id="q-g" type="text" inputmode="decimal"value="${f.piece || f.portion || (f.parts ? Math.round(f.parts.reduce((a, x) => a + (+x.g || 0), 0)) : 100) || 100}"${f.piece ? "" : " autofocus"}></div>
    <div class="chips">${f.parts ? "" : [0.5, 1, 1.5, 2].map((x) => `<button class="chip" data-act="qty" data-g="${Math.round((f.portion || 100) * x)}">${Math.round((f.portion || 100) * x)} g</button>`).join("")}</div>
    <div id="q-prev" class="preview"></div>
    <button class="btn primary wide" data-act="save-food">Aggiungi</button>`);
  dlg().dataset.food = JSON.stringify(f);
  dlg().dataset.slot = slot;
  updateQtyPreview();
}
function updateQtyPreview() {
  const f = JSON.parse(dlg().dataset.food);
  const g = num1($("#q-g").value) || 0;
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

// Alimento gia presente con gli stessi valori (kcal, proteine, carboidrati, grassi): non va duplicato.
function sameValuesFood(f) {
  const near = (a, b) => Math.abs((+a || 0) - (+b || 0)) <= 0.5;
  return allFoods().find((x) => norm(x.name).trim() !== norm(f.name).trim() && near(x.kcal, f.kcal) && near(x.p, f.p) && near(x.c, f.c) && near(x.f, f.f)) || null;
}
function customFoodDialog(prefill = "") {
  const dishSaved = prefill && S.customFoods.find((x) => x.parts && norm(x.name).trim() === norm(prefill).trim());
  if (dishSaved) return dishDialog(dishSaved.name);
  openDialog(`
    <h3>Nuovo alimento</h3>
    <p class="muted small">Copia i valori per 100 g dall'etichetta. Lo trovi poi tra "I miei alimenti".</p>
    <div class="field"><label>Da dove vengono i valori</label>
      <div class="seg" id="c-src"><button type="button" data-act="c-src" data-v="Valori dall'etichetta del prodotto">Etichetta</button><button type="button" data-act="c-src" data-v="Tabella ufficiale">Tabella ufficiale</button><button type="button" data-act="c-src" data-v="Stima, non verificata">Stima</button></div>
    </div>
    <div class="btns">
      <button class="btn wide" data-act="scan-barcode">Scansiona il codice a barre</button>
      <label class="btn ghost wide label-file">Fotografa l'etichetta<input id="label-file" type="file" accept="image/*" class="visually-hidden"></label>
    </div>
    <div class="field"><label>Preferito: lo propone sempre nella previsione</label><select id="c-fav"><option value="0">No</option><option value="1">Sì</option></select></div>
    <div class="field"><label>Nome</label><input id="c-name" type="text" value="${esc(prefill)}" autofocus></div>
    <div class="grid2">
      <div class="field"><label>kcal per 100 g</label><input id="c-kcal" type="number" inputmode="decimal" min="0"></div>
      <div class="field"><label>Porzione tipica (g)</label><input id="c-portion" type="number" inputmode="decimal" min="1" value="100"></div>
      <div class="field"><label>Proteine</label><input id="c-p" type="number" inputmode="decimal" min="0" step="0.1" value="0"></div>
      <div class="field"><label>Carboidrati</label><input id="c-c" type="number" inputmode="decimal" min="0" step="0.1" value="0"></div>
      <div class="field"><label>Grassi</label><input id="c-f" type="number" inputmode="decimal" min="0" step="0.1" value="0"></div>
    </div>
    <button class="btn primary wide" data-act="save-custom">Salva e continua</button>`);
  dlg().dataset.src = "";
  // se l'alimento esiste gia, riprendo i suoi valori e la sua fonte: basta salvare
  // dal mio elenco, oppure dal database se non l'ho ancora salvato a parte
  const ex = prefill && (S.customFoods.find((x) => norm(x.name).trim() === norm(prefill).trim()) || allFoods().find((x) => norm(x.name).trim() === norm(prefill).trim()));
  if (false) {
    // valori verificati (etichetta o tabella): restano bloccati, non si modificano
    ["#c-kcal", "#c-p", "#c-c", "#c-f"].forEach((id) => { const el = $(id); if (el) el.readOnly = true; });
    $("#dlg-body").insertAdjacentHTML("afterbegin", `<p><span class="badge ok">verificato: valori bloccati</span></p>`);
  }
  if (ex) {
    const set = (id, v) => { const el = $(id); if (el && v !== undefined && v !== null) el.value = v; };
    set("#c-kcal", ex.kcal); set("#c-p", ex.p); set("#c-c", ex.c); set("#c-f", ex.f); set("#c-portion", ex.portion || 100);
    dlg().dataset.src = ex.src || "";
    const fv = $("#c-fav"); if (fv) fv.value = ex.fav ? "1" : "0";
    document.querySelectorAll("#c-src button").forEach((b) => b.classList.toggle("active", b.dataset.v === dlg().dataset.src));
  }
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

// ---------- Lettura della tabella nutrizionale con la fotocamera ----------
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  return new Promise((resolve, reject) => {
    const sc = document.createElement("script");
    sc.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
    sc.onload = () => resolve(window.Tesseract);
    sc.onerror = () => reject(new Error("script non caricato"));
    document.head.appendChild(sc);
  });
}
// Trova energia, proteine, carboidrati e grassi per 100 g nel testo dell'etichetta.
function parseLabel(text) {
  const t = text.replace(/\s+/g, " ");
  const num = (m) => (m ? parseFloat(m[1].replace(",", ".")) : null);
  // kcal: prima la cifra scritta accanto a "kcal", poi il valore dopo "/" accanto a kJ
  const energy = t.match(/(\d+[.,]?\d*)\s*(?:kcal|keal|kca|k\s?cal|ky)\b/i) || t.match(/\d+[.,]?\d*\s*k\s?j\s*\/\s*(\d+[.,]?\d*)/i);
  return {
    kcal: num(energy),
    p: num(t.match(/prote\S*[^\d]{0,30}(\d+[.,]?\d*)/i)),
    c: num(t.match(/carboidrati[^\d]{0,30}(\d+[.,]?\d*)/i)),
    f: num(t.match(/grassi[^\d]{0,30}(\d+[.,]?\d*)/i)),
  };
}
async function readLabel(file) {
  if (!file) return;
  toast("Leggo l'etichetta...");
  try {
    const T = await loadTesseract();
    let r;
    try { r = await T.recognize(file, "ita+eng"); } catch { r = await T.recognize(file, "eng"); }
    const text = r.data.text || "";
    const v = parseLabel(text);
    // dopo la foto il nome gia scritto resta, e la fonte e "etichetta"
    const nm = (document.querySelector("#c-name") || {}).value || "";
    customFoodDialog(nm);
    dlg().dataset.src = "Valori dall'etichetta del prodotto";
    document.querySelectorAll("#c-src button").forEach((b) => b.classList.toggle("active", b.dataset.v === dlg().dataset.src));
    const set = (id, x) => { if (x !== null && !isNaN(x)) $("#" + id).value = x; };
    set("c-kcal", v.kcal); set("c-p", v.p); set("c-c", v.c); set("c-f", v.f);
    // il testo letto resta visibile, cosi si capisce cosa correggere
    $("#dlg-body").insertAdjacentHTML("beforeend", `<details class="more"><summary>Testo letto dall'etichetta</summary><pre class="ex">${esc(text.trim() || "(nessun testo riconosciuto)")}</pre></details>`);
    toast(v.kcal == null && v.p == null ? "Non ho riconosciuto i valori: controlla il testo letto e inseriscili a mano" : "Controlla i valori letti prima di salvare");
  } catch (e) {
    toast("Non riesco a leggere l'etichetta: prova con più luce o inserisci i valori a mano");
  }
}

// ---------- Azioni ----------
function act(a, el) {
  const k = view.date;
  const val = (id) => $(id).value;
  const num = (id) => parseFloat($(id).value);
  if (a !== "food-menu") view.foodMenu = false;
  switch (a) {
    case "food-menu": view.foodMenu = !view.foodMenu; break;
    case "prev-day": view.date = addDays(k, -1); resetScroll = true; break;
    case "next-day": view.date = addDays(k, 1); resetScroll = true; break;
    case "goto": view.date = el.dataset.k; view.tab = "oggi"; resetScroll = true; break;
    case "period": view.period = +el.dataset.n; resetScroll = true; break;
    case "food": return foodDialog();
    case "scan-barcode": dlg().dataset.slot = "giorno"; return barcodeDialog();
    case "bc-lookup": stopScan(); return lookupBarcode($("#bc-manual").value);
    case "bc-confirm": {
      const f = JSON.parse(dlg().dataset.pending);
      delete f.missing;
      const twin = sameValuesFood(f);
      if (twin) { closeDialog(); return toast(`Ha gli stessi valori di "${twin.name}": non serve aggiungerlo, usa quello.`); }
      S.customFoods = S.customFoods.filter((x) => x.barcode !== f.barcode).concat(f);
      save();
      return qtyDialog(f, dlg().dataset.slot);
    }
    case "food-cat": return foodCat(el.dataset.c);
    case "ps-add": {
      const f = JSON.parse(el.dataset.food);
      // se scrivi i grammi, i macro si ricalcolano da soli sulla porzione di riferimento
      const grams = num1(val("#ps-g"));
      const n = grams > 0 ? grams / (f.portion || 100) : (num1(val("#ps-n")) || 1);
      const name = grams > 0 ? f.name : (n > 1 ? `${f.name} x ${n}` : f.name);
      day(k, true).meals.push({ id: uid(), slot: "giorno", name, g: grams > 0 ? Math.round(grams) : null, kcal: f.kcal * n, p: f.p * n, c: f.c * n, f: f.f * n });
      rememberFood({ ...f, seen: undefined });
      closeDialog(); toast(`${name} aggiunto`); break;
    }
    case "pick-food": {
      const f = JSON.parse(el.dataset.food);
      if (f.perServing) {
        openDialog(`
          <h3>${esc(f.name)}</h3>
          <p class="muted small">Per porzione: ${r0(f.kcal)} kcal, P ${r1(f.p)} C ${r1(f.c)} G ${r1(f.f)}</p>
          <div class="field"><label for="ps-g">Quanti grammi ne mangi?</label><input id="ps-g" type="text" inputmode="decimal" placeholder="es. 50" autofocus></div>
          <p class="muted small">Oppure, se preferisci, quante porzioni da ${r0(f.portion || 100)} g:</p>
          <div class="field"><label for="ps-n">Quante porzioni?</label><input id="ps-n" type="text" inputmode="decimal" value="1"></div>
          <button class="btn primary wide" data-act="ps-add" data-food="${esc(JSON.stringify(f))}">Aggiungi</button>`);
        break;
      }
      return qtyDialog(f, "giorno");
    }
    case "qty": $("#q-g").value = el.dataset.g; return updateQtyPreview();
    case "save-food": {
      const f = JSON.parse(dlg().dataset.food);
      const g = num1(val("#q-g"));
      if (!(g > 0)) return toast("Inserisci la quantità");
      const ref = { name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, portion: f.portion, cat: f.cat };
      rememberFood({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, portion: f.portion });
      day(k, true).meals.push({ id: uid(), slot: slotFor(dlg().dataset.slot, f.name), name: f.name, g, kcal: (f.kcal * g) / 100, p: (f.p * g) / 100, c: (f.c * g) / 100, f: (f.f * g) / 100, ref });
      closeDialog(); toast("Aggiunto"); break;
    }
    case "custom-food": dlg().dataset.slot = "giorno"; return customFoodDialog();
    case "habit-add": dlg().dataset.slot = "giorno"; return customFoodDialog(el.dataset.name);
    case "habit-later": S.habitSeen = todayKey(); save(); return closeDialog();
    case "c-src": {
      document.querySelectorAll("#c-src button").forEach((b) => b.classList.toggle("active", b === el));
      dlg().dataset.src = el.dataset.v; break;
    }
    case "save-custom": {
      const f = { name: val("#c-name").trim(), fav: val("#c-fav") === "1", kcal: num("#c-kcal"), p: num("#c-p") || 0, c: num("#c-c") || 0, f: num("#c-f") || 0, portion: num("#c-portion") || 100, src: dlg().dataset.src || "" };
      if (!f.name || !(f.kcal >= 0)) return toast("Nome e kcal sono obbligatori");
      if (!f.src) return toast("Scegli da dove vengono i valori");
      const oldV = S.customFoods.find((x) => norm(x.name).trim() === norm(f.name).trim());
      // non sostituisco un alimento verificato con una stima: resta quello verificato
      if (oldV && isVerified(oldV) && !isVerified(f)) return qtyDialog({ ...oldV, cat: "I miei alimenti" }, dlg().dataset.slot);

      // regola fissa: per le stime l'app alza kcal, carboidrati e grassi del 15%, le proteine restano uguali
      const prud = /stima/i.test(f.src) ? 15 : 0;
      if (prud > 0) {
        // stima prudente: alzo kcal, carboidrati e grassi, lascio le proteine com'erano
        const up = (x) => Math.round(x * (1 + prud / 100) * 10) / 10;
        f.kcal = Math.round(f.kcal * (1 + prud / 100)); f.c = up(f.c); f.f = up(f.f);
        f.src = `Stima prudente, +${prud}% su kcal, carboidrati e grassi (proteine invariate). Fonte di partenza: ${f.src}`;
      }
      // valori presi dall'etichetta della confezione: verificati
      if (/etichetta/i.test(f.src) && !prud) f.verified = true;
      const twin = sameValuesFood(f);
      if (twin) return qtyDialog({ ...twin, cat: "I miei alimenti" }, dlg().dataset.slot); // stessi valori: uso l'alimento gia esistente
      S.customFoods = S.customFoods.filter((x) => x.name !== f.name).concat(f);
      save();
      return qtyDialog({ ...f, cat: "I miei alimenti" }, dlg().dataset.slot);
    }
    case "quick-kcal": dlg().dataset.slot = "giorno"; return quickKcalDialog();
    case "save-quick": {
      const kc = num("#k-kcal");
      if (!(kc > 0)) return toast("Inserisci le calorie");
      const p = num("#k-p") || 0;
      const qn = val("#k-name").trim() || "Stima";
      const qc = Math.max(0, (kc * 0.45) / 4), qf = Math.max(0, (kc - p * 4 - kc * 0.45) / 9);
      day(k, true).meals.push({ id: uid(), slot: slotFor(dlg().dataset.slot, qn), name: qn, g: null, kcal: kc, p, c: qc, f: qf });
      if (qn !== "Stima") rememberFood({ name: qn, kcal: kc, p, c: qc, f: qf, portion: null, perServing: true });
      closeDialog(); toast("Aggiunto"); break;
    }
    case "fav-save": {
      S.favFoods = (document.getElementById("fav-foods").value || "").split("\n").map((x) => x.trim()).filter(Boolean);
      save(); toast("Preferiti salvati");
      break;
    }
    case "myplan-edit": {
      openDialog(`<h3>Previsione della giornata</h3><button class="btn wide" data-act="pv-auto">Crea la previsione</button><div class="field"><label for="pv-search">Cerca un alimento che devi mangiare oggi (lo aggiunge ai cibi bloccati)</label><input id="pv-search" type="search" placeholder="per esempio sugo, pasta, albume" autocomplete="off"></div><div id="pv-list" class="list"></div><div class="field"><label for="pv-blocked">Cibi che devi mangiare oggi (non cambiabili), una riga per alimento con i grammi</label><textarea id="pv-blocked" rows="3">${esc(S.blockedToday || "")}</textarea></div><div class="chips" id="pb-cats">${[...new Set(allFoods().map((f) => f.cat))].map((c) => `<button class="chip" data-act="pb-cat" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div><div id="pb-list" class="list"></div><div class="field"><label for="plan-dinner">Previsione suggerita dall'app (puoi modificarla o cancellarla)</label><textarea id="plan-dinner" rows="8">${esc(S.plannedDinner)}</textarea></div><div class="field"><label for="pv-paste">Incolla un riepilogo (viene aggiunto quando salvi)</label><textarea id="pv-paste" rows="4" placeholder="Incolla qui il riepilogo, una riga per alimento"></textarea></div><button class="btn primary wide" data-act="myplan-save">Salva</button>`);
      renderPvList("");
      renderPbList("");
      return;
    }
    case "pv-pick": {
      const name = el.dataset.name;
      const g = prompt(`Quanti grammi di ${name}?`, "100");
      if (!g || !(num1(g) > 0)) break;
      const box = $("#pv-blocked");
      box.value = (box.value.trim() ? box.value.trim() + "\n" : "") + `${name}, ${num1(g)} g`;
      const sv = $("#pv-search"); if (sv) sv.value = "";
      renderPvList("");
      break;
    }
    case "pb-cat": {
      $("#pb-list").innerHTML = allFoods().filter((f) => f.cat === el.dataset.c && !f.perServing).map((f) => `<button class="item" data-act="pb-pick" data-name="${esc(f.name)}"><span>${esc(f.name)}</span><span class="muted small">${r0(f.kcal)} kcal per 100 g</span></button>`).join("");
      break;
    }
    case "pb-pick": {
      const name = el.dataset.name;
      const g = prompt(`Quanti grammi di ${name}?`, "100");
      if (!g || !(num1(g) > 0)) break;
      const box = $("#pv-blocked");
      box.value = (box.value.trim() ? box.value.trim() + "\n" : "") + `${name}, ${num1(g)} g`;
      const sb = $("#pb-search"); if (sb) sb.value = "";
      renderPbList("");
      break;
    }
    case "plan-eat-one": {
      const lines = sortPlanLines(S.plannedDinner);
      const line = lines[+el.dataset.i];
      if (!line) break;
      const items = parseDiary(line.replace(/,?\s*bloccato\b/i, ""));
      if (!items.length) {
        // non riconosciuto: apro subito il modulo per inserirlo, con il nome gia scritto
        const nm = line.replace(/,?\s*bloccato\b/ig, "").replace(/,\s*[\d.,]+\s*g\b.*$/i, "").trim();
        dlg().dataset.slot = "giorno";
        toast("Questo alimento non è nel database: inseriscilo e poi segnalo come mangiato");
        return customFoodDialog(nm);
      }
      const d = day(k, true);
      items.forEach((it) => d.meals.push({ id: uid(), slot: slotFor("giorno", it.name), name: it.name, g: it.g || null, kcal: it.kcal, p: it.p, c: it.c, f: it.f }));
      unblock([line]);
      lines.splice(+el.dataset.i, 1);
      S.plannedDinner = lines.join("\n");
      break;
    }
    case "fv-open": {
      return openDialog(`
        <h3>Aggiungi o correggi un alimento</h3>
        <p class="muted small">Cerca</p>
        <div class="field"><input id="fv-q" type="text" placeholder="Es. fiocchi" autofocus></div>
        <button class="btn primary wide" data-act="fv-search">Cerca</button>
        <button class="btn ghost wide" data-act="fv-mine">I miei alimenti</button>
        <div id="fv-res"></div>
        <button class="btn ghost wide" data-act="habit-open">Alimenti abituali</button>
        <button class="btn ghost wide" data-act="dish-open">Piatto composto (es. pasta e zucca)</button>
        <button class="btn ghost wide" data-act="custom-food">Nuovo alimento</button>`);
    }
    case "dish-open": return dishDialog("");
    case "dish-ing-pick": {
      const row = el.closest(".dish-row"); if (!row) break;
      row.querySelector(".dish-name").value = el.dataset.name;
      const box = row.querySelector(".dish-ing-sugg"); if (box) box.innerHTML = "";
      const g = row.querySelector(".dish-g"); if (g) g.focus();
      break;
    }
    case "dish-pick": {
      const inp = $("#dish-name"); if (inp) inp.value = el.dataset.name;
      $("#dish-sugg").innerHTML = "";
      document.querySelector('[data-act=dish-load]').click();
      break;
    }
    case "dish-load": {
      const nm = val("#dish-name").trim();
      const dish = S.customFoods.find((x) => norm(x.name).trim() === norm(nm).trim() && x.parts);
      if (!dish) return toast("Nessun piatto salvato con questo nome");
      $("#dish-rows").innerHTML = "";
      if (!dish.parts) { toast("Piatto salvato senza elenco ingredienti: l'ingrediente che aggiungi si somma al totale"); break; }
      dish.parts.forEach((pt) => {
        document.querySelector('[data-act=dish-add-row]').click();
        const row = document.querySelectorAll("#dish-rows .dish-row");
        const last = row[row.length - 1];
        last.querySelector(".dish-name").value = pt.name; last.querySelector(".dish-g").value = pt.g;
      });
      toast("Piatto caricato: aggiungi l'ingrediente nuovo e salva");
      break;
    }
    case "dish-add-row": {
      const box = $("#dish-rows"); if (!box) break;
      const i = box.children.length;
      box.insertAdjacentHTML("beforeend", `<div class="dish-row" style="border-top:0.5px solid var(--line);padding:8px 0">
        <div class="field"><label>Ingrediente</label><input class="dish-name" type="text" placeholder="Zucca"></div>
        <div class="grid2">
          <div class="field"><label>Grammi</label><input class="dish-g" type="text" inputmode="decimal" placeholder="es. 200"></div>
          <div class="field"><label>Oppure cucchiai</label><input class="dish-n" type="text" inputmode="decimal" placeholder="es. 3"></div>
        </div>
        <div class="field"><label>Peso di un cucchiaio (g)</label><input class="dish-w" type="text" inputmode="decimal" placeholder="es. 15"></div>
      </div>`);
      break;
    }
    case "dish-save": {
      const name = val("#dish-name").trim();
      const rows = [...document.querySelectorAll("#dish-rows .dish-row")];
      if (!name || !rows.length) return toast("Scrivi il nome e almeno un ingrediente");
      let tg = 0, tk = 0, tp = 0, tc = 0, tf = 0, missing = 0;
      const parts = [];
      const stimati = [];
      const fontiCrea = [];
      // piatto gia salvato senza lista ingredienti: parto dai suoi totali e aggiungo quello che scrivo ora
      const old = S.customFoods.find((x) => norm(x.name).trim() === norm(name).trim());
      if (old && !old.parts && old.portion > 0 && old.kcal > 0) {
        tg = old.portion; tk = old.kcal * old.portion / 100; tp = old.p * old.portion / 100; tc = old.c * old.portion / 100; tf = old.f * old.portion / 100;
      }
      rows.forEach((r) => {
        const ing = r.querySelector(".dish-name").value.trim();
        const num1 = (x) => parseFloat(String(x).replace(",", ".")) || 0;
        let g = num1(r.querySelector(".dish-g").value);
        if (!g) g = num1(r.querySelector(".dish-n").value) * num1(r.querySelector(".dish-w").value);
        if (!ing) return;
        let f = byName(ing) || searchFoods(ing)[0];
        if (!f) { const st = stimaIngrediente(ing); if (st) { f = { name: ing, kcal: st.v[0], p: st.v[1], c: st.v[2], f: st.v[3], stimato: st.fonte === "stima" }; if (st.fonte === "stima") stimati.push(ing); else fontiCrea.push(`${ing} (${st.fonte})`); } }
        if (!g) { missing++; return; }
        parts.push({ name: ing, g });
        if (!f) { missing++; tg += g; return; } // ingrediente sconosciuto: pesa nel piatto ma senza valori, il piatto resta incompleto
        tg += g; tk += f.kcal * g / 100; tp += (f.p || 0) * g / 100; tc += (f.c || 0) * g / 100; tf += (f.f || 0) * g / 100;
      });
      if (!(tg > 0)) return toast("Serve almeno un ingrediente con il peso");
      const complete = old && !old.parts ? 100 : Math.round(((rows.length - missing) / rows.length) * 100);
      const dish = { name, kcal: Math.round(tk / tg * 100), p: Math.round(tp / tg * 1000) / 10, c: Math.round(tc / tg * 1000) / 10, f: Math.round(tf / tg * 1000) / 10, portion: Math.round(tg), src: `Piatto composto, completo al ${complete}%: stima${stimati.length ? `, ingredienti stimati: ${stimati.join(", ")}` : ""}${fontiCrea.length ? `, valori da ${fontiCrea.join("; ")}` : ""}${missing ? ", mancano alcuni ingredienti" : ""}`, parts };
      S.customFoods = S.customFoods.filter((x) => norm(x.name).trim() !== norm(name).trim()).concat(dish);
      save();
      return qtyDialog({ ...dish, cat: "I miei alimenti" }, "giorno");
    }
    case "fv-mine": { view.fvMine = true; $("#fv-q").value = ""; document.querySelector('[data-act=fv-search]').click(); return; }
    case "fv-search": {
      const q = val("#fv-q").trim();
      if (q) view.fvMine = false;
      const res = view.fvMine ? allFoods().filter((f) => f.cat === "I miei alimenti").slice(0, 40) : (q ? searchFoods(q).slice(0, 8) : []);
      // quanto pesa ogni risultato sulla giornata, prima di aggiungerlo
      const k = view.date, tg = targets(k), t = totals(k);
      const planned = parseDiary(S.plannedDinner || "").reduce((a, x) => a + x.kcal, 0);
      const left = tg.kcal - t.kcal - planned;
      $("#fv-res").innerHTML = res.length ? res.map((f) => {
        const g = f.portion || f.piece || 100;
        const kc = Math.round(f.kcal * g / 100);
        const after = Math.round(left - kc);
        const impact = after >= 0 ? `Porzione di ${g} g: ${kc} kcal, restano ${after} kcal.` : `Porzione di ${g} g: ${kc} kcal, sforeresti di ${-after} kcal.`;
        return `<div class="row"><div><div>${esc(f.name)}</div><div class="muted small">${impact}</div></div><span class="row-r"><button class="btn small-btn primary" data-act="fv-add" data-name="${esc(f.name)}" data-g="${g}">Aggiungi</button><button class="btn small-btn ghost" data-act="habit-add" data-name="${esc(f.name)}">Valori</button></span></div>`;
      }).join("") : `<p class="muted small">Nessun risultato: usa "Nuovo alimento".</p>`;
      break;
    }
    case "fv-add": {
      S.plannedDinner = [S.plannedDinner, `${el.dataset.name}, ${el.dataset.g} g`].filter((x) => x && x.trim()).join("\n");
      closeDialog(); toast(`${el.dataset.name} aggiunto alla previsione`); break;
    }
    case "plan-grams": {
      // cambia i grammi di questa riga della previsione
      const line = sortPlanLines(S.plannedDinner)[+el.dataset.i];
      if (!line) break;
      const cur = (line.match(/(\d+(?:[.,]\d+)?)\s*g\b/) || [0, ""])[1];
      return openDialog(`
        <h3>Quantità</h3>
        <p class="muted small">${esc(line.replace(/,?\s*bloccato\b/ig, "").replace(/,\s*[\d.,]+\s*g\b.*$/i, ""))}</p>
        <div class="field"><label for="pg-g">Grammi</label><input id="pg-g" type="text" inputmode="decimal" value="${esc(cur)}" autofocus></div>
        <p class="muted small">Per pesare solo il cibo: appoggia il piatto vuoto sulla bilancia, premi azzera (tara), poi metti il cibo sul piatto: il peso che legge è quello del cibo, senza piatto e posate. Senza bilancia, un cucchiaio da tavola di zucca cotta pesa circa 15 o 20 grammi. Al ristorante chiedi al cameriere quanti grammi è una porzione: spesso lo sanno o lo pesano.</p>
        <button class="btn primary wide" data-act="plan-grams-save" data-i="${el.dataset.i}">Salva</button>`);
    }
    case "plan-grams-save": {
      const lines = sortPlanLines(S.plannedDinner);
      const idx = +el.dataset.i;
      const g = val("#pg-g").replace(",", ".").trim();
      if (!lines[idx] || !(+g > 0)) return toast("Inserisci i grammi");
      lines[idx] = lines[idx].replace(/(\d+(?:[.,]\d+)?)(\s*)g\b/, `${g}$2g`);
      S.plannedDinner = lines.join("\n");
      closeDialog(); toast("Grammi aggiornati"); break;
    }
    case "plan-block-one": {
      // blocca: il cibo resta nella previsione e non viene ridotto dal ricalcolo, ma non passa tra i mangiati
      const line = sortPlanLines(S.plannedDinner)[+el.dataset.i];
      if (!line) break;
      const next = /bloccato/i.test(line) ? line.replace(/,?\s*bloccato\b/ig, "").trim() : line.trim() + ", bloccato";
      S.plannedDinner = S.plannedDinner.split("\n").map((x) => (x === line ? next : x)).join("\n");
      save(); render();
      break;
    }
    case "plan-fav": {
      // segna o toglie il preferito direttamente dalla previsione
      const line = sortPlanLines(S.plannedDinner)[+el.dataset.i];
      if (!line) break;
      const k2 = foodKey(line).replace(/:.*$/, "").trim();
      const f = allFoods().find((x) => norm(x.name).trim().toLowerCase() === k2);
      if (!f) return toast("Prima inserisci l'alimento con valori");
      const mine = S.customFoods.find((x) => norm(x.name).trim() === norm(f.name).trim());
      if (mine) { mine.fav = !mine.fav; }
      else { S.customFoods.push({ name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, portion: f.portion || 100, src: f.src || "Database", fav: true }); }
      save(); toast(mine && !mine.fav ? "Tolto dai preferiti" : "Aggiunto ai preferiti");
      break;
    }
    case "plan-values": {
      // apre il modulo con il nome dell'alimento: si inseriscono i macro corretti (etichetta, codice a barre o foto)
      const line = sortPlanLines(S.plannedDinner)[+el.dataset.i];
      if (!line) break;
      const nm = line.replace(/,?\s*bloccato\b/ig, "").replace(/:.*$/, "").replace(/,\s*[\d.,]+\s*g\b.*$/i, "").replace(/,\s*$/, "").trim();
      dlg().dataset.slot = "giorno";
      return customFoodDialog(nm);
    }
    case "plan-regen": {
      // toglie solo le proposte automatiche (albume, yogurt, tacchino, pane, verdura e quelle gia generate), tiene le righe scritte a mano
      const autoRe = /^(albume|yogurt greco 0%|proteine in polvere|just whey|cotoletta di tacchino|petto di tacchino cotto|pane bianco|verdura cotta senza condimento)\b/i;
      const known = new Set(S.autoAll || []);
      const kept = sortPlanLines(S.plannedDinner).filter((l) => !((autoRe.test(l.trim()) && !/bloccato/i.test(l)) || known.has(l)));
      S.autoLines = []; S.autoAll = [];
      S.plannedDinner = kept.join("\n");
      S.forecastSnap = null; S.autoForecast = true;
      // se le righe scritte superano gia le calorie rimaste, non propongo altro
      const plannedK = parseDiary(kept.join("\n")).reduce((a, x) => a + x.kcal, 0);
      const leftK = targets(view.date).kcal - totals(view.date).kcal;
      const gen = plannedK > leftK ? [] : autoPlan(S.blockedToday || "", kept.join("\n"), view.date).split("\n").filter((x) => x.trim());
      S.autoAll = gen; S.autoLines = gen;
      let tutte = [...kept, ...gen];
      // se le voci bloccate superano le calorie rimaste, tolgo le voci non bloccate (dalla fine) finche entra
      const sopra = () => parseDiary(tutte.join("\n")).reduce((a, x) => a + x.kcal, 0) > leftK;
      // priorita ai carboidrati: entro il 20% in piu del target, il resto va tolto (non bloccato) o ridotto
      const cLim = targets(view.date).carbs * 1.2 - totals(view.date).c;
      const carbRiga = (l) => parseDiary(l).reduce((a, x) => a + (x.c || 0), 0);
      let carbTot = () => tutte.reduce((a, l) => a + carbRiga(l), 0);
      let tolteC = 0;
      while (carbTot() > cLim && tutte.some((l) => !/bloccato/i.test(l) && carbRiga(l) > 0)) {
        // tolgo prima la voce con piu carboidrati e meno proteine
        let best = -1, bc = -Infinity;
        const punteggio = (l) => { const x = parseDiary(l).reduce((a, y) => ({ c: a.c + (y.c || 0), p: a.p + (y.p || 0) }), { c: 0, p: 0 }); return x.c - 2 * x.p; };
        tutte.forEach((l, k) => { if (!/bloccato/i.test(l) && carbRiga(l) > 0 && punteggio(l) > bc) { bc = punteggio(l); best = k; } });
        tutte.splice(best, 1); tolteC++;
      }
      if (carbTot() > cLim) {
        const ecc = carbTot() - cLim; const bloccatiC = tutte.filter((l) => /bloccato/i.test(l)).reduce((a, l) => a + carbRiga(l), 0);
        if (bloccatiC > 0) { const fattore = Math.max(0, (bloccatiC - ecc) / bloccatiC); tutte = tutte.map((l) => (/bloccato/i.test(l) && carbRiga(l) > 0 ? l.replace(/(\d+)\s*g\b/, (m, g) => `${Math.floor(Number(g) * fattore / 10) * 10} g`) : l)); }
      }
      const carbExcess = Math.max(0, carbTot() - targets(view.date).carbs);
      S.carbDebt = S.carbDebt || {}; S.carbDebt[view.date] = Math.round(carbExcess);
      let tolte = 0;
      while (sopra() && tutte.some((l) => !/bloccato/i.test(l))) {
        const i = tutte.map((l, k) => [l, k]).reverse().find(([l]) => !/bloccato/i.test(l))[1];
        tutte.splice(i, 1); tolte++;
      }
      // se resta sopra, riduco le voci bloccate al massimo che entra; la pasta sotto 30 g diventa pane bianco
      const kcalRiga = (l) => { const m = l.match(/(\d+)\s*kcal/i); return m ? Number(m[1]) : 0; };
      const gRiga = (l) => { const m = l.match(/(\d+)\s*g\b/); return m ? Number(m[1]) : 0; };
      let ridotte = [];
      if (sopra()) {
        tutte = tutte.map((l, i) => {
          if (!sopra() || !/bloccato/i.test(l) || !gRiga(l) || !kcalRiga(l)) return l;
          const altre = tutte.filter((_, k) => k !== i).reduce((a, x) => a + kcalRiga(x), 0);
          const budget = Math.max(0, leftK - altre);
          const perG = kcalRiga(l) / gRiga(l);
          let g = Math.floor(budget / perG / 10) * 10;
          if (g >= 30) { ridotte.push(l.split(",")[0]); return l.replace(/(\d+)\s*g\b/, `${g} g`).replace(/(\d+)\s*kcal/i, `${Math.round(g * perG)} kcal`); }
          if (/pasta/i.test(l)) { const kc = Math.round(budget); ridotte.push("pasta sostituita con pane"); return `Pane bianco, ${Math.max(10, Math.round(kc / 2.7 / 10) * 10)} g ${Math.round(kc / 2.7 / 10) * 10 * 2.7} kcal bloccato`; }
          return l;
        });
      }
      // proteine: se ne mancano per il target e restano calorie, aggiungo albume fino al tetto di 400 g in totale (poche calorie, quasi zero carboidrati)
      {
        const kcalRiga2 = (l) => { const m = l.match(/(\d+)\s*kcal/i); return m ? Number(m[1]) : 0; };
        const pSum = tutte.reduce((a, l) => a + parseDiary(l).reduce((x, y) => x + (y.p || 0), 0), 0);
        const kSum = tutte.reduce((a, l) => a + kcalRiga2(l), 0);
        const pMancano = targets(view.date).protein - totals(view.date).p - pSum;
        const kRimaste = leftK - kSum;
        const albumeGia = tutte.filter((l) => /^albume\b/i.test(l.trim())).reduce((a, l) => a + gRiga(l), 0);
        if (pMancano > 5 && kRimaste > 20 && albumeGia < 400) {
          const g = Math.min(400 - albumeGia, Math.floor(kRimaste / 0.45 / 10) * 10, Math.ceil(pMancano / 0.107 / 10) * 10);
          if (g >= 50) { tutte.push(`Albume, ${g} g: circa ${Math.round(g * 0.45)} kcal e ${Math.round(g * 0.107)} g di proteine`); ridotte.push(`albume ${g} g`); }
        }
      }
      S.autoAll = S.autoAll.filter((l) => tutte.includes(l)); S.autoLines = S.autoAll;
      S.plannedDinner = tutte.join("\n");
      toast([tolteC ? `tolte ${tolteC} voci per i carboidrati` : "", tolte ? `tolte ${tolte} voci non bloccate` : "", ridotte.length ? `ridotte: ${ridotte.join(", ")}` : ""].filter(Boolean).join("; ") || "Proposte automatiche aggiornate");
      break;
    }
    case "plan-add-dinner": {
      // la cena che mangi piu spesso negli ultimi 30 giorni (solo i pasti registrati come cena)
      const count = new Map();
      for (let i = 1; i <= 30; i++) {
        const d = S.days[addDays(view.date, -i)];
        (d && d.meals || []).forEach((m) => {
          if (m.slot !== "cena" || !m.g) return;
          const key = norm(m.name).trim();
          const c = count.get(key) || { name: m.name, n: 0, gs: [] };
          c.n++; c.gs.push(m.g); count.set(key, c);
        });
      }
      const cur = new Set(sortPlanLines(S.plannedDinner).map((l) => foodKey(l).replace(/:.*$/, "").trim()));
      const best = [...count.values()].filter((c) => !cur.has(foodKey(c.name))).sort((a, b) => b.n - a.n)[0];
      if (!best) return toast("Non trovo una cena abituale nei giorni passati");
      const gs = best.gs.slice().sort((a, b) => a - b);
      const g = Math.round(gs[Math.floor(gs.length / 2)] / 5) * 5;
      S.plannedDinner = [S.plannedDinner, `${best.name}, ${g} g`].filter((x) => x && x.trim()).join("\n");
      toast(`Aggiunta la cena abituale: ${best.name}`);
      break;
    }
    case "plan-add-fav": {
      // aggiunge in fondo i cibi abituali che non sono gia in previsione e non sono gia stati mangiati oggi
      // confronto sul nome completo, senza grammi e senza la scritta bloccato: niente doppioni
      const cur = new Set(sortPlanLines(S.plannedDinner).map((l) => foodKey(l).replace(/:.*$/, "").trim()));
      const eaten = new Set(((S.days[view.date] || {}).meals || []).map((m) => norm(m.name).trim()));
      const add = favoriteFoods(view.date).filter((f) => !cur.has(foodKey(f.name)) && !eaten.has(norm(f.name).trim())).slice(0, 3);
      if (!add.length) return toast("Nessun cibo abituale da aggiungere");
      S.plannedDinner = [S.plannedDinner, ...add.map((f) => `${f.name}, ${f.g} g`)].filter((x) => x && x.trim()).join("\n");
      toast(`Aggiunto: ${add.map((f) => f.name).join(", ")}`);
      break;
    }
    case "plan-del-one": {
      const lines = sortPlanLines(S.plannedDinner);
      const target = lines[+el.dataset.i];
      if (target) {
        // tolgo la riga e le sue copie (stesso cibo, anche con grammi o nome scritti in modo diverso)
        const grp = foodGroup(foodKey(target));
        unblock([target]);
        S.plannedDinner = lines.filter((l) => foodGroup(foodKey(l)) !== grp).join("\n");
        if (S.autoLines) S.autoLines = S.autoLines.filter((l) => foodGroup(foodKey(l)) !== grp);
      } else S.plannedDinner = lines.join("\n");
      break;
    }
    case "plan-clear": {
      if (!confirm("Cancellare tutta la previsione di oggi?")) break;
      S.plannedDinner = "";
      S.blockedToday = "";
      toast("Previsione cancellata");
      break;
    }
    case "plan-eat": {
      if (!confirm("Spostare la previsione tra i cibi mangiati di oggi?")) break;
      // le righe che non si riconoscono restano nella previsione: nessuna riga viene persa
      const d = day(k, true);
      let moved = 0; const kept = [];
      const movedLines = [];
      S.plannedDinner.split("\n").filter((x) => x.trim()).forEach((line) => {
        const items = parseDiary(line.replace(/,?\s*bloccato\b/i, ""));
        if (!items.length) { kept.push(line); return; }
        movedLines.push(line);
        items.forEach((it) => d.meals.push({ id: uid(), slot: slotFor("giorno", it.name), name: it.name, g: it.g || null, kcal: it.kcal, p: it.p, c: it.c, f: it.f }));
        moved += items.length;
      });
      unblock(movedLines);
      S.plannedDinner = kept.join("\n");
      toast(kept.length ? `${moved} alimenti segnati. Restano ${kept.length} righe non riconosciute.` : `${moved} alimenti segnati come mangiati`);
      break;
    }
    case "pv-auto": {
      const box = $("#plan-dinner");
      S.autoForecast = true; S.forecastSnap = null;
      const kTd = view.date, over = targets(kTd).kcal - totals(kTd).kcal <= 0;
      if (over) toast("Calorie già superate: la previsione non propone altri cibi. Recupererai nei prossimi giorni.");
      if (box) box.value = over ? "" : autoPlan(val("#pv-blocked"), val("#plan-dinner"), kTd);
      S.autoLines = box ? box.value.split("\n").filter((x) => x.trim()) : [];
      break;
    }
    case "pv-paste-add": {
      const txt = val("#pv-paste").trim();
      if (!txt) break;
      const box = $("#plan-dinner");
      box.value = (box.value.trim() ? box.value.trim() + "\n" : "") + txt;
      $("#pv-paste").value = "";
      break;
    }
    case "myplan-save": {
      const extra = val("#pv-paste").trim();
      const base = val("#plan-dinner").trim().split("\n").filter((l) => !/,\s*bloccato$/i.test(l.trim())).join("\n");
      const blocked = val("#pv-blocked").trim();
      S.blockedToday = blocked;
      const blockedLines = blocked ? blocked.split("\n").filter((x) => x.trim()).map((l) => l.trim() + ", bloccato") : [];
      S.plannedDinner = [...blockedLines, base, extra].filter(Boolean).join("\n");
      closeDialog(); break;
    }
    case "tab-misure": view.tab = "misure"; resetScroll = true; break;
    case "measure-today": view.tab = "misure"; view.mEdit = null; view.mDate = k; resetScroll = true; break;
    case "goto-attivita": scrollToId = "sec-attivita"; break;
    case "save-measure": {
      view.mDate = null;
      const m = { id: view.mEdit?.id || uid(), date: val("#m-date"), weight: num1(val("#m-weight")), waist: num1(val("#m-waist")), low: num1(val("#m-low")), thigh: num1(val("#m-thigh")), note: val("#m-note").trim() };
      if (!m.date) return toast("Inserisci la data");
      if (MEAS_FIELDS.every(([f]) => m[f] === null)) return toast("Inserisci almeno un valore");
      if (m.weight !== null && !(m.weight > 30 && m.weight < 300)) return toast("Peso non valido");
      const same = S.measures.find((x) => x.date === m.date && x.id !== m.id);
      if (same) { MEAS_FIELDS.forEach(([f]) => { if (m[f] === null) m[f] = same[f]; }); m.note = m.note || same.note; S.measures = S.measures.filter((x) => x.id !== same.id); }
      S.measures = S.measures.filter((x) => x.id !== m.id).concat(m);
      if (m.weight !== null) day(m.date, true).weight = m.weight;
      const prevLow = sortedMeasures().filter((x) => x.date < m.date && x.low !== null && x.low !== undefined).slice(-1)[0];
      const drop = m.low !== null && prevLow ? prevLow.low - m.low : 0;
      view.mEdit = null;
      if (drop >= 0.5) {
        // premio per il calo della vita bassa, con il contesto della settimana
        const st = periodStats(m.date, 7), tgw = targets(m.date);
        openDialog(`
          <h3>Ottimo, la vita bassa è scesa di ${fmtN(drop)} cm!</h3>
          <p>Rispetto alla misura precedente la pancia sta cedendo: è il segnale che la dieta sta funzionando.</p>
          <p class="small">Negli ultimi 7 giorni hai mangiato in media ${r0(st.kcal)} kcal contro un obiettivo di ${r0(tgw.kcal)}, con ${r0(st.p)} g di proteine al giorno. Il deficit fa il lavoro, e le proteine proteggono il muscolo.</p>
          <p class="small">Attenzione: un centimetro può dipendere anche dall'acqua e dal momento della misura. Mantieni la regolarità, e quando la settimana è in linea puoi tornare a un'alimentazione più normale, anche con la pasta a pranzo se la vuoi.</p>
          <button class="btn primary wide" data-act="dlg-close">Continua così</button>`);
        break;
      }
      toast("Misurazione salvata"); break;
    }
    case "edit-measure": resetScroll = true; view.mEdit = S.measures.find((x) => x.id === el.dataset.id); break;
    case "cancel-measure": view.mEdit = null; break;
    case "seed-measures": {
      const seed = [["2026-02-05", 67.5, null], ["2026-09-05", null, 90.5], ["2026-09-10", 65.7, 91], ["2026-09-21", 66, 91.5]];
      seed.forEach(([date, weight, waist]) => S.measures.push({ id: uid(), date, weight, waist, low: null, thigh: null, note: "" }));
      toast("Misure caricate"); break;
    }
    case "del-measure": if (confirm("Eliminare questa misurazione?")) { S.measures = S.measures.filter((x) => x.id !== view.mEdit?.id); view.mEdit = null; } break;
    case "macro": return macroDialog(el.dataset.m, k);
    case "recalc": {
      const ch = recalcChanges(k);
      ch.forEach(({ m, cur, n }) => {
        m.name = cur.name; m.kcal = n.kcal; m.p = n.p; m.c = n.c; m.f = n.f;
        m.ref = { name: cur.name, kcal: cur.kcal, p: cur.p, c: cur.c, f: cur.f, portion: cur.portion, cat: cur.cat };
      });
      toast(`${ch.length} ${ch.length === 1 ? "alimento aggiornato" : "alimenti aggiornati"}`); break;
    }
    case "edit-entry": return editDialog(el.dataset.kind, el.dataset.id, k);
    case "ed-date-set": $("#ed-date").value = el.dataset.d; return;
    case "save-entry": {
      const from = dlg().dataset.from, kind = dlg().dataset.kind, id = dlg().dataset.id;
      const it = entryList(from, kind).find((x) => x.id === id);
      if (!it) { closeDialog(); return; }
      const name = val("#ed-name").trim();
      const o = dlg().dataset.orig ? JSON.parse(dlg().dataset.orig) : null;
      const newQty = $("#ed-qty") ? num1(val("#ed-qty")) : null;
      if (o && o.qty > 0 && newQty > 0 && newQty !== o.qty) {
        const r = newQty / o.qty;
        $("#ed-kcal").value = r1(o.kcal * r); $("#ed-p").value = r1(o.p * r); $("#ed-c").value = r1(o.c * r); $("#ed-f").value = r1(o.f * r);
      }
      const kcal = num1(val("#ed-kcal"));
      if (!name || kcal === null || kcal < 0) return toast("Nome e calorie sono obbligatori");
      const read = (sel) => { const el2 = $(sel); return el2 ? Math.max(0, num1(el2.value) ?? 0) : 0; };
      const before = { kcal: it.kcal, p: it.p || 0, c: it.c || 0, f: it.f || 0 };
      it.name = name; it.kcal = kcal; it.c = read("#ed-c");
      if (kind === "meal") { it.p = read("#ed-p"); it.f = read("#ed-f"); }
      const q = $("#ed-qty") ? num1(val("#ed-qty")) : null;
      if (q > 0) { if (kind === "drink") it.ml = q; else it.g = q; }
      if (kind === "meal" && it.ref && (it.ref.name !== name || Math.abs(before.kcal - it.kcal) > 0.5 || Math.abs(before.p - it.p) > 0.2 || Math.abs(before.c - it.c) > 0.2 || Math.abs(before.f - it.f) > 0.2)) {
        const exp = it.g ? { kcal: (it.ref.kcal * it.g) / 100, p: (it.ref.p * it.g) / 100, c: (it.ref.c * it.g) / 100, f: (it.ref.f * it.g) / 100 } : null;
        if (!exp || Math.abs(exp.kcal - it.kcal) > 0.5 || Math.abs(exp.p - it.p) > 0.2 || Math.abs(exp.c - it.c) > 0.2 || Math.abs(exp.f - it.f) > 0.2 || it.ref.name !== name) delete it.ref;
      }
      const to = val("#ed-date");
      if (to && to !== from) {
        if (to > todayKey()) return toast("Non puoi scegliere una data futura");
        const key = kind === "drink" ? "drinks" : "meals";
        day(from, true)[key] = day(from, true)[key].filter((x) => x.id !== id);
        day(to, true)[key].push(it);
        closeDialog();
        toast(`Spostato al ${fmtDate(to, { day: "numeric", month: "long" })}: ${r0(totals(to).kcal)} kcal in quel giorno, ${r0(totals(from).kcal)} kcal nel giorno di partenza`);
        break;
      }
      closeDialog(); toast("Modifiche salvate"); break;
    }
    case "copy-from-date": return copyDialog();
    case "copy-run": {
      const from = $("#cp-date").value;
      if (!from || from === view.date) return toast("Scegli un giorno diverso da quello aperto");
      const src = day(from), d2 = day(k, true);
      let n = 0;
      document.querySelectorAll("#cp-list input[data-cp]").forEach((c) => {
        if (!c.checked) return;
        const list = c.dataset.cp === "drink" ? src.drinks : src.meals;
        const it = list[+c.dataset.i];
        if (!it) return;
        (c.dataset.cp === "drink" ? d2.drinks : d2.meals).push({ ...it, id: uid(), auto: false });
        n++;
      });
      closeDialog(); toast(`${n} voci copiate`); break;
    }
    case "meal-date": {
      const list = el.dataset.kind === "drink" ? day(k).drinks : day(k).meals;
      const it = list.find((x) => x.id === el.dataset.id);
      if (!it) return;
      openDialog(`<h3>Cambia data</h3><p class="muted small">${esc(it.name)}, ${r0(it.kcal)} kcal. Scegli il giorno a cui appartiene: i totali dei due giorni si ricalcolano.</p>
        <div class="field"><label for="md-date">Data</label><input id="md-date" type="date" value="${k}" max="${todayKey()}"></div>
        <div class="btns"><button class="btn ghost" data-act="md-set" data-d="${addDays(k, -1)}">Giorno prima</button><button class="btn ghost" data-act="md-set" data-d="${todayKey()}">Oggi</button></div>
        <button class="btn primary wide" data-act="save-date">Salva</button>`);
      dlg().dataset.kind = el.dataset.kind; dlg().dataset.id = el.dataset.id; dlg().dataset.from = k;
      return;
    }
    case "md-set": $("#md-date").value = el.dataset.d; return;
    case "save-date": {
      const from = dlg().dataset.from, to = val("#md-date"), kind = dlg().dataset.kind, id = dlg().dataset.id;
      if (!to) return toast("Scegli una data");
      if (to > todayKey()) return toast("Non puoi scegliere una data futura");
      if (to === from) { closeDialog(); return; }
      const src = day(from, true), dst = day(to, true);
      const key = kind === "drink" ? "drinks" : "meals";
      const it = src[key].find((x) => x.id === id);
      if (!it) { closeDialog(); return; }
      src[key] = src[key].filter((x) => x.id !== id);
      dst[key].push(it);
      closeDialog();
      toast(`Spostato al ${fmtDate(to, { day: "numeric", month: "long" })}: ${r0(totals(to).kcal)} kcal in quel giorno, ${r0(totals(from).kcal)} kcal nel giorno di partenza`);
      break;
    }
    case "toggle-foods": view.foodsOpen = !view.foodsOpen; break;
    case "hist-check": return historyDialog();
    case "hist-apply-verified": {
      const ch = historyChanges();
      const ok = ch.filter((x) => /CREA|INRAN|Consorzio|EnteCRA/i.test(x.cur.src || ""));
      ok.forEach((x) => {
        const tgt = S.days[x.k].meals.find((m) => m.id === x.id);
        if (tgt) { tgt.kcal = x.n.kcal; tgt.p = x.n.p; tgt.c = x.n.c; tgt.f = x.n.f; }
      });
      closeDialog(); toast(`${ok.length} voci aggiornate con fonte verificata, ${ch.length - ok.length} lasciate invariate`); break;
    }
    case "hist-link": {
      let n = 0;
      document.querySelectorAll("#dlg select[data-lk]").forEach((sel) => {
        const i = +sel.dataset.lk, v = sel.value;
        const g = num1(document.querySelector(`#dlg input[data-lg="${i}"]`).value);
        if (v === "" || !(g > 0)) return;
        const x = histLinks[i], f = x.cands[+v];
        const tgt = S.days[x.k].meals.find((m) => m.id === x.id);
        if (!tgt || !f) return;
        tgt.g = g; tgt.ref = { name: f.name, kcal: f.kcal, p: f.p, c: f.c, f: f.f, portion: f.portion, cat: f.cat };
        tgt.kcal = (f.kcal * g) / 100; tgt.p = (f.p * g) / 100; tgt.c = (f.c * g) / 100; tgt.f = (f.f * g) / 100;
        n++;
      });
      closeDialog(); toast(`${n} voci collegate e aggiornate`); break;
    }
    case "hist-apply": {
      const ids = JSON.parse(dlg().dataset.hist || "[]");
      const ch = historyChanges();
      let n = 0;
      document.querySelectorAll("#dlg input[data-hist]").forEach((c) => {
        if (!c.checked) return;
        const x = ch[+c.dataset.hist];
        if (!x) return;
        const tgt = S.days[x.k].meals.find((m) => m.id === x.id);
        if (!tgt) return;
        tgt.kcal = x.n.kcal; tgt.p = x.n.p; tgt.c = x.n.c; tgt.f = x.n.f;
        n++;
      });
      closeDialog(); toast(`${n} voci aggiornate`); break;
    }
    case "diary-dialog": return diaryDialog();
    case "diary-from-search": return diaryDialog($("#f-search").value);
    case "diary-parse": {
      const items = parseDiary(val("#di-text"));
      if (!items.length) return toast("Non riconosco alimenti: scrivi il nome con i grammi, per esempio Pasta, 80 g");
      return diaryPreview(items);
    }
    case "diary-save": {
      const items = JSON.parse(dlg().dataset.diary);
      let n = 0;
      items.forEach((it, i) => {
        if (!$(`[data-di=chk][data-i="${i}"]`).checked) return;
        // peso stimato dalle calorie scritte e dal database, modificabile in seguito con i grammi giusti
        const hit = it.g ? null : searchFoods(it.name).find((x) => !x.perServing);
        const estG = hit && hit.kcal > 0 && it.kcal > 0 ? Math.round(it.kcal / (hit.kcal / 100)) : null;
        day(k, true).meals.push({ id: uid(), slot: slotFor("giorno", it.name), name: it.name, g: it.g || estG, gEst: !it.g && estG !== null, kcal: it.kcal, p: it.p, c: it.c, f: it.f });
        rememberFood({ name: it.name, kcal: it.kcal, p: it.p, c: it.c, f: it.f, portion: null, perServing: true });
        n++;
      });
      closeDialog(); toast(`${n} alimenti aggiunti`); break;
    }
    case "habit-open": return habitDialog();
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
    case "copy-yesterday": {
      const src = S.days[addDays(k, -1)].meals;
      const d = day(k, true);
      d.meals.push(...src.filter((m) => !d.meals.some((x) => x.name === m.name)).map((m) => ({ ...m, id: uid(), auto: false })));
      toast("Copiato da ieri"); break;
    }
    case "toggle-repeat": {
      const m = day(k).meals.find((x) => x.id === el.dataset.id);
      if (!m) return;
      const i = S.dailyAuto.findIndex((x) => x.name === m.name);
      if (i >= 0) { S.dailyAuto.splice(i, 1); toast("Non si ripete più"); }
      else {
        const { id, auto, slot, ...rest } = m;
        S.dailyAuto.push(rest);
        if (k === todayKey()) day(k, true).autoDone = true;
        toast("Si inserirà da solo ogni giorno");
      }
      break;
    }
    case "del-meal": { const d = day(k, true); d.meals = d.meals.filter((m) => m.id !== el.dataset.id); break; }
    case "dedupe": {
      // tiene il primo di ogni gruppo (quello verificato, se c'e) e cancella gli altri
      const drop = new Set();
      duplicateGroups().forEach((g) => {
        const keep = g.items.find((x) => isVerified(x)) || g.items[0];
        g.items.forEach((x) => { if (x !== keep && !g.items.some((y) => y === keep && y.name === x.name && y.kcal === x.kcal)) drop.add(x.name + "|" + x.kcal); });
      });
      S.customFoods = S.customFoods.filter((x) => !drop.has(x.name + "|" + x.kcal));
      save(); toast(`${drop.size} doppioni cancellati`); return foodDialog();
    }
    case "del-custom": {
      const name = el.dataset.name;
      if (!confirm(`Eliminare "${name}" dalla memoria? Non si recupera.`)) break;
      S.customFoods = S.customFoods.filter((x) => x.name !== name);
      const q = document.getElementById("f-search");
      if (q) renderFoodList(q.value);
      break;
    }
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
    case "plans-dialog": return plansDialog();
    case "plan-save": {
      const name = val("#pl-name").trim() || "Scheda";
      const days = parsePlan(val("#pl-text"));
      if (!days.length) return toast("Scrivi almeno un giorno con gli esercizi, per esempio: Giorno A");
      S.plans.push({ id: uid(), name, days });
      toast("Scheda salvata"); render(); return plansDialog();
    }
    case "plan-del": S.plans = S.plans.filter((p) => p.id !== el.dataset.id); render(); return plansDialog();
    case "plan-copy": {
      const p = S.plans.find((x) => x.id === el.dataset.id);
      if (p) S.plans.push({ id: uid(), name: p.name + " (copia)", days: JSON.parse(JSON.stringify(p.days)) });
      toast("Scheda copiata"); render(); return plansDialog();
    }
    case "plan-day": return planDayDialog(el.dataset.id, el.dataset.label);
    case "plan-quick": {
      const p = S.plans.find((x) => x.id === el.dataset.id);
      const dd = p && p.days.find((x) => x.label === el.dataset.label);
      if (!dd) return;
      const min = S.planMin[p.id] || 60, w = weightAt(k), met = 3.5;
      day(k, true).ex.push({ id: uid(), name: `${p.name}, giorno ${dd.label}`, met, min, kcal: (met * w * min) / 60, net: ((met - 1) * w * min) / 60, note: dd.exercises.slice(0, 12).join(" · ") });
      day(k, true).rest = false;
      toast(`Giorno ${dd.label} registrato, ${min} minuti`); break;
    }
    case "plan-log": {
      const p = S.plans.find((x) => x.id === el.dataset.id);
      const dd = p && p.days.find((x) => x.label === el.dataset.label);
      const min = num("#pd-min");
      if (!dd || !(min > 0)) return toast("Inserisci la durata");
      S.planMin[p.id] = min;
      const w = weightAt(k), met = 3.5;
      const note = dd.exercises.slice(0, 12).join(" · ");
      day(k, true).ex.push({ id: uid(), name: `${p.name}, giorno ${dd.label}`, met, min, kcal: (met * w * min) / 60, net: ((met - 1) * w * min) / 60, note });
      day(k, true).rest = false;
      closeDialog(); toast(`Giorno ${dd.label} registrato`); break;
    }
    case "activity-dialog": return activityDialog();
    case "activity-save": {
      const { out, errors } = parseActivity(val("#act-text"));
      if (!out.length) return toast(errors.length ? "Nessuna riga valida: scrivi i minuti, per esempio 60 minuti" : "Incolla almeno una riga");
      const w = weightAt(k), dd = day(k, true);
      out.forEach((e) => dd.ex.push({ id: uid(), name: e.name, met: e.met, min: e.min, kcal: (e.met * w * e.min) / 60, net: ((e.met - 1) * w * e.min) / 60, note: e.note, generic: e.generic }));
      dd.rest = false;
      closeDialog();
      toast(`${out.length} attività aggiunte${errors.length ? `, ${errors.length} righe non lette` : ""}`);
      break;
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
        if (!d.meals.length && !confirm("Non hai inserito nessun alimento. Chiudere comunque la giornata?")) return;
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
    default: if (typeof fumoAct === "function" && fumoAct(a, el)) return; return;
  }
  save();
  render();
}


// ---------- Eventi ----------
document.addEventListener("click", (e) => {
  const nav = e.target.closest(".nav button");
  if (nav) { resetScroll = true; view.tab = nav.dataset.tab; view.mEdit = null; if (view.tab === "oggi") view.date = todayKey(); return render(); }
  const el = e.target.closest("[data-act]");
  if (el) { e.preventDefault(); act(el.dataset.act, el); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "f-search") renderFoodList(e.target.value);
  if (e.target.id === "pv-search") renderPvList(e.target.value);

  if (e.target.id === "q-n") { const f = JSON.parse(dlg().dataset.food); $("#q-g").value = Math.round((num1(e.target.value) || 0) * f.piece); }
  if (e.target.id === "q-g" || e.target.id === "q-n") updateQtyPreview();
  if (e.target.id === "ed-qty") scaleEdit(e.target.value);
});
// editor del piatto composto: con il nome di un piatto gia salvato carica i suoi ingredienti, da modificare uno per uno
function dishDialog(name) {
  openDialog(`
    <h3>Piatto composto</h3>
    <p class="muted small">Puoi cambiare ogni ingrediente: grammi, cucchiai o peso del cucchiaio. Se non sai una quantità, lascia vuoto: resta una stima.</p>
    <div class="field"><label for="dish-name">Nome del piatto</label><input id="dish-name" type="text" placeholder="Pasta e zucca" value="${esc(name)}" autofocus><div id="dish-sugg" class="chips"></div></div>
    <div id="dish-rows"></div>
    <button class="btn ghost wide" data-act="dish-load">Carica il piatto salvato con questo nome</button>
    <button class="btn ghost wide" data-act="dish-add-row">Aggiungi ingrediente</button>
    <button class="btn primary wide" data-act="dish-save">Salva il piatto</button>`);
  if (name) document.querySelector('[data-act=dish-load]').click();
}
// suggerimenti mentre scrivi: i piatti salvati e la ricerca in previsione
document.addEventListener("input", (e) => {
  if (e.target.id === "dish-name") {
    const box = $("#dish-sugg"); if (!box) return;
    const q = norm(e.target.value).trim();
    const hits = q ? S.customFoods.filter((x) => x.parts || x.src && /piatto composto/i.test(x.src)).filter((x) => norm(x.name).split(/[^a-z0-9]+/).some((w) => w.length > 1 && q.split(/[^a-z0-9]+/).some((t) => t.length > 1 && w.startsWith(t)))).slice(0, 6) : [];
    box.innerHTML = hits.map((x) => `<button class="chip" data-act="dish-pick" data-name="${esc(x.name)}">${esc(x.name)}</button>`).join("");
  }
  // ingredienti: mentre scrivi il nome, suggerisce gli alimenti gia in lista (es. maiale)
  if (e.target.classList && e.target.classList.contains("dish-name")) {
    const inp = e.target;
    let box = inp.parentElement.querySelector(".dish-ing-sugg");
    if (!box) { box = document.createElement("div"); box.className = "chips dish-ing-sugg"; inp.insertAdjacentElement("afterend", box); }
    const q = norm(inp.value).trim();
    const hits = q ? allFoods().filter((x) => !x.perServing && norm(x.name).split(/[^a-z0-9]+/).some((w) => w.length > 1 && q.split(/[^a-z0-9]+/).some((t) => t.length > 1 && w.startsWith(t))))
      .filter((x, i, a) => a.findIndex((y) => norm(y.name) === norm(x.name)) === i).slice(0, 6) : [];
    box.innerHTML = hits.map((x) => `<button class="chip" data-act="dish-ing-pick" data-name="${esc(x.name)}">${esc(x.name)}</button>`).join("");
  }
  if (e.target.id === "fv-q") { const btn = document.querySelector('[data-act=fv-search]'); if (btn && e.target.value.trim().length >= 2) btn.click(); }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "ed-qty") scaleEdit(e.target.value);
  const t = e.target;
  if (t.id === "label-file") { readLabel(t.files[0]); t.value = ""; return; }
  if (t.id === "cp-date") return renderCopyList(t.value);
  const c = t.dataset.change;
  if (c === "steps") { day(view.date, true).steps = Math.max(0, parseInt(t.value) || 0); save(); render(); }
  if (c === "weight") { const w = parseFloat(t.value); day(view.date, true).weight = w > 30 && w < 300 ? w : null; save(); render(); }
  if (c === "note") { day(view.date, true).note = t.value; save(); }
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
  S.profile = { name: String(fd.get("name") || "").trim(), sex: fd.get("sex"), age: n("age"), height: n("height"), weight: n("weight"), goalWeight: n("goalWeight"), rate: n("rate"), activity: n("activity"), trainDays: n("trainDays"), level: fd.get("level") };
  save();
  toast("Profilo salvato");
  view.tab = "oggi"; view.date = todayKey(); resetScroll = true;
  render();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && dlg().open && e.target.tagName === "INPUT") {
    const primary = dlg().querySelector(".btn.primary");
    if (primary) { e.preventDefault(); primary.click(); }
  }
});
let lastToday = todayKey();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (todayKey() !== lastToday) { if (view.date === lastToday) view.date = todayKey(); lastToday = todayKey(); }
  if (view.tab === "oggi" && !dlg().open) { applyHabits(todayKey()); render(); }
});

// Aggiornamento automatico: al rientro nell'app controlla se app.js sul sito è cambiato.
let seenStamp = null;
async function codeStamp() {
  try {
    const r = await fetch("app.js", { method: "HEAD", cache: "no-store" });
    return (r.headers.get("etag") || "") + (r.headers.get("last-modified") || "") || null;
  } catch { return null; }
}
// Quando arriva una versione nuova compare un avviso in alto: un tocco ricarica l'app. I dati salvati non vengono toccati.
function showUpdateBar() {
  if (document.querySelector(".upd-bar")) return;
  const b = document.createElement("button");
  b.className = "upd-bar";
  b.textContent = "Nuova versione disponibile: tocca per aggiornare";
  b.addEventListener("click", async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      const ks = await caches.keys();
      await Promise.all(ks.map((k) => caches.delete(k)));
    } catch {}
    location.reload();
  });
  document.body.appendChild(b);
}
async function checkUpdate() {
  const now = await codeStamp();
  if (!now) return;
  if (seenStamp === null) { seenStamp = now; return; }
  if (now !== seenStamp) showUpdateBar();
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkUpdate(); });
window.addEventListener("pageshow", checkUpdate);
window.addEventListener("focus", checkUpdate);
setInterval(() => { if (document.visibilityState === "visible") checkUpdate(); }, 60000);
checkUpdate();
ensureMomCutlet();
ensureBarcodeSources();
ensureDishParts();
ensureMcdMacros();
ensureRagu();

// Scorrimento orizzontale con un dito: passa al giorno precedente o successivo (come le frecce ‹ ›).
(function swipeDays() {
  let s = null;
  const ignored = (t) => t && t.closest && t.closest("input, textarea, select, dialog, [data-noswipe]");
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1 || ignored(e.target) || document.querySelector("dialog[open]")) { s = null; return; }
    s = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }, { passive: true });
  document.addEventListener("touchcancel", () => { s = null; }, { passive: true });
  // gesto orizzontale: il browser non deve usarlo per tornare indietro nella cronologia
  document.addEventListener("touchmove", (e) => {
    if (!s || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - s.x, dy = e.touches[0].clientY - s.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > 1.5 * Math.abs(dy) && e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchend", (e) => {
    if (!s || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
    const quick = Date.now() - s.t < 600;
    s = null;
    if (!quick || Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy)) return;
    if (view.tab !== "oggi") return;
    view.date = addDays(view.date, dx < 0 ? 1 : -1);
    resetScroll = true;
    render();
  }, { passive: true });
})();

// Pizzico con due dita sulle card: ingrandisce solo quella card (da 1x a 2,5x), si riporta a 1x tornando indietro.
(function pinchCards() {
  const MIN = 1, MAX = 2.5;
  let g = null;
  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const cardOf = (t) => (t && t.closest ? t.closest(".card") : null);
  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 2) return;
    const el = cardOf(e.target);
    if (!el) return;
    const [a, b] = e.touches;
    const r = el.getBoundingClientRect();
    const ox = ((a.clientX + b.clientX) / 2 - r.left) / r.width * 100;
    const oy = ((a.clientY + b.clientY) / 2 - r.top) / r.height * 100;
    g = { el, d0: dist(a, b) || 1, s0: parseFloat(el.dataset.zoom || "1") || 1 };
    el.style.transformOrigin = `${ox}% ${oy}%`;
    el.style.position = "relative";
    el.style.zIndex = "5";
    el.style.transition = "none";
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!g || e.touches.length !== 2) return;
    e.preventDefault();
    const s = Math.min(MAX, Math.max(MIN, g.s0 * dist(e.touches[0], e.touches[1]) / g.d0));
    g.el.dataset.zoom = String(s);
    g.el.style.transform = s <= 1.01 ? "" : `scale(${s})`;
  }, { passive: false });
  // al rilascio la card torna da sola alla dimensione normale, come le foto nei post
  const end = (e) => {
    if (!g || e.touches.length >= 2) return;
    const el = g.el;
    g = null;
    if (!el.dataset.zoom) return;
    el.style.transition = "transform 0.25s ease";
    el.style.transform = "";
    delete el.dataset.zoom;
    setTimeout(() => { el.style.transition = ""; el.style.transformOrigin = ""; el.style.zIndex = ""; el.style.position = ""; }, 260);
  };
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
})();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
applyHabits(todayKey());
render();
