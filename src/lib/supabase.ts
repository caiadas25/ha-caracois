import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurado.");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurado.");
}

export const SUPABASE_URL = supabaseUrl;

/**
 * Cliente Supabase partilhado. A tabela `caracois_spots` tem RLS com leitura
 * pública (anon); escritas públicas passam pelas rotas de API no servidor.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const SPOTS_TABLE = "caracois_spots";
export const SPOT_REQUESTS_TABLE = "caracois_spot_requests";
