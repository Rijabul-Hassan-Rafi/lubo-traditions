import { createClient } from "@supabase/supabase-js";

let client;
export function supabaseBrowser() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase public environment variables are missing.");
    client = createClient(url, key);
  }
  return client;
}
