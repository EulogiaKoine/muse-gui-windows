"use strict"
const $ = (s) => document.querySelector(s)
const chat = $("#chat"), input = $("#in"), slash = $("#slash")
let slashList = [], slashIdx = 0, sessionId = null, convKey = null
const MAX_MSGS = 200
function loadConvs() {
  try {
    const a = JSON.parse(localStorage.getItem("muse-gui-convs") || "[]")
    return a.map((c) => {
      const msgs = Array.isArray(c.msgs) ? c.msgs : []
      return { k: c.k, t: c.t || "새 대화",
        sid: c.sid || null, cwd: c.cwd || null, pin: !!c.pin,
        goal: c.goal && c.goal.objective ? { objective: c.goal.objective,
          items: normGoalItems(c.goal.items), active: !!c.goal.active } : null,
        at: c.at || (msgs.length && msgs[msgs.length - 1].ts) || 0,
        scroll: typeof c.scroll === "number" ? c.scroll : null,
        msgs }
    })
  } catch (e) {
    return []
  }
}
let convs = loadConvs()
function persistConvs() {
  const save = () => localStorage.setItem("muse-gui-convs",
    JSON.stringify(convs.slice(0, 50)))
  try {
    save()
  }
  catch (e) {
    if (!convs.length) return
    convs.pop()
    try { save(); } catch (_) {}
  }
}

function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function escAttr(s) { return esc(String(s)).replace(/"/g, "&quot;"); }
const ICON_LINK = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
const ICON_FOLDER = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
const GREEK = { alpha:"α", beta:"β", gamma:"γ", delta:"δ", epsilon:"ε", varepsilon:"ε", zeta:"ζ", eta:"η", theta:"θ", iota:"ι", kappa:"κ", lambda:"λ", mu:"μ", nu:"ν", xi:"ξ", pi:"π", rho:"ρ", sigma:"σ", tau:"τ", phi:"φ", varphi:"φ", chi:"χ", psi:"ψ", omega:"ω", times:"×", div:"÷", pm:"±", cdot:"·", leq:"≤", geq:"≥", neq:"≠", approx:"≈", equiv:"≡", infty:"∞", to:"→", rightarrow:"→", leftarrow:"←", sum:"∑", prod:"∏", int:"∫", partial:"∂", ldots:"…", ell:"ℓ", circ:"∘" }
function renderMath(tex, display) {
  const raw = tex.trim()
  let t = esc(raw)
  t = t.replace(/\\text\{([^{}]*)\}/g, "$1")
  t = t.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="rad">$1</span>')
  t = t.replace(/\^(\{([^{}]*)\}|([^\s&;]))/g, (m, g, braced, ch) => "<sup>" + (braced || ch || "") + "</sup>")
  t = t.replace(/_(\{([^{}]*)\}|([^\s&;]))/g, (m, g, braced, ch) => "<sub>" + (braced || ch || "") + "</sub>")
  t = t.replace(/\\([a-zA-Z]+)/g, (m, w) => GREEK[w] || m)
  if (display) t = t.replace(/\\\\/g, "<br>")
  const tag = display ? "math math-block" : "math"
  return '<span class="' + tag + '" data-tex="' + escAttr(raw) + '">' + t + "</span>"
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
}
const HL_FAM = { python:"py", py:"py", javascript:"js", js:"js", typescript:"js", ts:"js", jsx:"js", tsx:"js", c:"c", h:"c", cpp:"c", "c++":"c", java:"c", cs:"c", go:"go", rust:"rust", bash:"sh", sh:"sh", shell:"sh", zsh:"sh", sql:"sql", css:"css", scss:"css", yaml:"py", yml:"py", toml:"py", ini:"py" }
function hl(code, lang) {
  const L = (lang || "").toLowerCase()
  let s = esc(code)
  if (L === "diff") {
    return s.split("\n").map((l) => {
      if (/^\+/.test(l)) return '<span class="tok-s">' + l + "</span>"
      if (/^-/.test(l)) return '<span class="tok-n">' + l + "</span>"
      if (/^@/.test(l)) return '<span class="tok-f">' + l + "</span>"
      return '<span class="tok-c">' + l + "</span>"
    }).join("\n")
  }
  if (L === "json") {
    return s.replace(/(&quot;|")([^"&]*?)\1(\s*:)?|(-?\d[\d.]*)|\b(true|false|null)\b/g,
      (m, q, key, colon, num, lit) => {
        if (key !== undefined) return colon ? '<span class="tok-f">' + q + key + q + "</span>" + colon : '<span class="tok-s">' + m + "</span>"
        if (num) return '<span class="tok-n">' + num + "</span>"
        return '<span class="tok-k">' + lit + "</span>"
      })
  }
  if (L === "html" || L === "xml" || L === "vue" || L === "viz-html") {
    return s.replace(/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?)([a-zA-Z][\w-]*)|([\w-]+)(=)("[^"]*"|'[^']*')|(\/?&gt;)/g,
      (m, com, open, tag, attr, eq, val, close) => {
        if (com) return '<span class="tok-c">' + com + "</span>"
        if (tag) return open + '<span class="tok-k">' + tag + "</span>"
        if (attr) return '<span class="tok-f">' + attr + "</span>" + eq + '<span class="tok-s">' + val + "</span>"
        return '<span class="tok-k">' + close + "</span>"
      })
  }
  const fam = HL_FAM[L] || "c"
  const kw = (HL_KW[fam] || "").split(" ").filter(Boolean).join("|")
  const commentRe = (fam === "py" || fam === "sh") ? "#[^\\n]*" : (fam === "sql" ? "(?:--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)" : "(?://[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)")
  const re = new RegExp("(" + commentRe + ")|('(?:[^'\\\\\\n]|\\\\.)*'|\"(?:[^\"\\\\\\n]|\\\\.)*\"|`(?:[^`\\\\]|\\\\.)*`)|(\\b\\d[\\d_]*(?:\\.\\d+)?\\b)" + (kw ? "|\\b(" + kw + ")\\b" : ""), "g")
  return s.replace(re, (m, com, str, num, word) => {
    if (com) return '<span class="tok-c">' + com + "</span>"
    if (str) return '<span class="tok-s">' + str + "</span>"
    if (num) return '<span class="tok-n">' + num + "</span>"
    if (word) return '<span class="tok-k">' + word + "</span>"
    return m
  })
}
function vizHtml(code, height) {
  const h = Math.min(Math.max(parseInt(height, 10) || 360, 120), 1200)
  return '<iframe class="viz" sandbox="allow-scripts" loading="lazy" referrerpolicy="no-referrer" height="' + h + '" srcdoc="' + escAttr(code.replace(/^\n+|\n+$/g, "")) + '"></iframe>'
}
function renderText(src) {
  const stash = []
  const keep = (html) => {
    stash.push(html)
    return "\u0000" + (stash.length - 1) + "\u0000"
  }
  let s = String(src)
  s = s.replace(/```([^\n]*)\n([\s\S]*?)```/g, (m, info, code) => {
    const tok = (info || "").trim().split(/\s+/)[0] || ""
    const vm = tok.match(/^viz-html(?::(\d+))?$/i)
    if (vm) return keep(vizHtml(code, vm[1]))
    const lang = tok.toLowerCase()
    const label = esc(tok || "text")
    return keep('<pre data-lang="' + label + '"><code>' + hl(code.replace(/^\n+|\n+$/g, ""), lang) + "</code></pre>")
  })
  s = s.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => keep(renderMath(tex, true)))
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (m, tex) => keep(renderMath(tex, true)))
  s = s.replace(/`([^`\n]+)`/g, (m, code) => keep("<code>" + esc(code) + "</code>"))
  s = s.replace(/\\\((.+?)\\\)/g, (m, tex) => keep(renderMath(tex, false)))
  s = s.replace(/\$([^$\n]+?)\$/g, (m, tex) => keep(renderMath(tex, false)))
  s = esc(s)
  const inline = (x) => {
    const link = (label, url, icon) => keep('<a href="' + url + '" target="_blank" rel="noopener">' +
      (icon ? '<span class="licon">' + ICON_LINK + "</span>" : "") + label + "</a>")
    const nolink = (label) => keep('<a class="nolink">' + label + "</a>")
    const isHttp = (u) => /^(https?:\/\/)/.test(u)
    const isUncPath = (u) => u.slice(0, 2) === "\\\\" && u.length > 2 && !/\s/.test(u[2])
    const isFsPath = (u) => /^\/(?!\/)(?:mnt|home|tmp|etc|usr|var|opt)\//.test(u) ||
      /^[A-Za-z]:[\\/]/.test(u) || /^\.\.?(\/|$)/.test(u) ||
      /^~(\/|$)/.test(u) || isUncPath(u)
    const mkPathlink = (label, raw) => {
      const t = raw.match(/[.,;:!?]+$/)
      const core = t ? raw.slice(0, -t[0].length) : raw
      if (!core) return null
      return keep('<a class="pathlink" data-path="' + escAttr(core) + '">' +
        '<span class="plicon">' + ICON_FOLDER + "</span>" + label + "</a>") + (t ? t[0] : "")
    }
    const autolink = (m, pre, raw, scheme) => {
      const t = raw.match(/[.,;:!?]+$/)
      const core = t ? raw.slice(0, -t[0].length) : raw
      if (!core) return m
      const url = (scheme || "") + core
      return pre + keep('<a href="' + url + '" target="_blank" rel="noopener"><span class="licon">' +
        ICON_LINK + "</span>" + core + "</a>") + (t ? t[0] : "")
    }
    x = x.replace(/!\[([^\]]*)\]\((https?:[^)\s]+)\)/g, (m, alt, url) =>
      keep('<a href="' + url + '">' + alt + " (이미지)</a>"))
    const linkFor = (label, url) => {
      if (/^출처:/.test(label) && isHttp(url))
        return keep('<a class="srcchip" href="' + url + '" target="_blank" rel="noopener">' +
          '<span class="licon">' + ICON_LINK + "</span>" + label.replace(/^출처:\s*/, "") + "</a>")
      if (isHttp(url)) return link(label, url, true)
      if (/^(mailto:|#|\/\/)/.test(url)) return link(label, url, false)
      if (url && isFsPath(url)) {
        const pl = mkPathlink(label, url)
        if (pl) return pl
      }
      if (/^\/(?!\/)/.test(url)) return link(label, url, false)
      return nolink(label)
    }
    x = x.replace(/\[([^\]]+)\]\s*\(\s*&lt;((?:(?!&gt;)[^])*?)&gt;\s*\)/g, (m, label, url) => {
      if (!url || (!isHttp(url) && !isFsPath(url) && !/^(mailto:|#|\/\/)/.test(url))) return m
      return linkFor(label, url)
    })
    x = x.replace(/\[([^\]]+)\]\s*\(((?:[^()\s]|\([^()]*\))*)\)/g, (m, label, url) => linkFor(label, url))
    x = x.replace(/(^|[\s(>"'])((?:\/(?:mnt|home|tmp|etc|usr|var|opt)\/[^\s<>"')\]]+|[A-Za-z]:[\\/][^\s<>"')\]]+|~\/[^\s<>"')\]]+|\\\\[^\s<>"')\]]+))/g,
      (m, pre, raw) => {
        const pl = mkPathlink(raw, raw)
        return pl ? pre + pl : m
      })
    x = x.replace(/&lt;(https?:\/\/[^<>\s]+?)&gt;/g, (m, raw) => {
      const safe = raw.replace(/&(?!amp;|lt;|gt;|quot;)/g, "&amp;")
      return link(safe, safe, true)
    })
    x = x.replace(/(^|[\s(>"'])(https?:\/\/[^\s<>"')\]]+)/g, (m, pre, raw) => autolink(m, pre, raw, ""))
    x = x.replace(/(^|[\s(>"'])((?:www\.)[^\s<>"')\]]+)/g, (m, pre, raw) => autolink(m, pre, raw, "https://"))
    x = x.replace(/==([^=\n]+)==/g, "<mark>$1</mark>")
    x = x.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    x = x.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    return x
  }
  const cells = (l) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())
  const lines = s.split("\n")
  let out = "", para = [], list = null, table = null
  const flushPara = () => { if (para.length) { out += "<p>" + inline(para.join(" ")) + "</p>"
  para = []
  } }
  const flushList = () => {
    if (!list) return
    out += list.tag === "ul" ? "<ul>" : "<ol>"
    for (const it of list.items) {
      const tm = it.match(/^\[( |x|X)\]\s+(.*)/)
      if (tm) out += '<li class="task"><input type="checkbox" disabled' + (tm[1] === " " ? "" : " checked") + ">" + inline(tm[2]) + "</li>"
      else out += "<li>" + inline(it) + "</li>"
    }
    out += list.tag === "ul" ? "</ul>" : "</ol>"
    list = null
  }
  const flushTable = () => {
    if (!table) return
    out += '<div class="tblwrap"><table>'
    table.rows.forEach((r, i) => {
      out += "<tr>" + r.map((c) => (i === 0 ? "<th>" + inline(c) + "</th>" : "<td>" + inline(c) + "</td>")).join("") + "</tr>"
    })
    out += "</table></div>"
    table = null
  }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    let m
    if (/^\u0000\d+\u0000$/.test(l)) {
      flushPara()
      flushList()
      flushTable()
      out += stash[+l.slice(1, -1)] || ""
      continue
    }
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) {
      flushPara()
      flushList()
      flushTable()
      out += "<h" + m[1].length + ">" + inline(m[2]) + "</h" + m[1].length + ">"
      continue
    }
    if (/^---+\s*$/.test(l)) {
      flushPara()
      flushList()
      flushTable()
      out += "<hr>"
      continue
    }
    if ((m = l.match(/^&gt;\s?(.*)/))) {
      flushPara()
      flushList()
      flushTable()
      const cm = m[1].match(/^\[!(note|tip|info|todo|example|quote|warning|caution|danger)\]\s*(.*)/i)
      if (cm) out += '<div class="callout c-' + cm[1].toLowerCase() + '"><div class="callout-title">' + esc(cm[1].toUpperCase()) + "</div>" + inline(cm[2]) + "</div>"
      else out += "<blockquote>" + inline(m[1]) + "</blockquote>"
      continue
    }
    if (l.includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && /^\|?[\s:|-]+\|?$/.test(lines[i + 1])) {
      flushPara()
      flushList()
      table = { rows: [cells(l)] }
      i++
      continue
    }
    if (table && l.includes("|")) {
      table.rows.push(cells(l))
      continue
    }
    if (table) flushTable()
    if ((m = l.match(/^\s*[-*]\s+(.*)/))) {
      flushPara()
      if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; }
      list.items.push(m[1])
      continue
    }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) {
      flushPara()
      if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; }
      list.items.push(m[1])
      continue
    }
    if (/^\s*$/.test(l)) {
      flushPara()
      flushList()
      flushTable()
      continue
    }
    flushList()
    para.push(l.trim())
  }
  flushPara()
  flushList()
  flushTable()
  out = out.replace(/\u0000(\d+)\u0000/g, (m, n) => stash[+n] || "")
  return out
}
function tblCellMD(c) { return String(c == null ? "" : c).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim(); }
function tblToMD(rows) {
  const rs = (rows || []).map((r) => (r || []).map(tblCellMD))
  if (!rs.length) return ""
  const w = Math.max.apply(null, rs.map((r) => r.length).concat([1]))
  const norm = rs.map((r) => {
    const c = r.slice()
    while (c.length < w) c.push("")
    return c
  })
  return norm.map((r, i) => "| " + r.join(" | ") + " |" +
    (i === 0 ? "\n|" + r.map(() => " --- ").join("|") + "|" : "")).join("\n")
}
function tblToCSV(rows) {
  const q = (c) => {
    const s = String(c == null ? "" : c).replace(/\s+/g, " ").trim()
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return ((rows || []).map((r) => (r || []).map(q).join(","))).join("\n")
}
function routeId(path) {
  const m = String(path || "").match(/^\/([A-Za-z0-9][A-Za-z0-9-]*)\/?$/)
  return m ? m[1] : null
}
function goalFence(text, name) {
  const m = String(text).match(new RegExp("```goal[\\W_]*" + name + "[^\\n`{\\[]*\\n?([\\s\\S]*?)```", "i"))
  if (!m) return { clean: String(text), data: null }
  let data = null
  try { data = JSON.parse(m[1]); } catch (e) { data = null; }
  return { clean: String(text).replace(m[0], "").trim(), data }
}
function normGoalItems(data) {
  const arr = Array.isArray(data) ? data : (data && (data.items || data.subgoals)) || []
  return arr.map((x, i) => typeof x === "string" ? { t: x, done: false } :
    ({ t: String(x.t || x.title || x.name || ("단계 " + (i + 1))), done: !!x.done }))
}
function convToMd(c) {
  const lines = ["# " + (c.t || "대화"), ""]
  if (c.sid) lines.push("- 세션: " + String(c.sid).slice(0, 8), "")
  if (c.cwd) lines.push("- 작업 디렉터리: " + c.cwd, "");
  (c.msgs || []).forEach((m) => {
    let t = String(m.text || "")
    t = goalFence(t, "plan").clean
    t = goalFence(t, "status").clean
    t = t.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim()
    if (!t) return
    lines.push(m.who === "me" ? "## 사용자" : "## 어시스턴트", "")
    // timeStr is outside the test slice; guarded call (always present in browser)
    if (m.ts && typeof timeStr === "function") {
      const when = timeStr(m.ts)
      if (when) lines.push("_" + when + "_", "")
    }
    lines.push(t, "")
  })
  return lines.join("\n").trim() + "\n"
}
function truncStr(s, n) {
  s = String(s == null ? "" : s)
  return s.length > n ? s.slice(0, n) + "…" : s
}
function thoughtKind(taskKind, operation) {
  const k = String(taskKind || operation || "").toLowerCase()
  if (!k) return "system"
  if (k.indexOf("model.") === 0) return "reason"
  if (k.indexOf("reminder") !== -1) return "system"
  if (k.indexOf("tool:") === 0 || k.indexOf("tool.") === 0) {
    const n = k.replace(/^tool[:.]/, "")
    if (/bash|shell|exec|terminal|command|process|run/.test(n)) return "terminal"
    if (/search|web|fetch|query|browser|http/.test(n)) return "web"
    if (/read|write|edit|file|apply|patch/.test(n)) return "file"
    return "tool"
  }
  return "system"
}
function diffLineClass(ln) {
  if (/^@@/.test(ln)) return "td-hunk";
  if (/^\+\+\+/.test(ln) || /^---/.test(ln) || /^diff --git/.test(ln) || /^index /.test(ln) || /^Binary /.test(ln)) return "td-meta";
  if (/^\+/.test(ln)) return "td-add";
  if (/^-/.test(ln)) return "td-del";
  return "";
}
function isDiffText(s) {
  s = String(s == null ? "" : s);
  return /^diff --git/m.test(s) || /^@@ /m.test(s);
}
function diffLinesHtml(s) {
  return String(s == null ? "" : s).slice(0, 3000).split("\n").map((ln) => {
    const c = diffLineClass(ln);
    return c ? '<span class="' + c + '">' + esc(ln) + "</span>" : esc(ln);
  }).join("\n");
}
function timeStr(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0")
}
function addMsg(who, text, think, foot, withActs, extra) {
  const d = document.createElement("div")
  d.className = "msg " + who
  d.dataset.raw = text
  d.dataset.mi = chat.querySelectorAll(".msg").length
  let html = ((extra && extra.thoughts && extra.thoughts.length) ? renderThoughtsStatic(extra.thoughts) : "") +
    renderText(text) + (think ? "<details><summary>상세</summary>" + esc(think) + "</details>" : "")
  if (withActs === undefined) withActs = true
  if (who === "ai") {
    chat.querySelectorAll('.msg.ai [data-retry]').forEach((b) => b.remove())
    if (withActs) html += '<div class="acts"><button type="button" data-retry title="재시도 (마지막 질문을 새 세션으로 분기)">' + ICON_RETRY + '</button><button type="button" data-copy title="복사">' + ICON_COPY + "</button></div>"
  }
  else html += '<div class="acts"><button type="button" data-retry title="재시도 (이 메시지부터 새 세션으로 분기)">' + ICON_RETRY + '</button><button type="button" data-copy title="복사">' + ICON_COPY + '</button><button type="button" data-edit title="수정 후 다시 전송">✎</button></div>'
  if (foot) html += '<div class="meta">' + esc(foot) + "</div>"
  if (who === "me" && text.length >= 200) {
    d.classList.add("folded")
    const ai = html.indexOf('<div class="acts">')
    const content = ai >= 0 ? html.slice(0, ai) : html
    const rest = ai >= 0 ? html.slice(ai) : ""
    html = '<div class="mfold">' + content + '<div class="foldfade"></div></div>' + rest +
      '<button type="button" class="foldbtn" data-fold title="펼치기/접기">' + ICON_CHEVD + "</button>"
  }
  d.innerHTML = html
  decorateCode(d)
  decorateMath(d)
  decorateTables(d)
  decoratePaths(d)
  chat.appendChild(d)
  chat.scrollTop = chat.scrollHeight
  return d
}
function resolveLinkPath(p) {
  p = (p || "").trim()
  if (!p) return ""
  if (/^[A-Za-z]:[\\/]/.test(p) || p[0] === "/" || p[0] === "~" || p.startsWith("\\\\")) return p
  const base = ((curConv() && curConv().cwd) || serverCwd || "").replace(/\/+$/, "")
  if (p.startsWith("./")) p = p.slice(2)
  return base ? base + "/" + p : p
}
function decoratePaths(root) {
  root.querySelectorAll("a.pathlink:not([data-done])").forEach((a) => {
    a.dataset.done = "1"
    const abs = resolveLinkPath(a.dataset.path)
    if (!abs) return
    a.dataset.abs = abs
    a.title = abs
  })
}
async function openPathLink(a) {
  const abs = a.dataset.abs || resolveLinkPath(a.dataset.path)
  if (!abs) return
  try {
    const r = await fetch("/api/open-folder", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: abs }) })
    const j = await r.json()
    if (!j.ok) alert("열기 실패: " + (j.error || abs))
  } catch (e) {
    alert("열기 실패: " + abs)
  }
}
function decorateMath(el) {
  el.querySelectorAll(".math[data-tex]").forEach((m) => {
    if (m.querySelector("[data-mathcopy]")) return
    const b = document.createElement("button")
    b.type = "button"
    b.setAttribute("data-mathcopy", "")
    b.title = "수식 복사"
    b.innerHTML = ICON_COPY
    b.onclick = async (e) => {
      e.stopPropagation()
      flashCopy(b, m.dataset.tex || "")
    }
    m.appendChild(b)
  })
}
function decorateCode(el) {
  el.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector("[data-codecopy]")) return
    const code = pre.querySelector("code")
    if (!code) return
    const b = document.createElement("button")
    b.type = "button"
    b.setAttribute("data-codecopy", "")
    b.title = "복사"
    b.innerHTML = ICON_COPY
    b.onclick = async (e) => {
      e.stopPropagation()
      flashCopy(b, code.textContent)
    }
    pre.prepend(b)
  })
}
function decorateTables(el) {
  el.querySelectorAll(".tblwrap").forEach((w) => {
    const tbl = w.querySelector("table")
    if (!tbl || w.querySelector("[data-tblcopy]")) return
    const rows = [...tbl.rows].map((tr) =>
      [...tr.cells].map((td) => td.textContent))
    const b = document.createElement("button")
    b.type = "button"
    b.setAttribute("data-tblcopy", "")
    b.title = "표 복사"
    b.innerHTML = ICON_COPY
    const menu = document.createElement("div")
    menu.className = "tblmenu"
    menu.hidden = true;
    [["md", "마크다운"], ["csv", "CSV"]].forEach(([fmt, label]) => {
      const o = document.createElement("button")
      o.type = "button"
      o.textContent = label
      o.onclick = async (e) => {
        e.stopPropagation()
        menu.hidden = true
        flashCopy(b, fmt === "md" ? tblToMD(rows) : tblToCSV(rows))
      }
      menu.appendChild(o)
    })
    b.onclick = (e) => {
      e.stopPropagation()
      document.querySelectorAll(".tblmenu").forEach((m) => {
        if (m !== menu) m.hidden = true
      })
      menu.hidden = !menu.hidden
    }
    const box = document.createElement("div")
    box.className = "tblcopy"
    box.append(b, menu)
    w.appendChild(box)
  })
}
let editingEl = null
let pendingPrefix = null
let skipEcho = false
let activeStreamAbort = null
let sendBusy = false
function paintSendTitle() {
  const btn = document.querySelector("#f button[type=submit]")
  if (!btn) return
  if (sendBusy) {
    btn.title = t("send.stopTitle")
    btn.setAttribute("aria-label", t("send.stop"))
  } else {
    btn.title = t("send.title")
    btn.setAttribute("aria-label", t("send.send"))
  }
}
function setSendStop(on) {
  sendBusy = !!on
  const btn = document.querySelector("#f button[type=submit]")
  if (!btn) return
  if (on) {
    if (btn.dataset.orig === undefined) btn.dataset.orig = btn.innerHTML
    btn.innerHTML = "■"
  } else if (btn.dataset.orig !== undefined) {
    btn.innerHTML = btn.dataset.orig
    delete btn.dataset.orig
  }
  paintSendTitle()
}
function startEdit(msgEl) {
  if (!msgEl) return
  if (editingEl && editingEl !== msgEl) cancelEdit(editingEl)
  if (editingEl === msgEl) return
  const old = msgEl.dataset.raw || ""
  msgEl.dataset.orig = msgEl.innerHTML
  msgEl.innerHTML = '<textarea class="medit">' + esc(old) + "</textarea>" +
    '<div class="meditbar"><button type="button" class="optbtn" data-msave>저장</button>' +
    '<button type="button" class="optbtn" data-mcancel>취소</button></div>'
  const ta = msgEl.querySelector(".medit")
  if (ta) {
    ta.focus()
    try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
  }
  editingEl = msgEl
}
function cancelEdit(msgEl) {
  if (!msgEl) return
  if (msgEl.dataset.orig !== undefined) {
    msgEl.innerHTML = msgEl.dataset.orig
    delete msgEl.dataset.orig
    decorateCode(msgEl)
    decorateMath(msgEl)
    decorateTables(msgEl)
  }
  if (editingEl === msgEl) editingEl = null
}
function finishEdit(msgEl, save) {
  if (editingEl === msgEl) editingEl = null
  if (!save) {
    cancelEdit(msgEl)
    return
  }
  const ta = msgEl.querySelector(".medit")
  const next = ta ? ta.value.trim() : ""
  const old = msgEl.dataset.raw || ""
  const mi = +(msgEl.dataset.mi ?? -1)
  if (!next || next === old) {
    cancelEdit(msgEl)
    return
  }
  const c = curConv()
  if (!c || !(mi >= 0) || !c.msgs[mi] || c.msgs[mi].who !== "me") {
    cancelEdit(msgEl)
    return
  }
  saveEditedMessage(msgEl, mi, next)
}
async function saveEditedMessage(msgEl, mi, newText) {
  const c = curConv()
  if (!c || !c.msgs[mi] || c.msgs[mi].who !== "me") {
    cancelEdit(msgEl)
    return
  }
  branchFromMessage(c, mi, newText)
}
async function branchFromMessage(c, mi, newText) {
  const oldSid = c.sid || sessionId
  c.msgs[mi] = { who: "me", text: newText, ts: Date.now(), el: "" }
  c.msgs.length = mi + 1
  c.sid = null
  sessionId = null
  c.at = Date.now()
  persistConvs()
  if (oldSid) {
    try {
      await fetch("/api/session/archive", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: oldSid, cwd: c.cwd || serverCwd || "" }) })
    } catch (e) {}
  }
  pendingPrefix = "[이전 대화 계승] 아래는 같은 대화의 지금까지 내역이다. 이를 이어서 다음 요청을 처리하라.\n\n" +
    convToMd(c) + "\n위 내역을 이어서 처리하라.\n\n"
  skipEcho = true
  editingEl = null
  chat.innerHTML = ""
  c.msgs.forEach((m) => addMsg(m.who, m.text, null, footFor(m), undefined, m.th ? { thoughts: m.th } : null))
  chat.scrollTop = chat.scrollHeight
  setRoute("/" + c.k)
  input.value = newText
  input.focus()
  updateGate()
  drawConvs()
  drawRside()
  $("#f").requestSubmit()
}
function exportConv(c) {
  if (!c || !c.msgs || !c.msgs.length) {
    alert("내보낼 대화가 없습니다.")
    return
  }
  const body = convToMd(c)
  const name = "muse-gui-" + String(c.t || "대화").replace(/[^\w가-힣-]+/g, "_").slice(0, 40) +
    "-" + new Date().toISOString().slice(0, 10) + ".md"
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(a.href)
    a.remove()
  }, 1000)
}
function footFor(m) {
  const t = timeStr(m.ts)
  if (!t && !m.el) return ""
  return t + (m.el ? " · " + m.el + "초" : "")
}
function lastAiText() {
  const nodes = chat.querySelectorAll(".msg.ai")
  if (!nodes.length) return ""
  return nodes[nodes.length - 1].dataset.raw || ""
}
const ICON_COPY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
const ICON_RETRY = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>'
const STR = {
  ko: {
    "lobby.sub": "WSL의 muse 에이전트와 대화하세요",
    "input.ph": "메시지 입력 (Enter 줄바꿈, / 자동완성)",
    "send.hintTitle": "Ctrl+Enter로 전송",
    "send.title": "전송 (Ctrl+Enter)",
    "send.send": "전송",
    "send.stopTitle": "중단 (클릭)",
    "send.stop": "중단",
    "foot.model": "모델",
    "foot.effort": "effort",
    "plus.title": "기능 추가",
    "yolo.warn": "사용자 승인 절차 제거 및 샌드박스 격리 해제(작업 디렉터리 바깥 전역 접근 가능).",
    "settings.language": "언어",
    "gate.pickNew": "새 대화를 시작하려면 작업 디렉터리를 먼저 선택하세요.",
    "gate.pickBtn": "작업 디렉터리 선택",
    "gate.pick": "이 대화의 작업 디렉터리를 선택해야 입력할 수 있습니다.",
    "gate.resumePre": "세션 ",
    "gate.resumePost": " — 이 디렉터리에서 내부 프로세스로 이어가려면 버튼을 누르세요.",
    "gate.resumeBtn": "이 세션 이어가기(내부 프로세스 재개)",
    "rside.empty": "열린 탭이 없습니다",
    "rside.emptyHint": "/goal · /help 로 탭을 여세요",
    "cwd.label": "작업 경로",
    "goal.emptyHtml": "진행 중인 목표가 없습니다.<br><code>/goal 목표 내용</code> 으로 시작하세요.",
    "chip.struct": "이 폴더 구조 설명해줘",
    "chip.viz": "viz-html 예시 보여줘",
  },
  en: {
    "lobby.sub": "Chat with the muse agent on WSL",
    "input.ph": "Type a message (Enter newline, / autocomplete)",
    "send.hintTitle": "Send with Ctrl+Enter",
    "send.title": "Send (Ctrl+Enter)",
    "send.send": "Send",
    "send.stopTitle": "Stop (click)",
    "send.stop": "Stop",
    "foot.model": "model",
    "foot.effort": "effort",
    "plus.title": "Add features",
    "yolo.warn": "Removes user approval and sandbox isolation (global access outside the work directory possible).",
    "settings.language": "Language",
    "gate.pickNew": "Select a working directory to start a new chat.",
    "gate.pickBtn": "Select directory",
    "gate.pick": "Select this conversation's working directory to type here.",
    "gate.resumePre": "Session ",
    "gate.resumePost": " — press the button to resume it in-process here.",
    "gate.resumeBtn": "Resume session (in-process)",
    "rside.empty": "No open tabs",
    "rside.emptyHint": "Open tabs with /goal · /help",
    "cwd.label": "Work dir",
    "goal.emptyHtml": "No active goal.<br>Start with <code>/goal your goal</code>.",
    "chip.struct": "Explain this folder structure",
    "chip.viz": "Show a viz-html example",
  }
}
let langCur = "ko"
function t(k) {
  const d = STR[langCur] || {}
  if (d[k] !== undefined) return d[k]
  const ko = STR.ko || {}
  return ko[k] !== undefined ? ko[k] : k
}
function setText(sel, s) {
  const el = document.querySelector(sel)
  if (el) el.textContent = s
}
function applyLang(l, save) {
  if (l !== "ko" && l !== "en") l = "ko"
  langCur = l
  if (save !== false) {
    try { saveTheme({ lang: l }) } catch (e) {}
  }
  setText("#lobbysub", t("lobby.sub"))
  const inp = $("#in")
  if (inp) inp.placeholder = t("input.ph")
  const hint = $("#sendhint")
  if (hint) hint.title = t("send.hintTitle")
  paintSendTitle()
  setText("#lab-model", t("foot.model"))
  setText("#lab-effort", t("foot.effort"))
  const plus = $("#plus")
  if (plus) { plus.title = t("plus.title"); plus.setAttribute("aria-label", t("plus.title")) }
  setText("#cwdlabel", t("cwd.label"))
  setText("#rsideempty1", t("rside.empty"))
  setText("#rsideempty2", t("rside.emptyHint"))
  setText("#langhead", t("settings.language"))
  document.querySelectorAll("#langrow [data-lang]").forEach((b) => {
    b.classList.toggle("sel", b.dataset.lang === langCur)
  })
  paintYolo()
  renderChips()
  updateGate()
  drawRside()
}
const ICON_CHEVD = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
const ICON_CHEVU = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>'
const ICON_SIDEL = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>'
const ICON_SIDER = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'
const ICON_TERM = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>'
const ICON_TWEB = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
const ICON_TREASON = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c.7 5.5 4.5 9.3 9.5 10-5 .7-8.8 4.5-9.5 10-.7-5.5-4.5-9.3-9.5-10 5-.7 8.8-4.5 9.5-10z"/></svg>'
const ICON_TFILE = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
const ICON_TSYS = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>'
function applySide(hidden) {
  document.body.classList.toggle("side-hidden", !!hidden)
  const t = $("#sidetoggle")
  if (!t) return
  if (hidden) {
    document.querySelector("main header").prepend(t)
    t.innerHTML = ICON_SIDER
    t.title = "사이드바 펼치기"
    t.setAttribute("aria-label", "사이드바 펼치기")
  } else {
    const head = $("#sidehead")
    if (head) head.appendChild(t)
    t.innerHTML = ICON_SIDEL
    t.title = "사이드바 접기"
    t.setAttribute("aria-label", "사이드바 접기")
  }
}
function setSide(hidden) { applySide(hidden); saveTheme({ side: !!hidden }); }
async function copyText(t) {
  if (!t) return false
  try {
    await navigator.clipboard.writeText(t)
    return true
  }
  catch (e) {
    const ta = document.createElement("textarea")
    ta.value = t
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand("copy")
      return true
    }
    catch (_) {
      return false
    }
    finally {
      ta.remove()
    }
  }
}
async function flashCopy(btn, text) {
  const old = btn.innerHTML
  btn.innerHTML = (await copyText(text)) ? "✓" : "✗"
  setTimeout(() => {
    btn.innerHTML = old
  }, 1200)
}
const THOUGHT_LABEL = { reason: "추론", terminal: "터미널 명령", web: "웹 검색", file: "파일 작업", system: "시스템", tool: "도구" }
function thoughtIcon(type) {
  return { reason: ICON_TREASON, terminal: ICON_TERM, web: ICON_TWEB, file: ICON_TFILE, system: ICON_TSYS, tool: ICON_TSYS }[type] || ICON_TSYS
}
function setRowSummary(r, text) {
  const s = truncStr(text, 140) || "작업 중…"
  r.sum.textContent = s
  r.el.dataset.sum = s
}
function ensureThoughtRow(tbox, tstate, tid, type, summary) {
  let r = tstate.rows.get(tid)
  if (r) return r
  const row = document.createElement("div")
  row.className = "trow t-" + type
  row.dataset.task = tid
  row.dataset.type = type
  const ic = document.createElement("span")
  ic.className = "ticon"
  ic.innerHTML = thoughtIcon(type)
  const lab = document.createElement("span")
  lab.className = "ttype"
  lab.textContent = THOUGHT_LABEL[type] || "작업"
  const spin = document.createElement("span")
  spin.className = "tspin"
  const sum = document.createElement("span")
  sum.className = "tsum"
  const btn = document.createElement("button")
  btn.type = "button"
  btn.className = "ttoggle"
  btn.title = "펼치기/접기"
  btn.textContent = "›"
  btn.setAttribute("data-ttoggle", "")
  btn.hidden = true
  row.append(ic, lab, spin, sum, btn)
  const det = document.createElement("div")
  det.className = "tdetail"
  det.hidden = true;
  (tstate.body || tbox).append(row, det)
  r = { el: row, det, sum, tgl: btn, type, idem: null, done: false }
  tstate.rows.set(tid, r)
  if (tstate.headTgl) tstate.headTgl.hidden = false
  setRowSummary(r, summary)
  updateThoughtHead(tstate)
  return r
}
function syncThoughtHead(tbox) {
  const st = tbox && tbox._tstate
  if (!st || !st.headSum) return
  st.headSum.textContent = truncStr(st.last || "준비 중…", 140)
  let d = 0, m = 0
  st.rows.forEach((r) => {
    m++
    if (r.done) d++
  })
  if (st.headSpin) st.headSpin.style.display = (m > 0 && d >= m) ? "none" : ""
}
function updateThoughtHead(tstate) {
  if (tstate && tstate.tbox) syncThoughtHead(tstate.tbox)
}
function addThoughtLog(r, head, body) {
  const det = r.det
  while (det.children.length >= 60) det.removeChild(det.firstChild)
  const sub = document.createElement("div")
  sub.className = "tsub tsub-" + (r.type || "tool")
  const hb = document.createElement("button")
  hb.type = "button"
  hb.className = "tsubhead"
  hb.setAttribute("data-ttoggle", "")
  hb.title = "펼치기/접기"
  const hs = document.createElement("span")
  hs.className = "tsum"
  hs.textContent = truncStr(head, 80) || "로그"
  const tg = document.createElement("span")
  tg.className = "ttoggle"
  tg.textContent = "›"
  hb.append(hs, tg)
  const bd = document.createElement("div")
  bd.className = "tsubbody"
  bd.hidden = true
  const pre = document.createElement("div")
  pre.className = "tlog"
  const txt = String(body == null ? "" : body).slice(0, 10000)
  if (r.type === "file" && isDiffText(txt)) pre.innerHTML = diffLinesHtml(txt);
  else pre.textContent = txt;
  bd.appendChild(pre)
  sub.append(hb, bd)
  det.appendChild(sub)
  if (r.tgl) r.tgl.hidden = false
}
function markThoughtDone(r) {
  if (!r || r.done) return
  r.done = true
  r.el.classList.add("done")
}
function updateThought(tbox, tstate, ev) {
  const p = (ev && ev.payload) || {}
  const kind = p.kind
  if (kind === "run_output_delta") {
    if (p.text) tstate.texts.push(p.text)
    return
  }
  if (kind === "task_stream_linked") return
  if (kind === "tool_result") {
    const cid = p.call_id
    if (!cid) return
    const facts = p.correlation_facts || {}
    const oc = facts.outcome || ""
    tstate.rows.forEach((r) => {
      if (!r.idem || r.idem.indexOf(cid) < 0) return
      if (oc && oc !== "success") setRowSummary(r, (r.el.dataset.sum || "") + " · 실패")
      const head = "tool_result" + (oc ? " · " + oc : "")
      const raw = ((facts.tool_name ? "[" + facts.tool_name + "] " : "") + (p.text || "")).slice(0, 10000) || head
      addThoughtLog(r, head, raw)
      tstate.last = head
    })
    updateThoughtHead(tstate)
    return
  }
  if (kind !== "task_lifecycle") return
  const te = p.event || {}
  const tid = p.task_id || te.task_id
  if (!tid) return
  const ek = te.kind
  if (ek === "proposed") {
    const tk = te.task_kind || ""
    const r0 = ensureThoughtRow(tbox, tstate, tid, thoughtKind(tk, ""), tk || "작업")
    addThoughtLog(r0, "proposed" + (tk ? " · " + tk : ""), tk || "proposed")
    tstate.last = tk || "proposed"
    updateThoughtHead(tstate)
    return
  }
  let r = tstate.rows.get(tid)
  if (!r) r = ensureThoughtRow(tbox, tstate, tid, thoughtKind("", te.operation || ""), te.operation || "작업")
  if (ek === "accepted" || ek === "scheduled" || ek === "started") {
    const extra = ek === "scheduled" ? te.idempotency_key : te.span_id
    addThoughtLog(r, ek, extra ? ek + "\n" + extra : ek)
    updateThoughtHead(tstate)
    return
  }
  if (ek === "side_effect_intent") {
    if (te.idempotency_key) r.idem = te.idempotency_key
    const op = te.operation || "side_effect_intent"
    setRowSummary(r, op)
    tstate.last = op
    addThoughtLog(r, op, [op,
      te.idempotency_key ? "idempotency: " + te.idempotency_key : "",
      te.policy_decision ? "policy: " + te.policy_decision : ""].filter(Boolean).join("\n") || op)
    updateThoughtHead(tstate)
    return
  }
  if (ek === "status" && te.message) {
    setRowSummary(r, te.message)
    tstate.last = te.message
    const det = te.details || {}
    const raw = Object.keys(det).length ? te.message + "\n" + JSON.stringify(det) : te.message
    addThoughtLog(r, te.message, raw)
    updateThoughtHead(tstate)
    return
  }
  if (ek === "output" && typeof te.chunk === "string") {
    let sum = null
    try {
      const o = JSON.parse(te.chunk)
      if (o && typeof o === "object") {
        const cmd = o.command || o.tool || ""
        const desc = o.description || o.desc || ""
        sum = (desc || cmd || "출력") +
          (o.exit_code !== undefined && o.exit_code !== null ? " · 종료 " + o.exit_code : "")
      }
    } catch (e) {}
    if (sum) setRowSummary(r, sum)
    tstate.last = sum || "출력"
    addThoughtLog(r, sum || "output", te.chunk)
    updateThoughtHead(tstate)
    return
  }
  if (ek === "completed" || ek === "settled") {
    addThoughtLog(r, ek, ek)
    tstate.last = ek
    markThoughtDone(r)
    updateThoughtHead(tstate)
  }
}
function collectThoughts(tbox) {
  const out = []
  tbox.querySelectorAll(".trow").forEach((r) => {
    const th = { k: r.dataset.type || "tool", s: r.dataset.sum || "" }
    const det = r.nextElementSibling
    if (det && det.classList && det.classList.contains("tdetail")) {
      const subs = []
      det.querySelectorAll(".tsub").forEach((sub) => {
        if (subs.length >= 20) return
        const h = sub.querySelector(".tsubhead .tsum")
        const b = sub.querySelector(".tsubbody .tlog")
        subs.push({ h: (h ? h.textContent : "").slice(0, 80), b: (b ? b.textContent : "").slice(0, 1000) })
      })
      if (subs.length) th.d = subs
    }
    out.push(th)
  })
  return out.length ? out : null
}
function markThoughtsDone(tbox) {
  tbox.querySelectorAll(".trow").forEach((r) => r.classList.add("done"))
  const st = tbox._tstate
  if (!st || !st.rows) return
  st.rows.forEach((r) => {
    r.done = true
  })
  if (st.rows.size === 0 && st.headSum) {
    st.headSum.textContent = "별도 추론 과정 없음"
    if (st.headSpin) st.headSpin.style.display = "none"
  }
}
function renderThoughtsStatic(thoughts) {
  const items = thoughts || []
  if (!items.length) return ""
  let rows = ""
  items.forEach((t) => {
    const lab = t.k || "tool"
    const subs = Array.isArray(t.d) ? t.d : []
    let det = ""
    if (subs.length) {
      let sh = ""
      subs.forEach((s) => {
        const bt = String(s.b || "")
        const bh = (t.k === "file" && isDiffText(bt)) ? diffLinesHtml(bt) : esc(bt)
        sh += '<div class="tsub tsub-' + esc(String(t.k || "tool")) + '"><button type="button" class="tsubhead" data-ttoggle title="펼치기/접기">' +
          '<span class="tsum">' + esc(s.h || "로그") + '</span><span class="ttoggle">›</span></button>' +
          '<div class="tsubbody" hidden><div class="tlog">' + bh + "</div></div></div>"
      })
      det = '<div class="tdetail" hidden>' + sh + "</div>"
    }
    rows += '<div class="trow t-' + esc(String(t.k || "tool")) + ' done">' +
      '<span class="ticon">' + thoughtIcon(t.k) + "</span>" +
      '<span class="ttype">' + esc(lab) + "</span>" +
      '<span class="tspin"></span><span class="tsum">' + esc(t.s || "") + "</span>" +
      (subs.length ? '<button type="button" class="ttoggle" data-ttoggle title="펼치기/접기">›</button>' : "") +
      "</div>" + det
  })
  const last = items[items.length - 1].s || "완료"
  return '<div class="thoughts static"><div class="thead">' +
    '<span class="ttype">통합</span>' +
    '<span class="tsum">' + esc(truncStr(last, 140)) + "</span>" +
    '<button type="button" class="ttoggle" data-ttoggle title="펼치기/접기">›</button></div>' +
    '<div class="tbody" hidden>' + rows + "</div></div>"
}
function toggleThoughtDetail(tg) {
  let det = null, mark = tg
  const sub = tg.closest(".tsubhead")
  if (sub) {
    det = sub.nextElementSibling
    mark = sub.querySelector(".ttoggle")
  } else {
    const host = tg.closest(".trow, .thead")
    if (host) det = host.nextElementSibling
  }
  if (!det || !(det.classList.contains("tsubbody") || det.classList.contains("tdetail") || det.classList.contains("tbody"))) return
  det.hidden = !det.hidden
  if (mark) mark.classList.toggle("open", !det.hidden)
  const box = tg.closest(".thoughts")
  if (box) syncThoughtHead(box)
}
chat.addEventListener("click", async (e) => {
  const tgl = e.target.closest("[data-ttoggle]")
  if (tgl) {
    toggleThoughtDetail(tgl)
    return
  }
  const fb = e.target.closest("[data-fold]")
  if (fb) {
    const m = fb.closest(".msg")
    const open = m.classList.toggle("open")
    fb.innerHTML = open ? ICON_CHEVU : ICON_CHEVD
    return
  }
  const ed = e.target.closest("[data-edit]")
  if (ed) {
    const msgEl = ed.closest(".msg")
    if (msgEl) startEdit(msgEl)
    return
  }
  const ms = e.target.closest("[data-msave]")
  if (ms) {
    const m2 = ms.closest(".msg")
    if (m2) finishEdit(m2, true)
    return
  }
  const mc = e.target.closest("[data-mcancel]")
  if (mc) {
    const m2 = mc.closest(".msg")
    if (m2) finishEdit(m2, false)
    return
  }
  const rt = e.target.closest("[data-retry]")
  if (rt) {
    const msgEl = rt.closest(".msg")
    if (msgEl) {
      const mi = +(msgEl.dataset.mi ?? -1)
      const c = curConv()
      if (c && mi >= 0) {
        if (editingEl) cancelEdit(editingEl)
        if (c.msgs[mi] && c.msgs[mi].who === "me") {
          branchFromMessage(c, mi, c.msgs[mi].text)
        } else if (msgEl.classList.contains("ai")) {
          let qi = -1
          for (let q = Math.min(mi, c.msgs.length - 1); q >= 0; q--) {
            if (c.msgs[q] && c.msgs[q].who === "me") {
              qi = q
              break
            }
          }
          if (qi >= 0) branchFromMessage(c, qi, c.msgs[qi].text)
        }
      }
    }
    return
  }
  const pl = e.target.closest("[data-path]")
  if (pl) {
    e.preventDefault()
    openPathLink(pl)
    return
  }
  const b = e.target.closest("[data-copy]")
  if (!b) return
  flashCopy(b, b.closest(".msg").dataset.raw || "")
})
function curConv() {
  return convs.find((c) => c.k === convKey) || null
}
let serverCwd = ""
function setRoute(p) {
  try { history.replaceState(null, "", p); } catch (e) {}
}
function saveConv(title) {
  convKey = convKey || ("c" + Date.now())
  const ex = curConv()
  if (ex) {
    if (title) ex.t = title
  }
  else convs.unshift({ k: convKey, t: title || "새 대화", sid: null, cwd: serverCwd, msgs: [], at: Date.now() })
  persistConvs()
  drawConvs()
}
function saveMsg(who, text, meta) {
  const c = curConv()
  if (!c) return
  c.msgs.push({ who, text, ts: (meta && meta.ts) || Date.now(), el: (meta && meta.el) || "", th: (meta && meta.th) || null })
  if (c.msgs.length > MAX_MSGS) c.msgs.splice(0, c.msgs.length - MAX_MSGS)
  if (sessionId) c.sid = sessionId
  c.at = Date.now()
  persistConvs()
}
let liveSessions = [];
// resume-consented convs (kept across tab switches, latest N)
function keepN() {
  const n = +((loadTheme().keepN ?? 3))
  return Math.min(5, Math.max(1, n || 3))
}
function touchLive() {
  if (!convKey) return
  liveSessions = [convKey, ...liveSessions.filter((x) => x !== convKey)].slice(0, keepN())
}
function inputGated() {
  const c = curConv()
  if (!c) return { msg: t("gate.pickNew"), btn: t("gate.pickBtn"), act: "pick-new" }
  if (!c.cwd) return { msg: t("gate.pick"), btn: t("gate.pickBtn"), act: "pick" }
  if (c.sid && !liveSessions.includes(c.k)) return { msg: t("gate.resumePre") + c.sid.slice(0, 8) + " · " + c.cwd + t("gate.resumePost"), btn: t("gate.resumeBtn"), act: "resume" }
  return null
}
let serverPlatform = ""
function updateGate() {
  const g = inputGated()
  $("#inputgate").hidden = !g
  if (!g) return
  $("#inputgate").classList.toggle("soft", g.act !== "resume")
  $("#gatemsg").textContent = g.msg
  $("#gatebtn").textContent = g.btn
  $("#gatebtn").dataset.act = g.act
  $("#gateenv").innerHTML = (g.act === "resume" || !serverPlatform) ? "" :
    '<span class="oschip">' + esc(serverPlatform) + "</span><span>" + esc(serverCwd || "") + "</span>"
}
function updateOsChip() {
  const c = $("#oschip")
  if (serverPlatform) {
    c.hidden = false
    c.textContent = serverPlatform
  }
  else c.hidden = true
}
let scrollSaveT = null
function saveScroll() {
  const c = curConv()
  if (!c) return
  c.scroll = chat.scrollTop
  persistConvs()
}
function openConv(k) {
  const c = convs.find((x) => x.k === k)
  if (!c) return
  saveScroll()
  convKey = c.k
  sessionId = c.sid || null
  $("#cwd").textContent = c.cwd || serverCwd || ""
  chat.innerHTML = ""
  c.msgs.forEach((m) => addMsg(m.who, m.text, null, footFor(m), undefined, m.th ? { thoughts: m.th } : null))
  chat.scrollTop = (typeof c.scroll === "number") ? c.scroll : chat.scrollHeight
  setRoute("/" + (c.sid || c.k))
  drawConvs()
  updateGate()
  drawRside()
}
let fsCb = null, fsCur = "", fsParent = null, fsEntries = []
async function openFsPicker(cb) {
  fsCb = cb
  $("#fsfilter").value = ""
  $("#fsovl").hidden = false
  let start = serverCwd || "/"
  try {
    const r = await fetch("/api/fs/roots")
    const j = await r.json()
    renderRoots(j.roots || [])
    const c = (j.roots || []).find((x) => x.path === "/mnt/c")
    if (c) start = c.path
  } catch (e) {}
  fsLoad(start)
}
function hideFsPicker() {
  $("#fsovl").hidden = true
  fsCb = null
}
function renderRoots(roots) {
  const box = $("#fsroots")
  box.innerHTML = ""
  roots.forEach((rt) => {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "optbtn"
    b.textContent = rt.label
    b.title = rt.path
    b.onclick = () => fsLoad(rt.path)
    box.appendChild(b)
  })
}
async function fsLoad(p) {
  const box = $("#fslist")
  box.innerHTML = '<div class="fempty">불러오는 중…</div>'
  try {
    const r = await fetch("/api/fs/list?path=" + encodeURIComponent(p))
    if (r.status === 404) {
      box.innerHTML = '<div class="fempty">서버가 구버전입니다. muse-gui를 다시 시작하세요.</div>'
      return
    }
    const j = await r.json()
    if (!j.ok) {
      box.innerHTML = '<div class="fempty">' + esc(j.error || "읽기 실패") + "</div>"
      return
    }
    fsCur = j.path
    fsParent = j.parent
    fsEntries = j.entries || []
    $("#fssel").textContent = fsCur
    $("#fspath").value = fsCur
    renderFsCrumbs(fsCur)
    renderFsList()
  } catch (e) {
    box.innerHTML = '<div class="fempty">서버 연결 실패</div>'
  }
}
function renderFsCrumbs(path) {
  const box = $("#fscrumbs")
  box.innerHTML = ""
  const mk = (label, target) => {
    const b = document.createElement("button")
    b.type = "button"
    b.textContent = label
    b.title = target
    b.onclick = () => fsLoad(target)
    box.appendChild(b)
  }
  mk("/", "/")
  let acc = ""
  path.split("/").filter(Boolean).forEach((seg) => {
    acc += "/" + seg
    const s = document.createElement("span")
    s.className = "sep"
    s.textContent = "/"
    box.appendChild(s)
    mk(seg, acc)
  })
}
function renderFsList() {
  const box = $("#fslist")
  box.innerHTML = ""
  const q = ($("#fsfilter").value || "").toLowerCase()
  const items = fsEntries.filter((e) => !q || e.name.toLowerCase().includes(q))
  if (!items.length) {
    box.innerHTML = '<div class="fempty">비어 있음</div>'
    return
  }
  items.forEach((e) => {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "frow" + (e.isdir ? " isdir" : " isfile")
    b.textContent = (e.isdir ? "▸ " : "· ") + e.name + (e.isdir ? "/" : "")
    b.title = e.name
    if (e.isdir) b.onclick = () => fsLoad(fsCur + "/" + e.name)
    else b.disabled = true
    box.appendChild(b)
  })
}
function drawConvs() {
  const box = $("#convs")
  box.innerHTML = ""
  convs.slice().sort((a, b) => ((b.pin ? 1 : 0) - (a.pin ? 1 : 0)) || ((b.at || 0) - (a.at || 0))).forEach((c) => {
    const row = document.createElement("div")
    row.className = "conv" + (c.pin ? " pinned" : "")
    const b = document.createElement("button")
    b.textContent = c.t + (c.msgs.length ? " (" + c.msgs.length + ")" : "")
    b.type = "button"
    b.className = "ctitle"
    b.dataset.k = c.k
    b.title = (c.sid ? c.sid.slice(0, 8) + " · " : "") + c.msgs.length + "개 메시지" + (c.cwd ? "\n" + c.cwd : "")
    if (c.k === convKey) b.classList.add("active")
    b.onclick = () => openConv(c.k)
    row.appendChild(b)
    if (c.pin) {
      const p = document.createElement("span")
      p.className = "pinbadge"
      p.textContent = "📌"
      p.title = "상단 고정됨"
      row.appendChild(p)
    }
    const dots = document.createElement("button")
    dots.type = "button"
    dots.className = "cdots"
    dots.textContent = "⋮"
    dots.title = "메뉴"
    dots.onclick = (e) => {
      e.stopPropagation()
      showCtx(e, c.k)
    }
    row.appendChild(dots)
    box.appendChild(row)
  })
}
// 우측 탭 규칙: 기본적으로 탭은 존재하지 않는다. goal 탭은 대화에 목표가
// 생길 때, help 탭은 /help 실행 때 생긴다. 앞으로 추가될 탭도 같은 규칙:
// 존재 조건 + 렌더 함수 + closable 여부를 아래에 등록한다.
const RSIDE_TABS = {
  goal: { label: "goal", render: () => renderGoal() },
  help: { label: "help", render: () => renderHelp(), closable: true, onClose: () => {
    helpOpen = false
  } },
}
let rsideTab = null
let helpOpen = false
let rsideHold = false;
// user-collapsed (suppress auto-open)
function availTabs() {
  const t = []
  if (curConv() && curConv().goal) t.push("goal")
  if (helpOpen) t.push("help")
  return t
}
function renderRsideTabs() {
  const box = $("#rsidetabs")
  if (!box) return
  box.innerHTML = ""
  availTabs().forEach((id) => {
    const t = RSIDE_TABS[id]
    const b = document.createElement("button")
    b.type = "button"
    b.setAttribute("role", "tab")
    const lab = document.createElement("span")
    lab.textContent = t.label
    b.appendChild(lab)
    if (id === rsideTab) b.classList.add("sel")
    b.onclick = () => {
      rsideTab = id
      drawRside()
    }
    if (t.closable) {
      const x = document.createElement("span")
      x.className = "tx"
      x.textContent = "×"
      x.title = "탭 닫기"
      x.onclick = (e) => {
        e.stopPropagation()
        closeRsideTab(id)
      }
      b.appendChild(x)
    }
    box.appendChild(b)
  })
  document.querySelectorAll("#rside section[data-rpane]").forEach((s) => {
    s.hidden = s.dataset.rpane !== (rsideTab || "empty")
  })
}
function closeRsideTab(id) {
  const t = RSIDE_TABS[id]
  if (t && t.onClose) t.onClose()
  else if (id === "help") helpOpen = false
  drawRside()
}
function applyRside(hidden) {
  document.body.classList.toggle("rside-hidden", !!hidden)
  const b = $("#rsideopen")
  if (b) b.hidden = !hidden
}
function setRside(hidden) { rsideHold = !!hidden; applyRside(hidden); saveTheme({ rside: !!hidden }); }
function openRside(tab) {
  if (tab === "help") helpOpen = true
  if (tab) rsideTab = tab
  rsideHold = false
  drawRside()
}
function drawRside() {
  const tabs = availTabs()
  if (!tabs.length) {
    rsideTab = null
    renderRsideTabs()
    return
  }
  if (!tabs.includes(rsideTab)) rsideTab = tabs[0]
  if (document.body.classList.contains("rside-hidden") && !rsideHold) applyRside(false)
  renderRsideTabs()
  RSIDE_TABS[rsideTab].render()
}
function renderGoal() {
  const box = $("#rsidegoal")
  if (!box) return
  const c = curConv()
  const g = c && c.goal
  if (!g) {
    box.innerHTML = '<h3>goal</h3><p class="hint">' + t("goal.emptyHtml") + "</p>"
    return
  }
  const done = g.items.filter((x) => x.done).length, tot = g.items.length
  const pct = tot ? Math.round(done / tot * 100) : 0
  let html = "<h3>goal</h3>" + '<div class="goalobj">' + esc(g.objective) + "</div>"
  html += '<div class="goalbar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="goalcount">' + done + "/" + tot + " · " + pct + "%" + (g.active ? "" : " · 완료") + "</div>"
  html += '<div class="goalitems">'
  g.items.forEach((it, i) => {
    html += '<label class="goalitem' + (it.done ? " done" : "") + '"><input type="checkbox" data-gi="' + i + '"' +
      (it.done ? " checked" : "") + "><span>" + esc(it.t) + "</span></label>"
  })
  box.innerHTML = html + "</div>"
}
function renderHelp() {
  const box = $("#rsidehelp")
  if (!box) return
  const ui = new Set(["/new", "/clear", "/copy", "/help"])
  const groups = [["대화", []], ["안내", []], ["muse 명령", []]];
  (slashList || []).forEach((c) => {
    (ui.has(c.cmd) ? groups[0][1] : (/\(CLI\)$/.test(c.desc) ? groups[2][1] : groups[1][1])).push(c)
  })
  let html = "<h3>help</h3>"
  groups.forEach((gr) => {
    if (!gr[1].length) return
    html += '<div class="helpgrp"><h4>' + gr[0] + "</h4>"
    gr[1].forEach((c) => {
      html += '<div class="hrow"><code>' + esc(c.cmd) + "</code><p>" + esc(c.desc) + "</p></div>"
    })
    html += "</div>"
  })
  if (!(slashList || []).length) html += '<p class="hint">불러오는 중…</p>'
  box.innerHTML = html
}
function goalSetPrompt(obj) {
  return "[목표 설정] 아래 목표를 3~8개의 구체적 세부 단계로 나누어라. 그리고 1단계부터 바로 수행하라.\n목표: " + obj +
    "\n규칙: 응답 맨 끝에 ```goal-plan 펜스로 JSON 배열을 출력한다. " +
    '예: ```goal-plan [{"t":"1단계 설명"},{"t":"2단계 설명"}]``` ' +
    "펜스 안에는 JSON만 둔다. 본문 답변과 펜스를 모두 출력한다."
}
function goalTurnPrompt(g, msg) {
  const dn = g.items.map((x, i) => x.done ? i : -1).filter((i) => i >= 0)
  return "[진행 중 목표] " + g.objective +
    "\n완료된 단계 번호: " + (dn.length ? dn.join(",") : "없음") +
    "\n위 목표 달성을 위해 아래 요청을 처리하라. 처리 후 목표 전체의 진행을 평가하고, " +
    "응답 맨 끝에 ```goal-status 펜스로 완료된 단계 번호 배열을 출력한다. " +
    '예: ```goal-status {"done":[0,1]}``` 새로 완료된 게 없으면 {"done":[]}. ' +
    "모든 단계가 끝나면 본문에 '목표 달성'을 명시한다." +
    "\n요청: " + msg
}
function showCtx(e, k) {
  e.preventDefault()
  const c = convs.find((x) => x.k === k)
  const ctx = $("#ctx")
  ctx.dataset.k = k
  ctx.style.display = "block"
  const pinBtn = ctx.querySelector('[data-act="pin"]')
  if (pinBtn) pinBtn.textContent = c && c.pin ? "고정 해제" : "상단 고정"
  ctx.style.left = Math.min(e.clientX, window.innerWidth - 160) + "px"
  ctx.style.top = Math.min(e.clientY, window.innerHeight - 140) + "px"
}
function hideCtx() {
  $("#ctx").style.display = "none"
}
document.addEventListener("click", hideCtx)
$("#ctx").addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]")
  e.stopPropagation()
  hideCtx()
  if (!act) return
  const c = convs.find((x) => x.k === $("#ctx").dataset.k)
  if (!c) return
  if (act.dataset.act === "pin") {
    c.pin = !c.pin
    persistConvs()
    drawConvs()
  } else if (act.dataset.act === "rename") {
    const t = prompt("새 이름", c.t)
    if (t && t.trim()) {
      c.t = t.trim().slice(0, 60)
      persistConvs()
      drawConvs()
    }
  } else if (act.dataset.act === "export") {
    exportConv(c)
  } else if (confirm('"' + c.t + '" 대화와 muse 세션 기록을 함께 삭제할까요?\n(실행 중인 세션은 삭제되지 않습니다)')) {
    const sid = c.sid || null
    convs = convs.filter((x) => x.k !== c.k)
    liveSessions = liveSessions.filter((x) => x !== c.k)
    if (convKey === c.k) {
      convKey = null
      sessionId = null
      chat.innerHTML = ""
    }
    persistConvs()
    drawConvs()
    updateGate()
    drawRside()
    if (sid) {
      fetch("/api/session/delete", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid }) })
        .then((r) => r.json())
        .then((j) => {
          if (!j.ok) alert("세션 기록 삭제 실패: " + (j.text || "?"))
        })
        .catch(() => {})
    }
  }
})
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hideCtx()
hideModal()
hideFsPicker()
if (editingEl) cancelEdit(editingEl)
} })
function loadTheme() {
  try { return JSON.parse(localStorage.getItem("muse-gui-theme") || "{}"); }
  catch (e) { return {}; }
}
const PALETTES = [
  { id: "blue", label: "기본 블루", desc: "muse-gui 기본", dot: "#2f6fed" },
  { id: "green", label: "그린", desc: "그린 악센트", dot: "#178a4c" },
  { id: "amber", label: "앰버", desc: "앰버 악센트", dot: "#b45309" },
  { id: "github", label: "GitHub", desc: "Primer 참조 · 라이트/다크 전체 적용", dot: "#0969da" },
  { id: "obsidian", label: "Obsidian", desc: "기본 테마 참조 · 바이올렛 악센트", dot: "#7c3aed" },
]
function renderPalettes(cur) {
  const box = $("#accents")
  if (!box) return
  box.innerHTML = ""
  PALETTES.forEach((p) => {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "pal" + (p.id === cur ? " sel" : "")
    b.innerHTML = '<span class="paldot" style="background:' + p.dot + '"></span>' +
      '<span class="paltext"><span class="palname">' + esc(p.label) + "</span>" +
      '<small>' + esc(p.desc) + "</small></span>"
    b.onclick = () => saveTheme({ accent: p.id })
    box.appendChild(b)
  })
}
function applyTheme() {
  const t = loadTheme()
  const th = t.theme || "light"
  const ac = PALETTES.some((p) => p.id === t.accent) ? t.accent : "blue"
  document.documentElement.dataset.theme = th
  document.documentElement.dataset.accent = ac
  document.querySelectorAll("#themes .optbtn").forEach((b) =>
    b.classList.toggle("sel", b.dataset.th === th))
  renderPalettes(ac)
  applySide(!!t.side)
  applyRside(t.rside !== false)
  const kn = $("#keepn")
  if (kn) kn.value = keepN()
  liveSessions = liveSessions.slice(0, keepN())
}
$("#sidetoggle").onclick = () => setSide(!document.body.classList.contains("side-hidden"))
function saveTheme(patch) {
  const t = loadTheme()
  localStorage.setItem("muse-gui-theme", JSON.stringify(Object.assign(t, patch)))
  applyTheme()
}
function showModal() {
  $("#ovl").hidden = false
  loadAccount()
  loadUsage()
  loadSkills()
}
const SK_SCOPE_ORDER = ["user", "project", "plugin", "bundled"]
const SK_SCOPE_LABEL = { user: "사용자", project: "프로젝트", plugin: "플러그인", bundled: "내장" }
function skRow(s) {
  const row = document.createElement("div")
  row.className = "skrow"
  const head = document.createElement("div")
  head.className = "skhead"
  const dot = document.createElement("span")
  dot.className = "skdot" + (s.activation === "on" ? " on" : "")
  const nm = document.createElement("button")
  nm.type = "button"
  nm.className = "skname"
  nm.textContent = s.name || s.id
  nm.title = (s.id || "") + " — 상세 보기"
  const sc = document.createElement("span")
  sc.className = "skscope"
  sc.textContent = s.scope || "?"
  const tg = document.createElement("button")
  tg.type = "button"
  tg.className = "optbtn"
  tg.style.cssText = "margin-left:auto;padding:4px 12px;font-size:12px"
  tg.textContent = s.activation === "on" ? "끄기" : "켜기"
  tg.onclick = async (e) => {
    e.stopPropagation()
    tg.disabled = true
    try {
      const rr = await fetch("/api/skills/toggle", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, scope: s.scope,
          enable: s.activation !== "on" }) })
      const jj = await rr.json()
      if (jj.ok) {
        s.activation = jj.activation
        dot.classList.toggle("on", jj.activation === "on")
        tg.textContent = jj.activation === "on" ? "끄기" : "켜기"
      } else alert("스킬 전환 실패: " + (jj.activation || "?"))
    } catch (_) {}
    tg.disabled = false
  }
  head.append(dot, nm, sc, tg)
  const de = document.createElement("div")
  de.className = "skdetail"
  de.hidden = true
  const dp = document.createElement("p")
  dp.className = "skdesc-full"
  dp.textContent = s.description || ""
  const pre = document.createElement("pre")
  pre.className = "skbody"
  pre.textContent = "불러오는 중…"
  de.append(dp, pre)
  let loaded = false
  nm.onclick = async () => {
    de.hidden = !de.hidden
    if (!de.hidden && !loaded) {
      loaded = true
      try {
        const rr = await fetch("/api/skills/body?id=" + encodeURIComponent(s.id || "") +
          "&scope=" + encodeURIComponent(s.scope || ""))
        const jj = await rr.json()
        pre.textContent = jj.ok ? jj.body : ("불러오기 실패: " + (jj.error || "?"))
      } catch (_) {
        pre.textContent = "불러오기 실패"
      }
    }
  }
  row.append(head, de)
  return row
}
async function loadSkills() {
  const box = $("#skillbox")
  box.textContent = "불러오는 중…"
  try {
    const r = await fetch("/api/skills")
    const j = await r.json()
    if (j.error) {
      box.textContent = j.error
      return
    }
    if (!j.skills.length) {
      box.textContent = "스킬 없음"
      return
    }
    box.innerHTML = ""
    const groups = {}
    j.skills.forEach((s) => {
      (groups[s.scope || "?"] = groups[s.scope || "?"] || []).push(s)
    })
    SK_SCOPE_ORDER.concat(Object.keys(groups)).forEach((g) => {
      const items = groups[g]
      if (!items || !items.length || box.querySelector('[data-skgroup="' + g + '"]')) return
      const div = document.createElement("div")
      div.className = "skdiv"
      div.dataset.skgroup = g
      const lb = document.createElement("span")
      lb.textContent = SK_SCOPE_LABEL[g] || g
      div.appendChild(lb)
      box.appendChild(div)
      items.forEach((s) => box.appendChild(skRow(s)))
      delete groups[g]
    })
  } catch (e) {
    box.textContent = "불러오기 실패"
  }
}
$("#skilladd").onclick = () => {
  $("#skillform").hidden = !$("#skillform").hidden
  input.blur()
  $("#skname").focus()
}
$("#skcancel").onclick = () => {
  $("#skillform").hidden = true
}
$("#sksave").onclick = async () => {
  const name = $("#skname").value.trim(), desc = $("#skdesc").value.trim(), body = $("#skbody").value
  if (!name || !desc || !body.trim()) {
    alert("이름·설명·본문을 모두 입력하세요.")
    return
  }
  try {
    const r = await fetch("/api/skills/create", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, body }) })
    const j = await r.json()
    if (!j.ok) {
      alert("스킬 추가 실패: " + (j.error || "?"))
      return
    }
    $("#skillform").hidden = true
    $("#skname").value = ""
    $("#skdesc").value = ""
    $("#skbody").value = ""
    loadSkills()
  } catch (_) {
    alert("스킬 추가 실패 (서버 오류)")
  }
}
document.querySelectorAll("#mtabs button").forEach((b) => { b.onclick = () => {
  document.querySelectorAll("#mtabs button").forEach((x) => x.classList.toggle("sel", x === b))
  document.querySelectorAll('#modal section[data-pane]').forEach((s) => s.classList.toggle("on", s.dataset.pane === b.dataset.tab))
}
})
let usageRange = 7, usageDaily = [], usageFull = null, usageModel = "", usagePrices = null
document.querySelectorAll("#urange button").forEach((b) => { b.onclick = () => {
  usageRange = +b.dataset.r || 7
  document.querySelectorAll("#urange button").forEach((x) => x.classList.toggle("sel", x === b))
  drawUsage()
}
})
function fmtNum(n) {
  n = n || 0
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}
function barsSVG(vals) {
  const W = 260, H = 64, max = Math.max.apply(null, vals.concat([1]))
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" style="width:100%;height:64px;display:block" aria-hidden="true">'
  const bw = W / Math.max(vals.length, 1)
  for (let i = 0; i < vals.length; i++) {
    const h = Math.max(2, Math.round(vals[i] / max * (H - 14)))
    s += '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (H - h) +
      '" width="' + Math.max(1, bw - 2).toFixed(1) + '" height="' + h + '" rx="2" fill="var(--me)" opacity="' +
      (0.35 + 0.65 * vals[i] / max).toFixed(2) + '"/>'
  }
  return s + "</svg>"
}
function ucard(title, value, vals) {
  return '<div class="ucard"><div class="uval">' + esc(value) + '</div><div class="ulab">' +
    esc(title) + "</div>" + barsSVG(vals) + "</div>"
}
function fmtMoney(v) {
  v = +v || 0
  if (v >= 1000) return "$" + (v / 1000).toFixed(2) + "k"
  if (v >= 1) return "$" + v.toFixed(2)
  return "$" + v.toFixed(4)
}
function rateFor(model, prices) {
  const m = ((prices && prices.models) || {})[model] || {}
  let pin = parseFloat(m.input), pout = parseFloat(m.output)
  if (!(pin >= 0)) pin = 1.25
  if (!(pout >= 0)) pout = 4.25
  return [pin, pout]
}
function dayCost(day, prices, model) {
  if (!day) return 0
  const ms = day.models || null
  const cost = (e, n) => {
    const r = rateFor(n, prices)
    return ((e.input || 0) * r[0] + (((e.output || 0) + (e.reasoning || 0)) * r[1])) / 1e6
  }
  if (model) {
    const e = ms ? ms[model] : null
    return e ? cost(e, model) : 0
  }
  if (ms) {
    let t = 0
    Object.keys(ms).forEach((n) => { t += cost(ms[n] || {}, n)
    })
    return t
  }
  const r = rateFor("", prices)
  return (((day.input || 0) * r[0]) + (((day.output || 0) + (day.reasoning || 0)) * r[1])) / 1e6
}
function bucketize(daily, range, per, model, prices) {
  const byDate = {};
  (daily || []).forEach((d) => {
    if (d && d.date) byDate[d.date] = d
  })
  const days = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = range - 1; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 86400000)
    days.push(dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0"))
  }
  const out = []
  for (let s = 0; s < days.length; s += per) {
    const chunk = days.slice(s, s + per)
    const b = { label: chunk[0].slice(5), input: 0, output: 0, reasoning: 0, requests: 0, cost: 0 }
    chunk.forEach((k) => {
      const d = byDate[k]
      if (!d) return
      if (model) {
        const e = ((d.models || {})[model]) || null
        if (!e) return
        const r = rateFor(model, prices)
        b.input += e.input || 0
        b.output += e.output || 0
        b.reasoning += e.reasoning || 0
        b.requests += e.requests || 0
        b.cost += (((e.input || 0) * r[0]) + (((e.output || 0) + (e.reasoning || 0)) * r[1])) / 1e6
      } else {
        b.input += d.input || 0
        b.output += d.output || 0
        b.reasoning += d.reasoning || 0
        b.requests += d.requests || 0
        b.cost += dayCost(d, prices, null)
      }
    })
    out.push(b)
  }
  return out
}
function tsGraph(buckets, series, yfmt) {
  const W = 640, H = 168, L = 52, B = 20, T = 10
  const pw = W - L - 8, ph = H - T - B
  const totals = buckets.map((b) => {
    let t = 0
    series.forEach((s) => {
      t += s.get(b) || 0
    })
    return t
  })
  const max = Math.max.apply(null, totals.concat([1]))
  const X = (i) => L + (i + 0.5) * (pw / Math.max(buckets.length, 1))
  const Y = (v) => T + ph - (v / max) * ph
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto;display:block" role="img">';
  [0, max / 2, max].forEach((tv) => {
    const y = Y(tv).toFixed(1)
    s += '<line x1="' + L + '" y1="' + y + '" x2="' + (W - 8) + '" y2="' + y + '" stroke="var(--bd)" stroke-width="1"/>'
    s += '<text x="' + (L - 5) + '" y="' + (+y + 4).toFixed(1) + '" text-anchor="end" font-size="10" fill="var(--muted)">' + esc(String(yfmt(tv))) + "</text>"
  })
  const bw = pw / Math.max(buckets.length, 1)
  buckets.forEach((b, i) => {
    let acc = 0
    series.forEach((sr) => {
      const v = sr.get(b, i) || 0
      if (v > 0) {
        const h = Math.max(1.5, (v / max) * ph)
        s += '<rect x="' + (X(i) - Math.max(2, bw * 0.32)).toFixed(1) + '" y="' + Y(acc + v).toFixed(1) + '" width="' + Math.max(2, bw * 0.64).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + sr.color + '"/>'
      }
      acc += v
    })
  })
  const xi = [0, Math.floor((buckets.length - 1) / 2), buckets.length - 1]
  xi.forEach((ii, k) => {
    if (ii < 0 || !buckets[ii] || (k && xi[k - 1] === ii)) return
    s += '<text x="' + X(ii).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="10" fill="var(--muted)">' + esc(buckets[ii].label) + "</text>"
  })
  if (!buckets.some((b) => (b.input + b.output) > 0)) {
    s += '<text x="' + (L + pw / 2) + '" y="' + (T + ph / 2) + '" text-anchor="middle" font-size="12" fill="var(--muted)">기록 없음</text>'
  }
  return s + "</svg>"
}
async function refreshPrices() {
  if (!confirm("해당 기능은 토큰을 소비합니다.\n에이전트 세션을 열어 최신 단가를 검색하고 반영할까요?")) return
  const b = $("#costrefresh")
  const old = b ? b.textContent : ""
  if (b) {
    b.disabled = true
    b.textContent = "갱신 중…"
  }
  try {
    const r = await fetch("/api/prices/refresh", { method: "POST" })
    const j = await r.json()
    alert(j.ok ? j.text : ("실패: " + (j.error || "알 수 없음")))
    if (j.ok) await loadUsage()
  } catch (e) {
    alert("실패: " + e)
  }
  finally {
    const bb = $("#costrefresh")
    if (bb) {
      bb.disabled = false
      bb.textContent = old || "비용 업데이트"
    }
  }
}
function drawUsage() {
  const j = usageFull
  if (!j) return
  const names = Object.keys(j.models || {})
  const sel = $("#umodel")
  if (sel) {
    sel.innerHTML = '<option value="">통합</option>' + names.map((n) =>
      '<option value="' + escAttr(n) + '"' + (n === usageModel ? " selected" : "") + ">" + esc(n) + "</option>").join("")
    sel.onchange = () => {
      usageModel = sel.value
      drawUsage()
    }
  }
  const m = usageModel || null
  const data = (usageDaily || []).slice(-usageRange)
  const dv = (d, k) => {
    if (!m) return d[k] || 0
    return (((d || {}).models || {})[m] || {})[k] || 0
  }
  const tot = { requests: 0, input: 0, output: 0 }
  data.forEach((d) => {
    tot.requests += dv(d, "requests")
    tot.input += dv(d, "input")
    tot.output += dv(d, "output")
  })
  let html = '<div class="ucards">' +
    ucard("Requests", fmtNum(tot.requests), data.map((d) => dv(d, "requests"))) +
    ucard("Input tokens", fmtNum(tot.input), data.map((d) => dv(d, "input"))) +
    ucard("Output tokens", fmtNum(tot.output), data.map((d) => dv(d, "output"))) +
    "</div>"
  if (!data.length) html += '<p class="hint">일자별 기록 없음 (세션 로그에 model_completed 없음)</p>'
  const per = usageRange <= 7 ? 1 : usageRange <= 30 ? 2 : 3
  const buckets = bucketize(usageDaily, usageRange, per, m, usagePrices)
  const legend = '<span class="lg"><i style="background:var(--me)"></i>입력</span>' +
    '<span class="lg"><i style="background:var(--ok)"></i>출력</span>'
  html += '<h4 class="ugtitle">토큰 사용량' + (m ? " · " + esc(m) : "") + ' <span class="uglegend">' + legend + "</span></h4>"
  html += tsGraph(buckets, [
    { get: (b) => b.input, color: "var(--me)" },
    { get: (b) => b.output, color: "var(--ok)" },
  ], fmtNum)
  const hasPrices = !!(usagePrices && usagePrices.models)
  if (hasPrices) {
    const totCost = buckets.reduce((a, b) => a + b.cost, 0)
    html += '<h4 class="ugtitle">예상 비용 <span class="ucost">' + fmtMoney(totCost) + "</span></h4>"
    html += tsGraph(buckets, [{ get: (b) => b.cost, color: "var(--me)" }], fmtMoney)
    html += '<p class="hint">단가 기준일: ' + esc(usagePrices.updated || "?") + ' · reasoning은 출력 단가로 계산 · ' +
      '<button type="button" class="linkbtn" id="costrefresh">비용 업데이트</button></p>'
    const cb = $("#costrefresh")
    if (cb) cb.onclick = refreshPrices
  } else {
    html += '<p class="hint">단가 정보 없음</p>'
  }
  $("#ucards").innerHTML = html
}
async function loadUsage() {
  const box = $("#usagebox")
  box.textContent = "불러오는 중…"
  try {
    const r = await fetch("/api/usage")
    const j = await r.json()
    usageFull = j
    usageDaily = j.daily || []
    usagePrices = j.prices || null
    const tot = { calls: 0, input: 0, output: 0, cost: 0 }
    Object.keys(j.models || {}).forEach((n) => {
      const m = j.models[n] || {}
      tot.calls += m.calls || 0
      tot.input += m.input || 0
      tot.output += m.output || 0
      if (usagePrices && usagePrices.models) {
        const rr = rateFor(n, usagePrices)
        tot.cost += (((m.input || 0) * rr[0]) + (((m.output || 0) + (m.reasoning || 0)) * rr[1])) / 1e6
      }
    })
    let html = "<p>총 " + j.turns + "턴 · 호출 " + tot.calls +
      " · in " + tot.input + " / out " + tot.output +
      (usagePrices && usagePrices.models ? " · 예상 " + fmtMoney(tot.cost) : "") + "</p>"
    const al = j.allowance || {}
    html += "<p>구독: " + esc(al.allowance ? JSON.stringify(al.allowance) : (al.reason || al.hint || "조회 실패")) + "</p>"
    const names = Object.keys(j.models || {})
    if (names.length) {
      const maxv = Math.max.apply(null, names.map((n) =>
        (j.models[n].input || 0) + (j.models[n].output || 0)).concat([1]))
      html += '<div class="usgrows">'
      names.forEach((n) => {
        const m = j.models[n]
        const totv = (m.input || 0) + (m.output || 0)
        const w = Math.max(2, Math.round(totv / maxv * 100))
        let costTxt = ""
        if (usagePrices && usagePrices.models) {
          const rr = rateFor(n, usagePrices)
          costTxt = " · " + fmtMoney((((m.input || 0) * rr[0]) + (((m.output || 0) + (m.reasoning || 0)) * rr[1])) / 1e6)
        }
        html += '<div class="usgrow"><div class="usgbase"><span class="usgname">' +
          esc(n) + '</span><span class="usgnum">' + m.calls + "회 · in " +
          m.input + " / out " + m.output + costTxt + "</span></div>" +
          '<div class="usgbar"><i style="width:' + w + '%"></i></div></div>'
      })
      html += "</div>"
      if (usagePrices && usagePrices.models)
        html += '<p class="hint">비용은 추정치 (reasoning은 출력 단가 적용) · 단가 기준일: ' + esc(usagePrices.updated || "?") + "</p>"
    }
    const ss = (j.sessions || []).slice(0, 20)
    if (ss.length) {
      html += '<div class="sidchips">'
      ss.forEach((s) => {
        html += '<span class="sidchip" title="' + esc(String(s.sid)) + '">' +
          esc(String(s.sid).slice(0, 8)) + " · " + s.turns + "턴</span>"
      })
      html += "</div>"
    }
    box.innerHTML = html
    drawUsage()
  } catch (e) {
    box.textContent = "불러오기 실패"
  }
}
function hideModal() {
  $("#ovl").hidden = true
}
async function loadAccount() {
  try {
    const r = await fetch("/api/account")
    const j = await r.json()
    if (!j.ok) {
      $("#acct").innerHTML = '<p class="hint">로그인 정보 없음</p>'
      $("#tok").textContent = "없음"
      return
    }
    const dot = j.subs_active ? '<span class="skdot on"></span>' : '<span class="skdot"></span>'
    $("#acct").innerHTML = '<div class="ucards acct4">' +
      '<div class="ucard"><div class="uval small">' + esc(j.name) + '</div><div class="ulab">이름</div></div>' +
      '<div class="ucard"><div class="uval small">' + esc(j.email) + '</div><div class="ulab">이메일</div></div>' +
      '<div class="ucard"><div class="uval small">' + esc(j.provider) + " · " + esc(j.mechanism) + '</div><div class="ulab">제공자</div></div>' +
      '<div class="ucard"><div class="uval">' + dot + " " + (j.subs_active ? "활성" : "없음") + '</div><div class="ulab">구독</div></div>' +
      "</div>"
    $("#tok").textContent = j.token_masked
  } catch (e) {
    $("#acct").textContent = "불러오기 실패"
  }
}
const EFFORT_OPTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]
function fillSelect(sel, opts, cur) {
  const list = opts.slice()
  if (cur && !list.includes(cur)) list.push(cur)
  sel.innerHTML = list.map((o) => '<option value="' + esc(o) + '"' +
    (o === cur ? " selected" : "") + ">" + esc(o) + "</option>").join("")
  sel.value = cur || ""
}
let yoloOn = true
function paintYolo() {
  const b = $("#yolo")
  if (!b) return
  b.classList.toggle("on", yoloOn)
  b.setAttribute("aria-pressed", yoloOn ? "true" : "false")
  const mark = b.querySelector(".ycheck")
  if (mark) mark.textContent = yoloOn ? "☑" : "☐"
  b.title = t("yolo.warn")
}
async function refreshPrefs() {
  try {
    const [mi, ii] = await Promise.all([
      fetch("/api/models").then((r) => r.json()),
      fetch("/api/info").then((r) => r.json())])
    fillSelect($("#model"), mi.models || [], ii.model)
    fillSelect($("#effort"), EFFORT_OPTS, ii.effort)
    yoloOn = ii.yolo !== false
    paintYolo()
  } catch (e) {}
}
async function refreshInfo() {
  try {
    const r = await fetch("/api/info")
    const j = await r.json()
    serverCwd = j.cwd || ""
    serverPlatform = j.platform || ""
    updateOsChip()
    $("#srvinfo").textContent = j.version + " · " + (j.muse_args.join(" ") || "서버 경로") + " · " + j.cwd
    $("#srvinfo").title = "서버 실행 정보\n" + j.cwd
    if (!convKey) $("#cwd").textContent = serverCwd
    $("#args").textContent = "muse args: " + (j.muse_args.join(" ") || "(없음)")
    $("#status").className = "ok"
    const sd = $("#srvdot")
    if (sd) sd.className = "svcdot on"
  } catch (e) {
    $("#status").className = "err"
    $("#srvinfo").textContent = "서버 연결 실패"
    const sd2 = $("#srvdot")
    if (sd2) sd2.className = "svcdot err"
  }
  try {
    const r = await fetch("/api/slash")
    slashList = await r.json()
    if (helpOpen) renderHelp()
  } catch (e) {
    slashList = []
  }
}
function drawSlash(filter) {
  const items = slashList.filter((c) => c.cmd.startsWith(filter)).slice(0, 50)
  slash.innerHTML = ""
  slashIdx = 0
  if (!items.length || !filter.startsWith("/")) {
    slash.style.display = "none"
    return
  }
  items.forEach((c, i) => {
    const b = document.createElement("button")
    b.type = "button"
    b.textContent = c.cmd + " — " + c.desc
    if (i === 0) b.classList.add("sel")
    b.onclick = () => {
      input.value = c.cmd + " "
      input.focus()
      slash.style.display = "none"
    }
    slash.appendChild(b)
  })
  slash.style.display = "block"
}
input.addEventListener("input", () => {
  const v = input.value
  if (v.startsWith("/") && !v.includes(" ") && !v.includes("\n")) drawSlash(v)
  else slash.style.display = "none"
})
input.addEventListener("keydown", (e) => {
  const popup = slash.style.display === "block"
  if (popup && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault()
    const bs = [...slash.querySelectorAll("button")]
    slashIdx = (slashIdx + (e.key === "ArrowUp" ? -1 : 1) + bs.length) % bs.length
    bs.forEach((b, i) => b.classList.toggle("sel", i === slashIdx))
    if (bs[slashIdx] && bs[slashIdx].scrollIntoView) bs[slashIdx].scrollIntoView({ block: "nearest" })
  } else if (popup && e.key === "Tab") {
    e.preventDefault()
    const sel = slash.querySelector("button.sel")
    if (sel) sel.click()
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    $("#f").requestSubmit()
  }
})
function finishAiTurn(j, ph, goalMode) {
  sessionId = j.session_id || sessionId
  let justDone = null, th = null
  if (goalMode) {
    const gf = goalFence(j.text || "", goalMode)
    const gcc = curConv()
    if (gcc && gcc.goal) {
      const was = gcc.goal.items.filter((x) => x.done).length
      if (goalMode === "plan" && gf.data) gcc.goal.items = normGoalItems(gf.data)
      if (goalMode === "status" && gf.data) {
        const dn = gf.data.done ?? gf.data.completed ?? gf.data.finished
        if (dn === "all" || dn === "complete" || dn === "done")
          gcc.goal.items.forEach((x) => {
            x.done = true
          })
        else if (Array.isArray(dn))
          dn.forEach((i) => {
            const n = Number(i)
            if (Number.isInteger(n) && gcc.goal.items[n]) gcc.goal.items[n].done = true
          })
      }
      const t = gcc.goal.items.length
      const d = gcc.goal.items.filter((x) => x.done).length
      const wasDone = t > 0 && was >= t
      if (t && d >= t) gcc.goal.active = false
      if (t && d >= t && !wasDone) justDone = gcc.goal.objective
      persistConvs()
      drawConvs()
    }
    j.text = gf.clean
    drawRside()
  }
  if (j.cwd) {
    const cc = curConv()
    if (cc) {
      cc.cwd = j.cwd
      persistConvs()
    }
    $("#cwd").textContent = j.cwd
  }
  const tbox = ph._tbox || null
  if (tbox) {
    markThoughtsDone(tbox)
    th = collectThoughts(tbox)
  }
  ph.dataset.raw = j.text || "(빈 응답)"
  ph.innerHTML = renderText(ph.dataset.raw) + '<div class="acts"><button type="button" data-copy title="복사">' + ICON_COPY + "</button></div>"
  if (tbox) ph.prepend(tbox)
  decorateCode(ph)
  decorateMath(ph)
  decorateTables(ph)
  return { justDone, th }
}
function sealAiTurn(ph, t0, fr) {
  const el = ((Date.now() - t0) / 1000).toFixed(1)
  const foot = timeStr(t0) + " · " + el + "초"
  ph.innerHTML += '<div class="meta">' + esc(foot) + "</div>"
  saveMsg("ai", ph.dataset.raw || "", { ts: t0, el, th: fr.th })
  if (fr.justDone) {
    addMsg("ai", "🏁 목표 달성: " + fr.justDone)
    saveMsg("ai", "🏁 목표 달성: " + fr.justDone, { ts: Date.now() })
  }
}
async function postChatStream(message, sid, cwd, signal, onRun) {
  const r = await fetch("/api/chat/stream", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sid, cwd }),
    signal: signal || undefined })
  if (!r.ok || !r.body) throw new Error("HTTP " + r.status)
  const reader = r.body.getReader()
  const dec = new TextDecoder()
  let buf = "", doneJ = null, gotDone = false
  for (;;) {
    const it = await reader.read()
    if (it.value) buf += dec.decode(it.value, { stream: true })
    let idx
    while ((idx = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      const m = frame.match(/^event: ([A-Za-z]+)\ndata: ([\s\S]*)$/)
      if (!m) continue
      if (m[1] === "run") { try { onRun(JSON.parse(m[2])); } catch (e) {} }
      else if (m[1] === "done") {
        try { doneJ = JSON.parse(m[2]); } catch (e) { doneJ = null; }
        gotDone = true
      }
    }
    if (it.done) break
  }
  if (!gotDone || !doneJ) throw new Error("스트림이 끝나기 전에 연결이 끊어졌습니다.")
  return doneJ
}
async function runStreamTurn(full, sid, cwd, ph, t0, goalMode) {
  const tbox = document.createElement("div")
  tbox.className = "thoughts"
  const thead = document.createElement("div")
  thead.className = "thead"
  thead.innerHTML = '<span class="tspin"></span><span class="ttype" hidden>통합</span>' +
    '<span class="tsum">준비 중…</span>' +
    '<button type="button" class="ttoggle" data-ttoggle title="펼치기/접기">›</button>'
  const tbody = document.createElement("div")
  tbody.className = "tbody"
  tbody.hidden = true
  tbox.append(thead, tbody)
  ph.prepend(tbox)
  ph._tbox = tbox
  const headTgl = thead.querySelector(".ttoggle")
  if (headTgl) headTgl.hidden = true
  const tstate = { rows: new Map(), texts: [], body: tbody, tbox,
    headSpin: thead.children[0], headSum: thead.children[2], headTgl, last: "" }
  tbox._tstate = tstate
  const ctl = new AbortController()
  activeStreamAbort = ctl
  setSendStop(true)
  try {
    const j = await postChatStream(full, sid, cwd, ctl.signal, (ev) => updateThought(tbox, tstate, ev))
    const fr = finishAiTurn(j, ph, goalMode)
    sealAiTurn(ph, t0, fr)
  } catch (err) {
    const aborted = err && err.name === "AbortError"
    const base = tstate.texts.join("").trim()
    const alt = base ? base + (aborted ? "\n\n[중단됨]" : "") : "전송 실패: " + err
    const fr = finishAiTurn({ text: alt, session_id: null }, ph, null)
    sealAiTurn(ph, t0, fr)
  } finally {
    if (activeStreamAbort === ctl) activeStreamAbort = null
    setSendStop(false)
  }
}
$("#f").addEventListener("submit", async (e) => {
  e.preventDefault()
  if (activeStreamAbort) { try { activeStreamAbort.abort(); } catch (err) {} return; }
  const text = input.value.trim()
  if (!text) return
  if (inputGated()) {
    updateGate()
    return
  }
  if (text.startsWith("/")) pendingPrefix = null
  let goalMode = null, sendText = null
  if (text === "/help" || text.startsWith("/help ")) {
    input.value = ""
    slash.style.display = "none"
    $("#feats").innerHTML = ""
    input.style.height = "auto"
    input.style.overflowY = "hidden"
    openRside("help")
    return
  }
  if (text === "/goal" || text.startsWith("/goal ")) {
    const obj = text.slice(5).trim()
    input.value = ""
    slash.style.display = "none"
    $("#feats").innerHTML = ""
    input.style.height = "auto"
    input.style.overflowY = "hidden"
    if (!obj) {
      const cc0 = curConv()
      if (cc0 && cc0.goal) openRside("goal")
      else addMsg("ai", "진행 중인 목표가 없습니다. `/goal 목표 내용` 으로 시작하세요.")
      return
    }
    sendText = goalSetPrompt(obj)
    goalMode = "plan"
  }
  const pre = text.startsWith("/") ? [] : featPrefixes()
  input.value = ""
  slash.style.display = "none"
  input.style.height = "auto"
  input.style.overflowY = "hidden"
  $("#feats").innerHTML = ""
  let full = (pre.length ? pre.join("\n") + "\n" : "") + text
  const gc0 = curConv()
  if (sendText !== null) {
    full = sendText
    if (gc0) {
      gc0.goal = { objective: text.slice(5).trim(), items: [], active: true }
      persistConvs()
      drawConvs()
      openRside("goal")
    }
  } else if (!text.startsWith("/") && gc0 && gc0.goal && gc0.goal.active) {
    full = goalTurnPrompt(gc0.goal, full)
    goalMode = "status"
  }
  if (pendingPrefix) {
    full = pendingPrefix + full
    pendingPrefix = null
  }
  if (text === "/clear" || text.startsWith("/clear ")) {
    chat.innerHTML = ""
    const c = curConv()
    if (c) {
      c.msgs = []
      persistConvs()
      drawConvs()
    }
    return
  }
  saveConv(text.slice(0, 30))
  const meTs = Date.now()
  if (skipEcho) skipEcho = false
  else { addMsg("me", text, null, timeStr(meTs)); saveMsg("me", text, { ts: meTs }); }
  if (text === "/copy" || text.startsWith("/copy ")) {
    const done = (await copyText(lastAiText())) ? "복사했습니다." : "복사할 답변이 없습니다."
    addMsg("ai", done)
    saveMsg("ai", done)
    drawConvs()
    return
  }
  const ph = addMsg("ai", "응답 생성 중…", null, null, false)
  const t0 = Date.now()
  try {
    const cc0 = curConv()
    touchLive()
    const cwd = (cc0 && cc0.cwd) || serverCwd || ""
    if (text.startsWith("/") && sendText === null) {
      const r = await fetch("/api/chat", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: full, session_id: sessionId, cwd }) })
      const j = await r.json()
      if (j.text === "__COPY__") {
        const prev = [...chat.querySelectorAll(".msg.ai")].filter((n) => n !== ph).pop()
        ph.dataset.raw = await copyText(prev ? prev.dataset.raw || "" : "")
        ph.innerHTML = esc(ph.dataset.raw)
      } else if (j.new_session) { sessionId = null; convKey = null; chat.innerHTML = ""; $("#cwd").textContent = serverCwd; setRoute("/"); updateGate(); drawRside(); }
      else {
        const fr = finishAiTurn(j, ph, goalMode)
        sealAiTurn(ph, t0, fr)
      }
      drawConvs()
      refreshPrefs()
      chat.scrollTop = chat.scrollHeight
    } else {
      await runStreamTurn(full, sessionId, cwd, ph, t0, goalMode)
      drawConvs()
      refreshPrefs()
      chat.scrollTop = chat.scrollHeight
    }
  } catch (err) {
    ph.dataset.raw = "전송 실패: " + err
    ph.innerHTML = renderText(ph.dataset.raw)
    decorateCode(ph)
    decorateMath(ph)
    decorateTables(ph)
    saveMsg("ai", ph.dataset.raw)
  }
})
$("#newchat").onclick = () => {
  saveScroll()
  sessionId = null
  convKey = null
  chat.innerHTML = ""
  $("#cwd").textContent = serverCwd
  setRoute("/")
  updateGate()
  drawRside()
  input.focus()
}
$("#cwd").onclick = async () => {
  const p = (($("#cwd") && $("#cwd").textContent) || "").trim() || serverCwd || ""
  if (!p) return
  try {
    const r = await fetch("/api/open-folder", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: p }) })
    const j = await r.json()
    if (!j.ok) alert("폴더 열기 실패: " + (j.error || p))
  } catch (err) {
    alert("폴더 열기 실패: " + p)
  }
}
$("#gatebtn").onclick = () => {
  const act = $("#gatebtn").dataset.act
  if (act === "resume") {
    touchLive()
    updateGate()
    input.focus()
  }
  else openFsPicker((p) => {
    if (act === "pick-new") {
      convKey = "c" + Date.now()
      sessionId = null
      convs.unshift({ k: convKey, t: "새 대화", sid: null, cwd: p, msgs: [] })
      persistConvs()
      drawConvs()
      openConv(convKey)
      input.focus()
    } else {
      const c = curConv()
      if (c) {
        c.cwd = p
        persistConvs()
        drawConvs()
      }
      $("#cwd").textContent = p
      updateGate()
      input.focus()
    }
  })
}
$("#fsclose").onclick = hideFsPicker
$("#fscancel").onclick = hideFsPicker
$("#fsok").onclick = () => { if (fsCb && fsCur) { const cb = fsCb
hideFsPicker()
cb(fsCur)
} }
$("#fswin").onclick = async () => {
  const b = $("#fswin")
  b.disabled = true
  const old = b.textContent
  b.textContent = "Windows에서 선택 중…"
  try {
    const r = await fetch("/api/fs/pick-native", { method: "POST" })
    if (r.status === 404) {
      $("#fssel").textContent = "서버가 구버전입니다. muse-gui를 다시 시작하세요."
      return
    }
    const j = await r.json()
    if (j.ok && j.path) {
      const cb = fsCb
      hideFsPicker()
      if (cb) cb(j.path)
    }
    else if (j.error && j.error !== "취소됨.") $("#fssel").textContent = j.error
  } catch (e) {
    $("#fssel").textContent = "서버 연결 실패"
  }
  finally {
    b.disabled = false
    b.textContent = old
  }
}
$("#fsgo").onclick = () => {
  const p = $("#fspath").value.trim()
  if (p) fsLoad(p)
}
$("#rsidetoggle").onclick = () => setRside(true)
$("#rsideopen").onclick = () => setRside(false)
const keepnEl = $("#keepn")
if (keepnEl) keepnEl.addEventListener("change", () => {
  saveTheme({ keepN: Math.min(5, Math.max(1, parseInt(keepnEl.value, 10) || 3)) })
  applyTheme()
})
$("#rsidegoal").addEventListener("change", (e) => {
  const box = e.target.closest("[data-gi]")
  if (!box) return
  const c = curConv()
  if (!c || !c.goal) return
  const it = c.goal.items[+box.dataset.gi]
  if (!it) return
  it.done = !!box.checked
  const t = c.goal.items.length, d = c.goal.items.filter((x) => x.done).length
  if (t && d >= t && c.goal.active) {
    c.goal.active = false
    addMsg("ai", "🏁 목표 달성: " + c.goal.objective)
    saveMsg("ai", "🏁 목표 달성: " + c.goal.objective, { ts: Date.now() })
  }
  persistConvs()
  drawConvs()
  drawRside()
})
$("#fspath").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault()
$("#fsgo").click()
} })
$("#fsfilter").addEventListener("input", renderFsList)
$("#fsup").onclick = () => {
  if (fsParent) fsLoad(fsParent)
}
$("#fsovl").addEventListener("click", (e) => {
  if (e.target === $("#fsovl")) hideFsPicker()
})
$("#model").addEventListener("change", async (e) => {
  await fetch("/api/prefs", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: e.target.value }) })
  refreshPrefs()
})
$("#effort").addEventListener("change", async (e) => {
  await fetch("/api/prefs", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ effort: e.target.value }) })
  refreshPrefs()
})
document.querySelectorAll("#langrow [data-lang]").forEach((b) => {
  b.addEventListener("click", () => applyLang(b.dataset.lang))
})
$("#yolo").addEventListener("click", async () => {
  const next = !yoloOn
  yoloOn = next
  paintYolo()
  try {
    await fetch("/api/prefs", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ yolo: next }) })
  } catch (e) {}
  refreshPrefs()
})
$("#gear").onclick = showModal
$("#mclose").onclick = hideModal
$("#ovl").addEventListener("click", (e) => {
  if (e.target === $("#ovl")) hideModal()
})
document.querySelectorAll("#themes .optbtn").forEach((b) => { b.onclick = () => saveTheme({ theme: b.dataset.th })
})
$("#tokcopy").onclick = async (e) => {
  const b = e.currentTarget
  try {
    const r = await fetch("/api/account/token", { method: "POST" })
    const j = await r.json()
    if (!j.ok || !j.token) return
    flashCopy(b, j.token)
  } catch (_) {}
}
function autoGrow() {
  input.style.height = "auto"
  const h = input.scrollHeight
  input.style.height = Math.min(h, 132) + "px";
  // up to 3x the 44px base
  input.style.overflowY = h > 132 ? "auto" : "hidden"
}
input.addEventListener("input", autoGrow)
chat.addEventListener("scroll", () => {
  clearTimeout(scrollSaveT)
  scrollSaveT = setTimeout(saveScroll, 300)
})
window.addEventListener("beforeunload", saveScroll)
function setMode() {
  const lobby = !chat.children.length
  document.querySelector("main").classList.toggle("lobby", lobby)
}
const FEAT_ICONS = {
  viz: '<span class="ficon"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>',
  web: '<span class="ficon"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>'
}
const FEATS = {
  viz: { chip: "시각화", prefix: "[시각화 요청] 답변에 인터랙티브 시각화가 필요하면 설명과 함께 아래 형식 코드블록을 포함하라.\n```viz-html\n(외부 CDN 없이 동작하는 단일 HTML 문서. <script> 사용 가능. sandbox라서 same-origin 접근·팝업·다운로드 불가)\n```\n높이는 ```viz-html:높이 로 지정(기본 360). 시각화가 필요 없으면 생략해도 된다." },
  web: { chip: "웹 검색", prefix: "[웹 검색 필수] 아래 요청에 답하기 전에 반드시 웹 검색을 수행하고 검색 결과와 함께 답하라. 검색 없이 알던 내용으로 답하지 마라. 사용한 검색어와 핵심 근거를 밝혀라. 근거가 된 문장 끝에는 [출처: 사이트명](URL) 형태로 표기하라." },
  autoanswer: { chip: "자동 응답", prefix: "[자동 응답] 작업 중 선택이 필요하면 사용자에게 묻지 말고 권장(기본) 선택지로 진행하고, 무엇을 선택했는지 결과에 밝혀라. 되돌릴 수 없는 파괴적 조치는 제외하고, 그 경우에만 질문하라." }
}
const DOCK_FEATURES = [
  { id: "viz", label: "시각화", desc: "인터랙티브 패널로 답변 요청", ready: true, feat: "viz" },
  { id: "web", label: "웹 검색", desc: "반드시 검색 후 답변", ready: true, feat: "web" },
  { id: "autoanswer", label: "자동 응답", desc: "선택지를 묻지 않고 권장안으로 진행", ready: true, feat: "autoanswer" },
  { id: "upload", label: "파일 업로드", desc: "준비 중", ready: false }
]
function addFeat(id) {
  if (!FEATS[id] || document.querySelector('#feats [data-f="' + id + '"]')) return
  const s = document.createElement("span")
  s.className = "fchip"
  s.dataset.f = id
  s.innerHTML = (FEAT_ICONS[id] || "") + "<span>" + esc(FEATS[id].chip) + "</span> "
  const x = document.createElement("button")
  x.type = "button"
  x.textContent = "×"
  x.title = "제거"
  x.onclick = (e) => {
    e.stopPropagation()
    s.remove()
    input.focus()
  }
  s.appendChild(x)
  $("#feats").appendChild(s)
}
function featPrefixes() {
  return [...document.querySelectorAll("#feats .fchip")].map((c) => FEATS[c.dataset.f].prefix)
}
function renderPlusMenu() {
  const menu = $("#plusmenu")
  menu.innerHTML = ""
  DOCK_FEATURES.forEach((f) => {
    const b = document.createElement("button")
    b.type = "button"
    b.disabled = !f.ready
    const wrap = document.createElement("span")
    const lab = document.createElement("span")
    lab.textContent = f.label
    const sm = document.createElement("small")
    sm.textContent = f.ready ? f.desc : f.desc + " (추후 추가)"
    wrap.appendChild(lab)
    wrap.appendChild(sm)
    b.innerHTML = FEAT_ICONS[f.feat] || ""
    b.appendChild(wrap)
    if (f.ready) b.onclick = (e) => {
      e.stopPropagation()
      addFeat(f.feat)
      input.focus()
      menu.hidden = true
    }
    menu.appendChild(b)
  })
}
$("#plus").onclick = (e) => {
  e.stopPropagation()
  renderPlusMenu()
  $("#plusmenu").hidden = !$("#plusmenu").hidden
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("footer")) $("#plusmenu").hidden = true
})
function chipList() {
  return [t("chip.struct"), "/usage", t("chip.viz")]
}
function renderChips() {
  const box = $("#chips")
  box.innerHTML = ""
  chipList().forEach((c) => {
    const b = document.createElement("button")
    b.type = "button"
    b.textContent = c
    b.onclick = () => {
      input.value = c
      input.focus()
    }
    box.appendChild(b)
  })
}
new MutationObserver(setMode).observe(chat, { childList: true })
applyTheme()
try { langCur = loadTheme().lang === "en" ? "en" : "ko" } catch (e) { langCur = "ko" }
renderChips()
drawConvs()
refreshInfo()
refreshPrefs()
setMode()
updateGate()
drawRside();
applyLang(langCur, false)
(function () {
  const rid = routeId(location.pathname)
  if (!rid) return
  const c = convs.find((x) => x.k === rid || x.sid === rid)
  if (c) openConv(c.k)
})()
