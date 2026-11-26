const fs = require("fs");
const vm = require("vm");
const JSDIR = process.env.HOME + "/.local/share/muse-gui/static/js";
const src = ["util.js", "icons.js", "i18n.js", "render.js", "thoughts.js", "message.js"]
  .map((f) => fs.readFileSync(JSDIR + "/" + f, "utf8")).join("\n");

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase(); this.children = []; this.dataset = {};
    this.style = {}; this.hidden = false; this.textContent = ""; this.innerHTML = "";
    this.className = ""; this.parentNode = null; this._attrs = {}; this.title = "";
    this.onclick = null; this.value = "";
  }
  setAttribute(k, v) { this._attrs[k] = v; }
  getAttribute(k) { return this._attrs[k]; }
  append(...nodes) { nodes.forEach((n) => this.appendChild(n)); }
  appendChild(n) { if (typeof n === "string") { this.textContent += n; return n; } n.parentNode = this; this.children.push(n); return n; }
  removeChild(n) { this.children = this.children.filter((c) => c !== n); return n; }
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
  get nextElementSibling() {
    if (!this.parentNode) return null;
    const sibs = this.parentNode.children; return sibs[sibs.indexOf(this) + 1] || null;
  }
  get classList() {
    const el = this;
    return {
      add: (c) => { const s = new Set(el.className.split(/\s+/).filter(Boolean)); s.add(c); el.className = [...s].join(" "); },
      contains: (c) => el.className.split(/\s+/).includes(c),
      toggle: (c, f) => { const s = new Set(el.className.split(/\s+/).filter(Boolean)); if (f === undefined ? !s.has(c) : f) s.add(c); else s.delete(c); el.className = [...s].join(" "); },
    };
  }
  closest(sel) {
    const parts = String(sel).split(",").map((x) => x.trim());
    let n = this;
    while (n) { if (parts.some((q) => n._match(q))) return n; n = n.parentNode; }
    return null;
  }
  _match(sel) {
    sel = String(sel).trim();
    if (sel.charAt(0) === "[") { const k = sel.slice(1, -1); return this._attrs[k] !== undefined || this.dataset[k.replace(/^data-/, "")] !== undefined; }
    const parts = sel.split(/\s+/);
    if (parts.length === 2) {
      if (!this._match(parts[1])) return false;
      let p = this.parentNode;
      while (p) { if (p._match(parts[0])) return true; p = p.parentNode; }
      return false;
    }
    if (sel.charAt(0) === ".") return this.className.split(/\s+/).includes(sel.slice(1));
    return this.tagName === sel.toUpperCase();
  }
  querySelectorAll(sel) {
    const out = [];
    const walk = (n) => { n.children.forEach((c) => { if (c._match(sel)) out.push(c); walk(c); }); };
    walk(this); return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}
const chat = new El("div");
const sandbox = { document: { createElement: (t) => new El(t), querySelector: () => null }, console, chat };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
vm.runInContext(`
globalThis.__T = { addMsg, markThoughtsDone, collectThoughts, updateThought, toggleThoughtDetail };
`, sandbox);
const T = sandbox.__T;

// simulate openConv chat build: user msg + ai msg with thought block + long user msg (fold path)
const tbox = { _tstate: null };
let pass = 0, fail = 0;
function t(name, cond, extra) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, extra || ""); }
}
try {
  const m1 = T.addMsg("me", "hello", null, "12:00", true);
  t("addmsg-me", !!m1 && m1.className.indexOf("msg me") >= 0);
  const th = [{ k: "terminal", s: "Run echo hi", d: [{ h: "output", b: "hi" }] }, { k: "reason", s: "" }];
  const m2 = T.addMsg("ai", "done", null, "12:01", true, { thoughts: th });
  t("addmsg-thoughts", !!m2 && m2.innerHTML.indexOf("trow") >= 0);
  const m3 = T.addMsg("me", "x".repeat(250), null, null, true);
  t("addmsg-fold", m3.className.indexOf("folded") >= 0);
  const m4 = T.addMsg("me", "", null, null, true);
  t("addmsg-empty", !!m4);
  t("addmsg-count", chat.children.length === 4, String(chat.children.length));
} catch (e) {
  t("addmsg-nothrow", false, e && e.message);
}
function mkbox2() {
  const tbox = new El("div");
  const hb = new El("div"); hb.className = "thead";
  const sp = new El("span"); sp.className = "tspin";
  const ty = new El("span"); ty.className = "ttype"; ty.hidden = true;
  const hs = new El("span"); hs.className = "tsum"; hs.textContent = "x";
  const tg = new El("button"); tg.className = "ttoggle"; tg.hidden = true;
  hb.append(sp, ty, hs, tg);
  const tb = new El("div"); tb.className = "tbody"; tb.hidden = true;
  tbox.append(hb, tb);
  const st = { rows: new Map(), texts: [], body: tb, tbox: tbox, headSpin: sp, headSum: hs, headTgl: tg, last: "" };
  tbox._tstate = st;
  return { tbox: tbox, tstate: st };
}
(function () {
  const b = mkbox2();
  const tid = "t-s1";
  T.updateThought(b.tbox, b.tstate, { payload: { kind: "task_lifecycle", task_id: tid, event: { kind: "proposed", task_id: tid, task_kind: "tool.bash" } } });
  T.updateThought(b.tbox, b.tstate, { payload: { kind: "task_lifecycle", task_id: tid, event: { kind: "side_effect_intent", task_id: tid, operation: "tool:bash", idempotency_key: "tool:call_S1" } } });
  const chunk = JSON.stringify({ command: "find / big", description: "big scan", exit_code: 0, output: "x".repeat(50), original_output_bytes: 99999, truncated: true });
  T.updateThought(b.tbox, b.tstate, { payload: { kind: "task_lifecycle", task_id: tid, event: { kind: "output", task_id: tid, chunk: chunk } } });
  const btns = b.tbox.querySelectorAll(".tfullbtn");
  t("truncated-button", btns.length === 1 && btns[0].dataset.call === "call_S1", String(btns.length));
})();
(function () {
  const b = mkbox2();
  const tid = "t-s2";
  T.updateThought(b.tbox, b.tstate, { payload: { kind: "task_lifecycle", task_id: tid, event: { kind: "proposed", task_id: tid, task_kind: "model.meta.response" } } });
  const r = b.tstate.rows.get(tid);
  const stg = r.det.children[0].querySelector(".ttoggle");
  const before = r.det.hidden;
  T.toggleThoughtDetail(r.tgl);
  t("static-noexpand", r.el.dataset.static === "1" && r.tgl.hidden === true && stg.hidden === true && r.det.hidden === before);
})();
console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);

