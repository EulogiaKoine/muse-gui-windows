// muse-gui 렌더러 하네스 (의존성 없음, node만 필요).
// 실행: node tests/render.test.js  (또는 tests/run.sh)
// 규칙: 테스트는 static/app.js에서 "function esc(" 부터 "function timeStr("
// 구간만 잘라 평가한다. 순수 함수(esc/escAttr/renderMath/hl/vizHtml/
// renderText)는 이 구간 안에 둘 것. DOM 코드는 구간 밖에 둘 것.
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "static", "app.js"), "utf8");
const start = src.indexOf("function esc(");
const end = src.indexOf("function timeStr(");
if (start < 0 || end < 0 || end < start) {
  console.error("FAIL slice anchors missing (esc..timeStr convention broken)");
  process.exit(1);
}
const sandbox = {};
require("vm").createContext(sandbox);
require("vm").runInContext(
  src.slice(start, end) + "\nglobalThis.__R = { renderText, renderMath, hl, vizHtml, esc, tblToMD, tblToCSV, routeId };",
  sandbox);
const R = sandbox.__R;
let pass = 0, fail = 0;
function t(name, cond, extra) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, extra || ""); }
}
let h = R.renderText("```python\ndef f():\n    return 'hi' # c\n```");
t("code fence lang label", h.includes('data-lang="python"'), h.slice(0, 200));
t("py keyword hl", h.includes('tok-k">def<'), h.slice(0, 400));
t("py string hl", h.includes('tok-s'), h.slice(0, 400));
t("py comment hl", h.includes('tok-c'), h.slice(0, 400));
h = R.renderText("$$\\frac{a}{b} + \\alpha^2$$");
t("display math frac", h.includes('class="frac"') && h.includes("math-block"), h.slice(0, 300));
h = R.renderText("값은 $x^2 + \\sqrt{y}$ 이다");
t("inline math", h.includes('class="math"') && h.includes("<sup>2</sup>"), h.slice(0, 300));
h = R.renderText("\\(a \\leq b\\)");
t("paren math", h.includes('class="math"'), h.slice(0, 200));
h = R.renderText("```viz-html:500\n<b>hi</b>\n```");
t("viz iframe", h.includes("<iframe") && h.includes('height="500"')
  && h.includes('sandbox="allow-scripts"'), h.slice(0, 300));
t("viz no same-origin", !h.includes("allow-same-origin"), "");
h = R.renderText("```viz-html\n<script>alert(1)</script>\n```");
t("viz srcdoc escaped", h.includes("srcdoc=") && !h.includes("<script>alert"), h.slice(0, 300));
h = R.renderText("> [!note] 핵심\n> 계속");
t("callout", h.includes('class="callout c-note"'), h.slice(0, 300));
h = R.renderText("이건 ==형광== 표시");
t("mark", h.includes("<mark>"), h.slice(0, 200));
h = R.renderText("- [ ] 할일\n- [x] 완료");
t("tasks", h.includes('type="checkbox"') && h.includes("checked"), h.slice(0, 300));
h = R.renderText("[x](javascript:alert(1))");
t("js link neutralized", !h.includes('href="javascript'), h.slice(0, 200));
h = R.renderText("`$x$` 그대로");
t("code shields math", h.includes("<code>$x$</code>"), h.slice(0, 200));
h = R.renderText("```js\nconst a = 1; // n\n```");
t("js fence", h.includes('data-lang="js"') && h.includes("tok-k"), h.slice(0, 300));
h = R.renderText("값은 $x^2$ 이다");
t("math keeps raw tex", h.includes('data-tex="x^2"'), h.slice(0, 300));
h = R.renderText("$$\\frac{a}{b}$$");
t("display math raw", h.includes("data-tex=") && h.includes("math-block"), h.slice(0, 300));
h = R.renderText("| a | b |\n|---|---|\n| 1 | 2 |");
t("table wrap", h.includes('class="tblwrap"><table>') && h.includes("<th>a</th>") && h.includes("<td>2</td>"), h.slice(0, 300));
t("tbl md", R.tblToMD([["a", "b"], ["1", "2"]]) === "| a | b |\n| --- | --- |\n| 1 | 2 |", JSON.stringify(R.tblToMD([["a", "b"], ["1", "2"]])));
t("tbl md ragged", R.tblToMD([["a"], ["1", "2", "3"]]).split("\n").length === 3, "");
t("tbl csv quote", R.tblToCSV([["x,y", 'z"q'], ["a", "b"]]) === '"x,y","z""q"\na,b', JSON.stringify(R.tblToCSV([["x,y", 'z"q']])));
t("route sid", R.routeId("/01a213b6-d13d-7b82-95de-6973543146ac") === "01a213b6-d13d-7b82-95de-6973543146ac", "");
t("route conv", R.routeId("/c1795627200000/") === "c1795627200000", "");
t("route root", R.routeId("/") === null, "");
t("route static", R.routeId("/static/app.js") === null, "");
t("route api", R.routeId("/api/info") === null, "");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
