# 아키텍처 현황 (스냅샷 — 변경 시 이 파일을 함께 고친다)

> 원칙·방법론은 [AGENTS.md](AGENTS.md), 결정 이유는 [DECISIONS.md](DECISIONS.md),
> 알려진 이슈는 [ISSUES.md](ISSUES.md)를 본다.

## 진입점

- `~/.local/bin/muse-gui` (런처, bash): `--port`·`--host`·`--no-open` 분리 후
  `MUSE_GUI_*` env로 `server.py` 실행. `muse` 인자는 `MUSE_ARGS`로 전달.
- `server.py`: `ThreadingHTTPServer` + `Handler`. 정적 파일은
  `static/{js,css}/*.js|css` 화이트리스트로 서빙 + `Cache-Control: no-cache`.
  `index.html`의 `?v=__GUI_VERSION__`은 서버 시작 시 `VERSION`에서 읽는다.
- `index.html` → `static/js/*.js` 순서 로드 (상세 순서는
  [`static/INDEX.md`](../../static/INDEX.md)) → `main.js`가 부팅한다.

## 프론트엔드 모듈 (`static/js/`)

- `util.js`: 순수 함수(테스트 대상). DOM 없음.
- `conv.js`: 전역 상태(`convs`, `convKey`, `sessionId`) + 대화 저장소·목록·게이트.
- `icons.js`: 인라인 SVG 상수만.
- `i18n.js`: `STR`·`langCur`·`t()`·`applyLang`.
- `render.js`: 마크다운/코드/수식/테이블 렌더(테스트 대상).
- `thoughts.js`: 추론 블록 라이브+기록 렌더, 토글, 수집.
- `chat.js`: 메시지·편집·전송·턴 종료(`runStreamTurn`·`finishAiTurn`).
- `composer.js`: 입력창·슬래시·칩·+메뉴·yolo.
- `usage.js`: 사용량 상태+그래프(테스트 대상).
- `ui.js`: 사이드바·모달·설정·테마·스킬.
- `main.js`: 부팅 전용(옵저버+초기화+딥링크 입수). 정의를 두지 않는다.

## CSS (`static/css/`, link 순서대로 적용)

`base.css` → `shell.css` → `chat.css` → `thoughts.css` → `content.css` →
`ui.css`. 순서가 캐스케이드이므로 바꾸지 않는다.

## 데이터 흐름

1. 입력 → `POST /api/chat` 또는 `/api/chat/stream` →
   `muse exec --json` 스트리밍 → `{text, session_id}` →
   `renderText` → `addMsg` → `localStorage`(+슬림 저장).
2. `/X` → `dispatch_slash` (로컬/직접/제네릭/거부).
3. 우클릭 삭제 → conv 제거 + `POST /api/session/delete`.
4. 대화별 작업 디렉터리는 `prepare_workdir()`이 보장(`<cwd>/.agent/`).

## 불변식 (깨지면 버그다)

- `conv.js`의 `let convs = loadConvs()`는 `util.js`가 먼저 로드되어야
  동작한다(`normGoalItems` 필요). 로드 순서를 바꾸지 않는다.
- `main.js`의 `new MutationObserver(setMode)`는 `composer.js` 정의가
  먼저 있어야 한다.
- 파일 간 참조는 호출 시점에만 일어난다. 단, 위 두 줄과
  `index.html`·`server.py` 화이트리스트·`tests/run.sh`는 예외이므로
  파일 추가·삭제 시 셋을 함께 고친다.
- `persistConvs`는 실패해도 인메모리 대화를 건드리지 않는다
  (슬림 저장 → 1회 경고).
- 게이트: `sid`가 있으면 항상 재실행 경로(`resume`), 디렉터리 요구는
  `sid` 없는 새 대화에서만 나온다.
