/* CampusConnect - script.js (wired to index.html) */
const STORE = "cc_v2";
const SEED = {
  user: null,
  questions: [
    { id: 1, subject: "C Programming", title: "Difference between ++i and i++?", body: "Confused about pre and post increment in loops.", year: "2nd Year", email: "seed1", votes: 5, voters: [], answers: [{ text: "++i increments first then uses the value; i++ uses the value then increments.", year: "3rd Year", email: "seed2", votes: 3, voters: [] }] },
    { id: 2, subject: "Maths-I", title: "How to find rank of a matrix quickly?", body: "Row echelon takes too long in exams.", year: "1st Year", email: "seed3", votes: 3, voters: [], answers: [] },
    { id: 3, subject: "Engineering Graphics", title: "Projection of a line inclined to both planes", body: "Which steps should I follow first?", year: "1st Year", email: "seed4", votes: 2, voters: [], answers: [] }
  ],
  items: [
    { id: 1, name: "Engineering Maths-I textbook", category: "Textbooks", price: 250, desc: "Good condition, 2025 edition", seller: "Aman", email: "seed2", sold: false },
    { id: 2, name: "Casio fx-991 calculator", category: "Calculators", price: 600, desc: "Like new, with cover", seller: "Priya", email: "seed5", sold: false },
    { id: 3, name: "Drafter + mini board", category: "Lab Equipment", price: 0, desc: "Free to a first-year who needs it", seller: "Rohan", email: "seed6", sold: false }
  ],
  log: []
};
let S = loadState();
function loadState() { try { return JSON.parse(localStorage.getItem(STORE)) || JSON.parse(JSON.stringify(SEED)); } catch (e) { return JSON.parse(JSON.stringify(SEED)); } }
function persist() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
const $ = id => document.getElementById(id);
const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nid = a => a.reduce((m, x) => Math.max(m, x.id), 0) + 1;
const stamp = t => ({ t, at: new Date().toLocaleString() });

function toast(msg) {
  const d = document.createElement("div");
  d.textContent = msg;
  d.style.cssText = "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#FFD700;color:#111;padding:10px 18px;border-radius:10px;font-weight:700;z-index:99999;box-shadow:0 4px 14px rgba(0,0,0,.4)";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 2200);
}

/* ---------- AUTH ---------- */
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
  persist();
  showApp();
  switchTab("qa");
  toast("Welcome, " + S.user.name + "!");
}
function handleLogout() {
  S.user = null;
  persist();
  $("app").classList.add("hidden");
  $("app").style.display = "none";
  const ov = $("auth-overlay");
  ov.classList.add("active");
  ov.style.display = "";
  toast("Logged out");
}

/* ---------- TABS ---------- */
function switchTab(name) {
  document.querySelectorAll(".tab-content").forEach(s => s.classList.remove("active"));
  const sec = $(name + "-tab");
  if (sec) sec.classList.add("active");
  document.querySelectorAll(".nav-tab").forEach(b => {
    const on = (b.getAttribute("onclick") || "").indexOf("'" + name + "'") > -1;
    if (!b.classList.contains("logout")) b.classList.toggle("active", on);
  });
  if (name === "profile") renderProfile();
  if (name === "qa") renderQA();
  if (name === "marketplace") renderMarket();
}

/* ---------- Q&A ---------- */
function toggleQAForm() { $("qa-form").classList.toggle("hidden"); }
function filterQA() { renderQA(); }
function postQuestion(e) {
  e.preventDefault();
  S.questions.push({ id: nid(S.questions), subject: $("q-subject").value, title: $("q-title").value.trim(), body: $("q-body").value.trim(), year: S.user.year, email: S.user.email, votes: 0, voters: [], answers: [] });
  persist();
  $("qa-form").reset();
  $("qa-form").classList.add("hidden");
  renderQA();
  toast("Question posted anonymously");
}
function upvoteQ(id) {
  const q = S.questions.find(x => x.id === id);
  if (q.voters.includes(S.user.email)) return toast("You already upvoted this");
  q.voters.push(S.user.email); q.votes++;
  persist(); renderQA();
}
function upvoteA(qid, i) {
  const a = S.questions.find(x => x.id === qid).answers[i];
  if (a.voters.includes(S.user.email)) return toast("You already upvoted this");
  a.voters.push(S.user.email); a.votes++;
  persist(); renderQA();
}
function postAnswer(id) {
  const inp = $("ans-" + id), txt = inp.value.trim();
  if (!txt) return toast("Write an answer first");
  S.questions.find(x => x.id === id).answers.push({ text: txt, year: S.user.year, email: S.user.email, votes: 0, voters: [] });
  persist(); renderQA();
  toast("Answer added (+5 reputation)");
}
function renderQA() {
  const term = ($("qa-search").value || "").toLowerCase(), sub = $("subject-filter").value;
  const list = S.questions
    .filter(q => (!sub || q.subject === sub) && (q.title + " " + q.body).toLowerCase().includes(term))
    .sort((a, b) => b.votes - a.votes || b.id - a.id);
  const card = "background:rgba(255,255,255,.05);border:1px solid rgba(255,215,0,.25);border-radius:14px;padding:16px;margin:12px 0";
  const chip = "display:inline-block;background:rgba(255,215,0,.15);color:#FFD700;border-radius:20px;padding:2px 12px;font-size:12px";
  const vbtn = "background:transparent;border:1px solid #FFD700;color:#FFD700;border-radius:8px;padding:3px 10px;cursor:pointer";
  $("qa-list").innerHTML = list.map(q => `
    <div style="${card}">
      <span style="${chip}">${esc(q.subject)}</span>
      <h3 style="margin:8px 0 4px">${esc(q.title)}</h3>
      <p style="margin:0 0 8px;opacity:.85">${esc(q.body)}</p>
      <div style="font-size:12px;opacity:.65">Anonymous (${esc(q.year)}) • ${q.answers.length} answers</div>
      <div style="margin:10px 0"><button style="${vbtn}" onclick="upvoteQ(${q.id})">▲ ${q.votes}</button></div>
      ${q.answers.map((a, i) => `<div style="margin:8px 0 0 10px;padding-left:12px;border-left:3px solid #FFD700"><div>${esc(a.text)}</div>
        <div style="font-size:12px;opacity:.65;margin-top:4px">Anonymous (${esc(a.year)}) <button style="${vbtn};font-size:12px" onclick="upvoteA(${q.id},${i})">▲ ${a.votes}</button></div></div>`).join("")}
      <div style="display:flex;gap:8px;margin-top:12px">
        <input id="ans-${q.id}" placeholder="Write an answer..." style="flex:1;padding:8px;border-radius:8px;border:1px solid rgba(255,215,0,.3);background:rgba(0,0,0,.3);color:inherit">
        <button style="${vbtn}" onclick="postAnswer(${q.id})">Answer</button>
      </div>
    </div>`).join("") || "<p style='opacity:.7;margin-top:16px'>No questions found.</p>";
}

/* ---------- MARKETPLACE ---------- */
function toggleMarketplaceForm() { $("marketplace-form").classList.toggle("hidden"); }
function postMarketplace(e) {
  e.preventDefault();
  const item = { id: nid(S.items), name: $("m-name").value.trim(), category: $("m-category").value, price: Number($("m-price").value) || 0, desc: $("m-desc").value.trim(), seller: S.user.name, email: S.user.email, sold: false };
  S.items.push(item);
  S.log.push(stamp(`${S.user.name} listed "${item.name}" ${item.price ? "for ₹" + item.price : "as a donation"}`));
  persist();
  $("marketplace-form").reset();
  $("marketplace-form").classList.add("hidden");
  renderMarket();
  toast("Item listed");
}
function buyItem(id) {
  const it = S.items.find(x => x.id === id);
  if (it.email === S.user.email) return toast("This is your own listing");
  it.sold = true;
  S.log.push(stamp(`${S.user.name} ${it.price ? "bought" : "claimed"} "${it.name}" from ${it.seller} ${it.price ? "for ₹" + it.price : "(free)"}`));
  persist(); renderMarket();
  toast("Done! Meet the seller on campus.");
}
function renderMarket() {
  const card = "background:rgba(255,255,255,.05);border:1px solid rgba(255,215,0,.25);border-radius:14px;padding:16px";
  const chip = "display:inline-block;background:rgba(255,215,0,.15);color:#FFD700;border-radius:20px;padding:2px 12px;font-size:12px";
  $("marketplace-list").innerHTML = S.items.slice().reverse().map(it => `
    <div style="${card}">
      <span style="${chip}">${esc(it.category)}</span>
      <h3 style="margin:8px 0 4px">${esc(it.name)}</h3>
      <div style="color:#FFD700;font-weight:700;font-size:18px">${it.price ? "₹" + it.price : "FREE (Donation)"}</div>
      <p style="margin:6px 0;opacity:.85">${esc(it.desc)}</p>
      <div style="font-size:12px;opacity:.65;margin-bottom:10px">Seller: ${esc(it.seller)}</div>
      ${it.sold ? "<b style='color:#ff6b6b'>SOLD</b>" : `<button class="btn-primary" onclick="buyItem(${it.id})">${it.price ? "Buy" : "Claim"}</button>`}
    </div>`).join("");
}

/* ---------- PROFILE ---------- */
function renderProfile() {
  const u = S.user; if (!u) return;
  $("p-name").textContent = u.name;
  $("p-email").textContent = u.email;
  $("p-year").textContent = u.year;
  const myQ = S.questions.filter(q => q.email === u.email);
  const myA = S.questions.flatMap(q => q.answers).filter(a => a.email === u.email);
  const upv = myQ.reduce((s, q) => s + q.votes, 0) + myA.reduce((s, a) => s + a.votes, 0);
  const rep = myQ.length * 2 + myA.length * 5 + upv;
  $("stat-questions").textContent = myQ.length;
  $("stat-items").textContent = S.items.filter(i => i.email === u.email).length;
  $("stat-upvotes").textContent = upv;
  $("stat-reputation").textContent = "⭐ " + rep;
  let box = $("audit-log");
  if (!box) {
    box = document.createElement("div");
    box.id = "audit-log";
    box.style.cssText = "margin-top:24px";
    document.querySelector(".profile-container").appendChild(box);
  }
  box.innerHTML = "<h3 style='color:#FFD700'>Transaction Audit Log</h3>" + (S.log.length
    ? S.log.slice().reverse().map(l => `<div style="background:rgba(255,255,255,.05);border-radius:10px;padding:10px;margin:8px 0"><div>${esc(l.t)}</div><div style="font-size:12px;opacity:.6">${esc(l.at)}</div></div>`).join("")
    : "<p style='opacity:.7'>No transactions yet. List, buy or claim an item to see the audit trail.</p>");
}

function renderAll() { renderQA(); renderMarket(); renderProfile(); }

/* ---------- START ---------- */
if (S.user) showApp();