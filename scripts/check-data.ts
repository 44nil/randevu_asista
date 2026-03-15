import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkData() {
  console.log('📊 Checking data for booking system...\n')
  
  // Check organizations
  const { data: organizations, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    
  if (orgError) {
    console.error('❌ Error fetching organizations:', orgError)
    return
  }
  
  console.log(`Found ${organizations?.length || 0} organizations:`)
  organizations?.forEach((org) => {
    console.log(`- ${org.name} (${org.subdomain})`)
  })
  
  // Check services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    
  if (servicesError) {
    console.error('❌ Error fetching services:', servicesError)
  } else {
    console.log(`\nFound ${services?.length || 0} services:`)
    services?.forEach((service) => {
      console.log(`- ${service.name} (${service.price}₺, ${service.duration}min) - Org: ${service.organization_id}`)
    })
  }
  
  // Check staff
  const { data: staff, error: staffError } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'staff')
    
  if (staffError) {
    console.error('❌ Error fetching staff:', staffError)
  } else {
    console.log(`\nFound ${staff?.length || 0} staff members:`)
    staff?.forEach((member) => {
      console.log(`- ${member.full_name} - Org: ${member.organization_id}`)
    })
  }
}

checkData().catch(console.error)