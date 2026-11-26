"use strict";
// == muse-gui/js/thoughts.js ==
// Thought-block live/static render, toggle, head, collect.
function thoughtIcon(type) {
  return { reason: ICON_TREASON, terminal: ICON_TERM, web: ICON_TWEB, file: ICON_TFILE, system: ICON_TSYS, tool: ICON_TSYS }[type] || ICON_TSYS
}
function setRowSummary(r, text) {
  const s = truncStr(text, 140) || t("th.working")
  r.sum.textContent = s
  r.el.dataset.sum = s
}
function staticRowNote(r, type, tstate) {
  if (type !== "reason" && type !== "system") return
  if (r.det.children.length) return
  const label = type === "reason" ? t("th.thinking") : t("th.termwork")
  setRowSummary(r, label)
  addThoughtLog(r, label, label)
  r.el.dataset.static = "1"
  r.tgl.hidden = true
  const sub = r.det.lastChild
  const stg = sub ? sub.querySelector(".ttoggle") : null
  if (stg) stg.hidden = true
  tstate.last = label
  updateThoughtHead(tstate)
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
  lab.textContent = t("th.type." + type)
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
  let d = 0, m = 0
  const counts = { terminal: 0, file: 0, reason: 0, other: 0 }
  st.rows.forEach((r) => {
    m++
    if (r.done) d++
    if (r.type === "terminal") counts.terminal++
    else if (r.type === "file") counts.file++
    else if (r.type === "reason") counts.reason++
    else counts.other++
  })
  if (m === 0) return
  if (d >= m) st.headSum.textContent = thoughtSummary(langCur === "en", counts)
  else st.headSum.textContent = truncStr(st.last || t("th.preparing"), 140)
  if (st.headSpin) st.headSpin.style.display = d >= m ? "none" : ""
}
function updateThoughtHead(tstate) {
  if (tstate && tstate.tbox) syncThoughtHead(tstate.tbox)
}
function loadFullLog(btn, callId) {
  btn.disabled = true
  btn.textContent = t("th.loading")
  const q = "call_id=" + encodeURIComponent(callId) + (sessionId ? "&session_id=" + encodeURIComponent(sessionId) : "")
  fetch("/api/tool_output?" + q).then((r) => r.json()).then((j) => {
    if (!j.ok) throw new Error(j.error || "failed")
    const box = btn.closest(".tsubbody")
    const log = box ? box.querySelector(".tlog") : null
    if (log) log.textContent = j.text + (j.truncated ? "\n[" + t("th.cut") + "]" : "")
    btn.remove()
  }).catch((e) => {
    btn.textContent = String((e && e.message) || e)
    btn.disabled = false
  })
}
function addThoughtLog(r, head, body, extra) {
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
  if (r.type === "file" && isDiffText(txt)) { pre.innerHTML = diffLinesHtml(txt); pre.classList.add("diff"); }
  else pre.textContent = txt;
  bd.appendChild(pre)
  if (extra && extra.callId) {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "tfullbtn"
    btn.textContent = t("th.fulllog")
    btn.dataset.call = extra.callId
    btn.onclick = () => loadFullLog(btn, extra.callId)
    bd.appendChild(btn)
  }
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
      if (!oc || oc === "success") return
      setRowSummary(r, (r.el.dataset.sum || "") + t("th.failed"))
      const head = "tool_result · " + oc
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
    const type = thoughtKind(tk, "")
    const r0 = ensureThoughtRow(tbox, tstate, tid, type, tk || t("th.task"))
    staticRowNote(r0, type, tstate)
    return
  }
  let r = tstate.rows.get(tid)
  if (!r) {
    const type0 = thoughtKind("", te.operation || "")
    r = ensureThoughtRow(tbox, tstate, tid, type0, te.operation || t("th.task"))
    staticRowNote(r, type0, tstate)
  }
  if (ek === "accepted" || ek === "scheduled" || ek === "started") return
  if (ek === "side_effect_intent") {
    if (te.idempotency_key) r.idem = te.idempotency_key
    return
  }
  if (ek === "status" && te.message) {
    if (r.type === "reason" || r.type === "system") return
    setRowSummary(r, te.message)
    tstate.last = te.message
    const phase = (te.details || {}).phase || ""
    addThoughtLog(r, te.message, phase ? te.message + "\n[" + phase + "]" : te.message)
    updateThoughtHead(tstate)
    return
  }
  if (ek === "output" && typeof te.chunk === "string") {
    let sum = null, body = te.chunk, fullKey = ""
    try {
      const o = JSON.parse(te.chunk)
      if (o && typeof o === "object") {
        const cmd = o.command || o.tool || ""
        const desc = o.description || o.desc || ""
        sum = (desc || cmd || t("th.output")) +
          (o.exit_code !== undefined && o.exit_code !== null ? t("th.exit") + o.exit_code : "")
        if (r.type === "terminal" && typeof o.output === "string") {
          body = (cmd ? "$ " + cmd + "\n" : "") + o.output
          if (isOutputTruncated(o)) {
            const ck = String(r.idem || "").replace(/^tool:/, "")
            if (/^[A-Za-z0-9_-]+$/.test(ck)) fullKey = ck
          }
        }
      }
    } catch (e) {}
    if (r.type === "file") body = diffOnly(body)
    if (sum) setRowSummary(r, sum)
    tstate.last = sum || t("th.output")
    addThoughtLog(r, sum || t("th.output"), body, fullKey ? { callId: fullKey } : null)
    updateThoughtHead(tstate)
    return
  }
  if (ek === "completed" || ek === "settled") {
    markThoughtDone(r)
    updateThoughtHead(tstate)
  }
}
function collectThoughts(tbox) {
  const out = []
  tbox.querySelectorAll(".trow").forEach((r) => {
    const th = { k: r.dataset.type || "tool", s: r.dataset.sum || "" }
    if (r.dataset.static) th.static = true
    const det = r.nextElementSibling
    if (det && det.classList && det.classList.contains("tdetail")) {
      const subs = []
      det.querySelectorAll(".tsub").forEach((sub) => {
        if (subs.length >= 20) return
        const h = sub.querySelector(".tsubhead .tsum")
        const logEl = sub.querySelector(".tsubbody .tlog")
        let bt = ""
        if (logEl) {
          const kids = Array.from(logEl.children).filter((c) => c.tagName === "SPAN")
          bt = kids.length ? kids.map((x) => x.textContent).join("\n") : (logEl.textContent || "")
        }
        subs.push({ h: (h ? h.textContent : "").slice(0, 80), b: bt.slice(0, 1000) })
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
    st.headSum.textContent = t("th.none")
    if (st.headSpin) st.headSpin.style.display = "none"
  }
  syncThoughtHead(tbox)
}
function renderThoughtsStatic(thoughts) {
  const items = thoughts || []
  if (!items.length) return ""
  let rows = ""
  items.forEach((th) => {
    const lab = t("th.type." + (th.k || "tool"))
    const subs = Array.isArray(th.d) ? th.d : []
    let det = ""
    if (subs.length) {
      let sh = ""
      subs.forEach((s) => {
        const bt = String(s.b || "")
        const isD = th.k === "file" && isDiffText(bt)
        const bh = isD ? diffLinesHtml(bt) : esc(bt)
        sh += '<div class="tsub tsub-' + esc(String(th.k || "tool")) + '"><button type="button" class="tsubhead" data-ttoggle title="펼치기/접기">' +
          '<span class="tsum">' + esc(s.h || "로그") + '</span><span class="ttoggle"' + (th.static ? " hidden" : "") + ">›</span></button>" +
          '<div class="tsubbody" hidden><div class="tlog' + (isD ? " diff" : "") + '">' + bh + "</div></div></div>"
      })
      det = '<div class="tdetail" hidden>' + sh + "</div>"
    }
    rows += '<div class="trow t-' + esc(String(th.k || "tool")) + ' done"' + (th.static ? ' data-static="1"' : "") + ">" +
      '<span class="ticon">' + thoughtIcon(th.k) + "</span>" +
      '<span class="ttype">' + esc(lab) + "</span>" +
      '<span class="tspin"></span><span class="tsum">' + esc(th.s || "") + "</span>" +
      (subs.length && !th.static ? '<button type="button" class="ttoggle" data-ttoggle title="펼치기/접기">›</button>' : "") +
      "</div>" + det
  })
  const counts = { terminal: 0, file: 0, reason: 0, other: 0 }
  items.forEach((t) => {
    if (t.k === "terminal") counts.terminal++
    else if (t.k === "file") counts.file++
    else if (t.k === "reason") counts.reason++
    else counts.other++
  })
  return '<div class="thoughts static"><div class="thead">' +
    '<span class="ttype">통합</span>' +
    '<span class="tsum">' + esc(thoughtSummary(langCur === "en", counts)) + "</span>" +
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
    if (!host) return
    if (host.dataset.static) return
    det = host.nextElementSibling
  }
  if (!det || !(det.classList.contains("tsubbody") || det.classList.contains("tdetail") || det.classList.contains("tbody"))) return
  det.hidden = !det.hidden
  if (mark) mark.classList.toggle("open", !det.hidden)
  const box = tg.closest(".thoughts")
  if (box) syncThoughtHead(box)
}
