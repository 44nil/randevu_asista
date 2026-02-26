import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side singleton
export const supabase = createClient(supabaseUrl, supabaseKey)

// Server-side / Auth-aware client
export const createSupabaseClient = async (clerkToken?: string) => {
    const options = clerkToken
        ? {
            global: {
                headers: {
                    Authorization: `Bearer ${clerkToken}`,
                },
            },
        }
        : {}

    return createClient(supabaseUrl, supabaseKey, options)
}
