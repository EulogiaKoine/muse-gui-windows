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
    "settings.palette": "팔레트",
    "settings.typography": "타이포그래피",
    "settings.chatpad": "채팅 너비",
    "chatpad.narrow": "좁게",
    "chatpad.mid": "적당히",
    "chatpad.wide": "넓게",
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
    "files.loading": "불러오는 중…",
    "files.fail": "파일 목록을 불러오지 못했습니다.",
    "files.empty": "파일 없음",
    "files.del": "삭제",
    "files.delFail": "삭제 실패",
    "files.delAsk": "이 파일을 삭제할까요?",
    "agents.loading": "불러오는 중…",
    "agents.fail": "목록을 불러오지 못했습니다.",
    "agents.empty":
      "서브에이전트 기록이 없습니다. 서브에이전트를 실행한 세션에서 기록이 쌓입니다.",
    "agents.toggle": "서브에이전트 펼치기/접기",
    "agents.enter": "이 세션으로 들어가기",
    "agents.noCwd": "작업 디렉터리를 알 수 없어 들어갈 수 없습니다.",
    "rtab.close": "탭 닫기",
    "rtab.rename": "이름 변경",
    "rtab.renameAsk": "탭 새 이름 (지우면 기본값)",
    "rtab.pin": "고정",
    "rtab.unpin": "고정 해제",
    "rtab.list": "탭 목록",

    "agents.active": "실행 중",
    "agents.idle": "대기",
    "agents.state_done": "완료(결과 회수)",
    "agents.state_active": "실행 중(마지막 관측)",
    "agents.state_spawned": "스폰 접수",
    "th.fulllog": "전체 로그 보기",
    "th.loading": "불러오는 중…",
    "th.cut": "잘림",
    "ui.loading": "불러오는 중…",
    "ui.loadFail": "불러오기 실패",
    "ui.close": "닫기",
    "side.collapse": "사이드바 접기",
    "side.expand": "사이드바 펼치기",
    "settings.title": "설정",
    "settings.open": "설정",
    "settings.tabGeneral": "일반",
    "settings.tabAccount": "계정",
    "settings.tabSkills": "스킬",
    "settings.server": "서버",
    "settings.serverInfo": "서버 실행 정보",
    "settings.agentDir": "기본 에이전트 루트",
    "settings.agentDirPh": "예: C:\\muse-agent 또는 /mnt/c/muse-agent",
    "settings.agentBrowse": "찾아보기",
    "agentdir.required": "설정 > 일반 > 기본 에이전트 루트를 지정해야 세션 자동 생성이 가능합니다",
    "agentdir.wslRoot": "WSL 루트 밑에는 지정할 수 없습니다: ",
    "agentdir.notDir": "폴더가 아닙니다: ",
    "agentdir.createFail": "기본 폴더에 세션을 만들지 못했습니다: ",
    "agentdir.invalid": "유효한 폴더가 아닙니다: ",
    "cwdbox.pick": "작업 디렉터리 선택",
    "cwdbox.unset": "미지정",
    "cwdbox.auto": "자동 생성",
    "settings.connecting": "연결 중…",
    "settings.theme": "테마",
    "settings.light": "라이트",
    "settings.dark": "다크",
    "settings.keepTitle": "세션 유지",
    "settings.keepCount": "최근 유지 세션 수",
    "settings.keepHint":
      "탭을 옮겨도 이 개수만큼의 최근 세션은 이어가기 없이 바로 입력할 수 있다.",
    "status.argsNone": "(없음)",
    "status.pathLabel": "서버 경로",
    "status.serverFail": "서버 연결 실패",
    "fs.title": "작업 디렉터리 선택",
    "fs.up": "⬆ 상위",
    "fs.upTitle": "상위 폴더",
    "fs.filterPh": "이름 필터",
    "fs.pathPh": "/직접/경로/입력",
    "fs.go": "이동",
    "fs.oldServer": "서버가 구버전입니다. muse-gui를 다시 시작하세요.",
    "fs.winTitle": "Windows 기본 폴더 선택 대화상자 열기",
    "fs.win": "Windows 탐색기로 선택",
    "fs.ok": "이 폴더 선택",
    "fs.cancel": "취소",
    "fs.empty": "비어 있음",
    "fs.picking": "Windows에서 선택 중…",
    "cwd.openTitle": "작업 디렉터리 — 클릭하면 탐색기로 열기",
    "ctx.pin": "상단 고정",
    "ctx.unpin": "고정 해제",
    "ctx.rename": "이름 변경",
    "ctx.export": "MD로 내보내기",
    "ctx.del": "삭제",
    "ctx.menu": "메뉴",
    "conv.new": "새 대화",
    "conv.pinned": "상단 고정됨",
    "conv.msgCount": "개 메시지",
    "conv.done": "완료",
    "conv.exportEmpty": "내보낼 대화가 없습니다.",
    "conv.untitled": "대화",
    "conv.delConfirmA": " 대화와 muse 세션 기록을 함께 삭제할까요?",
    "conv.delConfirmB": "(실행 중인 세션은 삭제되지 않습니다)",
    "conv.delSessionFail": "세션 기록 삭제 실패: ",
    "conv.openFolderFail": "폴더 열기 실패: ",
    "act.copy": "복사",
    "act.retryLast": "재시도 (마지막 질문을 새 세션으로 분기)",
    "act.retryFrom": "재시도 (이 메시지부터 새 세션으로 분기)",
    "act.editResend": "수정 후 다시 전송",
    "act.toggle": "펼치기/접기",
    "act.save": "저장",
    "act.cancel": "취소",
    "act.remove": "제거",
    "act.mathCopy": "수식 복사",
    "act.tableCopy": "표 복사",
    "chat.offline": "!현재 인터넷이 연결되어있지 않아 요청을 보낼 수 없습니다",
    "chat.generating": "응답 생성 중…",
    "chat.emptyResp": "(빈 응답)",
    "chat.aborted": "[중단됨]",
    "chat.sendFail": "전송 실패: ",
    "chat.copied": "복사했습니다.",
    "chat.copyNone": "복사할 답변이 없습니다.",
    "chat.streamCut": "스트림이 끝나기 전에 연결이 끊어졌습니다.",
    "chat.autoFail": "자동 계속 실패: ",
    "time.sec": "초",
    "notify.done": "muse-gui · 응답 완료",
    "goal.achieved": "🏁 목표 달성: ",
    "goal.doneSuffix": " · 완료",
    "goal.noneHint": "진행 중인 목표가 없습니다. `/goal 목표 내용` 으로 시작하세요.",
    "th.all": "통합",
    "th.log": "로그",
    "msg.detail": "상세",
    "msg.tableMd": "마크다운",
    "file.openFail": "열기 실패: ",
    "file.notFound": "경로를 찾을 수 없습니다: ",
    "file.wslShellFail": "WSL 셸을 열 수 없습니다: ",
    "feat.viz": "시각화",
    "feat.vizDesc": "인터랙티브 패널로 답변 요청",
    "feat.web": "웹 검색",
    "feat.webDesc": "반드시 검색 후 답변",
    "feat.auto": "자동 응답",
    "feat.autoDesc": "선택지를 묻지 않고 권장안으로 진행",
    "feat.upload": "파일 첨부",
    "feat.uploadDesc": "이미지·파일 첨부",
    "feat.soon": "(추후 추가)",
    "usage.console": "dev.meta.ai 콘솔 열기",
    "usage.consoleTitle": "Meta 개발자 콘솔",
    "skills.title": "에이전트 스킬",
    "skills.hint":
      "muse CLI 스킬 목록. 토글로 활성화/비활성화를 변경한다. (대화형 세션에 적용, headless exec는 스킬 미로드)",
    "skills.add": "＋ 새 스킬",
    "skills.name": "이름",
    "skills.desc": "설명",
    "skills.descPh": "언제 사용하는지 한 줄로",
    "skills.bodyPh": "SKILL.md 본문 (마크다운)",
    "skills.empty": "스킬 없음",
    "skills.toggleOn": "켜기",
    "skills.toggleOff": "끄기",
    "skills.toggleFail": "스킬 전환 실패: ",
    "skills.detail": "— 상세 보기",
    "skills.needAll": "이름·설명·본문을 모두 입력하세요.",
    "skills.addFail": "스킬 추가 실패: ",
    "skills.addFailServer": "스킬 추가 실패 (서버 오류)",
    "sk.scope.user": "사용자",
    "sk.scope.project": "프로젝트",
    "sk.scope.plugin": "플러그인",
    "sk.scope.bundled": "내장",
    "acct.title": "계정",
    "acct.console": "Meta AI 콘솔 / 사용량 대시보드",
    "acct.token": "API 토큰",
    "acct.tokenCopy": "토큰 복사",
    "acct.guide": "로그인 가이드",
    "acct.guideSum": "서버 종료 → 로그인 → 재시작 순서로 진행 (펼치기)",
    "acct.g1":
      "실행 중인 <code>muse-gui</code> 서버를 종료합니다 (터미널 <code>Ctrl+C</code> 또는 <code>kill</code>).",
    "acct.g2":
      "터미널에서 <code>muse login</code>을 실행하고 브라우저 승인으로 로그인합니다.",
    "acct.g3": "서버를 다시 시작합니다.",
    "acct.g4": "설정 &gt; 계정에서 이름·이메일이 표시되는지 확인합니다.",
    "acct.g5":
      "로그아웃은 <code>muse logout</code> — 자격이 삭제되므로 필요할 때만 실행하세요.",
    "acct.gHint": "로그인·로그아웃은 터미널에서만 가능합니다 (브라우저 승인 / 자격 삭제).",
    "acct.noLogin": "로그인 정보 없음",
    "acct.none": "없음",
    "acct.active": "활성",
    "acct.name": "이름",
    "acct.email": "이메일",
    "acct.provider": "제공자",
    "acct.subs": "구독",
    "help.groupConv": "대화",
    "help.groupGuide": "안내",
    "help.groupCli": "muse 명령",
    "palette.blue": "블루",
    "palette.blueD": "파란 악센트.",
    "palette.green": "그린",
    "palette.greenD": "차분한 녹색 악센트.",
    "palette.amber": "앰버",
    "palette.amberD": "따뜻한 황색 악센트.",
    "palette.github": "GitHub (기본)",
    "palette.githubD": "Primer 참조 · 라이트/다크 전체 적용.",
    "palette.obsidian": "Obsidian",
    "palette.obsidianD": "기본 테마 참조 · 바이올렛 악센트.",
    "palette.teal": "틸",
    "palette.tealD": "청록색 악센트.",
    "font.systemD":
      "OS 기본 느낌 그대로. 사이드바·버튼·입력창 등 UI 전반에 가장 선명하다. (기본값)",
    "font.sturdyD":
      "System 계열을 살짝 두껍게(본문 600). 작은 글씨·밝은 화면에서 또렷하다.",
    "font.humanistD": "OS 간 모습 차이가 적어 업무용 툴·문서형 대화에 안정적이다.",
    "font.serifD":
      "앱 전체가 명조·세리프 계열로 바뀐다. 리서치·요약 등 긴 글을 읽을 때 적합하다.",
    "font.compactD": "작은 크기에서 가독성이 좋아 정보 밀도가 높은 화면에 적합하다.",
    "rtab.goal": "목표",
    "rtab.help": "도움말",
    "rtab.files": "파일",
    "rtab.subagents": "서브에이전트",
    "err.fetch": "조회 실패: ",
    "err.badId": "스킬 id 형식이 아닙니다.",
    "err.badScope": "지원하지 않는 scope입니다.",
    "err.exec": "실행 실패: ",
    "err.exit": "실패 (exit ",
    "err.inspect": "조회 실패: ",
    "err.previewLoc": "파일 미리보기를 지원하지 않는 위치입니다.",
    "err.badPath": "안전 검사 실패: 허용된 스킬 경로가 아닙니다.",
    "err.tooBig": "파일이 너무 큽니다 (128KB 초과).",
    "err.read": "읽기 실패: ",
    "err.nameRule": "이름은 소문자·숫자·- 만 (2~64자).",
    "err.needDesc": "설명을 입력하세요.",
    "err.descLong": "설명이 너무 깁니다 (2000자 이내).",
    "err.needBody": "본문을 입력하세요.",
    "err.bodyLong": "본문이 너무 깁니다 (64KB 이내).",
    "err.validate": "검증 실패",
    "err.install": "설치 실패",
    "err.needPath": "경로를 입력하세요.",
    "err.noDir": "폴더를 찾지 못했습니다.",
    "err.parseFail": "단가 파싱 실패 (",
    "err.parseKeep": "). 기존 단가를 유지합니다.",
    "err.saveFail": "저장 실패: ",
    "err.updatedPre": "개 모델 단가 갱신됨 (",
    "err.badCallId": "호출 id 형식이 아닙니다.",
    "err.notFound": "전체 로그를 찾지 못했습니다.",
    "err.noPowershell": "powershell.exe를 찾지 못했습니다.",
    "err.pickTimeoutA": "선택 시간 초과 (",
    "err.pickTimeoutB": "초). 다시 시도하세요.",
    "err.pickEmpty": "선택 실패 (빈 경로).",
    "err.convertFail": "WSL 경로 변환 실패: ",
    "err.badPathFmt": "올바른 경로 형식이 아닙니다.",
    "err.noOpenerA": "폴더 열기 도구를 찾지 못했습니다 (",
    "err.noOpenerB": " 없음).",
    "err.sessionBadId": "세션 id 형식이 아닙니다.",
    "err.sessionRunning":
      "실행 중인 세션이라 삭제하지 않습니다. 터미널에서 종료 후 다시 시도하세요.",
    "err.sessionNotFound": "세션 기록을 찾지 못했습니다 (이미 삭제됨).",
    "err.sessionOutside": "안전 검사 실패: 세션 경로가 저장소 밖입니다.",
    "err.pickFail": "선택 실패",
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
    "settings.palette": "Palette",
    "settings.typography": "Typography",
    "settings.chatpad": "Chat width",
    "chatpad.narrow": "Narrow",
    "chatpad.mid": "Medium",
    "chatpad.wide": "Wide",
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
    "files.loading": "Loading…",
    "files.fail": "Could not load the file list.",
    "files.empty": "No files",
    "files.del": "Delete",
    "files.delFail": "Delete failed",
    "files.delAsk": "Delete this file?",
    "agents.loading": "Loading…",
    "agents.fail": "Could not load the session list.",
    "agents.empty":
      "No subagent records yet. Records accumulate in sessions that spawn subagents.",
    "agents.toggle": "Expand/collapse subagents",
    "agents.enter": "Enter this session",
    "agents.noCwd": "Cannot enter: unknown working directory.",
    "rtab.close": "Close tab",
    "rtab.rename": "Rename",
    "rtab.renameAsk": "New tab name (clear for default)",
    "rtab.pin": "Pin",
    "rtab.unpin": "Unpin",
    "rtab.list": "Tab list",

    "agents.active": "active",
    "agents.idle": "idle",
    "agents.state_done": "done (result collected)",
    "agents.state_active": "running (last seen)",
    "agents.state_spawned": "spawn accepted",
    "th.fulllog": "View full log",
    "th.loading": "Loading…",
    "th.cut": "cut",
    "ui.loading": "Loading…",
    "ui.loadFail": "Load failed",
    "ui.close": "Close",
    "side.collapse": "Collapse sidebar",
    "side.expand": "Expand sidebar",
    "settings.title": "Settings",
    "settings.open": "Settings",
    "settings.tabGeneral": "General",
    "settings.tabAccount": "Account",
    "settings.tabSkills": "Skills",
    "settings.server": "Server",
    "settings.serverInfo": "Server info",
    "settings.agentDir": "Default agent root",
    "settings.agentDirPh": "e.g. C:\\muse-agent or /mnt/c/muse-agent",
    "settings.agentBrowse": "Browse",
    "agentdir.required": "Set the default agent root in Settings > General to auto-create sessions",
    "agentdir.wslRoot": "Cannot use a path under the WSL root: ",
    "agentdir.notDir": "Not a directory: ",
    "agentdir.createFail": "Could not create a session under the default folder: ",
    "agentdir.invalid": "Not a valid folder: ",
    "cwdbox.pick": "Select work directory",
    "cwdbox.unset": "Not set",
    "cwdbox.auto": "auto-create",
    "settings.connecting": "Connecting…",
    "settings.theme": "Theme",
    "settings.light": "Light",
    "settings.dark": "Dark",
    "settings.keepTitle": "Kept sessions",
    "settings.keepCount": "Sessions to keep",
    "settings.keepHint":
      "Switching tabs keeps this many recent sessions ready for input.",
    "status.argsNone": "(none)",
    "status.pathLabel": "Server path",
    "status.serverFail": "Server connection failed",
    "fs.title": "Select working directory",
    "fs.up": "⬆ Up",
    "fs.upTitle": "Parent folder",
    "fs.filterPh": "Filter by name",
    "fs.pathPh": "Type /a/path",
    "fs.go": "Go",
    "fs.oldServer": "Server is outdated. Restart muse-gui.",
    "fs.winTitle": "Open Windows folder picker",
    "fs.win": "Choose in Explorer",
    "fs.ok": "Select this folder",
    "fs.cancel": "Cancel",
    "fs.empty": "Empty",
    "fs.picking": "Waiting for Windows picker…",
    "cwd.openTitle": "Open in Explorer",
    "ctx.pin": "Pin to top",
    "ctx.unpin": "Unpin",
    "ctx.rename": "Rename",
    "ctx.export": "Export as MD",
    "ctx.del": "Delete",
    "ctx.menu": "Menu",
    "conv.new": "New chat",
    "conv.pinned": "Pinned",
    "conv.msgCount": " messages",
    "conv.done": "Done",
    "conv.exportEmpty": "Nothing to export.",
    "conv.untitled": "chat",
    "conv.delConfirmA": " and its muse session records?",
    "conv.delConfirmB": "(Running sessions are kept.)",
    "conv.delSessionFail": "Failed to delete session records: ",
    "conv.openFolderFail": "Failed to open folder: ",
    "act.copy": "Copy",
    "act.retryLast": "Retry (branch from last question)",
    "act.retryFrom": "Retry (branch from here)",
    "act.editResend": "Edit and resend",
    "act.toggle": "Expand/Collapse",
    "act.save": "Save",
    "act.cancel": "Cancel",
    "act.remove": "Remove",
    "act.mathCopy": "Copy math",
    "act.tableCopy": "Copy table",
    "chat.offline": "!No internet connection. Cannot send.",
    "chat.generating": "Generating…",
    "chat.emptyResp": "(empty response)",
    "chat.aborted": "[stopped]",
    "chat.sendFail": "Send failed: ",
    "chat.copied": "Copied.",
    "chat.copyNone": "Nothing to copy.",
    "chat.streamCut": "Connection lost before the stream ended.",
    "chat.autoFail": "Auto-continue failed: ",
    "time.sec": "s",
    "notify.done": "muse-gui · Response ready",
    "goal.achieved": "🏁 Goal achieved: ",
    "goal.doneSuffix": " · done",
    "goal.noneHint": "No active goal. Start with `/goal your objective`.",
    "th.all": "All",
    "th.log": "Log",
    "msg.detail": "Details",
    "msg.tableMd": "Markdown",
    "file.openFail": "Failed to open: ",
    "file.notFound": "Path not found: ",
    "file.wslShellFail": "Cannot open a WSL shell: ",
    "feat.viz": "Visualization",
    "feat.vizDesc": "Answer with an interactive panel",
    "feat.web": "Web search",
    "feat.webDesc": "Always search first",
    "feat.auto": "Auto answer",
    "feat.autoDesc": "Proceed with the recommended option",
    "feat.upload": "Attach files",
    "feat.uploadDesc": "Images and files",
    "feat.soon": "(coming soon)",
    "usage.console": "Open dev.meta.ai console",
    "usage.consoleTitle": "Meta developer console",
    "skills.title": "Agent skills",
    "skills.hint":
      "muse CLI skills. Toggle to enable/disable. (interactive sessions; headless exec loads none)",
    "skills.add": "＋ New skill",
    "skills.name": "Name",
    "skills.desc": "Description",
    "skills.descPh": "One line: when to use",
    "skills.bodyPh": "SKILL.md body (markdown)",
    "skills.empty": "No skills",
    "skills.toggleOn": "On",
    "skills.toggleOff": "Off",
    "skills.toggleFail": "Skill toggle failed: ",
    "skills.detail": "— details",
    "skills.needAll": "Enter name, description, and body.",
    "skills.addFail": "Failed to add skill: ",
    "skills.addFailServer": "Failed to add skill (server error)",
    "sk.scope.user": "User",
    "sk.scope.project": "Project",
    "sk.scope.plugin": "Plugin",
    "sk.scope.bundled": "Bundled",
    "acct.title": "Account",
    "acct.console": "Meta AI console / Usage dashboard",
    "acct.token": "API token",
    "acct.tokenCopy": "Copy token",
    "acct.guide": "Login guide",
    "acct.guideSum": "Stop → log in → restart (expand)",
    "acct.g1":
      "Stop the running <code>muse-gui</code> server (terminal <code>Ctrl+C</code> or <code>kill</code>).",
    "acct.g2":
      "Run <code>muse login</code> in the terminal and approve in the browser.",
    "acct.g3": "Restart the server.",
    "acct.g4": "Check that name and email appear under Settings > Account.",
    "acct.g5":
      "Logout is <code>muse logout</code> — it deletes credentials, so use it only when needed.",
    "acct.gHint": "Log in/out only in the terminal (browser approval / credential removal).",
    "acct.noLogin": "No login info",
    "acct.none": "None",
    "acct.active": "Active",
    "acct.name": "Name",
    "acct.email": "Email",
    "acct.provider": "Provider",
    "acct.subs": "Plan",
    "help.groupConv": "Chat",
    "help.groupGuide": "Guide",
    "help.groupCli": "muse commands",
    "palette.blue": "Blue",
    "palette.blueD": "Blue accent.",
    "palette.green": "Green",
    "palette.greenD": "Calm green accent.",
    "palette.amber": "Amber",
    "palette.amberD": "Warm amber accent.",
    "palette.github": "GitHub (default)",
    "palette.githubD": "Primer-based, full light/dark.",
    "palette.obsidian": "Obsidian",
    "palette.obsidianD": "Default-theme-based violet accent.",
    "palette.teal": "Teal",
    "palette.tealD": "Teal accent.",
    "font.systemD":
      "Native OS feel. Sharpest across sidebar, buttons, and inputs. (default)",
    "font.sturdyD":
      "Slightly heavier System stack (body 600). Crisp on small text and bright screens.",
    "font.humanistD":
      "Consistent across OSes; steady for work tools and document chats.",
    "font.serifD":
      "Whole app switches to serif. Good for long reads like research and summaries.",
    "font.compactD": "Readable at small sizes; suits dense screens.",
    "rtab.goal": "Goal",
    "rtab.help": "Help",
    "rtab.files": "Files",
    "rtab.subagents": "Subagents",
    "err.fetch": "Fetch failed: ",
    "err.badId": "Bad skill id.",
    "err.badScope": "Unsupported scope.",
    "err.exec": "Run failed: ",
    "err.exit": "failed (exit ",
    "err.inspect": "Fetch failed: ",
    "err.previewLoc": "Preview not supported here.",
    "err.badPath": "Safety check failed: path not allowed.",
    "err.tooBig": "File too large (over 128KB).",
    "err.read": "Read failed: ",
    "err.nameRule": "Lowercase letters, digits, - only (2-64 chars).",
    "err.needDesc": "Enter a description.",
    "err.descLong": "Description too long (within 2000 chars).",
    "err.needBody": "Enter a body.",
    "err.bodyLong": "Body too long (within 64KB).",
    "err.validate": "Validation failed",
    "err.install": "Install failed",
    "err.needPath": "Enter a path.",
    "err.noDir": "Folder not found.",
    "err.parseFail": "Price parse failed (",
    "err.parseKeep": "). Keeping existing prices.",
    "err.saveFail": "Save failed: ",
    "err.updatedPre": " models updated (",
    "err.badCallId": "Bad call id.",
    "err.notFound": "Full log not found.",
    "err.noPowershell": "powershell.exe not found.",
    "err.pickTimeoutA": "Selection timed out (",
    "err.pickTimeoutB": ")s. Retry.",
    "err.pickEmpty": "Selection failed (empty path).",
    "err.convertFail": "WSL path conversion failed: ",
    "err.badPathFmt": "Bad path format.",
    "err.noOpenerA": "No folder opener (",
    "err.noOpenerB": " missing).",
    "err.sessionBadId": "Bad session id.",
    "err.sessionRunning": "Session is running; stop it in the terminal and retry.",
    "err.sessionNotFound": "Session records not found (already deleted).",
    "err.sessionOutside": "Safety check failed: session path outside storage.",
    "err.pickFail": "Selection failed",
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
function setTip(sel, s) {
  const el = document.querySelector(sel)
  if (el) {
    el.title = s
    el.setAttribute("aria-label", s)
  }
}
function paintAgentStatic() {
  const inp = document.querySelector("#agentdir")
  if (inp) {
    inp.placeholder = t("settings.agentDirPh")
    if (document.activeElement !== inp && !inp.value) {
      let cur = ""
      try {
        cur = (loadTheme().agentDir || "").trim()
      } catch (e) {}
      if (cur) inp.value = cur
    }
  }
  const pb = document.querySelector("#agentpick")
  if (pb) {
    pb.textContent = t("settings.agentBrowse")
    pb.title = t("settings.agentBrowse")
    pb.setAttribute("aria-label", t("settings.agentBrowse"))
  }
  if (typeof updateCwdBox === "function") updateCwdBox()
}
function setPh(sel, s) {
  const el = document.querySelector(sel)
  if (el) el.placeholder = s
}
function bodyHas(cls) {
  try {
    return !!(document.body && document.body.classList && document.body.classList.contains(cls))
  } catch (e) {
    return false
  }
}
function paintCtxMenu() {
  const labels = { rename: "ctx.rename", export: "ctx.export", del: "ctx.del" }
  document.querySelectorAll("#ctx [data-act]").forEach((b) => {
    if (b.dataset.act === "pin")
      b.textContent = t(b.dataset.pinned === "1" ? "ctx.unpin" : "ctx.pin")
    else if (labels[b.dataset.act]) b.textContent = t(labels[b.dataset.act])
  })
}
function paintFsStatic() {
  const dlg = document.querySelector("#fsmodal")
  if (dlg) dlg.setAttribute("aria-label", t("fs.title"))
  setText("#fstitle", t("fs.title"))
  setTip("#fsclose", t("ui.close"))
  setText("#fsup", t("fs.up"))
  const up = document.querySelector("#fsup")
  if (up) up.title = t("fs.upTitle")
  setPh("#fsfilter", t("fs.filterPh"))
  setPh("#fspath", t("fs.pathPh"))
  setText("#fsgo", t("fs.go"))
  const win = document.querySelector("#fswin")
  if (win) {
    win.title = t("fs.winTitle")
    win.textContent = t("fs.win")
  }
  setText("#fsok", t("fs.ok"))
  setText("#fscancel", t("fs.cancel"))
}
function paintChatChrome() {
  const root = document.querySelector("#chat")
  if (!root || typeof root.querySelectorAll !== "function") return
  root.querySelectorAll(".msg").forEach((m) => {
    const me = m.classList.contains("me")
    m.querySelectorAll("[data-retry]").forEach((b) => {
      b.title = t(me ? "act.retryFrom" : "act.retryLast")
    })
    m.querySelectorAll("[data-copy]").forEach((b) => {
      b.title = t("act.copy")
    })
    m.querySelectorAll("[data-edit]").forEach((b) => {
      b.title = t("act.editResend")
    })
    m.querySelectorAll("[data-fold]").forEach((b) => {
      b.title = t("act.toggle")
    })
    m.querySelectorAll("[data-codecopy]").forEach((b) => {
      b.title = t("act.copy")
    })
    m.querySelectorAll("[data-mathcopy]").forEach((b) => {
      b.title = t("act.mathCopy")
    })
    m.querySelectorAll("[data-tblcopy]").forEach((b) => {
      b.title = t("act.tableCopy")
    })
    m.querySelectorAll(".tblmenu").forEach((menu) => {
      if (menu.children[0]) menu.children[0].textContent = t("msg.tableMd")
    })
    m.querySelectorAll("details > summary").forEach((s) => {
      if (!s.querySelector("*")) s.textContent = t("msg.detail")
    })
    m.querySelectorAll("[data-ttoggle]").forEach((b) => {
      b.title = t("act.toggle")
    })
    m.querySelectorAll(".thead .ttype").forEach((s) => {
      s.textContent = t("th.all")
    })
    m.querySelectorAll(".trow[data-type] > .ttype").forEach((s) => {
      const ty = s.parentNode && s.parentNode.dataset.type
      if (ty) s.textContent = t("th.type." + ty)
    })
  })
}
function paintSettingsStatic() {
  const dlg = document.querySelector("#modal")
  if (dlg) dlg.setAttribute("aria-label", t("settings.title"))
  setText("#settitle", t("settings.title"))
  setTip("#mclose", t("ui.close"))
  const tabs = {
    gen: "settings.tabGeneral",
    acct: "settings.tabAccount",
    skills: "settings.tabSkills",
  }
  document.querySelectorAll("#mtabs [data-tab]").forEach((b) => {
    if (tabs[b.dataset.tab]) b.textContent = t(tabs[b.dataset.tab])
  })
  setText("#srvhead", t("settings.server"))
  const si = document.querySelector("#srvinfo")
  if (si) si.title = t("settings.serverInfo")
  setText("#themehead", t("settings.theme"))
  const ths = { light: "settings.light", dark: "settings.dark" }
  document.querySelectorAll("#themes [data-th]").forEach((b) => {
    if (ths[b.dataset.th]) b.textContent = t(ths[b.dataset.th])
  })
  setText("#chatpadhead", t("settings.chatpad"))
  if (typeof paintChatpad === "function") paintChatpad()
  setText("#langhead", t("settings.language"))
  setText("#palhead", t("settings.palette"))
  setText("#fonthead", t("settings.typography"))
  setText("#keephead", t("settings.keepTitle"))
  setText("#keepnlab", t("settings.keepCount"))
  setText("#keephint", t("settings.keepHint"))
  setText("#accthead", t("acct.title"))
  setText("#tokenhead", t("acct.token"))
  setTip("#tokcopy", t("acct.tokenCopy"))
  setText("#guidehead", t("acct.guide"))
  setText("#guidesum", t("acct.guideSum"))
  const gl = document.querySelector("#guidelist")
  if (gl)
    gl.innerHTML =
      "<li>" +
      t("acct.g1") +
      "</li><li>" +
      t("acct.g2") +
      "</li><li>" +
      t("acct.g3") +
      "</li><li>" +
      t("acct.g4") +
      "</li><li>" +
      t("acct.g5") +
      "</li>"
  setText("#guidehint", t("acct.gHint"))
  setText("#consolehead", t("acct.console"))
  setText("#consolelink", t("usage.console"))
  const dl = document.querySelector("#consolelink")
  if (dl) dl.title = t("usage.consoleTitle")
  setText("#skillhead", t("skills.title"))
  setText("#skillhint", t("skills.hint"))
  setText("#skilladd", t("skills.add"))
  setText("#sknamelab", t("skills.name"))
  setText("#skdesclab", t("skills.desc"))
  setPh("#skdesc", t("skills.descPh"))
  setPh("#skbody", t("skills.bodyPh"))
  setText("#sksave", t("act.save"))
  setText("#skcancel", t("act.cancel"))
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
  const rtm = $("#rtabmenu")
  if (rtm) {
    rtm.title = t("rtab.list")
    rtm.setAttribute("aria-label", t("rtab.list"))
  }
  setText("#newchatlab", t("conv.new"))
  const cwdEl = $("#cwd")
  if (cwdEl) cwdEl.title = t("cwd.openTitle")
  setTip("#gear", t("settings.open"))
  setTip(
    "#sidetoggle",
    t(bodyHas("side-hidden") ? "side.expand" : "side.collapse"),
  )
  setTip(
    "#rsidetoggle",
    t(bodyHas("rside-hidden") ? "side.expand" : "side.collapse"),
  )
  setTip("#filesbtn", t("rtab.files"))
  setText("#agenthead", t("settings.agentDir"))
  paintCtxMenu()
  paintAgentStatic()
  paintFsStatic()
  paintSettingsStatic()
  document.querySelectorAll("#langrow [data-lang]").forEach((b) => {
    b.classList.toggle("sel", b.dataset.lang === langCur)
  })
  paintYolo()
  renderChips()
  if (typeof renderFeats === "function") renderFeats()
  updateGate()
  if (typeof drawConvs === "function") drawConvs()
  if (typeof refreshInfo === "function") refreshInfo()
  if (
    typeof loadTheme === "function" &&
    typeof renderPalettes === "function" &&
    typeof renderFonts === "function"
  ) {
    try {
      const th = loadTheme()
      renderPalettes(th.accent)
      renderFonts(th.font)
    } catch (e) {}
  }
  paintChatChrome()
  if (typeof refreshFsRoots === "function" && typeof fsLoad === "function") {
    try {
      const fso = $("#fsovl")
      if (fso && !fso.hidden)
        refreshFsRoots().then((start) => {
          try {
            fsLoad(
              typeof fsCur !== "undefined" && fsCur ? fsCur : start,
            )
          } catch (e) {}
        })
    } catch (e) {}
  }
  const ovl = $("#ovl")
  if (ovl && !ovl.hidden) {
    if (typeof loadAccount === "function") loadAccount()
    if (typeof loadSkills === "function") {
      const sf = $("#skillform")
      if (!sf || sf.hidden) loadSkills()
    }
  }
  drawRside()
}
