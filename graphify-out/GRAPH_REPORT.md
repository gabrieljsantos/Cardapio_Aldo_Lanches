# Graph Report - Cardapio_Aldo_Lanches  (2026-10-10)

## Corpus Check
- 3 files · ~96,009 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .cdr 1)

## Summary
- 165 nodes · 503 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97a02b1b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- openPackageItemModal
- bindEvents
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
1. `bindEvents()` - 29 edges
2. `renderCart()` - 27 edges
3. `openPackageItemModal()` - 19 edges
4. `submitAppOrder()` - 16 edges
5. `openItemModal()` - 16 edges
6. `renderMenu()` - 14 edges
7. `init()` - 14 edges
8. `startAppCheckout()` - 13 edges
9. `getSellableGroupTotals()` - 12 edges
10. `openCheckoutConfirmation()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `bindEvents()` --indirect_call--> `removeUnavailableCartItems()`  [INFERRED]
  assets/js/index.js → assets/js/index.js  _Bridges community 2 → community 1_
- `bindEvents()` --indirect_call--> `copyOrderMessage()`  [INFERRED]
  assets/js/index.js → assets/js/index.js  _Bridges community 3 → community 1_
- `init()` --calls--> `restorePendingCheckoutSnapshot()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 1 → community 7_
- `repeatCustomerOrder()` --calls--> `switchCustomerPage()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 1 → community 0_
- `getSellableGroupTotals()` --calls--> `getItemPackageGroups()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 2 → community 0_

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 0 - "openPackageItemModal"
Cohesion: 0.18
Nodes (20): buildEntrySignature(), buildOrderPackageState(), closeModal(), getItemPackageGroups(), getItemPhotos(), getItemPriceBreakdown(), getLegacyCompositionCharge(), getPackageCompositionCharge() (+12 more)

### Community 1 - "bindEvents"
Cohesion: 0.19
Nodes (26): bindEvents(), closeCart(), closeCheckoutConfirmation(), closeCustomerOrderDetail(), confirmCustomerOrderReceived(), hasCompleteOrderProfile(), initializeCustomerAuth(), loadCustomerOrders() (+18 more)

### Community 2 - "renderCart"
Cohesion: 0.20
Nodes (25): adjustSellableGroup(), buildEntryOptionsText(), buildOrderMessage(), buildSearchCompositionText(), buildSellableGroupOrderPayload(), checkoutWhatsApp(), createItemCard(), currency() (+17 more)

### Community 3 - "js/index.js"
Cohesion: 0.13
Nodes (15): addToCart(), copyOrderMessage(), customerPhoneFromForm(), db, getUserDisplayName(), getVisibleCards(), nextVisibleReactDelayMs(), ORDER_STAGES (+7 more)

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

- **Why does `bindEvents()` connect `bindEvents` to `openPackageItemModal`, `renderCart`, `js/index.js`, `init`, `renderMenu`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `renderCart()` connect `renderCart` to `openPackageItemModal`, `bindEvents`, `js/index.js`, `init`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `openPackageItemModal()` connect `openPackageItemModal` to `bindEvents`, `renderCart`, `js/index.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `bindEvents()` (e.g. with `closeCart()` and `closeCheckoutConfirmation()`) actually correct?**
  _`bindEvents()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ORDER_STAGES`, `db`, `state` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `js/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13071895424836602 - nodes in this community are weakly interconnected._