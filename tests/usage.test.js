const fs = require("fs")
const path = require("path")
const src = fs.readFileSync(
  path.join(__dirname, "..", "static", "js", "usage.js"),
  "utf8",
)
const store = { ucards: "", usagebox: "" }
const sandbox = {
  document: { querySelectorAll: () => [] },
  console,
}
sandbox.$ = (s) => ({
  set innerHTML(v) {
    store[s.slice(1)] = v
  },
  get innerHTML() {
    return store[s.slice(1)] || ""
  },
})
require("vm").createContext(sandbox)
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
sandbox.esc = esc
sandbox.escAttr = esc
sandbox.t = (k) => k
require("vm").runInContext(
  src +
    `
globalThis.__U = { fmtNum, barsSVG, ucard, drawUsage, fmtMoney, rateFor, dayCost, bucketize, tsGraph,
  setData: (d) => { usageDaily = d; usageFull = { turns: 1 }; },
  setModel: (m) => { usageModel = m; } };`,
  sandbox,
)
const U = sandbox.__U
let pass = 0,
  fail = 0
function t(name, cond, extra) {
  if (cond) {
    pass++
    console.log("PASS", name)
  } else {
    fail++
    console.log("FAIL", name, extra || "")
  }
}
t("fmt k", U.fmtNum(1500) === "1.5k", U.fmtNum(1500))
t("fmt M", U.fmtNum(141100000) === "141.1M", U.fmtNum(141100000))
t("fmt small", U.fmtNum(42) === "42", U.fmtNum(42))
const svg = U.barsSVG([0, 10, 5])
t("bars count", (svg.match(/<rect/g) || []).length === 3, svg.slice(0, 200))
t("bars svg tag", svg.startsWith("<svg") && svg.endsWith("</svg>"), "")
U.setData([
  { date: "2026-11-20", requests: 2, input: 1000, output: 50 },
  { date: "2026-11-26", requests: 8, input: 335832, output: 7148 },
])
U.drawUsage()
t(
  "cards rendered",
  store.ucards.includes("ucard") && store.ucards.includes("336.8k"),
  store.ucards.slice(0, 300),
)
t("three cards", (store.ucards.match(/class="ucard"/g) || []).length === 3, "")
t(
  "fmtMoney",
  U.fmtMoney(0.00123) === "$0.0012" &&
    U.fmtMoney(2.5) === "$2.50" &&
    U.fmtMoney(1500) === "$1.50k",
  U.fmtMoney(0.00123),
)
t(
  "rateFor default",
  (() => {
    const r = U.rateFor("unknown-model", null)
    return r[0] === 1.25 && r[1] === 4.25
  })(),
  "",
)
t(
  "dayCost",
  (() => {
    const p = { models: { m: { input: 1.25, output: 4.25 } } }
    const d = { models: { m: { input: 1e6, output: 2e6, reasoning: 1e6 } } }
    return (
      Math.abs(U.dayCost(d, p, "m") - 14) < 1e-9 &&
      Math.abs(U.dayCost(d, p, null) - 14) < 1e-9 &&
      U.dayCost({ models: {} }, p, "m") === 0 &&
      Math.abs(
        U.dayCost({ input: 1e6, output: 0, reasoning: 0 }, null, null) - 1.25,
      ) < 1e-9
    )
  })(),
  "",
)
t(
  "bucketize fixed slots",
  (() => {
    const loc = (dt) =>
      dt.getFullYear() +
      "-" +
      String(dt.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(dt.getDate()).padStart(2, "0")
    const days = []
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i--)
      days.push({
        date: loc(new Date(now.getTime() - i * 86400000)),
        input: 100,
        output: 0,
        requests: 1,
      })
    const b = U.bucketize(days, 7, 1, null, null)
    return b.length === 7 && b.reduce((a, x) => a + x.input, 0) === 700
  })(),
  "",
)
t(
  "tsGraph axes",
  (() => {
    const g = U.tsGraph(
      [
        { label: "01-01", input: 1, output: 2 },
        { label: "01-02", input: 3, output: 0 },
      ],
      [
        { get: (b) => b.input, color: "#000" },
        { get: (b) => b.output, color: "#111" },
      ],
      U.fmtNum,
    )
    return (
      g.indexOf("<svg") === 0 &&
      (g.match(/<rect/g) || []).length === 3 &&
      g.indexOf("01-01") >= 0
    )
  })(),
  "",
)
t(
  "model filter",
  (() => {
    U.setData([
      {
        date: "2026-11-20",
        requests: 2,
        input: 100,
        output: 50,
        models: {
          a: { input: 100, output: 50, requests: 2 },
          b: { input: 900, output: 0, requests: 0 },
        },
      },
      {
        date: "2026-11-21",
        requests: 1,
        input: 10,
        output: 5,
        models: { a: { input: 10, output: 5, requests: 1 } },
      },
    ])
    U.setModel("b")
    U.drawUsage()
    const html = store.ucards
    U.setModel("")
    U.drawUsage()
    return html.indexOf("900") >= 0
  })(),
  "",
)
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
