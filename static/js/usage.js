"use strict"
// Usage/accounting pure helpers (no DOM).
function fmtNum(n) {
  n = n || 0
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M"
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k"
  return String(n)
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
