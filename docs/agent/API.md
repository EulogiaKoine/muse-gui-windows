# API 색인 · 기능 요약/명세

읽는 법: 에이전트는 작업 전에 이 문서에서 필요한 함수만 골라 연다.
내부 구현을 전부 읽지 말고, 시그니처+한 줄 요약으로 충분한지 먼저 판단하라.
동작이 의심스러울 때만 해당 파일을 연다. 모듈 구조·순서·불변식은
[ARCHITECTURE.md](ARCHITECTURE.md)와 `static/INDEX.md`를 따른다.

표기: `F` = 순수 함수(테스트 대상), `D` = DOM 접근, `$` = 네트워크 호출.

## util.js — 순수 유틸 (테스트 대상)

| 함수 | 종류 | 요약 |
|------|------|------|
| `esc(s)` | F | HTML 이스케이프(`&<>`). 모든 출력의 최종 관문 |
| `escAttr(s)` | F | `esc` + `"` 이스케이프. 속성값 전용 |
| `tblCellMD(c)` | F | 표 셀 정규화(파이프 이스케이프·공백 축소) |
| `tblToMD(rows)` | F | 2차원 배열 → 마크다운 표 |
| `tblToCSV(rows)` | F | 2차원 배열 → CSV |
| `routeId(path)` | F | URL 경로에서 세션 id/대화 키 추출, 아니면 null |
| `goalFence(text, name)` | F | 코드펜스 안 JSON 목표 블록 파싱·본문 분리 |
| `normGoalItems(data)` | F | 목표 항목 정규화(이름·완료 여부·하위 항목) |
| `convToMd(c)` | F | 대화 1건을 마크다운(헤더+메시지)으로 직렬화 |
| `truncStr(s, n)` | F | 길이 제한+말줄임. 요약 표시에만 사용, 원문은 건드리지 않음 |
| `thoughtKind(taskKind, operation)` | F | 원시 kind 문자열 → 7종 추론 타입 분류 |
| `diffLineClass(ln)` | F | diff 한 줄의 종류 판정(td-add/del/hunk/meta/빈문자) |
| `isDiffText(s)` | F | diff 형태 텍스트인지 판정 |
| `diffLinesHtml(s)` | F | diff 텍스트 → 줄별 span 하이라이팅 HTML(이스케이프 포함) |
| `thoughtSummary(en, counts)` | F | 추론 종료 헤더용 유형별 수량 문구(한/영) |
| `isOutputTruncated(o)` | F | 잘린 터미널 출력인지 판정(flag 우선, 바이트 힌트 보조) |
| `slimConvsForSave(list)` | F | 저장용 축소 복사본(추론 상세 8개·300자로 자름, 원본 불변) |
| `gateFor(c, live)` | F | 입력 게이트 판정: pick-new/resume/pick/""(통과) |
| `sortConvs(list, mode)` | F | 목록 정렬 복사본 반환(recent/name/created, 고정 상단 우선) |
| `diffOnly(s)` | F | 본문에서 diff 부분만 추출, 없으면 원문 그대로 |
| `shouldNotifyCompletion(permission, hidden)` | F | 백그라운드 완료 알림 발송 조건 |
| `timeStr(ts)` | F | 타임스탬프 → "H:MM" |

## icons.js — SVG 상수 (테스트 불필요)

`ICON_CHEVD`(접기/펼치기), `ICON_COPY`, `ICON_RETRY`, `ICON_LINK`,
`ICON_FOLDER`, `ICON_TERM`, `ICON_WEB`, `ICON_REASON`, `ICON_FILE`,
`ICON_TSYS`, `ICON_TOOL`, `SORT_MODES` 아님(그건 conv.js).
동적 생성 없음. 새 아이콘은 여기에 추가한다.

## i18n.js — 문자열·언어

| 함수/값 | 요약 |
|---------|------|
| `STR` | ko/en 문자열 사전. 키 추가 시 양쪽 모두 넣는다 |
| `langCur` | 현재 언어 코드. 설정에서 로드 |
| `t(k)` | 번역 조회. 없으면 ko 폴백, 그래도 없으면 키 그대로 |
| `setText(sel, s)` | 셀렉터 텍스트 치환(널 안전) |
| `applyLang(l, save)` | 전체 UI 문자열·토글 상태 일괄 적용 |

## render.js — 렌더 (테스트 대상: viz 제외 순수부)

| 함수 | 요약 |
|------|------|
| `renderMath(tex, display)` | 수식 → HTML(인라인/블록). 파서 실패 시 원문 |
| `hl(code, lang)` | 코드 하이라이트 span 변환(키워드·문자열·주석·숫자·함수) |
| `vizHtml(code, height)` | viz-html 코드펜스 → 격리 iframe. `sandbox`만 허용 |
| `renderText(src)` | 마크다운 본문 → HTML(코드펜스·수식·표·링크·인용·목록) |
| `resolveLinkPath(p)` | 상대 링크 → 작업 디렉터리 기준 실경로 |
| `decoratePaths(root)` | 렌더된 링크에 파일 열기 동작 부착 |
| `decorateMath(el)` | 수식 복사 버튼 부착 |
| `decorateCode(el)` | 코드 복사 버튼 부착 |
| `decorateTables(el)` | 표 가로 스크롤 래퍼 부착 |

## thoughts.js — 추론 블록

| 함수 | 요약 |
|------|------|
| `thoughtIcon(type)` | 유형별 SVG 반환 |
| `setRowSummary(r, text)` | 행 요약 140자로 갱신(원문 보존) |
| `staticRowNote(r, type, tstate)` | 펼칠 내용 없는 행('생각 중'/'터미널 작업') 고정 표시 |
| `ensureThoughtRow(tbox, tstate, tid, type, summary)` | 작업 id별 행 생성·조회. `tbox.rows`가 진실의 원천 |
| `syncThoughtHead(tbox)` | 헤더 갱신. 전체 완료 시 유형별 수량 요약으로 전환 |
| `updateThoughtHead(tstate)` | `syncThoughtHead` 호출 래퍼 |
| `loadFullLog(btn, callId)` | 잘린 터미널 출력 전문을 서버에서 가져와 교체 |
| `addThoughtLog(r, head, body, extra)` | 세부 로그 1건 추가(60개 초과 시 오래된 것 제거) |
| `markThoughtDone(r)` | 행 완료 표시 |
| `updateThought(tbox, tstate, ev)` | SSE 이벤트 → 행/로그 반영. 프로토콜성 항목은 건너뜀 |
| `collectThoughts(tbox)` | 저장용 스냅샷 추출(행당 세부 20개·본문 1000자 제한) |
| `markThoughtsDone(tbox)` | 턴 종료 시 전체 행 완료 처리 |
| `renderThoughtsStatic(thoughts)` | 기록 렌더. 정적 행은 펼침 버튼 없음 |
| `toggleThoughtDetail(tg)` | 펼치기/접기. 정적 행(`data-static`)은 무시 |

## conv.js — 대화·세션·게이트

| 항목 | 요약 |
|------|------|
| `convs`, `convKey`, `sessionId` | 인메모리 단일 진실 원천. 직접 대입보다 함수 경유 |
| `loadConvs()` | localStorage 로드+정규화 |
| `persistConvs()` | 저장. 실패해도 인메모리 목록 불변(슬림 저장→1회 경고) |
| `saveConv(title)` / `saveMsg(who, text, meta)` | 대화 생성·메시지 추가+영속화 |
| `curConv()` | 현재 대화 조회, 없으면 null |
| `setRoute(p)` / `routeId(path)` | 주소창-대화 동기화 |
| `liveSessions`, `persistLive()`, `touchLive()` | 이어가기 동의 목록(영속). 탭을 닫아도 유지 |
| `keepN()` | 유지 개수(설정, 1~5) |
| `inputGated()` | 입력 게이트 판정+문구. `gateFor` 래퍼 |
| `updateGate()` / `updateOsChip()` / `saveScroll()` | 게이트·OS 칩·스크롤 위치 반영 |
| `backfillCwd(c)` | cwd 비어 있으면 서버 기록에서 복원 |
| `openConv(k)` | 대화 열기: 상태 확정→렌더→게이트→rside |
| 파일 선택기(`openFsPicker` 등) | 디렉터리 선택 모달 일체 |
| `convSortMode()` / `paintSortBtn()` / `renderSortMenu()` / `hideSortMenu()` | 정렬 모드 read·표시·선택 메뉴 |
| `drawConvs()` | 목록 렌더(정렬·고정·이름변경 인라인 편집 포함) |
| ctx 메뉴(`showCtx` 등) | 우클릭 메뉴: 고정·이름변경·내보내기·삭제 |

## chat.js — 메시지·전송·턴

| 함수 | 요약 |
|------|------|
| `addMsg(who, text, think, foot, withActs, extra)` | 말풍선 DOM 생성+장식. 실패 시 예외 발생(호출 전 검증은 호출자 몫 아님) |
| `footFor(m)` / `lastAiText()` | 저장 메시지용 푸터 렌더 / 마지막 AI 답 추출 |
| 편집 일체(`startEdit` 등) | 말풍선 인라인 편집+저장/취소. 저장 시 분기 |
| `saveEditedMessage` / `branchFromMessage(c, mi, newText)` | 편집 저장→해당 지점부터 새 분기로 재실행 |
| `exportConv(c)` | 대화 MD 내보내기 |
| `copyText` / `flashCopy` | 클립보드 복사+피드백 |
| `notifyCompletion(title, body)` | 백그라운드 탭일 때만 브라우저 알림 |
| `finishAiTurn(j, ph, goalMode)` / `sealAiTurn` | 턴 종료: 기록·추론 확정·헤더 요약·알림 |
| `postChatStream` / `runStreamTurn` | SSE 스트리밍 수신→`updateThought` 전달→완료 처리. `atts` 받으면 `attachments` 동봉 후 `clearAtts()` |
| `goalPending()` / `goalAutoChain` | goal 미완료면 `status` 턴 자동 계속(상한 6회, 중단·실패 시 정지). 수동 전송 시 계수 초기화 |
| 전송 핸들러 일체 | 게이트 확인→슬래시 분기→스트림/단발 전송. `pick-new`는 conv 없을 때만 생성 |

## composer.js — 입력창

`drawSlash`(슬래시 자동완성), `autoGrow`(입력창 높이), `setMode`,
`addFeat`/`featPrefixes`/`renderPlusMenu`(+ 메뉴, `upload`는 파일 선택기),
`chipList`/`renderChips`(칩), yolo 토글 표시, 키보드 핸들러.
첨부(`pendingAtts`): `openPicker`/`uploadFiles`(전송 전 `downscaleImage`로
JPEG q0.85/1568px 축소, GIF 원본), `renderAttachBar`/`clearAtts`/
`attCwd`, main DnD+paste 핸들러. 서버 `POST /api/upload`
→ `.agent/attachments/` 저장; 전송 시 `attachments` 동봉.
말풍선 칩(message.js): `attRowHtml`(말풍선 위 `.attrow`, 이미지 썸네일),
`agentFileUrl`/`openAgentFile`(`POST /api/file/open`로 OS 기본 앱 실행).
편집모드 첨부 제거 후 저장 시 `branchFromMessage`가 남은 첨부로 재전송.

## usage.js — 사용량 (테스트 대상)

`fmtNum`, `barsSVG`(막대 SVG), `ucard`(카드), `fmtMoney`,
`rateFor`(모델 요금), `dayCost`(일 비용), `bucketize`(구간 집계),
`tsGraph`(시계열 SVG), `refreshPrices`, `drawUsage`(카드+그래프 렌더).

## ui.js — 셸·모달·설정

사이드바(`applySide`/`setSide`), 우측 패널(`availTabs`~`drawRside`,
`openRside`/`closeRsideTab`), 목표/도움말 렌더, 테마·팔레트·설정
(`loadTheme`/`saveTheme`/`applyTheme`), 스킬 CRUD, 계정,
`fillSelect`, `paintYolo`, `refreshPrefs`, `refreshInfo`,
모달(`showModal`/`hideModal`), 파일 선택기 제외 전부(그건 conv.js).
files 탭(`renderFiles`+`fmtSize`, `GET /api/agent-files` 그룹을
`<details>` 폴더 토글로 표시, `GET /api/file`로 미리보기/다운로드;
`availTabs`에 항상 포함, 헤더 `#filesbtn`이 `openRside("files")`).
agents 탭(`renderAgents`+`refreshLiveAgents` 5초 갱신,
`GET /api/agents` live 세션을 부모 묶음으로 표시;
`agentRowHtml`, 펼치기(`agentOpen`)+`adoptSession(sid)` 진입).
세션 목록 펼치기(conv.js `drawConvs` 내 `agentChildren`/`cagents`+
`agentchild` 행, 클릭 시 `adoptSession`).

## main.js — 부팅 전용

옵저버 등록 → 테마·언어·칩·목록·정보·모드·게이트·우측패널 순 초기화 →
URL의 세션 id가 로컬에 없을 때만 서버 조회로 입수.
실행문만 있고 정의는 두지 않는다. 순서를 바꾸지 않는다.

---

## 전체 함수 색인 (기계 생성, 158개)

모듈별 전체 목록. 동작 설명은 위 섹션을 본다. 새 함수를 추가하면
여기에도 한 줄을 추가한다(수동 동기화).

### util.js
- `esc()`
- `escAttr()`
- `tblCellMD()`
- `tblToMD()`
- `tblToCSV()`
- `routeId()`
- `goalFence()`
- `normGoalItems()`
- `convToMd()`
- `truncStr()`
- `thoughtKind()`
- `diffLineClass()`
- `isDiffText()`
- `diffLinesHtml()`
- `thoughtSummary()`
- `isOutputTruncated()`
- `slimConvsForSave()`
- `gateFor()`
- `sortConvs()`
- `diffOnly()`
- `shouldNotifyCompletion()`
- `timeStr()`

### icons.js

### i18n.js
- `t()`
- `setText()`
- `applyLang()`

### render.js
- `renderMath()`
- `hl()`
- `vizHtml()`
- `renderText()`

### message.js
- `addMsg()`
- `agentFileUrl()`
- `async openAgentFile()`
- `attRowHtml()`
- `resolveLinkPath()`
- `decoratePaths()`
- `async openPathLink()`
- `decorateMath()`
- `decorateCode()`
- `decorateTables()`

### thoughts.js
- `thoughtIcon()`
- `setRowSummary()`
- `staticRowNote()`
- `ensureThoughtRow()`
- `syncThoughtHead()`
- `updateThoughtHead()`
- `loadFullLog()`
- `addThoughtLog()`
- `markThoughtDone()`
- `updateThought()`
- `collectThoughts()`
- `markThoughtsDone()`
- `renderThoughtsStatic()`
- `toggleThoughtDetail()`

### conv.js
- `loadConvs()`
- `persistConvs()`
- `curConv()`
- `setRoute()`
- `saveConv()`
- `saveMsg()`
- `persistLive()`
- `keepN()`
- `touchLive()`
- `inputGated()`
- `updateGate()`
- `updateOsChip()`
- `saveScroll()`
- `backfillCwd()`
- `openConv()`
- `async openFsPicker()`
- `hideFsPicker()`
- `renderRoots()`
- `async fsLoad()`
- `renderFsCrumbs()`
- `renderFsList()`
- `convSortMode()`
- `paintSortBtn()`
- `drawConvs()`
- `showCtx()`
- `hideCtx()`
- `renderSortMenu()`
- `hideSortMenu()`

### chat.js
- `paintSendTitle()`
- `setSendStop()`
- `startEdit()`
- `cancelEdit()`
- `finishEdit()`
- `async saveEditedMessage()`
- `async branchFromMessage()`
- `exportConv()`
- `footFor()`
- `lastAiText()`
- `async copyText()`
- `async flashCopy()`
- `notifyCompletion()`
- `finishAiTurn()`
- `sealAiTurn()`
- `async postChatStream()`
- `async runStreamTurn()`
- `goalPending()`
- `async goalAutoChain()`

### composer.js
- `drawSlash()`
- `autoGrow()`
- `setMode()`
- `addFeat()`
- `featPrefixes()`
- `renderPlusMenu()`
- `chipList()`
- `renderChips()`
- `attCwd()`
- `openPicker()`
- `downscaleImage()`
- `async uploadFiles()`
- `renderAttachBar()`
- `clearAtts()`

### usage.js
- `fmtNum()`
- `barsSVG()`
- `ucard()`
- `fmtMoney()`
- `rateFor()`
- `dayCost()`
- `bucketize()`
- `tsGraph()`
- `async refreshPrices()`
- `drawUsage()`

### ui.js
- `applySide()`
- `setSide()`
- `availTabs()`
- `renderRsideTabs()`
- `closeRsideTab()`
- `applyRside()`
- `setRside()`
- `openRside()`
- `drawRside()`
- `renderGoal()`
- `renderHelp()`
- `fmtSize()`
- `async renderFiles()`
- `async refreshLiveAgents()`
- `agentChildren()`
- `async adoptSession()`
- `agentRowHtml()`
- `async renderAgents()`
- `goalSetPrompt()`
- `goalTurnPrompt()`
- `loadTheme()`
- `renderPalettes()`
- `applyTheme()`
- `saveTheme()`
- `showModal()`
- `skRow()`
- `async loadSkills()`
- `async loadUsage()`
- `hideModal()`
- `async loadAccount()`
- `fillSelect()`
- `paintYolo()`
- `async refreshPrefs()`
- `async refreshInfo()`

### main.js
