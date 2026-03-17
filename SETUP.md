# Setup Guide - أسر قريبة SaaS

## 1) Supabase Project

1. Create a new Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. In Authentication > Providers:
   - Enable Email.
   - Optionally enable Google OAuth.
4. In Authentication > URL Configuration:
   - Add your deployment URLs and `http://localhost:4173`.
5. In Database > Replication:
   - Ensure `businesses`, `products`, `favorites` are included for realtime.

## 2) App Config

Edit `js/config.js`:

- `supabaseUrl`
- `supabaseAnonKey`

For deployment-friendly runtime config:

1. Copy `config.runtime.example.js` to `config.runtime.js`.
2. Put environment-specific values in `config.runtime.js`.

Optional OpenAI:

- Set `openAiApiKey` in `config.runtime.js` to enable AI business description suggestions in dashboard.

## 3) Local Run

```bash
python3 -m http.server 4173
```

Open:

```text
http://localhost:4173
```

## 4) Deploy (Netlify / Vercel)

Because this is a static modular app:

- Publish the repository root as static output.
- Keep `js/config.js` updated with production Supabase values.

### Optional safer key injection

For advanced setup, create a serverless function that serves runtime config and load it before app initialization.

## 5) Roles and Access

- Visitor: marketplace browsing only.
- Business Owner: auth + dashboard.
- Dashboard route `dashboard.html` validates auth session and role.
- Dashboard includes map location picker and AI description generator (optional key).

## 6) Feature Checklist

- Auth (email/password + Google optional)
- Session persistence
- Protected dashboard
- CRUD businesses/products
- Storage uploads with compression and preview
- Favorites persisted in backend
- Realtime business/product/favorites sync
- AI recommendations based on behavior + rating/distance
- Chart analytics in dashboard
