const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "..", "static", "app.js"), "utf8");
const start = src.indexOf("let usageRange");
const end = src.indexOf("async function loadUsage");
if (start < 0 || end < 0) { console.error("FAIL anchors"); process.exit(1); }
const store = { ucards: "", usagebox: "" };
const sandbox = {
  document: { querySelectorAll: () => [] },
  console,
};
sandbox.$ = (s) => ({
  set innerHTML(v) { store[s.slice(1)] = v; },
  get innerHTML() { return store[s.slice(1)] || ""; },
});
require("vm").createContext(sandbox);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
sandbox.esc = esc;
require("vm").runInContext(src.slice(start, end) + `
globalThis.__U = { fmtNum, barsSVG, ucard, drawUsage,
  setData: (d) => { usageDaily = d; usageFull = { turns: 1 }; } };`, sandbox);
const U = sandbox.__U;
let pass = 0, fail = 0;
function t(name, cond, extra) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name, extra || ""); }
}
t("fmt k", U.fmtNum(1500) === "1.5k", U.fmtNum(1500));
t("fmt M", U.fmtNum(141100000) === "141.1M", U.fmtNum(141100000));
t("fmt small", U.fmtNum(42) === "42", U.fmtNum(42));
const svg = U.barsSVG([0, 10, 5]);
t("bars count", (svg.match(/<rect/g) || []).length === 3, svg.slice(0, 200));
t("bars svg tag", svg.startsWith("<svg") && svg.endsWith("</svg>"), "");
U.setData([
  { date: "2026-11-20", requests: 2, input: 1000, output: 50 },
  { date: "2026-11-26", requests: 8, input: 335832, output: 7148 },
]);
U.drawUsage();
t("cards rendered", store.ucards.includes("ucard") && store.ucards.includes("336.8k"), store.ucards.slice(0, 300));
t("three cards", (store.ucards.match(/class="ucard"/g) || []).length === 3, "");
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
