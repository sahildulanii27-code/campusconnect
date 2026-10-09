/* CampusConnect - script.js v3 */
const STORE = "cc_v3";
const SEED = {
  user: null,
  questions: [
    { id: 1, subject: "C Programming", title: "Difference between ++i and i++?", body: "Confused about pre and post increment in loops.", year: "2nd Year", email: "aman@vesit.ac.in", votes: 5, voters: [], answers: [{ text: "++i increments first then uses the value; i++ uses the value then increments.", year: "3rd Year", email: "rohan@vesit.ac.in", votes: 3, voters: [] }] },
    { id: 2, subject: "Maths-I", title: "How to find rank of a matrix quickly?", body: "Row echelon takes too long in exams.", year: "1st Year", email: "kunal@vesit.ac.in", votes: 3, voters: [], answers: [] },
    { id: 3, subject: "Engineering Graphics", title: "Projection of a line inclined to both planes", body: "Which steps should I follow first?", year: "1st Year", email: "neha@vesit.ac.in", votes: 2, voters: [], answers: [] }
  ],
  items: [
    { id: 1, name: "Engineering Maths-I textbook", category: "Textbooks", price: 250, desc: "Good condition, latest edition", phone: "", seller: "Aman", email: "aman@vesit.ac.in", sold: false },
    { id: 2, name: "Casio fx-991 calculator", category: "Calculators", price: 600, desc: "Like new, with cover", phone: "", seller: "Priya", email: "priya@vesit.ac.in", sold: false },
    { id: 3, name: "Drafter + mini board", category: "Lab Equipment", price: 0, desc: "Free to a first-year who needs it", phone: "", seller: "Rohan", email: "rohan@vesit.ac.in", sold: false }
  ],
  groups: [
    { id: 1, name: "C Programming doubt clearing", subject: "C Programming", when: "Fri 3 PM, Library", max: 6, organizer: "Aman", email: "aman@vesit.ac.in", members: ["Aman", "Riya"] },
    { id: 2, name: "Maths-I exam revision", subject: "Maths-I", when: "Sat 11 AM, Canteen", max: 8, organizer: "Priya", email: "priya@vesit.ac.in", members: ["Priya"] }
  ],
  log: []
};
let S = load();
function load() { try { return JSON.parse(localStorage.getItem(STORE)) || JSON.parse(JSON.stringify(SEED)); } catch (e) { return JSON.parse(JSON.stringify(SEED)); } }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nid = a => a.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const stamp = t => ({ t, at: new Date().toLocaleString() });

function toast(msg) {
  const d = document.createElement("div");
  d.textContent = msg;
  d.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#FFD700,#ffb800);color:#1a1400;padding:11px 20px;border-radius:12px;font-weight:800;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,.4)";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2300);
}

/* ---------- reputation ---------- */
function repOf(email) {
  const myQ = S.questions.filter(q => q.email === email);
  const myA = S.questions.flatMap(q => q.answers).filter(a => a.email === email);
  const upv = myQ.reduce((s, q) => s + q.votes, 0) + myA.reduce((s, a) => s + a.votes, 0);
  return myQ.length * 2 + myA.length * 5 + upv;
}
function badgeOf(email) {
  const r = repOf(email);
  const b = r >= 30 ? ["🏆 Mentor", "#FFD700"] : r >= 10 ? ["🎓 Contributor", "#7ee0a0"] : ["🌱 Newbie", "#9aa6bf"];
  return `<span class="badge" style="color:${b[1]};border-color:${b[1]}">${b[0]}</span>`;
}

/* ---------- auth ---------- */
function showApp() {
  const ov = $("auth-overlay");
  ov.classList.remove("active");
  ov.style.display = "none";
  $("app").classList.remove("hidden");
  $("app").style.display = "block";
  renderAll();
}
function handleLogin(e) {
  e.preventDefault();
  S.user = { name: $("auth-name").value.trim(), email: $("auth-email").value.trim().toLowerCase(), year: $("auth-year").value };
  persist(); showApp(); switchTab("qa");
  toast("Welcome, " + S.user.name + "!");
}
function handleLogout() {
  S.user = null; persist();
  $("app").classList.add("hidden");
  $("app").style.display = "none";
  const ov = $("auth-overlay");
  ov.classList.add("active");
  ov.style.display = "";
  toast("Logged out");
}

/* ---------- tabs ---------- */
function switchTab(name) {
  document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
  const sec = $(name + "-tab"); if (sec) sec.classList.add("active");
  document.querySelectorAll(".nav-tab").forEach(b => {
    if (!b.classList.contains("logout")) b.classList.toggle("active", (b.getAttribute("onclick") || "").includes("'" + name + "'"));
  });
  renderAll();
}
function renderAll() { renderQA(); renderMarket(); renderGroups(); renderProfile(); }

/* ---------- Q&A ---------- */
function toggleQAForm() { $("qa-form").classList.toggle("hidden"); }
function filterQA() { renderQA(); }
function postQuestion(e) {
  e.preventDefault();
  S.questions.push({ id: nid(S.questions), subject: $("q-subject").value, title: $("q-title").value.trim(), body: $("q-body").value.trim(), year: S.user.year, email: S.user.email, votes: 0, voters: [], answers: [] });
  persist(); $("qa-form").reset(); $("qa-form").classList.add("hidden"); renderQA();
  toast("Question posted anonymously");
}
function upvoteQ(id) {
  const q = S.questions.find(x => x.id === id);
  if (q.voters.includes(S.user.email)) return toast("You already upvoted this");
  q.voters.push(S.user.email); q.votes++; persist(); renderQA();
}
function upvoteA(qid, i) {
  const a = S.questions.find(x => x.id === qid).answers[i];
  if (a.voters.includes(S.user.email)) return toast("You already upvoted this");
  a.voters.push(S.user.email); a.votes++; persist(); renderQA();
}
function postAnswer(id) {
  const txt = $("ans-" + id).value.trim();
  if (!txt) return toast("Write an answer first");
  S.questions.find(x => x.id === id).answers.push({ text: txt, year: S.user.year, email: S.user.email, votes: 0, voters: [] });
  persist(); renderQA(); toast("Answer added (+5 reputation)");
}
function renderQA() {
  const term = ($("qa-search").value || "").toLowerCase(), sub = $("subject-filter").value;
  const list = S.questions.filter(q => (!sub || q.subject === sub) && (q.title + " " + q.body).toLowerCase().includes(term)).sort((a, b) => b.votes - a.votes || b.id - a.id);
  $("qa-list").innerHTML = list.map(q => `
    <div class="card">
      <span class="chip">${esc(q.subject)}</span>
      <h3>${esc(q.title)}</h3>
      <p>${esc(q.body)}</p>
      <div class="meta">Anonymous (${esc(q.year)}) • ${q.answers.length} answers</div>
      <div style="margin:10px 0"><button class="vote" onclick="upvoteQ(${q.id})">▲ ${q.votes}</button></div>
      ${q.answers.map((a, i) => `<div class="ans">${esc(a.text)}<div class="meta" style="margin-top:4px">Anonymous (${esc(a.year)}) ${badgeOf(a.email)} <button class="vote" style="font-size:12px" onclick="upvoteA(${q.id},${i})">▲ ${a.votes}</button></div></div>`).join("")}
      <div class="row"><input id="ans-${q.id}" placeholder="Write an answer..."><button class="vote" onclick="postAnswer(${q.id})">Answer</button></div>
    </div>`).join("") || "<p class='empty'>No questions found.</p>";
}

/* ---------- marketplace ---------- */
function toggleMarketplaceForm() { $("marketplace-form").classList.toggle("hidden"); }
function postMarketplace(e) {
  e.preventDefault();
  const it = { id: nid(S.items), name: $("m-name").value.trim(), category: $("m-category").value, price: Number($("m-price").value) || 0, desc: $("m-desc").value.trim(), phone: $("m-phone").value.trim(), seller: S.user.name, email: S.user.email, sold: false };
  S.items.push(it);
  S.log.push(stamp(`${S.user.name} listed "${it.name}" ${it.price ? "for ₹" + it.price : "as a donation"}`));
  persist(); $("marketplace-form").reset(); $("marketplace-form").classList.add("hidden"); renderMarket();
  toast("Item listed");
}
function contactHTML(it) {
  const mail = `<a href="mailto:${esc(it.email)}?subject=${encodeURIComponent("CampusConnect: " + it.name)}">${esc(it.email)}</a>`;
  const d = String(it.phone || "").replace(/\D/g, "").slice(-10);
  return mail + (d.length === 10 ? ` &nbsp;•&nbsp; <a href="https://wa.me/91${d}" target="_blank">WhatsApp</a>` : "");
}
function showContact(id) {
  const it = S.items.find(x => x.id === id);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div><h3 style="color:#FFD700;margin-bottom:8px">Deal confirmed ✅</h3>
    <p><b>${esc(it.name)}</b> ${it.price ? "- ₹" + it.price : "(free)"}</p>
    <p style="margin:10px 0">Contact ${esc(it.seller)}:<br>${contactHTML(it)}</p>
    <p class="meta" style="margin-bottom:14px">Meet in a public place on campus (library / canteen).</p>
    <button class="btn-primary" id="cc-close">Close</button></div>`;
  document.body.appendChild(m);
  $("cc-close").onclick = () => m.remove();
}
function buyItem(id) {
  const it = S.items.find(x => x.id === id);
  if (it.email === S.user.email) return toast("This is your own listing");
  it.sold = true; it.buyer = { name: S.user.name, email: S.user.email };
  S.log.push(stamp(`${S.user.name} ${it.price ? "bought" : "claimed"} "${it.name}" from ${it.seller} ${it.price ? "for ₹" + it.price : "(free)"}`));
  persist(); renderMarket(); showContact(id);
}
function renderMarket() {
  const me = S.user ? S.user.email : "";
  $("marketplace-list").innerHTML = S.items.slice().reverse().map(it => `
    <div class="card">
      <span class="chip teal">${esc(it.category)}</span>
      <h3>${esc(it.name)}</h3>
      <div class="price">${it.price ? "₹" + it.price : "FREE (Donation)"}</div>
      <p>${esc(it.desc)}</p>
      <div class="meta" style="margin-bottom:12px">Seller: ${esc(it.seller)} ${badgeOf(it.email)}</div>
      ${it.sold ? (it.buyer && it.buyer.email === me ? `<button class="btn-primary" onclick="showContact(${it.id})">Contact seller</button>` : "<b style='color:#ff8a8a'>SOLD</b>")
        : `<button class="btn-primary" onclick="buyItem(${it.id})">${it.price ? "Buy" : "Claim"}</button>`}
    </div>`).join("");
}

/* ---------- study groups ---------- */
function toggleGroupForm() { $("group-form").classList.toggle("hidden"); }
function postGroup(e) {
  e.preventDefault();
  S.groups.push({ id: nid(S.groups), name: $("g-name").value.trim(), subject: $("g-subject").value, when: $("g-when").value.trim(), max: Number($("g-max").value), organizer: S.user.name, email: S.user.email, members: [S.user.name] });
  S.log.push(stamp(`${S.user.name} created study group "${$("g-name").value.trim()}"`));
  persist(); $("group-form").reset(); $("group-form").classList.add("hidden"); renderGroups();
  toast("Study group created");
}
function joinGroup(id) {
  const g = S.groups.find(x => x.id === id);
  if (g.members.includes(S.user.name)) return toast("You already joined");
  if (g.members.length >= g.max) return toast("Group is full");
  g.members.push(S.user.name);
  S.log.push(stamp(`${S.user.name} joined study group "${g.name}"`));
  persist(); renderGroups(); toast("Joined! Contact the organizer below.");
}
function renderGroups() {
  const me = S.user ? S.user.name : "";
  $("groups-list").innerHTML = S.groups.slice().reverse().map(g => {
    const joined = g.members.includes(me), full = g.members.length >= g.max;
    return `<div class="card">
      <span class="chip purple">${esc(g.subject)}</span>
      <h3>${esc(g.name)}</h3>
      <p>🕒 ${esc(g.when)}</p>
      <div class="bar"><div style="width:${Math.min(100, g.members.length / g.max * 100)}%"></div></div>
      <div class="meta">${g.members.length}/${g.max} members • Organizer: ${esc(g.organizer)} ${badgeOf(g.email)}</div>
      <div class="meta" style="margin:6px 0 12px">${g.members.map(esc).join(", ")}</div>
      ${joined ? `<span class="chip teal">Joined ✓</span> <a href="mailto:${esc(g.email)}?subject=${encodeURIComponent(g.name)}">Contact organizer</a>`
        : full ? "<b style='color:#ff8a8a'>FULL</b>" : `<button class="btn-primary" onclick="joinGroup(${g.id})">Join group</button>`}
    </div>`;
  }).join("") || "<p class='empty'>No groups yet. Create the first one!</p>";
}

/* ---------- profile ---------- */
function renderProfile() {
  const u = S.user; if (!u) return;
  $("p-name").textContent = u.name; $("p-email").textContent = u.email; $("p-year").textContent = u.year;
  const myQ = S.questions.filter(q => q.email === u.email);
  const myA = S.questions.flatMap(q => q.answers).filter(a => a.email === u.email);
  const upv = myQ.reduce((s, q) => s + q.votes, 0) + myA.reduce((s, a) => s + a.votes, 0);
  $("stat-questions").textContent = myQ.length;
  $("stat-items").textContent = S.items.filter(i => i.email === u.email).length;
  $("stat-upvotes").textContent = upv;
  $("stat-reputation").textContent = "⭐ " + repOf(u.email);
  let box = $("extra-profile");
  if (!box) { box = document.createElement("div"); box.id = "extra-profile"; document.querySelector(".profile-container").appendChild(box); }
  const sold = S.items.filter(i => i.email === u.email && i.buyer);
  box.innerHTML = `<div class="box"><h3>Your level ${badgeOf(u.email)}</h3>
      <p class="meta">Reputation: +5 per answer, +2 per question, +1 per upvote received.</p></div>
    <div class="box"><h3>Your sales / donations</h3>${sold.length ? sold.map(i => `<div class="log"><b>${esc(i.name)}</b> → ${esc(i.buyer.name)} (<a href="mailto:${esc(i.buyer.email)}">${esc(i.buyer.email)}</a>)</div>`).join("") : "<p class='meta'>No buyers yet.</p>"}</div>
    <div class="box"><h3>Transaction Audit Log</h3>${S.log.length ? S.log.slice().reverse().map(l => `<div class="log">${esc(l.t)}<div class="meta">${esc(l.at)}</div></div>`).join("") : "<p class='meta'>No transactions yet.</p>"}</div>`;
}

if (S.user) showApp();
/* ===== FOCUS ROOM ===== */
if (!S.focus) S.focus = { mins: {} };
const BOARD_SEED = [{ name: "Riya", min: 120 }, { name: "Aman", min: 95 }, { name: "Neha", min: 60 }, { name: "Kunal", min: 45 }];
const OTHERS = [
  { name: "Riya", subject: "C Programming", left: 18 },
  { name: "Aman", subject: "DSA", left: 32 },
  { name: "Neha", subject: "Engineering Graphics", left: 9 },
  { name: "Kunal", subject: "Maths-I", left: 41 }
].map(o => ({ name: o.name, subject: o.subject, end: Date.now() + o.left * 60000 }));
let myFocus = null;

function fmt(ms) {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}
function startFocus() {
  if (myFocus) return toast("A session is already running");
  if (!$("f-subject").value) return toast("Pick a subject first");
  const m = Number($("f-mins").value);
  myFocus = { subject: $("f-subject").value, mins: m, end: Date.now() + m * 60000 };
  toast("Focus started. Stay on task!");
  renderFocus();
}
function stopFocus() {
  if (!myFocus) return;
  myFocus = null;
  renderFocus();
  toast("Stopped early. No points for incomplete sessions.");
}
function finishFocus() {
  const u = S.user, rec = S.focus.mins[u.email] || { name: u.name, min: 0 };
  rec.min += myFocus.mins;
  S.focus.mins[u.email] = rec;
  S.log.push(stamp(`${u.name} completed a ${myFocus.mins}-min focus session on ${myFocus.subject}`));
  myFocus = null;
  persist();
  renderFocus();
  toast("Session complete! Reputation updated 🎉");
}

const _repOf = repOf;
repOf = function (email) {
  const rec = S.focus.mins[email];
  return _repOf(email) + Math.floor((rec ? rec.min : 0) / 10);
};

function liveCard(name, subject, end, me) {
  return `<div class="card"><span class="chip ${me ? "" : "teal"}">${esc(subject)}</span>
    <h3>${me ? "🔥 You" : esc(name)}</h3>
    <div class="price">${fmt(end - Date.now())}</div>
    <div class="meta">${me ? "Focusing now" : "Studying now"}</div></div>`;
}
function renderFocus() {
  if (!S.user || !$("focus-live")) return;
  const clock = $("f-clock");
  clock.textContent = myFocus ? fmt(myFocus.end - Date.now()) : fmt(Number($("f-mins").value) * 60000);
  const cards = [];
  if (myFocus) cards.push(liveCard(S.user.name, myFocus.subject, myFocus.end, true));
  OTHERS.forEach(o => cards.push(liveCard(o.name, o.subject, o.end, false)));
  $("focus-live").innerHTML = cards.join("");
  const board = BOARD_SEED.concat(Object.values(S.focus.mins)).sort((a, b) => b.min - a.min).slice(0, 6);
  $("focus-board").innerHTML = board.map((r, i) =>
    `<div class="log">${["🥇", "🥈", "🥉"][i] || (i + 1) + "."} <b>${esc(r.name)}</b> — ${r.min} min focused</div>`).join("");
}

const _renderAll = renderAll;
renderAll = function () { _renderAll(); renderFocus(); };

setInterval(function () {
  if (!S.user) return;
  OTHERS.forEach(o => { if (o.end <= Date.now()) o.end = Date.now() + (10 + Math.floor(Math.random() * 30)) * 60000; });
  if (myFocus && Date.now() >= myFocus.end) finishFocus();
  const tab = $("focus-tab");
  if (tab && tab.classList.contains("active")) renderFocus();
}, 1000);

renderFocus();
/* ===== TRAIN BUDDIES ===== */
if (!S.trains) S.trains = [
  { id: 1, from: "Kalyan", time: "07:12", days: "Mon-Fri", point: "Platform 2, 3rd coach from front", organizer: "Aman", email: "aman@vesit.ac.in", members: ["Aman", "Riya"] },
  { id: 2, from: "Ulhasnagar", time: "07:30", days: "Mon-Sat", point: "Platform 1, near the bridge", organizer: "Priya", email: "priya@vesit.ac.in", members: ["Priya"] },
  { id: 3, from: "Vashi", time: "08:05", days: "Mon-Fri", point: "Platform 3, ladies coach side", organizer: "Neha", email: "neha@vesit.ac.in", members: ["Neha", "Kunal"] }
];
function to12(t) {
  const p = String(t).split(":"), h = Number(p[0]);
  return ((h % 12) || 12) + ":" + p[1] + (h >= 12 ? " PM" : " AM");
}
function toggleTrainForm() { $("train-form").classList.toggle("hidden"); }
function postTrain(e) {
  e.preventDefault();
  const t = { id: nid(S.trains), from: $("t-from").value.trim(), time: $("t-time").value, days: $("t-days").value, point: $("t-point").value.trim(), organizer: S.user.name, email: S.user.email, members: [S.user.name] };
  S.trains.push(t);
  S.log.push(stamp(`${S.user.name} posted a commute from ${t.from} at ${to12(t.time)}`));
  persist(); $("train-form").reset(); $("train-form").classList.add("hidden"); renderTrains();
  toast("Commute posted. Buddies can join now!");
}
function showTrainContact(id) {
  const t = S.trains.find(x => x.id === id);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div><h3 style="color:#FFD700;margin-bottom:8px">You're in! 🚆</h3>
    <p><b>${esc(t.from)}</b> → VESIT • ${to12(t.time)}</p>
    <p style="margin:10px 0">Contact ${esc(t.organizer)}:<br><a href="mailto:${esc(t.email)}?subject=${encodeURIComponent("Train buddy: " + t.from)}">${esc(t.email)}</a></p>
    <p class="meta" style="margin-bottom:14px">Meet at: ${esc(t.point)}. Travel in groups and share your live location with a friend.</p>
    <button class="btn-primary" id="cc-close2">Close</button></div>`;
  document.body.appendChild(m);
  $("cc-close2").onclick = () => m.remove();
}
function joinTrain(id) {
  const t = S.trains.find(x => x.id === id);
  if (t.members.includes(S.user.name)) return toast("You already joined");
  t.members.push(S.user.name);
  S.log.push(stamp(`${S.user.name} joined the ${to12(t.time)} train buddies from ${t.from}`));
  persist(); renderTrains(); showTrainContact(id);
}
function renderTrains() {
  if (!S.user || !$("train-list")) return;
  const term = ($("t-search").value || "").toLowerCase(), me = S.user.name;
  const list = S.trains.filter(t => t.from.toLowerCase().includes(term)).sort((a, b) => a.time.localeCompare(b.time));
  $("train-list").innerHTML = list.map(t => {
    const joined = t.members.includes(me);
    return `<div class="card">
      <span class="chip teal">🚆 ${esc(t.from)} → VESIT</span>
      <div class="price">${to12(t.time)}</div>
      <p>📅 ${esc(t.days)}<br>📍 ${esc(t.point)}</p>
      <div class="meta">${t.members.length} travelling • Organizer: ${esc(t.organizer)} ${badgeOf(t.email)}</div>
      <div class="meta" style="margin:6px 0 12px">${t.members.map(esc).join(", ")}</div>
      ${joined ? `<span class="chip">Joined ✓</span> <a href="javascript:showTrainContact(${t.id})">View contact</a>`
        : `<button class="btn-primary" onclick="joinTrain(${t.id})">Join this train</button>`}
    </div>`;
  }).join("") || "<p class='empty'>No commutes for that station yet. Post yours!</p>";
}
const _renderAll2 = renderAll;
renderAll = function () { _renderAll2(); renderTrains(); };
persist();
renderTrains();
/* ===== NOTES & PAPERS ===== */
if (!S.notes) S.notes = [
  { id: 1, title: "Maths-I End Sem Paper", subject: "Maths-I", type: "Question Paper", year: "Dec 2025, Sem 1", link: "https://drive.google.com", uploader: "Aman", email: "aman@vesit.ac.in", uyear: "2nd Year", downloads: 14 },
  { id: 2, title: "C Programming Unit 2 Handwritten Notes", subject: "C Programming", type: "Notes", year: "2025", link: "https://drive.google.com", uploader: "Priya", email: "priya@vesit.ac.in", uyear: "2nd Year", downloads: 9 },
  { id: 3, title: "Engineering Graphics Sheet Solutions", subject: "Engineering Graphics", type: "Notes", year: "2025", link: "https://drive.google.com", uploader: "Rohan", email: "rohan@vesit.ac.in", uyear: "3rd Year", downloads: 6 }
];
function toggleNoteForm() { $("note-form").classList.toggle("hidden"); }
function postNote(e) {
  e.preventDefault();
  const f = $("n-file").files[0];
  let link = $("n-link").value.trim();
  if (!f && !link) return toast("Add a link or attach a file");
  if (link && !/^https?:\/\//i.test(link)) link = "https://" + link;
  const note = { id: nid(S.notes), title: $("n-title").value.trim(), subject: $("n-subject").value, type: $("n-type").value, year: $("n-year").value.trim(), link: link, file: null, uploader: S.user.name, email: S.user.email, uyear: S.user.year, downloads: 0 };
  function save() {
    S.notes.push(note);
    try { localStorage.setItem(STORE, JSON.stringify(S)); }
    catch (err) { S.notes.pop(); return toast("File too big to save. Please use a link."); }
    S.log.push(stamp(`${S.user.name} shared "${note.title}" (${note.type})`));
    persist(); $("note-form").reset(); $("note-form").classList.add("hidden");
    renderNotes(); toast("Shared! +3 reputation");
  }
  if (f) {
    if (f.size > 700 * 1024) return toast("File over 700 KB. Please use a link.");
    const r = new FileReader();
    r.onload = function () { note.file = { name: f.name, data: r.result }; save(); };
    r.readAsDataURL(f);
  } else save();
}
function openNote(id) {
  const n = S.notes.find(x => x.id === id);
  n.downloads++; persist(); renderNotes();
  if (n.file) {
    const a = document.createElement("a");
    a.href = n.file.data; a.download = n.file.name;
    document.body.appendChild(a); a.click(); a.remove();
  } else window.open(n.link, "_blank");
}
function renderNotes() {
  if (!S.user || !$("notes-list")) return;
  const term = ($("n-search").value || "").toLowerCase(), ty = $("n-filter").value;
  const list = S.notes.filter(n => (!ty || n.type === ty) && (n.title + " " + n.subject + " " + n.year).toLowerCase().includes(term)).sort((a, b) => b.id - a.id);
  $("notes-list").innerHTML = list.map(n => `<div class="card">
      <span class="chip purple">${n.type === "Question Paper" ? "📝" : n.type === "Lab Manual" ? "🧪" : "📓"} ${esc(n.type)}</span>
      <h3>${esc(n.title)}</h3>
      <p>${esc(n.subject)} • ${esc(n.year)}</p>
      <div class="meta">By ${esc(n.uploader)} (${esc(n.uyear)}) ${badgeOf(n.email)} • ⬇ ${n.downloads}</div>
      <div style="margin-top:12px"><button class="btn-primary" onclick="openNote(${n.id})">${n.file ? "Download" : "Open"}</button></div>
    </div>`).join("") || "<p class='empty'>Nothing found. Be the first to share!</p>";
}
const _rep3 = repOf;
repOf = function (email) { return _rep3(email) + 3 * S.notes.filter(n => n.email === email).length; };
const _renderAll3 = renderAll;
renderAll = function () { _renderAll3(); renderNotes(); };
persist();
renderNotes();
/* ===== ALUMNI MENTORS ===== */
if (!S.alumni) S.alumni = [
  { id: 1, name: "Sample Alumnus A", company: "TCS", role: "Systems Engineer", grad: 2023, branch: "Computer", help: ["Mock Interview", "Resume Review"], linkedin: "", bio: "Happy to guide juniors on aptitude and technical rounds.", email: "alumnus.a@vesit.ac.in" },
  { id: 2, name: "Sample Alumnus B", company: "L&T", role: "Design Engineer", grad: 2021, branch: "Mechanical", help: ["Career Guidance", "Referral"], linkedin: "", bio: "Can help with core placements and referrals.", email: "alumnus.b@vesit.ac.in" },
  { id: 3, name: "Sample Alumnus C", company: "Infosys", role: "Software Engineer", grad: 2022, branch: "IT", help: ["Mock Interview", "Referral", "Resume Review"], linkedin: "", bio: "Ask me about coding rounds and HR interviews.", email: "alumnus.c@vesit.ac.in" }
];
if (!S.reqs) S.reqs = [];
function toggleAlumniForm() { $("alumni-form").classList.toggle("hidden"); }
function postAlumni(e) {
  e.preventDefault();
  const help = Array.from(document.querySelectorAll(".a-help:checked")).map(c => c.value);
  if (!help.length) return toast("Pick at least one way you can help");
  let li = $("a-linkedin").value.trim();
  if (li && !/^https?:\/\//i.test(li)) li = "https://" + li;
  S.alumni.push({ id: nid(S.alumni), name: S.user.name, company: $("a-company").value.trim(), role: $("a-role").value.trim(), grad: Number($("a-grad").value), branch: $("a-branch").value, help: help, linkedin: li, bio: $("a-bio").value.trim(), email: S.user.email });
  S.log.push(stamp(`${S.user.name} registered as an alumni mentor`));
  persist(); $("alumni-form").reset(); $("alumni-form").classList.add("hidden"); renderAlumni();
  toast("Thanks for mentoring juniors!");
}
function alumniContact(a) {
  return `<a href="mailto:${esc(a.email)}?subject=${encodeURIComponent("CampusConnect mentorship")}">${esc(a.email)}</a>` +
    (a.linkedin ? ` &nbsp;•&nbsp; <a href="${esc(a.linkedin)}" target="_blank">LinkedIn</a>` : "");
}
function requestMentor(id) {
  const a = S.alumni.find(x => x.id === id);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div><h3 style="color:#FFD700;margin-bottom:8px">Request help from ${esc(a.name)}</h3>
    <select id="rq-type" class="form-input" style="margin-bottom:10px">${a.help.map(h => `<option>${esc(h)}</option>`).join("")}</select>
    <textarea id="rq-msg" class="form-textarea" placeholder="Introduce yourself and what you need help with..."></textarea>
    <div class="form-actions" style="margin-top:12px"><button class="btn-primary" id="rq-send">Send request</button><button class="btn-secondary" id="rq-x">Cancel</button></div></div>`;
  document.body.appendChild(m);
  $("rq-x").onclick = () => m.remove();
  $("rq-send").onclick = function () {
    const msg = $("rq-msg").value.trim();
    if (!msg) return toast("Write a short message");
    S.reqs.push({ id: nid(S.reqs), alumniId: id, alumniEmail: a.email, from: S.user.name, fromEmail: S.user.email, fromYear: S.user.year, type: $("rq-type").value, msg: msg, at: new Date().toLocaleString() });
    S.log.push(stamp(`${S.user.name} requested "${$("rq-type").value}" from alumnus ${a.name}`));
    persist(); m.remove(); renderAlumni(); showAlumniContact(id);
  };
}
function showAlumniContact(id) {
  const a = S.alumni.find(x => x.id === id);
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div><h3 style="color:#FFD700;margin-bottom:8px">Request sent ✅</h3>
    <p>You can also reach ${esc(a.name)} directly:</p>
    <p style="margin:10px 0">${alumniContact(a)}</p>
    <p class="meta" style="margin-bottom:14px">Be polite, share your resume, and respect their time.</p>
    <button class="btn-primary" id="cc-close3">Close</button></div>`;
  document.body.appendChild(m);
  $("cc-close3").onclick = () => m.remove();
}
function renderAlumni() {
  if (!S.user || !$("alumni-list")) return;
  const term = ($("a-search").value || "").toLowerCase(), f = $("a-filter").value;
  const list = S.alumni.filter(a => (!f || a.help.includes(f)) && (a.name + " " + a.company + " " + a.role + " " + a.branch).toLowerCase().includes(term));
  $("alumni-list").innerHTML = list.map(a => {
    const asked = S.reqs.some(r => r.alumniId === a.id && r.fromEmail === S.user.email);
    return `<div class="card">
      <span class="chip">🎓 Batch ${a.grad} • ${esc(a.branch)}</span>
      <h3>${esc(a.name)}</h3>
      <div class="price" style="font-size:17px">${esc(a.role)} @ ${esc(a.company)}</div>
      <p>${esc(a.bio)}</p>
      <div style="margin:8px 0">${a.help.map(h => `<span class="chip purple" style="margin:2px 4px 2px 0">${esc(h)}</span>`).join("")}</div>
      ${a.email === S.user.email ? "<span class='chip teal'>Your profile</span>"
        : asked ? `<span class="chip teal">Requested ✓</span> <a href="javascript:showAlumniContact(${a.id})">View contact</a>`
        : `<button class="btn-primary" onclick="requestMentor(${a.id})">Request help</button>`}
    </div>`;
  }).join("") || "<p class='empty'>No alumni found. Register as the first mentor!</p>";
}
const _rp4 = renderProfile;
renderProfile = function () {
  _rp4();
  if (!S.user) return;
  let box = $("alumni-box");
  if (!box) { box = document.createElement("div"); box.id = "alumni-box"; document.querySelector(".profile-container").appendChild(box); }
  const got = S.reqs.filter(r => r.alumniEmail === S.user.email);
  const sent = S.reqs.filter(r => r.fromEmail === S.user.email);
  box.innerHTML = `<div class="box"><h3>Mentorship requests received</h3>${got.length ? got.map(r => `<div class="log"><b>${esc(r.from)}</b> (${esc(r.fromYear)}) wants: ${esc(r.type)}<br>"${esc(r.msg)}"<div class="meta"><a href="mailto:${esc(r.fromEmail)}">${esc(r.fromEmail)}</a> • ${esc(r.at)}</div></div>`).join("") : "<p class='meta'>None yet.</p>"}</div>
    <div class="box"><h3>Mentorship requests sent</h3>${sent.length ? sent.map(r => { const a = S.alumni.find(x => x.id === r.alumniId); return `<div class="log">${esc(r.type)} → ${a ? esc(a.name) : "alumnus"}<div class="meta">${esc(r.at)}</div></div>`; }).join("") : "<p class='meta'>None yet.</p>"}</div>`;
};
const _renderAll4 = renderAll;
renderAll = function () { _renderAll4(); renderAlumni(); };
persist();
renderAlumni();
renderProfile();
/* ===== HOME HERO PANEL ===== */
(function () {
  function gearPath(teeth, ro, ri, rh) {
    const step = 2 * Math.PI / teeth;
    const pt = (r, a) => (r * Math.cos(a)).toFixed(1) + "," + (r * Math.sin(a)).toFixed(1);
    let d = "";
    for (let i = 0; i < teeth; i++) {
      const a = i * step;
      d += (i ? "L" : "M") + pt(ri, a) + " L" + pt(ro, a + step * 0.15) + " L" + pt(ro, a + step * 0.4) + " L" + pt(ri, a + step * 0.55) + " ";
    }
    return d + "Z M" + rh + ",0 A" + rh + "," + rh + " 0 1 0 " + (-rh) + ",0 A" + rh + "," + rh + " 0 1 0 " + rh + ",0 Z";
  }
  function gear(x, y, teeth, ro, ri, rh, dur, rev, color) {
    return '<g transform="translate(' + x + ',' + y + ')"><g>' +
      '<animateTransform attributeName="transform" type="rotate" from="' + (rev ? 360 : 0) + '" to="' + (rev ? 0 : 360) + '" dur="' + dur + 's" repeatCount="indefinite"/>' +
      '<path d="' + gearPath(teeth, ro, ri, rh) + '" fill="' + color + '" fill-opacity=".14" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" fill-rule="evenodd"/>' +
      '<circle r="' + (ri * 0.62).toFixed(1) + '" fill="none" stroke="' + color + '" stroke-opacity=".55" stroke-dasharray="4 5"/>' +
      '</g></g>';
  }
  const svg = '<svg viewBox="0 0 420 330" xmlns="http://www.w3.org/2000/svg">' +
    gear(150, 215, 16, 95, 80, 18, 14, false, "#FFD700") +
    gear(257, 125, 10, 60, 47, 12, 8.75, true, "#22d3ee") +
    gear(344, 157, 8, 44, 34, 9, 7, false, "#b8a6ff") +
    '</svg>';
  const hero = document.createElement("div");
  hero.className = "hero";
  hero.innerHTML =
    '<div class="hero-stage"><div class="orbit"><span>💻</span><span>🧪</span><span>📚</span><span>📐</span></div>' + svg + '</div>' +
    '<h2>Learn. Connect. Build.</h2>' +
    "<p>VESIT's peer-powered campus hub for first-years, seniors and alumni.</p>" +
    '<div class="hero-chips"><span>💬 Q&amp;A</span><span>🛒 Marketplace</span><span>👥 Study Groups</span><span>⏱️ Focus Room</span><span>🚆 Train Buddies</span><span>📚 Notes</span><span>🎓 Alumni</span></div>';
  const ov = $("auth-overlay");
  ov.insertBefore(hero, ov.querySelector(".auth-container"));
})();
/* ===== BADGES + MENU DRAWER ===== */
const TIERS = [
  { min: 0, name: "Newbie", icon: "🌱", color: "#9aa6bf" },
  { min: 10, name: "Contributor", icon: "🎓", color: "#7ee0a0" },
  { min: 50, name: "Scholar", icon: "⭐", color: "#38bdf8" },
  { min: 100, name: "Mentor", icon: "🏆", color: "#FFD700" },
  { min: 250, name: "Legend", icon: "👑", color: "#ff7ad9" }
];
function tierOf(r) { let t = TIERS[0]; TIERS.forEach(function (x) { if (r >= x.min) t = x; }); return t; }
badgeOf = function (email) {
  const t = tierOf(repOf(email));
  return `<span class="badge" style="color:${t.color};border-color:${t.color}">${t.icon} ${t.name}</span>`;
};
function statsOf(email) {
  const myQ = S.questions.filter(q => q.email === email);
  const myA = S.questions.flatMap(q => q.answers).filter(a => a.email === email);
  return {
    answers: myA.length,
    upv: myQ.reduce((s, q) => s + q.votes, 0) + myA.reduce((s, a) => s + a.votes, 0),
    notes: (S.notes || []).filter(n => n.email === email).length,
    focus: (S.focus && S.focus.mins[email]) ? S.focus.mins[email].min : 0
  };
}
const ACH = [
  { icon: "🎯", name: "First Answer", desc: "Post 1 answer", ok: (s) => s.answers >= 1 },
  { icon: "🙌", name: "Helper", desc: "Post 10 answers", ok: (s) => s.answers >= 10 },
  { icon: "👍", name: "Appreciated", desc: "Get 10 upvotes", ok: (s) => s.upv >= 10 },
  { icon: "📚", name: "Sharer", desc: "Share 3 notes", ok: (s) => s.notes >= 3 },
  { icon: "⏱️", name: "Focused", desc: "Focus 60 minutes", ok: (s) => s.focus >= 60 },
  { icon: "⭐", name: "Rising Star", desc: "Reach 50 reputation", ok: (s, r) => r >= 50 }
];
const _rpBadge = renderProfile;
renderProfile = function () {
  _rpBadge();
  const u = S.user; if (!u) return;
  const r = repOf(u.email), t = tierOf(r), s = statsOf(u.email);
  const nx = TIERS[TIERS.indexOf(t) + 1];
  const pct = nx ? Math.min(100, Math.round((r - t.min) / (nx.min - t.min) * 100)) : 100;
  const host = document.querySelector(".profile-container");
  let card = $("badge-card");
  if (!card) { card = document.createElement("div"); card.id = "badge-card"; host.insertBefore(card, host.firstChild); }
  card.innerHTML = `
    <div class="medal" style="--c:${t.color}">
      <div class="medal-ring">${t.icon}</div>
      <div class="medal-info">
        <div class="medal-tier">${t.name}</div>
        <div class="medal-rep">${r} reputation points</div>
        <div class="bar"><div style="width:${pct}%"></div></div>
        <div class="meta">${nx ? (nx.min - r) + " more points to reach " + nx.icon + " " + nx.name : "Top level reached!"}</div>
      </div>
    </div>
    <div class="ladder">${TIERS.map(x => `<span class="${r >= x.min ? "got" : ""} ${x === t ? "cur" : ""}" style="--c:${x.color}">${x.icon} ${x.name} <i>${x.min}+</i></span>`).join("")}</div>
    <div class="ach-grid">${ACH.map(a => `<div class="ach ${a.ok(s, r) ? "on" : ""}"><span>${a.icon}</span><b>${a.name}</b><small>${a.desc}</small></div>`).join("")}</div>`;
  const av = document.querySelector(".avatar"); if (av) av.textContent = t.icon;
};

(function () {
  const nav = document.querySelector(".nav-tabs"), hc = document.querySelector(".header-content");
  if (!nav || !hc) return;
  const map = {}; let logout = null;
  Array.from(nav.querySelectorAll(".nav-tab")).forEach(function (b) {
    if (b.classList.contains("logout")) { logout = b; return; }
    const m = (b.getAttribute("onclick") || "").match(/switchTab\('(\w+)'\)/);
    if (m) map[m[1]] = b;
  });
  nav.innerHTML = "";
  const title = document.createElement("div");
  title.className = "drawer-title"; title.textContent = "⚙ CampusConnect";
  nav.appendChild(title);
  [["Learn", ["qa", "notes", "focus"]], ["Community", ["marketplace", "groups", "train", "alumni"]], ["Me", ["profile"]]].forEach(function (g) {
    const h = document.createElement("div");
    h.className = "nav-group"; h.textContent = g[0]; nav.appendChild(h);
    g[1].forEach(function (k) { if (map[k]) nav.appendChild(map[k]); });
  });
  if (logout) nav.appendChild(logout);
  document.body.appendChild(nav);
  const back = document.createElement("div"); back.id = "menu-back"; document.body.appendChild(back);
  const btn = document.createElement("button"); btn.className = "menu-btn"; btn.textContent = "☰ Menu"; hc.appendChild(btn);
  function close() { nav.classList.remove("open"); back.classList.remove("open"); }
  btn.onclick = function () { nav.classList.add("open"); back.classList.add("open"); };
  back.onclick = close;
  nav.addEventListener("click", function (e) { if (e.target.closest(".nav-tab")) close(); });
  const NAMES = { qa: "Q&A", marketplace: "Marketplace", groups: "Study Groups", focus: "Focus Room", train: "Train Buddies", notes: "Notes & Papers", alumni: "Alumni", profile: "Profile" };
  const _st = switchTab;
  switchTab = function (n) { _st(n); btn.textContent = "☰ " + (NAMES[n] || "Menu"); };
})();

renderProfile();
/* ===== TAB STRIP ===== */
(function () {
  const header = document.querySelector(".header"), mb = document.querySelector(".menu-btn");
  if (!header) return;
  const TABS = [["qa", "💬", "Q&A"], ["notes", "📚", "Notes"], ["focus", "⏱️", "Focus"], ["marketplace", "🛒", "Market"], ["groups", "👥", "Groups"], ["train", "🚆", "Train"], ["alumni", "🎓", "Alumni"], ["profile", "👤", "Profile"]];
  const strip = document.createElement("div");
  strip.className = "tabstrip";
  strip.innerHTML = TABS.map(t => `<button data-t="${t[0]}">${t[1]} ${t[2]}</button>`).join("");
  header.appendChild(strip);
  function mark(n) {
    strip.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.t === n));
    const on = strip.querySelector("button.on");
    if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
    if (mb) mb.textContent = "☰ Menu";
  }
  strip.addEventListener("click", function (e) {
    const b = e.target.closest("button");
    if (b) switchTab(b.dataset.t);
  });
  const _st2 = switchTab;
  switchTab = function (n) { _st2(n); mark(n); };
  mark("qa");
})();
/* ===== PROFILE BUTTON AFTER MENU ===== */
(function () {
  const hc = document.querySelector(".header-content"), mb = document.querySelector(".menu-btn"), nav = document.querySelector(".nav-tabs");
  if (!hc || !mb) return;
  if (nav) {
    const p = Array.from(nav.querySelectorAll(".nav-tab")).find(b => (b.getAttribute("onclick") || "").includes("'profile'"));
    if (p) p.remove();
    const g = Array.from(nav.querySelectorAll(".nav-group")).find(x => x.textContent.trim() === "Me");
    if (g) g.textContent = "Account";
  }
  const wrap = document.createElement("div");
  wrap.className = "hdr-actions";
  hc.appendChild(wrap);
  wrap.appendChild(mb);
  const pb = document.createElement("button");
  pb.className = "profile-btn";
  pb.innerHTML = '<span>👤</span><span class="nm">Profile</span>';
  pb.onclick = function () { switchTab("profile"); };
  wrap.appendChild(pb);
  function refresh() {
    if (!S.user || typeof tierOf !== "function") return;
    pb.innerHTML = "<span>" + tierOf(repOf(S.user.email)).icon + '</span><span class="nm">Profile</span>';
  }
  const _st3 = switchTab;
  switchTab = function (n) { _st3(n); pb.classList.toggle("on", n === "profile"); refresh(); };
  const _ra = renderAll;
  renderAll = function () { _ra(); refresh(); };
  refresh();
})();