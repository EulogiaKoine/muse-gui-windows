"use strict"
// == muse-gui/js/message.js ==
// Chat bubbles, fold, edit, decorate, link/table helpers.
function agentFileUrl(rel) {
  const c = typeof curConv === "function" ? curConv() : null
  const cwd =
    (c && c.cwd) || (typeof serverCwd !== "undefined" ? serverCwd : "") || ""
  return (
    "/api/file?cwd=" +
    encodeURIComponent(cwd) +
    "&path=" +
    encodeURIComponent(rel || "")
  )
}
async function openAgentFile(rel) {
  const c = typeof curConv === "function" ? curConv() : null
  const cwd =
    (c && c.cwd) || (typeof serverCwd !== "undefined" ? serverCwd : "") || ""
  try {
    const r = await fetch("/api/file/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cwd, path: rel }),
    })
    const j = await r.json()
    if (!j.ok) alert(errText(j, t) || t("file.openFail") + rel)
  } catch (e) {
    alert(t("file.openFail") + rel)
  }
}
function attRowHtml(atts) {
  if (!atts || !atts.length) return ""
  let h = ""
  atts.forEach((a) => {
    const nm = (a && a.name) || "?"
    const img = /\.(png|jpe?g|webp|gif|bmp)$/i.test(nm)
    h +=
      '<button type="button" class="att" data-openatt="' +
      escAttr((a && a.path) || "") +
      '" title="' +
      escAttr(nm) +
      '">' +
      (img
        ? "<img loading='lazy' src='" +
          escAttr(agentFileUrl(a.path)) +
          "' alt=''>"
        : '<span class="attico">📄</span>') +
      "<span>" +
      esc(nm) +
      "</span></button>"
  })
  return h
}
function addMsg(who, text, think, foot, withActs, extra) {
  const d = document.createElement("div")
  d.className = "msg " + who
  d.dataset.raw = text
  d.dataset.mi = chat.querySelectorAll(".msg").length
  if (who === "me" && extra && extra.atts && extra.atts.length) {
    const ar = document.createElement("div")
    ar.className = "attrow"
    ar.dataset.mi = d.dataset.mi
    ar.innerHTML = attRowHtml(extra.atts)
    chat.appendChild(ar)
  }
  let html =
    (extra && extra.thoughts && extra.thoughts.length
      ? renderThoughtsStatic(extra.thoughts)
      : "") +
    renderText(text) +
    (think
      ? "<details><summary>" + esc(t("msg.detail")) + "</summary>" + esc(think) + "</details>"
      : "")
  if (withActs === undefined) withActs = true
  if (who === "ai") {
    chat.querySelectorAll(".msg.ai [data-retry]").forEach((b) => b.remove())
    if (withActs)
      html +=
        '<div class="acts"><button type="button" data-retry title="' +
        escAttr(t("act.retryLast")) +
        '">' +
        ICON_RETRY +
        '</button><button type="button" data-copy title="' +
        escAttr(t("act.copy")) +
        '">' +
        ICON_COPY +
        "</button></div>"
  } else
    html +=
      '<div class="acts"><button type="button" data-retry title="' +
      escAttr(t("act.retryFrom")) +
      '">' +
      ICON_RETRY +
      '</button><button type="button" data-copy title="' +
      escAttr(t("act.copy")) +
      '">' +
      ICON_COPY +
      '</button><button type="button" data-edit title="' +
      escAttr(t("act.editResend")) +
      '">✎</button></div>'
  let mtime = null
  if (foot && who === "me") mtime = foot
  else if (foot) html += '<div class="meta">' + esc(foot) + "</div>"
  if (who === "me" && text.length >= 200) {
    d.classList.add("folded")
    const ai = html.indexOf('<div class="acts">')
    const content = ai >= 0 ? html.slice(0, ai) : html
    const rest = ai >= 0 ? html.slice(ai) : ""
    html =
      '<div class="mfold">' +
      content +
      '<div class="foldfade"></div></div>' +
      rest +
      '<button type="button" class="foldbtn" data-fold title="' +
      escAttr(t("act.toggle")) +
      '">' +
      ICON_CHEVD +
      "</button>"
  }
  d.innerHTML = html
  decorateCode(d)
  decorateMath(d)
  decorateTables(d)
  decoratePaths(d)
  if (mtime && who === "me") {
    const wrap = document.createElement("div")
    wrap.className = "mewrap"
    wrap.dataset.mi = d.dataset.mi
    const mt = document.createElement("div")
    mt.className = "mtime"
    mt.textContent = mtime
    wrap.append(mt, d)
    chat.appendChild(wrap)
  } else {
    chat.appendChild(d)
  }
  chat.scrollTop = chat.scrollHeight
  return d
}
function resolveLinkPath(p) {
  p = (p || "").trim()
  if (!p) return ""
  if (
    /^[A-Za-z]:[\\/]/.test(p) ||
    p[0] === "/" ||
    p[0] === "~" ||
    p.startsWith("\\\\")
  )
    return p
  const base = ((curConv() && curConv().cwd) || serverCwd || "").replace(
    /\/+$/,
    "",
  )
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
    const r = await fetch("/api/open-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: abs }),
    })
    const j = await r.json()
    if (!j.ok) alert(errText(j, t) || t("file.openFail") + abs)
  } catch (e) {
    alert(t("file.openFail") + abs)
  }
}
function decorateMath(el) {
  el.querySelectorAll(".math[data-tex]").forEach((m) => {
    if (m.querySelector("[data-mathcopy]")) return
    const b = document.createElement("button")
    b.type = "button"
    b.setAttribute("data-mathcopy", "")
    b.title = t("act.mathCopy")
    b.innerHTML = ICON_COPY
    b.onclick = async (e) => {
      e.stopPropagation()
      flashCopy(
        b,
        mathCopyText(m.dataset.tex || "", m.classList.contains("math-block")),
      )
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
    b.title = t("act.copy")
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
      [...tr.cells].map((td) => td.textContent),
    )
    const b = document.createElement("button")
    b.type = "button"
    b.setAttribute("data-tblcopy", "")
    b.title = t("act.tableCopy")
    b.innerHTML = ICON_COPY
    const menu = document.createElement("div")
    menu.className = "tblmenu"
    menu.hidden = true
    ;[
      ["md", t("msg.tableMd")],
      ["csv", "CSV"],
    ].forEach(([fmt, label]) => {
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
