# Usar Qareeba - Home-made Businesses Directory

A premium single-page RTL Arabic directory app for Productive Families (Home-based businesses), built with:

- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript
- Leaflet.js

## Features

- RTL Arabic layout with `Tajawal` body and `Cairo` headings.
- Split-screen desktop layout (sidebar + full map).
- Mobile bottom-sheet list with full-screen map.
- Advanced live search and category pill filters.
- Leaflet custom circular DivIcon markers with glow, pulse, and hover scaling.
- Glassmorphism business cards with floating category badges.
- Slide-over business profile panel with product price grid.
- Multi-step registration modal with location picker map.

## Run Locally

No build step needed.

1. Open the project folder.
2. Serve it with any static server, for example:

```bash
python3 -m http.server 4173
```

3. Open:

```text
http://localhost:4173
```

## Deploy (GitHub Pages)

This repository includes a GitHub Actions workflow for Pages deployment from the `main` branch.

1. Push to `main`.
2. In GitHub repository settings, ensure **Pages** source is **GitHub Actions**.
3. The workflow publishes automatically on every push to `main`.

## Main File

- `index.html`
