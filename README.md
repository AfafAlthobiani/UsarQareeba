# أسر قريبة | Nearby Productive Families SaaS

Production-ready RTL Arabic SaaS marketplace for home-based businesses with a protected business dashboard.

## Stack

- Frontend: HTML + Tailwind + Vanilla JS (modular)
- Backend: Supabase (Auth + Postgres + Storage + Realtime)
- Mapping: Leaflet.js
- Analytics Charts: Chart.js

## App Pages

- `index.html`: Marketplace (map, search, filters, favorites, AI recommendations)
- `auth.html`: Business owner login/register
- `dashboard.html`: Protected dashboard for business owners

## Architecture

- `js/config.js`: environment config
- `js/lib/*`: Supabase client and utilities
- `js/api/*`: API layer (auth/business/products/favorites/storage/analytics)
- `js/state/*`: state management
- `js/components/*`: reusable UI templates
- `js/ai/*`: recommendation engine
- `js/pages/*`: page controllers
- `styles/main.css`: shared luxury light design system
- `supabase/schema.sql`: DB + RLS + storage + analytics function
- `config.runtime.js`: runtime deployment config

## Features

- Visitor browsing + Business owner authentication
- Session persistence and route protection
- Realtime marketplace updates
- Favorites synchronized across sessions
- AI recommendation scoring:
	- category match
	- click behavior
	- favorites
	- rating and distance
- Business dashboard:
	- overview metrics
	- profile/location management
	- product CRUD
	- image upload + client-side compression
	- analytics chart
	- AI description suggestion (optional OpenAI key)

## Local Run

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Setup and Deployment

1. Configure Supabase and run SQL schema: `supabase/schema.sql`.
2. Set credentials in `config.runtime.js` (or fallback in `js/config.js`).
3. Deploy as static app (GitHub Pages / Netlify / Vercel).

Detailed steps: `SETUP.md`.
