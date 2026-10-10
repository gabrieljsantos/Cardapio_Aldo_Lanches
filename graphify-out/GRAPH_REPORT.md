# Graph Report - Cardapio_Aldo_Lanches  (2026-10-10)

## Corpus Check
- 3 files · ~96,037 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, (none) 1, .cdr 1)

## Summary
- 166 nodes · 508 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1435f8b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- renderCart
- bindEvents
- getSellableGroupTotals
- js/index.js
- backup_esquema_2026-04-04/index.js
- bindEvents
- openItemModal
- scheduleVisibleReactLoop
- renderMenu
- loadData
- renderMenu
- init
- getVisibleItems
- normalize
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
- `saveCustomerProfile()` --calls--> `getUserDisplayName()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 3 → community 1_
- `openCheckoutConfirmation()` --calls--> `savePendingCheckoutSnapshot()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 1 → community 0_
- `openCheckoutConfirmation()` --calls--> `getCartTotals()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 2 → community 0_
- `renderMenu()` --calls--> `getSellableGroupTotals()`  [EXTRACTED]
  assets/js/index.js → assets/js/index.js  _Bridges community 2 → community 8_

## Import Cycles
- None detected.

## Communities (15 total, 2 thin omitted)

### Community 0 - "renderCart"
Cohesion: 0.21
Nodes (27): buildEntryOptionsText(), buildEntrySignature(), buildInlineCompositionText(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPackageGroups() (+19 more)

### Community 1 - "bindEvents"
Cohesion: 0.14
Nodes (34): bindEvents(), bindRealtime(), closeCart(), closeCheckoutConfirmation(), closeCustomerOrderDetail(), confirmCustomerOrderReceived(), hasCompleteOrderProfile(), init() (+26 more)

### Community 2 - "getSellableGroupTotals"
Cohesion: 0.27
Nodes (13): adjustSellableGroup(), buildOrderMessage(), buildSellableGroupOrderPayload(), checkoutWhatsApp(), copyOrderMessage(), getCartTotals(), getCurrentAvailabilityMap(), getSellableGroupTotals() (+5 more)

### Community 3 - "js/index.js"
Cohesion: 0.11
Nodes (18): addToCart(), bindViewportMetrics(), buildOrderPackageState(), buildSearchCompositionText(), customerPhoneFromForm(), customerPhoneFromValue(), db, formatCustomerPhone() (+10 more)

### Community 4 - "backup_esquema_2026-04-04/index.js"
Cohesion: 0.22
Nodes (10): computeActiveItemIds(), db, getDayKey(), getVisibleItems(), isGroupActive(), rotateCardPhotos(), startPhotoRotation(), state (+2 more)

### Community 5 - "bindEvents"
Cohesion: 0.27
Nodes (10): addToCart(), bindEvents(), checkoutWhatsApp(), closeCart(), getCartTotals(), openCart(), openCartEdit(), removeCartItem() (+2 more)

### Community 6 - "openItemModal"
Cohesion: 0.31
Nodes (10): buildEntrySignature(), closeModal(), createItemCard(), currency(), escapeHtml(), getItemPhotos(), isValidImageUrl(), openItemModal() (+2 more)

### Community 7 - "scheduleVisibleReactLoop"
Cohesion: 0.50
Nodes (4): getVisibleCards(), nextVisibleReactDelayMs(), scheduleVisibleReactLoop(), triggerCardVisibleReact()

### Community 8 - "renderMenu"
Cohesion: 0.29
Nodes (7): renderCategoryNav(), renderMenu(), restorePhotoState(), rotateCardPhotos(), savePhotoState(), setupMenuReveal(), startPhotoRotation()

### Community 9 - "loadData"
Cohesion: 0.40
Nodes (6): buildCategoryTree(), loadData(), loadOptionalPackageTable(), sortByPriorityThenName(), sortItemsByPriority(), sortPriorityValue()

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
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `bindEvents()` connect `bindEvents` to `renderCart`, `getSellableGroupTotals`, `js/index.js`, `normalize`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `renderCart()` connect `renderCart` to `bindEvents`, `getSellableGroupTotals`, `js/index.js`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Why does `openPackageItemModal()` connect `renderCart` to `bindEvents`, `js/index.js`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `bindEvents()` (e.g. with `closeCart()` and `closeCheckoutConfirmation()`) actually correct?**
  _`bindEvents()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ORDER_STAGES`, `db`, `state` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bindEvents` be split into smaller, more focused modules?**
  _Cohesion score 0.14260249554367202 - nodes in this community are weakly interconnected._
- **Should `js/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10952380952380952 - nodes in this community are weakly interconnected._