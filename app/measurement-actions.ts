"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "./actions"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function addMeasurement(data: {
    customer_id: string,
    date: string,
    weight?: number,
    height?: number,
    chest?: number,
    waist?: number,
    hip?: number,
    arm_right?: number,
    arm_left?: number,
    leg_right?: number,
    leg_left?: number,
    notes?: string
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };
    const supabase = supabaseAdmin;

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, error: "No org found" };

    const { error } = await supabase
        .from('measurements')
        .insert({
            organization_id: userData.organization_id,
            ...data
        });

    if (error) {
        console.error("Add measurement detailed error:", error);
        // Supabase error codes for "Relation does not exist" is 42P01
        if (error.code === '42P01') {
            return { success: false, error: "Veritabanı tablosu eksik! Lütfen SQL dosyasını çalıştırın." };
        }
        return { success: false, error: `DB Error: ${error.message} (Code: ${error.code})` };
    }

    revalidatePath('/customers');
    return { success: true };
}

export async function getMeasurements(customerId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function deleteMeasurement(id: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };
    const supabase = supabaseAdmin;

    const { error } = await supabase
        .from('measurements')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/customers');
    return { success: true };
}
