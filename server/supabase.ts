import { createClient } from "@supabase/supabase-js";

// Prioritize Secrets, then Env Vars
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase Config Missing:", { url: !!supabaseUrl, key: !!supabaseKey });
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
