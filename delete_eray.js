const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteEray() {
    console.log("Cleaning up Eray-kuafor...");

    // 1. Find Org ID
    const { data: org } = await supabase.from('organizations').select('id').eq('subdomain', 'eray-kuafor').single();

    if (!org) {
        console.log("Organization not found, nothing to delete.");
        return;
    }

    console.log("Found Org ID:", org.id);

    // 2. Unlink any users attached to this org (set org_id to null)
    // This allows us to re-use the user if needed, or we can delete them too?
    // Let's just unlink so they can run onboarding again cleanly.
    const { error: unlinkError } = await supabase
        .from('users')
        .update({ organization_id: null, role: 'customer' })
        .eq('organization_id', org.id);

    if (unlinkError) console.error("Unlink Users Error:", unlinkError);
    else console.log("Users unlinked.");

    // 3. Delete Services (No cascade on table definition apparently)
    const { error: serviceError } = await supabase
        .from('services')
        .delete()
        .eq('organization_id', org.id);

    if (serviceError) console.error("Delete Services Error:", serviceError);
    else console.log("Services deleted.");

    // 4. Delete Organization
    const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', org.id);

    if (orgError) console.error("Delete Org Error:", orgError);
    else console.log("Organization deleted.");
}

deleteEray();
