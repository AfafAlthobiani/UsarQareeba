import { getCurrentUser, getSession, supabase } from "../lib/supabase.js";
import { toast, compressImage } from "../lib/utils.js";
import { createToastContainer, emptyStateTemplate } from "../components/ui.js";
import { getBusinessByOwner, upsertBusiness } from "../api/businesses.js";
import { createProduct, deleteProduct, listProductsByBusiness, updateProduct } from "../api/products.js";
import { uploadBusinessImage } from "../api/storage.js";
import { getOverviewByBusiness, getViewsTimeseries } from "../api/analytics.js";
import { getMyProfile } from "../api/auth.js";
import { suggestBusinessDescription } from "../ai/openai.js";

let currentUser;
let currentBusiness;
let products = [];
let chart;
let pickerMap;
let pickerMarker;

async function ensureAuthAndRole() {
  const session = await getSession();
  if (!session) {
    location.href = "/auth.html";
    return;
  }

  currentUser = await getCurrentUser();
  const profile = await getMyProfile();
  const role = profile?.role || currentUser?.user_metadata?.role;
  if (role !== "business") {
    toast("هذه اللوحة مخصصة لأصحاب المشاريع فقط", "error");
    setTimeout(() => (location.href = "/index.html"), 900);
  }
}

function initLocationPicker() {
  if (pickerMap) return;
  pickerMap = L.map("locationPickerMap").setView([24.7136, 46.6753], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(pickerMap);

  pickerMap.on("click", (e) => {
    if (!pickerMarker) pickerMarker = L.marker(e.latlng).addTo(pickerMap);
    else pickerMarker.setLatLng(e.latlng);

    document.getElementById("businessForm").lat.value = e.latlng.lat.toFixed(6);
    document.getElementById("businessForm").lng.value = e.latlng.lng.toFixed(6);
  });
}

function setPickerLocation(lat, lng) {
  if (!pickerMap) return;
  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) return;
  const loc = [lat, lng];
  pickerMap.setView(loc, 13);
  if (!pickerMarker) pickerMarker = L.marker(loc).addTo(pickerMap);
  else pickerMarker.setLatLng(loc);
}

function switchSection(sectionId) {
  document.querySelectorAll("[data-section]").forEach((el) => {
    el.classList.toggle("hidden", el.id !== sectionId);
  });
}

function bindSidebarNav() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.nav));
  });
}

async function loadBusinessData() {
  currentBusiness = await getBusinessByOwner(currentUser.id);
  products = currentBusiness ? await listProductsByBusiness(currentBusiness.id) : [];

  document.getElementById("businessForm").name.value = currentBusiness?.name || "";
  document.getElementById("businessForm").category.value = currentBusiness?.category || "حلويات";
  document.getElementById("businessForm").description.value = currentBusiness?.description || "";
  document.getElementById("businessForm").phone.value = currentBusiness?.phone || "";
  document.getElementById("businessForm").instagram.value = currentBusiness?.instagram || "";
  document.getElementById("businessForm").lat.value = currentBusiness?.lat || "";
  document.getElementById("businessForm").lng.value = currentBusiness?.lng || "";

  renderProductsTable();
  await renderAnalytics();

  setTimeout(() => {
    pickerMap?.invalidateSize();
    setPickerLocation(Number(currentBusiness?.lat), Number(currentBusiness?.lng));
  }, 140);
}

function renderProductsTable() {
  const root = document.getElementById("productsTable");
  if (!products.length) {
    root.innerHTML = emptyStateTemplate("لا توجد منتجات. أضف أول منتج الآن.");
    return;
  }

  root.innerHTML = `
    <div class="space-y-2">
      ${products
        .map(
          (p) => `
          <div class="card-lux flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <img src="${p.image || "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=200&q=80"}" class="h-12 w-12 rounded-lg object-cover" alt="${p.name}" />
              <div>
                <p class="font-bold text-slate-800">${p.name}</p>
                <p class="text-sm text-amber-700">${p.price} ر.س</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button class="rounded-lg border border-slate-200 px-3 py-1 text-sm" data-edit-product="${p.id}">تعديل</button>
              <button class="rounded-lg border border-rose-200 px-3 py-1 text-sm text-rose-600" data-del-product="${p.id}">حذف</button>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;

  root.querySelectorAll("[data-edit-product]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const product = products.find((x) => x.id === Number(btn.dataset.editProduct));
      if (!product) return;
      const form = document.getElementById("productForm");
      form.productId.value = product.id;
      form.name.value = product.name;
      form.price.value = product.price;
      toast("تم تحميل المنتج للتعديل", "info");
    });
  });

  root.querySelectorAll("[data-del-product]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await deleteProduct(Number(btn.dataset.delProduct));
      toast("تم حذف المنتج", "success");
      await loadBusinessData();
    });
  });
}

async function renderAnalytics() {
  if (!currentBusiness) return;

  const overview = await getOverviewByBusiness(currentBusiness.id);
  document.getElementById("statViews").textContent = overview.views || 0;
  document.getElementById("statClicks").textContent = overview.clicks || 0;
  document.getElementById("statFavorites").textContent = overview.favorites || 0;

  const rows = await getViewsTimeseries(currentBusiness.id);
  const grouped = {};
  rows.forEach((row) => {
    const key = new Date(row.created_at).toLocaleDateString("ar-SA");
    grouped[key] = (grouped[key] || 0) + 1;
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);
  const ctx = document.getElementById("viewsChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "المشاهدات",
          data: values,
          borderColor: "#c5a059",
          backgroundColor: "rgba(197,160,89,0.2)",
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
    },
  });

  const top = [...products].sort((a, b) => Number(b.price || 0) - Number(a.price || 0)).slice(0, 5);
  const topContainer = document.getElementById("topProducts");
  topContainer.innerHTML = top.length
    ? `
      <div class="card-lux">
        <h3 class="mb-2 text-lg font-extrabold">أفضل المنتجات</h3>
        <div class="space-y-2">
          ${top
            .map(
              (item, idx) => `
              <div class="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-sm">
                <span>${idx + 1}. ${item.name}</span>
                <span class="font-bold text-amber-700">${item.price} ر.س</span>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    `
    : emptyStateTemplate("لا توجد منتجات كافية لعرض الإحصاءات.");
}

async function handleAiDescription() {
  const form = document.getElementById("businessForm");
  const name = form.name.value?.trim();
  const category = form.category.value;
  if (!name) {
    toast("اكتب اسم النشاط أولاً", "info");
    return;
  }

  try {
    const suggestion = await suggestBusinessDescription({ businessName: name, category });
    if (!suggestion) {
      toast("لم يتم ضبط مفتاح OpenAI في الإعدادات", "info");
      return;
    }
    form.description.value = suggestion;
    toast("تم توليد وصف مقترح", "success");
  } catch (err) {
    toast(err.message || "تعذر توليد الوصف", "error");
  }
}

async function submitBusinessForm(e) {
  e.preventDefault();
  const form = new FormData(e.currentTarget);

  const payload = {
    owner_id: currentUser.id,
    name: form.get("name"),
    category: form.get("category"),
    description: form.get("description"),
    lat: Number(form.get("lat") || 0),
    lng: Number(form.get("lng") || 0),
    phone: form.get("phone"),
    instagram: form.get("instagram"),
    rating: currentBusiness?.rating || 4.5,
  };

  try {
    const logoFile = form.get("logo");
    const coverFile = form.get("cover");

    if (logoFile && logoFile.size > 0) {
      const compressed = await compressImage(logoFile);
      payload.logo_url = await uploadBusinessImage(compressed, currentUser.id, "logo");
      document.getElementById("logoPreview").src = payload.logo_url;
    }

    if (coverFile && coverFile.size > 0) {
      const compressed = await compressImage(coverFile, 1600);
      payload.cover_url = await uploadBusinessImage(compressed, currentUser.id, "cover");
      document.getElementById("coverPreview").src = payload.cover_url;
    }

    currentBusiness = await upsertBusiness(payload);
    toast("تم حفظ بيانات المشروع", "success");
    await loadBusinessData();
  } catch (err) {
    toast(err.message || "تعذر حفظ البيانات", "error");
  }
}

async function submitProductForm(e) {
  e.preventDefault();
  if (!currentBusiness) {
    toast("احفظ بيانات المشروع أولاً", "info");
    return;
  }

  const form = new FormData(e.currentTarget);
  const id = Number(form.get("productId") || 0);
  const payload = {
    business_id: currentBusiness.id,
    name: form.get("name"),
    price: Number(form.get("price") || 0),
  };

  try {
    const imageFile = form.get("image");
    if (imageFile && imageFile.size > 0) {
      const compressed = await compressImage(imageFile, 1200);
      payload.image = await uploadBusinessImage(compressed, currentUser.id, "product");
      document.getElementById("productPreview").src = payload.image;
    }

    if (id) await updateProduct(id, payload);
    else await createProduct(payload);

    toast(id ? "تم تحديث المنتج" : "تمت إضافة المنتج", "success");
    e.currentTarget.reset();
    await loadBusinessData();
  } catch (err) {
    toast(err.message || "تعذر حفظ المنتج", "error");
  }
}

function bindImagePreviews() {
  document.getElementById("logoInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    document.getElementById("logoPreview").src = URL.createObjectURL(file);
  });

  document.getElementById("coverInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    document.getElementById("coverPreview").src = URL.createObjectURL(file);
  });

  document.getElementById("productImageInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    document.getElementById("productPreview").src = URL.createObjectURL(file);
  });
}

function bindActions() {
  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();
    location.href = "/index.html";
  });

  document.getElementById("businessForm").addEventListener("submit", submitBusinessForm);
  document.getElementById("productForm").addEventListener("submit", submitProductForm);
  document.getElementById("aiSuggestDescriptionBtn").addEventListener("click", handleAiDescription);
}

async function init() {
  createToastContainer();
  await ensureAuthAndRole();
  initLocationPicker();
  bindSidebarNav();
  bindImagePreviews();
  bindActions();
  await loadBusinessData();
}

init();
