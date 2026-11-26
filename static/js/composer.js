"use strict"
// == muse-gui/js/composer.js ==
// Input box, slash menu, chips, feats, yolo entry.
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
    slashIdx =
      (slashIdx + (e.key === "ArrowUp" ? -1 : 1) + bs.length) % bs.length
    bs.forEach((b, i) => b.classList.toggle("sel", i === slashIdx))
    if (bs[slashIdx] && bs[slashIdx].scrollIntoView)
      bs[slashIdx].scrollIntoView({ block: "nearest" })
  } else if (popup && e.key === "Tab") {
    e.preventDefault()
    const sel = slash.querySelector("button.sel")
    if (sel) sel.click()
  } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    $("#f").requestSubmit()
  }
})
function autoGrow() {
  input.style.height = "auto"
  const h = input.scrollHeight
  input.style.height = Math.min(h, 132) + "px"
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
  web: '<span class="ficon"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg></span>',
}
const FEATS = {
  viz: {
    chip: "시각화",
    prefix:
      "[시각화 요청] 답변에 인터랙티브 시각화가 필요하면 설명과 함께 아래 형식 코드블록을 포함하라.\n```viz-html\n(외부 CDN 없이 동작하는 단일 HTML 문서. <script> 사용 가능. sandbox라서 same-origin 접근·팝업·다운로드 불가)\n```\n높이는 ```viz-html:높이 로 지정(기본 360). 시각화가 필요 없으면 생략해도 된다.",
  },
  web: {
    chip: "웹 검색",
    prefix:
      "[웹 검색 필수] 아래 요청에 답하기 전에 반드시 웹 검색을 수행하고 검색 결과와 함께 답하라. 검색 없이 알던 내용으로 답하지 마라. 사용한 검색어와 핵심 근거를 밝혀라. 근거가 된 문장 끝에는 [출처: 사이트명](URL) 형태로 표기하라.",
  },
  autoanswer: {
    chip: "자동 응답",
    prefix:
      "[자동 응답] 작업 중 선택이 필요하면 사용자에게 묻지 말고 권장(기본) 선택지로 진행하고, 무엇을 선택했는지 결과에 밝혀라. 되돌릴 수 없는 파괴적 조치는 제외하고, 그 경우에만 질문하라.",
  },
}
const DOCK_FEATURES = [
  {
    id: "viz",
    label: "시각화",
    desc: "인터랙티브 패널로 답변 요청",
    ready: true,
    feat: "viz",
  },
  {
    id: "web",
    label: "웹 검색",
    desc: "반드시 검색 후 답변",
    ready: true,
    feat: "web",
  },
  {
    id: "autoanswer",
    label: "자동 응답",
    desc: "선택지를 묻지 않고 권장안으로 진행",
    ready: true,
    feat: "autoanswer",
  },
  { id: "upload", label: "파일 업로드", desc: "준비 중", ready: false },
]
function addFeat(id) {
  if (!FEATS[id] || document.querySelector('#feats [data-f="' + id + '"]'))
    return
  const s = document.createElement("span")
  s.className = "fchip"
  s.dataset.f = id
  s.innerHTML =
    (FEAT_ICONS[id] || "") + "<span>" + esc(FEATS[id].chip) + "</span> "
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
  return [...document.querySelectorAll("#feats .fchip")].map(
    (c) => FEATS[c.dataset.f].prefix,
  )
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
    if (f.ready)
      b.onclick = (e) => {
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
