'use server'

import { getSession } from "@/app/actions";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getOrgId(userId: string): Promise<string | null> {
    const { data } = await supabaseAdmin.from('users').select('organization_id').eq('clerk_id', userId).single();
    return data?.organization_id ?? null;
}

export async function getOrganizationSettings() {
    noStore();
    const { userId } = await getSession();
    if (!userId) return { success: false, data: null, error: 'Unauthorized' };
    const orgId = await getOrgId(userId);
    if (!orgId) return { success: false, error: 'No org' };
    const { data, error } = await supabaseAdmin.from('organizations').select('*').eq('id', orgId).single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: { organization: data } };
}

export async function updateOrganizationSettings(data: {
    name: string;
    phone: string;
    email: string;
    address: string;
    industry_type?: string;
    logo_url?: string;
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: 'Unauthorized' };
    const orgId = await getOrgId(userId);
    if (!orgId) return { success: false, error: 'No org' };
    const { error } = await supabaseAdmin.from('organizations').update({
        name: data.name, phone: data.phone, email: data.email, address: data.address,
        ...(data.industry_type ? { industry_type: data.industry_type } : {}),
        ...(data.logo_url ? { logo_url: data.logo_url } : {}),
    }).eq('id', orgId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function updateConfiguration(settings: any) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: 'Unauthorized' };
    const orgId = await getOrgId(userId);
    if (!orgId) return { success: false, error: 'No org' };
    const { error } = await supabaseAdmin.from('organizations').update({ settings }).eq('id', orgId);
    if (error) return { success: false, error: error.message };
    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function getWorkingHours(): Promise<Record<string, { isOpen: boolean; open: string; close: string }> | null> {
    noStore();
    const { userId } = await getSession();
    if (!userId) return null;
    const orgId = await getOrgId(userId);
    if (!orgId) return null;
    const { data } = await supabaseAdmin.from('organizations').select('settings').eq('id', orgId).single();
    return data?.settings?.working_hours ?? null;
}
