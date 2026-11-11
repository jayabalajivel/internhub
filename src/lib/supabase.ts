import { createClient, SupabaseClient } from "@supabase/supabase-js"

const rawUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  "https://csjbfxfgljeblwnkkthw.supabase.co"
).trim()
// Clean trailing slashes and /rest/v1 suffixes if mistakenly entered
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "")
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_dropMxjYFutDCToWTPEOZg_CG-T0znd"
).trim()

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    supabaseUrl !== "https://your-supabase-project.supabase.co" &&
    supabaseAnonKey !== "your-anon-key-here" &&
    !supabaseUrl.includes("dwsyhwabwgoslkqtytti.supabase.co")
  )
}

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
