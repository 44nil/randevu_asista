"use server"

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"

export async function updateOrganizationLunchBreak(
    orgId: string, 
    settings: {
        lunch_break_enabled: boolean;
        lunch_break_start: string;
        lunch_break_end: string;
    }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: "Unauthorized" }
        }

        const supabase = supabaseAdmin

        // Verify user has permission (owner or admin)
        const { data: myProfile, error: profileError } = await supabase
            .from('users')
            .select('role, organization_id')
            .eq('clerk_id', userId)
            .single()
        
        if (profileError) {
            return { success: false, error: `Profile error: ${profileError.message}` }
        }
        
        if (!myProfile || !['owner', 'admin'].includes(myProfile.role)) {
            return { success: false, error: "Yetkisiz işlem" }
        }

        if (myProfile.organization_id !== orgId) {
            return { success: false, error: "Organizasyon erişim hatası" }
        }

        // Update organization lunch break settings
        const { error: updateError } = await supabase
            .from('organizations')
            .update({
                lunch_break_enabled: settings.lunch_break_enabled,
                lunch_break_start: settings.lunch_break_start,
                lunch_break_end: settings.lunch_break_end
            })
            .eq('id', orgId)

        if (updateError) {
            return { success: false, error: `Database error: ${updateError.message}` }
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (error) {
        return { success: false, error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
}