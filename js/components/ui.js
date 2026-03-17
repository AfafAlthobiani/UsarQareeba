// UI components

export function createToastContainer() {
  if (document.getElementById("toastContainer")) return;
  const wrapper = document.createElement("div");
  wrapper.id = "toastContainer";
  wrapper.className = "fixed bottom-4 left-4 z-[1200] flex w-[340px] max-w-[92vw] flex-col gap-2";
  document.body.appendChild(wrapper);
}

export function businessCardTemplate({ biz, isFavorite }) {
  return `
    <article class="business-card card-lux cursor-pointer" data-business-id="${biz.id}">
      <button class="favorite-btn ${isFavorite ? "is-active" : ""}" data-fav-id="${biz.id}" title="مفضلة">
        ❤
      </button>
      <div class="flex gap-3">
        <img loading="lazy" src="${biz.logo_url || "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=160&q=80"}" class="h-14 w-14 rounded-full object-cover border border-amber-200" alt="${biz.name}" />
        <div class="min-w-0 flex-1">
          <h3 class="truncate text-base font-extrabold text-slate-800">${biz.name}</h3>
          <div class="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>${biz.category}</span>
            <span>⭐ ${Number(biz.rating || 0).toFixed(1)}</span>
          </div>
          <p class="mt-2 line-clamp-2 text-xs text-slate-600">${biz.description || "لا يوجد وصف بعد"}</p>
        </div>
      </div>
    </article>
  `;
}

export function recommendationCardTemplate(biz) {
  return `
    <button class="recommend-chip" data-rec-id="${biz.id}">
      <img loading="lazy" src="${biz.logo_url || "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=120&q=80"}" alt="${biz.name}" />
      <div>
        <p class="text-sm font-bold text-slate-800 truncate">${biz.name}</p>
        <p class="text-[11px] text-slate-500">${biz.category} • ${biz.aiScore.toFixed(1)} AI</p>
      </div>
    </button>
  `;
}

export function productCardTemplate(item) {
  return `
    <div class="product-card">
      <img loading="lazy" src="${item.image || "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=400&q=80"}" alt="${item.name}" class="h-24 w-full object-cover" />
      <div class="p-3">
        <p class="font-bold text-slate-800">${item.name}</p>
        <p class="text-sm text-amber-700 font-bold mt-1">${item.price} ر.س</p>
      </div>
    </div>
  `;
}

export function emptyStateTemplate(message) {
  return `<div class="card-lux p-5 text-center text-sm text-slate-600">${message}</div>`;
}
