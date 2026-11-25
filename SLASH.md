# muse-gui 슬래시 처리표

원칙: 슬래시는 서버에 하드코딩하지 않고 `muse-code`에 직접 실행시킨다.
`muse --help`에서 하위 명령을 매번 파싱하므로 업데이트에도 코드 변경이 없다.

## 경로 4종

1. GUI 고유: `/new /clear /copy /help /quit /exit`
   로컬 처리. 서버를 거치지 않는다.
2. 세션 기준: `/usage /status /export /model /effort`
   TUI와 같은 의미. `/usage`는 세션 토큰 집계(원장), 구독 플랜은 `/plan`.
3. 제네릭: 그 외 `muse` 하위 명령 전체.
   `muse <cmd> <args>`를 stdin 차단+120s 타임아웃+ANSI 제거로 실행.
4. 차단: 아래 표의 deny 항목. 인증 변경·데몬 바인딩·작업공간 기록·타세션
   부작용 범주라 의미 기준으로 고정된다.

## 항목별 정리 (2026-11-25 실측, 전부 0.0~0.3s·모델 토큰 0)

| 입력 | 경로 | 비고 |
|---|---|---|
| /usage /status /export /model /effort | 세션 기준 | TUI와 동일 의미. 원장은 usage.json에 영속화 |
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
| 제거됨: rename/rewind/subagents/goal/cron/feedback/questions/tasks/stop/theme/rules | — | 순수 TUI 전용이라 목록·안내에서 삭제 (입력 시 미지정 안내) |
| 기타 미지정 | 안내 | /help 참조 |

## 취소된 항목

없음. 효율 저하(모델 턴 없음)와 렌더 차이(터미널 텍스트 그대로)가
기준 미만이므로 제네릭 방식을 유지한다. `/plugins` bare 장문만 주의.
