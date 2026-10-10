# Graph Report - Cardapio_Aldo_Lanches  (2026-10-10)

## Corpus Check
- 3 files · ~94,025 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .cdr 1)

## Summary
- 146 nodes · 405 edges · 15 communities (14 shown, 1 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ed389126`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- js/index.js
- bindEvents
- openPackageItemModal
- initializeCustomerAuth
- backup_esquema_2026-04-04/index.js
- init
- bindEvents
- openItemModal
- renderBranch
- renderMenu
- init
- renderMenu
- getVisibleItems
- normalize
- scheduleVisibleReactLoop

## God Nodes (most connected - your core abstractions)
1. `bindEvents()` - 22 edges
2. `renderCart()` - 19 edges
3. `openPackageItemModal()` - 16 edges
4. `openItemModal()` - 15 edges
5. `init()` - 14 edges
6. `startAppCheckout()` - 13 edges
7. `renderMenu()` - 13 edges
8. `openItemModal()` - 12 edges
9. `submitAppOrder()` - 11 edges
10. `setStatus()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `bindEvents()` --indirect_call--> `closeAccountDialog()`  [INFERRED]
  Cardapio_Aldo_Lanches/assets/js/index.js → Cardapio_Aldo_Lanches/assets/js/index.js  _Bridges community 3 → community 1_
- `openCheckoutConfirmation()` --calls--> `savePendingCheckoutSnapshot()`  [EXTRACTED]
  Cardapio_Aldo_Lanches/assets/js/index.js → Cardapio_Aldo_Lanches/assets/js/index.js  _Bridges community 1 → community 2_
- `init()` --calls--> `restorePendingCheckoutSnapshot()`  [EXTRACTED]
  Cardapio_Aldo_Lanches/assets/js/index.js → Cardapio_Aldo_Lanches/assets/js/index.js  _Bridges community 1 → community 5_
- `init()` --calls--> `initializeCustomerAuth()`  [EXTRACTED]
  Cardapio_Aldo_Lanches/assets/js/index.js → Cardapio_Aldo_Lanches/assets/js/index.js  _Bridges community 3 → community 5_
- `initializeCustomerAuth()` --calls--> `loadCustomerOrders()`  [EXTRACTED]
  Cardapio_Aldo_Lanches/assets/js/index.js → Cardapio_Aldo_Lanches/assets/js/index.js  _Bridges community 3 → community 2_

## Import Cycles
- None detected.

## Communities (15 total, 1 thin omitted)

### Community 0 - "js/index.js"
Cohesion: 0.16
Nodes (11): buildSearchCompositionText(), db, getItemPackageGroups(), isValidImageUrl(), ORDER_STAGES, packageCustomerName(), packageMemberAvailable(), packageQuantityLimit() (+3 more)

### Community 1 - "bindEvents"
Cohesion: 0.18
Nodes (27): addToCart(), bindEvents(), buildOrderMessage(), checkoutWhatsApp(), closeCart(), closeCheckoutConfirmation(), copyOrderMessage(), getCartTotals() (+19 more)

### Community 2 - "openPackageItemModal"
Cohesion: 0.28
Nodes (16): buildEntrySignature(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPhotos(), loadCustomerOrders(), lockPageScroll() (+8 more)

### Community 3 - "initializeCustomerAuth"
Cohesion: 0.32
Nodes (8): closeAccountDialog(), closeCustomerOrders(), getUserDisplayName(), initializeCustomerAuth(), loadCustomerProfile(), renderAccountButton(), saveCustomerProfile(), unlockPageScroll()

### Community 4 - "backup_esquema_2026-04-04/index.js"
Cohesion: 0.22
Nodes (10): computeActiveItemIds(), db, getDayKey(), getVisibleItems(), isGroupActive(), rotateCardPhotos(), startPhotoRotation(), state (+2 more)

### Community 5 - "init"
Cohesion: 0.25
Nodes (9): bindRealtime(), bindViewportMetrics(), init(), renderHeader(), restoreCart(), scheduleRefreshFromRealtime(), setupHeaderLogoScale(), startAvailabilityPolling() (+1 more)

### Community 6 - "bindEvents"
Cohesion: 0.27
Nodes (10): addToCart(), bindEvents(), checkoutWhatsApp(), closeCart(), getCartTotals(), openCart(), openCartEdit(), removeCartItem() (+2 more)

### Community 7 - "openItemModal"
Cohesion: 0.31
Nodes (10): buildEntrySignature(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPhotos(), isValidImageUrl(), openItemModal() (+2 more)

### Community 8 - "renderBranch"
Cohesion: 0.29
Nodes (7): buildCategoryTree(), buildInlineCompositionText(), loadData(), loadOptionalPackageTable(), renderBranch(), sortByPriorityThenName(), sortPriorityValue()

### Community 9 - "renderMenu"
Cohesion: 0.40
Nodes (6): buildCategoryTree(), renderBranch(), renderCategoryNav(), renderMenu(), sortByPriorityThenName(), sortPriorityValue()

### Community 10 - "init"
Cohesion: 0.50
Nodes (5): init(), loadData(), renderHeader(), setStatus(), setupHeaderLogoScale()

### Community 11 - "renderMenu"
Cohesion: 0.22
Nodes (9): applySearch(), normalize(), renderCategoryNav(), renderMenu(), restorePhotoState(), rotateCardPhotos(), savePhotoState(), setupMenuReveal() (+1 more)

### Community 12 - "getVisibleItems"
Cohesion: 0.33
Nodes (6): computeActiveItemIds(), getCompositionStock(), getDayKey(), getVisibleItems(), isGroupActive(), toMinutes()

### Community 14 - "scheduleVisibleReactLoop"
Cohesion: 0.50
Nodes (4): getVisibleCards(), nextVisibleReactDelayMs(), scheduleVisibleReactLoop(), triggerCardVisibleReact()

## Knowledge Gaps
- **7 isolated node(s):** `ORDER_STAGES`, `db`, `state`, `ui`, `db` (+2 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 11 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bindEvents()` connect `bindEvents` to `js/index.js`, `openPackageItemModal`, `initializeCustomerAuth`, `init`, `renderMenu`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `renderCart()` connect `bindEvents` to `js/index.js`, `openPackageItemModal`, `init`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `openPackageItemModal()` connect `openPackageItemModal` to `js/index.js`, `bindEvents`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `bindEvents()` (e.g. with `closeAccountDialog()` and `closeCart()`) actually correct?**
  _`bindEvents()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ORDER_STAGES`, `db`, `state` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._