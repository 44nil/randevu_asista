'use server'

import { getSession } from "@/app/actions";
import { revalidatePath } from "next/cache";

export async function getOrganizationSettings() {
    const { userId } = await getSession();
    if (!userId) return { success: false, data: null, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No org" };
    }

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', userData.organization_id)
        .single();

    if (error) {
        console.error('Organization fetch error:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: { organization: data } };
}

export async function updateOrganizationSettings(data: {
    name: string,
    phone: string,
    email: string,
    address: string,
    industry_type?: string,
    logo_url?: string
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No org" };

    const { error } = await supabase
        .from('organizations')
        .update({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address: data.address,
            ...(data.industry_type ? { industry_type: data.industry_type } : {}),
            ...(data.logo_url ? { logo_url: data.logo_url } : {})
        })
        .eq('id', userData.organization_id);

    if (error) {
        console.error(error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true };
}

export async function updateConfiguration(settings: any) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No org" };

    // First get existing settings to merge? Or assume frontend sends full object?
    // Safer to merge properly or just update the column.
    // The settings column is JSONB.

    const { error } = await supabase
        .from('organizations')
        .update({
            settings: settings
        })
        .eq('id', userData.organization_id);

    if (error) {
        console.error(error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings');
    return { success: true };
}
