// Routing helpers that work both locally and on GitHub Pages project paths.

function getBasePath() {
  const host = window.location.hostname;
  const segments = window.location.pathname.split("/").filter(Boolean);

  // On GitHub Pages project sites: /<repo>/<page>
  if (host.endsWith("github.io") && segments.length > 0) {
    return `/${segments[0]}`;
  }

  return "";
}

export function appPath(page = "") {
  const cleaned = String(page || "").replace(/^\/+/, "");
  const base = getBasePath();
  return cleaned ? `${base}/${cleaned}` : `${base}/`;
}

export function appAbsoluteUrl(page = "") {
  return `${window.location.origin}${appPath(page)}`;
}

export function navigateTo(page = "") {
  window.location.href = appPath(page);
}
