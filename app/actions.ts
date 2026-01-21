'use server'

import { createSupabaseClient } from "@/lib/supabaseClient";
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from "next/cache";

export async function getSession() {
    const { userId, getToken } = await auth();
    return { userId, getToken };
}

export async function getUserProfile() {
    const { userId } = await getSession();
    if (!userId) return null;

    // Get current user details from Clerk to check against pending invites
    const { currentUser } = await import('@clerk/nextjs/server');
    const clerkUser = await currentUser();
    const userEmail = clerkUser?.emailAddresses[0]?.emailAddress;

    // Use Service Role Key for admin operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 1. Try to find by Clerk ID
    let { data: profile } = await supabase.from('users').select('*').eq('clerk_id', userId).single();

    // 2. If not found by ID, but we have an email, try to find by email (Claim Account Logic)
    if (!profile && userEmail) {
        // Look for any user with this email (Staff or Customer placeholder)
        const { data: pendingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail)
            .single();

        if (pendingProfile) {
            console.log(`Linking pending account ${pendingProfile.id} for email ${userEmail} to Clerk ID ${userId}`);

            // Link the pending account to the real Clerk ID
            const { data: updatedProfile, error } = await supabase
                .from('users')
                .update({
                    clerk_id: userId,
                    // Optionally sync name from Clerk if missing in DB
                    // full_name: pendingProfile.full_name || clerkUser.firstName + ' ' + clerkUser.lastName
                })
                .eq('id', pendingProfile.id)
                .select()
                .single();

            if (!error) {
                profile = updatedProfile;
            } else {
                console.error("Failed to link account:", error);
            }
        }
    }

    return profile;
}

export async function createOrganization(data: { name: string, industry: string, subdomain: string }) {
    try {
        const { userId } = await getSession();
        if (!userId) return { success: false, error: "Unauthorized - No user ID" };

        // Use Service Role Key for admin operations
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 1. Create Organization
        const { data: org, error: orgError } = await supabase.from('organizations').insert({
            name: data.name,
            industry_type: data.industry,
            subdomain: data.subdomain,
            settings: { sms_enabled: true }
        }).select().single();

        if (orgError) {
            console.error('Organization creation error:', orgError);
            return { success: false, error: "Organizasyon oluşturulamadı: " + orgError.message };
        }

        console.log('Organization created:', org);

        // I probably need to execute this part as ADMIN (Service Role).
        // Or I need to rely on the fact that I'm just calling an RPC or I have a policy.

        // For this MVP, I will try to update. If it fails due to RLS, I will need to use a service role client (which I don't have configured in lib/supabaseClient yet effectively for this action).
        // BUT checking the schema: 
        // create policy "Users can view their own data" ...
        // No Update policy defined! So user CANNOT update themselves by default RLS.
        // I strictly need a SERVICE_ROLE client for this action.

        // WORKAROUND for this context (since I can't easily add Service Key secrets/logic without asking user):
        // I will try to use the `supabase` client with the user's token. If I failed to add UPDATE policy, it will fail.
        // Let's assume for a moment I can insert. 
        // Wait, the user already approved my schema which had NO update policy for public.users.

        // I MUST ADD AN UPDATE POLICY or usage of Service Role.
        // I'll add a helper function to `lib/supabaseClient.ts` to get a service role client if the key exists, 
        // but the user only put ANON key in .env.local (based on my previous instructions).

        // ALTERNATIVE: I will add a policy to allow users to update their own organization_id IF it is currently null.
        // But I can't run SQL right now easily without asking user.

        // Let's try to do it and if it fails, I will guide the user or add the SQL to the next step.
        // Actually, I can run SQL via `supabase/schema.sql` if I update it? No, that file is just a reference for the user.

        // Best bet: Write the code. If it errors, I'll give the user a "Fix Permissions" SQL script like I did with the demo seed.

        const { error: userError } = await supabase.from('users').update({
            organization_id: org.id,
            role: 'owner'
        }).eq('clerk_id', userId);

        if (userError) {
            console.error('User update error:', userError);
            return { success: false, error: "Kullanıcı güncellenemedi: " + userError.message };
        }

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error in createOrganization:', error);
        return { success: false, error: "Beklenmeyen hata: " + error.message };
    }
}

export async function createCustomer(data: any) {
    const { userId } = await getSession();

    if (!userId) {
        return { success: false, error: "Unauthorized" };
    }

    // Use Service Role Key for admin operations
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

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

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

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

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

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

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

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
