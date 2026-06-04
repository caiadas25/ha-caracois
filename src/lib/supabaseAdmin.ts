import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Server-only Supabase client for admin pages/actions. This must never be used
 * in Client Components because the service role key bypasses RLS.
 */
export const supabaseAdmin = serviceRoleKey
  ? createClient(SUPABASE_URL, serviceRoleKey, {
      auth: { persistSession: false },
    })
  : null;
