"use server"

import { getSession } from "./actions"
import { revalidatePath } from "next/cache"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function getUserProfile() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const supabase = supabaseAdmin;

    // Get User Data
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', userId)
        .single();

    if (error) {
        console.error("Profile fetch error:", error);
        return { success: false, error: "Failed to fetch profile" };
    }

    // If customer, fetch customer specific details
    if (user.role === 'customer') {
        const { data: customerData } = await supabase
            .from('customers')
            .select('*')
            .eq('organization_id', user.organization_id)
            .eq('email', user.email)
            .single();

        if (customerData) {
            return {
                success: true,
                data: {
                    ...user,
                    ...customerData,
                    id: user.id, // Keep user.id
                    customer_id: customerData.id,
                    metadata: customerData.metadata || {}
                }
            };
        }
    }

    return { success: true, data: user };
}

export async function updateUserProfile(data: { full_name: string, phone?: string, avatar_url?: string, birth_date?: string, medical_notes?: string, notification_preferences?: any }) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };
    const supabase = supabaseAdmin;

    // 1. Update Users Table
    const { error: userError } = await supabase
        .from('users')
        .update({
            full_name: data.full_name,
            avatar_url: data.avatar_url
        })
        .eq('clerk_id', userId);

    if (userError) {
        return { success: false, error: userError.message };
    }

    // 2. Sync with Customers Table (if role is customer)
    const { data: user } = await supabase.from('users').select('organization_id, email, role').eq('clerk_id', userId).single();

    if (user && user.role === 'customer') {
        // Fetch existing metadata to merge
        const { data: currentCustomer } = await supabase
            .from('customers')
            .select('metadata')
            .eq('organization_id', user.organization_id)
            .eq('email', user.email)
            .single();

        const currentMetadata = currentCustomer?.metadata || {};

        await supabase
            .from('customers')
            .update({
                name: data.full_name,
                phone: data.phone,
                metadata: {
                    ...currentMetadata,
                    birth_date: data.birth_date,
                    medical_notes: data.medical_notes,
                    notification_preferences: data.notification_preferences
                }
            })
            .eq('organization_id', user.organization_id)
            .eq('email', user.email);
    }

    revalidatePath('/profile');
    return { success: true };
}
