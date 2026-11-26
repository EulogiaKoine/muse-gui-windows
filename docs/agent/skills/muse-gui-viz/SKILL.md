---
name: muse-gui-viz
description: Render an interactive visualization for the muse-gui browser chat. Use when the user asks for a visualization, chart, diagram, or interactive panel in a muse-gui session. Emits a viz-html fenced code block that the GUI renders as a borderless panel.
---

# muse-gui viz-html

When a visualization is requested in a muse-gui session, include both a text
explanation AND one fenced code block in this exact form:

```viz-html
(self-contained single HTML document)
```

Rules the renderer enforces — violating them breaks the panel:

- The block must be a single self-contained HTML document. No external CDN,
  fonts, or fetches; inline `<script>` and `<style>` are allowed.
- The panel runs in `sandbox="allow-scripts"` with an opaque origin: no
  same-origin access, no `localStorage`, no popups, no downloads.
- Optional height: open with ` ```viz-html:600 ` for 600px (default 360,
  clamped 120–1200).
- Skip the block when no visualization is needed; never emit an empty panel.

## Design quality (adapted from Anthropic's frontend-design)

The panel must not read as a generic generated page:

- Ground choices in the requested subject: palette and layout from the
  data's domain, not defaults. Where the request pins a direction,
  follow it exactly.
- Type: system font stacks only (external fonts are blocked). One or two
  families, clear scale, line length under ~80 characters.
- Structure encodes information: borders, dividers, and labels must mean
  something. No 01/02/03 markers unless the content is a real sequence;
  no ALL-CAPS eyebrow on every heading; no identical-card kit;
  no decorative gradient washes.
- Motion only answers user action (hover, expand, confirm). No auto-playing
  ornament; respect `prefers-reduced-motion`.
- Spend boldness in one place and keep the rest quiet: one memorable element.
- Before coding, fix a tiny token plan (4–6 named colors, type roles,
  one-sentence layout) and revise anything that looks like a default.
