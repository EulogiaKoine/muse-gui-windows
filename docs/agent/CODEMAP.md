# CODEMAP (색인 — 상세는 ARCHITECTURE.md)

## 진입점

- `~/.local/bin/muse-gui` (런처, bash): `--port`·`--host`·`--no-open` 분리 후
  `MUSE_GUI_*` env로 `server.py` 실행. `muse` 인자는 `MUSE_ARGS`로 전달.
- `server.py: main()` (末尾): `ThreadingHTTPServer` + `Handler`.
- `index.html` → `static/js/*.js` (util→…→main 순서) + `static/css/*.css`.
  `main.js` 끝단이 부팅이다. `static/INDEX.md`에 모듈표가 있다.

## server.py

- 설정: `HOST`·`PORT`·`MUSE_ARGS` → `STATE`(model/effort, `state.json` 영속).
- 슬래시: `dispatch_slash()` — new/copy/help 로컬, usage/status/export/
  model/effort 직접, plan/skills/model-profile은 발견 기반 실행,
  나머지는 `DENY_SLASH` → `mcp` 읽기 검사 → `cli_help` 기반 제네릭 실행.
- 채팅: `handle_chat_stream()` — `muse exec --json` 스트리밍 중계,
  `run_muse_exec()` + `record_usage()` (usage.json 원장).
- 삭제: `delete_session()` (`/api/session/delete`, UUID·실행중·containment).
- 조회: `/api/info`·`/api/slash`·`/api/usage`·`/api/session_workspace`·
  `/api/tool_output`·`/api/account`·`/api/prefs`·`/api/skills*`.
- 정적: `/` → `serve_index()` + SPA 폴백(`/<id>`) + `?v=__GUI_VERSION__`.
  `static/{js,css}/*.js|css`만 허용(그 외 404).

## static/js (로드 순서대로)

- `util.js` — 순수 함수(테스트 대상). `conv.js` — 전역 상태+대화 저장소·
  목록·게이트. `icons.js` — SVG 상수. `i18n.js` — STR·`t()`.
- `render.js` — 마크다운/코드/수식/테이블. `thoughts.js` — 추론 블록.
- `chat.js` — 메시지·편집·전송·턴. `composer.js` — 입력·슬래시·칩.
- `usage.js` — 사용량(테스트 대상). `ui.js` — 사이드바·모달·설정·스킬.
- `main.js` — 부팅 전용. `static/INDEX.md`에 전체 표가 있다.

## static/css (link 순서대로)

- `base.css` → `shell.css` → `chat.css` → `thoughts.css` →
  `content.css` → `ui.css`.

## 데이터 흐름

1. 입력 → `/api/chat`(스트림) → `muse exec --json` →
   `{text, session_id}` → `renderText` → `addMsg` → localStorage(슬림 저장).
2. `/X` → `dispatch_slash` (로컬/직접/제네릭/거부).
3. 우클릭 삭제 → conv 제거 + `POST /api/session/delete`.
