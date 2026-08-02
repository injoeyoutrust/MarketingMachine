# Campaign Engine

A small local tool that runs the Mirror-Not-Convince campaign framework
against Claude: paste a completed client intake, get back a full launch-ready
kit — four ad sets, opt-in page, thank-you page, VSL, SMS sequence, email
sequence, 12-week ops plan, and an honest flag sheet.

The system prompt (`src/lib/systemPrompt.ts`) is reverse-engineered from a
real client build and encodes the framework directly: extract from the
intake, one central reframe repeated everywhere, the 5-beat atom (Hook /
Mirror / Shift / Proof / CTA), and a deduplication pass so Proof and CTA
lines don't get pasted identically across ad sets — the same underlying facts
and action have to be re-worded every time.

## Setup

1. Copy the env template and fill it in:

   ```bash
   cp .env.local.example .env.local
   ```

   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com).
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase
     project's **Project Settings → API Keys** (use the `service_role` /
     `secret` key — never the anon/publishable one, since this is only ever
     read server-side).

2. Install dependencies (already done if you're reading this after the
   initial scaffold):

   ```bash
   npm install
   ```

3. Apply the database schema (first time only — see "Database" below).

4. Run it:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Fill the intake** — 24 fields grouped into sections (Business, Offer,
   Avatar, Market Language, Brand Voice, Goals). Blank fields don't get
   invented around; they show up on the flag sheet instead.
2. **Choose styles** — pick as many Ad Copy / Video Ad Copy angles as you
   want (one ad set gets written per angle selected), one Funnel Copy style
   to shape the opt-in and thank-you pages, and one VSL style for the
   centerpiece video (used only if the funnel style actually includes one).
3. **Generate** — the server route at `src/app/api/generate/route.ts` sends
   the intake plus an ANGLE BRIEF, FUNNEL BRIEF, and VSL BRIEF to Claude,
   forcing a structured tool call (`deliver_campaign_kit`) so the response
   comes back as clean JSON instead of prose you'd have to parse by hand.
4. **Review** — results render in tabs (Extraction, Ad Sets, Opt-in,
   Thank-You, VSL, SMS, Email, Ops Plan, Flags), each field with its own copy
   button. Runs save to Supabase and list in the sidebar.

### Style library

Click **🎨 Style library** in the sidebar to manage three catalogs:

- 12 built-in ad angles (Identity mirror, Failed-alternative mirror,
  Myth-buster, Cost of inaction, plus 8 more), 10 built-in funnel styles, and
  10 built-in VSL styles ship pre-seeded — see `src/lib/styleLibrary.ts`.
- **Add your own** — name it, describe its mechanism, done.
- **Attach reference material** to any style — paste an ad transcript or
  sales letter, or upload a funnel screenshot. When that style is selected
  for a run, the reference gets sent to Claude (screenshots go in as real
  image content, not OCR'd text) with explicit instructions to mimic the
  *technique* — pacing, structure, where the hook lands — never to copy the
  wording. This is enforced in the prompt, not just suggested; see the
  "REFERENCE MATERIAL" section of `systemPrompt.ts`.
- Reference examples are stored as JSON in the `styles.examples` column in
  Supabase — screenshots go in base64-encoded, so keep uploads reasonably
  sized.

## Database (Supabase)

Two tables, defined in `supabase/migrations/20260802000000_init_schema.sql`:

- `styles` — the ad angle / funnel style / VSL style catalog, including any
  reference examples attached to each.
- `campaign_runs` — every generated kit, with the intake, selected styles,
  and full output JSON.

All access goes through the Next.js API routes under `src/app/api/styles/`
and `src/app/api/runs/`, using the service role key server-side
(`src/lib/supabaseServer.ts`). The browser never talks to Supabase directly,
so RLS is enabled on both tables with no public policies — the anon key
could never read or write them even if it leaked.

**Applying the schema to a new/different Supabase project:**

```bash
supabase link --project-ref <your-project-ref> -p "<db-password>"
supabase db push -p "<db-password>"
```

The database password is only needed for this one-time step — the running
app never uses it, only `SUPABASE_SERVICE_ROLE_KEY`. Reset it anytime from
**Project Settings → Database → Reset database password** if you don't have
it handy; nothing else depends on the old value.

## Editing the framework

Everything about *how* the engine writes lives in two files:

- `src/lib/systemPrompt.ts` — the rules (voice, the 5-beat atom, hard rules,
  the deduplication pass).
- `src/lib/toolSchema.ts` — the exact shape of what comes back. If you add a
  new asset type, add it here and to `src/lib/types.ts`, then render it in
  `src/components/ResultsTabs.tsx`.

If outputs start feeling repetitive again (identical Proof or CTA lines
across ad sets), that's almost always the dedup instruction in the prompt not
being followed strongly enough — tighten the language in `STEP 4` of
`systemPrompt.ts` before touching anything else.
