const { createClient } = supabase;

const SUPABASE_URL = "https://bbrpnbetwwnwpwogjjrv.supabase.co";
const SUPABASE_KEY = "sb_publishable_t5jkscaZPjrdbs_2uSFK4g_PjZeK3yi";
const CART_STORAGE_KEY = "smart-store-hub-cart-v1";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const FIXED_BRAND_LOGO = "assets/Aldo%20Lanches%20logo.jpg";

const state = {
  categories: [],
  items: [],
  compositions: [],
  associations: [],
  groups: [],
  groupAssociations: [],
  setup: null,
  compMap: {},
  searchTerm: "",
  cart: [],
  modalQty: 1,
  photoRotationTimer: null,
  revealObserver: null,
  lockedScrollY: 0,
  visibleReactTimer: null,
  realtimeChannel: null,
  refreshTimer: null,
  refreshInFlight: false,
  pollingTimer: null
};

const ui = {
  status: document.getElementById("status"),
  brandLogo: document.getElementById("brandLogo"),
  brandName: document.getElementById("brandName"),
  brandSchedule: document.getElementById("brandSchedule"),
  brandPhoneLink: document.getElementById("brandPhoneLink"),
  brandPhone: document.getElementById("brandPhone"),
  brandPixLink: document.getElementById("brandPixLink"),
  brandPix: document.getElementById("brandPix"),
  storeInfo: document.getElementById("storeInfo"),
  storeInfoText: document.getElementById("storeInfoText"),
  catNav: document.getElementById("catNav"),
  menu: document.getElementById("menu"),
  searchInput: document.getElementById("searchInput"),
  modal: document.getElementById("itemModal"),
  modalBody: document.getElementById("modalBody"),
  cartBackdrop: document.getElementById("cartBackdrop"),
  cartList: document.getElementById("cartList"),
  cartNote: document.getElementById("cartNote"),
  cartTotal: document.getElementById("cartTotal"),
  cartFab: document.getElementById("cartFab"),
  cartFabCount: document.getElementById("cartFabCount"),
  cartFabTotal: document.getElementById("cartFabTotal"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  removeUnavailableBtn: document.getElementById("removeUnavailableBtn"),
  checkoutBtn: document.getElementById("checkoutBtn")
};

function getCartTotals() {
  const count = state.cart.reduce((acc, entry) => acc + entry.qty, 0);
  const total = state.cart.reduce((acc, entry) => acc + entry.qty * Number(entry.price || 0), 0);
  return { count, total };
}

function getCurrentAvailabilityMap() {
  if (!state.items.length) {
    return null;
  }

  const visibleItems = getVisibleItems(state.items, state.groups, state.groupAssociations);
  const map = new Map();
  visibleItems.forEach((item) => {
    map.set(item.id, Number(item.__effectiveStock ?? item.stock ?? 0));
  });
  return map;
}

function isCartEntryUnavailable(entry, availabilityMap) {
  if (!availabilityMap) {
    return false;
  }
  const stock = availabilityMap.get(entry.id);
  return !Number.isFinite(stock) || stock <= 0;
}

function persistCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
  } catch (_) {
    // Ignora falhas de armazenamento local (ex.: modo privado).
  }
}

function restoreCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    state.cart = parsed
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        id: entry.id,
        signature: String(entry.signature || ""),
        name: String(entry.name || "Item"),
        price: Number(entry.price || 0),
        optionsText: String(entry.optionsText || ""),
        note: String(entry.note || ""),
        modState: entry.modState && typeof entry.modState === "object" ? entry.modState : {},
        qty: Math.max(1, Number(entry.qty || 1))
      }))
      .filter((entry) => entry.id !== null && entry.id !== undefined);
  } catch (_) {
    state.cart = [];
  }
}

function renderCart() {
  const { count, total } = getCartTotals();
  const availabilityMap = getCurrentAvailabilityMap();
  const hasUnavailable = state.cart.some((entry) => isCartEntryUnavailable(entry, availabilityMap));

  ui.cartTotal.textContent = currency(total);
  ui.cartFabCount.textContent = `${count} ${count === 1 ? "item" : "itens"}`;
  ui.cartFabTotal.textContent = currency(total);
  ui.checkoutBtn.disabled = count === 0 || hasUnavailable;
  ui.removeUnavailableBtn.hidden = !hasUnavailable;

  if (count === 0) {
    ui.cartFab.classList.remove("show");
    ui.cartList.innerHTML = '<div class="cart-empty">Seu carrinho está vazio.</div>';
    ui.checkoutBtn.textContent = "Finalizar no WhatsApp";
    ui.removeUnavailableBtn.hidden = true;
    persistCart();
    return;
  }

  ui.cartFab.classList.add("show");
  ui.checkoutBtn.textContent = hasUnavailable ? "Remova itens indisponíveis" : "Finalizar no WhatsApp";
  ui.cartList.innerHTML = state.cart
    .map((entry, index) => `
      <article class="cart-item${isCartEntryUnavailable(entry, availabilityMap) ? " unavailable" : ""}">
        <div class="cart-item-top">
          <h4 class="cart-item-title">${escapeHtml(entry.name)}</h4>
          <div class="cart-item-actions">
            <button type="button" class="ghost-btn" data-cart-edit="${index}">Editar</button>
            <button type="button" class="ghost-btn" data-cart-remove="${index}">Remover</button>
          </div>
        </div>
        ${entry.optionsText ? `<p class="item-desc">${escapeHtml(entry.optionsText)}</p>` : ""}
        ${entry.note ? `<p class="cart-item-note"><strong>Observação:</strong> ${escapeHtml(entry.note)}</p>` : ""}
        ${isCartEntryUnavailable(entry, availabilityMap) ? '<p class="cart-item-warning">Este item ficou indisponível e precisa ser removido do carrinho.</p>' : ""}
        <div class="cart-item-bottom">
          <div class="qty-wrap">
            <button type="button" class="qty-btn" data-cart-delta="-1" data-cart-index="${index}">-</button>
            <span class="qty-val">${entry.qty}</span>
            <button type="button" class="qty-btn" data-cart-delta="1" data-cart-index="${index}">+</button>
          </div>
          <span class="cart-item-price">${currency(Number(entry.price || 0) * entry.qty)}</span>
        </div>
      </article>
    `)
    .join("");

  persistCart();
}

function removeUnavailableCartItems() {
  const availabilityMap = getCurrentAvailabilityMap();
  if (!availabilityMap) {
    return;
  }

  const before = state.cart.length;
  state.cart = state.cart.filter((entry) => !isCartEntryUnavailable(entry, availabilityMap));
  const removed = before - state.cart.length;

  if (removed > 0) {
    renderCart();
    setStatus(`${removed} ${removed === 1 ? "item indisponível removido" : "itens indisponíveis removidos"} do carrinho.`, "ok");
  }
}

function addToCart(item, qty, unitPrice = Number(item.price || 0), optionsText = "", signature = "") {
  const entryKey = signature || `${item.id}::${optionsText}`;
  const current = state.cart.find((entry) => entry.signature === entryKey);
  if (current) {
    current.qty += qty;
  } else {
    state.cart.push({
      id: item.id,
      signature: entryKey,
      name: item.name,
      price: Number(unitPrice || 0),
      optionsText,
      note: "",
      modState: {},
      qty
    });
  }
  renderCart();
}

function buildEntrySignature(itemId, selectedState, note, unitPrice) {
  const statePart = Object.entries(selectedState || {})
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return `${itemId}::${statePart}::${String(note || "").trim()}::${Number(unitPrice || 0).toFixed(2)}`;
}

function updateCartQty(index, delta) {
  const entry = state.cart[index];
  if (!entry) {
    return;
  }
  entry.qty += delta;
  if (entry.qty <= 0) {
    state.cart.splice(index, 1);
  }
  renderCart();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  renderCart();
}

function openCart() {
  ui.cartBackdrop.classList.add("show");
  scheduleRefreshFromRealtime();
}

function closeCart() {
  ui.cartBackdrop.classList.remove("show");
}

function updateViewportMetrics() {
  const vv = window.visualViewport;
  let height = window.innerHeight;
  let bottomInset = 0;

  if (vv) {
    height = vv.height;
    const layoutHeight = window.innerHeight;
    bottomInset = Math.max(0, layoutHeight - (vv.height + vv.offsetTop));
  }

  document.documentElement.style.setProperty("--viewport-height", `${(height / 100).toFixed(4)}px`);
  document.documentElement.style.setProperty("--viewport-bottom-inset", `${Math.round(bottomInset)}px`);
}

function bindViewportMetrics() {
  updateViewportMetrics();

  window.addEventListener("resize", updateViewportMetrics, { passive: true });
  window.addEventListener("orientationchange", updateViewportMetrics, { passive: true });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateViewportMetrics, { passive: true });
    window.visualViewport.addEventListener("scroll", updateViewportMetrics, { passive: true });
  }
}

function lockPageScroll() {
  state.lockedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = `-${state.lockedScrollY}px`;
  document.body.classList.add("modal-open");
}

function unlockPageScroll() {
  const y = state.lockedScrollY || 0;
  document.body.classList.remove("modal-open");
  document.body.style.top = "";
  window.scrollTo(0, y);
}

function returnToHomeView() {
  // Apenas fecha o popup; sem forcar scroll para o inicio.
  closeModal();
}

function openCartEdit(index) {
  const entry = state.cart[index];
  if (!entry) {
    return;
  }
  const item = state.items.find((row) => row.id === entry.id);
  if (!item) {
    return;
  }
  closeCart();
  openItemModal(item, { editIndex: index });
}

async function checkoutWhatsApp() {
  await refreshDataNow({ showError: false });

  const { count, total } = getCartTotals();
  if (count === 0) {
    return;
  }

  const availabilityMap = getCurrentAvailabilityMap();
  const hasUnavailable = state.cart.some((entry) => isCartEntryUnavailable(entry, availabilityMap));
  if (hasUnavailable) {
    alert("Existem itens indisponíveis no carrinho. Remova-os para finalizar o pedido.");
    return;
  }

  const phoneRaw = String(state.setup?.phone || "").replace(/\D/g, "");
  if (!phoneRaw) {
    alert("Telefone do restaurante não configurado para finalizar.");
    return;
  }

  const sep = "_______________________________________";
  const lines = [sep, `Pedido - ${state.setup?.name || "Restaurante"}`, sep];

  state.cart.forEach((entry) => {
    lines.push(`• ${entry.qty}x ${entry.name} - ${currency(entry.qty * entry.price)}`);

    if (entry.optionsText) {
      const mods = String(entry.optionsText)
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);

      mods.forEach((mod) => {
        lines.push(`  ${mod}`);
      });
    }

    if (entry.note) {
      lines.push(`  obs.: ${entry.note}`);
    }

    lines.push("");
  });

  const note = String(ui.cartNote?.value || "").trim();
  if (note) {
    lines.push(`Obs.: ${note}`, "");
  }

  lines.push(sep, `Total: ${currency(total)}`, sep);

  const text = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/${phoneRaw}?text=${text}`, "_blank");
}

function setStatus(text, cls = "") {
  const hasText = Boolean(String(text || "").trim());
  ui.status.hidden = !hasText;
  if (!hasText) {
    ui.status.className = "status-bar";
    ui.status.textContent = "";
    return;
  }

  ui.status.className = "status-bar" + (cls ? ` ${cls}` : "");
  ui.status.textContent = text;
}

function currency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  if (value.startsWith("assets/") || /^https?:\/\//i.test(value)) {
    return value;
  }
  return "";
}

function isValidImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return false;
  }
  return value.startsWith("assets/") || /^https?:\/\//i.test(value);
}

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sortPriorityValue(row) {
  const num = Number(row?.sort_priority);
  return Number.isFinite(num) ? num : 0;
}

function sortByPriorityThenName(rows) {
  return [...rows].sort((a, b) => {
    const pa = sortPriorityValue(a);
    const pb = sortPriorityValue(b);
    if (pa !== pb) {
      return pa - pb;
    }
    return String(a?.name || "").localeCompare(String(b?.name || ""), "pt-BR", { sensitivity: "base" });
  });
}

function getDayKey(date) {
  const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return keys[date.getDay()];
}

function toMinutes(hhmmss) {
  if (!hhmmss) {
    return null;
  }
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

function isGroupActive(group, now) {
  if (group.ignore_group_rule) {
    return true;
  }

  const dayOk = group[getDayKey(now)] === true;
  if (!dayOk) {
    return false;
  }

  const start = toMinutes(group.hour_start);
  const end = toMinutes(group.hour_end);

  if (start === null || end === null) {
    return true;
  }

  const current = now.getHours() * 60 + now.getMinutes();
  return current >= start && current <= end;
}

function computeActiveItemIds(groups, groupAssocs) {
  const now = new Date();
  const active = new Set();

  groups.forEach((group) => {
    if (!isGroupActive(group, now)) {
      return;
    }

    groupAssocs
      .filter((assoc) => assoc.group_id === group.id)
      .forEach((assoc) => active.add(assoc.item_id));
  });

  return active;
}

function getVisibleItems(items, groups, groupAssocs) {
  const itemsInAnyGroup = new Set(groupAssocs.map((assoc) => assoc.item_id));
  const hasGroups = groups.length > 0;
  const activeSet = computeActiveItemIds(groups, groupAssocs);

  return items
    .map((item) => {
      const inGroup = hasGroups && itemsInAnyGroup.has(item.id);
      const groupInactive = inGroup && !activeSet.has(item.id);
      const effectiveStock = groupInactive ? 0 : Number(item.stock || 0);
      return {
        ...item,
        __groupInactive: groupInactive,
        __effectiveStock: effectiveStock
      };
    })
    .filter((item) => item.__effectiveStock >= 0);
}

function linkTypeLabel(type) {
  if (type === "delta") return "Ajuste";
  if (type === "scalable") return "Quantidade";
  if (type === "complementary") return "Opcional";
  return type || "-";
}

function linkValueLabel(type, value) {
  const num = Number(value);

  if (type === "delta") {
    if (num === 0) return "Removido";
    if (num === 1) return "Padrão";
    if (num === 2) return "Acréscimo";
  }

  if (type === "scalable") return `${num}x`;
  if (type === "complementary") return num === 1 ? "Com" : "Sem";

  return String(value ?? "-");
}

function getItemPhotos(item) {
  const ordered = [item.photo_url_1, item.photo_url_2, item.photo_url_3, item.photo_url]
    .map((url) => String(url || "").trim())
    .filter((url) => isValidImageUrl(url));

  return [...new Set(ordered)];
}

function rotateCardPhotos() {
  const photos = [...document.querySelectorAll(".item-photo.rotating-photo")];

  photos.forEach((img) => {
    const options = JSON.parse(img.dataset.photos || "[]");
    if (options.length < 2) {
      return;
    }

    let nextIndex = 0;
    if (Math.random() > 0.8) {
      nextIndex = Math.floor(Math.random() * (options.length - 1)) + 1;
    }

    const currentIndex = Number(img.dataset.currentIndex || 0);
    if (nextIndex === currentIndex) {
      return;
    }

    img.classList.add("fade-switch");
    setTimeout(() => {
      img.src = options[nextIndex];
      img.dataset.currentIndex = String(nextIndex);
      img.classList.remove("fade-switch");
    }, 220);
  });
}

function startPhotoRotation() {
  if (state.photoRotationTimer) {
    clearInterval(state.photoRotationTimer);
    state.photoRotationTimer = null;
  }

  const hasRotating = document.querySelector(".item-photo.rotating-photo[data-photos]");
  if (!hasRotating) {
    return;
  }

  state.photoRotationTimer = setInterval(rotateCardPhotos, 7000);
}

function buildCategoryTree(categories) {
  const orderedCategories = sortByPriorityThenName(categories || []);
  const byId = {};
  const children = {};

  orderedCategories.forEach((cat) => {
    byId[cat.id] = cat;
    children[cat.id] = [];
  });

  const roots = [];

  orderedCategories.forEach((cat) => {
    if (cat.parent_id && byId[cat.parent_id]) {
      children[cat.parent_id].push(cat);
    } else {
      roots.push(cat);
    }
  });

  return { roots, children };
}

function buildInlineCompositionText(itemId) {
  const typeOrder = { delta: 0, scalable: 1 };

  const rows = state.associations
    .filter((assoc) => assoc.owner_id === itemId && (assoc.link_type === "delta" || assoc.link_type === "scalable"))
    .map((assoc) => ({
      assoc,
      comp: state.compMap[assoc.composition_id]
    }))
    .filter((row) => row.comp && Number(row.comp.stock ?? 0) >= 0)
    .sort((a, b) => {
      const ta = typeOrder[a.assoc.link_type] ?? 99;
      const tb = typeOrder[b.assoc.link_type] ?? 99;
      if (ta !== tb) {
        return ta - tb;
      }

      const pa = sortPriorityValue(a.comp);
      const pb = sortPriorityValue(b.comp);
      if (pa !== pb) {
        return pa - pb;
      }

      return String(a.comp.name || "").localeCompare(String(b.comp.name || ""), "pt-BR", { sensitivity: "base" });
    });

  const seen = new Set();
  const names = [];

  const formatQty = (value) => {
    const rounded = Math.round(value);
    return Math.abs(value - rounded) < 0.001 ? String(rounded) : String(value).replace(".", ",");
  };

  rows.forEach((row) => {
    const key = row.comp.id;
    if (seen.has(key)) {
      return;
    }

    const baseValue = Number(row.assoc.link_value ?? 0);
    if (!Number.isFinite(baseValue) || baseValue < 1) {
      return;
    }

    seen.add(key);
    const compName = String(row.comp.name || "").trim();
    if (!compName) {
      return;
    }

    if (baseValue > 1) {
      names.push(`${formatQty(baseValue)} x ${compName}`);
      return;
    }

    names.push(compName);
  });

  return names.filter(Boolean).join(" | ");
}

function buildSearchCompositionText(itemId) {
  const names = state.associations
    .filter((assoc) => assoc.owner_id === itemId && Number(assoc.link_value ?? 0) > 0)
    .map((assoc) => state.compMap[assoc.composition_id])
    .filter((comp) => comp && Number(comp.stock ?? 0) >= 0)
    .map((comp) => String(comp.name || "").trim())
    .filter(Boolean);

  return [...new Set(names)].join(" ");
}

function createItemCard(item, mode) {
  const isInert = Number(item.__effectiveStock ?? item.stock ?? 0) === 0;
  const photos = getItemPhotos(item);
  const photo = safeImageUrl(photos[0] || "");
  const hasPhoto = Boolean(photo);
  const description = String(item.description || "").trim();
  const compositionInline = buildInlineCompositionText(item.id);
  const compositionForSearch = buildSearchCompositionText(item.id);
  const safeName = escapeHtml(item.name);
  const safeDescription = escapeHtml(description);
  const safeCompositionInline = escapeHtml(compositionInline);
  const descWithComp = description && compositionInline
    ? `${safeDescription} <span class="item-comp-inline">${safeCompositionInline}</span>`
    : (description ? safeDescription : (compositionInline ? `<span class="item-comp-inline">${safeCompositionInline}</span>` : ""));
  const div = document.createElement("article");
  div.className = `item-card${isInert ? " inert" : ""}${hasPhoto ? "" : " no-photo"}`;
  div.dataset.search = normalize(`${item.name} ${description} ${compositionInline} ${compositionForSearch}`);

  const photoMarkup = hasPhoto
    ? `<img class="item-photo" src="${photo}" alt="${safeName}" loading="lazy">`
    : "";

  div.innerHTML = `
    ${photoMarkup}
    <div>
      <h4 class="item-name">${safeName}</h4>
      ${descWithComp ? `<p class="item-desc">${descWithComp}</p>` : ""}
      <div class="item-bottom">
        <span class="item-price">${currency(item.price)}</span>
        ${isInert ? '<span class="item-stock">Indisponível</span>' : ""}
      </div>
    </div>
  `;

  if (!isInert) {
    div.addEventListener("click", () => openItemModal(item));
  }

  if (mode === "grade") {
    div.classList.add("grid-mode");
  }

  const img = div.querySelector(".item-photo");
  if (img && photos.length > 1) {
    img.classList.add("rotating-photo");
    img.dataset.photos = JSON.stringify(photos);
    img.dataset.currentIndex = "0";
  }

  return div;
}

function renderCategoryNav(roots) {
  ui.catNav.innerHTML = "";

  roots.forEach((root, index) => {
    const btn = document.createElement("button");
    btn.className = `cat-btn${index === 0 ? " active" : ""}`;
    btn.classList.add("nav-reveal");
    btn.style.setProperty("--nav-index", String(index));
    btn.textContent = root.name;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-btn").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`cat-${root.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    ui.catNav.appendChild(btn);
  });
}

function setupMenuReveal() {
  if (state.revealObserver) {
    state.revealObserver.disconnect();
    state.revealObserver = null;
  }

  const targets = [
    ...ui.menu.querySelectorAll(".menu-section, .sub-section, .item-card")
  ];

  if (!targets.length) {
    return;
  }

  targets.forEach((el, index) => {
    el.classList.add("reveal-item");
    el.classList.remove("reveal-in");
    el.style.setProperty("--reveal-index", String(index % 12));
  });

  const cards = [...ui.menu.querySelectorAll(".item-card")];
  cards.forEach((card, index) => {
    card.style.setProperty("--float-index", String(index % 10));
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => {
      el.classList.add("reveal-in", "visible-react");
      setTimeout(() => el.classList.remove("visible-react"), 950);
    });
    return;
  }

  state.revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("reveal-in");
        entry.target.classList.add("visible-react");
        setTimeout(() => entry.target.classList.remove("visible-react"), 950);
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -6% 0px"
    }
  );

  targets.forEach((el) => state.revealObserver.observe(el));
}

function nextVisibleReactDelayMs() {
  const seconds = 10 + (Math.random() * 10 - 5);
  return Math.max(5000, Math.round(seconds * 1000));
}

function getVisibleCards() {
  const viewportH = window.innerHeight || document.documentElement.clientHeight || 0;
  return [...ui.menu.querySelectorAll(".item-card")].filter((card) => {
    if (!card.isConnected || card.style.display === "none") {
      return false;
    }

    const rect = card.getBoundingClientRect();
    const visibleHeight = Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0);
    return visibleHeight >= Math.min(48, rect.height * 0.35);
  });
}

function triggerCardVisibleReact(card) {
  if (!card) {
    return;
  }

  card.classList.remove("visible-react");
  void card.offsetWidth;
  card.classList.add("visible-react");
  setTimeout(() => card.classList.remove("visible-react"), 950);
}

function scheduleVisibleReactLoop() {
  if (state.visibleReactTimer) {
    clearTimeout(state.visibleReactTimer);
    state.visibleReactTimer = null;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const run = () => {
    const cards = getVisibleCards();
    if (cards.length) {
      const pick = cards[Math.floor(Math.random() * cards.length)];
      triggerCardVisibleReact(pick);
    }

    state.visibleReactTimer = setTimeout(run, nextVisibleReactDelayMs());
  };

  state.visibleReactTimer = setTimeout(run, nextVisibleReactDelayMs());
}

function renderBranch(category, children, itemsByCategory, depth = 0, trail = []) {
  const section = document.createElement("section");
  section.className = depth === 0 ? "menu-section" : `sub-section depth-${depth}`;
  section.dataset.depth = String(depth);

  const ownItems = sortByPriorityThenName(itemsByCategory.get(category.id) || []);
  const descendants = children[category.id] || [];
  const currentTrail = [...trail, category.name];
  const showPath = depth > 0 && (ownItems.length > 0 || descendants.length === 0);

  if (showPath) {
    const path = document.createElement("div");
    path.className = "sub-path";
    const relativeTrail = currentTrail.slice(1).join(" > ");
    path.textContent = `> ${relativeTrail}`;
    section.appendChild(path);
  } else if (depth > 0 && ownItems.length === 0 && descendants.length > 0) {
    section.classList.add("compact-node");
  }

  if (depth === 0) {
    const title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = category.name;
    section.appendChild(title);
  }

  if (ownItems.length > 0) {
    const mode = (category.display_mode === "grade" || category.display_mode === "grid") ? "grade" : "lista";
    const grid = document.createElement("div");
    grid.className = mode === "grade" ? "items-grid" : "items-list";

    ownItems.forEach((item) => {
      grid.appendChild(createItemCard(item, mode));
    });

    section.appendChild(grid);
  }

  descendants.forEach((child) => {
    const childNode = renderBranch(child, children, itemsByCategory, depth + 1, currentTrail);
    if (childNode) {
      section.appendChild(childNode);
    }
  });

  if (ownItems.length === 0 && descendants.length === 0) {
    return null;
  }

  if (section.querySelectorAll(".item-card").length === 0) {
    return null;
  }

  return section;
}

function renderMenu() {
  const visibleItems = getVisibleItems(state.items, state.groups, state.groupAssociations);
  const { roots, children } = buildCategoryTree(state.categories);

  const itemsByCategory = new Map();
  visibleItems.forEach((item) => {
    const key = item.category_id || "__none__";
    if (!itemsByCategory.has(key)) {
      itemsByCategory.set(key, []);
    }
    itemsByCategory.get(key).push(item);
  });

  ui.menu.innerHTML = "";

  roots.forEach((root) => {
    const rootNode = renderBranch(root, children, itemsByCategory, 0);
    if (!rootNode) {
      return;
    }
    rootNode.id = `cat-${root.id}`;
    ui.menu.appendChild(rootNode);
  });

  if (!ui.menu.children.length) {
    ui.menu.innerHTML = '<div class="empty">Nenhum item disponível no momento.</div>';
  }

  renderCategoryNav(roots.filter((root) => document.getElementById(`cat-${root.id}`)));
  applySearch();
  startPhotoRotation();
  setupMenuReveal();
  scheduleVisibleReactLoop();
}

function renderHeader() {
  const setup = state.setup || {};
  document.title = `${setup.name || "Cardápio"} | Smart Store Hub`;

  ui.brandName.textContent = setup.name || "Restaurante";
  ui.brandSchedule.textContent = setup.schedule || "Horário não informado";

  const phoneLabel = setup.phone || "Não informado";
  const whatsappRaw = String(setup.phone || "").replace(/\D/g, "");
  ui.brandPhone.textContent = phoneLabel;
  if (whatsappRaw) {
    ui.brandPhoneLink.href = `https://wa.me/${whatsappRaw}`;
    ui.brandPhoneLink.removeAttribute("aria-disabled");
  } else {
    ui.brandPhoneLink.href = "#";
    ui.brandPhoneLink.setAttribute("aria-disabled", "true");
  }

  ui.brandPix.textContent = "Pagar com PIX";
  const pixLink = String(setup.pix_key || "").trim();
  const pixIsUrl = /^https?:\/\//i.test(pixLink);
  if (pixIsUrl) {
    ui.brandPixLink.href = pixLink;
    ui.brandPixLink.removeAttribute("aria-disabled");
  } else {
    ui.brandPixLink.href = "#";
    ui.brandPixLink.setAttribute("aria-disabled", "true");
  }

  const storeInfoText = String(setup.public_info_text || "").trim();
  const infoMode = String(setup.public_info_mode || "basic").trim().toLowerCase();
  if (storeInfoText) {
    if (infoMode === "html") {
      // Conteudo HTML vem do setup e e considerado confiavel (entrada do administrador).
      ui.storeInfoText.innerHTML = storeInfoText;
    } else {
      ui.storeInfoText.textContent = storeInfoText;
    }
    ui.storeInfo.hidden = false;
  } else {
    ui.storeInfoText.textContent = "";
    ui.storeInfo.hidden = true;
  }

  ui.brandLogo.src = FIXED_BRAND_LOGO;
}

function setupHeaderLogoScale() {
  const styles = getComputedStyle(document.documentElement);
  const logoStyles = getComputedStyle(ui.brandLogo);
  const baseLogoSize = parseFloat(logoStyles.getPropertyValue("--logo-base-size")) || 60;
  const maxLogoSize = parseFloat(styles.getPropertyValue("--item-grid-photo-max")) || 172;
  const maxScale = Math.max(1, maxLogoSize / baseLogoSize);
  const startBoost = maxScale;
  const scrollRange = 220;

  const applyScale = (scale) => {
    ui.brandLogo.style.setProperty("--logo-scale", String(scale));
  };

  const updateByScroll = () => {
    const y = Math.max(0, window.scrollY || 0);
    const progress = Math.min(1, y / scrollRange);
    const scale = maxScale - (maxScale - 1) * progress;
    applyScale(scale.toFixed(3));
  };

  ui.brandLogo.classList.add("logo-intro");
  applyScale(startBoost.toFixed(3));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateByScroll();
      setTimeout(() => ui.brandLogo.classList.remove("logo-intro"), 800);
    });
  });

  window.addEventListener("scroll", updateByScroll, { passive: true });
}

function applySearch() {
  const cards = [...ui.menu.querySelectorAll(".item-card")];
  const term = normalize(state.searchTerm);

  cards.forEach((card) => {
    const visible = !term || card.dataset.search.includes(term);
    card.style.display = visible ? "" : "none";
  });

  const sections = [...ui.menu.querySelectorAll(".menu-section, .sub-section")];
  sections.forEach((section) => {
    const hasVisibleCard = [...section.querySelectorAll(".item-card")].some((card) => card.style.display !== "none");
    section.style.display = hasVisibleCard ? "" : "none";
  });

  if (cards.length && cards.every((card) => card.style.display === "none")) {
    if (!document.getElementById("empty-search")) {
      const empty = document.createElement("div");
      empty.id = "empty-search";
      empty.className = "empty";
      empty.textContent = "Nenhum item encontrado para sua busca.";
      ui.menu.prepend(empty);
    }
  } else {
    document.getElementById("empty-search")?.remove();
  }
}

function openItemModal(item, options = {}) {
  const editIndex = Number.isInteger(options.editIndex) ? options.editIndex : null;
  const cartEntry = editIndex !== null ? state.cart[editIndex] : null;
  state.modalQty = cartEntry?.qty || 1;
  const isUnavailable = Number(item.__effectiveStock ?? item.stock ?? 0) === 0;
  const photos = getItemPhotos(item);
  const mainPhoto = safeImageUrl(photos[0] || "");
  const hasMainPhoto = Boolean(mainPhoto);
  const description = String(item.description || "").trim();
  const safeName = escapeHtml(item.name);
  const safeDescription = escapeHtml(description);
  const associations = state.associations.filter((assoc) => assoc.owner_id === item.id);

  const validRows = associations
    .map((assoc) => ({
      assoc,
      comp: state.compMap[assoc.composition_id]
    }))
    .filter((entry) => entry.comp && entry.comp.stock >= 0);

  const compState = {};
  const rowsByAssoc = {};
  validRows.forEach((entry) => {
    const id = entry.assoc.id;
    compState[id] = Math.max(0, Number(entry.assoc.link_value || 0));
    rowsByAssoc[id] = entry;
  });

  if (cartEntry?.modState && typeof cartEntry.modState === "object") {
    Object.entries(cartEntry.modState).forEach(([assocId, value]) => {
      if (rowsByAssoc[assocId]) {
        compState[assocId] = Math.max(0, Number(value || 0));
      }
    });
  }

  const clampCompValue = (entry, value) => {
    const n = Math.max(0, Number(value || 0));
    if (entry.assoc.link_type === "delta") {
      return Math.min(2, n);
    }
    if (entry.assoc.link_type === "complementary") {
      return Math.min(1, n);
    }
    return n;
  };

  const compExtra = (entry, value) => {
    const price = Number(entry.comp.price || 0);
    if (price <= 0) {
      return 0;
    }
    const baseValue = clampCompValue(entry, Number(entry.assoc.link_value || 0));
    return (value - baseValue) * price;
  };

  const getCompSelection = () => {
    let extra = 0;
    const labels = [];
    const selectedState = {};

    validRows.forEach((entry) => {
      const assocId = entry.assoc.id;
      const value = clampCompValue(entry, compState[assocId]);
      compState[assocId] = value;
      selectedState[assocId] = value;
      const baseValue = clampCompValue(entry, Number(entry.assoc.link_value || 0));
      extra += compExtra(entry, value);

      if (value === baseValue) {
        return;
      }

      if (entry.assoc.link_type === "delta") {
        if (value === 0) {
          labels.push(`remover ${entry.comp.name}`);
        } else if (value === 2) {
          labels.push(`muito ${entry.comp.name}`);
        } else {
          labels.push(`normal ${entry.comp.name}`);
        }
      } else if (entry.assoc.link_type === "scalable") {
        const diff = Math.abs(value - baseValue);
        if (value > baseValue) {
          labels.push(`adicionar ${diff}x ${entry.comp.name}`);
        } else {
          if (baseValue > 1) {
            labels.push(`remover ${diff}x ${entry.comp.name}`);
          } else {
            labels.push(`remover ${entry.comp.name}`);
          }
        }
      } else if (entry.assoc.link_type === "complementary") {
        labels.push(value === 1 ? `adicionar ${entry.comp.name}` : `remover ${entry.comp.name}`);
      }
    });

    return {
      extra,
      optionsText: labels.join(" | "),
      selectedState,
    };
  };

  const compSection = validRows.length
    ? `
      <div class="comp-wrap">
        <button class="comp-head" id="compToggleBtn">Modificar</button>
        <div class="comp-body" id="compBody">
          <div id="compInteractive"></div>
        </div>
      </div>
    `
    : "";

  const modalHead = hasMainPhoto
    ? `
        <div class="modal-head">
          <img class="modal-photo" src="${mainPhoto}" alt="${safeName}">
          <button class="modal-close" id="modalClose" aria-label="Fechar">X</button>
        </div>
      `
    : `
        <div class="modal-head no-photo">
          <button class="modal-close" id="modalClose" aria-label="Fechar">X</button>
        </div>
      `;

  ui.modalBody.innerHTML = `
    <article class="modal" role="dialog" aria-modal="true" aria-label="Detalhes do item">
      <div class="modal-scroll">
        ${modalHead}
        <div class="modal-content">
          <h3 class="modal-title">${safeName}</h3>
          <p class="modal-price" id="modalDynamicPrice">${currency(item.price)}</p>
          ${description ? `<p class="modal-text">${safeDescription}</p>` : ""}
          ${isUnavailable ? '<p class="item-stock">Item indisponível no momento.</p>' : ""}
          ${compSection}
          <div class="obs-section">
            <div class="obs-title">Observação do item</div>
            <textarea id="modalNote" class="modal-note" rows="3" placeholder="Observação (opcional)">${escapeHtml(cartEntry?.note || "")}</textarea>
          </div>
        </div>
      </div>
      ${!isUnavailable ? `
      <div class="modal-footer">
        <div class="modal-actions">
          <div class="qty-wrap">
            <button type="button" class="qty-btn" id="modalQtyMinus">-</button>
            <span class="qty-val" id="modalQtyVal">1</span>
            <button type="button" class="qty-btn" id="modalQtyPlus">+</button>
          </div>
          <button type="button" class="ghost-btn" id="modalViewCartBtn">Ver carrinho</button>
          <button type="button" class="add-btn" id="modalAddBtn">${editIndex !== null ? "Salvar alterações" : "Adicionar ao carrinho"}</button>
        </div>
      </div>
      ` : ""}
    </article>
  `;

  ui.modal.classList.add("show");
  lockPageScroll();

  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  document.getElementById("compToggleBtn")?.addEventListener("click", () => {
    const compBody = document.getElementById("compBody");
    const modalScroll = ui.modalBody.querySelector(".modal-scroll");
    if (!compBody || !modalScroll) {
      return;
    }

    const isShowing = compBody.classList.toggle("show");
    modalScroll.classList.toggle("mod-scroll-enabled", isShowing);
  });

  const compInteractive = document.getElementById("compInteractive");
  const modalDynamicPrice = document.getElementById("modalDynamicPrice");

  const renderCompInteractive = () => {
    if (!compInteractive) {
      return;
    }

    compInteractive.innerHTML = validRows
      .map((entry) => {
        const assocId = entry.assoc.id;
        const value = clampCompValue(entry, compState[assocId]);
        const priceText = Number(entry.comp.price || 0) > 0 ? currency(entry.comp.price) : "";

        if (entry.assoc.link_type === "delta") {
          return `
            <div class="comp-row">
              <div>
                <strong>${escapeHtml(entry.comp.name)}</strong>
                ${priceText ? `<div><span class="item-desc">${priceText}</span></div>` : ""}
              </div>
              <div class="comp-actions">
                <button type="button" class="ghost-btn comp-choice ${value === 0 ? "active" : ""}" data-comp-action="set" data-assoc-id="${assocId}" data-value="0">Remover</button>
                <button type="button" class="ghost-btn comp-choice ${value === 1 ? "active" : ""}" data-comp-action="set" data-assoc-id="${assocId}" data-value="1">Normal</button>
                <button type="button" class="ghost-btn comp-choice ${value === 2 ? "active" : ""}" data-comp-action="set" data-assoc-id="${assocId}" data-value="2">Muito</button>
              </div>
            </div>
          `;
        }

        if (entry.assoc.link_type === "scalable") {
          return `
            <div class="comp-row">
              <div>
                <strong>${escapeHtml(entry.comp.name)}</strong>
                ${priceText ? `<div><span class="item-desc">${priceText}</span></div>` : ""}
              </div>
              <div class="comp-actions">
                <div class="qty-wrap">
                  <button type="button" class="qty-btn" data-comp-action="delta" data-assoc-id="${assocId}" data-step="-1">-</button>
                  <span class="qty-val">${value}</span>
                  <button type="button" class="qty-btn" data-comp-action="delta" data-assoc-id="${assocId}" data-step="1">+</button>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="comp-row">
            <div>
              <strong>${escapeHtml(entry.comp.name)}</strong>
              ${priceText ? `<div><span class="item-desc">${priceText}</span></div>` : ""}
            </div>
            <div class="comp-actions">
              <button type="button" class="ghost-btn comp-choice ${value === 1 ? "active" : ""}" data-comp-action="set" data-assoc-id="${assocId}" data-value="1">Sim</button>
              <button type="button" class="ghost-btn comp-choice ${value === 0 ? "active" : ""}" data-comp-action="set" data-assoc-id="${assocId}" data-value="0">Não</button>
            </div>
          </div>
        `;
      })
      .join("");

    const current = getCompSelection();
    if (modalDynamicPrice) {
      modalDynamicPrice.textContent = currency(Number(item.price || 0) + current.extra);
    }
  };

  if (compInteractive) {
    compInteractive.addEventListener("click", (event) => {
      const target = event.target.closest("[data-comp-action]");
      if (!target) {
        return;
      }

      const assocId = target.getAttribute("data-assoc-id");
      const action = target.getAttribute("data-comp-action");
      const entry = rowsByAssoc[assocId];
      if (!entry) {
        return;
      }

      let value = Number(compState[assocId] || 0);
      if (action === "set") {
        value = Number(target.getAttribute("data-value") || 0);
      } else if (action === "delta") {
        value += Number(target.getAttribute("data-step") || 0);
      }

      compState[assocId] = clampCompValue(entry, value);
      renderCompInteractive();
    });

    renderCompInteractive();
  }

  const qtyVal = document.getElementById("modalQtyVal");
  if (qtyVal) {
    qtyVal.textContent = String(state.modalQty);
  }
  document.getElementById("modalQtyMinus")?.addEventListener("click", () => {
    state.modalQty = Math.max(1, state.modalQty - 1);
    if (qtyVal) qtyVal.textContent = String(state.modalQty);
  });
  document.getElementById("modalQtyPlus")?.addEventListener("click", () => {
    state.modalQty += 1;
    if (qtyVal) qtyVal.textContent = String(state.modalQty);
  });
  document.getElementById("modalViewCartBtn")?.addEventListener("click", () => {
    closeModal();
    openCart();
  });
  document.getElementById("modalAddBtn")?.addEventListener("click", () => {
    const selection = getCompSelection();
    const note = (document.getElementById("modalNote")?.value || "").trim();
    const unitPrice = Number(item.price || 0) + selection.extra;
    const signature = buildEntrySignature(item.id, selection.selectedState, note, unitPrice);

    if (editIndex !== null) {
      state.cart[editIndex] = {
        ...state.cart[editIndex],
        signature,
        name: item.name,
        price: Number(unitPrice || 0),
        optionsText: selection.optionsText,
        note,
        modState: selection.selectedState,
        qty: state.modalQty,
      };
      renderCart();
      closeModal();
      openCart();
      return;
    }

    const current = state.cart.find((entry) => entry.signature === signature);
    if (current) {
      current.qty += state.modalQty;
      renderCart();
    } else {
      state.cart.push({
        id: item.id,
        signature,
        name: item.name,
        price: Number(unitPrice || 0),
        optionsText: selection.optionsText,
        note,
        modState: selection.selectedState,
        qty: state.modalQty,
      });
      renderCart();
    }

    returnToHomeView();
  });
}

function closeModal() {
  ui.modal.classList.remove("show");
  ui.modalBody.innerHTML = "";
  unlockPageScroll();
}

function bindEvents() {
  ui.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applySearch();
  });

  ui.modal.addEventListener("click", (event) => {
    if (event.target === ui.modal) {
      closeModal();
    }
  });

  ui.cartFab.addEventListener("click", openCart);
  ui.closeCartBtn.addEventListener("click", closeCart);
  ui.cartBackdrop.addEventListener("click", (event) => {
    if (event.target === ui.cartBackdrop) {
      closeCart();
    }
  });

  ui.cartList.addEventListener("click", (event) => {
    const editIndex = event.target.getAttribute("data-cart-edit");
    if (editIndex !== null) {
      openCartEdit(Number(editIndex));
      return;
    }

    const removeIndex = event.target.getAttribute("data-cart-remove");
    if (removeIndex !== null) {
      removeCartItem(Number(removeIndex));
      return;
    }

    const delta = event.target.getAttribute("data-cart-delta");
    const idx = event.target.getAttribute("data-cart-index");
    if (delta !== null && idx !== null) {
      updateCartQty(Number(idx), Number(delta));
    }
  });

  ui.checkoutBtn.addEventListener("click", checkoutWhatsApp);
  ui.removeUnavailableBtn.addEventListener("click", removeUnavailableCartItems);
}

async function refreshDataNow(options = {}) {
  const { showError = true } = options;

  if (state.refreshInFlight) {
    return false;
  }

  state.refreshInFlight = true;
  try {
    await loadData();
    renderHeader();
    renderMenu();
    renderCart();
    return true;
  } catch (error) {
    if (showError) {
      setStatus("Nao foi possivel atualizar o cardapio agora.", "err");
    }
    return false;
  } finally {
    state.refreshInFlight = false;
  }
}

function scheduleRefreshFromRealtime() {
  if (state.refreshTimer) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = null;
  }

  state.refreshTimer = setTimeout(async () => {
    await refreshDataNow({ showError: false });
    state.refreshTimer = null;
  }, 250);
}

function startAvailabilityPolling() {
  if (state.pollingTimer) {
    clearInterval(state.pollingTimer);
    state.pollingTimer = null;
  }

  // Fallback para manter disponibilidade atualizada mesmo sem realtime.
  state.pollingTimer = setInterval(() => {
    scheduleRefreshFromRealtime();
  }, 5000);
}

function bindRealtime() {
  if (state.realtimeChannel) {
    return;
  }

  const tables = [
    "setup",
    "node_category",
    "items",
    "composition",
    "item_composition_association",
    "item_group",
    "item_group_association"
  ];

  const channel = db.channel("menu-live-sync");
  tables.forEach((table) => {
    channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
      scheduleRefreshFromRealtime();
    });
  });

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      setStatus("");
    }
  });

  state.realtimeChannel = channel;
}

async function loadData() {
  const [
    setupRes,
    categoryRes,
    itemsRes,
    compositionRes,
    associationRes,
    groupsRes,
    groupAssocRes
  ] = await Promise.all([
    db.from("setup").select("*").limit(1),
    db.from("node_category").select("*"),
    db.from("items").select("*"),
    db.from("composition").select("*"),
    db.from("item_composition_association").select("*"),
    db.from("item_group").select("*"),
    db.from("item_group_association").select("*")
  ]);

  const err =
    setupRes.error ||
    categoryRes.error ||
    itemsRes.error ||
    compositionRes.error ||
    associationRes.error ||
    groupsRes.error ||
    groupAssocRes.error;

  if (err) {
    throw err;
  }

  state.setup = (setupRes.data || [])[0] || null;
  state.categories = sortByPriorityThenName(categoryRes.data || []);
  state.items = sortByPriorityThenName(itemsRes.data || []);
  state.compositions = compositionRes.data || [];
  state.associations = associationRes.data || [];
  state.groups = groupsRes.data || [];
  state.groupAssociations = groupAssocRes.data || [];

  state.compMap = {};
  state.compositions.forEach((comp) => {
    state.compMap[comp.id] = comp;
  });
}

async function init() {
  bindViewportMetrics();
  bindEvents();
  restoreCart();
  renderCart();

  try {
    await loadData();
    renderHeader();
    setupHeaderLogoScale();
    renderMenu();
    renderCart();
    bindRealtime();
    startAvailabilityPolling();
    setStatus("");
  } catch (error) {
    setStatus("Nao foi possivel carregar o cardapio.", "err");
    ui.menu.innerHTML = '<div class="empty">Não foi possível carregar os dados.</div>';
  }
}

init();
