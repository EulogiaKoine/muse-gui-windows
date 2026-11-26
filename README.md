# muse-gui

WSL2에서 도는 `muse` CLI용 로컬 챗 GUI입니다. 중계 서버(Python stdlib)와
브라우저 UI(자체 정적 파일 + 동봉된 KaTeX)로 구성됩니다.

- [1. 전체 흐름](#1-전체-흐름30초-요약)
- [2. 준비물](#2-준비물)
- [3. 설치](#3-설치따라하기)
- [4. 업데이트](#4-업데이트)
- [5. 사용법](#5-사용법)
- [6. 문제 해결](#6-문제-해결)
- [7. Skills](#7-skills)
- [8. License](#8-license)
- [9. Contribute](#9-contribute)

## 1. 전체 흐름(30초 요약)

1. Windows에 WSL2(리눅스)를 켭니다.
2. WSL 안에서 `git`·`nodejs`·`python3`를 설치합니다.
3. `muse` CLI를 설치하고 로그인합니다.
4. 이 저장소를 받아 `muse-gui` 명령 하나로 실행합니다.
5. Windows 브라우저에 뜨는 채팅 화면에서 대화합니다.

에이전트는 항상 WSL 리눅스 위에서 일하고, 사용자는 익숙한
브라우저에서 대화합니다. `muse-code`를 Windows에서 직접 실행하는
방식은 동작이 불안정해서 이 구조를 택했습니다.

## 2. 준비물

- Windows 10(2004 이상) 또는 Windows 11
- `muse-code` 계정과 API 키(유료 모델 호출용 결제 수단 포함)
- 아래 3장의 명령들을 순서대로 실행할 수 있는 환경이면 됩니다

## 3. 설치(따라하기)

아래 명령은 **그대로 복사해서 실행**하면 됩니다. `#` 뒤는 설명이라
복사에 포함해도 됩니다.

### 3.1 WSL2 켜기 (Windows PowerShell에서)

`WSL`이란 Windows 안에서 돌아가는 진짜 리눅스입니다.
`PowerShell`(파란 창)을 열고 아래 한 줄을 실행합니다.

```powershell
wsl --install
```

- PC를 재부팅하면 Ubuntu 등 리눅스 배포판 초기 설정(사용자명·암호)이
  뜹니다. 화면 안내대로 만듭니다.
- 이후 WSL 터미널은 시작 메뉴의 `Ubuntu`로 열거나, PowerShell에서
  `wsl`이라고 치면 들어갑니다. 아래 3.2부터는 전부 이 WSL 터미널에서
  실행합니다.

```powershell
wsl
```

### 3.2 WSL 안 기본 도구

```bash
sudo apt update && sudo apt install -y git nodejs npm python3
```

- `git`: 이 프로그램 소스를 받는 용도입니다.
- `nodejs`·`npm`: 기여용 테스트 하네스 실행에만 씁니다. 평소
  대화·서버 동작에는 필요 없습니다.
- `python3`: 중계 서버 실행용입니다(표준 라이브러리만 씁니다).

설치 확인(버전 번호가 뜨면 정상):

```bash
node --version
python3 --version
```

### 3.3 muse-code 설치와 로그인

공식 설치 스크립트로 설치합니다. 스크립트는 bash 전용이므로
`sh`가 아니라 반드시 `bash`로 실행합니다.

```bash
curl -fsSL https://dev.meta.ai/install.sh | bash
```

설치 후 로그인합니다.

```bash
muse login
```

- `muse`란 Meta의 코딩 에이전트 CLI입니다. 실제 일을 하는 본체이고,
  이 GUI는 그 본체와 대화하는 화면일 뿐입니다.
- 사용할 모델은 `muse-spark-1.3-contributor`를 권장합니다
  (GUI 하단 모델 선택 또는 실행 시 `muse-gui --model` 인자).
- TUI(터미널 대화 화면)를 직접 보고 싶으면 `muse`만 입력합니다.

### 3.4 muse-gui 설치와 실행

WSL 터미널의 **어느 디렉터리에서 실행해도 됩니다**. 저장 위치는
아래 명령에 고정 경로로 적혀 있습니다.

```bash
git clone https://github.com/EulogiaKoine/muse-gui-windows.git ~/.local/share/muse-gui
```

바로가기(심볼릭 링크)를 만들어 아무 곳에서나 `muse-gui`로 실행합니다.

```bash
mkdir -p ~/.local/bin
ln -sf ~/.local/share/muse-gui/bin/muse-gui ~/.local/bin/muse-gui
```

- `ln -s`는 윈도우의 "바로가기 만들기"와 같은 명령입니다.
- `~/.local/bin`은 Ubuntu가 로그인 시 자동으로 PATH에 넣는 개인
  명령어 폴더입니다. 방금 만든 폴더라면 터미널을 한 번 닫았다
  열어야 적용됩니다. 확인은 아래 명령으로 합니다.

```bash
echo $PATH
```

출력에 `/home/<사용자명>/.local/bin`이 보이면 정상입니다.

이제 실행합니다.

```bash
muse-gui
```

- 실행하면 Windows 기본 브라우저에 `http://127.0.0.1:8765/` 가
  자동으로 열립니다. 열리지 않으면 위 주소를 직접 입력합니다.
- 종료는 터미널에서 `Ctrl+C`입니다(서버 프로세스도 함께 끝납니다).
- 저장소 위치를 바꾸고 싶으면 `MUSE_GUI_DIR` 환경 변수로 지정합니다.

```bash
MUSE_GUI_DIR=/원하는/경로 muse-gui
```

실행 옵션은 다음과 같습니다.

```bash
muse-gui [--port 8765] [--host 127.0.0.1] [--no-open] [MUSE_OPTIONS]
```

- `--port`·`--host`·`--no-open`만 런처가 소비합니다. `--no-open`은
  브라우저 자동 열기를 생략합니다(서버는 그대로 뜹니다).
- 나머지 인자는 모든 `muse exec` 호출에 그대로 전달됩니다.

```bash
muse-gui --model muse-spark-1.3-contributor
muse-gui --port 8766
muse-gui --no-open --reasoning-effort low
```

- `--yolo`는 기본 켜짐이라 따로 주지 않아도 `exec`에 자동 추가됩니다.
  명령줄에 직접 `--yolo`/`--no-yolo`를 주면 그 지정이 우선합니다.

## 4. 업데이트

업데이트는 **저장소가 있는 디렉터리에서** 받아오면 됩니다.
설치 때 위치를 바꾸지 않았다면 아래 그대로 실행합니다.

```bash
cd ~/.local/share/muse-gui
git pull
```

- 실행 중인 서버가 있다면 먼저 터미널에서 `Ctrl+C`로 끄고,
  업데이트 후 `muse-gui`로 다시 켭니다. 실행 중인 코드가 통째로
  바뀌므로 재시작 없이 반영되지 않습니다.
- 지금 버전을 확인하려면 저장소 안의 `VERSION` 파일을 봅니다.

```bash
cat ~/.local/share/muse-gui/VERSION
head -20 ~/.local/share/muse-gui/CHANGELOG.md
```

- 브랜치는 `main`(배포용)과 `dev`(개발 중) 둘입니다. 일반 사용은
  `main`에 머무르는 것을 권장합니다. 현재 브랜치 확인과 전환은
  아래처럼 합니다.

```bash
git branch --show-current
git checkout main   # 배포판으로 돌아가기
```

## 5. 사용법

- `muse-gui`를 입력하면 브라우저에 채팅 화면이 열립니다.
- 작업 디렉터리는 로컬 파일 선택기로 고릅니다. 세션마다 작업
  디렉터리를 따로 가지고, 에이전트는 WSL 리눅스 환경에서 그
  디렉터리 기준으로 작업합니다. 디렉터리를 바꾸면 새 대화
  (= 새 세션)로 시작합니다.
- WSL 경로는 Windows 경로와 이렇게 대응합니다.
  `C:\Users\철수\Documents`는 WSL에서
  `/mnt/c/Users/철수/Documents`입니다. 채팅 상단의 작업 경로를
  클릭하면 Windows 탐색기로 그 폴더가 열립니다.
- 작업 중 생기는 임시 파일·기억·첨부·스크립트는
  `<작업 디렉터리>/.agent/` 아래에 모입니다(`tmp/`, `memory/`,
  `attachments/`, `sessions/`). 서버 시작 시 자동으로 생성되므로
  직접 만들 필요가 없습니다.
- 입력창의 `+` 메뉴·드래그앤드롭·붙여넣기로 파일을 첨부합니다.
  큰 이미지는 전송 전에 브라우저에서 자동으로 줄여서 보냅니다.
- New Chat 빈 화면에서도 입력창 하단 푸터의 모델 선택과 `+` 메뉴가
  그대로 동작합니다. 푸터의 `yolo` 토글은 세션 생성·이어가기 시점에도
  보여서, 언제든 눌러 다음 턴부터 적용할 수 있습니다.
- 에이전트 응답은 스트리밍으로 표시되며, 중간 추론 과정은 통합 블록에
  접힘 형태로 쌓입니다. 각 세부 블록은 펼쳐서 로그를 볼 수 있습니다.
- `/goal`로 목표를 등록하면 우측 사이드바에 진행도가 표시됩니다.
  목표가 끝나지 않으면 자동으로 다음 턴을 이어갑니다(최대 6회).
  `/help`로 입력 가능한 명령 목록을 봅니다.
- 말풍선 `✎`로 이전 메시지를 고치면 해당 지점부터 새 세션으로
  분기하고, 기존 로그는 `.agent/sessions/<sid>/` 에 보관됩니다.
  말풍선 메뉴의 `MD로 내보내기`로 대화를 파일로 저장합니다.
- 설정 모달의 사용량 대시보드에서 토큰·비용 시계열 그래프를 봅니다.
  모델별 요금표(`prices.json`)로 비용을 계산하고, `비용 업데이트`
  버튼으로 요금표를 갱신할 수 있습니다.

원칙: 서버는 Python 표준 라이브러리만 쓰고, 브라우저 쪽 외부
의존성도 없습니다(CDN 없음 — 수식 렌더용 KaTeX도 서버에 동봉된
파일로 서빙합니다). 모델 출력 HTML은 `esc()` 후 허용 목록만
복원합니다. 슬래시는 하드코딩하지 않고 `muse --help` 파싱으로
발견·실행합니다(5분 캐시). 자세한 정책은 [SLASH.md](SLASH.md),
작업 디렉터리 규칙은 [WORKSPACE.md](WORKSPACE.md)를 봅니다.

## 6. 문제 해결

포트가 이미 사용 중이면 다른 포트로 띄웁니다.

```bash
muse-gui --port 8766
```

브라우저가 자동으로 안 열리면 서버는 떠 있으므로 주소만 직접
입력합니다(`--no-open`을 준 경우도 마찬가지).

```text
http://127.0.0.1:8765/
```

`muse-gui: command not found`가 뜨면 바로가기가 없거나 PATH
미반영입니다. 3.4의 `mkdir`·`ln -s`를 다시 실행하고 터미널을
닫았다 여세요.

서버가 바로 꺼지면 대개 포트가 겹친 것입니다. 에러 메시지의
포트를 확인하고 `--port`로 피하세요.

## 7. Skills

설정 모달의 스킬 패널에서 `muse skills list` 결과를 scope별(사용자·
프로젝트·플러그인·내장)로 보고, 켜기/끄기·본문 보기가 됩니다.
`새로 만들기`는 이름·설명·본문을 받아 검증(`muse skills validate`)을
통과한 것만 사용자 scope에 설치합니다.

채팅에서는 ` ```viz-html ` 코드펜스로 인터랙티브 시각화를 넣을 수
있습니다. `allow-scripts` 단독 sandbox iframe으로만 실행되며
same-origin 접근·팝업·다운로드는 차단됩니다.

임의 스킬을 직접 추가하려면 `$CONFIG_DIR/skills/<name>/SKILL.md`
형태로 만들고 `muse skills install --scope user` 로 설치합니다(예:
시각화·웹검색 패턴). 에이전트 전용 작업 원칙·코드맵은 git 미추적
`docs/agent/`에 둡니다.

## 8. License

MIT입니다. 서버가 의존하는 내부 라이브러리는 표준 라이브러리뿐이고,
브라우저에 동봉되는 KaTeX(JS·CSS·폰트)는 MIT(폰트는 SIL OFL)이며
외부 CDN을 거치지 않고 이 저장소에서 직접 서빙됩니다.

## 9. Contribute

포크 후 Pull Request는 자유롭게 받습니다. 동작을 바꾸는 변경은
`tests/run.sh`(JS 구문·py 컴파일·렌더 하네스)를 통과시켜서 올립니다.
배포 브랜치(`main`) 통합은 사람 손으로 하며, 이때 JS는 세미콜론 없이
1줄 조건식은 중괄호 없이 쓰는 스타일로 정리합니다.

## 버전 관리

CalVer입니다. `VERSION` 파일을 올리고 CHANGELOG.md에 기록합니다.
개발 작업은 `dev` 브랜치에서 하고, `main` 반영은 요청이 있을 때만
합니다.
