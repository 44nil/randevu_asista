import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkOrganizations() {
  console.log('🔍 Checking current organizations...')
  
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('📊 Current organizations:')
  organizations?.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name}`)
    console.log(`   ID: ${org.id}`)
    console.log(`   Subdomain: ${org.subdomain}`)
    console.log(`   Industry: ${org.industry_type}`)
    console.log(`   Has slug: ${org.slug || 'No slug yet'}`)
    console.log('')
  })
  
  return organizations
}

async function generateAndSetSlugs(organizations: any[]) {
  console.log('🏷️ Generating and setting slugs for organizations...')
  
  for (const org of organizations) {
    // Generate slug from subdomain or name
    let slug = (org.subdomain || org.name).toLowerCase()
      .replace(/[^a-z0-9ğüşıöçA-ZĞÜŞIİÖÇ\s-]/g, '') // Remove special characters except Turkish
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    // Clean up common issues in subdomains
    slug = slug.replace(/-\d+$/, '') // Remove trailing numbers like -380, -705
    
    console.log(`Would update ${org.name} with slug: ${slug}`)
  }
  
  console.log('\n📝 SQL Commands to run in Supabase Dashboard:')
  console.log('-- First add the column:')
  console.log('ALTER TABLE organizations ADD COLUMN slug VARCHAR(50);')
  console.log('\n-- Then update each organization:')
  
  for (const org of organizations) {
    let slug = (org.subdomain || org.name).toLowerCase()
      .replace(/[^a-z0-9ğüşıöçA-ZĞÜŞIİÖÇ\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/-\d+$/, '')
    
    console.log(`UPDATE organizations SET slug = '${slug}' WHERE id = '${org.id}'; -- ${org.name}`)
  }
  
  console.log('\n-- Finally add unique constraint:')
  console.log('ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);')
}

async function main() {
  console.log('🚀 Starting safe migration process...\n')
  
  // Step 1: Check current organizations
  const organizations = await checkOrganizations()
  if (!organizations) return
  
  // Step 2: Generate SQL commands for manual execution
  await generateAndSetSlugs(organizations)
  
  console.log('\n✨ SQL commands generated! Copy and paste them in Supabase SQL Editor.')
  console.log('🔗 Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
}

main().catch(console.error)