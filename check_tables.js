
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    // There isn't a direct "list tables" in JS client easily without SQL editor access, 
    // but we can try to query information_schema or just try to insert/select to confirm.
    // However, since we got a specific error about "schema cache", maybe we just need to try again or the table really doesn't exist.

    // Let's try to query 'packages' first to see if connection works at all.
    const { data: p, error: pErr } = await supabase.from('packages').select('id').limit(1);
    console.log("Packages Table Check:", p, pErr);

    const { data: cp, error: cpErr } = await supabase.from('customer_packages').select('id').limit(1);
    console.log("Customer Packages Table Check:", cp, cpErr);
}

checkTables();
