
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsage() {
    console.log("Checking appointments for Esra Nil...");

    // Get Customer ID
    const { data: customers } = await supabase.from('customers').select('id').ilike('name', '%Esra Nil%');
    const customerId = customers[0]?.id;

    if (!customerId) {
        console.log("Customer not found");
        return;
    }

    const { data: appointments } = await supabase
        .from('appointments')
        .select('id, start_time, status, service_id')
        .eq('customer_id', customerId)
        .in('status', ['confirmed', 'completed']);

    console.log(`Found ${appointments.length} appointments counting as usage:`);
    console.table(appointments);
}

checkUsage();
