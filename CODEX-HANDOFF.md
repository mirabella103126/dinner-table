# The Dinner Table: Codex handoff

Continue this existing app rather than rebuilding it.

Live site: https://wiesner-dinner-table.jeffweez.chatgpt.site
Site project ID: appgprj_6ad2479369d08191878b511ad873401e
Latest deployed source commit: 5f5542cd9676a0f90dc0fff88134c55071712705
Latest saved version: appgprj_6ad2479369d08191878b511ad873401e~appgver_4aa44a84cab08191a88661d03965d2e2

## Product
Shared family dinner calendar, favorite meals, takeout/delivery places and regular orders, weekly repeats with per-date overrides, thumbs up/down, preference notes, side suggestions, and new-meal requests with recipe-search links.
Family: Jeff, Devalina, Mirabella (13), Zeke (10).
The selected avatar/name appears top right and persists in browser localStorage. One vote pair automatically records the active profile. Others’ votes are read-only in the UI. Profiles are household convenience identities, not separate authenticated accounts.
Avatars must remain soft, minimal, generic, pastel illustrations with broad hair/skin cues. User disliked detailed portraits. Do not use uploaded family photos or attempt realistic likenesses.

## Current implementation
React 19, TypeScript, Vinext/Vite, Cloudflare Workers, Drizzle, D1. app/page.tsx contains client UI; app/globals.css styles; app/api/records/route.ts CRUD; db/schema.ts records table; drizzle/ contains schema migration. .openai/hosting.json preserves the existing hosted Site identity and DB binding.
Server persistence is D1; this archive contains source, not live database records. Preserve hosted data and existing project identity. Do not replay migrations on production manually.
Existing Site is owner-private. Do not broaden access without instruction. Family invitations/separate access are not set up.
No AI model integration, fridge inventory, or live restaurant data yet. Recipe links are search links, not verified individual recipes.
Salmon night and Taco Tuesday are fallback starter examples.

## Development and publishing
Read README.md for local setup. Install dependencies with the lockfile and use npm run dev, npm run build, and npx tsc --noEmit as appropriate. Local D1 migration steps are in README.md. The Sites plugin manages provisioned production bindings and publication. If available, read its skill and reuse the existing project ID. Obtain a fresh source write credential; no credentials are included here. Do not create a duplicate Site.
The original remote source is managed by Sites, not a user GitHub repo. This exported folder does not contain .git history. Initialize a local repo if needed. Local checkout runtime files, dependencies, build output, credentials, and test database are intentionally excluded.
Build and TypeScript checks passed. Browser checks covered scheduling, persistence after reload, notes, automatic vote attribution, and avatar picker appearance.

## Suggested next work
Start by reading existing code and confirming the app runs locally. Ask Jeff what to change next. Potential future scope includes fridge/leftover tracking, dietary profiles, AI meal suggestions, true family access, specific recipe discovery, and improving meal editing/removal. Do not claim these already work.
