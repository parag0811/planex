import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    const error = new Error(
      "Avatar storage is not configured. Please contact support.",
    ) as AppError;
    error.status = 503;
    throw error;
  }

  if (!supabase) {
    supabase = createClient(url, serviceKey);
  }

  return supabase;
};
