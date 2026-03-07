const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase.from('users').select('*, organization:organizations(*)').eq('email', 'asista.yazilim@gmail.com')
  console.log(JSON.stringify({ data, error }, null, 2))
}
check()
