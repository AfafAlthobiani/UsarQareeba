// App state container.
export const store = {
  auth: {
    session: null,
    user: null,
    profile: null,
  },
  ui: {
    category: "الكل",
    search: "",
    activeBusinessId: null,
    page: 0,
    loading: false,
  },
  data: {
    businesses: [],
    products: new Map(),
    favorites: new Set(),
    interactions: {
      clicks: {},
      categoryViews: {},
    },
  },
};

export function incrementInteraction(type, key) {
  if (!store.data.interactions[type]) return;
  store.data.interactions[type][key] = (store.data.interactions[type][key] || 0) + 1;
  localStorage.setItem("usar_interactions", JSON.stringify(store.data.interactions));
}

export function hydrateInteractions() {
  const raw = localStorage.getItem("usar_interactions");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    store.data.interactions = {
      clicks: parsed.clicks || {},
      categoryViews: parsed.categoryViews || {},
    };
  } catch {
    // Ignore malformed local storage.
  }
}
