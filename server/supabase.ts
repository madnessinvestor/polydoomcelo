import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://yidsvyvlykdtxjpyhwip.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_secret_35TZ7hJmm_1gKe2ysyX03w_Ir7KIxT-";

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase Config Missing!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
