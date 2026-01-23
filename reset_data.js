
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetData() {
    console.log("Resetting data for Esra Nil...");

    // 1. Get Customer ID
    const { data: customers } = await supabase.from('customers').select('id').ilike('name', '%Esra Nil%');
    const customerId = customers[0]?.id;

    if (!customerId) {
        console.log("Customer not found");
        return;
    }

    console.log(`Found Customer ID: ${customerId}`);

    // 2. Delete ALL Appointments
    const { error: delError } = await supabase
        .from('appointments')
        .delete()
        .eq('customer_id', customerId);

    if (delError) {
        console.error("Error deleting appointments:", delError);
        return;
    }
    console.log("✅ All appointments deleted.");

    // 3. Reset Package Credits to 10
    const { error: updateError } = await supabase
        .from('customer_packages')
        .update({
            remaining_credits: 10,
            initial_credits: 10
        })
        .eq('customer_id', customerId)
        .eq('status', 'active');

    if (updateError) {
        console.error("Error resetting package:", updateError);
        return;
    }
    console.log("✅ Package credits reset to 10/10.");
}

resetData();
