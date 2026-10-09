/* CampusConnect - cloud.js
   1) Shared data across all devices (Firestore)
   2) Login only for @ves.ac.in students (Google sign-in)
   3) Alumni: LinkedIn + approval by the team
   Load AFTER script.js:  <script type="module" src="cloud.js"></script>
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ====== STEP 1: PASTE YOUR firebaseConfig HERE (replace the whole block) ====== */
const firebaseConfig = {
  apiKey: "AIzaSyAYkBxXUQHuzVPAQBKmeOlY1--SC2xN7go",
  authDomain: "campus-connect-11e1d.firebaseapp.com",
  projectId: "campus-connect-11e1d",
  storageBucket: "campus-connect-11e1d.firebasestorage.app",
  messagingSenderId: "7752779643",
  appId: "1:7752779643:web:68708b5919b74864775fde"
};
/* ============================================================================== */

const COLLEGE = "@ves.ac.in";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const SHARED = doc(db, "campusconnect", "shared");

let unsub = null, ready = false, timer = null, pendingRender = false;

/* ---------- login screen ---------- */
const form = document.querySelector(".auth-form");
const tagline = document.querySelector(".auth-header p");
if (tagline) tagline.textContent = "VESIT's Peer Learning Hub - sign in with your college Google account";
form.removeAttribute("onsubmit");
form.onsubmit = function (e) { e.preventDefault(); };
form.innerHTML = `
  <select id="cc-year" class="auth-input">
    <option value="1st Year">1st Year</option>
    <option value="2nd Year">2nd Year</option>
    <option value="3rd Year">3rd Year</option>
    <option value="4th Year">4th Year</option>
  </select>
  <button type="button" id="cc-student" class="auth-btn">Sign in with college Google (name@ves.ac.in)</button>
  <div style="text-align:center;opacity:.7;font-size:13px;margin:6px 0">Graduated already?</div>
  <button type="button" id="cc-alumni" class="auth-btn" style="background:transparent;border:1px solid #38bdf8;color:#38bdf8">I'm an Alumni</button>
  <div id="cc-msg" style="font-size:13px;margin-top:10px;min-height:18px"></div>
  <div id="cc-alumni-box" style="display:none;margin-top:10px">
    <p id="cc-alumni-info" style="font-size:13px;opacity:.85;margin-bottom:8px"></p>
    <div id="cc-alumni-fields">
      <input id="cc-a-linkedin" class="auth-input" placeholder="Your LinkedIn profile link">
      <input id="cc-a-grad" type="number" min="1990" max="2026" class="auth-input" placeholder="VESIT graduation year (e.g., 2023)">
      <select id="cc-a-branch" class="auth-input">
        <option value="">Branch</option><option>Computer</option><option>IT</option><option>EXTC</option><option>Mechanical</option><option>Other</option>
      </select>
      <button type="button" id="cc-a-submit" class="auth-btn">Submit for approval</button>
    </div>
    <button type="button" id="cc-a-cancel" class="auth-btn" style="background:transparent;border:1px solid #666;margin-top:8px">Cancel</button>
  </div>`;

const el = id => document.getElementById(id);
function msg(t, ok) { const m = el("cc-msg"); m.textContent = t || ""; m.style.color = ok ? "#7ee0a0" : "#ff8a8a"; }
function showLogin() {
  const ov = el("auth-overlay");
  ov.classList.add("active"); ov.style.display = "";
  el("app").classList.add("hidden"); el("app").style.display = "none";
  el("cc-alumni-box").style.display = "none";
  el("cc-student").style.display = ""; el("cc-alumni").style.display = "";
}

el("cc-student").onclick = async function () {
  msg("");
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ hd: "ves.ac.in", prompt: "select_account" });
  try { await signInWithPopup(auth, p); } catch (e) { msg("Sign-in cancelled or blocked. Allow pop-ups and try again."); }
};
el("cc-alumni").onclick = async function () {
  msg("");
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: "select_account" });
  try { await signInWithPopup(auth, p); } catch (e) { msg("Sign-in cancelled or blocked. Allow pop-ups and try again."); }
};

/* ---------- who is allowed in ---------- */
function yearFor(email) {
  const sel = el("cc-year").value || "1st Year";
  const m = email.match(/^(\d{4})\./);
  if (!m) return sel;
  const n = new Date();
  let y = n.getFullYear() - Number(m[1]) + (n.getMonth() >= 5 ? 1 : 0);
  y = Math.max(1, Math.min(4, y));
  return ["", "1st Year", "2nd Year", "3rd Year", "4th Year"][y];
}
async function isApprovedAlumni(email) {
  try { return (await getDoc(doc(db, "approvedAlumni", email))).exists(); } catch (e) { return false; }
}

onAuthStateChanged(auth, async function (u) {
  if (!u) { stopSync(); S.user = null; showLogin(); return; }
  const email = (u.email || "").toLowerCase();
  if (email.endsWith(COLLEGE) && u.emailVerified) return enter(u, email, yearFor(email));
  if (await isApprovedAlumni(email)) return enter(u, email, "Alumni");
  showAlumniRequest(u, email);
});

async function enter(u, email, year) {
  const first = !(S.user && S.user.email === email);
  S.user = { name: u.displayName || email.split("@")[0], email: email, year: year };
  await startSync();
  showApp(); switchTab("qa");
  if (first) toast("Welcome, " + S.user.name + "!");
}

/* ---------- alumni request ---------- */
async function showAlumniRequest(u, email) {
  el("cc-student").style.display = "none"; el("cc-alumni").style.display = "none";
  el("cc-alumni-box").style.display = "block";
  let existing = null;
  try { const s = await getDoc(doc(db, "alumniRequests", u.uid)); if (s.exists()) existing = s.data(); } catch (e) {}
  if (existing) {
    el("cc-alumni-info").textContent = "Your alumni request (" + email + ") is pending approval by the CampusConnect team. Please check back later.";
    el("cc-alumni-fields").style.display = "none";
  } else {
    el("cc-alumni-info").textContent = "Signed in as " + email + ". This is not a college account, so we need to verify you are a VESIT alumnus. Add your LinkedIn and details; the team will approve you.";
    el("cc-alumni-fields").style.display = "";
  }
  el("cc-a-submit").onclick = async function () {
    let li = el("cc-a-linkedin").value.trim();
    const grad = Number(el("cc-a-grad").value), branch = el("cc-a-branch").value;
    if (!li || !grad || !branch) return msg("Please fill LinkedIn, graduation year and branch.");
    if (!/^https?:\/\//i.test(li)) li = "https://" + li;
    try {
      await setDoc(doc(db, "alumniRequests", u.uid), { name: u.displayName || "", email: email, linkedin: li, grad: grad, branch: branch, status: "pending", at: Date.now() });
      await signOut(auth);
      msg("Request sent. The team will approve you after checking your LinkedIn.", true);
    } catch (e) { msg("Could not send request: " + (e.code || e.message)); }
  };
  el("cc-a-cancel").onclick = async function () { await signOut(auth); msg(""); };
}

/* ---------- shared data (same on laptop and phone) ---------- */
function localSave() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
function stopSync() { if (unsub) { unsub(); unsub = null; } ready = false; }

function startSync() {
  return new Promise(function (resolve) {
    stopSync();
    let first = true;
    const done = function () { if (first) { first = false; resolve(); } };
    unsub = onSnapshot(SHARED, function (snap) {
      if (snap.metadata.hasPendingWrites) return;
      if (!snap.exists()) { ready = true; push(); done(); return; }
      try {
        let d = snap.data().data;
        if (typeof d === "string") d = JSON.parse(d);
        const u = S.user;
        Object.keys(d).forEach(function (k) { if (k !== "user") S[k] = d[k]; });
        S.user = u;
      } catch (e) { console.warn("sync parse", e); }
      ready = true; localSave();
      if (S.user) rerender();
      done();
    }, function (err) {
      console.error(err);
      toast(err.code === "permission-denied" ? "Access denied: only VESIT students and approved alumni" : "Cloud error: " + err.code);
      done();
    });
  });
}

async function push() {
  if (!ready || !auth.currentUser) return;
  try {
    const rest = Object.assign({}, S); delete rest.user;
    const json = JSON.stringify(rest);
    if (json.length > 900000) return toast("Too much data. Please share notes as links, not files.");
    await setDoc(SHARED, { data: json, updatedAt: Date.now() });
  } catch (e) { console.error(e); toast("Could not sync: " + (e.code || e.message)); }
}

const origPersist = persist;
window.persist = function () {
  origPersist();
  if (ready && auth.currentUser) { clearTimeout(timer); timer = setTimeout(push, 250); }
};

function rerender() {
  const a = document.activeElement;
  if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.closest("#qa-list,#groups-list,#train-list,#marketplace-list,#notes-list,#alumni-list")) { pendingRender = true; return; }
  renderAll();
}
document.addEventListener("focusout", function () {
  if (pendingRender) { pendingRender = false; setTimeout(rerender, 250); }
});

window.handleLogout = async function () { await signOut(auth); toast("Logged out"); };

/* keep shared data small: big files break the 1 MB limit */
const nf = el("n-file");
if (nf) nf.addEventListener("change", function () {
  const f = nf.files[0];
  if (f && f.size > 150 * 1024) { toast("File over 150 KB. Please paste a link instead."); nf.value = ""; }
});
