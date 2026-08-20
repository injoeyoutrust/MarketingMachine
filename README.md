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

1. **Fill the intake** — three modes, toggled at the top of the form:
   - **Quick idea** — type a sentence or two describing the ad concept, then
     pick angles/funnel/VSL style same as full intake. The engine extracts
     what it can and flags the rest (proof numbers, offer name, pricing —
     anything it can't know) instead of inventing plausible-sounding facts.
   - **Pure push** — one click, all the way through. Your concept skips
     angle selection entirely and becomes the campaign's one and only
     angle — the model's job is to fit it into Hook/Mirror/Shift/Proof/CTA
     as faithfully as possible, not remap it onto a library technique. Uses
     the default funnel/VSL style so there's no second screen.
   - **Full intake** — 24 fields grouped into sections (Business, Offer,
     Avatar, Market Language, Brand Voice, Goals). More input, fewer flags.
   Every mode: blank fields don't get invented around; they show up on the
   flag sheet instead.
2. **Choose styles** (Quick idea / Full intake only — Pure push skips this) —
   pick as many Ad Copy / Video Ad Copy angles as you want (one ad set gets
   written per angle selected), an **emotional tone per angle** (each ad can
   carry its own single emotional register — see below), one Funnel Copy
   style to shape the opt-in and thank-you pages, and one VSL style for the
   centerpiece video (used only if the funnel style actually includes one).
3. **Generate** — the server route at `src/app/api/generate/route.ts` sends
   the intake plus an ANGLE BRIEF, FUNNEL BRIEF, and VSL BRIEF to Claude,
   forcing a structured tool call (`deliver_campaign_kit`) so the response
   comes back as clean JSON instead of prose you'd have to parse by hand.
4. **Review** — results render in tabs (Extraction, Ad Sets, Opt-in,
   Thank-You, VSL, SMS, Email, Ops Plan, Flags), each field with its own copy
   button. Runs save to Supabase and list in the sidebar.

### Style library

Click **🎨 Style library** in the sidebar to manage four catalogs:

- 12 built-in ad angles (Identity mirror, Failed-alternative mirror,
  Myth-buster, Cost of inaction, plus 8 more), 10 built-in funnel styles, 10
  built-in VSL styles, and 17 built-in emotional-tone states ship pre-seeded
  — see `src/lib/styleLibrary.ts`.

### Emotional tone (per ad angle)

Each ad angle you select in step 2 gets its own emotional-tone dropdown —
one of 17 states adapted from David Hawkins' Map of Consciousness (Shame
through Enlightenment; used as a creative/tonal reference, not a scientific
claim). Whatever's picked saturates that entire ad — hook, mirror, shift,
proof, cta all written from inside that one state's real interior
monologue — so the same angle can produce genuinely different ads depending
on the tone (e.g. "Cost of inaction" written from Grief reads mournful and
resigned; the same angle from Anger reads frustrated and comparison-driven).
No backend changes were needed for this — the choice gets baked directly
into that angle's brief text client-side
(`withEmotion()` in `src/app/page.tsx`), reusing the same pipeline that
already treats each angle's description as its writing instructions.
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
