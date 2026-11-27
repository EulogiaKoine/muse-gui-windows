# static/ 모듈 인덱스

브라우저는 `index.html` 순서대로 `<script>`·`<link>`를 로드한다.
의존 방향은 아래 번호 순이며, 역방향 참조는 오직 호출 시점에만 일어난다.

## JS (`static/js/`, 로드 순서대로)

| # | 파일 | 역할 | 주요 심볼 |
|---|------|------|-----------|
| 1 | `util.js` | 순수 함수(테스트 대상). DOM 없음 | `esc`, `truncStr`, `thoughtKind`, `diffLineClass`, `diffLinesHtml`, `diffOnly`, `isOutputTruncated`, `chatpadWidth`, `errText`, `gateFor`, `sortConvs`, `slimConvsForSave`, `thoughtSummary`, `shouldNotifyCompletion`, `routeId`, `goalFence`, `normGoalItems`, `convToMd` |
| 2 | `conv.js` | 전역 상태 + 대화 저장소·목록·게이트·입장 | `convs`, `convKey`, `sessionId`, `saveConv`, `saveMsg`, `openConv`, `drawConvs`, `sortConvs` 사용, `inputGated`, `backfillCwd`, `liveSessions`, `renamingKey`, `placePopup`, `refreshFsRoots` |
| 3 | `icons.js` | 인라인 SVG 상수만 | `ICON_*` |
| 4 | `i18n.js` | 문자열·언어 상태 | `STR`, `langCur`, `t`, `applyLang`, `paintChatChrome`, `paintSettingsStatic`, `paintFsStatic`, `paintCtxMenu` |
| 5 | `render.js` | 마크다운/코드/수식/테이블 렌더 | `renderText`, `hl`, `renderMath`, `vizHtml`, `decorateCode`, `decorateMath`, `decorateTables` |
| 6 | `message.js` | 말풍선·링크·수식/코드 장식 | `addMsg`, `decorateCode`, `decorateMath`, `decorateTables`, `decoratePaths`, `resolveLinkPath`, `openPathLink` |
| 7 | `thoughts.js` | 추론 블록(라이브+기록) | `updateThought`, `collectThoughts`, `renderThoughtsStatic`, `toggleThoughtDetail`, `loadFullLog`, `ensureThoughtRow` |
| 8 | `chat.js` | 메시지 편집·전송·턴 종료 | `startEdit`, `branchFromMessage`, `postChatStream`, `runStreamTurn`, `finishAiTurn`, `notifyCompletion` |
| 9 | `composer.js` | 입력창·슬래시·칩·+메뉴·yolo | `drawSlash`, `renderChips`, `setMode`, `autoGrow` |
| 10 | `usage.js` | 순수 함수(테스트 대상). DOM 없음 | `fmtNum`, `fmtMoney`, `rateFor`, `dayCost`, `bucketize` |
| 11 | `ui.js` | 사이드바·모달·설정·스킬·테마·fs 일부 | `applyTheme`, `saveTheme`, `loadTheme`, `drawRside`, `loadSkills`, `showModal` |
| 12 | `main.js` | 부팅 전용: 옵저버+초기화+딥링크 입수 | (실행문만, 정의 없음) |

규칙:
- 새 전역 함수 추가 시 위 표의 영역을 따르고, 어긋나면 이 파일을 함께 고친다.
- 파일 간 참조는 호출 시점에만 일어난다. 단, 평가 시점 예외 2건은 고정이다:
  `conv.js`의 `let convs = loadConvs()`는 `util.js`가 먼저 필요하고,
  `main.js`의 `MutationObserver(setMode)`는 `composer.js`가 먼저 필요하므로
  위 순서를 바꾸지 않는다.
- DOM 직접 접근 코드는 테스트에 올리지 않는다. 테스트 대상은
  `util.js` + `render.js` + `icons.js`(렌더) 및 `usage.js`(사용량) 전체이다.

## CSS (`static/css/`, link 순서대로)

| 파일 | 범위 |
|------|------|
| `base.css` | 토큰·리셋·앱 프레임·사이드바·세션 목록 |
| `shell.css` | 헤더·게이트·우측 패널·fs 모달 |
| `chat.css` | 말풍선·접기·편집 |
| `thoughts.css` | 추론 블록·토글·diff 하이라이트 |
| `content.css` | 메시지 본문(코드·표·수식·링크) |
| `ui.css` | 입력창·모달·설정·스킬·사용량 위젯 |
