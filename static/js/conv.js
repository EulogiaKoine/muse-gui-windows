"use strict";
// == muse-gui/js/conv.js ==
// Conversation state, list, sort UI, rename, gate, open, fs picker, nav.
"use strict"
const $ = (s) => document.querySelector(s)
const chat = $("#chat"), input = $("#in"), slash = $("#slash")
let slashList = [], slashIdx = 0, sessionId = null, convKey = null, userFreshStart = false
const MAX_MSGS = 200
function loadConvs() {
  try {
    const a = JSON.parse(localStorage.getItem("muse-gui-convs") || "[]")
    return a.map((c) => {
      const msgs = Array.isArray(c.msgs) ? c.msgs : []
      return { k: c.k, t: c.t || "새 대화",
        sid: c.sid || null, cwd: c.cwd || null, pin: !!c.pin, tManual: !!c.tManual,
        goal: c.goal && c.goal.objective ? { objective: c.goal.objective,
          items: normGoalItems(c.goal.items), active: !!c.goal.active } : null,
        at: c.at || (msgs.length && msgs[msgs.length - 1].ts) || 0,
        createdAt: c.createdAt || null,
        scroll: typeof c.scroll === "number" ? c.scroll : null,
        msgs }
    })
  } catch (e) {
    return []
  }
}
let convs = loadConvs()
let persistWarned = false
function persistConvs() {
  const save = (data) => localStorage.setItem("muse-gui-convs", JSON.stringify(data))
  try {
    save(slimConvsForSave(convs))
    return
  } catch (e) {}
  try {
    save(slimConvsForSave(convs).map((c) => ({ k: c.k, t: c.t, sid: c.sid, cwd: c.cwd, pin: c.pin, tManual: c.tManual, goal: null, at: c.at, createdAt: c.createdAt, scroll: null, msgs: (c.msgs || []).map((m) => ({ who: m.who, text: String(m.text || "").slice(0, 2000), ts: m.ts })) })))
    if (!persistWarned) { persistWarned = true; try { alert(t("conv.saveTrim")) } catch (_) {} }
  } catch (_) {
    if (!persistWarned) { persistWarned = true; try { alert(t("conv.saveFail")) } catch (_) {} }
  }
}

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
    if (title && !ex.tManual && (ex.msgs || []).length === 0) ex.t = title
  }
  else convs.unshift({ k: convKey, t: title || "새 대화", sid: null, cwd: serverCwd, msgs: [], at: Date.now(), createdAt: Date.now() })
  persistConvs()
  drawConvs()
}
function saveMsg(who, text, meta) {
  const c = curConv()
  if (!c) return
  c.msgs.push({ who, text, ts: (meta && meta.ts) || Date.now(), el: (meta && meta.el) || "", th: (meta && meta.th) || null, atts: (meta && meta.atts) || null })
  if (c.msgs.length > MAX_MSGS) c.msgs.splice(0, c.msgs.length - MAX_MSGS)
  if (sessionId) c.sid = sessionId
  c.at = Date.now()
  persistConvs()
}
let liveSessions = [];
try { liveSessions = JSON.parse(localStorage.getItem("muse-gui-live") || "[]"); } catch (e) { liveSessions = []; }
if (!Array.isArray(liveSessions)) liveSessions = [];
function persistLive() {
  try { localStorage.setItem("muse-gui-live", JSON.stringify(liveSessions.slice(0, 5))); } catch (e) {}
}
// resume-consented convs (kept across tab switches, latest N)
function keepN() {
  const n = +((loadTheme().keepN ?? 3))
  return Math.min(5, Math.max(1, n || 3))
}
function touchLive() {
  if (!convKey) return
  liveSessions = [convKey, ...liveSessions.filter((x) => x !== convKey)].slice(0, keepN())
  persistLive()
}
function inputGated() {
  const c = curConv()
  const g = gateFor(c, !!c && liveSessions.includes(c.k))
  if (g === "pick-new") return { msg: t("gate.pickNew"), btn: t("gate.pickBtn"), act: "pick-new" }
  if (g === "resume") return { msg: t("gate.resumePre") + c.sid.slice(0, 8) + (c.cwd ? " · " + c.cwd : "") + t("gate.resumePost"), btn: t("gate.resumeBtn"), act: "resume" }
  if (g === "pick") return { msg: t("gate.pick"), btn: t("gate.pickBtn"), act: "pick" }
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
function backfillCwd(c) {
  fetch("/api/session_workspace?session_id=" + encodeURIComponent(c.sid)).then((r) => r.json()).then((j) => {
    if (curConv() !== c) return
    if (j.ok && j.cwd) {
      c.cwd = j.cwd
      persistConvs()
      $("#cwd").textContent = j.cwd
    }
    updateGate()
  }).catch(() => {})
}
function openConv(k) {
  const c = convs.find((x) => x.k === k)
  if (!c) return
  saveScroll()
  convKey = c.k
  sessionId = c.sid || null
  $("#cwd").textContent = c.cwd || serverCwd || ""
  chat.innerHTML = ""
  c.msgs.forEach((m) => {
    const ex = {}
    if (m.th) ex.thoughts = m.th
    if (m.atts && m.atts.length) ex.atts = m.atts
    addMsg(m.who, m.text, null, footFor(m), undefined, Object.keys(ex).length ? ex : null)
  })
  chat.scrollTop = (typeof c.scroll === "number") ? c.scroll : chat.scrollHeight
  setRoute("/" + (c.sid || c.k))
  drawConvs()
  updateGate()
  drawRside()
  if (c.sid && !c.cwd) backfillCwd(c)
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
let renamingKey = null
function convSortMode() {
  const m = (loadTheme() || {}).convSort
  return m === "name" || m === "created" ? m : "recent"
}
function paintSortBtn() {
  const b = $("#sortbtn")
  if (!b) return
  const m = convSortMode()
  b.dataset.mode = m
  b.title = t("conv.sort." + m)
}
function orderConvs() {
  const byKey = new Map(convs.map((c) => [c.k, c]))
  const subs = convs.filter((c) => c.sub && c.sub.parent && byKey.has(c.sub.parent))
  const subKeys = new Set(subs.map((c) => c.k))
  const out = []
  sortConvs(convs.filter((c) => !subKeys.has(c.k)), convSortMode()).forEach((r) => {
    out.push(r)
    subs.filter((s) => s.sub.parent === r.k)
      .sort((a, b) => (a.at || 0) - (b.at || 0))
      .forEach((s) => out.push(s))
  })
  return out
}
function drawConvs() {
  paintSortBtn()
  const box = $("#convs")
  box.innerHTML = ""
  orderConvs().forEach((c) => {
    const row = document.createElement("div")
    row.className = "conv" + (c.pin ? " pinned" : "") + (c.sub ? " subconv" : "")
    if (c.k === renamingKey) {
      const ta = document.createElement("textarea")
      ta.className = "crename"
      ta.value = c.t
      ta.rows = 1
      const ok = document.createElement("button")
      ok.type = "button"
      ok.className = "crok"
      ok.textContent = "✓"
      ok.title = "완료"
      let finished = false
      const done = (save) => {
        if (finished || renamingKey !== c.k) return
        finished = true
        renamingKey = null
        if (save) {
          const v = ta.value.trim().slice(0, 60)
          if (v) {
            c.t = v
            c.tManual = true
            persistConvs()
          }
        }
        drawConvs()
      };
      ok.onclick = (e) => {
        e.stopPropagation()
        done(true)
      };
      ta.onkeydown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault()
          done(true)
        }
        else if (e.key === "Escape") done(false)
      };
      ta.onblur = () => done(true)
      row.append(ta, ok)
      box.appendChild(row)
      setTimeout(() => {
        ta.focus()
        try { ta.select(); } catch (e) {}
      }, 0)
      return
    }
    const b = document.createElement("button")
    b.textContent = (c.sub ? "↳ " : "") + c.t + (c.msgs.length ? " (" + c.msgs.length + ")" : "")
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
    if (c.sid && typeof agentChildren === "function") {
      const kids = agentChildren(c.sid)
      if (kids.length) {
        const open = (typeof agentOpen !== "undefined") && agentOpen.has(c.sid)
        const xb = document.createElement("button")
        xb.type = "button"
        xb.className = "cagents" + (open ? " open" : "")
        xb.textContent = "› " + kids.length
        xb.title = t("agents.toggle")
        xb.onclick = (e) => {
          e.stopPropagation()
          if (agentOpen.has(c.sid)) agentOpen.delete(c.sid)
          else agentOpen.add(c.sid)
          drawConvs()
        }
        row.appendChild(xb)
      }
    }
    row.appendChild(dots)
    box.appendChild(row)
    if (typeof pollAgentsForList === "function") pollAgentsForList()
    if (c.sid && typeof agentChildren === "function" && typeof agentOpen !== "undefined" && agentOpen.has(c.sid)) {
      agentChildren(c.sid).forEach((k) => {
        const kr = document.createElement("div")
        kr.className = "conv agentchild"
        const kb = document.createElement("button")
        kb.type = "button"
        kb.className = "ctitle"
        kb.textContent = "└ " + (k.name || k.id.slice(0, 8))
        kb.title = (k.workspace || "") + "\n" + t("agents.enter")
        kb.onclick = () => adoptSession(k.id)
        kr.appendChild(kb)
        box.appendChild(kr)
      })
    }
  })
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
    renamingKey = c.k
    drawConvs()
  } else if (act.dataset.act === "export") {
    exportConv(c)
  } else if (confirm('"' + c.t + '" 대화와 muse 세션 기록을 함께 삭제할까요?\n(실행 중인 세션은 삭제되지 않습니다)')) {
    const sid = c.sid || null
    convs = convs.filter((x) => x.k !== c.k)
    liveSessions = liveSessions.filter((x) => x !== c.k)
    persistLive()
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
const SORT_MODES = ["recent", "name", "created"]
function renderSortMenu() {
  const box = $("#sortmenu")
  if (!box) return
  const m = convSortMode()
  box.innerHTML = ""
  SORT_MODES.forEach((id) => {
    const b = document.createElement("button")
    b.type = "button"
    b.className = "sortopt"
    const mark = document.createElement("span")
    mark.className = "somark"
    mark.textContent = id === m ? "✓" : ""
    const lab = document.createElement("span")
    lab.textContent = t("conv.sort." + id)
    b.append(mark, lab)
    b.onclick = (ev) => {
      ev.stopPropagation()
      saveTheme({ convSort: id })
      drawConvs()
      hideSortMenu()
    };
    box.appendChild(b)
  })
}
function hideSortMenu() {
  const box = $("#sortmenu")
  if (box) box.hidden = true
}
$("#sortbtn").onclick = (e) => {
  e.stopPropagation()
  const box = $("#sortmenu")
  if (!box) return
  if (!box.hidden) {
    hideSortMenu()
    return
  }
  renderSortMenu()
  box.hidden = false
}
document.addEventListener("click", (e) => {
  if (!e.target.closest("#sortmenu,#sortbtn")) hideSortMenu()
})
$("#newchat").onclick = () => {
  saveScroll()
  sessionId = null
  convKey = null
  userFreshStart = true
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
      convs.unshift({ k: convKey, t: "새 대화", sid: null, cwd: p, msgs: [], at: Date.now(), createdAt: Date.now() })
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
$("#filesbtn").onclick = () => openRside("files")
