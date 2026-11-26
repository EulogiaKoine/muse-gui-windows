#!/usr/bin/env bash
# muse-gui 하네스: 구문 검사 + 렌더 테스트. 의존성 없음.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in static/js/*.js; do node --check "$f" || exit 1; done && echo "JS OK"
python3 -m py_compile server.py && echo "py OK"
node tests/render.test.js
node tests/usage.test.js
