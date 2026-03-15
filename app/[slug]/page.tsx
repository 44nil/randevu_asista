import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { BookingPage } from '@/components/booking/booking-page'

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicBookingPage({ params }: BookingPageProps) {
  const { slug } = await params
  

  
  // Find business by slug (using organizations table during migration)
  // Note: slug column doesn't exist yet, so we'll use subdomain for now
  const { data: business, error } = await supabaseAdmin
    .from('organizations')
    .select(`
      id,
      name,
      industry_type,
      settings
    `)
    .eq('subdomain', slug)
    .single()

  if (!business || error) {
    notFound()
  }

  // Get services for this business
  const { data: services, error: servicesError } = await supabaseAdmin
    .from('services')
    .select('*')
    .eq('organization_id', business.id)
    .eq('active', true)
    .order('name')



  // Get staff for this business
  const { data: staff, error: staffError } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .eq('organization_id', business.id)
    .eq('role', 'staff')
    .order('full_name')



  return (
    <BookingPage 
      business={business}
      services={services || []}
      staff={staff || []}
    />
  )
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BookingPageProps) {
  const { slug } = await params
  
  const { data: business } = await supabaseAdmin
    .from('organizations')
    .select('id, name, industry_type')
    .or(`slug.eq.${slug},subdomain.eq.${slug}`)
    .single()

  if (!business) {
    return {
      title: 'İşletme Bulunamadı'
    }
  }

  return {
    title: `Randevu Al | ${business.name}`,
    description: `${business.name} için online randevu alın. Hızlı ve kolay rezervasyon.`
  }
}