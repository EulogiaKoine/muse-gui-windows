# muse-gui 슬래시 처리표

원칙: 슬래시는 서버에 하드코딩하지 않고 `muse-code`에 직접 실행시킨다.
`muse --help`에서 하위 명령을 매번 파싱하므로 업데이트에도 코드 변경이 없다.

## 경로 4종

1. GUI 고유: `/new /clear /copy /help /goal` + `/quit /exit`
   에이전트 턴을 소모하지 않는다. `/clear`·`/copy`·`/goal`은 클라이언트에서
   직접 처리하고, `/new`·`/help`·`/quit`·`/exit`는 서버 안내로 처리한다.
   (`/goal`은 목표 등록과 우측 사이드바 진행 추적까지 담당한다.)
2. 세션 기준: `/usage /status /export /model /effort`
   TUI(Terminal UI)와 같은 의미. `/usage`는 세션 토큰 집계(원장)를
   마크다운 표로 보여주고, 구독 플랜은 `/plan`으로 본다.
3. 제네릭: 그 외 `muse` 하위 명령 전체.
   `muse <cmd> <args>`를 stdin 차단+120s 타임아웃+ANSI 제거로 실행.
4. 차단: 아래 표의 deny 항목. 인증 변경·데몬 바인딩·작업공간 기록·타세션
   부작용 범주라 의미 기준으로 고정된다.

## 항목별 정리

| 입력 | 경로 | 비고 |
|---|---|---|
| /usage /status /export /model /effort | 세션 기준 | TUI와 동일 의미. 원장은 usage.json에 영속화. /usage 출력은 md 표 |
| /plan /sessions /skills /model-profile | 직접 매핑 | 기본값·JSON 가공·안내문 부가 |
| /config /schema /trace /sandbox /voice | 제네릭 | 인자 없이 치면 사용법 출력 |
| /exec | 제네릭 | 프롬프트 필요. bare는 사용법 출력 |
| /plugins | 제네릭 | bare 입력은 전체 도움말이 길게 나옴. 하위 명령 권장 |
| /mcp | 제네릭(읽기만) | list/get만 통과. add·로그인 등은 차단 |
| /resume /recap /deep-research /permissions /memory | 안내 | 터미널 명령·채팅 대체안 표시 |
| /login /logout /auth | 차단 | 인증 변경 |
| /serve /attach /acp /mxp | 차단 | 데몬·프로토콜 바인딩 |
| /init | 차단 | 작업공간 기록 (`--dry-run` 미리보기 안내) |
| /session-message | 차단 | 타 세션 부작용 |
| rename/rewind/subagents/cron/feedback/questions/tasks/stop/theme/rules 등 | 제네릭(발견 기반) | 하드코딩 목록에는 없으며, `muse --help`에 해당 하위 명령이 있으면 자동완성에 `(CLI)` 표시와 함께 그대로 실행된다. `/goal`은 GUI 고유 기능으로 유지된다 |
| 기타 미지정 | 안내 | /help 참조 |

## 취소된 항목

없음. 효율 저하(모델 턴 없음)와 렌더 차이(터미널 텍스트 그대로)가
기준 미만이므로 제네릭 방식을 유지한다. `/plugins` bare 장문만 주의.
