/* eslint-disable @typescript-eslint/no-explicit-any --
   No `supabase gen types` step in this project, so there's no generated
   Database type to hand to the client generics. Table shapes are enforced
   instead by the mapper functions in dbMappers.ts. */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key, which bypasses RLS — this
// must never be imported from a "use client" component or exposed to the
// browser. All Supabase access happens through Next.js API routes.
let cached: SupabaseClient<any, any, any> | null = null;

export function supabaseServer(): SupabaseClient<any, any, any> {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Add them to .env.local and restart the dev server."
    );
  }

  cached = createClient<any, any, any>(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}
