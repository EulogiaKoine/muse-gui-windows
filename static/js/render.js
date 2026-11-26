"use strict";
// == muse-gui/js/render.js ==
// Markdown/code/math/table/viz rendering into HTML.
const GREEK = { alpha:"α", beta:"β", gamma:"γ", delta:"δ", epsilon:"ε", varepsilon:"ε", zeta:"ζ", eta:"η", theta:"θ", thetav:"ϑ", iota:"ι", kappa:"κ", lambda:"λ", mu:"μ", nu:"ν", xi:"ξ", pi:"π", varpi:"ϖ", rho:"ρ", varrho:"ϱ", sigma:"σ", varsigma:"ς", tau:"τ", upsilon:"υ", phi:"φ", varphi:"φ", chi:"χ", psi:"ψ", omega:"ω", imath:"ı", jmath:"ȷ", ell:"ℓ", wp:"℘", aleph:"ℵ", hbar:"ℏ", Re:"ℜ", Im:"ℑ", nabla:"∇", surd:"√", infty:"∞", partial:"∂",
  times:"×", div:"÷", pm:"±", mp:"∓", cdot:"·", ast:"∗", star:"⋆", circ:"∘", bullet:"•", cdotp:"·", ldots:"…", cdots:"⋯", vdots:"⋮", ddots:"⋱", dots:"…", hellip:"…",
  leq:"≤", geq:"≥", le:"≤", ge:"≥", lt:"<", gt:">", neq:"≠", ne:"≠", ll:"≪", gg:"≫", prec:"≺", succ:"≻", preceq:"≼", succeq:"≽", subset:"⊂", supset:"⊃", subseteq:"⊆", supseteq:"⊇", subsetneq:"⊊", supsetneq:"⊋", in:"∈", ni:"∋", notin:"∉", owns:"∋",
  cap:"∩", cup:"∪", uplus:"⊎", sqcap:"⊓", sqcup:"⊔", vee:"∨", wedge:"∧", land:"∧", lor:"∨", setminus:"\\", backslash:"\\", slash:"/",
  oplus:"⊕", ominus:"⊖", otimes:"⊗", oslash:"⊘", odot:"⊙", dagger:"†", ddagger:"‡", amalg:"∐", coprod:"∐", diamond:"⋄", Diamond:"◇", triangleup:"△", bigtriangleup:"△", bigtriangledown:"▽", Box:"□", square:"□", blacksquare:"■",
  approx:"≈", cong:"≅", equiv:"≡", propto:"∝", sim:"∼", simeq:"≃", asymp:"≍", doteq:"≐", perp:"⊥", mid:"∣", parallel:"∥", angle:"∠", triangle:"△", prime:"′", qed:"∎",
  emptyset:"∅", varnothing:"∅", complement:"∁", forall:"∀", exists:"∃", nexists:"∄", neg:"¬", lnot:"¬",
  to:"→", rightarrow:"→", leftarrow:"←", Rightarrow:"⇒", Leftarrow:"⇐", Leftrightarrow:"⇔", leftrightarrow:"↔", uparrow:"↑", downarrow:"↓", Uparrow:"⇑", Downarrow:"⇓", updownarrow:"↕", mapsto:"↦", longrightarrow:"⟶", longleftarrow:"⟵", longleftrightarrow:"⟷", hookrightarrow:"↪", hookleftarrow:"↩", rightleftharpoons:"⇌", leadsto:"⇝", implies:"⇒", impliedby:"⇐", iff:"⟺", gets:"←",
  sum:"∑", prod:"∏", coprod:"∐", bigcup:"⋃", bigcap:"⋂", bigvee:"⋁", bigwedge:"⋀", bigoplus:"⨁", bigotimes:"⨂", int:"∫", oint:"∮", iint:"∬", iiint:"∭",
  cos:"cos", sin:"sin", tan:"tan", arccos:"arccos", arcsin:"arcsin", arctan:"arctan", arg:"arg", cosh:"cosh", cot:"cot", coth:"coth", csc:"csc", deg:"deg", det:"det", dim:"dim", exp:"exp", gcd:"gcd", hom:"hom", inf:"inf", ker:"ker", lg:"lg", lim:"lim", liminf:"lim inf", limsup:"lim sup", ln:"ln", log:"log", max:"max", min:"min", sec:"sec", sinh:"sinh", sup:"sup", tanh:"tanh",
  quad:"\u2003", qquad:"\u2003\u2003", enspace:"\u2002", thinspace:"\u2009", medspace:"\u2005", thickspace:"\u2005",
  langle:"⟨", rangle:"⟩", lceil:"⌈", rceil:"⌉", lfloor:"⌊", rfloor:"⌋", vert:"|", Vert:"‖", lbrace:"{", rbrace:"}",
  ulcorner:"⌜", urcorner:"⌝", llcorner:"⌞", lrcorner:"⌟",
  lslash:"ł", Lslash:"Ł", o:"ø", O:"Ø", aa:"å", AA:"Å", ae:"æ", AE:"Æ", oe:"œ", OE:"Œ", ss:"ß", dh:"ð", TH:"Þ", th:"þ", ng:"ŋ", NG:"Ŋ" }
const ACCENTS = { hat:"\u0302", widehat:"\u0302", bar:"\u0304", vec:"\u20D7", dot:"\u0307", ddot:"\u0308", dddot:"\u20DB", tilde:"\u0303", widetilde:"\u0303", check:"\u030C", breve:"\u0306", acute:"\u0301", grave:"\u0300", mathring:"\u030A" }
function renderMath(tex, display) {
  const raw = String(tex == null ? "" : tex).trim();
  try {
    if (typeof katex !== "undefined" && katex && katex.renderToString) {
      const html = katex.renderToString(raw, { displayMode: !!display, throwOnError: true, trust: false, output: "html" });
      if (html && html.indexOf("katex-error") < 0) {
        const tag = display ? "math math-block" : "math";
        return '<span class="' + tag + '" data-tex="' + escAttr(raw) + '">' + html + "</span>";
      }
    }
  } catch (e) {}
  return renderMathLegacy(raw, display);
}
function renderMathLegacy(tex, display) {
  const raw = String(tex == null ? "" : tex).trim();
  const BRK = "\ue000"
  let t = esc(raw)
  t = t.replace(/\\\\|\\cr(?![a-zA-Z])/g, BRK)
  t = t.replace(new RegExp(BRK + "([,;:! ])", "g"), (m, w) => BRK + ({ ",": " ", ":": " ", ";": " ", "!": "", " ": " " }[w]))
  t = t.replace(/\\(?:text|mbox)\{([^{}]*)\}/g, "$1")
  t = t.replace(/\\operatorname\*?\{([^{}]*)\}/g, "$1")
  t = t.replace(/\\DeclareMathOperator\*?\{[^{}]*\}\{([^{}]*)\}/g, "$1")
  for (let i = 0; i < 3; i++) {
    const before = t
    t = t.replace(/\\(?:mathrm|mathbf|mathit|mathsf|mathtt|mathbb|mathfrak|mathscr|boldsymbol|pmb|phantom|hphantom|vphantom|smash|rlap|llap)\{([^{}]*)\}/g, "$1")
    t = t.replace(/\\textcolor?\{[^{}]*\}\{([^{}]*)\}/g, "$1")
    t = t.replace(/\\href\{[^{}]*\}\{([^{}]*)\}/g, "$1")
    if (t === before) break
  }
  t = t.replace(/\\tag\*?\{[^{}]*\}/g, "")
  t = t.replace(/\\label\{[^{}]*\}/g, "")
  t = t.replace(/\\(?:color|textcolor)\{[^{}]*\}/g, "")
  t = t.replace(/\\(?:hline|midrule|toprule|bottomrule)\b/g, "")
  t = t.replace(/\\cline\{[^{}]*\}/g, "")
  t = t.replace(/\\(?:multicolumn|multirow)\{[^{}]*\}\{[^{}]*\}\{([^{}]*)\}/g, "$1")
  t = t.replace(/\\newline\b/g, BRK)
  t = t.replace(/\\begin\{cases\}/g, "{")
  t = t.replace(/\\end\{cases\}/g, "")
  t = t.replace(/\\begin\{[a-zA-Z*]+\}/g, "")
  t = t.replace(/\\end\{[a-zA-Z*]+\}/g, "")
  t = t.replace(/(^|[^\\])&amp;/g, "$1\u2003\u2003");
  t = t.replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, '<span class="nroot">$1</span>√<span class="rad">$2</span>')
  t = t.replace(/\\sqrt([0-9])/g, "√<span class=\"rad\">$1</span>")
  t = t.replace(/\\d?frac(\d)(\d)/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
  t = t.replace(/\\pmod\{([^{}]*)\}/g, " (mod $1)")
  t = t.replace(/\\(?:bmod|mod)\b/g, "mod")
  t = t.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
  t = t.replace(/\\d?binom\{([^{}]*)\}\{([^{}]*)\}/g, '(<span class="frac"><span class="num">$1</span><span class="den">$2</span>)')
  t = t.replace(/\\cfrac\{([^{}]*)\}\{([^{}]*)\}/g, '<span class="frac"><span class="num">$1</span><span class="den">$2</span></span>')
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, '√<span class="rad">$1</span>')
  t = t.replace(/\\sqrt ([a-zA-Z0-9])/g, "√<span class=\"rad\">$1</span>")
  t = t.replace(/\\(?:underbrace|overbrace)\{([^{}]*)\}(?:_\{([^{}]*)\}|\^\{([^{}]*)\}|_(\S)|\^(\S))?/g, (m, b, su, so, su1, so1) => {
    const lab = su || so || su1 || so1 || ""
    if (!lab) return b
    return b + (su || su1 ? "<sub>" + lab + "</sub>" : "<sup>" + lab + "</sup>")
  })
  t = t.replace(/\\(?:underbrace|overbrace)\{([^{}]*)\}/g, "$1")
  t = t.replace(/\\(?:overline|underline) ([a-zA-Z0-9])/g, (m, w, ch) => '<span class="mline' + (w === "underline" ? " under" : "") + '">' + ch + "</span>")
  t = t.replace(/\\overline\{([^{}]*)\}/g, '<span class="mline">$1</span>')
  t = t.replace(/\\underline\{([^{}]*)\}/g, '<span class="mline under">$1</span>')
  t = t.replace(/\\boxed\{([^{}]*)\}/g, '<span class="boxed">$1</span>')
  t = t.replace(/\\(?:cancel|bcancel|xcancel)\{([^{}]*)\}/g, "<s>$1</s>")
  t = t.replace(/\\([a-zA-Z]+)\{([^{}]*)\}/g, (m, w, inner) => (ACCENTS[w] ? inner + ACCENTS[w] : m))
  t = t.replace(/\\([a-zA-Z]+) ([a-zA-Z])/g, (m, w, ch) => (ACCENTS[w] ? ch + ACCENTS[w] : m))
  t = t.replace(/\\([,;:!\/ ])/g, (m, w) => ({ ",": " ", ":": " ", ";": " ", "!": "", "/": "", " ": " " }[w]))
  t = t.replace(/\\(%|#|\{|\}|\\$|_|&amp;)/g, (m, w) => (w === "&amp;" ? "&" : w))
  t = t.replace(/\\(?:left|right)\s*(\.|\(|\)|\[|\]|\\\{|\\\}|\||\\vert(?![a-zA-Z])|\\Vert(?![a-zA-Z])|\\langle(?![a-zA-Z])|\\rangle(?![a-zA-Z])|\/|\\\/)/g, (m, d) => {
    if (d === ".") return ""
    if (d === "\\{") return "{"
    if (d === "\\}") return "}"
    if (d === "\\vert") return "|"
    if (d === "\\Vert") return "‖"
    if (d === "\\langle") return "⟨"
    if (d === "\\rangle") return "⟩"
    return d
  })
  t = t.replace(/\\[Bb]igg?[lr]?/g, "")
  t = t.replace(/\\(?:limits|nolimits|displaystyle|textstyle|scriptstyle|scriptscriptstyle|nonumber|middle)\b/g, "")
  t = t.replace(/\^(\{([^{}]*)\}|([^\s&;]))/g, (m, g, braced, ch) => "<sup>" + (braced || ch || "") + "</sup>")
  t = t.replace(/_(\{([^{}]*)\}|([^\s&;]))/g, (m, g, braced, ch) => "<sub>" + (braced || ch || "") + "</sub>")
  t = t.replace(/\\([a-zA-Z]+)\{([^{}]*)\}/g, "$2");
  t = t.replace(/\\not(?![a-zA-Z])\\s*(\\S)/g, "$1\u0338");
  t = t.replace(/\\([a-zA-Z]+)/g, (m, w) => GREEK[w] || w);
  if (display) t = t.split(BRK).join("<br>")
  else t = t.split(BRK).join(" ")
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
