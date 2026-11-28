#!/usr/bin/env python3
"""JS→HTML id 참조 + i18n 키 정합성 검사. 실패 시 exit 1.

- JS가 찾는 #id는 index.html 파싱 트리에 실존해야 한다.
  (JS가 리터럴로 직접 만드는 id는 제공으로 인정)
- 리터럴 t('key')는 한/영 팩에 모두 있어야 한다.
  동적 키(t('a.'+x))는 prefix 매칭만 검사한다.
"""
import glob
import json
import re
import subprocess
import sys
from html.parser import HTMLParser

fails = []


class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tree_ids = []

    def _ids(self, attrs):
        d = dict(attrs)
        if "id" in d:
            self.tree_ids.append(d["id"])

    def handle_starttag(self, tag, attrs):
        self._ids(attrs)

    def handle_startendtag(self, tag, attrs):
        self._ids(attrs)


html_ids = set()
col = Collector()
col.feed(open("index.html", encoding="utf-8").read())
html_ids.update(col.tree_ids)

js_src = {}
for path in sorted(glob.glob("static/js/*.js")):
    js_src[path] = open(path, encoding="utf-8").read()
all_js = "\n".join(js_src.values())

required = set()
for pat in (r"""\$\(\s*['"]#([\w-]+)['"]\s*\)""",
            r"""getElementById\(\s*['"]#?([\w-]+)['"]\s*\)""",
            r"""querySelector(All)?\(\s*['"]#([\w-]+)['"]"""):
    for m in re.finditer(pat, all_js):
        required.add(m.group(m.lastindex))

provided = set(re.findall(r"""id\s*=\s*['"]([\w-]+)['"]""", all_js))
provided.update(re.findall(r"""\.id\s*=\s*['"]([\w-]+)['"]""", all_js))
provided.update(
    re.findall(r"""setAttribute\(\s*['"]id['"]\s*,\s*['"]([\w-]+)['"]""",
               all_js))

missing_ids = sorted(required - html_ids - provided)
if missing_ids:
    fails.append(f"JS REFERENCES MISSING HTML IDS: {missing_ids}")

# ---- i18n keys ----
i18n = open("static/js/i18n.js", encoding="utf-8").read()
s = i18n.index("const STR =")
i = i18n.index("{", s)
depth = 0
end = None
for j in range(i, len(i18n)):
    if i18n[j] == "{":
        depth += 1
    elif i18n[j] == "}":
        depth -= 1
        if depth == 0:
            end = j + 1
            break
keys = None
if end:
    try:
        out = subprocess.run(
            ["node", "-e",
             "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{"
             "const STR=eval('('+s+')');"
             "console.log(JSON.stringify([Object.keys(STR.ko||{}),"
             "Object.keys(STR.en||{})]));});"],
            input=i18n[i:end], capture_output=True, text=True, timeout=30)
        ko_keys, en_keys = json.loads(out.stdout)
        keys = (set(ko_keys), set(en_keys))
    except Exception as e:  # noqa: BLE001 - loud failure, never silent
        fails.append(f"i18n STR extraction failed: {e}")

literal = set()
if keys:
    ko_keys, en_keys = keys
    for m in re.finditer(r"""\bt\(\s*(['"])([A-Za-z0-9_.]+)\1\s*[,)]""",
                         all_js):
        literal.add(m.group(2))
    rtab = re.search(r"RTAB_KEYS\s*=\s*\{([^}]*)\}", all_js)
    if rtab:
        literal.update(re.findall(r'"([A-Za-z0-9_.]+)"', rtab.group(1)))
    for k in sorted(literal):
        miss = [l for (l, ks) in (("ko", ko_keys), ("en", en_keys))
                if k not in ks]
        if miss:
            fails.append(f"i18n key missing in {miss}: '{k}'")
    for m in re.finditer(r"""\bt\(\s*(['"])([A-Za-z0-9_.]+)\1\s*\+""",
                         all_js):
        pre = m.group(2)
        if not any(k.startswith(pre) for k in ko_keys | en_keys):
            fails.append(f"i18n dynamic prefix matches nothing: '{pre}'")

if fails:
    print("REFCHECK FAIL:")
    for f in fails:
        print("  " + f)
    sys.exit(1)
print(f"REFCHECK OK ({len(required)} js id refs, "
      f"{len(literal)} literal i18n keys)")
