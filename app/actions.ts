'use server'

import { createSupabaseClient } from "@/lib/supabaseClient";
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getSession() {
    const { userId, getToken } = await auth();
    return { userId, getToken };
}

export const getUserProfile = cache(async () => {
    const { userId } = await getSession();
    if (!userId) return null;

    const supabase = supabaseAdmin;

    // 1. Try to find by Clerk ID
    let { data: profile } = await supabase.from('users').select('*').eq('clerk_id', userId).single();

    // 2. If not found by ID, but we have an email, try to find by email (Claim Account Logic)
    if (!profile) {
        // Only fetch current user from Clerk if we didn't find a profile by ID
        const { currentUser } = await import('@clerk/nextjs/server');
        const clerkUser = await currentUser();
        const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

        if (userEmail) {
            // Look for any user with this email (Staff or Customer placeholder)
            const { data: pendingProfile } = await supabase
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .single();

            if (pendingProfile) {

                // Link the pending account to the real Clerk ID
                const { data: updatedProfile, error } = await supabase
                    .from('users')
                    .update({
                        clerk_id: userId,
                    })
                    .eq('id', pendingProfile.id)
                    .select('*, organization:organizations(*)')
                    .single();

                if (!error) {
                    profile = updatedProfile;
                } else {
                    console.error("Failed to link account:", error);
                }
            } else {
                // FALLBACK: User doesn't exist at all, and webhook might have failed/been skipped locally
                const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || userEmail.split('@')[0];
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        clerk_id: userId,
                        email: userEmail,
                        full_name: fullName,
                        role: 'owner' // Make them an owner by default so they can create an org
                    })
                    .select()
                    .single();

                if (!createError) {
                    profile = newUser;
                } else {
                    console.error("Failed to fallback create user:", createError);
                }
            }
        }
    } else {
        // Fetch organization details for the found user
        const { data: profileWithOrg } = await supabase
            .from('users')
            .select('*, organization:organizations(*)')
            .eq('clerk_id', userId)
            .single();

        if (profileWithOrg) {
            profile = profileWithOrg;
        }
    }

    return profile;
});

export async function createOrganization(data: { name: string, industry: string, subdomain?: string }) {
    try {
        const { userId } = await getSession();
        if (!userId) return { success: false, error: "Unauthorized - No user ID" };

        const supabase = supabaseAdmin;

        // Subdomain otomatik üret (verilmezse işletme adından)
        const subdomain = data.subdomain ||
            data.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') +
            '-' + Math.floor(Math.random() * 9000 + 1000);

        // 1. Organizasyon oluştur
        const { data: org, error: orgError } = await supabase.from('organizations').insert({
            name: data.name,
            industry_type: data.industry,
            subdomain,
            settings: { sms_enabled: true }
        }).select().single();

        if (orgError) {
            console.error('Organization creation error:', orgError);
            if (orgError.code === '23505') {
                // Duplicate subdomain — yeniden dene farklı subdomain ile
                const subdomain2 = subdomain + '-' + Math.floor(Math.random() * 9000 + 1000);
                const { data: org2, error: orgError2 } = await supabase.from('organizations').insert({
                    name: data.name,
                    industry_type: data.industry,
                    subdomain: subdomain2,
                    settings: { sms_enabled: true }
                }).select().single();
                if (orgError2) return { success: false, error: "İşletme oluşturulamadı: " + orgError2.message };
                return await linkAndSeedOrg(supabase, userId, org2.id, data.industry);
            }
            return { success: false, error: "Organizasyon oluşturulamadı: " + orgError.message };
        }

        return await linkAndSeedOrg(supabase, userId, org.id, data.industry);

    } catch (error: any) {
        console.error('createOrganization error:', error);
        return { success: false, error: "Beklenmeyen hata: " + error.message };
    }
}

async function linkAndSeedOrg(supabase: any, userId: string, orgId: string, industry: string) {
    // 2. Kullanıcıyı owner olarak bağla
    const { error: userError } = await supabase.from('users').update({
        organization_id: orgId,
        role: 'owner'
    }).eq('clerk_id', userId);

    if (userError) {
        console.error('User update error:', userError);
        return { success: false, error: "Kullanıcı güncellenemedi: " + userError.message };
    }

    // 3. Default servisler ekle
    const defaultServices: Record<string, any[]> = {
        pilates: [
            { name: 'Reformer Pilates (Bireysel)', duration_minutes: 60, price: 750, color: '#fda4af', category: 'Ders' },
            { name: 'Mat Pilates (Grup)', duration_minutes: 60, price: 500, color: '#f0abfc', category: 'Ders' },
            { name: 'Deneme Dersi', duration_minutes: 45, price: 250, color: '#e2e8f0', category: 'Ders' },
        ],
        hair: [
            { name: 'Saç Kesimi', duration_minutes: 45, price: 500, color: '#fbbf24', category: 'Saç' },
            { name: 'Fön', duration_minutes: 30, price: 200, color: '#facc15', category: 'Saç' },
            { name: 'Saç Boyama', duration_minutes: 120, price: 1500, color: '#a855f7', category: 'Saç' },
            { name: 'Keratin Bakım', duration_minutes: 90, price: 2500, color: '#10b981', category: 'Bakım' },
        ],
        dental: [
            { name: 'Genel Muayene', duration_minutes: 30, price: 500, color: '#60a5fa', category: 'Muayene' },
            { name: 'Diş Temizliği', duration_minutes: 45, price: 800, color: '#34d399', category: 'Temizlik' },
            { name: 'Diş Çekimi', duration_minutes: 30, price: 600, color: '#f87171', category: 'Cerrahi' },
        ],
        general: [
            { name: 'Standart Randevu', duration_minutes: 60, price: 500, color: '#94a3b8', category: 'Genel' },
        ],
    };

    const services = defaultServices[industry] || defaultServices['general'];
    if (services.length > 0) {
        await supabase.from('services').insert(
            services.map((s: any) => ({ ...s, organization_id: orgId }))
        );
    }

    revalidatePath('/');
    return { success: true };
}

export async function createCustomer(data: any) {
    const { userId } = await getSession();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    const supabase = supabaseAdmin;

    // Get current user's organization
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (userError || !userData?.organization_id) {
        return { success: false, error: "Kullanıcının bir organizasyonu bulunamadı. Lütfen önce organizasyon oluşturun." };
    }

    const { error } = await supabase.from('customers').insert({
        organization_id: userData.organization_id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        metadata: data.metadata,
    });

    if (error) {
        console.error(error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

export async function getCustomers() {
    const { userId } = await getSession();
    if (!userId) return { success: false, data: [], error: "Unauthorized" };

    const supabase = supabaseAdmin;

    // Get user's organization
    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, data: [], error: "No organization found" };
    }

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
}

export async function updateCustomer(id: string, data: any) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { error } = await supabase
        .from('customers')
        .update({
            name: data.name,
            phone: data.phone,
            email: data.email,
            metadata: data.metadata,
        })
        .eq('id', id);

    if (error) {
        console.error(error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

export async function deleteCustomer(id: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

    if (error) {
        console.error(error);
        return { success: false, error: error.message };
    }

    revalidatePath('/');
    return { success: true };
}

// --- STAFF SCHEDULE ACTIONS ---

export async function getStaffSchedule(staffId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, data: null, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('user_id', staffId)
        .order('day_of_week', { ascending: true });

    if (error) {
        console.error("Error fetching staff schedule:", error);
        return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [] };
}

export async function updateStaffSchedule(staffId: string, schedules: any[]) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    // Verify current user has permission (owner or admin)
    const { data: myProfile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('clerk_id', userId)
        .single();
    
    if (!myProfile || !['owner', 'admin'].includes(myProfile.role)) {
        return { success: false, error: "Yetkisiz islem" };
    }

    // Prepare data to upsert
    const upsertData = schedules.map(schedule => ({
        user_id: staffId,
        organization_id: myProfile.organization_id,
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_working_day: schedule.is_working_day,
        breaks: schedule.breaks || [] // Include breaks data
    }));

    // Perform upsert (using the unique constraint on user_id + day_of_week)
    const { error } = await supabase
        .from('staff_schedules')
        .upsert(upsertData, { onConflict: 'user_id,day_of_week' });

    if (error) {
        console.error("Error upserting schedules:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/staff');
    return { success: true };
}

// --- STAFF TIME OFF ACTIONS ---

export async function getStaffTimeOffs(staffId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, data: null, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data, error } = await supabase
        .from('staff_time_offs')
        .select('*')
        .eq('user_id', staffId)
        .order('start_date', { ascending: true });

    if (error) {
        console.error("Error fetching time offs:", error);
        return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [] };
}

export async function createStaffTimeOff(staffId: string, payload: { start_date: string, end_date: string, reason: string }) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data: myProfile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('clerk_id', userId)
        .single();
    
    if (!myProfile || !['owner', 'admin'].includes(myProfile.role)) {
        return { success: false, error: "Yetkisiz islem" };
    }

    const { error } = await supabase
        .from('staff_time_offs')
        .insert({
            user_id: staffId,
            organization_id: myProfile.organization_id,
            start_date: payload.start_date,
            end_date: payload.end_date,
            reason: payload.reason
        });

    if (error) {
        console.error("Error creating time off:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/staff');
    return { success: true };
}

export async function deleteStaffTimeOff(timeOffId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    const { data: myProfile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('clerk_id', userId)
        .single();
    
    if (!myProfile || !['owner', 'admin'].includes(myProfile.role)) {
        return { success: false, error: "Yetkisiz islem" };
    }

    const { error } = await supabase
        .from('staff_time_offs')
        .delete()
        .eq('id', timeOffId)
        .eq('organization_id', myProfile.organization_id); // Security check

    if (error) {
        console.error("Error deleting time off:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/staff');
    return { success: true };
}
