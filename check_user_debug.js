
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Searching for 'Esra Nil'...");

    // 1. Find Users/Customers with that name
    const { data: customers, error: cErr } = await supabase
        .from('customers')
        .select('id, name, email, organization_id')
        .ilike('name', '%Esra Nil%');

    if (cErr) {
        console.error("Customer Error:", cErr);
        return;
    }

    console.log("Customers Found:", customers);

    for (const cust of customers) {
        console.log(`\nChecking Packages for Customer: ${cust.name} (${cust.id})`);

        const { data: packages, error: pErr } = await supabase
            .from('customer_packages')
            .select('*')
            .eq('customer_id', cust.id);

        if (pErr) console.error("Package Error:", pErr);
        else {
            console.log("Packages:", packages);

            // Check validation logic manually
            const valid = packages.filter(p =>
                p.status === 'active' &&
                p.remaining_credits > 0 &&
                (p.expiry_date === null || new Date(p.expiry_date) > new Date())
            );
            console.log("Valid Packages based on logic:", valid);
        }
    }
}

check();
