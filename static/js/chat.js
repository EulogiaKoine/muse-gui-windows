"use strict";
// == muse-gui/js/chat.js ==
// Message edit/copy, chat stream, turn completion, send flow.
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
  msgEl.classList.add("editing")
  const mi0 = +(msgEl.dataset.mi ?? -1)
  const cc0 = (typeof curConv === "function") ? curConv() : null
  const srcAtts = (cc0 && cc0.msgs[mi0] && cc0.msgs[mi0].atts) || []
  msgEl._editAtts = srcAtts.slice()
  msgEl.innerHTML = '<div class="editatt"></div><textarea class="medit">' + esc(old) + "</textarea>" +
    '<div class="meditbar"><button type="button" class="optbtn" data-msave>저장</button>' +
    '<button type="button" class="optbtn" data-mcancel>취소</button></div>'
  const renderEditAtts = () => {
    const box = msgEl.querySelector(".editatt")
    if (!box) return
    box.innerHTML = ""
    if (!msgEl._editAtts.length) { box.style.display = "none"; return }
    box.style.display = ""
    msgEl._editAtts.forEach((a, i) => {
      const s = document.createElement("span")
      s.className = "achip"
      s.innerHTML = "<span>" + esc((a && a.name) || "?") + "</span> "
      const x = document.createElement("button")
      x.type = "button"
      x.textContent = "×"
      x.title = "제거"
      x.onclick = (e) => {
        e.stopPropagation()
        msgEl._editAtts.splice(i, 1)
        renderEditAtts()
      }
      s.appendChild(x)
      box.appendChild(s)
    })
  }
  renderEditAtts()
  const ta = msgEl.querySelector(".medit")
  if (ta) {
    ta.focus()
    try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (e) {}
  }
  editingEl = msgEl
}
function cancelEdit(msgEl) {
  if (!msgEl) return
  msgEl.classList.remove("editing")
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
  msgEl.classList.remove("editing")
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
  branchFromMessage(c, mi, newText, (msgEl._editAtts || []).slice())
}
async function branchFromMessage(c, mi, newText, atts) {
  const oldSid = c.sid || sessionId
  c.msgs[mi] = { who: "me", text: newText, ts: Date.now(), el: "", atts: (atts && atts.length) ? atts : null }
  c.msgs.length = mi + 1
  pendingAtts = ((atts && atts.length) ? atts.slice() : []).concat(pendingAtts)
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
  c.msgs.forEach((m) => {
    const ex = {}
    if (m.th) ex.thoughts = m.th
    if (m.atts && m.atts.length) ex.atts = m.atts
    addMsg(m.who, m.text, null, footFor(m), undefined, Object.keys(ex).length ? ex : null)
  })
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
chat.addEventListener("click", async (e) => {
  const tgl = e.target.closest("[data-ttoggle]")
  if (tgl) {
    toggleThoughtDetail(tgl)
    return
  }
  const hd = e.target.closest(".thead, .tsubhead")
  if (hd) {
    const btn = hd.querySelector("[data-ttoggle]")
    if (btn && !btn.hidden) toggleThoughtDetail(btn)
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
          branchFromMessage(c, mi, c.msgs[mi].text, (c.msgs[mi].atts || []).slice())
        } else if (msgEl.classList.contains("ai")) {
          let qi = -1
          for (let q = Math.min(mi, c.msgs.length - 1); q >= 0; q--) {
            if (c.msgs[q] && c.msgs[q].who === "me") {
              qi = q
              break
            }
          }
          if (qi >= 0) branchFromMessage(c, qi, c.msgs[qi].text, (c.msgs[qi].atts || []).slice())
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
  const oa = e.target.closest("[data-openatt]")
  if (oa) {
    openAgentFile(oa.dataset.openatt || "")
    return
  }
  const b = e.target.closest("[data-copy]")
  if (!b) return
  flashCopy(b, b.closest(".msg").dataset.raw || "")
})
function notifyCompletion(title, body) {
  try {
    if (typeof Notification === "undefined") return false
    if (!shouldNotifyCompletion(Notification.permission, document.hidden)) return false
    const n = new Notification(title, { body: truncStr(body || "", 140) })
    n.onclick = () => {
      try { window.focus(); n.close(); } catch (e) {}
    };
    return true
  } catch (e) { return false }
}
const busyConvs = new Set()
let activeTurnConv = null
function turnIsCurrent(conv) {
  return !conv || conv === curConv()
}
function famRoot(c) {
  return (c && c.sub && c.sub.parent) || (c && c.k)
}
function isFamilyConv(a, b) {
  if (!a || !b || a.k === b.k) return false
  const ra = famRoot(a), rb = famRoot(b)
  return ra === b.k || rb === a.k || ra === rb
}
function goalPendingIn(cc) {
  const g = cc && cc.goal
  return (g && g.active && g.items && g.items.some((x) => !x.done)) ? g : null
}
function finishAiTurn(j, ph, goalMode, conv) {
  const cc = conv || curConv()
  if (cc && j.session_id) cc.sid = j.session_id
  if (turnIsCurrent(conv)) sessionId = j.session_id || sessionId
  let justDone = null, th = null
  if (goalMode) {
    const gf = goalFence(j.text || "", goalMode)
    const gcc = cc
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
    if (cc) {
      cc.cwd = j.cwd
      persistConvs()
    }
    if (turnIsCurrent(conv)) $("#cwd").textContent = j.cwd
  }
  const tbox = ph._tbox || null
  if (tbox) {
    markThoughtsDone(tbox)
    th = collectThoughts(tbox)
  }
  ph.dataset.raw = j.text || "(빈 응답)"
  ph.innerHTML = renderText(ph.dataset.raw) + '<div class="acts"><button type="button" data-copy title="복사">' + ICON_COPY + "</button></div>"
  if (!(goalMode && goalPendingIn(cc))) notifyCompletion("muse-gui · 응답 완료", ph.dataset.raw)
  if (tbox) ph.prepend(tbox)
  decorateCode(ph)
  decorateMath(ph)
  decorateTables(ph)
  return { justDone, th }
}
function saveMsgTo(c, who, text, meta) {
  if (!c) { saveMsg(who, text, meta); return }
  const keepKey = convKey, keepSid = sessionId
  try {
    const idx = convs.findIndex((x) => x.k === c.k)
    if (idx < 0) { saveMsg(who, text, meta); return }
    convKey = c.k
    sessionId = c.sid || null
    saveMsg(who, text, meta)
  } finally {
    convKey = keepKey
    sessionId = keepSid
  }
}
function sealAiTurn(ph, t0, fr, conv) {
  const el = ((Date.now() - t0) / 1000).toFixed(1)
  const foot = timeStr(t0) + " · " + el + "초"
  ph.innerHTML += '<div class="meta">' + esc(foot) + "</div>"
  saveMsgTo(conv || curConv(), "ai", ph.dataset.raw || "", { ts: t0, el, th: fr.th })
  if (fr.justDone) {
    if (turnIsCurrent(conv)) addMsg("ai", "🏁 목표 달성: " + fr.justDone)
    saveMsgTo(conv || curConv(), "ai", "🏁 목표 달성: " + fr.justDone, { ts: Date.now() })
  }
}
async function postChatStream(message, sid, cwd, signal, onRun, atts) {
  const r = await fetch("/api/chat/stream", { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sid, cwd,
      attachments: atts || [] }),
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
let goalAutoN = 0
const GOAL_AUTO_CAP = 6
function goalPending() {
  const c = (typeof curConv === "function") ? curConv() : null
  const g = c && c.goal
  return (g && g.active && g.items && g.items.some((x) => !x.done)) ? g : null
}
function makeTurnPh(turnConv) {
  if (turnIsCurrent(turnConv)) return addMsg("ai", "응답 생성 중…", null, null, false)
  const d = document.createElement("div")
  d.className = "msg ai"
  d.dataset.raw = "응답 생성 중…"
  return d
}
function markBusy(conv, on) {
  if (!conv) return
  if (on) busyConvs.add(conv.k)
  else busyConvs.delete(conv.k)
  drawConvs()
}
async function goalAutoChain(goalMode, j, conv) {
  if (!goalMode) return
  const cc = conv || curConv()
  const g = goalPendingIn(cc)
  if (!g) { goalAutoN = 0; return }
  if (goalAutoN >= GOAL_AUTO_CAP) {
    goalAutoN = 0
    const msg = t("goal.autoCap")
    if (turnIsCurrent(conv)) {
      addMsg("ai", msg)
      chat.scrollTop = chat.scrollHeight
    }
    saveMsgTo(cc, "ai", msg)
    drawConvs()
    notifyCompletion("muse-gui · 응답 완료", msg)
    return
  }
  if (/실패|시간 초과|전송 실패|empty/i.test(j.text || "")) {
    goalAutoN = 0
    notifyCompletion("muse-gui · 응답 완료", j.text || "")
    return
  }
  goalAutoN++
  const cwd = (cc && cc.cwd) || serverCwd || ""
  const ph = makeTurnPh(cc)
  const t0 = Date.now()
  try {
    touchLive()
    await runStreamTurn(goalTurnPrompt(g, "이어서 계속 진행하라. 사용자에게 되묻지 말고 다음 단계로 넘어가고, 각 단계 완료 시 goal-status 펜스를 출력하라."), (cc && cc.sid) || sessionId, cwd, ph, t0, "status", null, cc)
  } catch (err) {
    const alt = "자동 계속 실패: " + err
    finishAiTurn({ text: alt, session_id: null }, ph, null, cc)
    sealAiTurn(ph, t0, { text: alt, session_id: null }, cc)
  }
}
async function runStreamTurn(full, sid, cwd, ph, t0, goalMode, atts, turnConv) {
  const tbox = document.createElement("div")
  tbox.className = "thoughts"
  const thead = document.createElement("div")
  thead.className = "thead"
  thead.innerHTML = '<span class="tspin"></span><span class="ttype" hidden>통합</span>' +
    '<span class="tsum">' + esc(t("th.preparing")) + "</span>" +
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
  const tc = turnConv || curConv()
  const ctl = new AbortController()
  activeStreamAbort = ctl
  activeTurnConv = tc
  setSendStop(true)
  markBusy(tc, true)
  try {
    const j = await postChatStream(full, sid, cwd, ctl.signal, (ev) => updateThought(tbox, tstate, ev), atts)
    clearSentAtts(atts)
    const fr = finishAiTurn(j, ph, goalMode, tc)
    sealAiTurn(ph, t0, fr, tc)
    await goalAutoChain(goalMode, j, tc)
  } catch (err) {
    const aborted = err && err.name === "AbortError"
    const base = tstate.texts.join("").trim()
    const alt = base ? base + (aborted ? "\n\n[중단됨]" : "") : "전송 실패: " + err
    const fr = finishAiTurn({ text: alt, session_id: null }, ph, null, tc)
    sealAiTurn(ph, t0, fr, tc)
  } finally {
    if (activeStreamAbort === ctl) activeStreamAbort = null
    if (activeTurnConv === tc) activeTurnConv = null
    setSendStop(false)
    markBusy(tc, false)
  }
}
$("#f").addEventListener("submit", async (e) => {
  e.preventDefault()
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      const pr = Notification.requestPermission()
      if (pr && pr.catch) pr.catch(() => {})
    }
  } catch (err) {}
  if (activeStreamAbort) {
    const cur = curConv()
    if (input.value.trim() && activeTurnConv && cur && isFamilyConv(activeTurnConv, cur)) {
      addMsg("ai", t("send.famBusy"))
      chat.scrollTop = chat.scrollHeight
      return
    }
    try { activeStreamAbort.abort(); } catch (err) {} return
  }
  goalAutoN = 0
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
  const isSlashCmd = text.startsWith("/") && sendText === null
  const atts = isSlashCmd ? [] : pendingAtts.slice()
  const cc0 = curConv()
  const seedPre = (!isSlashCmd && cc0 && cc0.sub && !cc0.sub.used && cc0.sub.seed) ? cc0.sub.seed + "\n\n" : ""
  saveConv(text.slice(0, 30))
  const meTs = Date.now()
  if (skipEcho) skipEcho = false
  else { addMsg("me", text, null, timeStr(meTs), true, atts.length ? { atts } : null); saveMsg("me", text, { ts: meTs, atts: atts.length ? atts : null }); }
  if (text === "/copy" || text.startsWith("/copy ")) {
    const done = (await copyText(lastAiText())) ? "복사했습니다." : "복사할 답변이 없습니다."
    addMsg("ai", done)
    saveMsg("ai", done)
    drawConvs()
    return
  }
  const ph = addMsg("ai", "응답 생성 중…", null, null, false)
  const t0 = Date.now()
  const tc0 = curConv()
  activeTurnConv = tc0
  markBusy(tc0, true)
  try {
    const cc0 = curConv()
    touchLive()
    const cwd = (cc0 && cc0.cwd) || serverCwd || ""
    if (seedPre && cc0 && cc0.sub) { cc0.sub.used = true; persistConvs() }
    if (text.startsWith("/") && sendText === null) {
      const r = await fetch("/api/chat", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: seedPre + full, session_id: sessionId, cwd,
          attachments: atts }) })
      const j = await r.json()
      clearSentAtts(atts)
      if (j.text === "__COPY__") {
        const prev = [...chat.querySelectorAll(".msg.ai")].filter((n) => n !== ph).pop()
        ph.dataset.raw = await copyText(prev ? prev.dataset.raw || "" : "")
        ph.innerHTML = esc(ph.dataset.raw)
      } else if (j.new_session) { sessionId = null; convKey = null; userFreshStart = true; chat.innerHTML = ""; $("#cwd").textContent = serverCwd; setRoute("/"); updateGate(); drawRside(); }
      else {
        const fr = finishAiTurn(j, ph, goalMode, tc0)
        sealAiTurn(ph, t0, fr, tc0)
      }
      drawConvs()
      refreshPrefs()
      chat.scrollTop = chat.scrollHeight
    } else {
      await runStreamTurn(seedPre + full, sessionId, cwd, ph, t0, goalMode, atts, tc0)
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
    saveMsgTo(tc0, "ai", ph.dataset.raw)
  } finally {
    if (activeTurnConv === tc0) activeTurnConv = null
    markBusy(tc0, false)
  }
})
