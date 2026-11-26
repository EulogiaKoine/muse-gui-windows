---
name: muse-gui-web-search
description: Mandatory web-search protocol for muse-gui sessions. Use when the user explicitly demands a web search before answering.
---

# muse-gui web search

When the user explicitly requests a web search (e.g. via the GUI's "웹 검색"
chip), follow this protocol without exception:

1. Perform at least one real web search with the available web tools before
   composing the answer. Never answer from prior knowledge alone.
2. State the search queries used and the key sources that support the answer.
3. If search tools are unavailable or return nothing, say so explicitly
   instead of silently falling back to prior knowledge.
