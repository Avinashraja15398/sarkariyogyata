# SarkariYogta

## Setup (laptop)
1. Node 20.9+ -> `npm install`
2. Supabase project banayein -> SQL Editor me `supabase/schema.sql` chalayein.
3. Auth > Users me apna admin user banayein, phir SQL: `update public.profiles set role='admin' where id='<UUID>';`
4. `cp .env.example .env.local` -> URL, anon key, service-role key bharein.
5. `npm run dev` -> /admin/login -> /admin me JSON import.

## Daily flow
Raw text Claude ko -> JSON -> /admin: **Check only** (kuch save nahi hota) -> official source se match karein -> verify tick -> **Publish**.
Date extend / admit card: wahi `slug` + sirf badle hue fields + `update_kind`. Baaki fields safe rehte hain, change history `job_updates` me.

## Deploy
GitHub -> Vercel import -> 4 env vars (service key **sirf server env**) -> domain jodein.
