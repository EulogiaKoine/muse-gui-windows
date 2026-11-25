# muse-gui

WSL에서 도는 `muse` CLI용 로컬 채팅 GUI. 중계 서버(Python stdlib) +
브라우저 UI(의존성 없는 단일 페이지).

## 실행

```bash
muse-gui [--port 8765] [--host 127.0.0.1] [--no-open] [MUSE_OPTIONS]
```

`muse` 인자는 그대로 `muse exec`에 전달된다. 브라우저에서
`http://127.0.0.1:8765/` 를 연다. 종료는 Ctrl+C.

## 구조

| 경로 | 역할 |
|---|---|
| `server.py` | 중계 서버. `/api/chat`·`/api/slash`·`/api/models`·`/api/account`·`/api/prefs`·`/api/session/delete` 제공 |
| `index.html` | HTML 껍데기 (정적 에셋 로드만) |
| `static/app.js` | 채팅 UI·마크다운/수식 렌더러·시각화 패널 |
| `static/style.css` | 테마·말풍선·코드 하이라이트 스타일 |
| `VERSION` | CalVer (`YYYY.MM.DD`). `/api/info`의 `gui` 필드로 노출 |
| `SLASH.md` | 슬래시 처리 정책 (발견 기반 실행·deny 목록) |
| `WORKSPACE.md` | 작업 디렉터리 = 실행 cwd 정책 |
| `tests/` | 하네스 (`tests/run.sh`: JS 구문·py 컴파일·렌더 16건) |
| `docs/agent/` | 에이전트용 작업 원칙·코드맵 (git 추적 제외, 로컬 전용) |

## 원칙

- 오프라인·무의존: CDN·외부 라이브러리 없이 동작. LaTeX·하이라이트는
  자작 렌더러로 근사한다.
- 슬래시는 하드코딩하지 않고 `muse --help` 파싱으로 발견 실행한다
  (5분 TTL 캐시). 인증 변경·데몬 바인딩·init·타세션 명령은 거부한다.
- 모델 출력 HTML은 `esc()` 후 허용 목록만 복원한다. 시각화는
  `sandbox="allow-scripts"` 단독 iframe으로만 실행한다.
- `muse` 세션 로그는 읽기 전용으로 취급한다. 삭제는 전용 API로만,
  편집(rewind)은 지원하지 않는다.

## 버전 관리

CalVer. `VERSION` 파일을 올리고 CHANGELOG.md에 기록한다.
