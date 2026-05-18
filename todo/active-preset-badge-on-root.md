# promote active conditional preset on `/`

When today's UTC MM-DD matches a conditional preset's `date` (currently 02-14, 05-17, 10-04), inject a badge into the configurator view linking to the matching `/<day>` page with full params (`date`, `answer2`, etc. — same URL the form would build).

Why: the recent edge-rendering work makes `/<day>` pages SEO-real, but the homepage is unchanged 365 days/year. On the 3 dates that actually match a conditional preset, the homepage should surface that day instead of being generic. Today (2026-05-18) is one day after syttende mai, so the feature would be dormant today — fine, ships value when it fires.

## Design

- Server-side via `functions/_middleware.ts`. Currently bails on root (`parseDay` returns ""); add a new branch before that bail-out that handles `/` specifically.
- Use the shared resolver in `data/answer.ts` to compute "today's MMDD (UTC)" and find the matching preset.
- Match condition: `todayMMDD === preset.date` (preset is in its "YES" state, not the fallback).
- Inject the badge by appending HTML before a known anchor inside `.composer` — pick a marker like the form, or a new empty element.
- Don't rewrite `<title>` / `<meta>` / OG image on `/` — let the homepage stay the configurator semantically. The badge is in-page only.
- Set `cache-control: max-age=3600` on the response *only when the badge fires*. On the other 362 days, leave headers untouched so Pages' default long cache stands.

## Open

- Multiple presets sharing a date: not possible today, but pick the first if/when it happens.
- Badge copy & styling: implementer call. Keep it consistent with the existing `.other-days` chip aesthetic (italic Fraunces, pill border).
- Timezone: middleware uses UTC like the rest of the server-side resolver. Users in extreme offsets see the badge ~12h early/late by their local clock. Acceptable; revisit as a unified question if it ever matters.
