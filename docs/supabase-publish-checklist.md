## Supabase publish checklist (SkillSeed)

This is the set of settings and verifications you must do in **Supabase Dashboard** before letting the public test the app.

### Auth URL configuration (required)

Supabase Dashboard → **Authentication** → **URL Configuration**

- **Site URL**
  - Local dev: `http://localhost:5173`
  - Production: `https://<your-domain>`
- **Redirect URLs** (add all environments you will use)
  - Local:
    - `http://localhost:5173/auth/callback`
    - `http://localhost:5173/reset-password`
  - Production:
    - `https://<your-domain>/auth/callback`
    - `https://<your-domain>/reset-password`

If these are missing, OAuth and password reset flows will fail after redirect.

### Google OAuth (required if you enable Google login)

Supabase Dashboard → **Authentication** → **Sign in / Providers** → **Google**
- Enabled
- Client ID/Secret set

Google Cloud Console (OAuth client)
- Authorized JavaScript origins:
  - `http://localhost:5173`
  - `https://<your-domain>`
- Authorized redirect URIs:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`

### Apply migrations / verify RLS (non-negotiable)

You can’t “prove” RLS is enabled from the frontend. Verify in Supabase:

- Confirm RLS is **enabled** on tables that store user-specific data
- Confirm policies prevent:
  - reading other users’ private rows
  - updating/deleting rows you don’t own
  - unauthenticated writes

This repo contains migrations and policy SQL under:
- `supabase/migrations/*`
- `supabase/run_this_in_supabase.sql`

### Storage / uploads (if enabled)

If the app allows uploads:
- Storage bucket exists
- Policies enforce correct access (public vs signed/private)
- File type/size limits are sensible

The repo includes storage policy migration(s) under `supabase/migrations/006_fix_storage_policies.sql`.

### Rate limits / abuse controls (recommended)

At minimum:
- Use Supabase Auth rate limits (Dashboard → Auth → Rate Limits)
- Consider limiting public actions (challenge joins/submissions) if you see abuse

