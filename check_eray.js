const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEray() {
    console.log("Searching for organization 'eray%'...");

    // 1. Check Organization
    const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .ilike('name', '%eray%');

    if (orgError) console.error("Org Error:", orgError);
    console.log("Found Orgs:", orgs);

    if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;

        // 2. Check User linked to this org
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('organization_id', orgId);

        if (userError) console.error("User Error:", userError);
        console.log("Linked Users:", users);

        // 3. Check Services linked to this org
        const { data: services, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('organization_id', orgId);

        if (serviceError) console.error("Service Error:", serviceError);
        console.log("Linked Services Count:", services ? services.length : 0);
        if (services && services.length > 0) console.log("First Service:", services[0]);
    } else {
        // Check if there is a pending user with 'eray' in email/name?
        const { data: pendingUsers } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
        console.log("Recent 5 Users (to see if user exists but not linked):", pendingUsers);
    }
}

checkEray();
