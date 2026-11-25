# Changelog

## 2026.11.26

- 프론트 분할: `index.html` 껍데기 + `static/app.js` + `static/style.css`.
  오프라인·무의존 원칙 유지.
- `muse --help` 파싱 5분 TTL 캐시 (슬래시 자동완성·제네릭 실행).
- `/api/info`에 `gui` 버전 필드 추가. `VERSION` 파일 도입 (CalVer).
- 하네스: `tests/run.sh` (JS 구문·py 컴파일·렌더 16건).
- 문서: README·CHANGELOG·`docs/agent/` (AGENTS·CODEMAP, git 미추적).
- `.gitignore`: 실행 상태(`state.json`·`usage.json`)·`__pycache__`·`docs/agent/`.
- git 저장소 초기화.

## 이전 (버전 관리 전)

- LaTeX·코드 하이라이트·Obsidian식 스타일·시각화(viz-html) 패널.
- 사용자 버블만 표시, 에이전트는 플레인. 복사·펜(수정 재전송).
- 사이드바 우클릭 삭제가 실제 세션 기록까지 삭제 (`/api/session/delete`).
- 새 채팅 로비 화면. 설정 모달(테마·강조색·계정·토큰).
