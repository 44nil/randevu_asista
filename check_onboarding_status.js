
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
    console.log("--- Son Organizasyonlar ---");
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (orgError) console.error(orgError);
    else console.log(orgs);

    if (orgs && orgs.length > 0) {
        const latestOrgId = orgs[0].id;
        console.log("\n--- Servisler (Son Org İçin) ---");
        const { data: services, error: srvError } = await supabase
            .from('services')
            .select('*')
            .eq('organization_id', latestOrgId);

        if (srvError) console.error(srvError);
        else console.log(`Toplam Servis Sayısı: ${services.length}`);
        if (services.length > 0) console.log(services.map(s => s.name));

        console.log("\n--- Users (Son Org Yönetimi) ---");
        const { data: users, error: usrError } = await supabase
            .from('users')
            .select('id, full_name, email, role, organization_id')
            .eq('organization_id', latestOrgId);

        if (usrError) console.error(usrError);
        else console.log(users);
    }
}

checkStatus();
