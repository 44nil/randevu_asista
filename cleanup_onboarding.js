
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://okclyiptmwsqztgjojii.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo";

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanUp() {
    console.log("Cleaning up 'eray-kuafor'...");

    // 1. Önce users tablosundaki organization_id bağını kopar (varsa)
    const { output, error: userUpdateError } = await supabase
        .from('users')
        .update({ organization_id: null, role: 'customer' })
        .eq('email', 'esranil@gmail.com'); // Tahmini email, hata vermez

    // 2. Organizasyonu sil
    const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('subdomain', 'eray-kuafor');

    if (error) console.error("Error deleting org:", error);
    else console.log("Organization deleted successfully.");
}

cleanUp();
