#!/usr/bin/env python3
"""index.html 구조 회귀 검사: 정의된 id가 HTML 파싱 후에도 살아남는지 확인한다.

태그 오타(예: 닫는 태그의 `>` 누락)는 브라우저 파서가 해당 요소를 통째로
삼키며, 콘솔 에러도 남기지 않는다. id 정의(all raw) vs 파싱 트리(all parsed)를
비교해 삼켜진 id가 있으면 실패한다. 중복 id는 경고만 한다.
"""
import re
import sys
from collections import Counter
from html.parser import HTMLParser

SRC = "index.html"
VOID = ("meta", "link", "br", "hr", "img", "input", "source", "wbr")


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


raw = open(SRC, encoding="utf-8").read()
defined = re.findall(r'id="([^"]+)"', raw)
col = Collector()
col.feed(raw)
missing = [i for i in defined if i not in col.tree_ids]
dupes = sorted(i for i, c in Counter(defined).items() if c > 1)
if dupes:
    print("HTML DUPLICATE ID (warn only):", dupes)
if missing:
    print("HTML ID SWALLOWED:", missing)
    sys.exit(1)
print(f"HTML IDS OK ({len(defined)} defined, all survive parsing)")
