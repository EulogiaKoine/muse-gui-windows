"use strict"
// == muse-gui/js/util.js ==
// Pure helpers: escaping, formatting, thought/open-data classification, diff, sort, gate.
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
function escAttr(s) {
  return esc(String(s)).replace(/"/g, "&quot;")
}
function tblCellMD(c) {
  return String(c == null ? "" : c)
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim()
}
function tblToMD(rows) {
  const rs = (rows || []).map((r) => (r || []).map(tblCellMD))
  if (!rs.length) return ""
  const w = Math.max.apply(null, rs.map((r) => r.length).concat([1]))
  const norm = rs.map((r) => {
    const c = r.slice()
    while (c.length < w) c.push("")
    return c
  })
  return norm
    .map(
      (r, i) =>
        "| " +
        r.join(" | ") +
        " |" +
        (i === 0 ? "\n|" + r.map(() => " --- ").join("|") + "|" : ""),
    )
    .join("\n")
}
function tblToCSV(rows) {
  const q = (c) => {
    const s = String(c == null ? "" : c)
      .replace(/\s+/g, " ")
      .trim()
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  return (rows || []).map((r) => (r || []).map(q).join(",")).join("\n")
}
function routeId(path) {
  const m = String(path || "").match(/^\/([A-Za-z0-9][A-Za-z0-9-]*)\/?$/)
  return m ? m[1] : null
}
function goalFence(text, name) {
  const m = String(text).match(
    new RegExp(
      "```goal[\\W_]*" + name + "[^\\n`{\\[]*\\n?([\\s\\S]*?)```",
      "i",
    ),
  )
  if (!m) return { clean: String(text), data: null }
  let data = null
  try {
    data = JSON.parse(m[1])
  } catch (e) {
    data = null
  }
  return { clean: String(text).replace(m[0], "").trim(), data }
}
function normGoalItems(data) {
  const arr = Array.isArray(data)
    ? data
    : (data && (data.items || data.subgoals)) || []
  return arr.map((x, i) =>
    typeof x === "string"
      ? { t: x, done: false }
      : {
          t: String(x.t || x.title || x.name || "단계 " + (i + 1)),
          done: !!x.done,
        },
  )
}
function convToMd(c, mode) {
  const compact = mode === "prompt"
  const lines = ["# " + (c.t || "대화"), ""]
  if (c.sid) lines.push("- 세션: " + String(c.sid).slice(0, 8), "")
  if (c.cwd) lines.push("- 작업 디렉터리: " + c.cwd, "")
  let msgs = c.msgs || []
  if (compact && msgs.length > 60) {
    lines.push("[앞부분 " + (msgs.length - 60) + "개 메시지 생략]", "")
    msgs = msgs.slice(-60)
  }
  msgs.forEach((m) => {
    let t = String(m.text || "")
    t = goalFence(t, "plan").clean
    t = goalFence(t, "status").clean
    if (compact) {
      let n = 0
      t = t.replace(/```viz-html[^\n]*\n[\s\S]*?```/g, (blk) => {
        n++
        return "[시각화 " + n + " 내용 생략 (원문 약 " + blk.length + "자)]"
      })
    }
    t = t
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
    if (!t) return
    lines.push(m.who === "me" ? "## User" : "## Assistant", "")
    // timeStr is outside the test slice; guarded call (always present in browser)
    if (m.ts && typeof timeStr === "function") {
      const when = timeStr(m.ts)
      if (when) lines.push("_" + when + "_", "")
    }
    lines.push(t, "")
  })
  let out = lines.join("\n").trim() + "\n"
  if (compact && out.length > 12000) {
    const cut = out.length - 12000
    out = "[앞부분 약 " + cut + "자 생략]\n" + out.slice(cut)
  }
  return out
}
function truncStr(s, n) {
  s = String(s == null ? "" : s)
  return s.length > n ? s.slice(0, n) + "…" : s
}
function thoughtKind(taskKind, operation) {
  const k = String(taskKind || operation || "").toLowerCase()
  if (!k) return "system"
  if (k.indexOf("model.") === 0) return "reason"
  if (k.indexOf("reminder") !== -1) return "system"
  if (k.indexOf("tool:") === 0 || k.indexOf("tool.") === 0) {
    const n = k.replace(/^tool[:.]/, "")
    if (/bash|shell|exec|terminal|command|process|run/.test(n))
      return "terminal"
    if (/search|web|fetch|query|browser|http/.test(n)) return "web"
    if (/read|write|edit|file|apply|patch/.test(n)) return "file"
    return "tool"
  }
  return "system"
}
function diffLineClass(ln) {
  if (/^@@/.test(ln)) return "td-hunk"
  if (
    /^\+\+\+/.test(ln) ||
    /^---/.test(ln) ||
    /^diff --git/.test(ln) ||
    /^index /.test(ln) ||
    /^Binary /.test(ln)
  )
    return "td-meta"
  if (/^\+/.test(ln)) return "td-add"
  if (/^-/.test(ln)) return "td-del"
  return ""
}
function isDiffText(s) {
  s = String(s == null ? "" : s)
  return /^diff --git/m.test(s) || /^@@/m.test(s)
}
function diffLinesHtml(s) {
  return String(s == null ? "" : s)
    .slice(0, 3000)
    .split("\n")
    .map((ln) => {
      const c = diffLineClass(ln)
      return '<span class="' + (c || "td-ctx") + '">' + esc(ln) + "</span>"
    })
    .join("")
}
function thoughtSummary(en, counts) {
  const c = counts || {}
  const n = (v) => Number(v) || 0
  const parts = []
  if (n(c.terminal))
    parts.push(
      en
        ? n(c.terminal) +
            (n(c.terminal) === 1 ? " command run" : " commands run")
        : "명령 " + n(c.terminal) + "개 실행",
    )
  if (n(c.file))
    parts.push(
      en
        ? n(c.file) + (n(c.file) === 1 ? " file" : " files")
        : "파일 " + n(c.file) + "개 작업",
    )
  if (n(c.reason))
    parts.push(
      en
        ? n(c.reason) +
            (n(c.reason) === 1 ? " reasoning step" : " reasoning steps")
        : n(c.reason) + "단계 추론",
    )
  if (n(c.other))
    parts.push(en ? n(c.other) + " others" : "기타 " + n(c.other) + "개")
  return parts.join(", ") || (en ? "done" : "완료")
}
function isOutputTruncated(o) {
  if (!o || typeof o !== "object") return false
  if (o.truncated === true) return true
  if (
    typeof o.original_output_bytes === "number" &&
    typeof o.output === "string"
  ) {
    return o.original_output_bytes > o.output.length * 2 + 2048
  }
  return false
}
function slimConvsForSave(list) {
  return (list || []).slice(0, 50).map((c) => {
    const msgs = Array.isArray(c.msgs)
      ? c.msgs.slice(-200).map((m) => {
          if (!m || !m.th) return m
          return {
            who: m.who,
            text: m.text,
            ts: m.ts,
            el: m.el,
            th: m.th.map((t) => {
              const d = Array.isArray(t.d)
                ? t.d.slice(0, 8).map((s) => ({
                    h: String(s.h || "").slice(0, 80),
                    b: String(s.b || "").slice(0, 300),
                  }))
                : null
              return d ? { k: t.k, s: t.s, d: d } : { k: t.k, s: t.s }
            }),
          }
        })
      : []
    return {
      k: c.k,
      t: c.t,
      sid: c.sid || null,
      cwd: c.cwd || null,
      pin: !!c.pin,
      tManual: !!c.tManual,
      goal: c.goal || null,
      at: c.at || 0,
      createdAt: c.createdAt || null,
      scroll: typeof c.scroll === "number" ? c.scroll : null,
      msgs: msgs,
    }
  })
}
function chatpadWidth(i) {
  const ws = ["640px", "920px", "none"]
  return ws[Number(i)] || "none"
}
const ERR_KEYS = {
  skills_list: "err.fetch",
  skills_inspect: "err.inspect",
  skills_bad_id: "err.badId",
  skills_bad_scope: "err.badScope",
  skills_exec: "err.exec",
  skills_exit: "err.exit",
  skills_preview_loc: "err.previewLoc",
  skills_bad_path: "err.badPath",
  skills_too_big: "err.tooBig",
  skills_read: "err.read",
  skills_name: "err.nameRule",
  skills_desc: "err.needDesc",
  skills_desc_long: "err.descLong",
  skills_body: "err.needBody",
  skills_body_long: "err.bodyLong",
  skills_validate: "err.validate",
  skills_install: "err.install",
  skills_create_exec: "err.exec",
  fs_need_path: "err.needPath",
  fs_no_dir: "err.noDir",
  fs_read: "err.read",
  prices_save: "err.saveFail",
  session_bad_id: "err.sessionBadId",
  session_running: "err.sessionRunning",
  session_not_found: "err.sessionNotFound",
  session_outside: "err.sessionOutside",
  session_rm_fail: "err.read",
  folder_bad_path: "err.badPathFmt",
  folder_win_convert: "err.convertFail",
  folder_exec: "err.exec",
  folder_open: "file.openFail",
  folder_no_tool: "err.noOpenerA",
  pick_no_powershell: "err.noPowershell",
  pick_exec: "err.exec",
  pick_timeout: "err.pickTimeoutA",
  pick_convert: "err.convertFail",
  pick_fail: "err.pickFail",
  pick_empty: "err.pickEmpty",
  pick_cancelled: "",
  tool_bad_id: "err.badCallId",
  tool_not_found: "err.notFound",
  tool_read: "err.read",
}
function errText(j, tr) {
  const t = tr || function (k) {
    return k
  }
  const code = j && j.code
  const det = j && j.detail !== undefined && j.detail !== null
    ? String(j.detail)
    : ""
  if (code === "pick_cancelled") return ""
  if (code === "prices_parse") return t("err.parseFail") + det + t("err.parseKeep")
  if (code === "prices_updated") {
    const parts = det.split("|")
    return (parts[0] || "") + t("err.updatedPre") + (parts[1] || "") + ")"
  }
  const key = (code && ERR_KEYS[code]) || ""
  if (!key) return (j && (j.error || j.text)) || ""
  if (code === "skills_exit") return t(key) + det + ")"
  if (code === "skills_validate" || code === "skills_install")
    return t(key) + (det ? " " + det : "")
  if (code === "pick_timeout") return t(key) + det + t("err.pickTimeoutB")
  if (code === "pick_fail") {
    const i = det.indexOf("\n")
    const rc = i < 0 ? det : det.slice(0, i)
    const rest = i < 0 ? "" : det.slice(i + 1)
    return t(key) + " (exit " + rc + (rest ? ": " + rest : "") + ")."
  }
  if (code === "folder_no_tool") return t(key) + det + t("err.noOpenerB")
  return t(key) + det
}
function gateFor(c, live) {
  if (!c) return "pick-new"
  if (c.sid) return live ? "" : "resume"
  if (!c.cwd) return "pick"
  return ""
}
function sortConvs(list, mode) {
  const a = (list || []).slice()
  const pinW = (c) => (c && c.pin ? 0 : 1)
  if (mode === "name") {
    a.sort(
      (x, y) =>
        pinW(x) - pinW(y) ||
        (x.t < y.t ? -1 : x.t > y.t ? 1 : 0) ||
        (x.k < y.k ? -1 : 1),
    )
  } else if (mode === "created") {
    a.sort(
      (x, y) =>
        pinW(x) - pinW(y) ||
        ((x.createdAt || x.k) < (y.createdAt || y.k) ? -1 : 1),
    )
  } else {
    a.sort((x, y) => pinW(x) - pinW(y) || (y.at || 0) - (x.at || 0))
  }
  return a
}
function diffOnly(s) {
  const full = String(s == null ? "" : s)
  const lines = full.split("\n")
  const i = lines.findIndex((ln) => /^(diff --git|--- |@@ )/.test(ln))
  return (i < 0 ? full : lines.slice(i).join("\n")).slice(0, 10000)
}
function shouldNotifyCompletion(permission, hidden) {
  return permission === "granted" && !!hidden
}
function timeStr(ts, now) {
  if (!ts) return ""
  const d = new Date(ts)
  const n = new Date(now === undefined ? Date.now() : now)
  const hm =
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  if (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  )
    return hm
  if (d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth())
    return d.getDate() + " " + hm
  if (d.getFullYear() === n.getFullYear())
    return d.getMonth() + 1 + "/" + d.getDate() + " " + hm
  return (
    d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + hm
  )
}
