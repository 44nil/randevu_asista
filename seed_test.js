const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function seed() {
  // 1. Get Org
  const { data: orgData } = await supabase.from('users').select('id, organization_id').eq('email', 'asista.yazilim@gmail.com').single()
  if (!orgData?.organization_id) return console.error('Org not found')
  const orgId = orgData.organization_id

  // 2. Insert Treatment (Package)
  const { data: pkg, error: pkgErr } = await supabase.from('packages').insert({
    organization_id: orgId,
    name: 'Kanal Tedavisi',
    price: 2500,
    credits: 1,
    sessions: 1,
    validity_days: 365,
    type: 'group',
    duration_minutes: 60,
    active: true
  }).select().single()
  if (pkgErr) return console.error('Pkg error:', pkgErr)

  // 3. Insert Patient (Customer)
  const { data: customer, error: custErr } = await supabase.from('customers').insert({
    organization_id: orgId,
    name: 'Ahmet Yılmaz',
    phone: '5551234567',
    email: 'ahmet@test.com'
  }).select().single()
  if (custErr) return console.error('Customer error:', custErr)

  // 4. Insert Class Session (The calendar groups appointments by session)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0)

  const endTime = new Date(tomorrow)
  endTime.setHours(15, 0, 0, 0)

  const { data: sessionData, error: sessionErr } = await supabase.from('class_sessions').insert({
    organization_id: orgId,
    instructor_id: orgData.id,
    service_id: pkg.id,
    start_time: tomorrow.toISOString(),
    end_time: endTime.toISOString(),
    capacity: 1 // Private/Single treatment capacity
  }).select().single()

  if (sessionErr) return console.error('Session error:', sessionErr)

  // 5. Insert Appointment (Booking inside the session)
  const { data: appt, error: apptErr } = await supabase.from('appointments').insert({
    organization_id: orgId,
    customer_id: customer.id,
    session_id: sessionData.id,
    service_id: pkg.id,
    start_time: tomorrow.toISOString(),
    end_time: endTime.toISOString(),
    status: 'confirmed'
  }).select().single()

  if (apptErr) return console.error('Appt error:', apptErr)

  console.log('SUCCESS! Created patient, treatment, and appointment.')
}

seed()
