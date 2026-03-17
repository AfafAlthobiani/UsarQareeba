// Utilities: debounce, toast, validation, distance and image compression.

export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function toSlug(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-\u0600-\u06FF]/g, "");
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

export function toast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const colors = {
    success: "border-emerald-300 bg-emerald-50 text-emerald-800",
    error: "border-rose-300 bg-rose-50 text-rose-800",
    info: "border-sky-300 bg-sky-50 text-sky-800",
  };

  const node = document.createElement("div");
  node.className = `toast-item rounded-xl border px-4 py-3 shadow-md transition ${colors[type] || colors.info}`;
  node.textContent = message;
  container.appendChild(node);

  requestAnimationFrame(() => node.classList.add("opacity-100", "translate-y-0"));
  setTimeout(() => {
    node.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => node.remove(), 250);
  }, 2600);
}

// Haversine distance in KM.
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function compressImage(file, maxWidth = 1400, quality = 0.84) {
  const img = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      },
      "image/jpeg",
      quality
    );
  });
}
