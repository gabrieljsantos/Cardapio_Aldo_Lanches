const { createClient } = supabase;

const SUPABASE_URL = "https://bbrpnbetwwnwpwogjjrv.supabase.co";
const SUPABASE_KEY = "sb_publishable_IaoUthm5d9UzZCLsQYP2pg_VhsLIl7J";
const CART_STORAGE_KEY = "smart-store-hub-cart-v1";
const CART_NOTE_STORAGE_KEY = "smart-store-hub-cart-note-v1";
const APP_CHECKOUT_INTENT_KEY = "smart-store-hub-app-checkout-intent";
const APP_CHECKOUT_SNAPSHOT_KEY = "smart-store-hub-app-checkout-snapshot-v1";
const CART_GROUP_ADJUSTMENTS_KEY = "smart-store-hub-cart-group-adjustments-v1";
const CUSTOMER_PAGE_INTENT_KEY = "smart-store-hub-customer-page-intent";
let checkoutResumeInFlight = false;
const ORDER_STAGES = [
  { key: "pending_confirmation", label: "Aguardando confirmação" },
  { key: "received", label: "Pedido feito" },
  { key: "confirmed", label: "Pedido confirmado" },
  { key: "production", label: "Em preparação" },
  { key: "delivery", label: "Saiu para entrega" },
  { key: "delivered", label: "Entregue" }
];

const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const FIXED_BRAND_LOGO = "assets/Aldo%20Lanches%20logo.jpg";

const state = {
  categories: [],
  items: [],
  compositions: [],
  associations: [],
  ingredientPackages: [],
  packageComponents: [],
  packagePresentations: [],
  itemPackages: [],
  itemComponentConfigs: [],
  groups: [],
  groupAssociations: [],
  setup: null,
  compMap: {},
  searchTerm: "",
  cart: [],
  cartNotice: "",
  cartNoticeIsError: false,
  cartGroupAdjustments: {},
  modalQty: 1,
  photoRotationTimer: null,
  revealObserver: null,
  lockedScrollY: 0,
  visibleReactTimer: null,
  realtimeChannel: null,
  refreshTimer: null,
  refreshInFlight: false,
  pollingTimer: null,
  user: null,
  profile: null,
  authReady: false,
  customerOrders: [],
  selectedCustomerOrderId: null,
  customerOrdersPollingTimer: null,
  customerPage: "catalog"
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
  cartNotice: document.getElementById("cartNotice"),
  cartNote: document.getElementById("cartNote"),
  cartTotal: document.getElementById("cartTotal"),
  cartFab: document.getElementById("cartFab"),
  cartFabCount: document.getElementById("cartFabCount"),
  cartFabTotal: document.getElementById("cartFabTotal"),
  closeCartBtn: document.getElementById("closeCartBtn"),
  removeUnavailableBtn: document.getElementById("removeUnavailableBtn"),
  copyMessageBtn: document.getElementById("copyMessageBtn"),
  appCheckoutBtn: document.getElementById("appCheckoutBtn"),
  checkoutBtn: document.getElementById("checkoutBtn"),
  accountBtn: document.getElementById("accountBtn"),
  customerTabs: document.getElementById("customerTabs"),
  catalogPage: document.getElementById("catalogPage"),
  ordersPage: document.getElementById("ordersPage"),
  trackingPage: document.getElementById("trackingPage"),
  profilePage: document.getElementById("profilePage"),
  activeCustomerOrders: document.getElementById("activeCustomerOrders"),
  accountEmail: document.getElementById("accountEmail"),
  profileForm: document.getElementById("profileForm"),
  saveProfileBtn: document.getElementById("saveProfileBtn"),
  signOutBtn: document.getElementById("signOutBtn"),
  checkoutConfirmBackdrop: document.getElementById("checkoutConfirmBackdrop"),
  closeCheckoutConfirmBtn: document.getElementById("closeCheckoutConfirmBtn"),
  checkoutDeliveryInfo: document.getElementById("checkoutDeliveryInfo"),
  checkoutConfirmItems: document.getElementById("checkoutConfirmItems"),
  checkoutConfirmTotal: document.getElementById("checkoutConfirmTotal"),
  orderPaymentMethod: document.getElementById("orderPaymentMethod"),
  backToCartBtn: document.getElementById("backToCartBtn"),
  confirmAppOrderBtn: document.getElementById("confirmAppOrderBtn"),
  customerOrderDetailBackdrop: document.getElementById("customerOrderDetailBackdrop"),
  closeCustomerOrderDetailBtn: document.getElementById("closeCustomerOrderDetailBtn"),
  customerOrderList: document.getElementById("customerOrderList"),
  customerOrderDetail: document.getElementById("customerOrderDetail")
};

function getUserDisplayName(user) {
  const metadata = user?.user_metadata || {};
  return String(metadata.full_name || metadata.name || "").trim();
}

function renderAccountButton() {
  if (!ui.accountBtn) return;
  ui.accountBtn.textContent = state.user
    ? (state.profile?.known_as || "Minha conta")
    : "Entrar";
  ui.accountBtn.setAttribute("aria-label", state.user ? "Abrir minha conta" : "Entrar com Google");
}

function startCustomerLogin(intendedPage = null) {
  if(intendedPage)sessionStorage.setItem(CUSTOMER_PAGE_INTENT_KEY,intendedPage);
  if (state.cart.length) savePendingCheckoutSnapshot();
  db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}` }
  }).then(({ error }) => {
    if (error) setStatus("Não foi possível iniciar o login.", "err");
  });
}

function savePendingCheckoutSnapshot() {
  try {
    const snapshot = { cart: state.cart, note: String(ui.cartNote?.value || ""), savedAt: Date.now() };
    sessionStorage.setItem(APP_CHECKOUT_SNAPSHOT_KEY, JSON.stringify(snapshot));
    persistCart();
  } catch (error) {
    console.warn("Não foi possível guardar o carrinho antes do login:", error);
  }
}

function restorePendingCheckoutSnapshot() {
  try {
    if (sessionStorage.getItem(APP_CHECKOUT_INTENT_KEY) !== "confirm") return;
    const raw = sessionStorage.getItem(APP_CHECKOUT_SNAPSHOT_KEY);
    if (!raw) return;
    const snapshot = JSON.parse(raw);
    if (!Array.isArray(snapshot?.cart)) return;
    state.cart = snapshot.cart;
    if (ui.cartNote) ui.cartNote.value = String(snapshot.note || "");
    persistCart();
    renderCart();
  } catch (error) {
    console.warn("Não foi possível restaurar o carrinho após o login:", error);
  }
}

async function loadCustomerProfile() {
  if (!state.user) {
    state.profile = null;
    renderAccountButton();
    return;
  }
  const { data, error } = await db.from("profiles")
    .select("email, full_name, known_as, phone, street, landmark, address_extra")
    .eq("user_id", state.user.id)
    .maybeSingle();
  if (error) throw error;
  state.profile = data || null;
  renderAccountButton();
}

function splitCustomerPhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { country: "+55", area: "79", local: "" };
  let country = "55";
  let national = digits;
  if (digits.startsWith("55") && (raw.startsWith("+") || digits.length >= 12)) national = digits.slice(2);
  if (national.length >= 10) return { country: `+${country}`, area: national.slice(0, 2), local: national.slice(2) };
  if (national.length === 8 || national.length === 9) return { country: `+${country}`, area: "79", local: national };
  return { country: `+${country}`, area: "79", local: national.slice(-9) };
}

function customerPhoneFromForm(form) {
  const country = String(form.elements.phone_country_code.value || "").replace(/\D/g, "").slice(0, 3);
  const area = String(form.elements.phone_area_code.value || "").replace(/\D/g, "").slice(0, 2);
  const local = String(form.elements.phone_number.value || "").replace(/\D/g, "");
  if (!country || !area || !/^\d{8,9}$/.test(local)) return null;
  return `+${country}${area}${local}`;
}

function openAccountDialog() {
  if (!state.user) {
    startCustomerLogin("profile");
    return;
  }
  switchCustomerPage("profile");
  const form = ui.profileForm;
  const profile = state.profile || {};
  const phone = splitCustomerPhone(profile.phone);
  form.elements.known_as.value = profile.known_as || "";
  form.elements.phone_country_code.value = phone.country;
  form.elements.phone_area_code.value = phone.area;
  form.elements.phone_number.value = phone.local;
  form.elements.street.value = profile.street || "";
  form.elements.landmark.value = profile.landmark || "";
  form.elements.address_extra.value = profile.address_extra || "";
  ui.accountEmail.textContent = state.user.email || "";
  ui.signOutBtn.hidden = false;
}

function switchCustomerPage(page) {
  const pages = { catalog: ui.catalogPage, orders: ui.ordersPage, tracking: ui.trackingPage, profile: ui.profilePage };
  if (!pages[page]) page = "catalog";
  state.customerPage = page;
  Object.entries(pages).forEach(([key, element]) => {
    element.hidden = key !== page;
    element.classList.toggle("active", key === page);
  });
  ui.customerTabs.querySelectorAll("[data-customer-page]").forEach(button => {
    const active = button.dataset.customerPage === page;
    button.classList.toggle("active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  if (page !== "catalog") window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveCustomerProfile(event) {
  event.preventDefault();
  if (!state.user) return;
  if (!ui.profileForm.reportValidity()) return;
  const form = new FormData(ui.profileForm);
  const knownAs = String(form.get("known_as") || "").trim();
  const phone = customerPhoneFromForm(ui.profileForm);
  const street = String(form.get("street") || "").trim();
  if (!knownAs || !phone || !street) {
    setStatus("Confira o código do país, o DDD e o número do telefone.", "err");
    return;
  }
  ui.saveProfileBtn.disabled = true;
  try {
    const { error } = await db.from("profiles").upsert({
      user_id: state.user.id,
      email: state.user.email || null,
      full_name: getUserDisplayName(state.user) || null,
      known_as: knownAs,
      phone,
      street,
      landmark: String(form.get("landmark") || "").trim() || null,
      address_extra: String(form.get("address_extra") || "").trim() || null,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (error) throw error;
    await loadCustomerProfile();
    setStatus("Cadastro salvo.", "ok");
    await resumePendingAppCheckout();
  } catch (error) {
    console.error("Falha ao salvar perfil:", error);
    setStatus("Não foi possível salvar o cadastro.", "err");
  } finally {
    ui.saveProfileBtn.disabled = false;
  }
}

async function initializeCustomerAuth() {
  db.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user || null;
    if (state.user?.id !== nextUser?.id) {
      state.customerOrders = [];
      state.selectedCustomerOrderId = null;
      if (!nextUser && state.customerPage !== "catalog") switchCustomerPage("catalog");
    }
    state.user = nextUser;
    state.profile = null;
    renderAccountButton();
    window.setTimeout(async () => {
      try {
        await loadCustomerProfile();
        await resumePendingAppCheckout();
        await resumeCustomerPageIntent();
        if (state.user && ["orders", "tracking"].includes(state.customerPage)) {
          await loadCustomerOrders(state.selectedCustomerOrderId);
        }
      } catch (profileError) {
        console.error("Falha ao carregar perfil:", profileError);
      }
    }, 0);
  });
  const { data, error } = await db.auth.getSession();
  if (error) console.error("Falha ao recuperar sessão:", error);
  state.user = data?.session?.user || null;
  try { await loadCustomerProfile(); }
  catch (profileError) { console.error("Falha ao carregar perfil:", profileError); }
  state.authReady = true;
  renderAccountButton();
  await resumePendingAppCheckout();
  await resumeCustomerPageIntent();
}

async function resumeCustomerPageIntent(){
  if(!state.user)return;
  const page=sessionStorage.getItem(CUSTOMER_PAGE_INTENT_KEY);if(!page)return;
  if(sessionStorage.getItem(APP_CHECKOUT_INTENT_KEY)==="confirm"){sessionStorage.removeItem(CUSTOMER_PAGE_INTENT_KEY);return}
  sessionStorage.removeItem(CUSTOMER_PAGE_INTENT_KEY);
  if(page==="profile"){openAccountDialog();return}
  if(["orders","tracking"].includes(page))await openCustomerOrders(null,page);
}

async function resumePendingAppCheckout() {
  if (checkoutResumeInFlight) return;
  checkoutResumeInFlight = true;
  try {
    if (sessionStorage.getItem(APP_CHECKOUT_INTENT_KEY) !== "confirm") return;
    restorePendingCheckoutSnapshot();
    if (!state.user) return;
    if (!hasCompleteOrderProfile()) {
      openAccountDialog();
      return;
    }
    sessionStorage.removeItem(APP_CHECKOUT_INTENT_KEY);
    closeCart();
    openCheckoutConfirmation();
  } finally {
    checkoutResumeInFlight = false;
  }
}

function hasCompleteOrderProfile() {
  return Boolean(String(state.profile?.known_as || "").trim() && String(state.profile?.phone || "").trim() && String(state.profile?.street || "").trim());
}

function getCartTotals() {
  const count = state.cart.reduce((acc, entry) => acc + entry.qty, 0)
    + getSellableGroupTotals().reduce((sum, group) => sum + [...group.components.values()].reduce((total, component) => total + component.quantity, 0), 0);
  const itemTotal = state.cart.reduce((acc, entry) => acc + entry.qty * Number(entry.price || 0), 0);
  const total = itemTotal + getSellableGroupTotals().reduce((sum, group) => sum + group.totalPrice, 0);
  return { count, total };
}

function getSellableGroupTotals({ includePackageIds = [] } = {}) {
  const groups = new Map();
  const sellablePackages = new Map(state.ingredientPackages
    .filter(pack => pack.is_active !== false && pack.is_sellable === true)
    .map(pack => [String(pack.id), pack]));
  const ensureGroup = packageId => {
    const key = String(packageId), pack = sellablePackages.get(key);
    if (!pack) return null;
    if (!groups.has(key)) {
      const group = { packageId:key, pack, components:new Map(), allowance:0, totalPrice:0 };
      for (const row of state.packageComponents.filter(entry => String(entry.package_id) === key)) {
        const component = state.compMap[row.composition_id];
        if (!component || component.is_active === false) continue;
        const member = { row, component, config:{ default_quantity:0, free_allowance:0, max_quantity:component.max_quantity ?? 4, consumption_per_unit:1, is_enabled:true } };
        group.components.set(String(row.composition_id), { member, baseline:0, allowance:0, maxQuantity:0, quantity:0, adjustment:0 });
      }
      groups.set(key, group);
    }
    return groups.get(key);
  };
  for (const entry of state.cart) {
    for (const group of getItemPackageGroups(entry.id).filter(candidate => candidate.pack.is_sellable === true)) {
      const key = String(group.pack.id);
      const aggregate = ensureGroup(key);
      if (!aggregate) continue;
      const link = group.link || {};
      if (group.pack.franchise_mode === "shared") aggregate.allowance += Math.max(0, Number(link.shared_free_allowance || 0)) * entry.qty;
      for (const member of group.members) {
        const componentId = String(member.row.composition_id);
        if (!aggregate.components.has(componentId)) aggregate.components.set(componentId, { member, baseline:0, allowance:0, quantity:0, adjustment:0 });
        const component = aggregate.components.get(componentId);
        component.member = member;
        component.baseline += Math.max(0, Number(member.config.default_quantity || 0)) * entry.qty;
        component.maxQuantity += Math.max(0, Number(member.config.max_quantity ?? member.component.max_quantity ?? 4)) * entry.qty;
        if (group.pack.franchise_mode === "per_component") component.allowance += Math.max(0, Number(member.config.free_allowance || 0)) * entry.qty;
      }
    }
  }
  // A component-package category is available in the menu to everyone, but
  // it must not leak into the cart until selected directly or supplied by a
  // product already in the cart. Only explicitly positive direct quantities
  // create a cart group here.
  for (const [packageId, adjustments] of Object.entries(state.cartGroupAdjustments || {})) {
    const directSelection = Object.values(adjustments || {}).some(value => Number(value) > 0);
    if (directSelection) ensureGroup(packageId);
  }
  for (const packageId of includePackageIds) ensureGroup(packageId);
  for (const group of groups.values()) {
    const adjustments = state.cartGroupAdjustments[group.packageId] || {};
    let totalQuantity = 0;
    for (const [componentId, component] of group.components) {
      if (component.maxQuantity === 0) component.maxQuantity = Math.max(0, Number(component.member.config.max_quantity ?? component.member.component.max_quantity ?? 4));
      component.adjustment = Math.trunc(Number(adjustments[componentId] || 0));
      component.quantity = Math.max(0, component.baseline + component.adjustment);
      if (component.member.component.tracks_stock !== false) component.maxQuantity = Math.min(component.maxQuantity, Math.max(0, Number(component.member.component.stock || 0)));
      totalQuantity += component.quantity;
      const price = Math.max(0, Number(component.member.component.price || 0));
      if (group.pack.franchise_mode !== "shared") {
        const allowance = group.pack.franchise_mode === "per_component" ? component.allowance : 0;
        group.totalPrice += Math.max(0, component.quantity - allowance) * price;
      }
    }
    if (group.pack.franchise_mode !== "shared") group.freeRemaining = [...group.components.values()].reduce((sum, component) => sum + Math.max(0,component.allowance-component.quantity), 0);
    if (group.pack.franchise_mode === "shared") {
      const price = Number(group.components.values().next().value?.member.component.price || 0);
      group.totalPrice = Math.max(0, totalQuantity - group.allowance) * price;
      group.freeRemaining = Math.max(0, group.allowance - totalQuantity);
    }
  }
  return [...groups.values()];
}

function updateSellableEntitlementNotices(groups=getSellableGroupTotals()) {
  document.querySelectorAll("[data-sellable-entitlement]").forEach(notice=>{
    const packageId=String(notice.dataset.sellableEntitlement);
    const group=groups.find(entry=>String(entry.packageId)===packageId)
      ||getSellableGroupTotals({includePackageIds:[packageId]}).find(entry=>String(entry.packageId)===packageId);
    if(!group)return;
    const chosen=[...group.components.values()].reduce((sum,component)=>sum+component.quantity,0);
    const entitled=group.pack.franchise_mode==="shared"?group.allowance:[...group.components.values()].reduce((sum,component)=>sum+component.allowance,0);
    const categoryName=escapeHtml(notice.dataset.categoryName||packageCustomerName(group.pack));
    let priceMarkup="";
    if(group.pack.franchise_mode==="shared"){
      const price=Math.max(0,Number(group.components.values().next().value?.member.component.price||0));
      priceMarkup=`<span class="sellable-price-highlight">Por unidade: <strong>${currency(price)}</strong>${group.totalPrice>0?` · Subtotal: <strong>${currency(group.totalPrice)}</strong>`:""}</span>`;
    }else{
      const prices=[...group.components.values()].map(component=>{
        const presentation=state.packagePresentations.find(row=>String(row.package_id)===String(group.packageId)&&String(row.composition_id)===String(component.member.row.composition_id));
        return `${escapeHtml(presentation?.display_name||component.member.component.name)} ${currency(Math.max(0,Number(component.member.component.price||0)))}`;
      });
      if(prices.length)priceMarkup=`<span class="sellable-price-highlight">Preços: <strong>${prices.join(" · ")}</strong></span>`;
    }
    notice.innerHTML=`<span>No seu carrinho, você tem direito a ${entitled} ${categoryName}. Você já escolheu ${chosen}; ainda pode escolher ${group.freeRemaining}.</span>${priceMarkup}`;
  });
}

function saveCartGroupAdjustments() {
  try { localStorage.setItem(CART_GROUP_ADJUSTMENTS_KEY, JSON.stringify(state.cartGroupAdjustments)); } catch (_) {}
}

function adjustSellableGroup(packageId, componentId, delta) {
  const group = getSellableGroupTotals({ includePackageIds:[packageId] }).find(entry => entry.packageId === String(packageId));
  const component = group?.components.get(String(componentId));
  if (!component) return;
  const next = Math.max(0, Math.min(component.maxQuantity, component.quantity + Number(delta || 0)));
  state.cartGroupAdjustments[String(packageId)] ||= {};
  state.cartGroupAdjustments[String(packageId)][String(componentId)] = next - component.baseline;
  saveCartGroupAdjustments();
  renderCart();
  updateSellableCategoryControls();
}

function updateSellableCategoryControls() {
  const packageIds = [...document.querySelectorAll(".sellable-component-card[data-package-id]")].map(card => card.dataset.packageId);
  const groups = new Map(getSellableGroupTotals({ includePackageIds:packageIds }).map(group => [String(group.packageId), group]));
  document.querySelectorAll(".sellable-component-card[data-package-id][data-component-id]").forEach(card => {
    const component = groups.get(card.dataset.packageId)?.components.get(card.dataset.componentId);
    if (!component) return;
    const value = card.querySelector("[data-sellable-quantity]");
    const minus = card.querySelector('[data-sellable-step="-1"]');
    const plus = card.querySelector('[data-sellable-step="1"]');
    if (value) value.textContent = String(component.quantity);
    if (minus) minus.disabled = component.quantity <= 0;
    if (plus) plus.disabled = component.quantity >= component.maxQuantity;
  });
}

function buildSellableGroupOrderPayload() {
  return getSellableGroupTotals().map(group => ({
    package_id: group.packageId,
    name: String(group.pack.name || ""),
    customer_name: packageCustomerName(group.pack),
    franchise_mode: group.pack.franchise_mode || "none",
    allowance: Math.max(0, Math.trunc(group.allowance || 0)),
    components: [...group.components.entries()].map(([compositionId, component]) => ({
      composition_id: compositionId,
      quantity: Math.max(0, Math.trunc(component.quantity)),
      automatic_quantity: Math.max(0, Math.trunc(component.baseline)),
      manual_adjustment: Math.trunc(component.adjustment),
      allowance: Math.max(0, Math.trunc(component.allowance || 0))
    }))
  }));
}

function buildOrderPackageState(entry) {
  const result = { ...(entry.packageState || {}) };
  for (const group of getItemPackageGroups(entry.id).filter(candidate => candidate.pack.is_sellable === true)) {
    const values = {};
    group.members.forEach(member => { values[String(member.row.composition_id)] = Math.max(0, Number(member.config.default_quantity || 0)); });
    result[String(group.pack.id)] = values;
  }
  return result;
}

function buildEntryOptionsText(entry) {
  const associatedGroups=getItemPackageGroups(entry.id),groups=associatedGroups.filter(group=>group.pack.is_sellable!==true),labels=[];
  if(groups.length){
    const previous=String(entry.optionsText||"").split("|").map(value=>value.trim()).filter(Boolean);
    for(const group of groups){
      const packageId=String(group.pack.id),values=entry.packageState?.[packageId]||getPackageDefaults(group);
      const isFallback=group.pack.kind==="decay"||group.pack.availability_rule==="one_available_with_priority_fallback"||group.pack.kind==="single_required";
      if(isFallback){
        const selected=group.members.find(member=>Number(values[member.row.composition_id])>0);
        const standard=group.members.find(member=>Number(member.config.default_quantity)>0);
        if(selected&&standard&&selected!==standard){
          const auto=previous.find(text=>text.startsWith("Decaimento automático:")&&text.includes(standard.component.name)&&text.includes(selected.component.name));
          labels.push(auto||`Substituir ${standard.component.name} por ${selected.component.name}`);
        }
        continue;
      }
      for(const member of group.members){
        const key=String(member.row.composition_id),standard=Math.max(0,Number(member.config.default_quantity)||0),selected=Math.max(0,Number(values[key]??standard)||0),difference=selected-standard;
        if(!difference)continue;
        labels.push(difference>0?`Adicionar ${difference>1?`${difference}x `:""}${member.component.name}`:`Remover ${-difference>1?`${-difference}x `:""}${member.component.name}`);
      }
    }
    return labels.length?labels.join(" | "):previous.join(" | ");
  }
  if(associatedGroups.length)return "";
  for(const association of state.associations.filter(row=>String(row.owner_id)===String(entry.id))){
    const component=state.compMap[association.composition_id];if(!component)continue;
    const standard=Math.max(0,Number(association.link_value)||0),selected=Math.max(0,Number(entry.modState?.[association.id]??standard)||0),difference=selected-standard;
    if(!difference)continue;
    labels.push(difference>0?`Adicionar ${difference>1?`${difference}x `:""}${component.name}`:`Remover ${-difference>1?`${-difference}x `:""}${component.name}`);
  }
  return labels.join(" | ");
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
  if(entry.replayNeedsReview)return true;
  if (!availabilityMap) {
    return false;
  }
  const stock = availabilityMap.get(entry.id);
  return !Number.isFinite(stock) || stock <= 0;
}

function persistCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    localStorage.setItem(CART_NOTE_STORAGE_KEY, String(ui.cartNote?.value || ""));
  } catch (_) {
    // Ignora falhas de armazenamento local (ex.: modo privado).
  }
}

function restoreCart() {
  try {
    if (ui.cartNote) ui.cartNote.value = localStorage.getItem(CART_NOTE_STORAGE_KEY) || "";
    const pooled = JSON.parse(localStorage.getItem(CART_GROUP_ADJUSTMENTS_KEY) || "{}");
    state.cartGroupAdjustments = pooled && typeof pooled === "object" ? pooled : {};
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
        packageState: entry.packageState && typeof entry.packageState === "object" ? entry.packageState : {},
        qty: Math.max(1, Number(entry.qty || 1))
      }))
      .filter((entry) => entry.id !== null && entry.id !== undefined);
  } catch (_) {
    state.cart = [];
  }
}


function savePhotoState() {
  const map = new Map();
  document.querySelectorAll(".item-photo.rotating-photo[data-item-id]").forEach((img) => {
    map.set(img.dataset.itemId, Number(img.dataset.currentIndex || 0));
  });
  return map;
}

function restorePhotoState(savedMap) {
  if (!savedMap || !savedMap.size) return;
  document.querySelectorAll(".item-photo.rotating-photo[data-item-id]").forEach((img) => {
    const saved = savedMap.get(img.dataset.itemId);
    if (saved == null) return;
    const photos = JSON.parse(img.dataset.photos || "[]");
    const index = saved < photos.length ? saved : 0;
    img.src = photos[index];
    img.dataset.currentIndex = String(index);
  });
}

function renderCart() {
  const { count, total } = getCartTotals();
  const availabilityMap = getCurrentAvailabilityMap();
  const sellableGroups=getSellableGroupTotals();
  updateSellableEntitlementNotices(sellableGroups);
  const hasUnavailable = state.cart.some((entry) => isCartEntryUnavailable(entry, availabilityMap))
    || sellableGroups.some(group=>[...group.components.values()].some(component=>component.quantity>component.maxQuantity));

  ui.cartTotal.textContent = currency(total);
  if(ui.cartNotice){ui.cartNotice.hidden=!state.cartNotice;ui.cartNotice.textContent=state.cartNotice||"";ui.cartNotice.classList.toggle("has-unavailable",state.cartNoticeIsError===true)}
  ui.cartFabCount.textContent = `${count} ${count === 1 ? "item" : "itens"}`;
  ui.cartFabTotal.textContent = currency(total);
  ui.checkoutBtn.disabled = count === 0 || hasUnavailable;
  ui.appCheckoutBtn.disabled = count === 0 || hasUnavailable;
  ui.appCheckoutBtn.textContent = state.user ? "Fazer pedido" : "Entrar para fazer o pedido";
  ui.removeUnavailableBtn.hidden = !hasUnavailable;

  if (count === 0) {
    ui.cartFab.classList.remove("show");
    ui.cartList.innerHTML = '<div class="cart-empty">Seu carrinho está vazio.</div>';
    ui.checkoutBtn.querySelector("[data-checkout-label]").textContent = "Finalizar no WhatsApp";
    ui.appCheckoutBtn.disabled = true;
    ui.removeUnavailableBtn.hidden = true;
    persistCart();
    return;
  }

  ui.cartFab.classList.add("show");
  ui.checkoutBtn.querySelector("[data-checkout-label]").textContent = hasUnavailable ? "Remova itens indisponíveis" : "Finalizar no WhatsApp";
  const itemMarkup = state.cart
    .map((entry, index) => {
      const item=state.items.find(candidate=>String(candidate.id)===String(entry.id)),photo=item?safeImageUrl(getItemPhotos(item)[0]||""):"";
      const options=buildEntryOptionsText(entry);
      return `
      <article class="cart-item${isCartEntryUnavailable(entry, availabilityMap) ? " unavailable" : ""}${photo?" has-photo":""}">
        ${photo?`<img class="cart-item-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(entry.name)}" loading="lazy">`:""}
        <div class="cart-item-content">
        <div class="cart-item-top">
          <h4 class="cart-item-title">${escapeHtml(entry.name)}</h4>
          <div class="cart-item-actions">
            <button type="button" class="ghost-btn" data-cart-edit="${index}">Editar</button>
            <button type="button" class="ghost-btn" data-cart-remove="${index}">Remover</button>
          </div>
        </div>
        ${options ? `<p class="cart-item-options"><strong>Alterações:</strong> ${escapeHtml(options)}</p>` : ""}
        ${entry.note ? `<p class="cart-item-note"><strong>Observação:</strong> ${escapeHtml(entry.note)}</p>` : ""}
        ${isCartEntryUnavailable(entry, availabilityMap) ? `<p class="cart-item-warning">${entry.replayNeedsReview?"Revise as opções: algum componente do pedido anterior está indisponível.":"Este item ficou indisponível e precisa ser removido do carrinho."}</p>` : ""}
        <div class="cart-item-bottom">
          <div class="qty-wrap">
            <button type="button" class="qty-btn" data-cart-delta="-1" data-cart-index="${index}">-</button>
            <span class="qty-val">${entry.qty}</span>
            <button type="button" class="qty-btn" data-cart-delta="1" data-cart-index="${index}">+</button>
          </div>
          <span class="cart-item-price">${currency(Number(entry.price || 0) * entry.qty)}</span>
        </div>
        </div>
      </article>
    `})
    .join("");
  const pooledMarkup = sellableGroups.map(group => {
    const components = [...group.components.entries()].map(([componentId, component]) => {const presentation=state.packagePresentations.find(row=>String(row.package_id)===String(group.packageId)&&String(row.composition_id)===String(componentId)),title=presentation?.display_name||component.member.component.name,photo=safeImageUrl(presentation?.photo_url_1||"");return `
      <div class="cart-pooled-component"><div class="cart-pooled-component-identity">${photo?`<img src="${photo}" alt="" loading="lazy">`:""}<div><strong>${escapeHtml(title)}</strong>${presentation?.description?`<small>${escapeHtml(presentation.description)}</small>`:""}</div></div>
        <div class="qty-wrap"><button type="button" class="qty-btn" data-pool-step="-1" data-package-id="${escapeHtml(group.packageId)}" data-component-id="${escapeHtml(componentId)}" aria-label="Remover ${escapeHtml(title)}" ${component.quantity<=0?"disabled":""}>−</button><span class="qty-val">${component.quantity}</span><button type="button" class="qty-btn" data-pool-step="1" data-package-id="${escapeHtml(group.packageId)}" data-component-id="${escapeHtml(componentId)}" aria-label="Adicionar ${escapeHtml(title)}" title="${component.maxQuantity<=component.quantity&&component.member.component.tracks_stock!==false?"Limite de estoque atingido":"Adicionar"}" ${component.quantity>=component.maxQuantity?"disabled":""}>+</button></div>
      </div>`}).join("");
    const category=state.categories.find(entry=>String(entry.component_package_id||"")===String(group.packageId)),categoryName=category?.name||packageCustomerName(group.pack),entitled=group.pack.franchise_mode==="shared"?group.allowance:[...group.components.values()].reduce((sum,component)=>sum+component.allowance,0),allowance = `<p class="item-desc">No seu carrinho, você tem direito a ${entitled} ${escapeHtml(categoryName)}. Você já escolheu ${[...group.components.values()].reduce((sum,component)=>sum+component.quantity,0)}; ainda pode escolher ${group.freeRemaining}.</p>`;
    const stockWarning=[...group.components.values()].some(component=>component.quantity>component.maxQuantity)?'<p class="cart-item-warning">A quantidade supera o estoque disponível.</p>':"";
    return `<section class="cart-item cart-sellable-group"><h4>${escapeHtml(categoryName)}</h4>${allowance}${stockWarning}${components}<strong>${currency(group.totalPrice)}</strong></section>`;
  }).join("");
  ui.cartList.innerHTML = itemMarkup + pooledMarkup;

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
      packageState: {},
      qty
    });
  }
  renderCart();
}

function buildEntrySignature(itemId, selectedState, note, unitPrice, packageState = {}) {
  const statePart = Object.entries(selectedState || {})
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  const packagePart = Object.keys(packageState || {}).sort().map(packageId => {
    const values = packageState[packageId] || {};
    return `${packageId}:${Object.keys(values).sort().map(componentId => `${componentId}=${values[componentId]}`).join(",")}`;
  }).join("|");
  return `${itemId}::${statePart}::${packagePart}::${String(note || "").trim()}::${Number(unitPrice || 0).toFixed(2)}`;
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

function openCheckoutConfirmation() {
  if (getCartTotals().count === 0) return;
  savePendingCheckoutSnapshot();
  ui.checkoutDeliveryInfo.innerHTML = [
    `<strong>${escapeHtml(state.profile?.known_as || "")}</strong>`,
    escapeHtml(state.profile?.phone || ""),
    escapeHtml([state.profile?.street, state.profile?.landmark, state.profile?.address_extra].filter(Boolean).join(" · "))
  ].filter(Boolean).join("<br>");
  const pooledConfirm=getSellableGroupTotals().filter(group=>[...group.components.values()].some(component=>component.quantity>0)).map(group=>{const category=state.categories.find(entry=>String(entry.component_package_id||"")===String(group.packageId)),categoryName=category?.name||packageCustomerName(group.pack),components=[...group.components.entries()].filter(([,component])=>component.quantity>0).map(([componentId,component])=>{const presentation=state.packagePresentations.find(row=>String(row.package_id)===String(group.packageId)&&String(row.composition_id)===String(componentId)),photo=safeImageUrl(presentation?.photo_url_1||"");return `${photo?`<img src="${photo}" alt="" loading="lazy">`:""}<small>${component.quantity}× ${escapeHtml(presentation?.display_name||component.member.component.name)}</small>`}).join("");return `<article class="order-confirm-item"><div><strong>${escapeHtml(categoryName)}</strong><div class="order-confirm-presentations">${components}</div><small>Você ainda pode escolher ${group.freeRemaining} ${escapeHtml(categoryName)}.</small></div><span>${currency(group.totalPrice)}</span></article>`}).join("");
  ui.checkoutConfirmItems.innerHTML = state.cart.map((entry) => `
    <article class="order-confirm-item">
      <div><strong>${Number(entry.qty)}× ${escapeHtml(entry.name)}</strong>
        ${buildEntryOptionsText(entry) ? `<small>${escapeHtml(buildEntryOptionsText(entry))}</small>` : ""}
        ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ""}
      </div><span>${currency(Number(entry.price || 0) * Number(entry.qty || 0))}</span>
    </article>
  `).join("") + pooledConfirm + (String(ui.cartNote.value || "").trim()
    ? `<p class="customer-order-notes">${escapeHtml(String(ui.cartNote.value).trim())}</p>`
    : "");
  ui.checkoutConfirmTotal.textContent = currency(getCartTotals().total);
  ui.confirmAppOrderBtn.disabled = false;
  ui.confirmAppOrderBtn.textContent = "Confirmar pedido";
  ui.checkoutConfirmBackdrop.hidden = false;
  ui.checkoutConfirmBackdrop.classList.add("show");
  lockPageScroll();
}

function closeCheckoutConfirmation() {
  ui.checkoutConfirmBackdrop.classList.remove("show");
  ui.checkoutConfirmBackdrop.hidden = true;
  unlockPageScroll();
}

async function startAppCheckout() {
  if (!state.cart.length) return;
  await refreshDataNow({ showError: false });
  syncCartWithCurrentCatalog();
  const availability = getCurrentAvailabilityMap();
  if (state.cart.some((entry) => isCartEntryUnavailable(entry, availability))) {
    setStatus("Remova os itens indisponíveis antes de continuar.", "err");
    renderCart();
    return;
  }
  const { data } = await db.auth.getSession();
  state.user = data?.session?.user || state.user;
  if (!state.user) {
    sessionStorage.setItem(APP_CHECKOUT_INTENT_KEY, "confirm");
    startCustomerLogin();
    return;
  }
  try { await loadCustomerProfile(); }
  catch (error) {
    console.error("Falha ao carregar perfil:", error);
    setStatus("Não foi possível carregar seu cadastro.", "err");
    return;
  }
  if (!hasCompleteOrderProfile()) {
    sessionStorage.setItem(APP_CHECKOUT_INTENT_KEY, "confirm");
    openAccountDialog();
    setStatus("Complete seu cadastro para fazer o pedido.", "err");
    return;
  }
  openCheckoutConfirmation();
}

function syncCartWithCurrentCatalog() {
  state.cart.forEach((entry) => {
    const item = state.items.find((candidate) => String(candidate.id) === String(entry.id));
    if (!item) return;
    const basePrice = Math.max(0, Number(item.price || 0));
    const packageGroups = getItemPackageGroups(item.id);
    let compositionPrice = 0;
    if (packageGroups.length) {
      for (const group of packageGroups) {
        if (group.pack.is_sellable === true) continue;
        const packageId = String(group.pack.id), saved = entry.packageState?.[packageId] || getPackageDefaults(group);
        compositionPrice += getPackageCompositionCharge(group, saved);
      }
    } else {
      compositionPrice = getLegacyCompositionCharge(item.id, entry.modState);
    }
    entry.name = item.name;
    entry.price = Math.max(0, basePrice + compositionPrice);
  });

  renderCart();
}

async function submitAppOrder() {
  if (state.user) {
    try { await loadCustomerProfile(); }
    catch (error) {
      console.error("Falha ao validar cadastro:", error);
      setStatus("Não foi possível validar seu cadastro.", "err");
      return;
    }
  }
  if (!state.user || !hasCompleteOrderProfile() || getCartTotals().count === 0) {
    if (state.user && !hasCompleteOrderProfile()) openAccountDialog();
    return;
  }
  ui.confirmAppOrderBtn.disabled = true;
  ui.confirmAppOrderBtn.textContent = "Enviando...";
  try {
    const payload = state.cart.map((entry) => ({
      item_id: String(entry.id),
      quantity: Number(entry.qty),
      notes: String(entry.note || ""),
      options_text: buildEntryOptionsText(entry),
      mod_state: entry.modState && typeof entry.modState === "object" ? entry.modState : {},
      package_state: buildOrderPackageState(entry)
    }));
    const { data: orderId, error } = await db.rpc("submit_app_order_priced", {
      p_items: payload,
      p_notes: String(ui.cartNote.value || "").trim() || null,
      p_payment_method: ui.orderPaymentMethod.value,
      p_group_totals: buildSellableGroupOrderPayload()
    });
    if (error) throw error;
    state.cart = [];
    state.cartGroupAdjustments = {};
    saveCartGroupAdjustments();
    ui.cartNote.value = "";
    sessionStorage.removeItem(APP_CHECKOUT_INTENT_KEY);
    sessionStorage.removeItem(APP_CHECKOUT_SNAPSHOT_KEY);
    persistCart();
    renderCart();
    closeCheckoutConfirmation();
    closeCart();
    setStatus("Pedido feito.", "ok");
    await openCustomerOrders(orderId,"tracking");
  } catch (error) {
    console.error("Falha ao enviar pedido:", error);
    setStatus(error.message || "Não foi possível enviar o pedido.", "err");
    ui.confirmAppOrderBtn.disabled = false;
    ui.confirmAppOrderBtn.textContent = "Confirmar pedido";
  }
}

async function openCustomerOrders(selectedId = null, destination = "orders") {
  if (!state.user) {
    startCustomerLogin();
    return;
  }
  state.selectedCustomerOrderId = selectedId;
  switchCustomerPage(destination);
  await loadCustomerOrders(selectedId);
  if (state.customerOrdersPollingTimer) clearInterval(state.customerOrdersPollingTimer);
  state.customerOrdersPollingTimer = window.setInterval(() => {
    if (["orders", "tracking"].includes(state.customerPage)) {
      loadCustomerOrders(state.selectedCustomerOrderId).catch((error) => console.error("Falha ao atualizar pedidos:", error));
    }
  }, 20000);
}

async function loadCustomerOrders(selectedId = null) {
  if (!state.user) return;
  let response = await db.from("orders")
    .select("id, status, created_at, customer_known_as, phone, delivery_address, notes, payment_method, subtotal, total, order_items(id, catalog_item_id, item_name, unit_price, quantity, notes, snapshot, order_item_components(id, composition_id, component_name, quantity, free_quantity, charged_quantity, unit_price)), order_sellable_component_totals(id, package_id, composition_id, group_name, customer_name, component_name, quantity, automatic_quantity, manual_adjustment, charged_quantity, unit_price, snapshot), order_status_history(id, from_status, to_status, created_at)")
    .eq("customer_id", state.user.id)
    .order("created_at", { ascending: false });
  if (response.error && /order_sellable_component_totals|relationship|schema cache/i.test(response.error.message || "")) response = await db.from("orders")
    .select("id, status, created_at, customer_known_as, phone, delivery_address, notes, payment_method, subtotal, total, order_items(id, catalog_item_id, item_name, unit_price, quantity, notes, snapshot, order_item_components(id, composition_id, component_name, quantity, free_quantity, charged_quantity, unit_price)), order_status_history(id, from_status, to_status, created_at)")
    .eq("customer_id", state.user.id)
    .order("created_at", { ascending: false });
  const { data, error } = response;
  if (error) {
    console.error("Falha ao carregar pedidos:", error);
    ui.customerOrderList.innerHTML = '<p>Não foi possível carregar seus pedidos.</p>';
    return;
  }
  state.customerOrders = data || [];
  renderCustomerOrders();
  renderActiveCustomerOrders();
}

function renderCustomerOrders() {
  if (!state.customerOrders.length) {
    ui.customerOrderList.innerHTML = '<p class="customer-orders-empty">Nenhum pedido.</p>';
    return;
  }
  ui.customerOrderList.innerHTML = state.customerOrders.map((order) => {
    const status = order.status === "cancelled"
      ? "Pedido cancelado"
      : (ORDER_STAGES.find((stage) => stage.key === order.status)?.label || "Pedido");
    const itemNames = [...(order.order_items || []).map((item) => `${Number(item.quantity)}× ${escapeHtml(item.item_name)}`), ...(order.order_sellable_component_totals||[]).filter(row=>Number(row.quantity)>0).map(row=>`${Number(row.quantity)}× ${escapeHtml(row.component_name)}`)].join(" · ");
    return `<article class="customer-order-card" data-history-order="${escapeHtml(order.id)}">
      <div><strong>${new Date(order.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</strong>
        <span class="customer-order-status">${escapeHtml(status)}</span><small>${itemNames}</small>
      </div><strong>${currency(order.total)}</strong>
      <div class="customer-order-actions"><button type="button" class="ghost-btn" data-customer-order="${escapeHtml(order.id)}">${["pending_confirmation","received","confirmed","production","delivery"].includes(order.status)?"Acompanhar":"Ver detalhes"}</button><button type="button" class="ghost-btn" data-repeat-order="${escapeHtml(order.id)}">Repetir pedido</button></div>
    </article>`;
  }).join("");
}

function renderActiveCustomerOrders() {
  const active=state.customerOrders.filter(order=>["pending_confirmation","received","confirmed","production","delivery"].includes(order.status));
  if(!active.length){ui.activeCustomerOrders.innerHTML='<p class="customer-orders-empty">Nenhum pedido em andamento.</p>';return}
  ui.activeCustomerOrders.innerHTML=active.map(order=>{
    const stageIndex=ORDER_STAGES.findIndex(stage=>stage.key===order.status),history=[...(order.order_status_history||[])].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));
    const timeline=ORDER_STAGES.slice(0,5).map((stage,index)=>{const event=history.find(entry=>entry.to_status===stage.key),cls=index<stageIndex?"is-complete":index===stageIndex?"is-current":"",time=event?`<time>${new Date(event.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</time>`:"";return `<li class="order-stage ${cls}"><span class="order-stage-dot"></span><div><strong>${stage.label}</strong>${time}</div></li>`}).join("");
    const itemNames=(order.order_items||[]).map(item=>`${Number(item.quantity)}× ${escapeHtml(item.item_name)}`).join(" · ");
    return `<article class="active-order-card ${String(state.selectedCustomerOrderId)===String(order.id)?"is-selected":""}"><div class="active-order-head"><strong>${escapeHtml(order.customer_known_as||state.profile?.known_as||"Pedido")}</strong><span>${new Date(order.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</span><strong>${currency(order.total)}</strong></div><p>${itemNames}</p><ol class="order-timeline">${timeline}</ol><button type="button" class="ghost-btn" data-order-detail="${escapeHtml(order.id)}">Detalhes</button></article>`;
  }).join("");
}

function showCustomerOrderDetail(order) {
  state.selectedCustomerOrderId = order.id;
  document.getElementById("customerOrderDetailTitle").textContent=`Pedido · ${new Date(order.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}`;
  const stages = order.status === "cancelled"
    ? [...ORDER_STAGES, { key: "cancelled", label: "Pedido cancelado" }]
    : ORDER_STAGES;
  const stageIndex = stages.findIndex((stage) => stage.key === order.status);
  const history = [...(order.order_status_history || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const timeline = stages.map((stage, index) => {
    const event = history.find((entry) => entry.to_status === stage.key);
    const cls = index < stageIndex ? "is-complete" : (index === stageIndex ? "is-current" : "");
    const time = event ? `<time>${new Date(event.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>` : "";
    return `<li class="order-stage ${cls}"><span class="order-stage-dot"></span><div><strong>${stage.label}</strong>${time}</div></li>`;
  }).join("");
  const items = (order.order_items || []).map((item) => {
    const components = (item.order_item_components || []).filter((component) => Number(component.quantity) > 0)
      .map((component) => `${escapeHtml(component.component_name)}${Number(component.quantity) > 1 ? ` ×${Number(component.quantity)}` : ""}`).join(" · ");
    return `<article class="customer-order-line"><div><strong>${Number(item.quantity)}× ${escapeHtml(item.item_name)}</strong>${components ? `<small>${components}</small>` : ""}${item.notes ? `<small>${escapeHtml(item.notes)}</small>` : ""}</div><span>${currency(Number(item.unit_price) * Number(item.quantity))}</span></article>`;
  }).join("");
  const pooled = (order.order_sellable_component_totals || []).filter(component => Number(component.quantity) > 0).map(component => {const photo=safeImageUrl(component.snapshot?.representation?.photo_url_1||"");return `<article class="customer-order-line customer-component-order-line">${photo?`<img src="${photo}" alt="" loading="lazy">`:""}<div><strong>${escapeHtml(component.component_name)}</strong><small>${Number(component.quantity)}×${Number(component.manual_adjustment) ? ` · ajuste manual ${Number(component.manual_adjustment) > 0 ? "+" : ""}${Number(component.manual_adjustment)}` : ""}${component.snapshot?.representation?.description?` · ${escapeHtml(component.snapshot.representation.description)}`:""}</small></div><span>${currency(Number(component.charged_quantity || 0) * Number(component.unit_price || 0))}</span></article>`}).join("");
  ui.customerOrderDetail.innerHTML = `<div class="order-tracking-head"><strong>${escapeHtml(order.customer_known_as || state.profile?.known_as || "Pedido")}</strong><span>${new Date(order.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</span></div>
    <ol class="order-timeline">${timeline}</ol><div class="customer-order-lines">${items}${pooled}</div>
    ${order.notes ? `<p class="customer-order-notes">${escapeHtml(order.notes)}</p>` : ""}
    <div class="order-confirm-total"><span>${order.payment_method === "at_delivery" ? "Pessoalmente na entrega" : "Pix"}</span><strong>${currency(order.total)}</strong></div>`;
  ui.customerOrderDetailBackdrop.hidden=false;
  ui.customerOrderDetailBackdrop.classList.add("show");
  lockPageScroll();
}

function closeCustomerOrderDetail(){ui.customerOrderDetailBackdrop.classList.remove("show");ui.customerOrderDetailBackdrop.hidden=true;unlockPageScroll()}

function repeatCustomerOrder(orderId){
  const order=state.customerOrders.find(entry=>String(entry.id)===String(orderId));if(!order)return;
  const availability=getCurrentAvailabilityMap(),missing=[],added=[];
  for(const line of order.order_items||[]){
    const item=state.items.find(entry=>String(entry.id)===String(line.catalog_item_id))||state.items.find(entry=>entry.name?.trim().toLocaleLowerCase()===String(line.item_name||"").trim().toLocaleLowerCase());
    if(!item||isCartEntryUnavailable({id:item.id},availability)){missing.push(line.item_name);continue}
    const unavailableOptions=(line.order_item_components||[]).filter(component=>Number(component.quantity)>0).filter(component=>{const current=state.compMap[component.composition_id];return !current||current.is_active===false||(current.tracks_stock!==false&&Number(current.stock)<Number(component.quantity))});
    unavailableOptions.forEach(component=>missing.push(component.component_name));
    const snapshot=line.snapshot||{},modState=snapshot.mod_state||{},packageState=snapshot.package_state||{},note=String(line.notes||""),signature=buildEntrySignature(item.id,modState,note,line.unit_price,packageState),existing=state.cart.find(entry=>entry.signature===signature);
    if(existing){existing.qty+=Number(line.quantity)||1;existing.replayNeedsReview=unavailableOptions.length>0||existing.replayNeedsReview===true}
    else state.cart.push({id:item.id,signature,name:item.name,price:Number(line.unit_price)||0,optionsText:String(snapshot.options_text||""),note,modState,packageState,qty:Number(line.quantity)||1,replayNeedsReview:unavailableOptions.length>0});
    added.push(line.item_name);
  }
  for(const row of order.order_sellable_component_totals||[]){const packageId=String(row.package_id||row.snapshot?.package_id||"");if(!packageId)continue;const componentId=String(row.composition_id||row.snapshot?.composition_id||"");if(!componentId||!state.compMap[componentId]||state.compMap[componentId].is_active===false){missing.push(row.component_name);continue}state.cartGroupAdjustments[packageId]||={};state.cartGroupAdjustments[packageId][componentId]=Number(state.cartGroupAdjustments[packageId][componentId]||0)+Number(row.manual_adjustment||0)}
  if(order.notes)ui.cartNote.value=[String(ui.cartNote.value||"").trim(),String(order.notes).trim()].filter(Boolean).join("\n");
  state.cartNotice=missing.length?`Indisponíveis neste momento: ${missing.join(", ")}. Confira o carrinho antes de finalizar.`:added.length?"Pedido carregado para revisão.":"Não foi possível recuperar os itens deste pedido.";state.cartNoticeIsError=missing.length>0;
  saveCartGroupAdjustments();renderCart();switchCustomerPage("catalog");openCart();
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

function buildOrderMessage() {
  const { count, total } = getCartTotals();
  if (count === 0) {
    return null;
  }

  const availabilityMap = getCurrentAvailabilityMap();
  const hasUnavailable = state.cart.some((entry) => isCartEntryUnavailable(entry, availabilityMap))
    || getSellableGroupTotals().some(group=>[...group.components.values()].some(component=>component.quantity>component.maxQuantity));
  if (hasUnavailable) {
    return null;
  }

  const sep = "_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _";
  const lines = [sep, `Pedido - ${state.setup?.name || "Restaurante"}`, sep];

  state.cart.forEach((entry) => {
    lines.push(`• ${entry.qty}x ${entry.name} - ${currency(entry.qty * entry.price)}`);

    const optionsText=buildEntryOptionsText(entry);
    if (optionsText) {
      const mods = optionsText
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

  getSellableGroupTotals().forEach(group => {
    if (![...group.components.values()].some(component=>component.quantity>0)) return;
    const category=state.categories.find(entry=>String(entry.component_package_id||"")===String(group.packageId)),categoryName=category?.name||packageCustomerName(group.pack);
    lines.push(`• ${categoryName}:`);
    for (const [componentId,component] of group.components) {
      const presentation=state.packagePresentations.find(row=>String(row.package_id)===String(group.packageId)&&String(row.composition_id)===String(componentId));
      if (component.quantity > 0) lines.push(`  ${component.quantity}x ${presentation?.display_name||component.member.component.name}`);
    }
    if (group.pack.franchise_mode !== "none") lines.push(`  Você ainda pode escolher ${group.freeRemaining} ${categoryName}.`);
    if (group.totalPrice > 0) lines.push(`  Adicionais: ${currency(group.totalPrice)}`);
    lines.push("");
  });

  const note = String(ui.cartNote?.value || "").trim();
  if (note) {
    lines.push(`Obs.: ${note}`, "");
  }

  lines.push(sep, `Total: ${currency(total)}`, sep);

  return lines.join("\n");
}

function copyOrderMessage() {
  const message = buildOrderMessage();
  if (!message) {
    alert("Carrinho vazio ou com itens indisponíveis.");
    return;
  }

  navigator.clipboard.writeText(message).then(() => {
    ui.copyMessageBtn.textContent = "Mensagem copiada!";
    setTimeout(() => {
      ui.copyMessageBtn.textContent = "Copiar mensagem";
    }, 2000);
  }).catch(() => {
    alert("Erro ao copiar mensagem. Tente novamente.");
  });
}

async function checkoutWhatsApp() {
  try {
    await refreshDataNow({ showError: false });
  } catch (_) {
    // Continua mesmo se o refresh falhar
  }

  const message = buildOrderMessage();
  if (!message) {
    const { count, total } = getCartTotals();
    if (count === 0) {
      return;
    }
    const availabilityMap = getCurrentAvailabilityMap();
    const hasUnavailable = state.cart.some((entry) => isCartEntryUnavailable(entry, availabilityMap))
      || getSellableGroupTotals().some(group=>[...group.components.values()].some(component=>component.quantity>component.maxQuantity));
    if (hasUnavailable) {
      alert("Existem itens indisponíveis no carrinho. Remova-os para finalizar o pedido.");
    }
    return;
  }

  const phoneRaw = String(state.setup?.phone || "").replace(/\D/g, "");
  if (!phoneRaw) {
    alert("Telefone do restaurante não configurado para finalizar.");
    return;
  }

  const text = encodeURIComponent(message);
  const url = `https://wa.me/${phoneRaw}?text=${text}`;

  // Tenta abrir em nova aba
  const newWindow = window.open(url, "_blank");
  
  // Se não conseguiu abrir em nova aba (popup bloqueado), navega na mesma aba
  if (!newWindow) {
    window.location.href = url;
  }
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

function getCompositionStock(item) {
  if (item.stock_mode !== "composition") return Math.max(0, Number(item.stock || 0));

  const linkedPackages = state.itemPackages
    .filter((link) => String(link.item_id) === String(item.id))
    .map((link) => ({
      link,
      pack: state.ingredientPackages.find((pack) => String(pack.id) === String(link.package_id))
    }))
    .filter((entry) => entry.pack && entry.pack.is_active !== false);

  // Preserve o saldo legado enquanto um item ainda não foi migrado para grupos.
  if (!linkedPackages.length) return Math.max(0, Number(item.stock || 0));

  const capacities = [];
  linkedPackages.forEach(({ link, pack }) => {
    if (pack.is_sellable === true) return;
    const rule = pack.availability_rule || "optional_warn_only";
    if (rule !== "all_positive_defaults_required" && rule !== "one_available_with_priority_fallback" && pack.kind !== "decay") return;

    const members = state.packageComponents
      .filter((row) => String(row.package_id) === String(pack.id))
      .map((row) => {
        const config = state.itemComponentConfigs.find((entry) =>
          String(entry.item_id) === String(item.id)
          && String(entry.package_id) === String(pack.id)
          && String(entry.composition_id) === String(row.composition_id)
        );
        const component = state.compMap[row.composition_id];
        return { row, config, component };
      })
      .filter(({ config }) => config?.is_enabled !== false)
      .sort((a, b) => Number(a.row.sort_priority || 0) - Number(b.row.sort_priority || 0));

    const componentCapacity = ({ config, component }, requireOne = false) => {
      if (!component || component.is_active === false) return 0;
      if (component?.tracks_stock === false) return Number.POSITIVE_INFINITY;
      const quantity = Math.max(0, Number(config?.default_quantity || 0));
      const perUnit = Math.max(0, Number(config?.consumption_per_unit ?? 1));
      if (perUnit <= 0) return Number.POSITIVE_INFINITY;
      const needed = (requireOne ? Math.max(1, quantity) : quantity) * perUnit;
      if (needed <= 0) return Number.POSITIVE_INFINITY;
      return Math.floor(Math.max(0, Number(component.stock || 0)) / needed);
    };

    if (rule === "all_positive_defaults_required") {
      const required = members.filter(({ config }) => Number(config?.default_quantity || 0) > 0);
      if (required.length) capacities.push(Math.min(...required.map(componentCapacity)));
      return;
    }

    // Fallback: um componente do grupo basta. O estoque disponível nas
    // alternativas, na prioridade definida pelo administrador, é somado.
    if (rule === "one_available_with_priority_fallback" || pack.kind === "decay") {
      const alternatives = members.map((member) => componentCapacity(member, true)).filter((value) => value > 0);
      capacities.push(alternatives.length ? alternatives.reduce((sum, value) => sum + value, 0) : 0);
    }
  });

  return capacities.length ? Math.max(0, Math.min(...capacities)) : Math.max(0, Number(item.stock || 0));
}

function sortItemsByPriority(rows) {
  return [...rows]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => sortPriorityValue(a.item) - sortPriorityValue(b.item) || a.index - b.index)
    .map(({ item }) => item);
}

function getVisibleItems(items, groups, groupAssocs) {
  const itemsInAnyGroup = new Set(groupAssocs.map((assoc) => assoc.item_id));
  const hasGroups = groups.length > 0;
  const activeSet = computeActiveItemIds(groups, groupAssocs);

  return items
    .map((item) => {
      const inGroup = hasGroups && itemsInAnyGroup.has(item.id);
      const groupInactive = inGroup && !activeSet.has(item.id);
      const effectiveStock = groupInactive ? 0 : getCompositionStock(item);
      return {
        ...item,
        __groupInactive: groupInactive,
        __effectiveStock: effectiveStock
      };
    })
    .filter((item) => item.is_active !== false && Number(item.stock ?? 0) >= 0 && item.__effectiveStock >= 0);
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

  // Remove duplicatas e limita a 3
  return [...new Set(ordered)].slice(0, 3);
}

function rotateCardPhotos() {
  const photos = [...document.querySelectorAll(".item-photo.rotating-photo")];

  photos.forEach((img) => {
    const options = JSON.parse(img.dataset.photos || "[]");
    if (options.length < 2) {
      return;
    }

    const currentIndex = Number(img.dataset.currentIndex || 0);
    const nextIndex = (currentIndex + 1) % options.length;

    img.classList.add("fade-switch");
    setTimeout(() => {
      img.src = options[nextIndex];
      img.dataset.currentIndex = String(nextIndex);
      img.classList.remove("fade-switch");
    }, 220);
  });
}

function startPhotoRotation() {
  const hasRotating = document.querySelector(".item-photo.rotating-photo[data-photos]");

  // Se não tem fotos rotativas, limpa e sai
  if (!hasRotating) {
    if (state.photoRotationTimer) {
      clearInterval(state.photoRotationTimer);
      state.photoRotationTimer = null;
    }
    return;
  }

  // Se já tem timer rodando, não reinicia
  if (state.photoRotationTimer) {
    return;
  }

  state.photoRotationTimer = setInterval(rotateCardPhotos, 10000);
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
  const packageGroups = getItemPackageGroups(itemId);
  if (packageGroups.length) {
    const seen = new Set();
    const names = [];
    const formatQty = value => Number.isInteger(value) ? String(value) : String(value).replace(".", ",");
    packageGroups.filter(group => group.pack.show_defaults_in_item !== false).forEach(group => group.members.forEach(member => {
      const quantity = Math.max(0, Number(member.config.default_quantity || 0));
      const componentId = String(member.component.id);
      const name = String(member.component.name || "").trim();
      if (!name || quantity <= 0 || seen.has(componentId)) return;
      seen.add(componentId);
      names.push(quantity > 1 ? `${formatQty(quantity)} x ${name}` : name);
    }));
    return names.join(" | ");
  }

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
  const stock = Number(item.__effectiveStock ?? item.stock ?? 0);
  const isInert = stock === 0;
  const isLowStock = stock > 0 && stock < 10;
  
  let badgeText = "";
  if (stock === 1) {
    badgeText = "Última unidade";
  } else if (stock > 1 && stock < 5) {
    badgeText = `Restam apenas ${stock} unidades`;
  } else if (stock >= 5 && stock < 10) {
    badgeText = "Quase acabando";
  }
  
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
  div.className = `item-card${isInert ? " inert" : ""}${hasPhoto ? "" : " no-photo"}${isLowStock ? " low-stock" : ""}`;
  div.dataset.search = normalize(`${item.name} ${description} ${compositionInline} ${compositionForSearch}`);

  const photoMarkup = hasPhoto
    ? `<img class="item-photo" src="${photo}" alt="${safeName}" loading="lazy">`
    : "";

  const priceBreakdown = getItemPriceBreakdown(item);
  div.innerHTML = `
    ${photoMarkup}
    <div>
      <h4 class="item-name">${safeName}</h4>
      ${isLowStock && badgeText ? `<div class="low-stock-badge">${badgeText}</div>` : ""}
      ${descWithComp ? `<p class="item-desc">${descWithComp}</p>` : ""}
      <div class="item-bottom">
        <span class="item-price">${currency(priceBreakdown.total)}</span>
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
    img.dataset.itemId = String(item.id);
  }

  return div;
}

function renderCategoryNav(roots, options = {}) {
  const { animateIntro = false } = options;
  ui.catNav.innerHTML = "";

  roots.forEach((root, index) => {
    const btn = document.createElement("button");
    btn.className = `cat-btn${index === 0 ? " active" : ""}`;
    if (animateIntro) {
      btn.classList.add("nav-reveal");
      btn.style.setProperty("--nav-index", String(index));
    }
    btn.textContent = root.name;

    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-btn").forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`cat-${root.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    ui.catNav.appendChild(btn);
  });
}

function setupMenuReveal(options = {}) {
  const { animateIntro = false } = options;

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

  const cards = [...ui.menu.querySelectorAll(".item-card")];
  cards.forEach((card, index) => {
    card.style.setProperty("--float-index", String(index % 10));
  });

  if (!animateIntro) {
    targets.forEach((el) => {
      el.classList.remove("reveal-item", "reveal-in", "visible-react");
      el.style.removeProperty("--reveal-index");
    });
    return;
  }

  targets.forEach((el, index) => {
    el.classList.add("reveal-item");
    el.classList.remove("reveal-in");
    el.style.setProperty("--reveal-index", String(index % 12));
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

function renderBranch(category, children, itemsByCategory, sellableByCategory, depth = 0, trail = []) {
  const section = document.createElement("section");
  section.className = depth === 0 ? "menu-section" : `sub-section depth-${depth}`;
  section.dataset.depth = String(depth);

  const ownItems = sortItemsByPriority(itemsByCategory.get(category.id) || []);
  const ownSellableGroups = sellableByCategory.get(String(category.id)) || [];
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

  if (ownItems.length > 0 || ownSellableGroups.length > 0) {
    const mode = (category.display_mode === "grade" || category.display_mode === "grid") ? "grade" : "lista";
    const grid = document.createElement("div");
    grid.className = mode === "grade" ? "items-grid" : "items-list";

    ownItems.forEach((item) => {
      grid.appendChild(createItemCard(item, mode));
    });
    ownSellableGroups.forEach(group => {
      group.members.forEach(member => {
        const card=document.createElement("article");
        const presentation=state.packagePresentations.find(row=>String(row.package_id)===String(group.pack.id)&&String(row.composition_id)===String(member.component.id));
        const title=presentation?.display_name||member.component.name,photo=safeImageUrl(presentation?.photo_url_1||"");
        card.className=`item-card sellable-component-card${photo?"":" no-photo"}`;
        card.dataset.search=normalize(`${title} ${presentation?.description||""} ${category.name}`);
        const current=group.totals.components.get(String(member.row.composition_id))||{quantity:0,maxQuantity:0};
        card.dataset.packageId=String(group.pack.id);
        card.dataset.componentId=String(member.row.composition_id);
        const unavailable=current.maxQuantity<=0;
        card.innerHTML=`${photo?`<img class="item-photo" src="${photo}" alt="${escapeHtml(title)}" loading="lazy">`:""}<div><h4 class="item-name">${escapeHtml(title)}</h4>${presentation?.description?`<p class="item-desc">${escapeHtml(presentation.description)}</p>`:""}${unavailable?'<small class="sellable-unavailable">Indisponível</small>':""}<div class="item-bottom"><span class="item-price">${currency(member.component.price)}</span><div class="sellable-card-quantity"><button type="button" class="qty-btn" data-sellable-step="-1" aria-label="Remover ${escapeHtml(title)}" ${current.quantity<=0?"disabled":""}>−</button><span class="qty-val" data-sellable-quantity>${current.quantity}</span><button type="button" class="qty-btn" data-sellable-step="1" aria-label="Adicionar ${escapeHtml(title)}" ${current.quantity>=current.maxQuantity?"disabled":""}>+</button></div></div></div>`;
        card.querySelectorAll("[data-sellable-step]").forEach(button=>button.addEventListener("click",event=>{event.stopPropagation();adjustSellableGroup(group.pack.id,member.row.composition_id,Number(button.dataset.sellableStep))}));
        grid.appendChild(card);
      });
    });

    const entitlementNotices=ownSellableGroups.map(group=>`<p class="sellable-entitlement" data-sellable-entitlement="${escapeHtml(group.pack.id)}" data-category-name="${escapeHtml(category.name)}"></p>`).join("");
    if(entitlementNotices)section.insertAdjacentHTML("beforeend",entitlementNotices);
    section.appendChild(grid);
  }

  descendants.forEach((child) => {
    const childNode = renderBranch(child, children, itemsByCategory, sellableByCategory, depth + 1, currentTrail);
    if (childNode) {
      section.appendChild(childNode);
    }
  });

  if (ownItems.length === 0 && ownSellableGroups.length === 0 && descendants.length === 0) {
    return null;
  }

  if (section.querySelectorAll(".item-card").length === 0) {
    return null;
  }

  return section;
}

function renderMenu(options = {}) {
  const { animateIntro = false } = options;
  const visibleItems = getVisibleItems(state.items, state.groups, state.groupAssociations);
  const { roots, children } = buildCategoryTree(state.categories);
  const sellableByCategory=new Map(),sellableTotals=new Map(getSellableGroupTotals({includePackageIds:state.categories.map(category=>category.component_package_id).filter(Boolean)}).map(group=>[String(group.packageId),group]));
  state.categories.filter(category=>category.component_package_id).forEach(category=>{
    const pack=state.ingredientPackages.find(entry=>String(entry.id)===String(category.component_package_id));if(!pack||pack.is_active===false||pack.is_sellable!==true)return;
    const members=state.packageComponents.filter(row=>String(row.package_id)===String(pack.id)).sort((a,b)=>Number(a.sort_priority||0)-Number(b.sort_priority||0)).map(row=>({row,component:state.compMap[row.composition_id],presentation:state.packagePresentations.find(presentation=>String(presentation.package_id)===String(pack.id)&&String(presentation.composition_id)===String(row.composition_id))})).filter(member=>member.component&&member.component.is_active!==false&&member.presentation?.is_active!==false);
    if(!members.length)return;const key=String(category.id);if(!sellableByCategory.has(key))sellableByCategory.set(key,[]);sellableByCategory.get(key).push({pack,members,category,totals:sellableTotals.get(String(pack.id))||{allowance:0,freeRemaining:0,components:new Map()}});
  });

  const itemsByCategory = new Map();
  visibleItems.forEach((item) => {
    const key = item.category_id || "__none__";
    if (!itemsByCategory.has(key)) {
      itemsByCategory.set(key, []);
    }
    itemsByCategory.get(key).push(item);
  });

  // ✅ Salvar estado das fotos antes de reconstruir
  const photoState = savePhotoState();

  ui.menu.innerHTML = "";

  roots.forEach((root) => {
    const rootNode = renderBranch(root, children, itemsByCategory, sellableByCategory, 0);
    if (!rootNode) return;
    rootNode.id = `cat-${root.id}`;
    ui.menu.appendChild(rootNode);
  });

  if (!ui.menu.children.length) {
    ui.menu.innerHTML = '<div class="empty">Nenhum item disponível no momento.</div>';
  }

  renderCategoryNav(roots.filter((root) => document.getElementById(`cat-${root.id}`)), { animateIntro });
  applySearch();

  // ✅ Restaurar estado das fotos depois de reconstruir
  restorePhotoState(photoState);

  startPhotoRotation();
  setupMenuReveal({ animateIntro });

  if (animateIntro) {
    scheduleVisibleReactLoop();
  } else if (state.visibleReactTimer) {
    clearTimeout(state.visibleReactTimer);
    state.visibleReactTimer = null;
  }
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

function getItemPackageGroups(itemId) {
  return state.itemPackages
    .filter(link => String(link.item_id) === String(itemId))
    .sort((a, b) => Number(a.sort_priority || 0) - Number(b.sort_priority || 0))
    .map(link => {
      const pack = state.ingredientPackages.find(entry => String(entry.id) === String(link.package_id));
      if (!pack || pack.is_active === false) return null;
      const members = state.packageComponents
        .filter(row => String(row.package_id) === String(pack.id))
        .sort((a, b) => Number(a.sort_priority || 0) - Number(b.sort_priority || 0))
        .map(row => ({
          row,
          component: state.compMap[row.composition_id],
          config: state.itemComponentConfigs.find(config =>
            String(config.item_id) === String(itemId)
            && String(config.package_id) === String(pack.id)
            && String(config.composition_id) === String(row.composition_id)
          ) || { default_quantity: 0, free_allowance: 0, max_quantity: 4, consumption_per_unit: 1, is_enabled: true }
        }))
        .filter(member => member.component && member.config.is_enabled !== false && member.component.is_active !== false);
      return { link, pack, members };
    })
    .filter(group => group && group.members.length);
}

function getPackageCompositionCharge(group, quantities = {}) {
  if (!group || group.pack?.is_sellable === true) return 0;
  const members = group.members || [];
  const quantityFor = member => Math.max(0, Number(quantities[String(member.row.composition_id)] ?? member.config.default_quantity ?? 0));
  if (group.pack?.franchise_mode === "shared") {
    const totalQuantity = members.reduce((sum, member) => sum + quantityFor(member), 0);
    const allowance = Math.max(0, Number(group.link?.shared_free_allowance || 0));
    const unitPrice = Math.max(0, Number(members[0]?.component.price || 0));
    return Math.max(0, totalQuantity - allowance) * unitPrice;
  }
  return members.reduce((sum, member) => {
    const quantity = quantityFor(member);
    const allowance = group.pack?.franchise_mode === "per_component" ? Math.max(0, Number(member.config.free_allowance || 0)) : 0;
    return sum + Math.max(0, quantity - allowance) * Math.max(0, Number(member.component.price || 0));
  }, 0);
}

function getPackageDefaults(group) {
  return Object.fromEntries((group?.members || []).map(member => [String(member.row.composition_id), Math.max(0, Number(member.config.default_quantity || 0))]));
}

function getLegacyCompositionCharge(itemId, selections = null) {
  return state.associations.filter(association => String(association.owner_id) === String(itemId)).reduce((sum, association) => {
    const component = state.compMap[association.composition_id];
    if (!component) return sum;
    const quantity = Math.max(0, Number(selections?.[association.id] ?? association.link_value ?? 0));
    return sum + quantity * Math.max(0, Number(component.price || 0));
  }, 0);
}

function getItemPriceBreakdown(item, packageState = null, modState = null) {
  const base = Math.max(0, Number(item?.price || 0));
  if (!item || item.stock_mode !== "composition") return { base, composition:0, total:base };
  const groups = getItemPackageGroups(item.id);
  let composition = 0;
  if (groups.length) {
    composition = groups.reduce((sum, group) => {
      if (group.pack.is_sellable === true) return sum;
      return sum + getPackageCompositionCharge(group, packageState?.[String(group.pack.id)] || getPackageDefaults(group));
    }, 0);
  } else {
    composition = getLegacyCompositionCharge(item.id, modState);
  }
  return { base, composition, total:base + composition };
}

function packageCustomerName(pack) {
  return String(pack?.customer_name || "").trim() || String(pack?.name || "").trim();
}

function packageQuantityLimit(pack) {
  if (pack?.kind === "adjustable") return 2;
  if (pack?.kind === "complementary" || pack?.kind === "single_required") return 1;
  return Number.POSITIVE_INFINITY;
}

function packageMemberAvailable(member, quantity = 1) {
  if (!member.component || member.component.is_active === false) return false;
  if (member.component.tracks_stock === false) return true;
  const perUnit = Math.max(1, Number(member.config.consumption_per_unit || 1));
  return Number(member.component.stock || 0) >= Math.max(1, Number(quantity || 1)) * perUnit;
}

function openPackageItemModal(item, options, groups) {
  groups = groups.filter(group => group.pack.is_sellable !== true);
  const editIndex = Number.isInteger(options.editIndex) ? options.editIndex : null;
  const cartEntry = editIndex !== null ? state.cart[editIndex] : null;
  state.modalQty = cartEntry?.qty || 1;
  const isUnavailable = Number(item.__effectiveStock ?? item.stock ?? 0) === 0;
  const photos = getItemPhotos(item), mainPhoto = safeImageUrl(photos[0] || "");
  const hasMainPhoto = Boolean(mainPhoto), safeName = escapeHtml(item.name);
  const description = String(item.description || "").trim(), safeDescription = escapeHtml(description);
  const packageState = {};
  const fallbackGroup = group => group.pack.kind === "decay" || group.pack.availability_rule === "one_available_with_priority_fallback" || group.pack.kind === "single_required";
  const automaticDecayChoices = {};

  for (const group of groups) {
    const packageId = String(group.pack.id), stored = cartEntry?.packageState?.[packageId] || {};
    packageState[packageId] = {};
    if (fallbackGroup(group)) {
      const saved = group.members.find(member => Number(stored[member.row.composition_id]) > 0 && packageMemberAvailable(member));
      const standard = group.members.find(member => Number(member.config.default_quantity) > 0 && packageMemberAvailable(member));
      const choice = saved || standard || group.members.find(member => packageMemberAvailable(member)) || null;
      if (!saved && choice && choice !== standard) automaticDecayChoices[packageId] = choice;
      group.members.forEach(member => { packageState[packageId][member.row.composition_id] = member === choice ? 1 : 0; });
      continue;
    }
    group.members.forEach(member => {
      const key = String(member.row.composition_id), standard = Math.max(0, Number(member.config.default_quantity || 0));
      const saved = Object.prototype.hasOwnProperty.call(stored, key) ? Number(stored[key]) : standard;
      const limit = Math.min(packageQuantityLimit(group.pack), Number(member.config.max_quantity ?? member.component.max_quantity ?? 4));
      packageState[packageId][key] = packageMemberAvailable(member, Math.max(saved, standard)) ? Math.min(limit, Math.max(0, saved)) : 0;
    });
  }

  const getSelection = () => {
    let extra = 0;
    const labels = [], selected = {};
    for (const group of groups) {
      const packageId = String(group.pack.id), values = packageState[packageId] || {};
      selected[packageId] = {};
      const fallback = fallbackGroup(group);
      const chosen = fallback ? group.members.find(member => Number(values[member.row.composition_id]) > 0) : null;
      const defaultMember = fallback ? group.members.find(member => Number(member.config.default_quantity) > 0) : null;
      if (fallback && chosen && defaultMember && chosen !== defaultMember) {
        const automatic = automaticDecayChoices[packageId] === chosen || (defaultMember && !packageMemberAvailable(defaultMember) && chosen !== defaultMember);
        const priority = Math.max(1, Number(chosen.row.sort_priority || 0) + 1);
        labels.push(automatic
          ? `Decaimento automático: ${defaultMember.component.name} indisponível; selecionado ${chosen.component.name} (prioridade ${priority})`
          : `Substituir ${defaultMember.component.name} por ${chosen.component.name}`);
      }
      if (fallback && !chosen) return { valid: false, message: `Escolha uma opção disponível em ${packageCustomerName(group.pack)}.` };
      for (const member of group.members) {
        const componentId = String(member.row.composition_id);
        const standard = Math.max(0, Number(member.config.default_quantity || 0));
        const max = Math.max(0, Math.min(packageQuantityLimit(group.pack), Number(member.config.max_quantity ?? member.component.max_quantity ?? 4)));
        const value = fallback ? (member === chosen ? 1 : 0) : Math.min(max, Math.max(0, Number(values[componentId] || 0)));
        values[componentId] = value;
        selected[packageId][componentId] = value;
        const free = Math.max(0, Number(member.config.free_allowance || 0));
        const paidDelta = Math.max(0, value - free) - Math.max(0, standard - free);
        if (fallback || value === standard) continue;
        const difference = value - standard;
        if (difference > 0) labels.push(`Adicionar ${difference > 1 ? `${difference}x ` : ""}${member.component.name}`);
        else labels.push(`Remover ${-difference > 1 ? `${-difference}x ` : ""}${member.component.name}`);
      }
      const selectedCount = Object.values(selected[packageId]).filter(value => Number(value) > 0).length;
      if (fallback && selectedCount !== 1) {
        return { valid: false, message: `Escolha exatamente uma opção em ${packageCustomerName(group.pack)}.` };
      }
      if (group.pack.min_selections != null && selectedCount < Number(group.pack.min_selections)) {
        return { valid: false, message: `Escolha pelo menos ${group.pack.min_selections} opção(ões) em ${packageCustomerName(group.pack)}.` };
      }
      if (group.pack.max_selections != null && selectedCount > Number(group.pack.max_selections)) {
        return { valid: false, message: `Escolha no máximo ${group.pack.max_selections} opção(ões) em ${packageCustomerName(group.pack)}.` };
      }
    }
    const defaultComposition = groups.reduce((sum, group) => sum + getPackageCompositionCharge(group, getPackageDefaults(group)), 0);
    const selectedComposition = groups.reduce((sum, group) => sum + getPackageCompositionCharge(group, selected[String(group.pack.id)] || getPackageDefaults(group)), 0);
    extra = selectedComposition - defaultComposition;
    return { valid: true, extra, optionsText: labels.join(" | "), packageState: selected };
  };

  const modalHead = hasMainPhoto
    ? `<div class="modal-head"><img class="modal-photo" src="${mainPhoto}" alt="${safeName}"><button class="modal-close" id="modalClose" aria-label="Fechar">X</button></div>`
    : `<div class="modal-head no-photo"><button class="modal-close" id="modalClose" aria-label="Fechar">X</button></div>`;
  const groupsMarkup = groups.map(group => {
    const packageId = String(group.pack.id), fallback = fallbackGroup(group);
    const minSelections = Math.max(0, Number(group.pack.min_selections || 0));
    const selectedCount = Object.values(packageState[packageId] || {}).filter(value => Number(value) > 0).length;
    const warning = group.pack.availability_rule === "optional_warn_only" && group.members.some(member => !packageMemberAvailable(member))
      ? `<small class="package-stock-warning">Algumas opções estão indisponíveis.</small>` : "";
    const rows = group.members.map(member => {
      const compositionId = String(member.row.composition_id), available = packageMemberAvailable(member);
      const value = Number(packageState[packageId][compositionId] || 0),
        standard = Number(member.config.default_quantity || 0),
        max = Math.min(packageQuantityLimit(group.pack), Number(member.config.max_quantity ?? member.component.max_quantity ?? 4), Number(member.component.max_quantity ?? 4), member.component.tracks_stock === false ? Number.POSITIVE_INFINITY : Math.floor(Number(member.component.stock || 0) / Math.max(1, Number(member.config.consumption_per_unit || 1))));
      const price = Number(member.component.price || 0) > 0 ? `<small>${currency(member.component.price)}</small>` : "";
      if (fallback) {
        const checked = value === 1;
        return `<label class="package-choice ${available ? "" : "is-unavailable"}"><input type="radio" name="package-${escapeHtml(packageId)}" data-package-action="choose" data-package-id="${escapeHtml(packageId)}" data-component-id="${escapeHtml(compositionId)}" ${checked ? "checked" : ""} ${available ? "" : "disabled"}><span><strong>${escapeHtml(member.component.name)}</strong>${price}${!available ? "<small>Indisponível</small>" : ""}</span></label>`;
      }
      const cannotRemoveLast = value <= 1 && selectedCount <= minSelections;
      return `<div class="comp-row package-component-choice ${available ? "" : "is-unavailable"}"><div><strong>${escapeHtml(member.component.name)}</strong>${price}${!available ? `<small>${group.pack.availability_rule === "optional_warn_only" ? "Indisponível" : "Sem estoque"}</small>` : ""}</div><div class="comp-actions"><div class="qty-wrap"><button type="button" class="qty-btn" data-package-action="step" data-step="-1" data-package-id="${escapeHtml(packageId)}" data-component-id="${escapeHtml(compositionId)}" ${value <= 0 || cannotRemoveLast ? "disabled" : ""}>−</button><span class="qty-val">${value}</span><button type="button" class="qty-btn" data-package-action="step" data-step="1" data-max="${max}" data-package-id="${escapeHtml(packageId)}" data-component-id="${escapeHtml(compositionId)}" ${!available ? "disabled" : ""}>+</button></div></div></div>`;
    }).join("");
    return `<section class="package-customer-group"><h4>${escapeHtml(packageCustomerName(group.pack))}${minSelections > 0 ? `<small class="package-minimum">Mínimo ${minSelections}</small>` : ""}</h4>${warning}${rows}</section>`;
  }).join("");

  const itemPriceBreakdown = getItemPriceBreakdown(item);
  ui.modalBody.innerHTML = `<article class="modal" role="dialog" aria-modal="true" aria-label="Detalhes do item"><div class="modal-scroll mod-scroll-enabled">${modalHead}<div class="modal-content"><h3 class="modal-title">${safeName}</h3><p class="modal-price" id="modalDynamicPrice">${currency(itemPriceBreakdown.total)}</p>${description ? `<p class="modal-text">${safeDescription}</p>` : ""}${isUnavailable ? '<p class="item-stock">Item indisponível no momento.</p>' : ""}<div class="comp-wrap"><div class="comp-body show" id="compBody"><div id="compInteractive">${groupsMarkup}</div></div></div><div class="obs-section"><div class="obs-title">Observação do item</div><textarea id="modalNote" class="modal-note" rows="3" placeholder="Observação (opcional)">${escapeHtml(cartEntry?.note || "")}</textarea></div></div></div>${!isUnavailable ? `<div class="modal-footer"><div class="modal-actions"><div class="qty-wrap"><button type="button" class="qty-btn" id="modalQtyMinus">-</button><span class="qty-val" id="modalQtyVal">1</span><button type="button" class="qty-btn" id="modalQtyPlus">+</button></div><button type="button" class="ghost-btn" id="modalViewCartBtn">Ver carrinho</button><button type="button" class="add-btn" id="modalAddBtn">${editIndex !== null ? "Salvar alterações" : "Adicionar ao carrinho"}</button></div></div>` : ""}</article>`;
  ui.modal.classList.add("show");lockPageScroll();
  document.getElementById("modalClose")?.addEventListener("click", closeModal);
  const compInteractive=document.getElementById("compInteractive"),dynamicPrice=document.getElementById("modalDynamicPrice");
  const refreshPackagePrice=()=>{const selection=getSelection();if(dynamicPrice&&selection.valid)dynamicPrice.textContent=currency(Math.max(0,itemPriceBreakdown.total+selection.extra));};
  compInteractive?.addEventListener("change",event=>{
    const input=event.target.closest('[data-package-action="choose"]');if(!input||!input.checked)return;
    const packageId=input.dataset.packageId,componentId=input.dataset.componentId;
    for(const group of groups){if(String(group.pack.id)!==packageId)continue;for(const member of group.members)packageState[packageId][String(member.row.composition_id)]=String(member.row.composition_id)===componentId?1:0;}
    refreshPackagePrice();
  });
  compInteractive?.addEventListener("click",event=>{
    const button=event.target.closest('[data-package-action="step"]');if(!button)return;
    const packageId=button.dataset.packageId,componentId=button.dataset.componentId;
    const group=groups.find(entry=>String(entry.pack.id)===packageId),member=group?.members.find(entry=>String(entry.row.composition_id)===componentId);
    const perUnit=Math.max(1,Number(member?.config.consumption_per_unit||1));
    const stockLimit=member?.component.tracks_stock===false?Number.POSITIVE_INFINITY:Math.floor(Math.max(0,Number(member?.component.stock||0))/(perUnit*Math.max(1,Number(state.modalQty||1))));
    const max=Math.max(0,Math.min(Number(button.dataset.max??4),stockLimit));
    const currentValue=Number(packageState[packageId][componentId]||0),nextValue=Math.min(max,Math.max(0,currentValue+Number(button.dataset.step||0)));
    const selectedBefore=Object.values(packageState[packageId]||{}).filter(value=>Number(value)>0).length;
    const minSelections=Math.max(0,Number(group?.pack.min_selections||0));
    const selectedAfter=selectedBefore-(currentValue>0&&nextValue===0?1:0)+(currentValue===0&&nextValue>0?1:0);
    if(selectedAfter<minSelections){setStatus(`Mantenha pelo menos ${minSelections} opção(ões) em ${packageCustomerName(group.pack)}.`,"err");return}
    packageState[packageId][componentId]=nextValue;
    const value=packageState[packageId][componentId],controls=button.parentElement;
    controls.querySelector(".qty-val").textContent=String(value);
    controls.querySelector('[data-step="1"]').disabled=value>=max;
    const selectedNow=Object.values(packageState[packageId]||{}).filter(quantity=>Number(quantity)>0).length;
    for(const decrement of compInteractive.querySelectorAll('[data-package-action="step"][data-step="-1"]')){
      if(decrement.dataset.packageId!==packageId)continue;
      const quantity=Number(packageState[packageId][decrement.dataset.componentId]||0);
      decrement.disabled=quantity<=0||(quantity<=1&&selectedNow<=minSelections);
    }
    refreshPackagePrice();
  });
  const qtyVal=document.getElementById("modalQtyVal");
  document.getElementById("modalQtyMinus")?.addEventListener("click",()=>{state.modalQty=Math.max(1,state.modalQty-1);qtyVal.textContent=String(state.modalQty)});
  document.getElementById("modalQtyPlus")?.addEventListener("click",()=>{state.modalQty+=1;qtyVal.textContent=String(state.modalQty)});
  document.getElementById("modalViewCartBtn")?.addEventListener("click",()=>{closeModal();openCart()});
  document.getElementById("modalAddBtn")?.addEventListener("click",()=>{
    const selection=getSelection();if(!selection.valid){setStatus(selection.message,"err");return}
    const note=(document.getElementById("modalNote")?.value||"").trim(),unitPrice=Math.max(0,itemPriceBreakdown.total+selection.extra);
    const signature=buildEntrySignature(item.id,{},note,unitPrice,selection.packageState);
    const payload={signature,name:item.name,price:unitPrice,optionsText:selection.optionsText,note,modState:{},packageState:selection.packageState,qty:state.modalQty,replayNeedsReview:false};
    if(editIndex!==null){state.cart[editIndex]={...state.cart[editIndex],...payload};renderCart();closeModal();openCart();return}
    const current=state.cart.find(entry=>entry.signature===signature);if(current)current.qty+=state.modalQty;else state.cart.push({id:item.id,...payload});
    renderCart();returnToHomeView();
  });
  refreshPackagePrice();
}

function openItemModal(item, options = {}) {
  const packageGroups = getItemPackageGroups(item.id);
  if (packageGroups.length) {
    openPackageItemModal(item, options, packageGroups);
    return;
  }
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
    return Math.min(Math.max(0, Number(entry.comp.max_quantity ?? 4)), n);
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
        <div class="comp-body show" id="compBody">
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

  const itemPriceBreakdown = getItemPriceBreakdown(item);
  ui.modalBody.innerHTML = `
    <article class="modal" role="dialog" aria-modal="true" aria-label="Detalhes do item">
      <div class="modal-scroll mod-scroll-enabled">
        ${modalHead}
        <div class="modal-content">
          <h3 class="modal-title">${safeName}</h3>
          <p class="modal-price" id="modalDynamicPrice">${currency(itemPriceBreakdown.total)}</p>
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
      modalDynamicPrice.textContent = currency(itemPriceBreakdown.total + current.extra);
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
    const unitPrice = Math.max(0, itemPriceBreakdown.total + selection.extra);
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
        replayNeedsReview: false,
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
        replayNeedsReview: false,
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
  let suppressNextCartFabClick = false;
  let suppressNextCheckoutClick = false;

  ui.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value;
    applySearch();
  });

  ui.accountBtn.addEventListener("click", openAccountDialog);
  ui.customerTabs.addEventListener("click", event=>{
    const button=event.target.closest("[data-customer-page]");if(!button)return;
    const page=button.dataset.customerPage;
    if(page!=="catalog"&&!state.user){startCustomerLogin(page);return}
    switchCustomerPage(page);
    if(page==="profile")loadCustomerProfile().catch(error=>{console.error("Falha ao carregar cadastro:",error);setStatus("Não foi possível carregar seus dados.","err")});
    if(page==="orders"||page==="tracking")openCustomerOrders(state.selectedCustomerOrderId,page);
  });
  ui.profileForm.addEventListener("submit", saveCustomerProfile);
  ui.closeCheckoutConfirmBtn.addEventListener("click", closeCheckoutConfirmation);
  ui.checkoutConfirmBackdrop.addEventListener("click", (event) => {
    if (event.target === ui.checkoutConfirmBackdrop) closeCheckoutConfirmation();
  });
  ui.backToCartBtn.addEventListener("click", closeCheckoutConfirmation);
  ui.confirmAppOrderBtn.addEventListener("click", submitAppOrder);
  ui.closeCustomerOrderDetailBtn.addEventListener("click",closeCustomerOrderDetail);
  ui.customerOrderDetailBackdrop.addEventListener("click",event=>{if(event.target===ui.customerOrderDetailBackdrop)closeCustomerOrderDetail()});
  ui.customerOrderList.addEventListener("click", (event) => {
    const follow=event.target.closest("[data-customer-order]"),repeat=event.target.closest("[data-repeat-order]");
    if(follow){const order=state.customerOrders.find(entry=>String(entry.id)===String(follow.dataset.customerOrder));if(order&&["pending_confirmation","received","confirmed","production","delivery"].includes(order.status))openCustomerOrders(order.id,"tracking");else if(order)showCustomerOrderDetail(order);return}
    if(repeat){refreshDataNow({showError:false}).then(()=>repeatCustomerOrder(repeat.dataset.repeatOrder));return}
  });
  ui.activeCustomerOrders.addEventListener("click",event=>{const button=event.target.closest("[data-order-detail]");if(!button)return;const order=state.customerOrders.find(entry=>String(entry.id)===String(button.dataset.orderDetail));if(order)showCustomerOrderDetail(order)});
  ui.signOutBtn.addEventListener("click", async () => {
    const { error } = await db.auth.signOut();
    if (error) setStatus("Não foi possível sair da conta.", "err");
    else {if(state.customerOrdersPollingTimer){clearInterval(state.customerOrdersPollingTimer);state.customerOrdersPollingTimer=null}switchCustomerPage("catalog")}
  });

  ui.modal.addEventListener("click", (event) => {
    if (event.target === ui.modal) {
      closeModal();
    }
  });

  ui.cartFab.addEventListener("touchend", (event) => {
    event.preventDefault();
    suppressNextCartFabClick = true;
    openCart();
  }, { passive: false });

  ui.cartFab.addEventListener("click", () => {
    if (suppressNextCartFabClick) {
      suppressNextCartFabClick = false;
      return;
    }
    openCart();
  });

  ui.closeCartBtn.addEventListener("click", closeCart);
  ui.cartNote.addEventListener("input", persistCart);
  ui.cartBackdrop.addEventListener("click", (event) => {
    if (event.target === ui.cartBackdrop) {
      closeCart();
    }
  });

  ui.cartList.addEventListener("click", (event) => {
    const poolStep=event.target.closest("[data-pool-step]");
    if(poolStep){adjustSellableGroup(poolStep.dataset.packageId,poolStep.dataset.componentId,Number(poolStep.dataset.poolStep));return}
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

  ui.checkoutBtn.addEventListener("touchend", (event) => {
    event.preventDefault();
    suppressNextCheckoutClick = true;
    checkoutWhatsApp();
  }, { passive: false });

  ui.checkoutBtn.addEventListener("click", () => {
    if (suppressNextCheckoutClick) {
      suppressNextCheckoutClick = false;
      return;
    }
    checkoutWhatsApp();
  });

  ui.appCheckoutBtn.addEventListener("click", () => {
    startAppCheckout();
  });

  ui.copyMessageBtn.addEventListener("click", copyOrderMessage);

  ui.removeUnavailableBtn.addEventListener("click", removeUnavailableCartItems);

  // Previne clique em links desabilitados (evita abrir about:blank)
  ui.brandPhoneLink.addEventListener("click", (event) => {
    if (ui.brandPhoneLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return false;
    }
  });

  ui.brandPixLink.addEventListener("click", (event) => {
    if (ui.brandPixLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
      return false;
    }
  });
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
    renderMenu({ animateIntro: false });
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
    "ingredient_package",
    "package_component",
    "package_component_presentation",
    "item_package",
    "item_component_config",
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

async function loadOptionalPackageTable(table) {
  const { data, error } = await db.from(table).select("*");
  if (error) {
    console.warn(`Tabela ${table} indisponível; mantendo cálculo legado de disponibilidade.`, error.message);
    return [];
  }
  return data || [];
}

async function loadData() {
  const [
    setupRes,
    categoryRes,
    itemsRes,
    compositionRes,
    associationRes,
    ingredientPackages,
    packageComponents,
    packagePresentations,
    itemPackages,
    itemComponentConfigs,
    groupsRes,
    groupAssocRes
  ] = await Promise.all([
    db.from("setup").select("*").limit(1),
    db.from("node_category").select("*"),
    db.from("items").select("*"),
    db.from("composition").select("*"),
    db.from("item_composition_association").select("*"),
    loadOptionalPackageTable("ingredient_package"),
    loadOptionalPackageTable("package_component"),
    loadOptionalPackageTable("package_component_presentation"),
    loadOptionalPackageTable("item_package"),
    loadOptionalPackageTable("item_component_config"),
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
  state.items = sortItemsByPriority(itemsRes.data || []);
  state.compositions = compositionRes.data || [];
  state.associations = associationRes.data || [];
  state.ingredientPackages = ingredientPackages;
  state.packageComponents = packageComponents;
  state.packagePresentations = packagePresentations;
  state.itemPackages = itemPackages;
  state.itemComponentConfigs = itemComponentConfigs;
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
  restorePendingCheckoutSnapshot();
  renderCart();
  initializeCustomerAuth();

  try {
    await loadData();
    renderHeader();
    setupHeaderLogoScale();
    renderMenu({ animateIntro: true });
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
