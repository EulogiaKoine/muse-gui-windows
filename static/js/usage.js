"use strict"
// == muse-gui/js/usage.js ==
// Usage/accounting state, graphs, tables.
let usageRange = 7,
  usageDaily = [],
  usageFull = null,
  usageModel = "",
  usagePrices = null
document.querySelectorAll("#urange button").forEach((b) => {
  b.onclick = () => {
    usageRange = +b.dataset.r || 7
    document
      .querySelectorAll("#urange button")
      .forEach((x) => x.classList.toggle("sel", x === b))
    drawUsage()
  }
})
function fmtNum(n) {
  n = n || 0
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
}
function barsSVG(vals) {
  const W = 260,
    H = 64,
    max = Math.max.apply(null, vals.concat([1]))
  let s =
    '<svg viewBox="0 0 ' +
    W +
    " " +
    H +
    '" preserveAspectRatio="none" style="width:100%;height:64px;display:block" aria-hidden="true">'
  const bw = W / Math.max(vals.length, 1)
  for (let i = 0; i < vals.length; i++) {
    const h = Math.max(2, Math.round((vals[i] / max) * (H - 14)))
    s +=
      '<rect x="' +
      (i * bw + 1).toFixed(1) +
      '" y="' +
      (H - h) +
      '" width="' +
      Math.max(1, bw - 2).toFixed(1) +
      '" height="' +
      h +
      '" rx="2" fill="var(--me)" opacity="' +
      (0.35 + (0.65 * vals[i]) / max).toFixed(2) +
      '"/>'
  }
  return s + "</svg>"
}
function ucard(title, value, vals) {
  return (
    '<div class="ucard"><div class="uval">' +
    esc(value) +
    '</div><div class="ulab">' +
    esc(title) +
    "</div>" +
    barsSVG(vals) +
    "</div>"
  )
}
function fmtMoney(v) {
  v = +v || 0
  if (v >= 1000) return "$" + (v / 1000).toFixed(2) + "k"
  if (v >= 1) return "$" + v.toFixed(2)
  return "$" + v.toFixed(4)
}
function rateFor(model, prices) {
  const m = ((prices && prices.models) || {})[model] || {}
  let pin = parseFloat(m.input),
    pout = parseFloat(m.output)
  if (!(pin >= 0)) pin = 1.25
  if (!(pout >= 0)) pout = 4.25
  return [pin, pout]
}
function dayCost(day, prices, model) {
  if (!day) return 0
  const ms = day.models || null
  const cost = (e, n) => {
    const r = rateFor(n, prices)
    return (
      ((e.input || 0) * r[0] + ((e.output || 0) + (e.reasoning || 0)) * r[1]) /
      1e6
    )
  }
  if (model) {
    const e = ms ? ms[model] : null
    return e ? cost(e, model) : 0
  }
  if (ms) {
    let t = 0
    Object.keys(ms).forEach((n) => {
      t += cost(ms[n] || {}, n)
    })
    return t
  }
  const r = rateFor("", prices)
  return (
    ((day.input || 0) * r[0] +
      ((day.output || 0) + (day.reasoning || 0)) * r[1]) /
    1e6
  )
}
function bucketize(daily, range, per, model, prices) {
  const byDate = {}
  ;(daily || []).forEach((d) => {
    if (d && d.date) byDate[d.date] = d
  })
  const days = []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  for (let i = range - 1; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 86400000)
    days.push(
      dt.getFullYear() +
        "-" +
        String(dt.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(dt.getDate()).padStart(2, "0"),
    )
  }
  const out = []
  for (let s = 0; s < days.length; s += per) {
    const chunk = days.slice(s, s + per)
    const b = {
      label: chunk[0].slice(5),
      input: 0,
      output: 0,
      reasoning: 0,
      requests: 0,
      cost: 0,
    }
    chunk.forEach((k) => {
      const d = byDate[k]
      if (!d) return
      if (model) {
        const e = (d.models || {})[model] || null
        if (!e) return
        const r = rateFor(model, prices)
        b.input += e.input || 0
        b.output += e.output || 0
        b.reasoning += e.reasoning || 0
        b.requests += e.requests || 0
        b.cost +=
          ((e.input || 0) * r[0] +
            ((e.output || 0) + (e.reasoning || 0)) * r[1]) /
          1e6
      } else {
        b.input += d.input || 0
        b.output += d.output || 0
        b.reasoning += d.reasoning || 0
        b.requests += d.requests || 0
        b.cost += dayCost(d, prices, null)
      }
    })
    out.push(b)
  }
  return out
}
function tsGraph(buckets, series, yfmt) {
  const W = 640,
    H = 168,
    L = 52,
    B = 20,
    T = 10
  const pw = W - L - 8,
    ph = H - T - B
  const totals = buckets.map((b) => {
    let t = 0
    series.forEach((s) => {
      t += s.get(b) || 0
    })
    return t
  })
  const max = Math.max.apply(null, totals.concat([1]))
  const X = (i) => L + (i + 0.5) * (pw / Math.max(buckets.length, 1))
  const Y = (v) => T + ph - (v / max) * ph
  let s =
    '<svg viewBox="0 0 ' +
    W +
    " " +
    H +
    '" style="width:100%;height:auto;display:block" role="img">'
  ;[0, max / 2, max].forEach((tv) => {
    const y = Y(tv).toFixed(1)
    s +=
      '<line x1="' +
      L +
      '" y1="' +
      y +
      '" x2="' +
      (W - 8) +
      '" y2="' +
      y +
      '" stroke="var(--bd)" stroke-width="1"/>'
    s +=
      '<text x="' +
      (L - 5) +
      '" y="' +
      (+y + 4).toFixed(1) +
      '" text-anchor="end" font-size="10" fill="var(--muted)">' +
      esc(String(yfmt(tv))) +
      "</text>"
  })
  const bw = pw / Math.max(buckets.length, 1)
  buckets.forEach((b, i) => {
    let acc = 0
    series.forEach((sr) => {
      const v = sr.get(b, i) || 0
      if (v > 0) {
        const h = Math.max(1.5, (v / max) * ph)
        s +=
          '<rect x="' +
          (X(i) - Math.max(2, bw * 0.32)).toFixed(1) +
          '" y="' +
          Y(acc + v).toFixed(1) +
          '" width="' +
          Math.max(2, bw * 0.64).toFixed(1) +
          '" height="' +
          h.toFixed(1) +
          '" rx="2" fill="' +
          sr.color +
          '"/>'
      }
      acc += v
    })
  })
  const xi = [0, Math.floor((buckets.length - 1) / 2), buckets.length - 1]
  xi.forEach((ii, k) => {
    if (ii < 0 || !buckets[ii] || (k && xi[k - 1] === ii)) return
    s +=
      '<text x="' +
      X(ii).toFixed(1) +
      '" y="' +
      (H - 6) +
      '" text-anchor="middle" font-size="10" fill="var(--muted)">' +
      esc(buckets[ii].label) +
      "</text>"
  })
  if (!buckets.some((b) => b.input + b.output > 0)) {
    s +=
      '<text x="' +
      (L + pw / 2) +
      '" y="' +
      (T + ph / 2) +
      '" text-anchor="middle" font-size="12" fill="var(--muted)">' + esc(t("usage.noData")) + '</text>'
  }
  return s + "</svg>"
}
async function refreshPrices() {
  if (
    !confirm(
      t("usage.refreshConfirm"),
    )
  )
    return
  const b = $("#costrefresh")
  const old = b ? b.textContent : ""
  if (b) {
    b.disabled = true
    b.textContent = t("usage.refreshing")
  }
  try {
    const r = await fetch("/api/prices/refresh", { method: "POST" })
    const j = await r.json()
    alert(j.ok ? errText(j, t) : t("usage.refreshFail") + (errText(j, t) || t("usage.unknown")))
    if (j.ok) await loadUsage()
  } catch (e) {
    alert(t("usage.refreshFail") + String((e && e.message) || e))
  } finally {
    const bb = $("#costrefresh")
    if (bb) {
      bb.disabled = false
      bb.textContent = old || t("usage.refresh")
    }
  }
}
function drawUsage() {
  const j = usageFull
  if (!j) return
  const names = Object.keys(j.models || {})
  const sel = $("#umodel")
  if (sel) {
    sel.innerHTML =
      '<option value="">' + esc(t("usage.combined")) + "</option>" +
      names
        .map(
          (n) =>
            '<option value="' +
            escAttr(n) +
            '"' +
            (n === usageModel ? " selected" : "") +
            ">" +
            esc(n) +
            "</option>",
        )
        .join("")
    sel.onchange = () => {
      usageModel = sel.value
      drawUsage()
    }
  }
  const m = usageModel || null
  const data = (usageDaily || []).slice(-usageRange)
  const dv = (d, k) => {
    if (!m) return d[k] || 0
    return (((d || {}).models || {})[m] || {})[k] || 0
  }
  const tot = { requests: 0, input: 0, output: 0 }
  data.forEach((d) => {
    tot.requests += dv(d, "requests")
    tot.input += dv(d, "input")
    tot.output += dv(d, "output")
  })
  let html =
    '<div class="ucards">' +
    ucard(
      t("usage.requests"),
      fmtNum(tot.requests),
      data.map((d) => dv(d, "requests")),
    ) +
    ucard(
      t("usage.inTokens"),
      fmtNum(tot.input),
      data.map((d) => dv(d, "input")),
    ) +
    ucard(
      t("usage.outTokens"),
      fmtNum(tot.output),
      data.map((d) => dv(d, "output")),
    ) +
    "</div>"
  if (!data.length)
    html +=
      '<p class="hint">' + esc(t("usage.noDaily")) + "</p>"
  const per = usageRange <= 7 ? 1 : usageRange <= 30 ? 2 : 3
  const buckets = bucketize(usageDaily, usageRange, per, m, usagePrices)
  const legend =
    '<span class="lg"><i style="background:var(--me)"></i>' + esc(t("usage.inLabel")) + "</span>" +
    '<span class="lg"><i style="background:var(--ok)"></i>' + esc(t("usage.outLabel")) + "</span>"
  html +=
    '<h4 class="ugtitle">' + esc(t("usage.tokensTitle")) +
    (m ? " · " + esc(m) : "") +
    ' <span class="uglegend">' +
    legend +
    "</span></h4>"
  html += tsGraph(
    buckets,
    [
      { get: (b) => b.input, color: "var(--me)" },
      { get: (b) => b.output, color: "var(--ok)" },
    ],
    fmtNum,
  )
  const hasPrices = !!(usagePrices && usagePrices.models)
  if (hasPrices) {
    const totCost = buckets.reduce((a, b) => a + b.cost, 0)
    html +=
      '<h4 class="ugtitle">' + esc(t("usage.costTitle")) + ' <span class="ucost">' +
      fmtMoney(totCost) +
      "</span></h4>"
    html += tsGraph(
      buckets,
      [{ get: (b) => b.cost, color: "var(--me)" }],
      fmtMoney,
    )
    html +=
      '<p class="hint">' + esc(t("usage.costHint")) +
      esc(usagePrices.updated || "?") +
      ' <button type="button" class="linkbtn" id="costrefresh">' + esc(t("usage.refresh")) + "</button></p>"
    const cb = $("#costrefresh")
    if (cb) cb.onclick = refreshPrices
  } else {
    html += '<p class="hint">' + esc(t("usage.noPrices")) + "</p>"
  }
  $("#ucards").innerHTML = html
}
