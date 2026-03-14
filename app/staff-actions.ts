"use server"

import { getSession } from "./actions"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function getStaffList() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data: user } = await supabase.from('users').select('organization_id').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "No org" };

    const { data: staff, error } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', user.organization_id)
        .in('role', ['owner', 'admin', 'staff'])
        .order('created_at', { ascending: false });

    if (error) return { success: false, error: error.message };

    return { success: true, data: staff };
}

export async function createStaff(data: { full_name: string, email: string, phone?: string, role: 'staff' | 'admin' }) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data: user } = await supabase.from('users').select('organization_id').eq('clerk_id', userId).single();
    if (!user) return { success: false, error: "User not found" };

    // Generate a placeholder Clerk ID
    const placeholderId = `pending_${crypto.randomUUID()}`;

    const { data: newStaff, error } = await supabase
        .from('users')
        .insert({
            organization_id: user.organization_id,
            clerk_id: placeholderId,
            email: data.email,
            full_name: data.full_name,
            role: data.role,
            // phone: data.phone // Assuming users table has phone? If not, ignore for now or add column. 
            // We checked schema earlier, users table has: clerk_id, email, full_name, role, org_id. 
            // Phone is likely not there yet. We can update schema or skip phone.
            // Let's check update_settings_schema.sql or others. 
            // Actually, customers table has phone. Users table usually doesn't in simple schemas unless added.
            // Let's skip phone for users table insert to avoid error, or check if we added it.
        })
        .select()
        .single();

    if (error) {
        console.error("Create staff error:", error);
        return { success: false, error: error.message };
    }

    // Varsayılan çalışma takvimi ekle: Pazartesi(1) - Cumartesi(6), 09:00-18:00
    const defaultSchedules = [1, 2, 3, 4, 5, 6].map(day => ({
        organization_id: user.organization_id,
        user_id: newStaff.id,
        day_of_week: day,
        start_time: '09:00:00',
        end_time: '18:00:00',
        is_working_day: true,
    }))
    await supabase.from('staff_schedules').insert(defaultSchedules)

    revalidatePath('/settings');
    return { success: true, data: newStaff };
}

export async function updateStaff(id: string, data: { full_name: string, role: string }) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { error } = await supabase
        .from('users')
        .update({
            full_name: data.full_name,
            role: data.role
        })
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/settings');
    return { success: true };
}

export async function deleteStaff(id: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    // Soft delete or Hard delete?
    // Hard delete for now, but check if appointments exist.
    // If appointments exist, maybe restrict? 
    // Or just set role to 'inactive'? 
    // Let's try hard delete, Supabase might block if FK exists (appointments).

    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

    if (error) {
        // Likely FK violation
        return { success: false, error: "Çalışanın geçmiş randevuları olduğu için silinemiyor. Lütfen pasife alın." };
    }

    revalidatePath('/settings');
    return { success: true };
}
