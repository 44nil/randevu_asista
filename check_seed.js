const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: orgData } = await supabase.from('users').select('organization_id').eq('email', 'asista.yazilim@gmail.com').single()
  console.log("Org ID:", orgData?.organization_id)

  const { data: pkgs } = await supabase.from('packages').select('*').eq('name', 'Kanal Tedavisi')
  console.log("Packages:", pkgs)

  const { data: custs } = await supabase.from('customers').select('*').eq('name', 'Ahmet Yılmaz').order('created_at', { ascending: false }).limit(2)
  console.log("Customers:", custs)
}
check()
