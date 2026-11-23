"use strict";

// ---------- Scheda Fumo: contatore, risparmio, traguardi e aiuto per le voglie ----------
// Usa lo stato S, save(), render() e le utilità definite in app.js. I dati stanno in S.fumo.

// Testi inglesi della scheda Fumo: la chiave e il testo italiano esatto
// Testi della scheda Fumo in inglese, per il testo italiano esatto (pensieri, azioni, traguardi)
const FUMO_EN = {
  "20 minuti": "20 minutes", "Frequenza cardiaca e pressione iniziano a scendere.": "Heart rate and blood pressure start to drop.",
  "12 ore": "12 hours", "Il monossido di carbonio nel sangue si normalizza.": "Carbon monoxide in the blood returns to normal.",
  "1 giorno": "1 day", "Il primo giorno è passato: le voglie più forti arrivano a ondate di pochi minuti.": "The first day is over: the strongest cravings come in waves lasting a few minutes.",
  "2 giorni": "2 days", "Gusto e olfatto cominciano a tornare.": "Taste and smell start to come back.",
  "3 giorni": "3 days", "La nicotina è in gran parte eliminata dal corpo.": "Most of the nicotine is cleared from the body.",
  "2 settimane": "2 weeks", "Circolazione e respiro migliorano in modo percepibile.": "Circulation and breathing noticeably improve.",
  "1 mese": "1 month", "Tosse e fiato corto tendono a diminuire.": "Coughing and shortness of breath tend to decrease.",
  "3 mesi": "3 months", "La funzione polmonare migliora in modo misurabile.": "Lung function measurably improves.",
  "1 anno": "1 year", "Il rischio di malattia coronarica scende a circa la metà di quello di un fumatore.": "The risk of coronary heart disease drops to about half that of a smoker.",
  "Mangia una mela o una carota.": "Eat an apple or a carrot.",
  "Bevi un sorso d'acqua e posa il bicchiere lontano dal pacchetto.": "Take a sip of water and put the glass away from the pack.",
  "Cammina per due minuti, anche solo in corridoio.": "Walk for two minutes, even just in the corridor.",
  "Sistema una cosa in camera: il letto, la scrivania, il tavolo.": "Tidy one thing in your room: the bed, the desk, the table.",
  "Lavati le mani e il viso con acqua fredda.": "Wash your hands and face with cold water.",
  "Scrivi su un foglio tre cose che farai nell'ora successiva, senza sigaretta.": "Write on a sheet three things you will do in the next hour, without a cigarette.",
  "Metti le sigarette in un cassetto lontano e chiudilo.": "Put the cigarettes in a drawer far away and close it.",
  "Scrivi o chiama una persona e raccontale come stai andando.": "Write to or call someone and tell them how it is going.",
  "Guarda fuori dalla finestra per un minuto e respira piano.": "Look out of the window for a minute and breathe slowly.",
  "Fatti una doccia e cambia la maglietta.": "Take a shower and change your T-shirt.",
  "Apri la finestra e prepara la colazione.": "Open the window and make breakfast.",
  "Prepara la borsa o la giornata di oggi, una cosa alla volta.": "Get your bag or today's plan ready, one thing at a time.",
  "Lavati i denti e mettiti il pigiama.": "Brush your teeth and put on your pyjamas.",
  "Prepara il letto e posa tutto quello che hai in mano.": "Make the bed and put down whatever you are holding.",
  "Pianifica la mattina: sveglia, bagno, denti, colazione, senza sigaretta.": "Plan the morning: alarm, shower, teeth, breakfast, without a cigarette.",
  "Quello che senti come sollievo è il bisogno creato dalla nicotina. Accendendola non guadagni niente: torni solo alla condizione di prima.": "What you feel as relief is the need created by nicotine. Lighting one gains you nothing: you just return to the condition you were in before.",
  "Non devi decidere di non fumare per sempre. Basta non accendere questa sigaretta adesso.": "You do not have to decide never to smoke again. Just do not light this cigarette now.",
  "Una voglia dura pochi minuti, anche se sembra infinita. Ogni volta che passa senza fumare, dimostri a te stesso che puoi farlo.": "A craving lasts a few minutes, even if it feels endless. Every time it passes without smoking, you prove to yourself that you can do it.",
  "Sembra una privazione, ma stai liberandoti di una dipendenza che ogni giorno occupa la tua mente.": "It feels like deprivation, but you are freeing yourself from an addiction that takes up your mind every day.",
  "Chi smette non resiste con la forza: smette di credere che la sigaretta sia necessaria, e questo cambia tutto.": "People who quit do not resist with willpower: they stop believing the cigarette is necessary, and that changes everything.",
  "Il fumo restringe i piccoli vasi del corpo, anche quelli che nutrono i capelli. Ogni ora senza sigaretta è un'ora in cui non li stringi.": "Smoking narrows the body's small vessels, including those that feed the hair. Every hour without a cigarette is an hour in which you do not squeeze them.",
  "Il grigio arriva comunque con il tempo. Quello che puoi decidere è quanto in fretta arriva.": "Grey comes with time anyway. What you can decide is how fast it comes.",
  "Il fumo accelera l'invecchiamento della pelle. Ogni giorno senza sigarette è un giorno in cui la pelle ha meno cose da sopportare.": "Smoking speeds up skin ageing. Every day without cigarettes is a day in which the skin has less to put up with.",
  "Tra un mese guardati allo specchio. Non serve un cambiamento perfetto: basta notare che sei già diverso da ieri.": "In a month, look at yourself in the mirror. You do not need a perfect change: just notice that you are already different from yesterday.",
  "Un respiro profondo adesso vale più di una boccata.": "A deep breath now is worth more than a puff.",
  "Pensa al motivo che hai scritto. Era la tua ragione quando eri lucido, e lo è ancora.": "Think about the reason you wrote down. It was your reason when you were clear-headed, and it still is.",
  "Anche se hai fumato ieri, oggi è un altro giorno: il conto ricomincia da adesso.": "Even if you smoked yesterday, today is another day: the count starts again from now.",
  "Chi ti vuole bene preferisce vederti respirare meglio, non solo smettere.": "Those who love you would rather see you breathing better, not just quitting.",
  "Vestiti, casa, mani: il fumo si sente prima di quanto pensi. Smettere è anche tornare a sentire l'aria pulita.": "Clothes, home, hands: smoke is noticed sooner than you think. Quitting also means breathing clean air again.",
  "Il prezzo di un pacchetto basta per comprare qualcosa che ti piace davvero.": "The price of a pack is enough to buy something you really like.",
  "Questo minuto passa anche se fumi. Prova a vedere quanti ne passano senza.": "This minute passes even if you smoke. Try to see how many pass without.",
  "Il gusto del cibo torna più in fretta di quanto immagini: ti accorgerai del pane che sa di pane.": "Food taste comes back faster than you think: you will notice bread tasting like bread.",
  "Non devi sentirti bene per smettere: basta non accendere.": "You do not have to feel good to quit: just do not light up.",
  "Non stai rinunciando a un piacere. Stai smettendo di pagare per il malessere che la sigaretta ha creato.": "You are not giving up a pleasure. You are stopping paying for the discomfort the cigarette has created.",
  "Ogni volta che accendi, la dipendenza ti convince che ti serve. Non ti serve.": "Every time you light up, the addiction convinces you that you need it. You do not.",
  "La sigaretta non ti dà piacere: ti toglie l'astinenza che lei stessa ha causato.": "The cigarette does not give you pleasure: it removes the withdrawal it has caused itself.",
  "Il pensiero che ti manca qualcosa è la trappola. Non ti manca niente.": "The thought that something is missing is the trap. Nothing is missing.",
  "Non devi essere forte. Devi capire che la sigaretta non ti aggiunge niente.": "You do not have to be strong. You have to understand that the cigarette adds nothing to you.",
  "Fumare non ti rilassa: ti rilassa smettere di aver bisogno della sigaretta.": "Smoking does not relax you: stopping needing a cigarette does.",
  "Hai detto tante volte che è l'ultima. Non è una questione di forza, è una questione di capire come funziona.": "You have said many times that it is the last one. It is not a matter of strength: it is a matter of understanding how it works.",
  "La voglia è un segnale della dipendenza, non una verità su di te.": "A craving is a signal of the addiction, not a truth about you.",
  "Ogni sigaretta che non accendi è una prova che la dipendenza non ti comanda.": "Every cigarette you do not light is proof that the addiction does not control you.",
  "Quello che ti sembra un sacrificio è la fine di un abbonamento che non avresti mai voluto sottoscrivere.": "What feels like a sacrifice is the end of a subscription you never wanted to sign up for.",
  "Non c'è niente di speciale in una sigaretta. È solo quello che il corpo ti chiede, e puoi dirgli di no.": "There is nothing special about a cigarette. It is just what the body asks for, and you can say no.",
  "Un giorno con meno sigarette del giorno prima": "One day with fewer cigarettes than the day before",
  "Tre giorni di fila con meno sigarette del giorno prima": "Three days in a row with fewer cigarettes than the day before",
  "Sette giorni di fila con meno sigarette del giorno prima": "Seven days in a row with fewer cigarettes than the day before",
  "Una settimana senza sigarette registrate": "One week with no cigarettes logged",
};
const fumoI = (x) => (S.lang === "en" && FUMO_EN[x]) || x;
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
  { t: "Mangia una mela o una carota.", when: "sempre" },
  { t: "Bevi un sorso d'acqua e posa il bicchiere lontano dal pacchetto.", when: "sempre" },
  { t: "Cammina per due minuti, anche solo in corridoio.", when: "sempre" },
  { t: "Sistema una cosa in camera: il letto, la scrivania, il tavolo.", when: "sempre" },
  { t: "Lavati le mani e il viso con acqua fredda.", when: "sempre" },
  { t: "Scrivi su un foglio tre cose che farai nell'ora successiva, senza sigaretta.", when: "sempre" },
  { t: "Metti le sigarette in un cassetto lontano e chiudilo.", when: "sempre" },
  { t: "Scrivi o chiama una persona e raccontale come stai andando.", when: "sempre" },
  { t: "Guarda fuori dalla finestra per un minuto e respira piano.", when: "sempre" },
  { t: "Fatti una doccia e cambia la maglietta.", when: "mattina" },
  { t: "Apri la finestra e prepara la colazione.", when: "mattina" },
  { t: "Prepara la borsa o la giornata di oggi, una cosa alla volta.", when: "mattina" },
  { t: "Lavati i denti e mettiti il pigiama.", when: "sera" },
  { t: "Prepara il letto e posa tutto quello che hai in mano.", when: "sera" },
  { t: "Pianifica la mattina: sveglia, bagno, denti, colazione, senza sigaretta.", when: "sera" },
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
  "Mangia una mela o una carota",
  "Cammina per due minuti",
  "Respira sul balcone",
  "Siediti con gli occhi chiusi per un minuto",
  "Respira lentamente per cinque respiri",
  "Torna a lavorare su una piccola cosa",
  "Sistema una cosa sul tavolo",
  "Lavati il viso con acqua fredda",
];
// Azioni salvate al gerundio: vengono convertite all'imperativo alla lettura.
const FUMO_GERUNDI_IMPERATIVI = {
  "Mangiando una mela o una carota": "Mangia una mela o una carota",
  "Camminando per due minuti": "Cammina per due minuti",
  "Respirando sul balcone": "Respira sul balcone",
  "Seduto con gli occhi chiusi per un minuto": "Siediti con gli occhi chiusi per un minuto",
  "Respirando lentamente per cinque respiri": "Respira lentamente per cinque respiri",
  "Lavorando su una piccola cosa": "Torna a lavorare su una piccola cosa",
  "Sistemando una cosa sul tavolo": "Sistema una cosa sul tavolo",
  "Lavandoti il viso con acqua fredda": "Lavati il viso con acqua fredda",
  "Bevendo un sorso d'acqua e posando il bicchiere lontano dal pacchetto.": "Bevi un sorso d'acqua e posa il bicchiere lontano dal pacchetto.",
  "Camminando per due minuti, anche solo in corridoio.": "Cammina per due minuti, anche solo in corridoio.",
  "Sistemando una cosa in camera: il letto, la scrivania, il tavolo.": "Sistema una cosa in camera: il letto, la scrivania, il tavolo.",
  "Lavandoti le mani e il viso con acqua fredda.": "Lavati le mani e il viso con acqua fredda.",
  "Scrivendo su un foglio tre cose che farai nell'ora successiva, senza sigaretta.": "Scrivi su un foglio tre cose che farai nell'ora successiva, senza sigaretta.",
  "Mettendo le sigarette in un cassetto lontano e chiudendolo.": "Metti le sigarette in un cassetto lontano e chiudilo.",
  "Scrivendo o chiamando una persona e raccontandole come stai andando.": "Scrivi o chiama una persona e raccontale come stai andando.",
  "Guardando fuori dalla finestra per un minuto, respirando piano.": "Guarda fuori dalla finestra per un minuto e respira piano.",
  "Facendoti una doccia e cambiando la maglietta.": "Fatti una doccia e cambia la maglietta.",
  "Aprendo la finestra e preparando la colazione.": "Apri la finestra e prepara la colazione.",
  "Preparando la borsa o la giornata di oggi, una cosa alla volta.": "Prepara la borsa o la giornata di oggi, una cosa alla volta.",
  "Lavandoti i denti e mettendoti il pigiama.": "Lavati i denti e mettiti il pigiama.",
  "Preparando il letto e posando tutto quello che hai in mano.": "Prepara il letto e posa tutto quello che hai in mano.",
  "Pianificando la mattina: sveglia, bagno, denti, colazione, senza sigaretta.": "Pianifica la mattina: sveglia, bagno, denti, colazione, senza sigaretta.",
};
// Vecchie formulazioni salvate: vengono convertite alla lettura.
const FUMO_PREVISIONE_VECCHIE = {
  "Mangia una mela o una carota": "Mangia una mela o una carota",
  "Bevi un bicchiere d'acqua": "Mangia una mela o una carota",
  "Alzati e cammina per due minuti": "Cammina per due minuti",
  "Esci in balcone e respira": "Respira sul balcone",
  "Siediti e chiudi gli occhi per un minuto": "Siediti con gli occhi chiusi per un minuto",
  "Fai cinque respiri lenti": "Respira lentamente per cinque respiri",
  "Torna al lavoro su una piccola cosa": "Torna a lavorare su una piccola cosa",
  "Sistema una cosa sul tavolo": "Sistema una cosa sul tavolo",
  "Lavati il viso con acqua fredda": "Lavati il viso con acqua fredda",
};
// "Lavorato sull'app" (al passato, dal registro) diventa il consiglio "Lavora sull'app".
function consigliaImperativo(testo) {
  const m = String(testo || "").match(/^([A-Za-zàèéìòù]+?)(ato|ito|uto)\b(.*)$/);
  if (!m) return testo;
  const verbo = m[1] + (m[2] === "ato" ? "a" : "i");
  const frase = (verbo + m[3]).trim();
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

// Le azioni fatte più spesso stanno in cima. A parità di uso resta l'ordine originale.
function fumoPrevisione() {
  const list = ((S.fumo && S.fumo.acts) || FUMO_PREVISIONE_BASE).map((x) => consigliaImperativo(FUMO_GERUNDI_IMPERATIVI[x] || FUMO_PREVISIONE_VECCHIE[x] || x));
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
  const lines = rows.map((e) => `<div class="fumo-item fumo-timed"><div class="muted small" style="font-variant-numeric:tabular-nums">${esc(hhmm(e.at))}:</div><div class="fumo-text">${e.kind === "act" ? `Hai fatto: ${esc(e.text)}` : `Hai fumato ${e.n || 1} ${(e.n || 1) === 1 ? "sigaretta" : "sigarette"}`}</div>${e.kind === "smoke" ? `<div class="fumo-tools"><button class="btn ghost small-btn" data-act="fumo-log-edit" data-idx="${e.idx}">${T("Modifica", "Edit")}</button><button class="btn danger small-btn" data-act="fumo-log-del" data-idx="${e.idx}">${T("Elimina", "Delete")}</button></div>` : ""}</div>`).join("");
  if (!view.fumoRegistroOpen) return `
    <section class="card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <div>
          <div style="font-size:1.2rem;font-weight:700;letter-spacing:-0.01em">${day === todayKey() ? T("Registro di oggi", "Today's log") : esc(fmtDate(day, { weekday: "long", day: "numeric", month: "long" }))}</div>
          <div style="font-size:1rem;color:var(--muted);margin-top:2px">${acts} ${T(acts === 1 ? "azione" : "azioni", acts === 1 ? "action" : "actions")} · ${smoked} ${T(smoked === 1 ? "sigaretta" : "sigarette", smoked === 1 ? "cigarette" : "cigarettes")}</div>
        </div>
        <button class="btn ghost small-btn" data-act="fumo-registro-toggle">${T("Mostra", "Show")}</button>
      </div>
    </section>`;
  return `
    <section class="card">
      <div class="row" style="align-items:center">
        <button class="link" data-act="fumo-registro-toggle">${T("Nascondi registro", "Hide log")}</button>
      </div>
      <div class="row" style="align-items:center">
        <button class="btn ghost small-btn" data-act="fumo-day-prev">${T("Giorno prima", "Previous day")}</button>
        <strong style="text-align:center">${esc(fmtDate(day))}</strong>
        <button class="btn ghost small-btn" data-act="fumo-day-next" ${day >= todayKey() ? "disabled" : ""}>${T("Giorno dopo", "Next day")}</button>
      </div>
      <p class="muted small" style="text-align:center">${T("Azioni fatte", "Actions done")}: ${acts} · ${T("Sigarette fumate", "Cigarettes smoked")}: ${smoked}</p>
      ${lines || `<p class="muted small">${T("Nessuna voce per questo giorno.", "No entries for this day.")}</p>`}
      <form id="fumo-add-form" class="form" style="margin-top:12px">
        <p class="muted small" style="margin:0 0 6px">Hai dimenticato di registrare qualcosa? Aggiungilo qui con l'ora in cui è successo.</p>
        <select name="kind"><option value="smoke">Ho fumato</option><option value="act">Ho fatto un'azione</option></select>
        <input name="time" type="text" maxlength="5" value="${day === todayKey() ? new Date().toTimeString().slice(0, 5).replace(":", ".") : "12.00"}" placeholder="Ora di inizio, es. 6.50" required>
        <input name="text" maxlength="80" placeholder="Quante sigarette (1 se non scrivi nulla), oppure cosa hai fatto">
        <button class="btn ghost wide" type="submit">${T("Aggiungi al registro", "Add to log")}</button>
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
// Parola chiave di un'attività: "Lavorando all'auto" → "auto", "Facendo la doccia" → "doccia".
function parolaChiave(testo) {
  let t = String(testo || "").trim();
  t = t.replace(/^\S+(ando|endo|ndo)\b\s*/i, "");
  t = t.replace(/^(?:all['’]|dell['’]|nell['’]|dall['’]|sull['’]|all\s|al\s|alla\s|allo\s|ai\s|agli\s|alle\s|la\s|il\s|lo\s|le\s|gli\s|i\s|un\s|una\s|uno\s|di\s|del\s|della\s|per\s|con\s|a\s)/i, "");
  t = t.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : testo;
}

// Gruppi di attività: "Auto" raccoglie auto, macchina, automobile, pratica auto. Li definisci tu nel report.
function normTesto(x) {
  return String(x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’`]/g, "'");
}
function haGruppo(testo) {
  const t = normTesto(testo);
  return ((S.giornata && S.giornata.gruppi) || []).some((x) => x.parole.some((p) => t.includes(normTesto(p))));
}
function gruppoDi(testo) {
  const t = normTesto(testo);
  const g = ((S.giornata && S.giornata.gruppi) || []).find((x) => x.parole.some((p) => t.includes(normTesto(p))));
  return g ? g.nome : parolaChiave(testo);
}

// Report: giorno, ultimi sette giorni, mese, anno, tutto. Ore per attività, per giorno, sigarette.
const GIORNATA_PERIODI = { giorno: "Oggi", settimana: "7 giorni", mese: "Questo mese", anno: "Quest'anno", tutto: "Tutto" };
function giornataGiorni(periodo) {
  const oggi = todayKey();
  if (periodo === "giorno") return [oggi];
  if (periodo === "settimana") return Array.from({ length: 7 }, (_, i) => addDays(oggi, i - 6));
  let inizio = oggi;
  if (periodo === "mese") inizio = oggi.slice(0, 8) + "01";
  if (periodo === "anno") inizio = oggi.slice(0, 4) + "-01-01";
  if (periodo === "tutto") {
    const date = [...((S.giornata && S.giornata.log) || []).map((e) => keyOf(new Date(e.at))), ...Object.keys((S.fumo && S.fumo.smokedDays) || {})];
    inizio = date.length ? date.reduce((m, k) => (k < m ? k : m), oggi) : oggi;
  }
  const giorni = [];
  for (let k = inizio; k <= oggi && giorni.length < 4000; k = addDays(k, 1)) giorni.push(k);
  return giorni;
}

function giornataReportHtml() {
  const periodo = view.giornataPeriodo || "settimana";
  const giorni = giornataGiorni(periodo);
  const set = new Set(giorni);
  const acts = ((S.giornata && S.giornata.log) || []).filter((e) => e.min && e.kind !== "pausa" && set.has(keyOf(new Date(e.at))));
  const byDay = {};
  acts.forEach((e) => { const g = keyOf(new Date(e.at)); (byDay[g] = byDay[g] || []).push(e); });
  const smokedDays = (S.fumo && S.fumo.smokedDays) || {};
  const perGiorno = giorni.map((g) => {
    const rows = (byDay[g] || []).map((e) => [new Date(e.at).getTime(), new Date(e.at).getTime() + e.min * 60000]).sort((x, y) => x[0] - y[0]);
    const fusi = [];
    rows.forEach(([x, y]) => { const u = fusi[fusi.length - 1]; if (u && x <= u[1]) u[1] = Math.max(u[1], y); else fusi.push([x, y]); });
    return { g, min: Math.round(fusi.reduce((t, [x, y]) => t + (y - x), 0) / 60000), sigarette: smokedDays[g] || 0 };
  });
  const totMin = perGiorno.reduce((x, d) => x + d.min, 0);
  const totSig = perGiorno.reduce((x, d) => x + d.sigarette, 0);
  const perAtt = {};
  acts.forEach((e) => {
    const nome = gruppoDi(e.text);
    const k = nome.toLowerCase();
    perAtt[k] = perAtt[k] || { text: nome, min: 0 };
    perAtt[k].min += e.min;
  });
  const attRows = Object.values(perAtt).sort((x, y) => y.min - x.min)
    .map((a) => `<div class="row"><div style="flex:1">${esc(a.text)}</div><div>${esc(fumoDurataMin(a.min))}</div></div>`).join("");
  const hm = (t) => new Date(t).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const visibili = perGiorno.filter((d) => d.min || d.sigarette || periodo === "giorno" || periodo === "settimana");
  const giorniRows = visibili.slice(-400).map((d) => {
    const dettagli = (byDay[d.g] || []).sort((x, y) => x.at.localeCompare(y.at))
      .map((e) => `<div class="muted small">${esc(hm(e.at))}–${esc(hm(new Date(e.at).getTime() + e.min * 60000))} · ${esc(gruppoDi(e.text))} (${esc(fumoDurataMin(e.min))})</div>`).join("");
    return `<div class="row"><div style="flex:1">${esc(fmtDate(d.g, { weekday: "short", day: "numeric", month: "short", year: "numeric" }))}</div><div>${d.min ? esc(fumoDurataMin(d.min)) : "nessuna attività"} · ${d.sigarette} ${d.sigarette === 1 ? "sigaretta" : "sigarette"}</div></div>${dettagli}`;
  }).join("");
  // frase di riepilogo per il periodo scelto
  const pLabel = { giorno: "Oggi", settimana: "Questa settimana", mese: "Questo mese", anno: "Quest'anno", tutto: "In totale" }[periodo] || "In questo periodo";
  const righeAtt = Object.values(perAtt).sort((x, y) => y.min - x.min).map((a) => `${a.text.toLowerCase()} per ${fumoDurataMin(a.min)}`);
  const frase = `${pLabel} hai dedicato ${righeAtt.length ? righeAtt.join(", ") : "nessuna attività registrata"}${totSig ? `, e ${totSig} ${totSig === 1 ? "sigaretta" : "sigarette"}` : ""}.`;
  const bottoni = Object.entries(GIORNATA_PERIODI).map(([k, v]) => `<button class="btn ${k === periodo ? "primary" : "ghost"} small-btn" data-act="giornata-periodo" data-p="${k}">${esc(v)}</button>`).join(" ");
  return `
    <div class="btns" style="justify-content:flex-end"><button class="link" data-act="giornata-report-toggle">${T("Torna al registro", "Back to the log")}</button></div>
    <section class="card">
      <div style="display:flex;flex-wrap:wrap;gap:6px">${bottoni}</div>
      <p class="stat-v" style="margin:10px 0 0">${esc(fumoDurataMin(totMin))} ${T("di attività", "of activity")} · ${totSig} ${T(totSig === 1 ? "sigaretta" : "sigarette", totSig === 1 ? "cigarette" : "cigarettes")}</p>
      <p style="margin:8px 0 0">${esc(frase)}</p>
    </section>
    ${(() => {
      const nonClass = [...new Map(acts.filter((e) => !haGruppo(e.text)).map((e) => [parolaChiave(e.text).toLowerCase(), parolaChiave(e.text)])).values()];
      if (!nonClass.length) return "";
      return `<section class="card"><h2>Da classificare</h2><p class="muted small">Scrivi il nome del gruppo in cui mettere queste voci. Le voci future con la stessa parola finiranno lì da sole.</p>
        ${nonClass.map((k) => `<form class="form giornata-classifica" data-parola="${esc(k)}" style="margin-top:8px"><div class="muted small">${esc(k)}</div><div style="display:flex;gap:8px"><input name="nome" maxlength="40" value="${esc(k)}" style="flex:1"><button class="btn ghost small-btn" type="submit">Metti qui</button></div></form>`).join("")}
      </section>`;
    })()}
    <section class="card"><h2>Gruppi di attività</h2>
      ${((S.giornata && S.giornata.gruppi) || []).map((g, i) => `<div class="fumo-item"><div class="fumo-text"><strong>${esc(g.nome)}</strong>: ${esc(g.parole.join(", "))}</div><div class="fumo-tools"><button class="btn ghost small-btn" data-act="giornata-gruppo-edit" data-i="${i}">${T("Modifica", "Edit")}</button><button class="btn danger small-btn" data-act="giornata-gruppo-del" data-i="${i}">${T("Elimina", "Delete")}</button></div></div>`).join("")}
      <form id="giornata-gruppo-form" class="form" style="margin-top:10px">
        <input name="nome" maxlength="40" placeholder="Nome del gruppo, es. Auto">
        <input name="parole" maxlength="200" placeholder="Parole, separate da virgola: auto, macchina, automobile">
        <button class="btn ghost wide" type="submit">Salva gruppo</button>
      </form>
    </section>
    <section class="card"><h2>Per attività</h2>${attRows || `<p class="muted small">Nessuna attività in questo periodo.</p>`}</section>
    <section class="card"><h2>Per giorno</h2>${giorniRows || `<p class="muted small">Nessuna voce in questo periodo.</p>`}</section>`;
}

// Durata scritta a mano o detta: "2 ore", "2 ore e 30 minuti", "un'ora e mezza", "90" (minuti). Null se non si capisce.
function durataIn(testo) {
  const t = String(testo || "").toLowerCase().trim();
  if (!t) return 0;
  if (/^\d+$/.test(t)) return parseInt(t);
  let minuti = 0, trovato = false;
  const ore = t.match(/(\d+)\s*or[ae]/) || t.match(/\b(un['’ ]?)ora\b/);
  if (ore) { minuti += (ore[1] && /^\d+$/.test(ore[1]) ? parseInt(ore[1]) : 1) * 60; trovato = true; }
  const min = t.match(/(\d+)\s*min/);
  if (min) { minuti += parseInt(min[1]); trovato = true; }
  if (/mezz[oa]?\s*['’]?\s*ora/.test(t) || /\be\s+mezz[oa]\b/.test(t)) { minuti += 30; trovato = true; }
  if (/un\s+quarto/.test(t)) { minuti += 15; trovato = true; }
  return trovato ? minuti : null;
}

// Gruppi di partenza, aggiunti una volta sola se non esistono già. Puoi modificarli nel report.
const GIORNATA_GRUPPI_BASE = [
  { nome: "App", parole: ["app"] },
  { nome: "Pratica Maruccio e Bartoletti", parole: ["pratica", "bartoletti"] },
  { nome: "Telefonate", parole: ["telefonata"] },
  { nome: "Mail", parole: ["mail"] },
  { nome: "Meditazione", parole: ["medit", "mindfulness"] },
  { nome: "Bagno", parole: ["bagno", "lavarmi"] },
  { nome: "Spesa", parole: ["supermercato"] },
];
function giornataAssicuraGruppi() {
  if (!S.giornata) S.giornata = { log: [] };
  S.giornata.gruppi = S.giornata.gruppi || [];
  if (S.giornata.gruppiBaseOk) return;
  GIORNATA_GRUPPI_BASE.forEach((g) => { if (!S.giornata.gruppi.some((x) => normTesto(x.nome) === normTesto(g.nome))) S.giornata.gruppi.push({ ...g }); });
  S.giornata.gruppiBaseOk = true;
}

// Riepilogo del giorno: un totale per argomento, senza elenco delle voci.
const hhmmG = (iso) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
function giornataRiepilogoHtml(day, acts, nSmoke) {
  const totali = {};
  acts.filter((e) => keyOf(new Date(e.at)) === day && e.min).forEach((e) => {
    const nome = gruppoDi(e.text);
    totali[nome] = (totali[nome] || 0) + e.min;
  });
  const righe = Object.entries(totali).sort((a, b) => b[1] - a[1])
    .map(([nome, min]) => `<button class="row" data-act="giornata-riep-open" data-g="${esc(nome)}" style="width:100%;background:none;border:0;padding:8px 0;text-align:left;color:inherit;cursor:pointer;font:inherit"><div style="flex:1">${esc(nome)}</div><div style="font-weight:700">${esc(fumoDurataMin(min))} <span class="muted small">modifica</span></div></button>`).join("");
  const totale = Object.values(totali).reduce((a, b) => a + b, 0);
  if (!righe) return "";
  return `<section class="card"><h2>Riepilogo di oggi</h2>${righe}
    <div class="row" style="margin-top:6px;border-top:1px solid var(--line);padding-top:6px"><div style="flex:1;font-weight:700">Totale</div><div style="font-weight:700">${esc(fumoDurataMin(totale))}</div></div>
    <p class="muted small" style="margin:8px 0 0">${T("Sigarette fumate", "Cigarettes smoked")}: ${nSmoke}</p></section>`;
}

// Le azioni che servono a resistere alla voglia (respirando, bevi un bicchiere...) non sono attività della giornata.
function isAzioneVoglia(testo) {
  const t = normTesto(testo).replace(/[.!?]+$/, "").trim();
  const noti = new Set([
    ...fumoPrevisione(), ...FUMO_PREVISIONE_BASE, ...Object.keys(FUMO_PREVISIONE_VECCHIE), ...Object.keys(FUMO_GERUNDI_IMPERATIVI),
    ...Object.values(FUMO_GERUNDI_IMPERATIVI), ...Object.values(FUMO_PREVISIONE_VECCHIE), ...FUMO_AZIONI.map((a) => a.t),
  ].map((x) => normTesto(x).replace(/[.!?]+$/, "").trim()));
  return noti.has(t) || /^respir(a|ando|are|i)\b/.test(t);
}

function renderGiornata() {
  const day = view.giornataDay || todayKey();
  const running = gRun();
  const startCard = `
    <section class="card">
      <h2>${T("Cosa stai facendo adesso?", "What are you doing now?")}</h2>
      <input id="giornata-start-text" list="giornata-suggest" maxlength="80" placeholder=T("Per esempio lavoro all'app", "For example working on the app")>
      <input id="giornata-start-time" maxlength="5" placeholder=T("Dalle, es. 6.50 (facoltativo, altrimenti adesso)", "From, e.g. 6.50 (optional, otherwise now)") style="margin-top:8px">
      <button class="btn primary wide" data-act="giornata-start" style="margin-top:8px">${T("Inizia", "Start")}</button>
    </section>`;
  const runningHtml = (running.length ? running.map((r, i) => `
    <section class="card" style="text-align:center">
      <div class="muted small">${T("In corso", "In progress")}</div>
      <div style="font-weight:700;font-size:1.1rem">${esc(r.text)}</div>
      <div class="giornata-live" data-start="${r.start}" style="font-size:2.2rem;font-weight:700;font-variant-numeric:tabular-nums">${esc(fumoHMS(fumoNow() - r.start))}</div>
      <div class="btns" style="justify-content:center;margin-top:8px"><button class="btn primary" data-act="giornata-stop" data-i="${i}">${T("Finisci", "Finish")}</button><button class="link" data-act="giornata-rename" data-i="${i}">${T("Cambia nome", "Rename")}</button><button class="link" data-act="giornata-cancel" data-i="${i}">${T("Annulla", "Cancel")}</button></div>
    </section>`).join("") : "") + startCard;
  const acts = ((S.giornata && S.giornata.log) || []).map((e, idx) => ({ ...e, idx })).filter((e) => e.kind !== "pausa").map((e) => ({ ...e, kind: "act" }));
  const pause = ((S.giornata && S.giornata.log) || []).map((e, idx) => ({ ...e, idx })).filter((e) => e.kind === "pausa").map((e) => ({ ...e, kind: "pausa" }));
  // Le attività registrate dalla scheda Fumo (ricerca o "Fatto") compaiono anche qui, senza durata.
  const attFumo = ((S.fumo && S.fumo.log) || []).map((e) => ({ ...e })).filter((e) => e.kind === "act" && !isAzioneVoglia(e.text)).map((e) => ({ ...e, kind: "act", fumo: true, idx: -1 }));
  acts.push(...attFumo);
  const smokes = ((S.fumo && S.fumo.log) || []).map((e, idx) => ({ ...e, idx })).filter((e) => e.kind === "smoke").map((e) => ({ ...e, kind: "smoke", fromFumo: true }));
  const rows = [...acts, ...smokes, ...pause].filter((e) => keyOf(new Date(e.at)) === day).sort((a, b) => b.at.localeCompare(a.at));
  const nAct = acts.filter((e) => keyOf(new Date(e.at)) === day).length;
  const nSmoke = rows.filter((e) => e.kind === "smoke").reduce((a, e) => a + (e.n || 1), 0);
  // Totale del tempo: le attività sovrapposte contano una volta sola.
  const intervalli = rows.filter((e) => e.kind === "act" && e.min).map((e) => [new Date(e.at).getTime(), new Date(e.at).getTime() + e.min * 60000]).sort((a, b) => a[0] - b[0]);
  const fusi = [];
  intervalli.forEach(([a0, b0]) => {
    const ultimo = fusi[fusi.length - 1];
    if (ultimo && a0 <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], b0); else fusi.push([a0, b0]);
  });
  const minTot = Math.round(fusi.reduce((acc, [a0, b0]) => acc + (b0 - a0), 0) / 60000);
  const gOver = (iso) => {
    const t = new Date(iso).getTime();
    const names = acts.filter((a) => keyOf(new Date(a.at)) === day && new Date(a.at).getTime() <= t && t <= new Date(a.at).getTime() + (a.min || 0) * 60000).map((a) => a.text);
    gRun().forEach((r) => { if (r.start <= t && keyOf(new Date(r.start)) === day) names.push(r.text); });
    return names.join(", ");
  };
  const hhmm = (iso) => new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const lines = rows.map((e) => `<div class="fumo-item fumo-timed"><div class="muted small" style="font-variant-numeric:tabular-nums">${esc(hhmm(e.at))}:</div><div class="fumo-text">${e.kind === "pausa" ? `Sigaretta, ${esc(fumoDurataMin(e.min))}` : e.kind === "act" ? esc(e.text) + (e.min ? ` · ${fumoDurataMin(e.min)}` : "") : `Hai fumato ${e.n || 1} ${(e.n || 1) === 1 ? "sigaretta" : "sigarette"}${gOver(e.at) ? ` · mentre: ${esc(gOver(e.at))}` : ""}`}</div>${e.kind === "act" ? `<div class="fumo-tools"><button class="btn ghost small-btn" data-act="giornata-log-edit" data-idx="${e.idx}">${T("Modifica", "Edit")}</button>${haGruppo(e.text) ? `<span class="muted small" style="align-self:center">Gruppo: ${esc(gruppoDi(e.text))}</span>` : `<button class="btn ghost small-btn" data-act="giornata-grp-open" data-idx="${e.idx}">${T("Gruppo", "Group")}</button>`}<button class="btn danger small-btn" data-act="giornata-log-del" data-idx="${e.idx}">${T("Elimina", "Delete")}</button></div>` : ""}${e.kind === "smoke" ? `<div class="fumo-tools"><button class="btn ghost small-btn" data-act="fumo-log-edit" data-idx="${e.idx}">${T("Modifica", "Edit")}</button><button class="btn danger small-btn" data-act="fumo-log-del" data-idx="${e.idx}">${T("Elimina", "Delete")}</button></div>` : ""}</div>`).join("");
  if (view.giornataReport) return giornataReportHtml();
  giornataAssicuraGruppi();
  return `
    <div class="btns" style="justify-content:flex-end"><button class="link" data-act="giornata-report-toggle">${T("Report della settimana", "Weekly report")}</button></div>
    ${runningHtml}
    ${giornataRiepilogoHtml(day, acts, nSmoke)}
    ${view.giornataRegistroOpen ? "" : `<section class="card"><div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div><div style="font-size:1.2rem;font-weight:700">${T("Registro di oggi", "Today's log")}</div><div style="font-size:1rem;color:var(--muted);margin-top:2px">${nAct} ${nAct === 1 ? "attività" : "attività"} · ${nSmoke} ${nSmoke === 1 ? "sigaretta" : "sigarette"}</div></div><button class="btn ghost small-btn" data-act="giornata-registro-toggle">${T("Mostra", "Show")}</button></div></section>`}
    ${view.giornataRegistroOpen ? `<section class="card">
      <div class="row" style="align-items:center"><button class="link" data-act="giornata-registro-toggle">${T("Nascondi registro", "Hide log")}</button></div>
      <div class="row" style="align-items:center">
        <button class="btn ghost small-btn" data-act="giornata-prev">${T("Giorno prima", "Previous day")}</button>
        <strong style="text-align:center">${esc(fmtDate(day))}</strong>
        <button class="btn ghost small-btn" data-act="giornata-next" ${day >= todayKey() ? "disabled" : ""}>${T("Giorno dopo", "Next day")}</button>
      </div>
      <p class="muted small" style="text-align:center">Attività: ${nAct}${minTot ? ` (${fumoDurataMin(minTot)})` : ""} · Sigarette fumate: ${nSmoke}</p>
      ${lines || `<p class="muted small">${T("Nessuna voce per questo giorno.", "No entries for this day.")}</p>`}
      <form id="giornata-add-form" class="form" style="margin-top:12px">
        <p class="muted small" style="margin:0 0 6px">${T("Qualcosa di già fatto da registrare? Scrivilo come una frase, anche con la tastiera che detta. Per esempio: \"ho lavorato all'app dalle 6.50 alle 9.50\" oppure \"ho fumato 2 sigarette alle 7\".", "Something already done to log? Write it as a sentence, or use voice dictation. For example: \"I worked on the app from 6.50 to 9.50\" or \"I smoked 2 cigarettes at 7\".")}</p>
        <input name="frase" maxlength="160" placeholder=T("Scrivi o detta la frase", "Write or dictate the sentence") required>
        <button class="btn ghost wide" type="submit">${T("Aggiungi", "Add")}</button>
        <datalist id="giornata-suggest"></datalist>
      </form>
    </section>` : ""}
`;
}

// Lista delle azioni della previsione: compare solo dopo aver toccato la casella di ricerca.
function fumoPlanHtml() {
  return `<div style="text-align:right"><button class="link" data-act="fumo-elenco-chiudi">Chiudi l'elenco</button></div>` + fumoPrevisione().map((a, i) => `<div class="fumo-item"><div class="fumo-text">${esc(a)}</div><div class="fumo-tools"><button class="btn ghost small-btn" data-act="fumo-act" data-i="${i}">Fatto</button><button class="btn ghost small-btn" data-act="fumo-plan-edit" data-i="${i}">${T("Modifica", "Edit")}</button><button class="btn danger small-btn" data-act="fumo-plan-del" data-i="${i}">${T("Elimina", "Delete")}</button></div></div>`).join("");
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
  const chiudi = `<div style="text-align:right"><button class="link" data-act="fumo-elenco-chiudi">Chiudi l'elenco</button></div>`;
  return chiudi + (rows + fresh || `<p class="muted small">Scrivi qualcosa: per esempio "bevi", "passeggiata", "doccia".</p>`);
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

// Ore scritte come le detta la voce: "dalle sei e mezza", "alle 9 e 50", "alle nove e un quarto".
function normOre(testo) {
  const H = { una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12 };
  const M = { cinque: 5, dieci: 10, quindici: 15, venti: 20, venticinque: 25, trenta: 30, quaranta: 40, cinquanta: 50 };
  let t = String(testo || "");
  t = t.replace(/\b(alle|dalle|sono le|verso le)\s+(una|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici)\b/gi,
    (_, p1, w) => `${p1} ${H[w.toLowerCase()]}`);
  t = t.replace(/(\d{1,2})\s+e\s+(mezza|mezzo)\b/gi, "$1.30");
  t = t.replace(/(\d{1,2})\s+e\s+un\s+quarto\b/gi, "$1.15");
  t = t.replace(/(\d{1,2})\s+e\s+tre\s+quarti\b/gi, "$1.45");
  t = t.replace(/(\d{1,2})\s+e\s+(quindici|venti|venticinque|trenta|quaranta|cinquanta|cinque|dieci)\b/gi, (_, h, w) => `${h}.${String(M[w.toLowerCase()]).padStart(2, "0")}`);
  t = t.replace(/(\d{1,2})\s+e\s+(\d{1,2})\b/gi, (_, h, m) => `${h}.${m.padStart(2, "0")}`);
  return t;
}

// Legge una frase tipo "ho lavorato all'app dalle 6.50 alle 9.50" o "ho fumato 2 sigarette alle 7".
const NUMERI_PAROLE = { un: 1, una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10 };
function parseFrase(frase, day) {
  // "due ore" → "2 ore": solo davanti a ore e minuti, così "una mail" resta com'è.
  const numeri = { un: 1, una: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, quindici: 15, venti: 20, trenta: 30, quaranta: 40, cinquanta: 50 };
  const s = normOre(String(frase || "").trim()).replace(/\b(un|una|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|quindici|venti|trenta|quaranta|cinquanta)\s+(?=(ore|ora|minuti|minuto)\b)/gi, (_, w) => numeri[w.toLowerCase()] + " ");
  const low = s.toLowerCase();
  const isoDay = parseKey(day);
  const oraIn = (str) => { const o = parseOra(str); if (!o) return null; const d = new Date(isoDay); d.setHours(o[0], o[1], 0, 0); return d; };
  const range = low.match(/dalle\s+([\d.:]+)\s+alle\s+([\d.:]+)/);
  const single = low.match(/alle\s+([\d.:]+)/);
  const fumo = /\bfumat[oa]\b|sigaret/.test(low);
  if (fumo) {
    const m = low.match(/(\d+|un|una|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci)\s+sigaret/);
    const n = m ? (parseInt(m[1]) || NUMERI_PAROLE[m[1]] || 1) : 1;
    const t = single ? oraIn(single[1]) : null;
    const at = t || (day === todayKey() ? new Date() : new Date(new Date(isoDay).setHours(12, 0, 0, 0)));
    if (!at) return { error: "Scrivi l'ora, per esempio alle 7" };
    if (at > new Date()) return { error: "L'ora è nel futuro" };
    return { kind: "smoke", n, at: at.toISOString() };
  }
  let text = s.replace(/dalle\s+[\d.:]+\s+alle\s+[\d.:]+/i, "").replace(/alle\s+[\d.:]+/i, "").replace(/dalle\s+[\d.:]+/i, "")
    .replace(/^\s*ho\s+/i, "").replace(/\s+/g, " ").trim();
  if (!text) return { error: "Scrivi cosa hai fatto" };
  text = text.charAt(0).toUpperCase() + text.slice(1);
  let start = range ? oraIn(range[1]) : single ? oraIn(single[1]) : null;
  if (range || single) { if (!start) return { error: "Ora non valida: prova 6.50" }; }
  else start = day === todayKey() ? new Date() : new Date(new Date(isoDay).setHours(12, 0, 0, 0));
  if (start > new Date()) return { error: "L'ora di inizio è nel futuro" };
  let min = 0;
  // durata passata: "per 20 minuti", "negli ultimi 20 minuti", "20 minuti", "per un'ora"
  const dur = low.match(/(?:\bper\s+|\bnegli\s+ultimi\s+|\bultimi\s+)?(mezz['’]ora|un['’]ora|un quarto d['’]ora|(\d+)\s*(minuti|minuto|ore|ora)(?:\s+e\s+(mezz[oa]))?)\b/);
  if (dur && !range && !single) {
    const q = dur[1];
    const base = q.startsWith("mezz") ? 30 : q.startsWith("un quarto") ? 15 : q.startsWith("un") && q.includes("ora") ? 60 : (parseInt(dur[2]) * (dur[3].startsWith("or") ? 60 : 1)) || 0;
    const mins = base + (dur[4] ? 30 : 0);
    if (mins > 0) {
      const now = new Date();
      const st = new Date(now.getTime() - mins * 60000);
      return { kind: "act", text: text.replace(/\s*(?:per\s+|negli\s+ultimi\s+|ultimi\s+)?(?:mezz['’]ora|un['’]ora|un quarto d['’]ora|\d+\s*(?:minuti|minuto|ore|ora))\b.*$/i, "").replace(/^sono stato\s+/i, "").replace(/^(?:sono|ho)\s+/i, "").replace(/^./, (c) => c.toUpperCase()) || "Attività", at: st.toISOString(), min: mins };
    }
  }
  if (range) {
    const end = oraIn(range[2]);
    if (!end) return { error: "Ora di fine non valida: prova 9.50" };
    if (end <= start) return { error: "L'ora di fine deve essere dopo l'inizio" };
    if (end > new Date()) return { error: "L'ora di fine è nel futuro" };
    min = Math.round((end - start) / 60000);
  }
  return { kind: "act", text, at: start.toISOString(), min };
}

// Breathing Space: tre minuti guidati, tre passi da un minuto ciascuno.
const FUMO_BS_PASSI = [
  { t: "Cosa senti adesso", d: "Nota cosa stai pensando e sentendo, senza giudicarlo. Dai un nome a quello che c'è." },
  { t: "Concentrati sul respiro", d: "Porta l'attenzione al respiro che entra ed esce. Seguilo per tutto il minuto." },
  { t: "Allarga l'attenzione", d: "Senti il corpo nella sua interezza, le mani, i piedi, le spalle. Poi torna alla giornata." },
];
let fumoBsTimer = null;
function fumoBreathingSpace() {
  const passo = (i) => {
    const p = FUMO_BS_PASSI[i];
    openDialog(`
      <h3>Breathing Space · ${i + 1} di 3</h3>
      <p style="font-weight:700;margin:6px 0">${esc(p.t)}</p>
      <p>${esc(p.d)}</p>
      <div id="fumo-bs-count" class="stat-v" style="text-align:center;font-size:2rem">0:60</div>
      <button class="btn ghost wide" data-act="dlg-close">Interrompi</button>`);
    const fine = fumoNow() + 60000;
    clearInterval(fumoBsTimer);
    fumoBsTimer = setInterval(() => {
      const c = $("#fumo-bs-count");
      if (!c || !dlg().open) { clearInterval(fumoBsTimer); return; }
      const left = Math.max(0, fine - fumoNow());
      c.textContent = `0:${String(Math.ceil(left / 1000)).padStart(2, "0")}`;
      if (left === 0) { clearInterval(fumoBsTimer); if (i < 2) passo(i + 1); else { closeDialog(); toast(T("Ottimo, tre minuti fatti", "Well done, three minutes done")); } }
    }, 250);
  };
  passo(0);
}

// Chiude la pausa per sigaretta e la registra con la sua durata.
function gChiudiPausa() {
  const p = S.giornata && S.giornata.pausa;
  if (!p) return;
  // La sigarette si registrano nella scheda Fumo e compaiono da lì anche nella Giornata: qui non si duplicano.
  S.giornata.pausa = null;
}

// Attività in corso: più di una alla volta. Le sigarette si registrano a parte e possono cadere dentro un'attività.
function gRun() {
  S.giornata = S.giornata || { log: [] };
  if (S.giornata.current && !S.giornata.running) { S.giornata.running = [S.giornata.current]; S.giornata.current = null; }
  S.giornata.running = S.giornata.running || [];
  return S.giornata.running;
}

// Trasforma "mi metto a lavorare all'auto" in "Lavorando all'auto".
const GERUNDI_IRREGOLARI = { fare: "facendo", bere: "bevendo", dire: "dicendo", porre: "ponendo", tradurre: "traducendo" };
function attivitaGerundio(testo) {
  let t = String(testo || "").trim().toLowerCase()
    .replace(/^(?:mi\s+metto\s+a\s+|mi\s+metto\s+in\s+|mi\s+metto\s+|sto\s+|sono\s+a\s+|ho\s+iniziato\s+a\s+|inizio\s+a\s+|comincio\s+a\s+|vado\s+a\s+|vado\s+in\s+)/, "");
  const m = t.match(/^([a-zàèéìòù]+?)(are|ere|ire|rre)\b(.*)$/);
  if (!m) return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
  const verbo = m[1] + m[2];
  const base = GERUNDI_IRREGOLARI[verbo] || (m[2] === "are" ? m[1] + "ando" : m[1] + "endo");
  const resto = m[3].trim();
  const frase = resto ? `${base} ${resto}` : base;
  return frase.charAt(0).toUpperCase() + frase.slice(1);
}

// "sto lavorando all'app da mezz'ora": tolgo la durata e la uso per l'ora di inizio.
function durataDaTesto(testo) {
  const m = String(testo || "").match(/\bda\s+(mezz[oa]?\s*['’]?\s*ora|un['’ ]ora|un quarto d['’ ]?ora|(\d+)\s*(minuti|minuto|ore|ora))\b/i);
  if (!m) return null;
  const q = m[1].toLowerCase();
  let minuti = 0;
  if (q.startsWith("mezz")) minuti = 30;
  else if (q.startsWith("un quarto") || q.startsWith("un quarto")) minuti = 15;
  else if (/^un['’ ]/.test(q) && q.includes("ora")) minuti = 60;
  else minuti = parseInt(m[2]) * (m[3].toLowerCase().startsWith("or") ? 60 : 1);
  return { minuti, resto: String(testo).replace(m[0], "").replace(/\s+/g, " ").trim() };
}

// Frasi come: "ho iniziato a lavorare all'app alle 6.50", "vado a fare la doccia", "ho finito di lavorare alle 9.50".
function fumoComando(frase) {
  const raw = normOre(String(frase || "").trim());
  const low = raw.toLowerCase();
  if (/fumat[oa]|sigaret/.test(low)) return null;
  const time = (low.match(/(?:alle|sono le|verso le)\s+([\d.:]+)/) || [])[1] || null;
  const durata = durataDaTesto(low);
  if (durata && durata.minuti > 0 && /^(?:mi\s+sto\s+|sto\s+|sono\s+|ci\s+sono\s+)/.test(low)) {
    const testoPulito = durata.resto.replace(/^(?:mi\s+sto\s+|sto\s+|sono\s+|ci\s+sono\s+)/i, "").replace(/\b(?:ci sto|sto ancora|ancora|sono ancora|ci sono ancora)\b.*$/i, "").trim();
    if (testoPulito) return { type: "start", text: testoPulito, time: null, startAt: fumoNow() - durata.minuti * 60000 };
  }
  const pulisci = (x) => x
    .replace(/(?:alle|sono le|verso le)\s+[\d.:]+.*$/, "")
    .replace(/\b(?:ci sto|sto ancora|ancora|sono ancora|ci sono ancora)\b.*$/, "")
    .replace(/\s+/g, " ").trim();
  let m = low.match(/(?:^|\s)(?:ho\s+|sono\s+)?(?:iniziato|cominciato|inizio|comincio|iniziando|cominciando)\b\s*(?:a\s+|di\s+|con\s+)?(.*)$/);
  if (m) { const text = pulisci(m[1]); return text ? { type: "start", text, time } : null; }
  m = low.match(/(?:^|\s)(?:ho\s+)?finit[oa]\b\s*(?:di\s+|a\s+)?(.*)$/);
  if (m) return { type: "stop", hint: pulisci(m[1]).toLowerCase(), time };
  m = low.match(/^vado\s+(?:a\s+|in\s+|al\s+|alla\s+|allo\s+|ai\s+|agli\s+|nel\s+|nella\s+|da\s+)?(.*)$/);
  if (m) { const text = pulisci(m[1]); return text ? { type: "switch", text, time } : null; }
  return null;
}

// Ora scritta a mano: 6.50, 6:50, 6 50, 650, 6 oppure 1050. Restituisce [ore, minuti] o null.
function parseOra(str) {
  const t = String(str || "").trim();
  let m = t.match(/^(\d{1,2})[.:\s]?(\d{2})$/);
  if (m) return [parseInt(m[1]), parseInt(m[2])].every((x, i) => i === 0 ? x < 24 : x < 60) ? [parseInt(m[1]), parseInt(m[2])] : null;
  m = t.match(/^(\d{1,2})$/);
  if (m && parseInt(m[1]) < 24) return [parseInt(m[1]), 0];
  return null;
}

// Durata di un'attività in ore e minuti: 3 ore, 3 ore e 20 minuti, 40 minuti.
function fumoDurataMin(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  if (h === 0) return `${m} ${m === 1 ? "minuto" : "minuti"}`;
  return `${h} ${h === 1 ? "ora" : "ore"}${m ? ` e ${m} ${m === 1 ? "minuto" : "minuti"}` : ""}`;
}

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
    document.querySelectorAll(".giornata-live").forEach((el) => { el.textContent = fumoHMS(fumoNow() - Number(el.dataset.start)); });
  }, 1000);
}

function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// elenco delle sigarette di oggi, con l'ora e il pulsante per toglierne una (come gli alimenti)
function fumoCigOggiHtml() {
  const oggi = todayKey();
  const righe = ((S.fumo && S.fumo.log) || []).map((e, i) => ({ e, i })).filter(({ e }) => e.kind === "smoke" && keyOf(new Date(e.at)) === oggi);
  if (!righe.length) return `<section class="card"><p class="muted small">${T("Nessuna sigaretta registrata oggi.", "No cigarettes logged today.")}</p></section>`;
  return `<section class="card"><h3>Sigarette di oggi</h3>${righe.map(({ e, i }) => `<div class="row"><div>Sigaretta alle ${esc(new Date(e.at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }))}</div><button class="link small-link" data-act="fumo-del-cig" data-i="${i}" aria-label="Togli">×</button></div>`).join("")}</section>`;
}
function renderFumo() {
  if (!S.fumo) return renderFumoSetup();
  if (view.fumoEdit) return renderFumoSetup(true);
  const f = S.fumo, st = fumoStats();
  const tecOggi = fumoPensieroDiOggi();
  const perDay = f.smokedDays || {};
  const dayKeys = Array.from({ length: 7 }, (_, i) => addDays(todayKey(), -i));
  // il riquadro in cima segue il giorno scelto con Giorno prima / dopo (oggi se non ne scegli un altro)
  const smokedToday = perDay[view.fumoDay || todayKey()] || 0;
  const giornoScelto = view.fumoDay || todayKey();
  const weekRows = dayKeys.map((k) => `<div class="row"><div>${esc(fmtDate(k, { weekday: "short", day: "numeric", month: "short" }))}</div><div class="row-r">${perDay[k] || 0}</div></div>`).join("");
  const done = FUMO_TRAGUARDI.filter((m) => st.hours >= m.h);
  const next = FUMO_TRAGUARDI.find((m) => st.hours < m.h);
  const today = new Date().toDateString();
  const resistedToday = (f.resisted || []).filter((t) => new Date(t).toDateString() === today).length;
  const pctNext = next ? Math.min(100, Math.round((st.hours / next.h) * 100)) : 100;
  const sigOggi = (f.smokedDays || {})[todayKey()] || 0;
  const tettoC = f.tettoGiorno || 4;
  const commento = sigOggi === 0
    ? { titolo: T("Nessuna sigaretta oggi.", "No cigarettes today."), testo: T("Continua così: ogni ora senza fumo conta.", "Keep going: every smoke-free hour counts.") }
    : sigOggi < tettoC
      ? { titolo: `${T(`Sei a ${sigOggi} di ${tettoC}.`, `You are at ${sigOggi} of ${tettoC}.`)}`, testo: T("Sei nel limite. Alla prossima voglia scegli una delle azioni sotto.", "You are within the limit. Next time you crave one, pick an action below.") }
      : sigOggi === tettoC
        ? { titolo: `Sei al tetto: ${tettoC} di ${tettoC}.`, testo: T("Sei al limite di oggi. Scegli una delle azioni sotto.", "You are at today's limit. Pick one of the actions below.") }
        : { titolo: T(`Hai sforato il tetto di ${sigOggi - tettoC}.`, `You went over the cap by ${sigOggi - tettoC}.`), testo: T(`Oltre ${tettoC} sigarette al giorno fa male. Riparti dalla prossima voglia: scegli una delle azioni sotto.`, `More than ${tettoC} cigarettes a day is harmful. Restart at the next craving: pick an action below.`) };
  const tetto = f.tettoGiorno || 4;
  const tettoPct = Math.min(100, Math.round((smokedToday / tetto) * 100));
  const sforo = smokedToday > tetto;
  const verdePct = sforo ? Math.round((tetto / smokedToday) * 100) : tettoPct;
  const barraHtml = `<div style="height:12px;background:#e5e5e5;border-radius:6px;overflow:hidden;display:flex" aria-label="Sigarette di oggi rispetto al tetto"><div style="width:${verdePct}%;height:100%;background:#2e7d32"></div>${sforo ? `<div style="width:${100 - verdePct}%;height:100%;background:#c0392b"></div>` : ""}</div>`;
  const bannerTetto = `<section class="card" style="text-align:center;padding:14px 10px"><div style="font-size:3.2rem;font-weight:800;line-height:1;font-variant-numeric:tabular-nums">${smokedToday}<span class="muted" style="font-size:1.4rem"> ${T("di", "of")} ${tetto}</span></div><div class="muted small">${T("sigarette oggi", "cigarettes today")}</div><p style="margin:8px 0 6px">${sforo ? `Hai sforato il tetto di ${smokedToday - tetto}.` : smokedToday === tetto ? T("Sei al tetto di oggi.", "You are at today's cap.") : `${T("Ne restano ", "Left: ")}${tetto - smokedToday}${T(".", ".")}`}</p>${barraHtml}${view.fumoDay && view.fumoDay !== todayKey() ? `<div style="margin-top:10px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap"><span class="small">${T("Correggi il numero di questo giorno:", "Correct this day's number:")}</span><input id="fumo-set-n" type="number" inputmode="numeric" min="0" value="${smokedToday}" style="width:4.5em"><button class="btn ghost small-btn" data-act="fumo-set-day">${T("Salva", "Save")}</button></div>` : ""}</section>`;
  const dataScelta = view.fumoDay || todayKey();
  const navGiorno = `<section class="card" style="padding:10px"><div class="btns" style="justify-content:space-between;align-items:center"><button class="btn ghost small-btn" data-act="fumo-day-prev">${T("Giorno prima", "Previous day")}</button><div style="font-weight:700;text-align:center">${dataScelta === todayKey() ? T("Oggi", "Today") : esc(fmtDate(dataScelta, { weekday: "long", day: "numeric", month: "long" }))}</div><button class="btn ghost small-btn" data-act="fumo-day-next" ${dataScelta >= todayKey() ? "disabled" : ""}>${T("Giorno dopo", "Next day")}</button></div></section>`;
  return `${navGiorno}${bannerTetto}${fumoCigOggiHtml()}
    <section class="card" style="text-align:center;padding:14px 10px">

      <div class="muted small">${T("sigarette oggi", "cigarettes today")}</div>
      <div style="font-size:1.4rem;font-weight:800;line-height:1.2;margin-top:10px">${esc(commento.titolo)}</div>
      <div class="small" style="margin-top:6px">${esc(commento.testo)}</div>
    </section>
    <div style="text-align:center;margin:-6px 0 10px"><button class="link" data-act="fumo-breathing">${T("Breathing Space · 3 minuti", "Breathing Space · 3 minutes")}</button></div>
    <div class="btns" style="justify-content:center;gap:18px;margin-bottom:16px">
      <button class="btn primary" data-act="fumo-add-cig" style="${FUMO_ROUND}">${T("Aggiungi sigaretta", "Add cigarette")}</button>
    </div>
    ${fumoDiaryCard()}
    ${fumoSearchCard()}
    <section class="card">
      <p class="stat-v" style="text-align:center;font-size:1.6rem;margin:0 0 8px">${T("Resisti!", "Hold on!")}</p>
      <ul style="margin:0;padding-left:20px">${fumoAzioniDiOggi().map((a) => `<li style="margin:6px 0">${esc(fumoI(a.t))}</li>`).join("")}</ul>
    </section>
    <section class="card">
      <h2>${T("Previsione della giornata", "Day forecast")}</h2>
      <p class="muted small">${T("Quando hai voglia di fumare, scegli una di queste azioni. Ogni azione fatta al posto della sigaretta conta.", "When you crave a cigarette, pick one of these actions. Every action done instead of smoking counts.")}</p>
      <div id="fumo-plan">${view.fumoPlanOpen ? fumoPlanHtml() : ""}</div>
      <form id="fumo-acts-form" class="form" style="margin-top:10px">
        <input name="act" maxlength="80" placeholder="Aggiungi un'azione">
        <button class="btn ghost wide" type="submit">${T("Aggiungi", "Add")}</button>
      </form>
    </section>
    <section class="card" style="text-align:center"><p>${esc(fumoI(tecOggi.t))}</p></section>
    <section class="card">
      ${f.attempts && f.attempts.length ? `<div class="muted small">Ultima resistenza: ${Math.floor(f.attempts[f.attempts.length - 1].seconds / 60)} minuti e ${f.attempts[f.attempts.length - 1].seconds % 60} secondi</div>` : ""}
    </section>
    <section class="card">
      <div class="stats">
        <div class="stat"><div class="muted small">${T("Azioni fatte al posto di fumare", "Actions done instead of smoking")}</div><div class="stat-v">${(S.fumo && S.fumo.actCount) || 0}</div></div>
        <div class="stat"><div class="muted small">${T("Sigarette evitate", "Cigarettes avoided")}</div><div class="stat-v">${r0(st.avoided)}</div></div>
        <div class="stat"><div class="muted small">${T("Sigarette fumate oggi", "Cigarettes smoked today")}</div><div class="stat-v">${smokedToday}</div></div>
        <div class="stat"><div class="muted small">${T("Sigarette fumate in totale", "Total cigarettes smoked")}</div><div class="stat-v">${f.smoked || 0}</div></div>
        <div class="stat"><div class="muted small">${T("Soldi risparmiati", "Money saved")}</div><div class="stat-v">${fumoEuro(st.saved)}</div></div>
        <div class="stat"><div class="muted small">${T("Vita recuperata (stima)", "Life regained (estimate)")}</div><div class="stat-v">${st.minutes >= 1440 ? r1(st.minutes / 1440) + " giorni" : st.minutes >= 60 ? r1(st.minutes / 60) + " ore" : r0(st.minutes) + " min"}</div></div>
      </div>
      <p class="muted small">La stima della vita recuperata conta 11 minuti per sigaretta evitata ed è solo indicativa.</p>
    </section>
    <p class="muted small">Voglie superate oggi: ${resistedToday}. In totale: ${(f.resisted || []).length} superate su ${(f.cravings || []).length} registrate.</p>
    <section class="card">
      <h3>${T("Prossimo traguardo", "Next milestone")}</h3>
      ${next ? `<p><strong>${esc(fumoI(next.t))}</strong>: ${esc(fumoI(next.d))}</p>${bar(pctNext, 100)}<div class="muted small">${pctNext}% del tempo</div>` : "<p>Hai superato tutti i traguardi in elenco. Continua così.</p>"}
    </section>
    ${done.length ? `<section class="card"><h3>${T("Traguardi raggiunti", "Milestones reached")}</h3>${done.map((m) => `<p class="small"><strong>${esc(fumoI(m.t))}</strong>: ${esc(fumoI(m.d))}</p>`).join("")}<p class="muted small">Indicazioni generali di salute pubblica: i tempi variano da persona a persona.</p></section>` : ""}
    <section class="card"><h3>${T("Sigarette fumate per giorno", "Cigarettes smoked per day")}</h3>${weekRows}</section>
    <section class="card"><h3>${T("Traguardi di riduzione", "Reduction milestones")}</h3>${fumoRiduzioni().map((m) => `<p class="small"><strong>${m.ok ? "Raggiunto" : "Da raggiungere"}:</strong> ${esc(fumoI(m.t))}</p>`).join("")}<p class="muted small">Il confronto è tra un giorno e il precedente, sulle sigarette registrate con "Ho fumato".</p></section>
    ${f.reason ? `<section class="card"><h3>${T("Il tuo motivo", "Your reason")}</h3><p>${esc(f.reason)}</p></section>` : ""}
    <section class="card">
      <h3>${T("Impostazioni", "Settings")}</h3>
      <div class="btns">
        <button class="btn ghost" data-act="fumo-edit">${T("Modifica dati", "Edit data")}</button>
      </div>
      <p class="muted small">Se hai fumato, non è un fallimento: riparti da adesso. I giorni fatti prima restano nello storico${f.best ? ` (record: ${esc(fumoDuration(f.best))})` : ""}.</p>
    </section>`;
}

function renderFumoSetup(editing) {
  const f = S.fumo || { perDay: 15, packPrice: 6.5, packSize: 20, reason: "", start: new Date().toISOString() };
  return `
    <section class="card">
      <h3>${editing ? T("Modifica dati", "Edit data") : T("Smettere di fumare", "Quitting smoking")}</h3>
      <p class="muted small">${editing ? "" : T("Pochi dati per calcolare risparmio e traguardi. Restano solo sul tuo dispositivo.", "A few details to calculate savings and milestones. They stay only on your device.")}</p>
      <form id="fumo-form" class="form">
        <label>${T("Quando hai smesso (o smetti)", "When you quit (or will quit)")}
          <input type="datetime-local" name="start" value="${toLocalInput(new Date(f.start))}" required></label>

        <label>${T("Sigarette al giorno: 3-4 tollerate dal medico, oltre fa male", "Cigarettes a day: 3-4 tolerated by your doctor, more is harmful")}<input type="number" name="tettoGiorno" min="0" max="40" step="1" value="${f.tettoGiorno || 4}" required></label>        <label>${T("Sigarette al giorno prima di smettere", "Cigarettes a day before quitting")}
          <input type="number" name="perDay" min="1" max="100" step="1" value="${f.perDay}" required></label>
        <label>${T("Prezzo di un pacchetto in euro", "Price of a pack (euro)")}
          <input type="number" name="packPrice" min="0.5" max="30" step="0.1" value="${f.packPrice}" required></label>
        <label>${T("Sigarette per pacchetto", "Cigarettes per pack")}
          <input type="number" name="packSize" min="1" max="50" step="1" value="${f.packSize}" required></label>
        <label>${T("Il tuo motivo per smettere", "Your reason to quit")}
          <textarea name="reason" rows="2" maxlength="200">${esc(f.reason || "")}</textarea></label>
        <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
        ${editing ? `<button class="btn ghost wide" type="button" data-act="fumo-cancel">${T("Annulla", "Cancel")}</button>` : ""}
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
    <button class="btn primary wide" data-act="fumo-wait">${T("Inizia", "Start")}</button>
    <button class="btn ghost wide" data-act="dlg-close">${T("Annulla", "Cancel")}</button>`);
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

// Un solo suggerimento alla volta, con "Un'altra" per cambiarlo.
function fumoSuggBox() {
  const list = fumoPrevisione();
  if (!list.length) return "";
  if (view.fumoSugg == null || view.fumoSugg >= list.length) view.fumoSugg = Math.floor(Math.random() * list.length);
  const i = view.fumoSugg;
  const run = gRun();
  const stai = run.length ? `<p style="margin:0 0 6px">Stai facendo: <strong>${esc(run[run.length - 1].text)}</strong>. Continua così.</p>` : "";
  return `${stai}<p style="margin:0 0 6px">Prova a fare: <strong>${esc(list[i])}</strong></p>
    <button class="btn primary" data-act="fumo-act" data-i="${i}">La faccio</button>
    <button class="link" data-act="fumo-sugg-next">Un'altra</button>`;
}

function fumoShowCraving(act) {
  const tec = fumoPensieroById(act.tech);
  openDialog(`
    <h3>Cronometro</h3>
    <div id="fumo-count" style="font-size:3rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums"></div>
    <div class="bar" style="margin:10px 0"><span id="fumo-bar" style="width:0%"></span></div>
    <p id="fumo-breath" class="small" style="text-align:center"></p>
    <p>${esc(fumoI(tec.t))}</p>
    ${S.fumo.reason ? `<p class="small"><strong>Il tuo motivo:</strong> ${esc(S.fumo.reason)}</p>` : ""}
    <div id="fumo-sugg-box" style="margin:12px 0">${fumoSuggBox()}</div>
    <input id="fumo-dialog-text" maxlength="80" placeholder="${T("Oppure scrivi o detta cosa fai al posto della sigaretta", "Or write or dictate what you do instead of the cigarette")}" style="margin-top:4px">
    <button class="btn ghost wide" data-act="fumo-dialog-log" style="margin-top:6px">Registra</button>
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
          <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">${T("Annulla", "Cancel")}</button>
        </form>`);
      return true;
    }
    case "fumo-plan-del": {
      const i = parseInt(el.dataset.i);
      if (!confirm(T("Eliminare questa azione dalla previsione?", "Remove this action from the forecast?"))) return true;
      S.fumo.acts = fumoPrevisione().filter((_, k) => k !== i);
      save(); render(); toast(T("Azione eliminata", "Action removed"));
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
        <h3>${e.kind === "act" ? T("Modifica l'azione", "Edit the action") : T("Modifica le sigarette", "Edit the cigarettes")}</h3>
        <form id="fumo-item-form" class="form" data-kind="log" data-idx="${idx}">
          ${field}
          <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">${T("Annulla", "Cancel")}</button>
        </form>`);
      return true;
    }
    case "fumo-log-del": {
      const idx = parseInt(el.dataset.idx);
      const e = (S.fumo.log || [])[idx];
      if (!e || !confirm(T("Eliminare questa voce del registro?", "Delete this log entry?"))) return true;
      S.fumo.log = S.fumo.log.filter((_, k) => k !== idx);
      if (e.kind === "act") S.fumo.actCount = Math.max(0, (S.fumo.actCount || 0) - 1);
      if (e.kind === "smoke") {
        const n = e.n || 1, day = keyOf(new Date(e.at));
        S.fumo.smoked = Math.max(0, (S.fumo.smoked || 0) - n);
        if (S.fumo.smokedDays && S.fumo.smokedDays[day]) S.fumo.smokedDays[day] = Math.max(0, S.fumo.smokedDays[day] - n);
      }
      save(); render(); toast(T("Voce eliminata", "Entry removed"));
      return true;
    }
    case "giornata-start": {
      let text = String(($("#giornata-start-text") || {}).value || "").trim();
      if (!text) { toast(T("Scrivi cosa stai facendo", "Write what you are doing")); return true; }
      let start = fumoNow();
      // "ho lavorato 20 minuti", "negli ultimi 20 minuti", "per un'ora": attivita gia finita, registrata senza cronometro
      const dallaCasellaOra = String(($("#giornata-start-time") || {}).value || "").trim();
      if (!dallaCasellaOra && /(\d+\s*(minuti|minuto|ore|ora)|mezz['’]ora|un['’]ora|un quarto d['’]ora)\b/i.test(text)) {
        const pf = parseFrase(text, todayKey());
        if (pf && pf.kind === "act" && pf.min > 0) {
          S.giornata = S.giornata || { log: [] };
          S.giornata.log = [...(S.giornata.log || []), { at: pf.at, text: pf.text, min: pf.min }];
          save(); render(); toast(`Registrato: ${pf.text}, ${pf.min} minuti`);
          return true;
        }
      }
      const durataTxt = durataDaTesto(text);
      if (durataTxt && durataTxt.minuti > 0 && durataTxt.resto) {
        // "ho lavorato 20 minuti" e simili: attività gia finita, registrata senza far partire il cronometro
        const fatta = durataTxt.resto.replace(/^(?:ho\s+|sono\s+stato\s+|sto\s+|mi\s+sto\s+)/i, "").replace(/^./, (c) => c.toUpperCase());
        const finita = fumoNow() - durataTxt.minuti * 60000;
        const dallaCasella = String(($("#giornata-start-time") || {}).value || "").trim();
        if (!dallaCasella) {
          S.giornata = S.giornata || { log: [] };
          S.giornata.log = [...(S.giornata.log || []), { at: new Date(finita).toISOString(), text: fatta, min: durataTxt.minuti }];
          save(); render(); toast(`Registrato: ${fatta}, ${durataTxt.minuti} minuti`);
          return true;
        }
        start = finita; text = durataTxt.resto;
      }
      const dalle = String(($("#giornata-start-time") || {}).value || "").trim();
      if (dalle) {
        const ora = parseOra(dalle);
        if (!ora) { toast(T("Scrivi l'ora, per esempio 6.50", "Write the time, for example 6.50")); return true; }
        const d = new Date(); d.setHours(ora[0], ora[1], 0, 0);
        if (d > new Date()) { toast(T("L'ora di inizio è nel futuro", "The start time is in the future")); return true; }
        start = d.getTime();
      }
      gChiudiPausa();
      const run = gRun();
      if (run.length) {
        // Iniziare una nuova attività chiude quella più recente, all'ora di inizio della nuova.
        const last = run[run.length - 1];
        const min = Math.round((start - last.start) / 60000);
        if (min < 1) { toast(T("L'ora deve essere dopo l'inizio dell'attività in corso", "The time must be after the start of the current activity")); return true; }
        S.giornata.log = [...(S.giornata.log || []), { at: new Date(last.start).toISOString(), text: last.text, min }];
        run.pop();
      }
      run.push({ text: attivitaGerundio(text), start });
      save(); render(); toast(T("Attività iniziata", "Activity started"));
      return true;
    }
    case "giornata-log-edit": {
      const idx = parseInt(el.dataset.idx);
      const voce = (S.giornata && S.giornata.log || [])[idx];
      if (!voce) return true;
      openDialog(`
        <h3>Modifica l'attività</h3>
        <p class="muted small">Puoi cambiare il nome e la durata, per esempio "2 ore", "2 ore e 30 minuti" oppure "90" (minuti).</p>
        <form id="fumo-item-form" class="form" data-kind="glog" data-idx="${idx}">
          <input name="text" maxlength="80" value="${esc(voce.text)}" autofocus>
          <input name="durata" maxlength="30" value="${esc(voce.min ? fumoDurataMin(voce.min) : "")}" placeholder="Durata, es. 2 ore e 30 minuti">
          <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">${T("Annulla", "Cancel")}</button>
        </form>`);
      return true;
    }
    case "giornata-riep-open": {
      const g = el.dataset.g;
      const day = view.giornataDay || todayKey();
      const voci = ((S.giornata && S.giornata.log) || []).map((e, idx) => ({ ...e, idx }))
        .filter((e) => e.kind !== "pausa" && e.min && keyOf(new Date(e.at)) === day && gruppoDi(e.text) === g);
      if (!voci.length) return true;
      openDialog(`
        <h3>${esc(g)}</h3>
        <p class="muted small">Cambia la durata di una voce, per esempio "2 ore" o "90".</p>
        <form id="giornata-riep-form" class="form">
          ${voci.map((v) => `<div style="margin-top:8px"><div class="small">${esc(v.text)} · ${esc(hhmmG(v.at))}</div><input name="d_${v.idx}" maxlength="30" value="${esc(fumoDurataMin(v.min))}"></div>`).join("")}
          <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">${T("Annulla", "Cancel")}</button>
        </form>`);
      return true;
    }
    case "giornata-grp-open": {
      const idx = parseInt(el.dataset.idx);
      const voce = (S.giornata && S.giornata.log || [])[idx];
      if (!voce) return true;
      const nomeAttuale = haGruppo(voce.text) ? gruppoDi(voce.text) : parolaChiave(voce.text);
      openDialog(`
        <h3>In quale gruppo?</h3>
        <p class="muted small">${esc(voce.text)}. Scrivi il nome del gruppo: se esiste ci finisce, altrimenti lo creo. Le voci future con la stessa parola ci finiranno da sole.</p>
        <form id="giornata-grp-one" class="form" data-parola="${esc(parolaChiave(voce.text))}">
          <input name="nome" maxlength="40" value="${esc(nomeAttuale)}" autofocus>
          <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">${T("Annulla", "Cancel")}</button>
        </form>`);
      return true;
    }
    case "giornata-log-del": {
      const idx = parseInt(el.dataset.idx);
      const voce = (S.giornata && S.giornata.log || [])[idx];
      if (!voce || !confirm(`Eliminare "${voce.text}" dal registro?`)) return true;
      S.giornata.log = S.giornata.log.filter((_, k) => k !== idx);
      save(); render(); toast(T("Attività eliminata", "Activity removed"));
      return true;
    }
    case "giornata-stop": {
      const run = gRun(); const i = parseInt(el.dataset.i);
      const r = run[i]; if (!r) return true;
      const min = Math.max(1, Math.round((fumoNow() - r.start) / 60000));
      S.giornata.log = [...(S.giornata.log || []), { at: new Date(r.start).toISOString(), text: r.text, min }];
      run.splice(i, 1);
      save(); render(); toast(`Registrato: ${r.text}, ${fumoDurataMin(min)}`);
      return true;
    }
    case "giornata-torno": {
      if (!(S.giornata && S.giornata.pausa)) return true;
      gChiudiPausa(); save(); render(); toast(T("Pausa registrata", "Break logged"));
      return true;
    }
    case "giornata-rename": {
      const r = gRun()[parseInt(el.dataset.i)]; if (!r) return true;
      const nuovo = prompt("Cosa stai facendo?", r.text);
      if (nuovo && nuovo.trim()) { r.text = nuovo.trim().slice(0, 80); save(); render(); toast(T("Nome cambiato, l'orario di inizio resta", "Name changed, start time kept")); }
      return true;
    }
    case "giornata-cancel": {
      const run = gRun(); const i = parseInt(el.dataset.i);
      if (!run[i]) return true;
      if (!confirm(T("Annullare questa attività senza registrarla?", "Cancel this activity without logging it?"))) return true;
      run.splice(i, 1); save(); render(); toast(T("Attività annullata", "Activity cancelled"));
      return true;
    }
    case "giornata-from-last": {
      const f = $("#giornata-add-form");
      if (!f) return true;
      const smokes = ((S.fumo && S.fumo.log) || []).filter((e) => e.kind === "smoke").map((e) => new Date(e.at).getTime()).filter((t) => t <= fumoNow());
      const last = smokes.length ? Math.max(...smokes) : (S.fumo && S.fumo.start ? new Date(S.fumo.start).getTime() : null);
      if (!last) { toast(T("Non c'è un'ultima sigaretta da cui partire", "There is no last cigarette to start from")); return true; }
      const d = new Date(last);
      f.querySelector('[name=kind]').value = "act";
      f.querySelector('[name=time]').value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      f.querySelector('[name=min]').value = Math.max(1, Math.round((fumoNow() - last) / 60000));
      toast(T("Compilato dall'ultima sigaretta: scrivi cosa hai fatto", "Filled from the last cigarette: write what you did"));
      return true;
    }
    case "giornata-registro-toggle": view.giornataRegistroOpen = !view.giornataRegistroOpen; render(); return true;
    case "giornata-report-toggle": view.giornataReport = !view.giornataReport; render(); return true;
    case "giornata-gruppo-edit": {
      const i = parseInt(el.dataset.i);
      const g = S.giornata && S.giornata.gruppi && S.giornata.gruppi[i];
      if (!g) return true;
      openDialog(`
        <h3>Modifica il gruppo</h3>
        <form id="giornata-gruppo-edit" class="form" data-i="${i}">
          <input name="nome" maxlength="40" value="${esc(g.nome)}" placeholder="Nome del gruppo" autofocus>
          <input name="parole" maxlength="200" value="${esc(g.parole.join(", "))}" placeholder="Parole, separate da virgola">
          <button class="btn primary wide" type="submit">${T("Salva", "Save")}</button>
          <button class="btn ghost wide" type="button" data-act="dlg-close">${T("Annulla", "Cancel")}</button>
        </form>`);
      return true;
    }
    case "giornata-gruppo-del": {
      const i = parseInt(el.dataset.i);
      if (!S.giornata || !S.giornata.gruppi || !S.giornata.gruppi[i]) return true;
      S.giornata.gruppi = S.giornata.gruppi.filter((_, k) => k !== i);
      save(); render(); toast(T("Gruppo eliminato", "Group removed"));
      return true;
    }
    case "giornata-periodo": view.giornataPeriodo = el.dataset.p; render(); return true;
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
    case "fumo-del-cig": {
      // toglie una sigaretta registrata per errore: il conto di oggi scende
      const i = Number(el.dataset.i), voce = (S.fumo.log || [])[i];
      if (!voce || voce.kind !== "smoke") break;
      const giorno = keyOf(new Date(voce.at));
      S.fumo.log = S.fumo.log.filter((_, k) => k !== i);
      if (S.fumo.smokedDays && S.fumo.smokedDays[giorno]) S.fumo.smokedDays[giorno] = Math.max(0, S.fumo.smokedDays[giorno] - 1);
      S.fumo.smoked = Math.max(0, (S.fumo.smoked || 0) - 1);
      save(); render(); toast(T("Sigaretta tolta", "Cigarette removed"));
      return true;
    }
    case "fumo-set-day": {
      // correggi a mano il numero di sigarette di un giorno passato
      const giorno = view.fumoDay || todayKey();
      const v = Math.max(0, Math.round(Number(String(document.getElementById("fumo-set-n")?.value || "0").replace(",", ".")) || 0));
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[giorno] = v;
      save(); render(); toast(T("Numero aggiornato", "Number updated"));
      return true;
    }
    case "fumo-add-cig": {
      // una sigaretta in piu oggi, senza cronometro: stesso conteggio del tetto
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      const oggi = todayKey();
      S.fumo.smokedDays[oggi] = (S.fumo.smokedDays[oggi] || 0) + 1;
      S.fumo.smoked = (S.fumo.smoked || 0) + 1;
      S.fumo.log = [...(S.fumo.log || []), { at: new Date().toISOString(), kind: "smoke", n: 1 }];
      const n = S.fumo.smokedDays[oggi], tetto = S.fumo.tettoGiorno || 4;
      save(); render();
      toast(n > tetto ? T(`Hai sforato il tetto di oggi: ${n} di ${tetto}`, `Over today's cap: ${n} of ${tetto}`) : n === tetto ? T("Hai raggiunto il tetto di oggi", "You reached today's cap") : T(`Sigaretta aggiunta: ${n} di ${tetto} oggi`, `Cigarette added: ${n} of ${tetto} today`));
      return true;
    }
    case "fumo-breathing": fumoBreathingSpace(); return true;
    case "fumo-registro-toggle": view.fumoRegistroOpen = !view.fumoRegistroOpen; render(); return true;
    case "fumo-elenco-chiudi": {
      view.fumoPlanOpen = false;
      const pl = $("#fumo-plan"); if (pl) pl.innerHTML = "";
      const h = $("#fumo-hits"); if (h) h.innerHTML = "";
      const q = $("#fumo-q"); if (q) q.value = "";
      return true;
    }
    case "fumo-sugg-next": {
      const n = fumoPrevisione().length || 1;
      view.fumoSugg = ((view.fumoSugg || 0) + 1) % n;
      const box = $("#fumo-sugg-box"); if (box) box.innerHTML = fumoSuggBox();
      return true;
    }
    case "fumo-dialog-log": {
      const text = String((($("#fumo-dialog-text") || {}).value) || "").trim();
      if (!text) { toast(T("Scrivi cosa fai al posto della sigaretta", "Write what you do instead of the cigarette")); return true; }
      const now = new Date(fumoNow()).toISOString();
      S.fumo.actCount = (S.fumo.actCount || 0) + 1;
      S.fumo.log = [...(S.fumo.log || []), { at: now, kind: "act", text }];
      if (!fumoPrevisione().includes(text)) S.fumo.acts = [...fumoPrevisione(), text];
      save(); toast(`Fatto: ${text}`);
      const inp = $("#fumo-dialog-text"); if (inp) inp.value = "";
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
      closeDialog(); save(); render(); toast(T("Ottimo, voglia superata", "Well done, craving beaten"));
      return true;
    case "fumo-edit": view.fumoEdit = true; resetScroll = true; render(); return true;
    case "fumo-cancel": view.fumoEdit = false; render(); return true;
    case "fumo-lit":
    case "fumo-lit-now": {
      const act = S.fumo.active;
      clearInterval(fumoTimer);
      // Le attività in corso si fermano mentre fumi: si riprendono con "Torno".
      // "Sto fumando" registra solo la sigaretta: le attività in corso restano aperte finché non le chiudi tu.
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
      if (S.fumo.tettoGiorno && S.fumo.smokedDays[todayKey()] >= S.fumo.tettoGiorno) toast(S.fumo.smokedDays[todayKey()] > S.fumo.tettoGiorno ? `Hai sforato il tetto di oggi: ${S.fumo.smokedDays[todayKey()]} di ${S.fumo.tettoGiorno}` : "Hai raggiunto il tetto di oggi");
      S.fumo.log = [...(S.fumo.log || []), { at: new Date(now).toISOString(), kind: "smoke", n: 1 }];
      S.fumo.best = Math.max(S.fumo.best || 0, fumoStats().ms);
      S.fumo.start = new Date(now).toISOString();
      save(); resetScroll = true;
      openDialog(`
        <h3>Hai resistito ${m} ${m === 1 ? "minuto" : "minuti"} e ${sec} ${sec === 1 ? "secondo" : "secondi"}</h3>
        <p class="muted small">Il conto del tempo senza fumare riparte da adesso. Puoi ricominciare quando vuoi.</p>
        <p>${esc(fumoI(fumoPensieroDiOggi().t))}</p>
        <button class="btn primary wide" data-act="dlg-close">Ok</button>`);
      render();
      return true;
    }
  }
  return false;
}

document.addEventListener("submit", (e) => {
  if (e.target.id === "giornata-riep-form") {
    e.preventDefault();
    const fd = new FormData(e.target);
    const log = S.giornata.log;
    for (const [k, v] of fd.entries()) {
      const idx = parseInt(k.replace("d_", ""));
      if (!log[idx]) continue;
      const min = durataIn(v);
      if (min === null) { toast(T("Durata non chiara: prova '2 ore' o '90'", "Duration unclear: try '2 hours' or '90'")); return; }
      if (min > 0) log[idx] = { ...log[idx], min };
    }
    closeDialog(); save(); render(); toast(T("Durate aggiornate", "Durations updated"));
    return;
  }
  if (e.target.id === "giornata-grp-one") {
    e.preventDefault();
    const nome = String(new FormData(e.target).get("nome") || "").trim();
    const parola = e.target.dataset.parola;
    if (!nome) { toast(T("Scrivi il nome del gruppo", "Write the group name")); return; }
    S.giornata = S.giornata || { log: [] };
    S.giornata.gruppi = S.giornata.gruppi || [];
    const g = S.giornata.gruppi.find((x) => normTesto(x.nome) === normTesto(nome));
    if (g) { if (!g.parole.some((p) => normTesto(p) === normTesto(parola))) g.parole.push(parola); }
    else S.giornata.gruppi.unshift({ nome, parole: [parola] }); // i gruppi nuovi, più specifici, hanno la precedenza
    closeDialog(); save(); render(); toast(`Messo in ${nome}`);
    return;
  }
  if (e.target.classList && e.target.classList.contains("giornata-classifica")) {
    e.preventDefault();
    const nome = String(new FormData(e.target).get("nome") || "").trim();
    const parola = e.target.dataset.parola;
    if (!nome) { toast(T("Scrivi il nome del gruppo", "Write the group name")); return; }
    S.giornata = S.giornata || { log: [] };
    S.giornata.gruppi = S.giornata.gruppi || [];
    const g = S.giornata.gruppi.find((x) => normTesto(x.nome) === normTesto(nome));
    if (g) { if (!g.parole.some((p) => normTesto(p) === normTesto(parola))) g.parole.push(parola); }
    else S.giornata.gruppi.unshift({ nome, parole: [parola] }); // i gruppi nuovi, più specifici, hanno la precedenza
    save(); render(); toast(`Messo in ${nome}`);
    return;
  }
  if (e.target.id === "giornata-gruppo-edit") {
    e.preventDefault();
    const i = parseInt(e.target.dataset.i);
    const fd = new FormData(e.target);
    const nome = String(fd.get("nome") || "").trim();
    const parole = String(fd.get("parole") || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (!nome || !parole.length || !S.giornata.gruppi[i]) { toast(T("Scrivi il nome e almeno una parola", "Write the name and at least one word")); return; }
    S.giornata.gruppi[i] = { nome, parole };
    closeDialog(); save(); render(); toast(T("Gruppo modificato", "Group edited"));
    return;
  }
  if (e.target.id === "giornata-gruppo-form") {
    e.preventDefault();
    const fd = new FormData(e.target);
    const nome = String(fd.get("nome") || "").trim();
    const parole = String(fd.get("parole") || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (!nome || !parole.length) { toast(T("Scrivi il nome e almeno una parola", "Write the name and at least one word")); return; }
    S.giornata = S.giornata || { log: [] };
    S.giornata.gruppi = [{ nome, parole }, ...(S.giornata.gruppi || [])]; // il gruppo nuovo ha la precedenza
    save(); render(); toast(T("Gruppo salvato", "Group saved"));
    return;
  }
  if (e.target.id === "giornata-add-form") {
    e.preventDefault();
    const day = view.giornataDay || todayKey();
    const frase = new FormData(e.target).get("frase");
    const cmd = day === todayKey() ? fumoComando(frase) : null;
    if (cmd) {
      const run = gRun();
      if (cmd.type !== "stop") gChiudiPausa();
      const oraCmd = cmd.time ? parseOra(cmd.time) : null;
      if (cmd.time && !oraCmd) { toast(T("Scrivi l'ora, per esempio 6.50", "Write the time, for example 6.50")); return; }
      const at = new Date(); if (oraCmd) at.setHours(oraCmd[0], oraCmd[1], 0, 0);
      if (cmd.startAt) at.setTime(cmd.startAt);
      if (at > new Date()) { toast(T("L'ora è nel futuro", "The time is in the future")); return; }
      if (cmd.type === "stop") {
        let idx = -1;
        if (cmd.hint) { const h = cmd.hint; idx = run.map((r) => r.text.toLowerCase()).reduce((acc, t, i) => (h.split(/\s+/).some((w) => w.length > 3 && t.includes(w)) ? i : acc), -1); }
        if (idx < 0 && run.length === 1) idx = 0;
        if (idx < 0) { toast(run.length ? "Quale attività? Scrivi il nome, per esempio: ho finito di lavorare" : "Nessuna attività in corso"); return; }
        const r = run[idx];
        const min = Math.round((at.getTime() - r.start) / 60000);
        if (min < 1) { toast(T("L'ora di fine deve essere dopo l'inizio", "The end time must be after the start")); return; }
        S.giornata.log = [...(S.giornata.log || []), { at: new Date(r.start).toISOString(), text: r.text, min }];
        run.splice(idx, 1);
        save(); render(); toast(`Registrato: ${r.text}, ${fumoDurataMin(min)}`);
        return;
      }
      const nome = attivitaGerundio(cmd.text);
      if (cmd.type === "switch" && run.length) {
        // "vado in bagno": chiude l'attività più recente e ne inizia una nuova.
        const last = run[run.length - 1];
        const min = Math.round((at.getTime() - last.start) / 60000);
        if (min < 1) { toast(T("L'ora deve essere dopo l'inizio dell'attività in corso", "The time must be after the start of the current activity")); return; }
        S.giornata.log = [...(S.giornata.log || []), { at: new Date(last.start).toISOString(), text: last.text, min }];
        run.pop();
      }
      run.push({ text: nome, start: at.getTime() });
      save(); render(); toast(`Iniziato: ${nome}`);
      return;
    }
    const r = parseFrase(frase, day);
    if (r.error) { toast(r.error); return; }
    if (r.kind === "smoke") {
      if (!S.fumo) { toast(T("Imposta prima la data di inizio nella scheda Fumo", "Set the start date in the Smoking tab first")); return; }
      S.fumo.log = [...(S.fumo.log || []), { at: r.at, kind: "smoke", n: r.n }];
      S.fumo.smoked = (S.fumo.smoked || 0) + r.n;
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[todayKey()] = (S.fumo.smokedDays[todayKey()] || 0) + r.n;
    } else {
      S.giornata = S.giornata || { log: [] };
      S.giornata.log = [...S.giornata.log, r.min ? { at: r.at, text: r.text, min: r.min } : { at: r.at, text: r.text }];
    }
    save(); render(); toast(T("Aggiunto al registro", "Added to the log"));
    return;
  }
  if (e.target.id === "fumo-add-form") {
    e.preventDefault();
    const fd = new FormData(e.target);
    const day = view.fumoDay || todayKey();
    const ora = parseOra(fd.get("time"));
    if (!ora) { toast(T("Scrivi l'ora, per esempio 6.50", "Write the time, for example 6.50")); return; }
    const [hh, mm] = ora;
    const when = parseKey(day);
    when.setHours(hh || 0, mm || 0, 0, 0);
    if (when > new Date()) { toast(T("L'ora è nel futuro", "The time is in the future")); return; }
    const at = when.toISOString();
    const kind = fd.get("kind");
    const text = String(fd.get("text") || "").trim();
    if (kind === "smoke") {
      const n = Math.max(1, parseInt(text) || 1);
      S.fumo.log = [...(S.fumo.log || []), { at, kind: "smoke", n }];
      S.fumo.smoked = (S.fumo.smoked || 0) + n;
      S.fumo.smokedDays = S.fumo.smokedDays || {};
      S.fumo.smokedDays[todayKey()] = (S.fumo.smokedDays[todayKey()] || 0) + n;
    } else {
      if (!text) { toast(T("Scrivi cosa hai fatto", "Write what you did")); return; }
      S.fumo.log = [...(S.fumo.log || []), { at, kind: "act", text }];
      S.fumo.actCount = (S.fumo.actCount || 0) + 1;
      if (!fumoPrevisione().includes(text)) S.fumo.acts = [...fumoPrevisione(), text];
    }
    save(); render(); toast(T("Aggiunto al registro", "Added to the log"));
    return;
  }
  if (e.target.id === "fumo-item-form") {
    e.preventDefault();
    const f = e.target, fd = new FormData(f);
    const idx = parseInt(f.dataset.idx);
    if (f.dataset.kind === "glog") {
      const text = String(fd.get("text") || "").trim();
      if (!text || !S.giornata || !S.giornata.log[idx]) return;
      const min = durataIn(fd.get("durata"));
      if (min === null) { toast(T("Durata non chiara: prova '2 ore' o '90'", "Duration unclear: try '2 hours' or '90'")); return; }
      S.giornata.log[idx] = { ...S.giornata.log[idx], text, min: min || S.giornata.log[idx].min };
    } else if (f.dataset.kind === "plan") {
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
    closeDialog(); save(); render(); toast(T("Modifica salvata", "Change saved"));
    return;
  }
  if (e.target.id === "fumo-acts-form") {
    e.preventDefault();
    const text = String(new FormData(e.target).get("act") || "").trim();
    if (!text) return;
    S.fumo.acts = [...fumoPrevisione(), text];
    save(); render(); toast(T("Azione aggiunta", "Action added"));
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
    tettoGiorno: Math.max(0, Math.round(parseFloat(fd.get("tettoGiorno")) || 4)),
    reason: String(fd.get("reason") || "").trim(),
    cravings: prev.cravings || [],
  };
  view.fumoEdit = false;
  save(); resetScroll = true; render(); toast(T("Dati salvati", "Data saved"));
});
