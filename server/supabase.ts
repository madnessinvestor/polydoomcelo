import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase Config Missing! Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment secrets.");
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);
