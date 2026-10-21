# LEXON Team (PWA)

Installable app for invited members. Uses the same Supabase Project A as Workspace. No registration: email -> authorization -> invitation code -> access.

```
cp .env.example .env     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (Project A)
npm install
npm run dev -- --port 5174
npm run build            # dist/
```

See the Team Deployment guide for GitHub, Vercel, domain and PWA install steps.
