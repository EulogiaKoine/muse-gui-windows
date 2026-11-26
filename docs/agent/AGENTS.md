# muse-gui 에이전트 작업 원칙 (로컬 전용, git 미추적)

이 파일은 방법론만 담는다. 현재 구조·결정·이슈는 고정 값으로 적지 않고
`docs/agent/` 아래 별도 문서를 본다: 아키텍처 상태는 [ARCHITECTURE.md](ARCHITECTURE.md),
결정 기록은 [DECISIONS.md](DECISIONS.md), 알려진 이슈와 해결은 [ISSUES.md](ISSUES.md).

## 작업 전 확인

- 작업 전 `git status`로 작업트리가 깨끗한지 확인한다. 더럽다면 먼저
  커밋하거나(사용자 요청 시) 내용을 파악하고 진행한다.
- 새 요청이 오면 기본적으로 이전 작업을 먼저 커밋한 뒤 시작한다.
  사용자가 직접 거절할 때만 커밋을 보류한다.
- 저장소: `~/.local/share/muse-gui` (`main` 브랜치, CalVer `VERSION`+`CHANGELOG`).
- 커밋 신원: repo-local `Eulogia_Koinē <EulogiaKoine@users.noreply.github.com>`.
- 푸시·태그는 명시 요청 때만. `dev` 작업 후에도 마찬가지다.

## 검증 (필수)

- `tests/run.sh` 통과 없이 완료를 주장하지 않는다. 이 스크립트는
  pre-commit 훅에서도 자동 실행된다.
- 테스트는 순수 모듈(`static/js/util.js`·`render.js`·`icons.js`)과
  `usage.js` 전체를 평가한다. DOM·브라우저 코드는 테스트에 올리지 않는다.
- DOM 동작 변경은 `node`+최소 DOM 스텁(`/tmp` 스크래치)으로
  재현·확인하고, 서술로 때우지 않는다.
- 헤드리스 브라우저가 없으므로 시각 검증은 할 수 없다. 렌더 변경 시
  그 한계를 결과에 명시한다.

## 코드 스타일

- `dev`의 일상 작업은 원래 스타일(세미콜론·기존 중괄호)로만 작성한다.
  세미콜론 제거·1줄 조건식 중괄호 생략 등 beautify는 `main` 통합을
  사용자가 명시 요청할 때만 적용한다.
- 새 파일·함수 추가 시 `static/INDEX.md`의 모듈 경계를 따른다.
  어긋나면 인덱스를 함께 고친다.

## 보안

- 모델 출력은 항상 `esc()` 후 허용 목록만 복원. `innerHTML`에 원본을
  직접 넣지 않는다. `javascript:` URL·생성 iframe은 차단이 기본이다.
- 시각화(viz-html)는 `sandbox="allow-scripts"` 단독 iframe으로만 실행한다.
  `allow-same-origin`을 붙이지 않는다.
- `/api/session/delete`·`/api/tool_output` 외에 세션 저장소를 건드리는
  경로를 추가하지 않는다. 추가 시 UUID 검증 + containment 검사를 둔다.
- `muse` 세션 로그(`~/.local/share/muse/sessions/`)는 읽기 전용 증거로만
  취급한다. 수정·이동·삭제 금지(삭제 API는 `rmtree`지 로그 편집이 아니다).

## 서버 프로세스

- 실행 중인 서버는 내 프로세스라도 `pkill -f`로 잡지 않는다
  (패턴이 자기 셸에 매칭되어 자살한다). `ps`로 PID 확인 후 `kill PID`.
- 서버 재시작 후에는 `GET /`·`/api/info`·하네스를 돌린다.
- `app.js` 분할 이후 `static/js/*.js`, `static/css/*.css`가 추가·삭제되면
  `index.html`의 로드 목록과 `server.py` 화이트리스트를 함께 고친다.

## Git

- 커밋·푸시·태그는 사용자 명시 요청 때만.
- 상태 파일·에이전트 문서는 커밋하지 않는다(`.gitignore`).
- 버전은 CalVer (`VERSION` + `CHANGELOG` 기록).
- `dev` 작업물은 검증 후 커밋한다. `main` 병합·beautify·푸시는
  별도 지시가 있을 때만 수행한다.
- 전체 리팩터링(아키텍처 변경)은 사용자 요청 없이 시작하지 않는다.
  최적화 제안은 먼저 trade-off와 함께 보고하고 승인을 받는다.
