
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Service Role Key in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFlow() {
    console.log("🚀 Starting System Flow Test for Dental Industry...");

    // 1. Pick an organization (asista diş)
    const orgId = '93d1dc3a-119c-4895-b9a6-1fe2aa713c81';

    const { data: org, error: orgErr } = await supabase.from('organizations').select('*').eq('id', orgId).single();
    if (orgErr || !org) {
        console.error("❌ Organization not found:", orgErr);
        return;
    }
    console.log(`✅ Found Org: ${org.name} (${org.industry_type})`);

    // 2. Find Instructor
    const { data: instructor } = await supabase.from('users').select('*').eq('organization_id', orgId).eq('role', 'owner').single();
    if (!instructor) {
        console.error("❌ No instructor/owner found");
        return;
    }
    console.log(`✅ Found Instructor: ${instructor.full_name}`);

    // 3. Create Patient
    const patientName = "Mert TestHasta " + Math.floor(Math.random() * 1000);
    const { data: patient, error: patientErr } = await supabase.from('customers').insert({
        organization_id: orgId,
        name: patientName,
        phone: "5550009988",
        email: "mert@test.com"
    }).select().single();
    if (patientErr) { console.error("❌ Patient error:", patientErr); return; }
    console.log(`✅ Created Patient: ${patient.name}`);

    // 4. Create Package (Corrected Columns)
    const { data: pkg, error: pkgErr } = await supabase.from('packages').insert({
        organization_id: orgId,
        name: "Diş İmplant Paketi " + Math.floor(Math.random() * 100),
        price: 15000,
        sessions: 3,
        credits: 3,
        active: true,
        type: 'private', // satisfies DB constraint for now
        duration_minutes: 60
    }).select().single();
    if (pkgErr) { console.error("❌ Package error:", pkgErr); return; }
    console.log(`✅ Created Package: ${pkg.name}`);

    // 5. Sell Package
    const { data: sale, error: saleErr } = await supabase.from('customer_packages').insert({
        organization_id: orgId,
        customer_id: patient.id,
        package_id: pkg.id,
        package_name: pkg.name,
        initial_credits: pkg.credits,
        remaining_credits: pkg.credits,
        price_paid: pkg.price,
        status: 'active'
    }).select().single();
    if (saleErr) { console.error("❌ Sale error:", saleErr); return; }
    console.log(`✅ Package assigned to patient.`);

    // 6. Create Session
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const { data: session, error: sessionErr } = await supabase.from('class_sessions').insert({
        organization_id: orgId,
        instructor_id: instructor.id,
        service_id: 'treatment',
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
        capacity: 1
    }).select().single();
    if (sessionErr) { console.error("❌ Session error:", sessionErr); return; }
    console.log(`✅ Created Appointment Slot.`);

    // 7. Create Appointment
    const { data: appointment, error: apptErr } = await supabase.from('appointments').insert({
        organization_id: orgId,
        customer_id: patient.id,
        staff_id: instructor.id,
        service_id: 'treatment',
        start_time: tomorrow.toISOString(),
        end_time: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'confirmed',
        session_id: session.id
    }).select().single();
    if (apptErr) { console.error("❌ Appointment error:", apptErr); return; }
    console.log(`✅ Appointment confirmed.`);

    console.log("\n✨ FLOW TEST SUCCESSFUL!");
}

testFlow();
