#!/usr/bin/env bash
# muse-gui 하네스: 구문 검사 + 렌더 테스트. 의존성 없음.
set -euo pipefail
cd "$(dirname "$0")/.."
for f in static/js/*.js; do node --check "$f" || exit 1; done && echo "JS OK"
python3 -m py_compile server.py && echo "py OK"
missing=0
for f in static/js/*.js static/css/*.css; do
  base="${f#static/}"
  grep -q "static/$base" index.html || { echo "INDEX MISSING: $f"; missing=1; }
done
for f in $(grep -o 'static/\(js\|css\)/[A-Za-z0-9_.-]*' index.html); do
  [ -f "$f" ] || { echo "FILE MISSING: $f"; missing=1; }
done
for kind in js css; do
  a=$(grep -o "static/$kind/[A-Za-z0-9_.-]*\.$kind" index.html | sed "s|static/$kind/||")
  if [ "$kind" = js ]; then b=$(grep -E '^\| [0-9]+ \| `' static/INDEX.md | sed -E 's/.*`([A-Za-z0-9_.-]*\.js)`.*/\1/');
  else b=$(grep -E '^\| `[A-Za-z0-9_.-]*\.css' static/INDEX.md | sed -E 's/.*`([A-Za-z0-9_.-]*\.css)`.*/\1/'); fi
  [ "$a" = "$b" ] || { echo "ORDER MISMATCH ($kind)"; missing=1; }
done
if [ -f docs/agent/API.md ]; then
  for n in $(grep -hoE '^ *(async )?function [A-Za-z0-9_]+' static/js/*.js | sed -E 's/.*function //'); do
    grep -qF "\`$n" docs/agent/API.md || grep -qF "\`async $n" docs/agent/API.md || { echo "API UNDOCUMENTED: $n"; missing=1; }
  done
else
  echo "API.md missing: skipping API coverage check (warn only)"
fi
[ "$missing" = 0 ] && echo "INDEX OK" || exit 1
node tests/render.test.js
node tests/usage.test.js
node tests/interaction.test.js
node tests/boot.test.js
python3 tests/html_ids.py
