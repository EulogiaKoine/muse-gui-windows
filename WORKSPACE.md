# muse-gui 작업 디렉터리 정책

## 기준 (항목 4: 검증 완료, 수정 불필요)

작업 환경은 `muse-gui` 실행 디렉터리로 결정된다.
서버가 `os.getcwd()`를 모든 `muse exec` 호출에 그대로 전달하고,
`muse`가 이를 `workspace root: <cwd> (cwd default)`로 채택한다.
`/tmp/mg-probe`에서 기동한 8780 테스트 서버가
`"cwd": "/tmp/mg-probe"`를 보고한 것으로 확인済.

## 중도 변경 (항목 5: 검증 결과와 리스크)

가능은 하지만 기본적으로 거부된다. 실측:

```
session <id> was created in workspace /tmp;
refusing to resume in workspace /tmp/mg-b;
pass --workspace /tmp or --allow-workspace-switch to continue
```

조건: 같은 `--session-id`를 다른 cwd에서 이어가면 거부.
`--workspace <원래경로>` 또는 `--allow-workspace-switch`를
명시해야 계속된다.

리스크:

- 세션-작업공간 바인딩: 방지 장치를 우회하면 도구가 엉뚱한
  디렉터리를 대상으로 실행될 수 있다.
- 신뢰(trust) 등급: 디렉터리마다 trusted/untrusted가 다르다.
  미신뢰 공간에서는 에이전트 위임·MCP 로딩이 제한된다.
- 기존 대화(sid)와 새 cwd 조합이 꼬이면 같은 세션에
  서로 다른 작업공간의 기록이 섞인다.

권장: 작업 디렉터리를 바꾸면 새 대화(=새 sid)로 시작한다.
GUI에 디렉터리 전환 UI를 넣는다면 반드시 sid를 새로 끊는
방식으로만 구현한다. (미구현 — 필요하면 다음 단계에서 진행)
