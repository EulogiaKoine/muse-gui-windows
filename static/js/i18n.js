"use strict"
// == muse-gui/js/i18n.js ==
// STR dictionary, locale state, t(), applyLang().
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
    "yolo.warn":
      "사용자 승인 절차 제거 및 샌드박스 격리 해제(작업 디렉터리 바깥 전역 접근 가능).",
    "settings.language": "언어",
    "gate.pickNew": "새 대화를 시작하려면 작업 디렉터리를 먼저 선택하세요.",
    "gate.pickBtn": "작업 디렉터리 선택",
    "gate.pick": "이 대화의 작업 디렉터리를 선택해야 입력할 수 있습니다.",
    "gate.resumePre": "세션 ",
    "gate.resumePost":
      " — 이 디렉터리에서 내부 프로세스로 이어가려면 버튼을 누르세요.",
    "gate.resumeBtn": "이 세션 이어가기(내부 프로세스 재개)",
    "rside.empty": "열린 탭이 없습니다",
    "rside.emptyHint": "/goal · /help 로 탭을 여세요",
    "cwd.label": "작업 경로",
    "goal.emptyHtml":
      "진행 중인 목표가 없습니다.<br><code>/goal 목표 내용</code> 으로 시작하세요.",
    "chip.struct": "이 폴더 구조 설명해줘",
    "chip.viz": "viz-html 예시 보여줘",
    "th.thinking": "생각 중",
    "th.termwork": "터미널 작업",
    "th.preparing": "준비 중…",
    "th.none": "별도 추론 과정 없음",
    "th.working": "작업 중…",
    "th.output": "출력",
    "th.failed": " · 실패",
    "th.exit": " · 종료 ",
    "th.task": "작업",
    "th.type.reason": "추론",
    "th.type.terminal": "터미널 명령",
    "th.type.web": "웹 검색",
    "th.type.file": "파일 작업",
    "th.type.system": "시스템",
    "th.type.tool": "도구",
    "conv.sort.recent": "최근순",
    "conv.sort.name": "이름순",
    "conv.sort.created": "생성순",
    "conv.working": "작업 중…",
    "web.searching": "검색 중…",
    "web.sitesDone": "개 사이트 검색 완료",
    "web.results": "검색 결과",
    "send.famBusy":
      "연결된 세션에서 작업 중입니다. 끝나면 보내주세요. (지금 끝내려면 입력 지우고 ■)",
    "conv.adopted": "가져온 세션",
    "conv.saveTrim":
      "저장 공간이 부족해 이전 대화의 세부 기록 일부를 줄여서 저장했습니다.",
    "conv.saveFail":
      "저장 공간이 부족해 대화를 저장하지 못했습니다. 오래된 대화를 삭제해 주세요.",
    "goal.autoCap":
      "목표가 끝나지 않았지만 자동 계속 상한에 도달해 멈췄습니다. 계속하려면 메시지를 보내세요.",
    "files.btn": "파일",
    "files.loading": "불러오는 중…",
    "files.fail": "파일 목록을 불러오지 못했습니다.",
    "files.empty": "파일 없음",
    "files.del": "삭제",
    "files.delAsk": "이 파일을 삭제할까요?",
    "agents.loading": "불러오는 중…",
    "agents.fail": "목록을 불러오지 못했습니다.",
    "agents.empty":
      "서브에이전트 기록이 없습니다. 서브에이전트를 실행한 세션에서 기록이 쌓입니다.",
    "agents.toggle": "서브에이전트 펼치기/접기",
    "agents.enter": "이 세션으로 들어가기",
    "agents.noCwd": "작업 디렉터리를 알 수 없어 들어갈 수 없습니다.",
    "rtab.close": "탭 닫기",
    "rtab.open": "이 탭 열기",
    "rtab.rename": "이름 변경",
    "rtab.renameAsk": "탭 새 이름 (지우면 기본값)",
    "rtab.pin": "고정",
    "rtab.unpin": "고정 해제",
    "rtab.list": "탭 목록",
    "rtab.add": "탭 열기",
    "agents.active": "실행 중",
    "agents.idle": "대기",
    "agents.state_done": "완료(결과 회수)",
    "agents.state_active": "실행 중(마지막 관측)",
    "agents.state_spawned": "스폰 접수",
    "th.fulllog": "전체 로그 보기",
    "th.loading": "불러오는 중…",
    "th.cut": "잘림",
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
    "yolo.warn":
      "Removes user approval and sandbox isolation (global access outside the work directory possible).",
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
    "goal.emptyHtml":
      "No active goal.<br>Start with <code>/goal your goal</code>.",
    "chip.struct": "Explain this folder structure",
    "chip.viz": "Show a viz-html example",
    "th.thinking": "Thinking",
    "th.termwork": "Terminal work",
    "th.preparing": "Preparing…",
    "th.none": "No reasoning steps",
    "th.working": "Working…",
    "th.output": "Output",
    "th.failed": " · failed",
    "th.exit": " · exit ",
    "th.task": "Task",
    "th.type.reason": "Reasoning",
    "th.type.terminal": "Terminal",
    "th.type.web": "Web",
    "th.type.file": "Files",
    "th.type.system": "System",
    "th.type.tool": "Tool",
    "conv.sort.recent": "Recent",
    "conv.sort.name": "Name",
    "conv.sort.created": "Created",
    "conv.working": "Working…",
    "web.searching": "Searching…",
    "web.sitesDone": " sites searched",
    "web.results": "Search results",
    "send.famBusy":
      "A linked session is still working. Send after it finishes. (Clear input + ■ to stop now)",
    "conv.adopted": "Adopted session",
    "conv.saveTrim":
      "Storage is low; older detail logs were trimmed when saving.",
    "conv.saveFail":
      "Storage full; conversations could not be saved. Please delete old conversations.",
    "goal.autoCap":
      "Goal not finished, but auto-continue limit reached. Send a message to continue.",
    "files.btn": "Files",
    "files.loading": "Loading…",
    "files.fail": "Could not load the file list.",
    "files.empty": "No files",
    "files.del": "Delete",
    "files.delAsk": "Delete this file?",
    "agents.loading": "Loading…",
    "agents.fail": "Could not load the session list.",
    "agents.empty":
      "No subagent records yet. Records accumulate in sessions that spawn subagents.",
    "agents.toggle": "Expand/collapse subagents",
    "agents.enter": "Enter this session",
    "agents.noCwd": "Cannot enter: unknown working directory.",
    "rtab.close": "Close tab",
    "rtab.open": "Open this tab",
    "rtab.rename": "Rename",
    "rtab.renameAsk": "New tab name (clear for default)",
    "rtab.pin": "Pin",
    "rtab.unpin": "Unpin",
    "rtab.list": "Tab list",
    "rtab.add": "Open tab",
    "agents.active": "active",
    "agents.idle": "idle",
    "agents.state_done": "done (result collected)",
    "agents.state_active": "running (last seen)",
    "agents.state_spawned": "spawn accepted",
    "th.fulllog": "View full log",
    "th.loading": "Loading…",
    "th.cut": "cut",
  },
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
    try {
      saveTheme({ lang: l })
    } catch (e) {}
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
  if (plus) {
    plus.title = t("plus.title")
    plus.setAttribute("aria-label", t("plus.title"))
  }
  setText("#cwdlabel", t("cwd.label"))
  setText("#rsideempty1", t("rside.empty"))
  setText("#rsideempty2", t("rside.emptyHint"))
  const rtm = $("#rtabmenu")
  if (rtm) {
    rtm.title = t("rtab.list")
    rtm.setAttribute("aria-label", t("rtab.list"))
  }
  const rta = $("#rtabadd")
  if (rta) {
    rta.title = t("rtab.add")
    rta.setAttribute("aria-label", t("rtab.add"))
  }
  setText("#filesbtn", t("files.btn"))
  setText("#langhead", t("settings.language"))
  document.querySelectorAll("#langrow [data-lang]").forEach((b) => {
    b.classList.toggle("sel", b.dataset.lang === langCur)
  })
  paintYolo()
  renderChips()
  updateGate()
  drawRside()
}
