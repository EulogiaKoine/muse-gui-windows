#!/usr/bin/env python3
"""index.html 구조 검사: id 파싱 생존 + 태그 균형.

닫는 태그의 `>` 누락 같은 오타는 브라우저 파서가 해당 요소를 통째로
삼키며 콘솔 에러도 남기지 않는다. 정의된 id가 파싱 트리에 살아남는지와
비어 있지 않은 요소의 열고/닫힘이 짝이 맞는지를 검사한다.
실패 항목이 있으면 exit 1.
"""
import re
import sys
from collections import Counter
from html.parser import HTMLParser

SRC = "index.html"
VOID = {"meta", "link", "br", "hr", "img", "input", "source", "wbr",
        "circle", "line", "path", "polyline", "polygon", "rect", "use"}
OPTIONAL_CLOSE = {"p", "li", "dt", "dd", "tr", "td", "th", "option"}


class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tree_ids = []
        self.stack = []
        self.errors = []

    def _ids(self, attrs):
        d = dict(attrs)
        if "id" in d:
            self.tree_ids.append(d["id"])

    def handle_starttag(self, tag, attrs):
        self._ids(attrs)
        if tag in VOID:
            return
        self.stack.append((tag, self.getpos()))

    def handle_startendtag(self, tag, attrs):
        self._ids(attrs)

    def handle_endtag(self, tag):
        if tag in VOID or tag in OPTIONAL_CLOSE:
            self.stack = [(t, p) for (t, p) in self.stack if t != tag]
            return
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()
            return
        if any(t == tag for (t, _) in self.stack):
            while self.stack and self.stack[-1][0] != tag:
                bad, pos = self.stack.pop()
                self.errors.append(f"unclosed <{bad}> opened at line {pos[0]}")
            self.stack.pop()
        else:
            self.errors.append(f"stray </{tag}> at line {self.getpos()[0]}")


raw = open(SRC, encoding="utf-8").read()
defined = re.findall(r'id="([^"]+)"', raw)
col = Collector()
col.feed(raw)
for (t, pos) in col.stack:
    if t not in OPTIONAL_CLOSE:
        col.errors.append(f"unclosed <{t}> opened at line {pos[0]}")

fail = False
missing = [i for i in defined if i not in col.tree_ids]
if missing:
    print("HTML ID SWALLOWED:", missing)
    fail = True
if col.errors:
    print("HTML TAG MISMATCH:")
    for e in col.errors:
        print("  " + e)
    fail = True
dupes = sorted(i for (i, c) in Counter(defined).items() if c > 1)
if dupes:
    print("HTML DUPLICATE ID (warn only):", dupes)
if fail:
    sys.exit(1)
print(f"HTML OK ({len(defined)} ids survive parsing, tags balanced)")
