# muse-gui

WSL2에서 도는 `muse` CLI용 로컬 챗 GUI입니다. 중계 서버(Python stdlib)와
브라우저 UI(무의존 단일 페이지)로 구성됩니다.

## 1. Intro

`muse-code`를 Windows에서 직접 실행하거나, 그 API를 다른 CLI에 이식하는
선택지는 모두 동작이 불안정하고 거슬리는 구석이 많습니다. 그래서 실행 환경은
WSL2 리눅스에 두고, 조작 화면만 Windows 브라우저로 띄우는 구조를 택했습니다.
에이전트는 항상 리눅스 파일시스템·셸 위에서 일하고, 사용자는 익숙한
브라우저에서 대화합니다.

## 2. Installation

### 2.1 WSL2와 기본 도구

```powershell
wsl --install
```

재부팅 후 WSL 셸에서 기본 도구를 설치합니다.

```bash
sudo apt update && sudo apt install -y git nodejs npm python3
```

### 2.2 muse-code 계정과 CLI

1. 개발자 사이트에서 계정을 만들고 API 키를 발급받습니다. 유료 모델 호출용
   결제 수단을 등록합니다.
2. WSL 셸에서 공식 설치 스크립트로 `muse-code`를 설치합니다.
   스크립트는 bash 전용이므로 `sh`가 아니라 `bash`로 실행합니다.

   ```bash
   curl -fsSL https://dev.meta.ai/install.sh | bash
   ```
3. TUI(Terminal UI)를 한 번 실행해 `--yolo` 동작을 확인하고 로그인합니다.
4. 사용할 모델을 `muse-spark-1.3-contributor`로 설정합니다
   (GUI 하단 모델 선택 또는 `muse-gui --model` 인자).

### 2.3 muse-gui 설치와 실행

```bash
git clone https://github.com/EulogiaKoine/muse-gui-windows.git ~/.local/share/muse-gui
ln -s ~/.local/share/muse-gui/bin/muse-gui ~/.local/bin/muse-gui
muse-gui
```

실행하면 `http://127.0.0.1:8765/` 가 Windows 브라우저에 열립니다.
종료는 `Ctrl+C`입니다. 저장소 위치를 바꾸려면 `MUSE_GUI_DIR` 환경 변수를
사용합니다.

```bash
muse-gui [--port 8765] [--host 127.0.0.1] [--no-open] [MUSE_OPTIONS]
```

`--port`·`--host`·`--no-open`만 런처가 소비하고, 나머지 인자는 모든
`muse exec` 호출에 그대로 전달됩니다. 예: `muse-gui --model <ID>`.
`--yolo`는 기본 켜짐이라 따로 주지 않아도 `exec`에 자동 추가됩니다.
명령줄에 직접 `--yolo`/`--no-yolo`를 주면 그 지정이 우선합니다.

## 3. Usage

- `muse-gui`를 입력하면 브라우저에 채팅 화면이 열립니다.
- 작업 디렉터리는 로컬 파일 선택기로 고릅니다. 세션마다 작업 디렉터리를
  따로 가지고, 에이전트는 WSL 리눅스 환경에서 그 디렉터리 기준으로
  작업합니다. 디렉터리를 바꾸면 새 대화(= 새 세션)로 시작합니다.
- 작업 중 생기는 임시 파일·기억·스크립트는 `<작업 디렉터리>/.agent/`
  아래에 모입니다(`tmp/`, `memory/`). 서버 시작 시 자동으로 생성되므로
  직접 만들 필요가 없습니다.
- New Chat 빈 화면에서도 입력창 하단 푸터의 모델 선택과 `+` 메뉴가
  그대로 동작합니다. 푸터의 `yolo` 토글은 세션 생성·이어가기 시점에도
  보여서, 언제든 눌러 다음 턴부터 적용할 수 있습니다.
- 에이전트 응답은 스트리밍으로 표시되며, 중간 추론 과정은 통합 블록에
  접힘 형태로 쌓입니다. 각 세부 블록은 펼쳐서 로그를 볼 수 있습니다.
- `/goal`로 목표를 등록하면 우측 사이드바에 진행도가 표시됩니다.
  `/help`로 입력 가능한 명령 목록을 봅니다.
- 설정 모달의 사용량 대시보드에서 토큰·비용 시계열 그래프를 봅니다.
  모델별 요금표(`prices.json`)로 비용을 계산하고, `비용 업데이트` 버튼으로
  요금표를 갱신할 수 있습니다.
- 말풍선 `✎`로 이전 메시지를 고치면 해당 지점부터 새 세션으로 분기하고,
  기존 로그는 `.agent/sessions/<sid>/` 에 보관됩니다. `MD` 버튼으로 대화를
  내보냅니다.

원칙: 오프라인·무의존(CDN·외부 라이브러리 없음)입니다. LaTeX·하이라이트는
자작 렌더러로 근사합니다. 모델 출력 HTML은 `esc()` 후 허용 목록만
복원합니다. 슬래시는 하드코딩하지 않고 `muse --help` 파싱으로 발견·
실행합니다(5분 캐시). 자세한 정책은 [SLASH.md](SLASH.md), 작업 디렉터리
규칙은 [WORKSPACE.md](WORKSPACE.md)를 봅니다.

## 4. Skills

설정 모달의 스킬 패널에서 `muse skills list` 결과를 scope별(사용자·
프로젝트·플러그인·내장)로 보고, 켜기/끄기·본문 보기가 됩니다.
`새로 만들기`는 이름·설명·본문을 받아 검증(`muse skills validate`)을
통과한 것만 사용자 scope에 설치합니다.

채팅에서는 ` ```viz-html ` 코드펜스로 인터랙티브 시각화를 넣을 수 있습니다.
`allow-scripts` 단독 sandbox iframe으로만 실행되며 same-origin 접근·
팝업·다운로드는 차단됩니다.

임의 스킬을 직접 추가하려면 `$CONFIG_DIR/skills/<name>/SKILL.md` 형태로
만들고 `muse skills install --scope user` 로 설치합니다(예: 시각화·웹검색
패턴). 에이전트 전용 작업 원칙·코드맵은 git 미추적 `docs/agent/`에 둡니다.

## 5. License

MIT입니다. 의존하는 내부 라이브러리는 표준 라이브러리뿐입니다.

## 6. Contribute

포크 후 Pull Request는 자유롭게 받습니다. 동작을 바꾸는 변경은
`tests/run.sh`(JS 구문·py 컴파일·렌더 하네스)를 통과시켜서 올립니다.
배포 브랜치(`main`) 통합은 사람 손으로 하며, 이때 JS는 세미콜론 없이
1줄 조건식은 중괄호 없이 쓰는 스타일로 정리합니다.

## 버전 관리

CalVer입니다. `VERSION` 파일을 올리고 CHANGELOG.md에 기록합니다.
개발 작업은 `dev` 브랜치에서 하고, `main` 반영은 요청이 있을 때만 합니다.
