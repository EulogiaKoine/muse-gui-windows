# Changelog

## 2026.11.26.5

- 사용량 탭에 시간-사용량 그래프 (Requests·Input·Output 카드 + SVG 바).
- 기간 토글 7d/30d/90d, svelte 참고안과 동일 구분.
- 서버: 세션 로그 `model_completed` 일자 집계 (`/api/usage`에 `daily`).
- 하네스에 `tests/usage.test.js` 추가 (7건).

## 2026.11.26.4

- 사용량 탭에 dev.meta.ai 콘솔 바로가기 추가.
- 입력창 자동확대 수정: `#inwrap` column 안에서 textarea가 `flex:1`로
  고정 높이에 갇히던 문제 → `flex:none` + `autoGrow()` + 전송 후 리셋.
- 정적 에셋 `?v=버전` 캐시버스터 (서버가 index.html 서빙 시 치환).

## 2026.11.26.3

- +버튼·모델/effort를 입력창 하단 푸터로 이동 (로비 제외).
- +메뉴·칩에 기능 아이콘 (시각화 차트·웹 검색 글로브).
- 전송 버튼 상단 고정, 입력창 최대 3배(132px) 확대.
- 강조색→팔레트 개명, 팔레트별 배경·패널 틴트 (라이트/다크).
- 설정 탭 모던화, 닫기 버튼 우상단 X.
- LaTeX 원본은 data-tex에 보관, 렌더 결과만 표시 + 호버 복사 아이콘.

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
