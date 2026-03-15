import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testQuery() {
  console.log('🧪 Testing query for slug: asista-di--380')
  
  // Test exact query from page.tsx
  const { data: business, error } = await supabase
    .from('organizations')
    .select(`
      id,
      name,
      industry_type,
      settings
    `)
    .or(`slug.eq.asista-di--380,subdomain.eq.asista-di--380`)
    .single()
  
  if (error) {
    console.error('❌ Query error:', error)
  } else {
    console.log('✅ Query result:', business)
  }
  
  // Also test if slug column exists
  const { data: orgs, error: allError } = await supabase
    .from('organizations')
    .select('id, name, subdomain, slug')
    .limit(5)
  
  if (allError) {
    console.error('❌ Error checking columns:', allError)
  } else {
    console.log('📋 Sample organizations:')
    orgs?.forEach(org => {
      console.log(`- ${org.name}: subdomain="${org.subdomain}", slug="${org.slug || 'NULL'}"`)
    })
  }
}

testQuery().catch(console.error)