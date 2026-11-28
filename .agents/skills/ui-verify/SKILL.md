---
name: ui-verify
description: UI 편집 후 HTML/CSS/JS 구조·참조 검증을 강제하는 게이트. index.html이나 static/ 아래를 손댔을 때 사용.
---

# UI Verify

조용한 구조 붕괴(콘솔 에러 없이 요소가 사라지는 유형: 닫는 태그 `>` 누락 등)를
기계적으로 차단한다. 에이전트의 육안·추론으로 HTML/CSS 정합성을 보증하려 하지
말고, 아래 게이트를 통과시키는 것으로 대체한다.

## 언제 사용하나

- `index.html`, `static/css/*`, `static/js/*`를 하나라도 수정했을 때
- 사이드바·탭·창 표시가 "동작은 하는데 안 보인다"거나 콘솔이 조용할 때

## 사용법

수정 후 이 한 줄을 실행한다. 개별 스크립트를 따로 돌리지 않는다.

```bash
bash tests/run.sh
```

`run.sh`가 아래 검사를 순서대로 실행한다. 하나라도 실패하면 중단이므로,
실패 지점을 고치고 처음부터 다시 돌린다.

1. `node --check` 전 JS + `py_compile` (기존)
2. `.agents/skills/ui-verify/scripts/htmlcheck.py` — `index.html`의 모든
   `id`가 HTML 파싱 후에도 살아남는지 + 태그 균형. 삼켜진 요소·짝 안 맞는
   태그가 있으면 실패.
3. `.agents/skills/ui-verify/scripts/csscheck.py` — 모든 CSS의 `{}`/`()`/`[]`
   균형 + 미닫힘 주석 검사.
4. `.agents/skills/ui-verify/scripts/refcheck.py` — JS가 참조하는 `#id`가
   HTML에 실존하는지 + 리터럴 `t('key')`가 한/영 팩에 모두 있는지.
   동적 키(`t('a.'+x)`)는 prefix만 검사한다.

## 새 코드를 짤 때 규칙

- 예상되는 요소가 없을 때 조용히 `return`하지 않는다.
  `console.warn("[영역] #id missing from document")`을 남긴다.
- JS가 id로 찾는 요소는 `index.html`에 정적으로 둔다. JS가 동적으로 만드는
  id는 `refcheck.py`의 제공 목록에 걸리므로 리터럴로 할당한다.

## 브라우저 증상 진단 순서 (reload 반복 금지)

1. 문제 탭의 콘솔에서 live DOM을 직접 확인한다:
   `!!document.querySelector('#의심id')`
2. 같은 탭에서 `fetch(location.href)` 텍스트와 비교한다.
   fetch에 있고 DOM에 없으면 런타임 변형, 둘 다 없으면 낡은 문서다.
3. 서빙 바이트는 `curl`로 세션 URL 그대로 확인한다 (`/`가 아님).
4. 위가 모두 정상인데도 안 보이면 그때 파서(`htmlcheck.py`)를 의심한다.
