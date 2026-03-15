import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testSubdomainQuery() {
  console.log('🧪 Testing subdomain query for: asista-di--380')
  
  // Test exact query from page.tsx
  const { data: business, error } = await supabaseAdmin
    .from('organizations')
    .select(`
      id,
      name,
      industry_type,
      settings
    `)
    .eq('subdomain', 'asista-di--380')
    .single()
  
  if (error) {
    console.error('❌ Query error:', error)
  } else {
    console.log('✅ Query result:', business)
  }
  
  // Also check all organizations with "asista" in name
  const { data: allOrgs, error: allError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, subdomain')
    .ilike('name', '%asista%')
  
  if (allError) {
    console.error('❌ Error checking asista orgs:', allError)
  } else {
    console.log('📋 Asista organizations:')
    allOrgs?.forEach(org => {
      console.log(`- ${org.name}: subdomain="${org.subdomain}"`)
    })
  }
}

testSubdomainQuery().catch(console.error)