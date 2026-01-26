const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log("Fetching all users...");

    // Select specific columns to be clean
    const { data: users, error } = await supabase
        .from('users')
        .select(`
            id, 
            email, 
            full_name, 
            role, 
            organization_id, 
            clerk_id
        `);

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log("Total Users found:", users.length);
    console.table(users);
}

checkUsers();
