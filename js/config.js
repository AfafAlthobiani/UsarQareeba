// Config
// Runtime values can be injected using window.__APP_CONFIG__ from config.runtime.js.
const baseConfig = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  openAiApiKey: "",
  map: {
    center: [24.7136, 46.6753],
    zoom: 12,
  },
  paginationSize: 20,
};

const runtimeConfig = window.__APP_CONFIG__ || {};

export const APP_CONFIG = {
  ...baseConfig,
  ...runtimeConfig,
  map: {
    ...baseConfig.map,
    ...(runtimeConfig.map || {}),
  },
};
