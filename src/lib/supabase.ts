import { createClient } from "@supabase/supabase-js";

// O URL e a chave "publishable" do Supabase são públicos por definição — são
// incluídos no bundle do browser e a tabela está protegida por RLS. Por isso,
// usamos as variáveis de ambiente quando existem (recomendado, ex.: na Vercel)
// e, caso contrário, recorremos a estes valores por omissão para a app
// funcionar imediatamente.
const FALLBACK_SUPABASE_URL = "https://wmjbifxydtgkpchqcqou.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "sb_publishable_y8NBkx3QA54Ex1G-yheKWQ_D6at11zm";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase partilhado. A tabela `caracois_spots` tem RLS com leitura e
 * inserção públicas (anon), por isso não é necessária autenticação.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export const SPOTS_TABLE = "caracois_spots";
