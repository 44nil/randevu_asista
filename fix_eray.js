const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEray() {
    console.log("Fixing Eray-kuafor...");

    // 1. Get Org
    const { data: org } = await supabase.from('organizations').select('id').eq('subdomain', 'eray-kuafor').single();
    if (!org) { console.log('Org not found'); return; }
    console.log('Org Found:', org.id);

    // 2. Find User (Pending one, created recently)
    // We assume the verified user is the one without org_id
    // But wait, we don't know the exact user ID from here easily without listing.
    // Let's list users created recently.
    const { data: users } = await supabase
        .from('users')
        .select('*')
        .is('organization_id', null)
        .order('created_at', { ascending: false })
        .limit(1);

    if (!users || users.length === 0) { console.log('No pending user found'); return; }
    const user = users[0];
    console.log('Found Pending User:', user.email);

    // 3. Link User
    const { error: updateError } = await supabase
        .from('users')
        .update({ organization_id: org.id, role: 'owner' })
        .eq('id', user.id);

    if (updateError) console.error("Update Error:", updateError);
    else console.log("User Linked!");

    // 4. Add Services (Hair Salon)
    const services = [
        { name: 'Saç Kesimi', duration_minutes: 45, price: 500, color: '#fbbf24', category: 'Saç', organization_id: org.id },
        { name: 'Fön', duration_minutes: 30, price: 200, color: '#facc15', category: 'Saç', organization_id: org.id },
        { name: 'Saç Boyama', duration_minutes: 120, price: 1500, color: '#a855f7', category: 'Saç', organization_id: org.id },
        { name: 'Gelin Başı', duration_minutes: 180, price: 5000, color: '#ec4899', category: 'Özel', organization_id: org.id },
        { name: 'Keratin Bakım', duration_minutes: 90, price: 2500, color: '#10b981', category: 'Bakım', organization_id: org.id }
    ];

    const { error: serviceError } = await supabase.from('services').insert(services);
    if (serviceError) console.error("Service Error:", serviceError);
    else console.log("Services Added!");
}

fixEray();
