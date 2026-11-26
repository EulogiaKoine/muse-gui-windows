// muse-gui 부트 하네스: main.js가 예외 없이 평가되고 라우트 이어가기
// IIFE가 실행되는지 검증한다 (applyLang ASI 회귀 방지).
const fs = require("fs")
const vm = require("vm")
const path = require("path")
const dir = path.join(__dirname, "..", "static", "js")
function stubEl() {
  return {
    children: [],
    dataset: {},
    style: {},
    textContent: "",
    innerHTML: "",
    className: "",
    title: "",
    placeholder: "",
    hidden: false,
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() {
        return false
      },
    },
    setAttribute() {},
    getAttribute() {
      return null
    },
    addEventListener() {},
    appendChild() {},
    querySelector() {
      return stubEl()
    },
    focus() {},
  }
}
const opened = []
const sandbox = {
  console,
  document: {
    querySelector: () => stubEl(),
    querySelectorAll: () => [],
    createElement: () => stubEl(),
    addEventListener() {},
  },
  MutationObserver: function () {
    return {
      observe() {},
    }
  },
  chat: stubEl(),
  location: { pathname: "/c123" },
  convs: [{ k: "c123", t: "T", msgs: [] }],
  userFreshStart: false,
  convKey: null,
  sessionId: null,
  fetch: () => {
    throw new Error("fetch should not run in this scenario")
  },
}
sandbox.window = sandbox
sandbox.self = sandbox
for (const n of [
  "setMode",
  "applyTheme",
  "renderChips",
  "drawConvs",
  "refreshInfo",
  "refreshPrefs",
  "updateGate",
  "drawRside",
  "persistConvs",
  "saveTheme",
  "paintSendTitle",
  "paintYolo",
]) {
  sandbox[n] = () => {}
}
sandbox.loadTheme = () => ({})
sandbox.openConv = (k) => {
  opened.push(k)
}
sandbox.$ = () => stubEl()
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(dir, "util.js"), "utf8"), sandbox)
vm.runInContext(fs.readFileSync(path.join(dir, "i18n.js"), "utf8"), sandbox)
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
let threw = null
try {
  vm.runInContext(
    fs.readFileSync(path.join(dir, "main.js"), "utf8"),
    sandbox,
    { filename: "main.js" },
  )
} catch (e) {
  threw = e
}
t("boot-no-throw", threw === null, threw && threw.message)
t("boot-route-resume", opened.join(",") === "c123", opened.join(","))
console.log("")
console.log(pass + " passed, " + fail + " failed")
process.exit(fail ? 1 : 0)
