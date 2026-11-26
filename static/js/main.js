"use strict"
// == muse-gui/js/main.js ==
// Boot wiring that must run last: observer + startup sequence.
new MutationObserver(setMode).observe(chat, { childList: true })
applyTheme()
try {
  langCur = loadTheme().lang === "en" ? "en" : "ko"
} catch (e) {
  langCur = "ko"
}
renderChips()
drawConvs()
refreshInfo()
refreshPrefs()
setMode()
updateGate()
drawRside()
applyLang(
  langCur,
  false,
)(function () {
  const rid = routeId(location.pathname)
  if (!rid) return
  const c = convs.find((x) => x.k === rid || x.sid === rid)
  if (c) {
    openConv(c.k)
    return
  }
  if (!/^[0-9a-fA-F-]{36}$/.test(rid)) return
  fetch("/api/session_workspace?session_id=" + encodeURIComponent(rid))
    .then((r) => r.json())
    .then((j) => {
      if (!j.ok || !j.cwd) return
      if (userFreshStart || convKey !== null || chat.children.length > 0) return
      if (convs.some((x) => x.sid === rid)) return
      convKey = "c" + Date.now()
      sessionId = rid
      convs.unshift({
        k: convKey,
        t: t("conv.adopted"),
        sid: rid,
        cwd: j.cwd,
        msgs: [],
        at: Date.now(),
        createdAt: Date.now(),
      })
      persistConvs()
      openConv(convKey)
    })
    .catch(() => {})
})()
