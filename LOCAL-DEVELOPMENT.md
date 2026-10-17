# Local development

This is the existing Dinner Table source exported in `dinner-table-codex.zip`.
The hosted project identity and application code are unchanged. The live Site,
its access policy, and production database were not modified during setup.

## Run on this Mac

From this directory:

```sh
export PATH="/Users/jeffwiesner/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH"
node scripts/run-framework.mjs dev --hostname 127.0.0.1
```

Open http://127.0.0.1:5173/. Stop the server with Ctrl+C before starting another.
Dependencies are already installed from the unchanged pnpm lockfile. If needed,
reinstall with `pnpm install --frozen-lockfile` using the PATH above. The archive's
`install:ci` shell script assumes Linux tooling; use pnpm directly on this Mac.

## Local data

The local D1 database is stored under `.wrangler/state`. Its records are separate
from the live Site; the archive does not include live records. The initial schema
`drizzle/0000_peaceful_gauntlet.sql` has already been applied locally. Do not replay
it. The app displays Salmon night and Taco Tuesday as fallback examples.

Keep `.wrangler`, `.sites-runtime`, and `node_modules` local and ignored. Preserve
`.openai/hosting.json`, including the existing project ID and DB binding. Publishing
is a separate Sites workflow and was not performed here.

## Checks completed

```sh
node scripts/run-framework.mjs build
node node_modules/typescript/bin/tsc --noEmit
```

Both passed on October 16, 2026. The local page returned HTTP 200. Browser checks
confirmed the planner loads, a dinner selection survives reload, and the original
soft pastel profile avatars remain intact. The temporary dinner selection was
returned to “Choose dinner” after the persistence check.

## Suggestions and decisions

The local app now stores append-only `selection` records alongside existing data;
no schema migration is needed. Parent decisions are ordered by a database-assigned
sequence. A new decision supersedes the previous one without deleting it. Legacy
manual plans remain visible until a parent makes a new decision. Suggestions and
votes are attributed to the selected household profile, and only their author can
remove them. These are still convenience profiles, not authenticated individual
accounts; anyone who switches profiles acts as that profile.

Favorites appear as draggable icons, with tap/keyboard placement as an alternative.
Day-specific votes are stored against selections; older meal-wide votes remain in
meal details. The new meal form includes a dinner date and creates a suggestion or
parent decision. Local rule tests: `node --experimental-strip-types --test tests/planning.test.ts`.
