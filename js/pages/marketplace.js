import { APP_CONFIG } from "../config.js";
import { getSession, getCurrentUser, supabase } from "../lib/supabase.js";
import { debounce, toast } from "../lib/utils.js";
import { store, hydrateInteractions, incrementInteraction } from "../state/store.js";
import { listBusinesses, subscribeBusinesses } from "../api/businesses.js";
import { listProductsByBusiness, subscribeProducts } from "../api/products.js";
import { listMyFavorites, toggleFavorite, subscribeFavorites } from "../api/favorites.js";
import { trackEvent } from "../api/analytics.js";
import { getRecommendations } from "../ai/recommendations.js";
import { businessCardTemplate, createToastContainer, emptyStateTemplate, productCardTemplate, recommendationCardTemplate } from "../components/ui.js";
import { navigateTo } from "../lib/routes.js";

const categories = ["الكل", "حلويات", "طبخ منزلي", "قهوة", "مخبوزات", "حِرَف يدوية"];

let map;
let markerLayer;
const markerById = new Map();
let businessRealtimeChannel;
let productsRealtimeChannel;
let favoritesRealtimeChannel;

function createDivIcon(biz) {
  const img = biz.logo_url || "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=160&q=80";
  return L.divIcon({
    className: "",
    html: `<div class="custom-marker"><img src="${img}" alt="${biz.name}" /></div>`,
    iconSize: [58, 58],
    iconAnchor: [29, 29],
  });
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView(APP_CONFIG.map.center, APP_CONFIG.map.zoom);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}

function renderCategoryPills() {
  const containers = [document.getElementById("categoryPillsDesktop"), document.getElementById("categoryPillsMobile")];
  containers.forEach((container) => {
    container.innerHTML = categories
      .map((cat) => `<button class="rounded-full border px-3 py-1 text-sm ${store.ui.category === cat ? "bg-amber-200 border-amber-400" : "bg-white border-amber-200"}" data-cat="${cat}">${cat}</button>`)
      .join("");

    container.querySelectorAll("[data-cat]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        store.ui.category = btn.dataset.cat;
        incrementInteraction("categoryViews", store.ui.category);
        store.ui.page = 0;
        await loadBusinesses(true);
      });
    });
  });
}

function renderRecommendations() {
  const container = document.getElementById("recommendedRow");
  const favoritesSet = store.data.favorites;
  const recommendations = getRecommendations(store.data.businesses, store.data.interactions, favoritesSet, null);

  container.innerHTML = recommendations.length
    ? recommendations.map((biz) => recommendationCardTemplate(biz)).join("")
    : `<p class="text-sm text-slate-500">ابدأ بالتصفح لتظهر لك توصيات ذكية.</p>`;

  container.querySelectorAll("[data-rec-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openBusinessProfile(Number(button.dataset.recId), true);
    });
  });
}

function renderMarkers(items) {
  markerLayer.clearLayers();
  markerById.clear();

  items.forEach((biz) => {
    if (biz.lat == null || biz.lng == null) return;
    const marker = L.marker([biz.lat, biz.lng], { icon: createDivIcon(biz) }).addTo(markerLayer);
    marker.on("click", () => openBusinessProfile(biz.id, true));
    markerById.set(biz.id, marker);
  });
}

function renderList(items, append = false) {
  const desktop = document.getElementById("businessListDesktop");
  const mobile = document.getElementById("businessListMobile");

  const html = items.length
    ? items
        .map((biz) => businessCardTemplate({ biz, isFavorite: store.data.favorites.has(biz.id) }))
        .join("")
    : emptyStateTemplate("لا توجد نتائج حالياً.");

  if (append) {
    desktop.insertAdjacentHTML("beforeend", html);
    mobile.insertAdjacentHTML("beforeend", html);
  } else {
    desktop.innerHTML = html;
    mobile.innerHTML = html;
  }

  [desktop, mobile].forEach((root) => {
    root.querySelectorAll("[data-business-id]").forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest("[data-fav-id]")) return;
        openBusinessProfile(Number(card.dataset.businessId), true);
      });
    });

    root.querySelectorAll("[data-fav-id]").forEach((favButton) => {
      favButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        const businessId = Number(favButton.dataset.favId);
        await handleFavoriteToggle(businessId);
      });
    });
  });
}

function syncAuthNav() {
  const authButton = document.getElementById("authButton");
  const authButtonMobile = document.getElementById("authButtonMobile");
  const dashboardLink = document.getElementById("dashboardLink");

  if (store.auth.user) {
    authButton.textContent = "تسجيل الخروج";
    authButtonMobile.textContent = "خروج";
    authButton.onclick = async () => {
      await supabase.auth.signOut();
      location.reload();
    };
    authButtonMobile.onclick = authButton.onclick;
    dashboardLink.classList.remove("hidden");
  } else {
    authButton.textContent = "دخول أصحاب المشاريع";
    authButtonMobile.textContent = "تسجيل الدخول";
    authButton.onclick = () => navigateTo("auth.html");
    authButtonMobile.onclick = authButton.onclick;
    dashboardLink.classList.add("hidden");
  }
}

async function handleFavoriteToggle(businessId) {
  if (!store.auth.user) {
    toast("سجّل الدخول أولاً لحفظ المفضلة", "info");
    return;
  }

  const wasFavorite = store.data.favorites.has(businessId);
  try {
    const nowFavorite = await toggleFavorite(businessId, wasFavorite);
    if (nowFavorite) store.data.favorites.add(businessId);
    else store.data.favorites.delete(businessId);

    toast(nowFavorite ? "تمت الإضافة إلى المفضلة" : "تمت الإزالة من المفضلة", "success");
    renderList(store.data.businesses, false);
    renderRecommendations();
  } catch (err) {
    toast(err.message || "تعذرت العملية", "error");
  }
}

async function openBusinessProfile(id, mapFocus = false) {
  const biz = store.data.businesses.find((x) => x.id === id);
  if (!biz) return;

  store.ui.activeBusinessId = id;
  incrementInteraction("clicks", String(id));
  try {
    await trackEvent({
      business_id: id,
      event_type: "click",
      metadata: { source: "marketplace" },
    });
  } catch {
    // Ignore analytics failure for UX continuity.
  }

  const products = await listProductsByBusiness(id);
  const panel = document.getElementById("profilePanel");
  const body = document.getElementById("profileContent");

  body.innerHTML = `
    <div class="p-4 space-y-4">
      <div class="card-lux p-0 overflow-hidden">
        <img loading="lazy" src="${biz.cover_url || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80"}" class="h-40 w-full object-cover" alt="${biz.name}" />
        <div class="p-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-extrabold">${biz.name}</h3>
            <button id="closePanel" class="rounded-full border border-amber-200 px-3 py-1 text-sm">إغلاق</button>
          </div>
          <p class="mt-2 text-sm text-slate-600">${biz.description || "لا يوجد وصف بعد"}</p>
          <div class="mt-3 flex flex-wrap gap-2 text-xs">
            <span class="rounded-full bg-amber-100 px-2 py-1">⭐ ${Number(biz.rating || 0).toFixed(1)}</span>
            <span class="rounded-full bg-slate-100 px-2 py-1">${biz.category}</span>
            <span class="rounded-full bg-slate-100 px-2 py-1">${biz.phone || "بدون رقم"}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        ${products.length ? products.map((item) => productCardTemplate(item)).join("") : "<p class='text-sm text-slate-500 col-span-2'>لا توجد منتجات بعد.</p>"}
      </div>
    </div>
  `;

  panel.classList.add("open");
  document.getElementById("closePanel")?.addEventListener("click", () => panel.classList.remove("open"));

  if (mapFocus && biz.lat != null && biz.lng != null) {
    map.flyTo([biz.lat, biz.lng], 14, { duration: 0.7 });
  }
}

async function loadBusinesses(reset = false) {
  if (store.ui.loading) return;
  store.ui.loading = true;

  try {
    if (reset) {
      store.ui.page = 0;
      store.data.businesses = [];
      document.getElementById("businessListDesktop").innerHTML = "";
      document.getElementById("businessListMobile").innerHTML = "";
    }

    const chunk = await listBusinesses({
      search: store.ui.search,
      category: store.ui.category,
      page: store.ui.page,
    });

    store.data.businesses = reset ? chunk : [...store.data.businesses, ...chunk];
    renderList(chunk, !reset);
    renderMarkers(store.data.businesses);
    renderRecommendations();

    document.getElementById("loadMoreBtn").classList.toggle("hidden", chunk.length < APP_CONFIG.paginationSize);
  } catch (err) {
    toast(err.message || "فشل تحميل البيانات", "error");
  } finally {
    store.ui.loading = false;
  }
}

function setupRealtime() {
  businessRealtimeChannel = subscribeBusinesses(async () => {
    await loadBusinesses(true);
    toast("تم تحديث المشاريع مباشرة", "info");
  });

  productsRealtimeChannel = subscribeProducts(async (payload) => {
    if (payload.new?.business_id === store.ui.activeBusinessId || payload.old?.business_id === store.ui.activeBusinessId) {
      await openBusinessProfile(store.ui.activeBusinessId, false);
    }
  });

  if (store.auth.user) {
    favoritesRealtimeChannel = subscribeFavorites(async () => {
      const favs = await listMyFavorites();
      store.data.favorites = new Set(favs);
      renderList(store.data.businesses, false);
      renderRecommendations();
    });
  }
}

function setupSearch() {
  const sync = debounce(async (value) => {
    store.ui.search = value.trim();
    store.ui.page = 0;
    await loadBusinesses(true);
  }, 320);

  [document.getElementById("searchDesktop"), document.getElementById("searchMobile")].forEach((input) => {
    input.addEventListener("input", (e) => {
      const value = e.target.value;
      document.getElementById("searchDesktop").value = value;
      document.getElementById("searchMobile").value = value;
      sync(value);
    });
  });
}

function setupMobileSheet() {
  const sheet = document.getElementById("mobileSheet");
  document.getElementById("toggleSheet").addEventListener("click", () => sheet.classList.toggle("open"));
}

async function hydrateAuth() {
  const session = await getSession();
  store.auth.session = session;
  store.auth.user = session?.user || null;

  if (store.auth.user) {
    const favorites = await listMyFavorites();
    store.data.favorites = new Set(favorites);
  }

  syncAuthNav();
}

async function main() {
  createToastContainer();
  hydrateInteractions();
  initMap();
  setupMobileSheet();
  setupSearch();
  renderCategoryPills();
  await hydrateAuth();
  await loadBusinesses(true);
  setupRealtime();

  document.getElementById("loadMoreBtn").addEventListener("click", async () => {
    store.ui.page += 1;
    await loadBusinesses(false);
  });

  window.addEventListener("beforeunload", () => {
    if (businessRealtimeChannel) supabase.removeChannel(businessRealtimeChannel);
    if (productsRealtimeChannel) supabase.removeChannel(productsRealtimeChannel);
    if (favoritesRealtimeChannel) supabase.removeChannel(favoritesRealtimeChannel);
  });
}

main();
