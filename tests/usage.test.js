const fs = require("fs")
const path = require("path")
const src = fs.readFileSync(
  path.join(__dirname, "..", "static", "js", "usage.js"),
  "utf8",
)
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
globalThis.__U = { fmtNum, fmtMoney, rateFor, dayCost, bucketize };`,
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
console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
