"use strict";
// == muse-gui/js/ui.js ==
// Sidebar, rside, modal, settings, themes, skills, fs modal handled elsewhere.
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
// 우측 탭 규칙: 기본적으로 탭은 존재하지 않는다. goal 탭은 대화에 목표가
// 생길 때, help 탭은 /help 실행 때 생긴다. files 탭은 헤더 '파일' 버튼이
// 있으므로 항상 있다. 앞으로 추가될 탭도 같은 규칙: 존재 조건 + 렌더 함수
// + closable 여부를 아래에 등록한다.
const RSIDE_TABS = {
  goal: { label: "goal", render: () => renderGoal() },
  help: { label: "help", render: () => renderHelp(), closable: true, onClose: () => {
    helpOpen = false
  } },
  files: { label: "files", render: () => renderFiles() },
  agents: { label: "agents", render: () => renderAgents() },
}
let rsideTab = null
let helpOpen = false
let rsideHold = false;
// user-collapsed (suppress auto-open)
function availTabs() {
  const t = []
  if (curConv() && curConv().goal) t.push("goal")
  if (helpOpen) t.push("help")
  t.push("files")
  t.push("agents")
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
const FOLDER_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
const TRASH_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
document.querySelector("#rsidefiles").addEventListener("click", async (e) => {
  const del = e.target.closest("[data-fdel]")
  if (del) {
    if (!confirm(t("files.delAsk") + "\n" + (del.dataset.fname || ""))) return
    const c = (typeof curConv === "function") ? curConv() : null
    const cwd = (c && c.cwd) || ((typeof serverCwd !== "undefined") ? serverCwd : "") || ""
    try {
      const r = await fetch("/api/file/delete", { method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cwd, path: del.dataset.fdel }) })
      const j = await r.json()
      if (!j.ok) alert("삭제 실패: " + (j.error || ""))
    } catch (err) {
      alert("삭제 실패")
    }
    renderFiles()
    return
  }
  const op = e.target.closest("[data-fopen]")
  if (op) openAgentFile(op.dataset.fopen || "")
})
document.querySelector("#rsideagents").addEventListener("click", async (e) => {
  const ss = e.target.closest("[data-ssenter]")
  if (ss) {
    const raw = ss.dataset.ssenter || ""
    const bar = raw.indexOf("|")
    const ck = bar >= 0 ? raw.slice(0, bar) : ""
    const said = bar >= 0 ? raw.slice(bar + 1) : ""
    const parent = convs.find((c) => c.k === ck)
    const rec = parent && (subRecs[parent.sid] || []).find((r) => r.subagent_id === said)
    if (parent && rec) openSubSession(parent, rec)
    return
  }
})
let liveAgents = []
let agentsTimer = null
let agentsFetchAt = 0
let agentsInflight = false
const agentOpen = new Set()
let subRecs = {}
async function refreshSubAgents() {
  const cur = (typeof curConv === "function") ? curConv() : null
  const sids = (cur && cur.sid) ? [cur.sid] : []
  if (!sids.length) { subRecs = {}; return true }
  try {
    const r = await fetch("/api/subagents", { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sids }) })
    const j = await r.json()
    if (j && j.ok) { subRecs = j.parents || {}; return true }
  } catch (e) {}
  return false
}
function fmtSubTime(at) {
  try {
    return new Date(Math.floor((+at || 0) / 1000)).toLocaleString()
  } catch (e) { return "" }
}
function openSubSession(parent, rec) {
  if (!parent || !rec) return
  const key = "c" + Date.now()
  const label = rec.agent_path || (rec.subagent_id || "").slice(0, 8)
  const seedNote = "[서브세션] " + label + " 기록 기반 (상태: " + rec.state + ")"
  const seed = "[서브에이전트 기록 기반] 아래는 부모 세션에서 실행된 서브에이전트의 작업 기록이다.\n" +
    "서브에이전트: " + label + " (상태 " + rec.state + ", 작업 " + (rec.task_ref || "?") + ").\n" +
    "부모 작업 디렉터리와 동일한 환경에서 이어서 작업하라."
  convs.unshift({ k: key, t: seedNote.slice(0, 60), sid: null, cwd: parent.cwd,
    msgs: [{ who: "ai", text: seedNote, ts: Date.now(), el: "", th: null, atts: null }],
    at: Date.now(), createdAt: Date.now(),
    sub: { parent: parent.k, seed, used: false } })
  persistConvs()
  openConv(key)
}
function pollAgentsForList() {
  if (typeof refreshLiveAgents !== "function" || typeof drawConvs !== "function") return
  if (agentsInflight || Date.now() - agentsFetchAt < 15000) return
  agentsInflight = true
  agentsFetchAt = Date.now()
  refreshLiveAgents().then(() => {
    agentsInflight = false
    drawConvs()
  }).catch(() => { agentsInflight = false })
}
async function refreshLiveAgents() {
  try {
    const r = await fetch("/api/agents")
    const j = await r.json()
    if (j && j.ok) { liveAgents = j.agents || []; return true }
  } catch (e) {}
  return false
}
function agentChildren(sid) {
  return liveAgents.filter((a) => a.sideOf && a.sideOf === sid)
}
async function adoptSession(sid) {
  if (!sid) return
  const hit = (typeof convs !== "undefined") ? convs.find((x) => x.sid === sid) : null
  if (hit) { openConv(hit.k); return }
  let cwd = ""
  try {
    const r = await fetch("/api/session_workspace?session_id=" + encodeURIComponent(sid))
    const j = await r.json()
    if (j && j.ok) cwd = j.cwd || ""
  } catch (e) {}
  if (!cwd) { alert(t("agents.noCwd")); return }
  convKey = "c" + Date.now()
  sessionId = sid
  convs.unshift({ k: convKey, t: t("conv.adopted"), sid, cwd, msgs: [], at: Date.now(), createdAt: Date.now() })
  persistConvs()
  openConv(convKey)
}
async function renderAgents() {
  if (agentsTimer) { clearInterval(agentsTimer); agentsTimer = null }
  const box = $("#rsideagents")
  if (!box) return
  box.innerHTML = "<h3>agents</h3><p class='hint'>" + esc(t("agents.loading")) + "</p>"
  const okLive = await refreshLiveAgents()
  const ok = await refreshSubAgents()
  if (rsideTab !== "agents") return
  if (!ok && !Object.keys(subRecs).length) {
    box.innerHTML = "<h3>agents</h3><p class='hint'>" + esc(t("agents.fail")) + "</p>"
    return
  }
  const cur = (typeof curConv === "function") ? curConv() : null
  const curSid = (cur && cur.sid) || ""
  const all = []
  convs.forEach((p) => {
    if (!p.sid || p.sid !== curSid) return
    ;(subRecs[p.sid] || []).forEach((r) => all.push({ p, r }))
  })
  all.sort((a, b) => (b.r.at || 0) - (a.r.at || 0))
  let html = "<h3>agents</h3>"
  if (!all.length) {
    html += "<p class='hint'>" + esc(t("agents.empty")) + "</p>"
  } else {
    html += "<ul class='flist'>"
    all.forEach(({ p, r }) => {
      const label = r.agent_path || (r.subagent_id || "").slice(0, 8)
      html += "<li class='frow'><span class='sdot st-" + escAttr(r.state) + "' title='" +
        escAttr(t("agents.state_" + r.state)) + "'></span>" +
        "<button type='button' class='fname' data-ssenter='" + escAttr(p.k + "|" + r.subagent_id) +
        "' title='" + escAttr(t("agents.enter")) + "'>" + esc(label) + "</button>" +
        " <span class='fsize'>" + esc(p.t || "") + " · " + esc(fmtSubTime(r.at)) + "</span></li>"
    })
    html += "</ul>"
  }
  box.innerHTML = html
  drawConvs()
  agentsTimer = setInterval(async () => {
    if (rsideTab !== "agents" || !$("#rsideagents")) {
      if (agentsTimer) { clearInterval(agentsTimer); agentsTimer = null }
      return
    }
    await refreshLiveAgents()
    await refreshSubAgents()
    if (rsideTab === "agents") renderAgents()
  }, 5000)
  void okLive
}
function fmtSize(n) {
  n = +n || 0
  if (n < 1024) return n + " B"
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB"
  return (n / 1024 / 1024).toFixed(1) + " MB"
}
async function renderFiles() {
  const box = $("#rsidefiles")
  if (!box) return
  const c = (typeof curConv === "function") ? curConv() : null
  const cwd = (c && c.cwd) || ((typeof serverCwd !== "undefined") ? serverCwd : "") || ""
  box.innerHTML = "<h3>files</h3><p class='hint'>" + esc(t("files.loading")) + "</p>"
  let j = null
  try {
    const r = await fetch("/api/agent-files?cwd=" + encodeURIComponent(cwd))
    j = await r.json()
  } catch (e) { j = null }
  if (!j || !j.ok) {
    box.innerHTML = "<h3>files</h3><p class='hint'>" + esc(t("files.fail")) + "</p>"
    return
  }
  const base = j.cwd || cwd
  let html = "<h3>files</h3>"
  j.groups.forEach((g, gi) => {
    html += "<details class='fgroup'" + (gi === 0 ? " open" : "") + "><summary><span class='ficon'>" +
      FOLDER_ICON + "</span>" + esc(g.label) + " <span class='fcount'>" + g.files.length + "</span></summary>"
    if (!g.files.length) {
      html += "<p class='hint'>" + esc(t("files.empty")) + "</p>"
    } else {
      html += "<ul class='flist'>"
      g.files.forEach((f) => {
        const img = /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name)
        html += "<li class='frow'><button type='button' class='fname' data-fopen='" +
          escAttr(f.path) + "'>" +
          (img ? "🖼 " : "📄 ") + esc(f.name) + "</button> <span class='fsize'>" +
          esc(fmtSize(f.size)) + "</span>" +
          "<button type='button' class='fdel' data-fdel='" + escAttr(f.path) +
          "' data-fname='" + escAttr(f.name) + "' title='" + escAttr(t("files.del")) + "'>" +
          TRASH_ICON + "</button></li>"
      })
      html += "</ul>"
    }
    html += "</details>"
  })
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
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { hideCtx()
hideModal()
hideFsPicker()
hideSortMenu()
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
