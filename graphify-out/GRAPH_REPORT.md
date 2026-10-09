# Graph Report - Cardapio_Aldo_Lanches  (2026-10-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 116 nodes · 282 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0b294c46`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

## God Nodes (most connected - your core abstractions)
1. `renderCart()` - 14 edges
2. `openItemModal()` - 13 edges
3. `renderMenu()` - 13 edges
4. `bindEvents()` - 12 edges
5. `init()` - 12 edges
6. `openItemModal()` - 12 edges
7. `createItemCard()` - 10 edges
8. `bindEvents()` - 10 edges
9. `renderCart()` - 9 edges
10. `init()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `bindEvents()` --calls--> `applySearch()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 11_
- `bindEvents()` --calls--> `closeModal()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 3_
- `bindEvents()` --calls--> `openCart()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 4_
- `getVisibleItems()` --calls--> `computeActiveItemIds()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 1_
- `renderMenu()` --calls--> `getVisibleItems()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 7_

## Import Cycles
- None detected.

## Communities (13 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.21
Nodes (17): addToCart(), bindEvents(), buildOrderMessage(), checkoutWhatsApp(), closeCart(), copyOrderMessage(), currency(), getCartTotals() (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (13): bindViewportMetrics(), computeActiveItemIds(), db, getDayKey(), getVisibleCards(), isGroupActive(), nextVisibleReactDelayMs(), scheduleVisibleReactLoop() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.22
Nodes (10): computeActiveItemIds(), db, getDayKey(), getVisibleItems(), isGroupActive(), rotateCardPhotos(), startPhotoRotation(), state (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (12): buildEntrySignature(), buildSearchCompositionText(), closeModal(), createItemCard(), escapeHtml(), getItemPhotos(), isValidImageUrl(), lockPageScroll() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.27
Nodes (11): bindRealtime(), init(), loadData(), openCart(), refreshDataNow(), renderHeader(), restoreCart(), scheduleRefreshFromRealtime() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (10): addToCart(), bindEvents(), checkoutWhatsApp(), closeCart(), getCartTotals(), openCart(), openCartEdit(), removeCartItem() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (10): buildEntrySignature(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPhotos(), isValidImageUrl(), openItemModal() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (7): renderCategoryNav(), renderMenu(), restorePhotoState(), rotateCardPhotos(), savePhotoState(), setupMenuReveal(), startPhotoRotation()

### Community 8 - "Community 8"
Cohesion: 0.40
Nodes (6): buildCategoryTree(), renderBranch(), renderCategoryNav(), renderMenu(), sortByPriorityThenName(), sortPriorityValue()

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (5): buildCategoryTree(), buildInlineCompositionText(), renderBranch(), sortByPriorityThenName(), sortPriorityValue()

### Community 10 - "Community 10"
Cohesion: 0.50
Nodes (5): init(), loadData(), renderHeader(), setStatus(), setupHeaderLogoScale()

## Knowledge Gaps
- **6 isolated node(s):** `db`, `state`, `ui`, `db`, `state` (+1 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 10 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderCart()` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `renderMenu()` connect `Community 7` to `Community 0`, `Community 1`, `Community 4`, `Community 9`, `Community 11`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `openItemModal()` connect `Community 3` to `Community 0`, `Community 1`, `Community 4`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `bindEvents()` (e.g. with `closeCart()` and `copyOrderMessage()`) actually correct?**
  _`bindEvents()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `db`, `state`, `ui` to the rest of the system?**
  _6 weakly-connected nodes found - possible documentation gaps or missing edges._