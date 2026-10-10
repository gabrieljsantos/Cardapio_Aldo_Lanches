# Graph Report - Cardapio_Aldo_Lanches  (2026-10-10)

## Corpus Check
- 3 files · ~95,454 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .cdr 1)

## Summary
- 161 nodes · 485 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce5c92be`
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
- scheduleVisibleReactLoop
- getItemPackageGroups
- normalize
- getVisibleItems

## God Nodes (most connected - your core abstractions)
1. `renderCart()` - 26 edges
2. `bindEvents()` - 26 edges
3. `openPackageItemModal()` - 19 edges
4. `submitAppOrder()` - 16 edges
5. `openItemModal()` - 16 edges
6. `renderMenu()` - 14 edges
7. `init()` - 14 edges
8. `startAppCheckout()` - 13 edges
9. `openCheckoutConfirmation()` - 12 edges
10. `setStatus()` - 12 edges

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

## Communities (16 total, 1 thin omitted)

### Community 0 - "bindEvents"
Cohesion: 0.23
Nodes (21): bindEvents(), closeCart(), closeCheckoutConfirmation(), closeCustomerOrderDetail(), hasCompleteOrderProfile(), initializeCustomerAuth(), loadCustomerProfile(), openAccountDialog() (+13 more)

### Community 1 - "openPackageItemModal"
Cohesion: 0.18
Nodes (23): applySearch(), buildEntrySignature(), buildSearchCompositionText(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPhotos() (+15 more)

### Community 2 - "renderCart"
Cohesion: 0.22
Nodes (20): adjustSellableGroup(), buildEntryOptionsText(), buildOrderMessage(), buildSellableGroupOrderPayload(), checkoutWhatsApp(), getCartTotals(), getCurrentAvailabilityMap(), getSellableGroupTotals() (+12 more)

### Community 3 - "js/index.js"
Cohesion: 0.17
Nodes (10): addToCart(), bindViewportMetrics(), copyOrderMessage(), db, getUserDisplayName(), ORDER_STAGES, state, ui (+2 more)

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
Cohesion: 0.33
Nodes (7): bindRealtime(), init(), renderHeader(), restoreCart(), scheduleRefreshFromRealtime(), setupHeaderLogoScale(), startAvailabilityPolling()

### Community 8 - "renderMenu"
Cohesion: 0.29
Nodes (7): renderCategoryNav(), renderMenu(), restorePhotoState(), rotateCardPhotos(), savePhotoState(), setupMenuReveal(), startPhotoRotation()

### Community 9 - "loadData"
Cohesion: 0.33
Nodes (7): buildCategoryTree(), buildInlineCompositionText(), loadData(), loadOptionalPackageTable(), sortByPriorityThenName(), sortItemsByPriority(), sortPriorityValue()

### Community 10 - "renderMenu"
Cohesion: 0.40
Nodes (6): buildCategoryTree(), renderBranch(), renderCategoryNav(), renderMenu(), sortByPriorityThenName(), sortPriorityValue()

### Community 11 - "init"
Cohesion: 0.50
Nodes (5): init(), loadData(), renderHeader(), setStatus(), setupHeaderLogoScale()

### Community 12 - "scheduleVisibleReactLoop"
Cohesion: 0.50
Nodes (4): getVisibleCards(), nextVisibleReactDelayMs(), scheduleVisibleReactLoop(), triggerCardVisibleReact()

### Community 13 - "getItemPackageGroups"
Cohesion: 0.43
Nodes (7): buildOrderPackageState(), getItemPackageGroups(), getItemPriceBreakdown(), getLegacyCompositionCharge(), getPackageCompositionCharge(), getPackageDefaults(), syncCartWithCurrentCatalog()

### Community 15 - "getVisibleItems"
Cohesion: 0.33
Nodes (6): computeActiveItemIds(), getCompositionStock(), getDayKey(), getVisibleItems(), isGroupActive(), toMinutes()

## Knowledge Gaps
- **7 isolated node(s):** `ORDER_STAGES`, `db`, `state`, `ui`, `db` (+2 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 11 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bindEvents()` connect `bindEvents` to `openPackageItemModal`, `renderCart`, `js/index.js`, `init`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `renderCart()` connect `renderCart` to `bindEvents`, `openPackageItemModal`, `js/index.js`, `init`, `getItemPackageGroups`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `openPackageItemModal()` connect `openPackageItemModal` to `bindEvents`, `renderCart`, `js/index.js`, `getItemPackageGroups`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `bindEvents()` (e.g. with `closeCart()` and `closeCheckoutConfirmation()`) actually correct?**
  _`bindEvents()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ORDER_STAGES`, `db`, `state` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._