#!/usr/bin/env python3
"""static/css/*.css 구조 검사: 괄호 균형 + 미닫힘 주석. 실패 시 exit 1."""
import glob
import sys

fails = []
for path in sorted(glob.glob("static/css/*.css")):
    src = open(path, encoding="utf-8").read()
    line = 1
    stack = []
    pairs = {")": "(", "]": "[", "}": "{"}
    i, n = 0, len(src)
    while i < n:
        c = src[i]
        if c == "\n":
            line += 1
            i += 1
        elif c == "/" and i + 1 < n and src[i + 1] == "*":
            end = src.find("*/", i + 2)
            if end < 0:
                fails.append(f"{path}:{line}: unterminated comment")
                break
            line += src.count("\n", i, end)
            i = end + 2
        elif c in "\"'":
            q = c
            i += 1
            while i < n and src[i] != q:
                if src[i] == "\\":
                    i += 1
                if src[i] == "\n":
                    line += 1
                i += 1
            i += 1
        elif c in "([{":
            stack.append((c, line))
            i += 1
        elif c in ")]}":
            if not stack or stack[-1][0] != pairs[c]:
                fails.append(f"{path}:{line}: stray '{c}'")
                i += 1
            else:
                stack.pop()
                i += 1
        else:
            i += 1
    for (o, ln) in stack:
        fails.append(f"{path}:{ln}: unclosed '{o}'")

if fails:
    print("CSS MISMATCH:")
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("CSS OK (braces/parens/brackets balanced, comments closed)")
