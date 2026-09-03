// Puzzle Review — static curation app. No backend; state lives in localStorage,
// exported as JSON or pushed to the repo via the GitHub contents API.
// Drawing and rule-checking come from the shared core, the same code the book pipeline uses.
import { GENRES } from "../core/index.js";

(function () {
  const DATA = (window.PUZZLE_DATA && window.PUZZLE_DATA.batches) || [];
  const RENDERERS = Object.fromEntries(Object.values(GENRES).map((g) => [g.id, { label: g.label, japanese: g.japanese, rules: g.rules, thumbnail: g.render.thumbnail, mount: g.render.mount, hint: g.render.hint, inputs: g.render.inputs }]));
  const STATUSES = ["pending", "approved", "maybe", "rejected"];
  const TAGS = ["great opening", "showpiece", "flat path", "too easy", "too hard", "ugly layout", "clue cluster", "reprint candidate"];
  const LS = { decisions: "puzzle-review:decisions:v1", progress: "puzzle-review:progress:v1", gh: "puzzle-review:github:v1", ui: "puzzle-review:ui:v1" };

  const $ = (sel, root = document) => root.querySelector(sel);
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode etc. */ } };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const state = {
    decisions: load(LS.decisions, {}),   // id -> {status, notes, tags, solveSeconds, solvedCorrectly, decidedAt, batch}
    progress: load(LS.progress, {}),     // id -> {entries, seconds}
    ui: load(LS.ui, { batch: null, filter: "all" }),
    selected: null,
    ctrl: null,
    timer: { running: false, startedAt: 0, base: 0, handle: null },
  };

  // ---------------------------------------------------------------- data helpers
  const batchById = (id) => DATA.find((b) => b.batch === id);
  const currentBatch = () => batchById(state.ui.batch) || DATA[0];
  const decisionOf = (id) => state.decisions[id] || { status: "pending", notes: "", tags: [] };
  const statusOf = (id) => decisionOf(id).status || "pending";
  const visiblePuzzles = () => {
    const b = currentBatch(); if (!b) return [];
    const f = state.ui.filter;
    return b.puzzles.filter((p) => f === "all" || statusOf(p.id) === f);
  };
  const setDecision = (id, patch) => {
    const b = currentBatch();
    const cur = decisionOf(id);
    const next = { ...cur, ...patch, batch: b ? b.batch : cur.batch };
    if (patch.status && patch.status !== "pending") next.decidedAt = new Date().toISOString();
    if (patch.status === "pending") delete next.decidedAt;
    const prog = state.progress[id];
    if (prog && prog.seconds != null) next.solveSeconds = Math.round(prog.seconds);
    state.decisions[id] = next;
    save(LS.decisions, state.decisions);
  };

  // ---------------------------------------------------------------- toast
  let toastHandle;
  const toast = (msg) => {
    const t = $("#toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastHandle); toastHandle = setTimeout(() => (t.hidden = true), 2200);
  };

  // ---------------------------------------------------------------- header
  function renderHeader() {
    const sel = $("#batch-select");
    sel.innerHTML = DATA.map((b) => `<option value="${esc(b.batch)}">${esc(b.batch)} (${b.puzzles.length})</option>`).join("");
    const b = currentBatch();
    if (b) sel.value = b.batch;

    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    (b ? b.puzzles : []).forEach((p) => counts[statusOf(p.id)]++);
    const total = b ? b.puzzles.length : 0;
    $("#status-filters").innerHTML = [["all", "All", total], ...STATUSES.map((s) => [s, s[0].toUpperCase() + s.slice(1), counts[s]])]
      .map(([k, label, n]) => `<button class="chip ${state.ui.filter === k ? "active" : ""}" data-filter="${k}">${label}<span class="n">${n}</span></button>`).join("");
    $("#progress").textContent = total ? `${total - counts.pending} / ${total} reviewed` : "no batches loaded";
  }

  // ---------------------------------------------------------------- contact sheet
  function renderSheet() {
    const sheet = $("#sheet");
    const puzzles = visiblePuzzles();
    if (!puzzles.length) {
      sheet.innerHTML = `<div class="empty">${DATA.length ? "Nothing matches this filter." : "No puzzle batches found. Run <code>python tools/pack_review_data.py</code>."}</div>`;
      return;
    }
    sheet.innerHTML = puzzles.map((p) => {
      const r = RENDERERS[p.type];
      const thumb = r ? r.thumbnail(p) : `<div class="muted">no renderer for ${esc(p.type)}</div>`;
      const st = statusOf(p.id);
      const d = p.difficulty || {};
      return `<article class="card ${state.selected === p.id ? "selected" : ""}" data-id="${esc(p.id)}" title="${esc(p.id)}">
        ${st !== "pending" ? `<span class="badge ${st}"></span>` : ""}
        ${thumb}
        <div class="meta"><span><b>${esc(r ? r.label : p.type)}</b> ${p.params.rows}×${p.params.cols}</span>
        <span>${d.label ? esc(d.label) : ""} ${d.band ? "·".repeat(d.band) : ""}</span></div>
      </article>`;
    }).join("");
  }

  // ---------------------------------------------------------------- detail
  function stopTimer(persist = true) {
    const t = state.timer;
    if (t.running) { t.base += (Date.now() - t.startedAt) / 1000; t.running = false; }
    clearInterval(t.handle); t.handle = null;
    if (persist && state.selected) {
      const prog = state.progress[state.selected] || {};
      prog.seconds = t.base; state.progress[state.selected] = prog; save(LS.progress, state.progress);
    }
  }
  function startTimer() {
    const t = state.timer;
    if (t.running) return;
    t.running = true; t.startedAt = Date.now();
    t.handle = setInterval(() => { const el = $("#timer"); if (el) el.textContent = fmtTime(t.base + (Date.now() - t.startedAt) / 1000); }, 500);
  }

  function closeDetail() {
    stopTimer();
    if (state.ctrl) { state.ctrl.destroy(); state.ctrl = null; }
    state.selected = null;
    $("#detail").hidden = true;
    $(".layout").classList.remove("has-detail");
    renderSheet();
  }

  function openDetail(id) {
    const b = currentBatch();
    const p = b && b.puzzles.find((x) => x.id === id);
    if (!p) return;
    stopTimer();
    if (state.ctrl) state.ctrl.destroy();
    state.selected = id;
    state.timer.base = (state.progress[id] && state.progress[id].seconds) || 0;

    const r = RENDERERS[p.type];
    const d = p.difficulty || {};
    const dec = decisionOf(id);
    const detail = $("#detail");
    const techniques = Object.entries(d.technique_counts || {}).filter(([, n]) => n).map(([k, n]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${n}</dd>`).join("");
    const path = Object.entries(d.path || {}).map(([k, v]) => `<dt>${esc(k.replace(/_/g, " "))}</dt><dd>${esc(v)}</dd>`).join("");
    const provisional = /provisional/i.test(d.rating_method || "");

    detail.innerHTML = `
      <div class="detail-head">
        <h1>${esc(r ? r.label : p.type)} <span class="jp">${esc(r && r.japanese || "")}</span> ${p.params.rows}×${p.params.cols}</h1>
        <span class="id">${esc(p.id)}</span>
        <span class="spacer"></span>
        <button class="btn" id="btn-close" title="Back to sheet (Esc)">Close</button>
      </div>
      <div class="detail-body">
        <div>
          <div class="board" id="board" tabindex="0"></div>
          <div class="board-tools">
            <button class="btn" id="btn-check">Check</button>
            <button class="btn" id="btn-reveal">Reveal</button>
            <button class="btn" id="btn-reset">Reset</button>
            <span class="timer" id="timer">${fmtTime(state.timer.base)}</span>
          </div>
          <div class="keypad" id="keypad"></div>
          <div class="check-msg" id="check-msg"></div>
          <p class="hint">${esc(r && r.hint ? r.hint : "")}
            Decide with <kbd>A</kbd> approve · <kbd>M</kbd> maybe · <kbd>R</kbd> reject · <kbd>←</kbd>/<kbd>→</kbd> prev/next. Timer starts on your first move.</p>
        </div>
        <div class="panel">
          <h3>Decision</h3>
          <div class="decide">
            <button class="btn nav-btn" id="btn-prev-m" aria-label="Previous puzzle">←</button>
            <button class="btn approve ${dec.status === "approved" ? "on" : ""}" data-decide="approved">Approve<kbd>A</kbd></button>
            <button class="btn maybe ${dec.status === "maybe" ? "on" : ""}" data-decide="maybe">Maybe<kbd>M</kbd></button>
            <button class="btn reject ${dec.status === "rejected" ? "on" : ""}" data-decide="rejected">Reject<kbd>R</kbd></button>
            <button class="btn nav-btn" id="btn-next-m" aria-label="Next puzzle">→</button>
          </div>
          <h3>Tags</h3>
          <div class="tags">${TAGS.map((t) => `<button class="chip ${(dec.tags || []).includes(t) ? "active" : ""}" data-tag="${esc(t)}">${esc(t)}</button>`).join("")}</div>
          <h3>Notes</h3>
          <textarea class="notes" id="notes" placeholder="What did it feel like to solve? Where was the aha?">${esc(dec.notes || "")}</textarea>
          <h3>Difficulty</h3>
          <dl class="kv">
            <dt>Band</dt><dd><span class="band">${d.band ?? "?"} <span class="dots">${"●".repeat(d.band || 0)}${"○".repeat(Math.max(0, 5 - (d.band || 0)))}</span> ${esc(d.label || "")}</span></dd>
            <dt>Score</dt><dd>${d.score ?? "—"}</dd>
            <dt>Max tier</dt><dd>${d.max_tier ?? "beyond rater"}</dd>
            ${techniques}${path}
          </dl>
          ${provisional ? `<p class="warn">Rating is provisional (${esc(d.rating_method)}). Treat the band as a hint, not a measurement.</p>` : ""}
          <h3>Puzzle</h3>
          <dl class="kv">
            <dt>Clues</dt><dd>${p.stats && p.stats.clue_count != null ? p.stats.clue_count : "—"}</dd>
            <dt>Symmetry</dt><dd>${esc(p.params.symmetry || "none")}</dd>
            <dt>Seed</dt><dd>${esc(p.seed)}</dd>
            <dt>Generator</dt><dd>v${esc(p.generator_version || "?")}</dd>
            ${dec.solveSeconds != null ? `<dt>Solve time</dt><dd>${fmtTime(dec.solveSeconds)}</dd>` : ""}
            ${dec.decidedAt ? `<dt>Decided</dt><dd>${esc(dec.decidedAt.slice(0, 16).replace("T", " "))}</dd>` : ""}
          </dl>
          <div class="nav">
            <button class="btn" id="btn-prev">← Prev</button>
            <button class="btn" id="btn-next">Next →</button>
          </div>
        </div>
      </div>`;
    detail.hidden = false;
    $(".layout").classList.add("has-detail");

    const board = $("#board");
    if (r) {
      state.ctrl = r.mount(board, p, state.progress[id], (s) => {
        startTimer();
        state.progress[id] = { ...(state.progress[id] || {}), ...s, seconds: state.timer.base + (state.timer.running ? (Date.now() - state.timer.startedAt) / 1000 : 0) };
        save(LS.progress, state.progress);
        $("#check-msg").textContent = ""; $("#check-msg").className = "check-msg";
      });
      if (r.inputs) {
        const pad = $("#keypad");
        pad.innerHTML = r.inputs.map((k) => `<button type="button" data-key="${esc(k.key)}" aria-label="${esc(k.label)}">${esc(k.label)}</button>`).join("");
        pad.onclick = (e) => { const b = e.target.closest("[data-key]"); if (b && state.ctrl) state.ctrl.handleKey({ key: b.dataset.key }); };
      }
    } else {
      board.innerHTML = `<pre class="muted">${esc(JSON.stringify(p.clues, null, 1))}</pre>`;
    }

    $("#btn-close").onclick = closeDetail;
    $("#btn-check").onclick = () => {
      if (!state.ctrl) return;
      const res = state.ctrl.check();
      const m = $("#check-msg");
      if (res.correct) { stopTimer(); m.textContent = `Solved correctly in ${fmtTime(state.timer.base)}.`; m.className = "check-msg ok"; setDecision(id, { solvedCorrectly: true }); }
      else if (res.reason) { m.textContent = `Not valid yet: ${res.reason}.`; m.className = "check-msg bad"; }
      else if (!res.complete) { m.textContent = `Incomplete${res.wrongCount ? `, ${res.wrongCount} wrong so far` : ", no errors so far"}.`; m.className = "check-msg " + (res.wrongCount ? "bad" : ""); }
      else { m.textContent = `${res.wrongCount} mark${res.wrongCount === 1 ? "" : "s"} wrong.`; m.className = "check-msg bad"; }
    };
    $("#btn-reveal").onclick = () => { stopTimer(); state.ctrl && state.ctrl.reveal(); };
    $("#btn-reset").onclick = () => { stopTimer(); state.timer.base = 0; $("#timer").textContent = "0:00"; state.ctrl && state.ctrl.reset(); state.progress[id] = { seconds: 0 }; save(LS.progress, state.progress); };
    detail.querySelectorAll("[data-decide]").forEach((btn) => (btn.onclick = () => decide(btn.dataset.decide)));
    detail.querySelectorAll("[data-tag]").forEach((btn) => (btn.onclick = () => {
      const tags = new Set(decisionOf(id).tags || []);
      tags.has(btn.dataset.tag) ? tags.delete(btn.dataset.tag) : tags.add(btn.dataset.tag);
      setDecision(id, { tags: [...tags] }); btn.classList.toggle("active");
    }));
    $("#notes").oninput = (e) => setDecision(id, { notes: e.target.value });
    $("#btn-prev").onclick = () => step(-1);
    $("#btn-next").onclick = () => step(1);
    $("#btn-prev-m").onclick = () => step(-1);
    $("#btn-next-m").onclick = () => step(1);
    renderSheet();
    board.focus();
  }

  function decide(status) {
    if (!state.selected) return;
    stopTimer(); // capture time before saving
    const cur = statusOf(state.selected);
    setDecision(state.selected, { status: cur === status ? "pending" : status });
    renderHeader();
    document.querySelectorAll("[data-decide]").forEach((b) => b.classList.toggle("on", statusOf(state.selected) === b.dataset.decide));
    renderSheet();
    if (cur !== status) {
      toast(`${status[0].toUpperCase() + status.slice(1)} · ${state.selected}`);
      const b = currentBatch();
      const remaining = b.puzzles.find((p) => statusOf(p.id) === "pending" && p.id !== state.selected);
      if (state.ui.filter === "pending" || state.ui.filter === "all") remaining ? openDetail(remaining.id) : step(1);
    }
  }

  function step(dir) {
    const list = visiblePuzzles().length ? visiblePuzzles() : (currentBatch() || { puzzles: [] }).puzzles;
    if (!list.length) return;
    const i = list.findIndex((p) => p.id === state.selected);
    const next = list[(i + dir + list.length) % list.length];
    if (next) openDetail(next.id);
  }

  // ---------------------------------------------------------------- export / import
  const batchDecisions = () => {
    const b = currentBatch();
    const out = {};
    b.puzzles.forEach((p) => { if (state.decisions[p.id] && state.decisions[p.id].status && state.decisions[p.id].status !== "pending") out[p.id] = state.decisions[p.id]; });
    return { batch: b.batch, exported_at: new Date().toISOString(), decisions: out };
  };
  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }
  $("#btn-export").onclick = async () => {
    const payload = batchDecisions();
    const text = JSON.stringify(payload, null, 1);
    download(`${payload.batch}.decisions.json`, text);
    try { await navigator.clipboard.writeText(text); toast(`Exported ${Object.keys(payload.decisions).length} decisions (also copied)`); }
    catch { toast(`Exported ${Object.keys(payload.decisions).length} decisions`); }
  };
  $("#btn-import").onclick = () => $("#import-file").click();
  $("#import-file").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      const n = mergeDecisions(obj.decisions || obj);
      toast(`Imported ${n} decisions`); renderHeader(); renderSheet();
    } catch (err) { toast("Import failed: " + err.message); }
    e.target.value = "";
  };
  function mergeDecisions(remote) {
    let n = 0;
    for (const [id, d] of Object.entries(remote)) {
      const local = state.decisions[id];
      if (!local || !local.decidedAt || (d.decidedAt && d.decidedAt > local.decidedAt)) { state.decisions[id] = d; n++; }
    }
    save(LS.decisions, state.decisions);
    return n;
  }

  // ---------------------------------------------------------------- GitHub sync
  const gh = load(LS.gh, { owner: "playfulbacon", repo: "puzzle-books", branch: "main", token: "" });
  const dlg = $("#sync-dialog");
  $("#btn-sync").onclick = () => {
    $("#gh-owner").value = gh.owner; $("#gh-repo").value = gh.repo; $("#gh-branch").value = gh.branch; $("#gh-token").value = gh.token;
    $("#sync-status").textContent = ""; dlg.showModal();
  };
  const ghRead = () => { gh.owner = $("#gh-owner").value.trim(); gh.repo = $("#gh-repo").value.trim(); gh.branch = $("#gh-branch").value.trim() || "main"; gh.token = $("#gh-token").value.trim(); save(LS.gh, gh); };
  const ghPath = () => `review/decisions/${currentBatch().batch}.json`;
  const ghUrl = () => `https://api.github.com/repos/${gh.owner}/${gh.repo}/contents/${ghPath()}`;
  const ghHeaders = () => ({ Authorization: `Bearer ${gh.token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" });
  const b64 = (s) => btoa(unescape(encodeURIComponent(s)));
  const unb64 = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ""))));
  async function ghGet() {
    const res = await fetch(`${ghUrl()}?ref=${encodeURIComponent(gh.branch)}`, { headers: ghHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.json()).message || res.statusText}`);
    return res.json();
  }
  $("#gh-pull").onclick = async () => {
    ghRead(); const st = $("#sync-status");
    try {
      st.textContent = "Pulling…";
      const file = await ghGet();
      if (!file) { st.textContent = "No decisions file in the repo yet for this batch."; return; }
      const obj = JSON.parse(unb64(file.content));
      const n = mergeDecisions(obj.decisions || {});
      st.textContent = `Pulled: ${n} decision${n === 1 ? "" : "s"} newer than local.`; renderHeader(); renderSheet();
    } catch (err) { st.textContent = err.message; }
  };
  $("#gh-push").onclick = async () => {
    ghRead(); const st = $("#sync-status");
    try {
      st.textContent = "Pushing…";
      const existing = await ghGet();
      const payload = batchDecisions();
      if (existing) { // merge remote-newer before overwriting
        const remote = JSON.parse(unb64(existing.content)).decisions || {};
        mergeDecisions(remote); Object.assign(payload, batchDecisions());
      }
      const body = { message: `review: decisions for ${payload.batch} (${Object.keys(payload.decisions).length})`, content: b64(JSON.stringify(payload, null, 1) + "\n"), branch: gh.branch };
      if (existing) body.sha = existing.sha;
      const res = await fetch(ghUrl(), { method: "PUT", headers: { ...ghHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.json()).message || res.statusText}`);
      st.textContent = `Pushed ${Object.keys(payload.decisions).length} decisions to ${gh.branch}:${ghPath()}`;
    } catch (err) { st.textContent = err.message; }
  };

  // ---------------------------------------------------------------- global events
  $("#batch-select").onchange = (e) => { closeDetail(); state.ui.batch = e.target.value; save(LS.ui, state.ui); renderHeader(); renderSheet(); };
  $("#status-filters").onclick = (e) => { const c = e.target.closest("[data-filter]"); if (!c) return; state.ui.filter = c.dataset.filter; save(LS.ui, state.ui); renderHeader(); renderSheet(); };
  $("#sheet").onclick = (e) => { const card = e.target.closest(".card"); if (card) openDetail(card.dataset.id); };
  document.addEventListener("keydown", (e) => {
    if (dlg.open) return;
    const inText = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (inText) return;
    if (!state.selected) return;
    if (state.ctrl && state.ctrl.handleKey(e)) { e.preventDefault(); return; }
    const k = e.key.toLowerCase();
    if (k === "a") decide("approved");
    else if (k === "m") decide("maybe");
    else if (k === "r") decide("rejected");
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Escape") closeDetail();
    else return;
    e.preventDefault();
  });
  window.addEventListener("beforeunload", () => stopTimer());

  // ---------------------------------------------------------------- boot
  if (!state.ui.batch && DATA[0]) state.ui.batch = DATA[0].batch;
  renderHeader(); renderSheet();
})();
