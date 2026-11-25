"use strict";
const $ = (s) => document.querySelector(s);
const chat = $("#chat"), input = $("#in"), slash = $("#slash");
let slashList = [], slashIdx = 0, sessionId = null, convKey = null;
const MAX_MSGS = 200;
function loadConvs() {
  try {
    const a = JSON.parse(localStorage.getItem("muse-gui-convs") || "[]");
    return a.map((c) => ({ k: c.k, t: c.t || "새 대화",
      sid: c.sid || null, msgs: Array.isArray(c.msgs) ? c.msgs : [] }));
  } catch (e) { return []; }
}
let convs = loadConvs();
function persistConvs() {
  const save = () => localStorage.setItem("muse-gui-convs",
    JSON.stringify(convs.slice(0, 50)));
  try { save(); }
  catch (e) {
    if (!convs.length) return;
    convs.pop();
    try { save(); } catch (_) {}
  }
}

function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function escAttr(s) { return esc(String(s)).replace(/"/g, "&quot;"); }
const GREEK = { alpha:"α", beta:"β", gamma:"γ", delta:"δ", epsilon:"ε", varepsilon:"ε", zeta:"ζ", eta:"η", theta:"θ", iota:"ι", kappa:"κ", lambda:"λ", mu:"μ", nu:"ν", xi:"ξ", pi:"π", rho:"ρ", sigma:"σ", tau:"τ", phi:"φ", varphi:"φ", chi:"χ", psi:"ψ", omega:"ω", times:"×", div:"÷", pm:"±", cdot:"·", leq:"≤", geq:"≥", neq:"≠", approx:"≈", equiv:"≡", infty:"∞", to:"→", rightarrow:"→", leftarrow:"←", sum:"∑", prod:"∏", int:"∫", partial:"∂", ldots:"…", ell:"ℓ", circ:"∘" };
function renderMath(tex, display) {
  const raw = tex.trim();
  let t = esc(raw);
  t = t.replace(/\\text\{([^{}]*)\}/g, "$1");
  t = t.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>');
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="rad">$1</span>');
  t = t.replace(/\^(\{([^{}]*)\}|([^\s&;]))/g, (m, g, braced, ch) => "<sup>" + (braced || ch || "") + "</sup>");
  t = t.replace(/_(\{([^{}]*)\}|([^\s&;]))/g, (m, g, braced, ch) => "<sub>" + (braced || ch || "") + "</sub>");
  t = t.replace(/\\([a-zA-Z]+)/g, (m, w) => GREEK[w] || m);
  if (display) t = t.replace(/\\\\/g, "<br>");
  const tag = display ? "math math-block" : "math";
  return '<span class="' + tag + '" data-tex="' + escAttr(raw) + '">' + t + "</span>";
}
const HL_KW = {
  py: "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield",
  js: "await async break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof var void while with yield",
  c: "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Complex _Imaginary false true NULL include define",
  sh: "if then else elif fi for while until do done case esac function in select echo exit return local export readonly",
  sql: "SELECT FROM WHERE AND OR NOT INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DROP ALTER JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT OFFSET AS DISTINCT UNION ALL LIKE IN IS NULL PRIMARY KEY",
  css: "color background border margin padding font display flex grid position width height",
  rust: "as break const continue crate else enum extern false fn for if impl in let loop match mod move mut pub ref return self Self static struct super trait true type unsafe use where while",
  go: "break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var",
  java: "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null"
};
const HL_FAM = { python:"py", py:"py", javascript:"js", js:"js", typescript:"js", ts:"js", jsx:"js", tsx:"js", c:"c", h:"c", cpp:"c", "c++":"c", java:"c", cs:"c", go:"go", rust:"rust", bash:"sh", sh:"sh", shell:"sh", zsh:"sh", sql:"sql", css:"css", scss:"css", yaml:"py", yml:"py", toml:"py", ini:"py" };
function hl(code, lang) {
  const L = (lang || "").toLowerCase();
  let s = esc(code);
  if (L === "diff") {
    return s.split("\n").map((l) => {
      if (/^\+/.test(l)) return '<span class="tok-s">' + l + "</span>";
      if (/^-/.test(l)) return '<span class="tok-n">' + l + "</span>";
      if (/^@/.test(l)) return '<span class="tok-f">' + l + "</span>";
      return '<span class="tok-c">' + l + "</span>";
    }).join("\n");
  }
  if (L === "json") {
    return s.replace(/(&quot;|")([^"&]*?)\1(\s*:)?|(-?\d[\d.]*)|\b(true|false|null)\b/g,
      (m, q, key, colon, num, lit) => {
        if (key !== undefined) return colon ? '<span class="tok-f">' + q + key + q + "</span>" + colon : '<span class="tok-s">' + m + "</span>";
        if (num) return '<span class="tok-n">' + num + "</span>";
        return '<span class="tok-k">' + lit + "</span>";
      });
  }
  if (L === "html" || L === "xml" || L === "vue" || L === "viz-html") {
    return s.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([a-zA-Z][\w-]*)|([\w-]+)(=)("[^"]*"|'[^']*')|(\/?&gt;)/g,
      (m, com, open, tag, attr, eq, val, close) => {
        if (com) return '<span class="tok-c">' + com + "</span>";
        if (tag) return open + '<span class="tok-k">' + tag + "</span>";
        if (attr) return '<span class="tok-f">' + attr + "</span>" + eq + '<span class="tok-s">' + val + "</span>";
        return '<span class="tok-k">' + close + "</span>";
      });
  }
  const fam = HL_FAM[L] || "c";
  const kw = (HL_KW[fam] || "").split(" ").filter(Boolean).join("|");
  const commentRe = (fam === "py" || fam === "sh") ? "#[^\\n]*" : (fam === "sql" ? "(?:--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" : "(?://[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)");
  const re = new RegExp("(" + commentRe + ")|('(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"|`(?:[^`\\\\]|\\\\.)*`)|(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)" + (kw ? "|\\b(" + kw + ")\\b" : ""), "g");
  return s.replace(re, (m, com, str, num, word) => {
    if (com) return '<span class="tok-c">' + com + "</span>";
    if (str) return '<span class="tok-s">' + str + "</span>";
    if (num) return '<span class="tok-n">' + num + "</span>";
    if (word) return '<span class="tok-k">' + word + "</span>";
    return m;
  });
}
function vizHtml(code, height) {
  const h = Math.min(Math.max(parseInt(height, 10) || 360, 120), 1200);
  return '<iframe class="viz" sandbox="allow-scripts" loading="lazy" referrerpolicy="no-referrer" height="' + h + '" srcdoc="' + escAttr(code.replace(/^\n+|\n+$/g, "")) + '"></iframe>';
}
function renderText(src) {
  const stash = [];
  const keep = (html) => { stash.push(html); return "\u0000" + (stash.length - 1) + "\u0000"; };
  let s = String(src);
  s = s.replace(/```([^\n]*)\n([\s\S]*?)```/g, (m, info, code) => {
    const tok = (info || "").trim().split(/\s+/)[0] || "";
    const vm = tok.match(/^viz-html(?::(\d+))?$/i);
    if (vm) return keep(vizHtml(code, vm[1]));
    const lang = tok.toLowerCase();
    const label = esc(tok || "text");
    return keep('<pre data-lang="' + label + '"><code>' + hl(code.replace(/^\n+|\n+$/g, ""), lang) + "</code></pre>");
  });
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => keep(renderMath(tex, true)));
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (m, tex) => keep(renderMath(tex, true)));
  s = s.replace(/`([^`\n]+)`/g, (m, code) => keep("<code>" + esc(code) + "</code>"));
  s = s.replace(/\\\((.+?)\\\)/g, (m, tex) => keep(renderMath(tex, false)));
  s = s.replace(/\$([^$\n]+?)\$/g, (m, tex) => keep(renderMath(tex, false)));
  s = esc(s);
  const inline = (x) => {
    x = x.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1 (이미지)</a>');
    x = x.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
      /^(https?:\/\/|#|\/)/.test(url)
        ? '<a href="' + url + '" target="_blank" rel="noopener">' + label + "</a>"
        : label + " (" + url + ")");
    x = x.replace(/==([^=\n]+)==/g, "<mark>$1</mark>");
    x = x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    x = x.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    return x;
  };
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const lines = s.split("\n");
  let out = "", para = [], list = null, table = null;
  const flushPara = () => { if (para.length) { out += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
  const flushList = () => {
    if (!list) return;
    out += list.tag === "ul" ? "<ul>" : "<ol>";
    for (const it of list.items) {
      const tm = it.match(/^\[( |x|X)\]\s+(.*)/);
      if (tm) out += '<li class="task"><input type="checkbox" disabled' + (tm[1] === " " ? "" : " checked") + ">" + inline(tm[2]) + "</li>";
      else out += "<li>" + inline(it) + "</li>";
    }
    out += list.tag === "ul" ? "</ul>" : "</ol>";
    list = null;
  };
  const flushTable = () => {
    if (!table) return;
    out += "<table>";
    table.rows.forEach((r, i) => {
      out += "<tr>" + r.map((c) => (i === 0 ? "<th>" + inline(c) + "</th>" : "<td>" + inline(c) + "</td>")).join("") + "</tr>";
    });
    out += "</table>"; table = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if (/^\u0000\d+\u0000$/.test(l)) {
      flushPara(); flushList(); flushTable();
      out += stash[+l.slice(1, -1)] || ""; continue;
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) {
      flushPara(); flushList(); flushTable();
      out += "<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">"; continue;
    }
    if (/^---+\s*$/.test(l)) { flushPara(); flushList(); flushTable(); out += "<hr>"; continue; }
    if ((m = l.match(/^&gt;\s?(.*)/))) {
      flushPara(); flushList(); flushTable();
      const cm = m[1].match(/^\[!(note|tip|info|todo|example|quote|warning|caution|danger)\]\s*(.*)/i);
      if (cm) out += '<div class="callout c-' + cm[1].toLowerCase() + '"><div class="callout-title">' + esc(cm[1].toUpperCase()) + "</div>" + inline(cm[2]) + "</div>";
      else out += "<blockquote>" + inline(m[1]) + "</blockquote>";
      continue;
    }
    if (l.includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && /^\|?[\s:|-]+\|?$/.test(lines[i + 1])) {
      flushPara(); flushList(); table = { rows: [cells(l)] }; i++; continue;
    }
    if (table && l.includes("|")) { table.rows.push(cells(l)); continue; }
    if (table) flushTable();
    if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      flushPara();
      if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; }
      list.items.push(m[1]); continue;
    }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) {
      flushPara();
      if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; }
      list.items.push(m[1]); continue;
    }
    if (/^\s*$/.test(l)) { flushPara(); flushList(); flushTable(); continue; }
    flushList();
    para.push(l.trim());
  }
  flushPara(); flushList(); flushTable();
  out = out.replace(/\u0000(\d+)\u0000/g, (m, n) => stash[+n] || "");
  return out;
}
function timeStr(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
}
function addMsg(who, text, think, foot) {
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.dataset.raw = text;
  let html = renderText(text) + (think ? "<details><summary>상세</summary>" + esc(think) + "</details>" : "");
  if (who === "ai") html += '<div class="acts"><button type="button" data-copy title="복사">' + ICON_COPY + "</button></div>";
  else html += '<div class="acts"><button type="button" data-copy title="복사">' + ICON_COPY + '</button><button type="button" data-edit title="수정 후 다시 전송">✎</button></div>';
  if (foot) html += '<div class="meta">' + esc(foot) + "</div>";
  d.innerHTML = html;
  decorateCode(d); decorateMath(d);
  chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  return d;
}
function decorateMath(el) {
  el.querySelectorAll(".math[data-tex]").forEach((m) => {
    if (m.querySelector("[data-mathcopy]")) return;
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("data-mathcopy", "");
    b.title = "수식 복사"; b.innerHTML = ICON_COPY;
    b.onclick = async (e) => {
      e.stopPropagation();
      flashCopy(b, m.dataset.tex || "");
    };
    m.appendChild(b);
  });
}
function decorateCode(el) {
  el.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector("[data-codecopy]")) return;
    const code = pre.querySelector("code");
    if (!code) return;
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("data-codecopy", ""); b.title = "복사"; b.innerHTML = ICON_COPY;
    b.onclick = async (e) => {
      e.stopPropagation();
      flashCopy(b, code.textContent);
    };
    pre.prepend(b);
  });
}
function footFor(m) {
  const t = timeStr(m.ts);
  if (!t && !m.el) return "";
  return t + (m.el ? " · " + m.el + "초" : "");
}
function lastAiText() {
  const nodes = chat.querySelectorAll(".msg.ai");
  if (!nodes.length) return "";
  return nodes[nodes.length - 1].dataset.raw || "";
}
const ICON_COPY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
async function copyText(t) {
  if (!t) return false;
  try { await navigator.clipboard.writeText(t); return true; }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); return true; }
    catch (_) { return false; }
    finally { ta.remove(); }
  }
}
async function flashCopy(btn, text) {
  const old = btn.innerHTML;
  btn.innerHTML = (await copyText(text)) ? "✓" : "✗";
  setTimeout(() => { btn.innerHTML = old; }, 1200);
}
chat.addEventListener("click", async (e) => {
  const ed = e.target.closest("[data-edit]");
  if (ed) {
    const msgEl = ed.closest(".msg");
    const old = (msgEl && msgEl.dataset.raw) || "";
    const next = prompt("메시지 수정 (확인 = 수정된 내용으로 같은 세션에 다시 전송)", old);
    if (next === null) return;
    if (!next.trim() || next === old) return;
    input.value = next;
    input.focus();
    $("#f").requestSubmit();
    return;
  }
  const b = e.target.closest("[data-copy]");
  if (!b) return;
  flashCopy(b, b.closest(".msg").dataset.raw || "");
});
function curConv() { return convs.find((c) => c.k === convKey) || null; }
function saveConv(title) {
  convKey = convKey || ("c" + Date.now());
  const ex = curConv();
  if (ex) { if (title) ex.t = title; }
  else convs.unshift({ k: convKey, t: title || "새 대화", sid: null, msgs: [] });
  persistConvs(); drawConvs();
}
function saveMsg(who, text, meta) {
  const c = curConv();
  if (!c) return;
  c.msgs.push({ who, text, ts: (meta && meta.ts) || Date.now(), el: (meta && meta.el) || "" });
  if (c.msgs.length > MAX_MSGS) c.msgs.splice(0, c.msgs.length - MAX_MSGS);
  if (sessionId) c.sid = sessionId;
  persistConvs();
}
function openConv(k) {
  const c = convs.find((x) => x.k === k);
  if (!c) return;
  convKey = c.k; sessionId = c.sid || null;
  chat.innerHTML = "";
  c.msgs.forEach((m) => addMsg(m.who, m.text, null, footFor(m)));
  drawConvs();
}
function drawConvs() {
  const box = $("#convs"); box.innerHTML = "";
  convs.forEach((c) => {
    const b = document.createElement("button");
    b.textContent = c.t + (c.msgs.length ? " (" + c.msgs.length + ")" : "");
    b.type = "button"; b.dataset.k = c.k;
    b.title = (c.sid ? c.sid.slice(0, 8) + " · " : "") + c.msgs.length + "개 메시지";
    if (c.k === convKey) b.classList.add("active");
    b.onclick = () => openConv(c.k);
    b.oncontextmenu = (e) => showCtx(e, c.k);
    box.appendChild(b);
  });
}
function showCtx(e, k) {
  e.preventDefault();
  const ctx = $("#ctx");
  ctx.dataset.k = k; ctx.style.display = "block";
  ctx.style.left = e.clientX + "px"; ctx.style.top = e.clientY + "px";
}
function hideCtx() { $("#ctx").style.display = "none"; }
document.addEventListener("click", hideCtx);
$("#ctx").addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]");
  e.stopPropagation(); hideCtx();
  if (!act) return;
  const c = convs.find((x) => x.k === $("#ctx").dataset.k);
  if (!c) return;
  if (act.dataset.act === "rename") {
    const t = prompt("새 이름", c.t);
    if (t && t.trim()) { c.t = t.trim().slice(0, 60); persistConvs(); drawConvs(); }
  } else if (confirm('"' + c.t + '" 대화와 muse 세션 기록을 함께 삭제할까요?\n(실행 중인 세션은 삭제되지 않습니다)')) {
    const sid = c.sid || null;
    convs = convs.filter((x) => x.k !== c.k);
    if (convKey === c.k) { convKey = null; sessionId = null; chat.innerHTML = ""; }
    persistConvs(); drawConvs();
    if (sid) {
      fetch("/api/session/delete", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }) })
        .then((r) => r.json())
        .then((j) => { if (!j.ok) alert("세션 기록 삭제 실패: " + (j.text || "?")); })
        .catch(() => {});
    }
  }
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hideCtx(); hideModal(); } });
function loadTheme() {
  try { return JSON.parse(localStorage.getItem("muse-gui-theme") || "{}"); }
  catch (e) { return {}; }
}
function applyTheme() {
  const t = loadTheme();
  const th = t.theme || "light", ac = t.accent || "blue";
  document.documentElement.dataset.theme = th;
  document.documentElement.dataset.accent = ac;
  document.querySelectorAll("#themes .optbtn").forEach((b) =>
    b.classList.toggle("sel", b.dataset.th === th));
  document.querySelectorAll("#accents .sw").forEach((b) =>
    b.classList.toggle("sel", b.dataset.ac === ac));
}
function saveTheme(patch) {
  const t = loadTheme();
  localStorage.setItem("muse-gui-theme", JSON.stringify(Object.assign(t, patch)));
  applyTheme();
}
function showModal() { $("#ovl").hidden = false; loadAccount(); loadUsage(); }
document.querySelectorAll("#mtabs button").forEach((b) => { b.onclick = () => {
  document.querySelectorAll("#mtabs button").forEach((x) => x.classList.toggle("sel", x === b));
  document.querySelectorAll('#modal section[data-pane]').forEach((s) => s.classList.toggle("on", s.dataset.pane === b.dataset.tab));
}; });
async function loadUsage() {
  const box = $("#usagebox");
  box.textContent = "불러오는 중…";
  try {
    const r = await fetch("/api/usage"); const j = await r.json();
    const tot = { calls: 0, input: 0, output: 0 };
    Object.values(j.models || {}).forEach((m) => {
      tot.calls += m.calls || 0; tot.input += m.input || 0; tot.output += m.output || 0;
    });
    let html = "<p>총 " + j.turns + "턴 · 호출 " + tot.calls +
      " · in " + tot.input + " / out " + tot.output + "</p>";
    const al = j.allowance || {};
    html += "<p>구독: " + esc(al.allowance ? JSON.stringify(al.allowance) : (al.reason || al.hint || "조회 실패")) + "</p>";
    const names = Object.keys(j.models || {});
    if (names.length) {
      html += '<table class="usg"><tr><th>모델</th><th>호출</th><th>in</th><th>out</th></tr>';
      names.forEach((n) => {
        const m = j.models[n];
        html += "<tr><td>" + esc(n) + "</td><td>" + m.calls + "</td><td>" + m.input + "</td><td>" + m.output + "</td></tr>";
      });
      html += "</table>";
    }
    const ss = (j.sessions || []).slice(0, 20);
    if (ss.length) {
      html += '<table class="usg"><tr><th>세션</th><th>턴</th></tr>';
      ss.forEach((s) => {
        html += "<tr><td>" + esc(String(s.sid).slice(0, 8)) + "</td><td>" + s.turns + "</td></tr>";
      });
      html += "</table>";
    }
    box.innerHTML = html;
  } catch (e) { box.textContent = "불러오기 실패"; }
}
function hideModal() { $("#ovl").hidden = true; }
async function loadAccount() {
  try {
    const r = await fetch("/api/account"); const j = await r.json();
    if (!j.ok) { $("#acct").textContent = "로그인 정보 없음"; $("#tok").textContent = "없음"; return; }
    $("#acct").innerHTML = esc(j.name) + "<br>" + esc(j.email) + "<br>" +
      esc(j.provider) + " · " + esc(j.mechanism) +
      " · 구독 " + (j.subs_active ? "활성" : "없음");
    $("#tok").textContent = j.token_masked;
  } catch (e) { $("#acct").textContent = "불러오기 실패"; }
}
const EFFORT_OPTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"];
function fillSelect(sel, opts, cur) {
  const list = opts.slice();
  if (cur && !list.includes(cur)) list.push(cur);
  sel.innerHTML = list.map((o) => '<option value="' + esc(o) + '"' +
    (o === cur ? " selected" : "") + ">" + esc(o) + "</option>").join("");
  sel.value = cur || "";
}
async function refreshPrefs() {
  try {
    const [mi, ii] = await Promise.all([
      fetch("/api/models").then((r) => r.json()),
      fetch("/api/info").then((r) => r.json())]);
    fillSelect($("#model"), mi.models || [], ii.model);
    fillSelect($("#effort"), EFFORT_OPTS, ii.effort);
  } catch (e) {}
}
async function refreshInfo() {
  try {
    const r = await fetch("/api/info"); const j = await r.json();
    $("#meta").textContent = j.version + " · " + (j.muse_args.join(" ") || "기본 옵션") + " · " + j.cwd;
    $("#args").textContent = "muse args: " + (j.muse_args.join(" ") || "(없음)");
    $("#status").className = "ok";
  } catch (e) { $("#status").className = "err"; $("#meta").textContent = "서버 연결 실패"; }
  try {
    const r = await fetch("/api/slash"); slashList = await r.json();
  } catch (e) { slashList = []; }
}
function drawSlash(filter) {
  const items = slashList.filter((c) => c.cmd.startsWith(filter)).slice(0, 50);
  slash.innerHTML = ""; slashIdx = 0;
  if (!items.length || !filter.startsWith("/")) { slash.style.display = "none"; return; }
  items.forEach((c, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = c.cmd + " — " + c.desc;
    if (i === 0) b.classList.add("sel");
    b.onclick = () => { input.value = c.cmd + " "; input.focus(); slash.style.display = "none"; };
    slash.appendChild(b);
  });
  slash.style.display = "block";
}
input.addEventListener("input", () => {
  const v = input.value;
  if (v.startsWith("/") && !v.includes(" ") && !v.includes("\n")) drawSlash(v);
  else slash.style.display = "none";
});
input.addEventListener("keydown", (e) => {
  const popup = slash.style.display === "block";
  if (popup && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    const bs = [...slash.querySelectorAll("button")];
    slashIdx = (slashIdx + (e.key === "ArrowUp" ? -1 : 1) + bs.length) % bs.length;
    bs.forEach((b, i) => b.classList.toggle("sel", i === slashIdx));
  } else if (popup && e.key === "Tab") {
    e.preventDefault();
    const sel = slash.querySelector("button.sel");
    if (sel) sel.click();
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault(); $("#f").requestSubmit();
  }
});
$("#f").addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  const pre = text.startsWith("/") ? [] : featPrefixes();
  input.value = ""; slash.style.display = "none";
  $("#feats").innerHTML = "";
  const full = (pre.length ? pre.join("\n") + "\n" : "") + text;
  if (text === "/clear" || text.startsWith("/clear ")) {
    chat.innerHTML = "";
    const c = curConv();
    if (c) { c.msgs = []; persistConvs(); drawConvs(); }
    return;
  }
  saveConv(text.slice(0, 30));
  const meTs = Date.now();
  addMsg("me", text, null, timeStr(meTs)); saveMsg("me", text, { ts: meTs });
  if (text === "/copy" || text.startsWith("/copy ")) {
    const done = (await copyText(lastAiText())) ? "복사했습니다." : "복사할 답변이 없습니다.";
    addMsg("ai", done); saveMsg("ai", done); drawConvs();
    return;
  }
  const ph = addMsg("ai", "응답 생성 중…");
  const t0 = Date.now();
  try {
    const r = await fetch("/api/chat", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: full, session_id: sessionId }) });
    const j = await r.json();
    if (j.text === "__COPY__") {
      const prev = [...chat.querySelectorAll(".msg.ai")].filter((n) => n !== ph).pop();
      ph.dataset.raw = await copyText(prev ? prev.dataset.raw || "" : "");
      ph.innerHTML = esc(ph.dataset.raw);
    } else if (j.new_session) { sessionId = null; convKey = null; chat.innerHTML = ""; }
    else {
      sessionId = j.session_id || sessionId;
      ph.dataset.raw = j.text || "(빈 응답)";
      ph.innerHTML = renderText(ph.dataset.raw) + '<div class="acts"><button type="button" data-copy title="복사">' + ICON_COPY + "</button></div>";
      decorateCode(ph); decorateMath(ph);
    }
    if (!j.new_session) {
      const el = ((Date.now() - t0) / 1000).toFixed(1);
      const foot = timeStr(t0) + " · " + el + "초";
      ph.innerHTML += '<div class="meta">' + esc(foot) + "</div>";
      saveMsg("ai", ph.dataset.raw || "", { ts: t0, el });
    }
    drawConvs(); refreshPrefs();
    chat.scrollTop = chat.scrollHeight;
  } catch (err) {
    ph.dataset.raw = "전송 실패: " + err;
    ph.innerHTML = renderText(ph.dataset.raw);
    decorateCode(ph); decorateMath(ph);
    saveMsg("ai", ph.dataset.raw);
  }
});
$("#newchat").onclick = () => { sessionId = null; convKey = null; chat.innerHTML = ""; input.focus(); };
$("#model").addEventListener("change", async (e) => {
  await fetch("/api/prefs", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: e.target.value }) });
  refreshPrefs();
});
$("#effort").addEventListener("change", async (e) => {
  await fetch("/api/prefs", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ effort: e.target.value }) });
  refreshPrefs();
});
$("#gear").onclick = showModal;
$("#mclose").onclick = hideModal;
$("#ovl").addEventListener("click", (e) => { if (e.target === $("#ovl")) hideModal(); });
document.querySelectorAll("#themes .optbtn").forEach((b) => { b.onclick = () => saveTheme({ theme: b.dataset.th }); });
document.querySelectorAll("#accents .sw").forEach((b) => { b.onclick = () => saveTheme({ accent: b.dataset.ac }); });
$("#tokcopy").onclick = async (e) => {
  const b = e.currentTarget;
  try {
    const r = await fetch("/api/account/token", { method: "POST" });
    const j = await r.json();
    if (!j.ok || !j.token) return;
    flashCopy(b, j.token);
  } catch (_) {}
};
input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 132) + "px"; // 기본 44px의 3배까지
});
function setMode() {
  const lobby = !chat.children.length;
  document.querySelector("main").classList.toggle("lobby", lobby);
}
const FEAT_ICONS = {
  viz: '<span class="ficon"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>',
  web: '<span class="ficon"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>'
};
const FEATS = {
  viz: { chip: "시각화", prefix: "[시각화 요청] 답변에 인터랙티브 시각화가 필요하면 설명과 함께 아래 형식 코드블록을 포함하라.\n```viz-html\n(외부 CDN 없이 동작하는 단일 HTML 문서. <script> 사용 가능. sandbox라서 same-origin 접근·팝업·다운로드 불가)\n```\n높이는 ```viz-html:높이 로 지정(기본 360). 시각화가 필요 없으면 생략해도 된다." },
  web: { chip: "웹 검색", prefix: "[웹 검색 필수] 아래 요청에 답하기 전에 반드시 웹 검색을 수행하고 검색 결과와 함께 답하라. 검색 없이 알던 내용으로 답하지 마라. 사용한 검색어와 핵심 근거를 밝혀라." }
};
const DOCK_FEATURES = [
  { id: "viz", label: "시각화", desc: "인터랙티브 패널로 답변 요청", ready: true, feat: "viz" },
  { id: "web", label: "웹 검색", desc: "반드시 검색 후 답변", ready: true, feat: "web" },
  { id: "upload", label: "파일 업로드", desc: "준비 중", ready: false }
];
function addFeat(id) {
  if (!FEATS[id] || document.querySelector('#feats [data-f="' + id + '"]')) return;
  const s = document.createElement("span");
  s.className = "fchip"; s.dataset.f = id;
  s.innerHTML = (FEAT_ICONS[id] || "") + "<span>" + esc(FEATS[id].chip) + "</span> ";
  const x = document.createElement("button");
  x.type = "button"; x.textContent = "×"; x.title = "제거";
  x.onclick = (e) => { e.stopPropagation(); s.remove(); input.focus(); };
  s.appendChild(x);
  $("#feats").appendChild(s);
}
function featPrefixes() {
  return [...document.querySelectorAll("#feats .fchip")].map((c) => FEATS[c.dataset.f].prefix);
}
function renderPlusMenu() {
  const menu = $("#plusmenu");
  menu.innerHTML = "";
  DOCK_FEATURES.forEach((f) => {
    const b = document.createElement("button");
    b.type = "button"; b.disabled = !f.ready;
    const wrap = document.createElement("span");
    const lab = document.createElement("span"); lab.textContent = f.label;
    const sm = document.createElement("small");
    sm.textContent = f.ready ? f.desc : f.desc + " (추후 추가)";
    wrap.appendChild(lab); wrap.appendChild(sm);
    b.innerHTML = FEAT_ICONS[f.feat] || "";
    b.appendChild(wrap);
    if (f.ready) b.onclick = (e) => { e.stopPropagation(); addFeat(f.feat); input.focus(); menu.hidden = true; };
    menu.appendChild(b);
  });
}
$("#plus").onclick = (e) => { e.stopPropagation(); renderPlusMenu(); $("#plusmenu").hidden = !$("#plusmenu").hidden; };
document.addEventListener("click", (e) => { if (!e.target.closest("footer")) $("#plusmenu").hidden = true; });
const CHIPS = ["이 폴더 구조 설명해줘", "/usage", "viz-html 예시 보여줘"];
function renderChips() {
  const box = $("#chips");
  box.innerHTML = "";
  CHIPS.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = c;
    b.onclick = () => { input.value = c; input.focus(); };
    box.appendChild(b);
  });
}
new MutationObserver(setMode).observe(chat, { childList: true });
applyTheme();
renderChips();
drawConvs(); refreshInfo(); refreshPrefs(); setMode();
