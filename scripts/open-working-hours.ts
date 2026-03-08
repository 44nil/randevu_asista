
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function openWorkingHours() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: orgs } = await supabase.from('organizations').select('*');

    if (!orgs) return;

    for (const org of orgs) {
        const settings = org.settings || {};
        const working_hours = settings.working_hours || {};

        // Open Sat and Sun
        working_hours.saturday = { isOpen: true, open: "09:00", close: "18:00" };
        working_hours.sunday = { isOpen: true, open: "09:00", close: "18:00" };

        const { error } = await supabase
            .from('organizations')
            .update({ settings: { ...settings, working_hours } })
            .eq('id', org.id);

        if (error) console.error(`Error updating org ${org.id}:`, error);
        else console.log(`Successfully opened Sat/Sun for org ${org.id}.`);
    }
}

openWorkingHours();
