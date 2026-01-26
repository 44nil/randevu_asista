const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log("Checking Users table structure...");
    const { data: users, error: uErr } = await supabase.from('users').select('*').limit(1);
    if (users && users.length > 0) {
        console.log("Users Columns:", Object.keys(users[0]));
    } else {
        console.log("Users table empty or error:", uErr);
    }

    console.log("Checking Organizations table structure...");
    const { data: orgs, error: oErr } = await supabase.from('organizations').select('*').limit(1);
    if (orgs && orgs.length > 0) {
        console.log("Organizations Columns:", Object.keys(orgs[0]));
    } else {
        console.log("Organizations table empty or error:", oErr);
    }

    console.log("Checking Services table structure...");
    const { data: services, error: sErr } = await supabase.from('services').select('*').limit(1);
    if (services && services.length > 0) {
        console.log("Services Columns:", Object.keys(services[0]));
    } else {
        console.log("Services table empty or error:", sErr);
    }
}

checkSchema();
