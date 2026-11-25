# Changelog

## 2026.11.26.2

- 코드블럭 복사 버튼을 우상단(언어 라벨 오른쪽)으로 이동.
- 설정 모달 탭화: 일반·계정(로그인 안내)·사용량(원장 집계+구독 조회).
- `GET /api/usage`: 총 턴·모델별 토큰·세션별 표 + `muse usage --json`.
- +버튼을 입력 하단 칩으로 전환: 시각화(엄격 스펙)·웹 검색(필수 수행 지시).
  슬래시 입력 시 칩 미적용. 웹 검색 칩 활성화, 업로드는 준비 중 유지.

## 2026.11.26.1

- 테마 팔레트 변수 확대 (`--ok`·`--err`·`--code-tint`), 슬래시 팝업 명시 색.
- 복사 버튼 아이콘화·무테두리 (hover 스케일 유지), 복사 피드백 ✓/✗.
- Enter=줄바꿈, Ctrl/Cmd+Enter=전송. 슬래시 팝업 선택은 Tab.
- 입력창 pill 스타일, 전송 버튼 원형 아이콘.
- 푸터 개편: +버튼을 모델/effort pill 셀렉트 왼쪽으로 이동.

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
