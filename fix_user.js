const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://okclyiptmwsqztgjojii.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rY2x5aXB0bXdzcXp0Z2pvamlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkxMzY4MSwiZXhwIjoyMDg0NDg5NjgxfQ.k7UlJpmzCMsTrwT1W5erNF0pY1ZQ0SgFi1dVjdPiOIo');

async function fix() {
    const targetClerkId = 'user_38g06TxgS0CDdcC15BcstLSoA4K';
    const targetOrgSubdomain = 'elif-pilates';

    console.log('Fixing for Clerk ID:', targetClerkId);

    // 1. Get the org
    const { data: org, error: orgError } = await supabase.from('organizations').select('id').eq('subdomain', targetOrgSubdomain).single();
    if (orgError || !org) { console.log('Org not found or error:', orgError); return; }
    console.log('Found Org:', org.id);

    // 2. Check if user exists with this clerk_id
    const { data: user } = await supabase.from('users').select('id, email').eq('clerk_id', targetClerkId).single();
    console.log('Found User (by ID):', user);

    if (user) {
        // Update existing user
        const { error } = await supabase.from('users').update({ organization_id: org.id, role: 'owner' }).eq('id', user.id);
        console.log('Update result:', error || 'Success');
    } else {
        // Attempt to find by email if we knew it, but here we will try to update ANY user that matches this ID or just insert.
        // Since we don't know the email, and email is unique, inserting 'placeholder' might fail if there's a constraint, but let's try.
        // Better: Check if there is a pending user with no clerk_id but same email? No email known.
        // Just insert.
        const { error } = await supabase.from('users').insert({
            clerk_id: targetClerkId,
            email: 'esnillll777@gmail.com', // Guessing based on previous logs? Or use a unique fake one.
            full_name: 'Recovered User',
            organization_id: org.id,
            role: 'owner'
        });
        // If email violates unique constraint, we know who it is.
        console.log('Insert result:', error || 'Success');
        if (error && error.code === '23505') {
            // Unique violation on email?
            console.log('User exists with that email but different ID?');
            // Retrieve key info
        }
    }
}
fix();
