# Graph Report - Cardapio_Aldo_Lanches  (2026-10-10)

## Corpus Check
- 3 files · ~95,242 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .cdr 1)

## Summary
- 157 nodes · 461 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `35e9af30`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- bindEvents
- openPackageItemModal
- renderCart
- js/index.js
- backup_esquema_2026-04-04/index.js
- bindEvents
- openItemModal
- init
- renderMenu
- loadData
- renderMenu
- init
- getVisibleItems
- normalize

## God Nodes (most connected - your core abstractions)
1. `renderCart()` - 24 edges
2. `bindEvents()` - 23 edges
3. `openPackageItemModal()` - 19 edges
4. `openItemModal()` - 16 edges
5. `submitAppOrder()` - 15 edges
6. `renderMenu()` - 14 edges
7. `init()` - 14 edges
8. `startAppCheckout()` - 13 edges
9. `setStatus()` - 12 edges
10. `renderBranch()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `bindEvents()` --indirect_call--> `removeUnavailableCartItems()`  [INFERRED]
  assets/js/index.js → assets/js/index.js  _Bridges community 2 → community 0_
- `bindEvents()` --indirect_call--> `copyOrderMessage()`  [INFERRED]
  assets/js/index.js → assets/js/index.js  _Bridges community 3 → community 0_
- `init()` --calls--> `restorePendingCheckoutSnapshot()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 2 → community 7_
- `init()` --calls--> `initializeCustomerAuth()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 7_
- `initializeCustomerAuth()` --calls--> `loadCustomerOrders()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 0 → community 1_

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 0 - "bindEvents"
Cohesion: 0.18
Nodes (22): bindEvents(), closeAccountDialog(), closeCart(), closeCheckoutConfirmation(), closeCustomerOrders(), getUserDisplayName(), hasCompleteOrderProfile(), initializeCustomerAuth() (+14 more)

### Community 1 - "openPackageItemModal"
Cohesion: 0.19
Nodes (24): buildEntrySignature(), buildOrderPackageState(), buildSearchCompositionText(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPackageGroups() (+16 more)

### Community 2 - "renderCart"
Cohesion: 0.25
Nodes (18): addToCart(), adjustSellableGroup(), buildOrderMessage(), buildSellableGroupOrderPayload(), checkoutWhatsApp(), getCartTotals(), getCurrentAvailabilityMap(), getSellableGroupTotals() (+10 more)

### Community 3 - "js/index.js"
Cohesion: 0.14
Nodes (14): copyOrderMessage(), db, getVisibleCards(), isValidImageUrl(), nextVisibleReactDelayMs(), ORDER_STAGES, packageMemberAvailable(), packageQuantityLimit() (+6 more)

### Community 4 - "backup_esquema_2026-04-04/index.js"
Cohesion: 0.22
Nodes (10): computeActiveItemIds(), db, getDayKey(), getVisibleItems(), isGroupActive(), rotateCardPhotos(), startPhotoRotation(), state (+2 more)

### Community 5 - "bindEvents"
Cohesion: 0.27
Nodes (10): addToCart(), bindEvents(), checkoutWhatsApp(), closeCart(), getCartTotals(), openCart(), openCartEdit(), removeCartItem() (+2 more)

### Community 6 - "openItemModal"
Cohesion: 0.31
Nodes (10): buildEntrySignature(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPhotos(), isValidImageUrl(), openItemModal() (+2 more)

### Community 7 - "init"
Cohesion: 0.25
Nodes (9): bindRealtime(), bindViewportMetrics(), init(), renderHeader(), restoreCart(), scheduleRefreshFromRealtime(), setupHeaderLogoScale(), startAvailabilityPolling() (+1 more)

### Community 8 - "renderMenu"
Cohesion: 0.25
Nodes (8): applySearch(), renderCategoryNav(), renderMenu(), restorePhotoState(), rotateCardPhotos(), savePhotoState(), setupMenuReveal(), startPhotoRotation()

### Community 9 - "loadData"
Cohesion: 0.33
Nodes (7): buildCategoryTree(), buildInlineCompositionText(), loadData(), loadOptionalPackageTable(), sortByPriorityThenName(), sortItemsByPriority(), sortPriorityValue()

### Community 10 - "renderMenu"
Cohesion: 0.40
Nodes (6): buildCategoryTree(), renderBranch(), renderCategoryNav(), renderMenu(), sortByPriorityThenName(), sortPriorityValue()

### Community 11 - "init"
Cohesion: 0.50
Nodes (5): init(), loadData(), renderHeader(), setStatus(), setupHeaderLogoScale()

### Community 12 - "getVisibleItems"
Cohesion: 0.33
Nodes (6): computeActiveItemIds(), getCompositionStock(), getDayKey(), getVisibleItems(), isGroupActive(), toMinutes()

## Knowledge Gaps
- **7 isolated node(s):** `ORDER_STAGES`, `db`, `state`, `ui`, `db` (+2 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 11 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `renderCart()` connect `renderCart` to `bindEvents`, `openPackageItemModal`, `js/index.js`, `init`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `bindEvents()` connect `bindEvents` to `openPackageItemModal`, `renderCart`, `js/index.js`, `init`, `renderMenu`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Why does `openPackageItemModal()` connect `openPackageItemModal` to `bindEvents`, `renderCart`, `js/index.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `bindEvents()` (e.g. with `closeAccountDialog()` and `closeCart()`) actually correct?**
  _`bindEvents()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ORDER_STAGES`, `db`, `state` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `js/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13970588235294118 - nodes in this community are weakly interconnected._