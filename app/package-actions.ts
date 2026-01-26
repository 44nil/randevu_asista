"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "./actions"

// ============================================================================
// PACKAGE DEFINITIONS
// ============================================================================

export async function createPackage(data: {
    name: string,
    description?: string,
    price: number,
    credits: number,
    validity_days?: number,
    duration?: number
}) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get org id
    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    const { data: pkg, error } = await supabase
        .from('packages')
        .insert({
            organization_id: userData.organization_id,
            name: data.name,
            description: data.description,
            price: data.price,
            credits: data.credits,
            validity_days: data.validity_days,
            duration_minutes: data.duration || 60
        })
        .select()
        .single();

    if (error) {
        console.error("Create package error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/packages');
    return { success: true, data: pkg };
}

export async function getPackages() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, data: [] };

    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('organization_id', userData.organization_id)
        .eq('active', true)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

// ============================================================================
// PACKAGE SALES & STATS
// ============================================================================

export async function sellPackage(customerId: string, packageId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();

    if (pkgError || !pkg) return { success: false, error: "Package not found" };

    // Calculate expiry
    let expiryDate = null;
    if (pkg.validity_days) {
        const date = new Date();
        date.setDate(date.getDate() + pkg.validity_days);
        expiryDate = date.toISOString();
    }

    const { error: saleError } = await supabase
        .from('customer_packages')
        .insert({
            organization_id: pkg.organization_id, // Same org
            customer_id: customerId,
            package_id: pkg.id,
            package_name: pkg.name,
            initial_credits: pkg.credits,
            remaining_credits: pkg.credits,
            price_paid: pkg.price,
            expiry_date: expiryDate,
            status: 'active'
        });

    if (saleError) {
        console.error("Sell package error:", saleError);
        return { success: false, error: saleError.message };
    }

    revalidatePath(`/customers/${customerId}`);
    revalidatePath('/packages'); // Refresh admin list
    return { success: true };
}

export async function getCustomerActivePackages(customerId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase
        .from('customer_packages')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'active')
        .gt('remaining_credits', 0) // Must have credits
        .or(`expiry_date.is.null,expiry_date.gt.${new Date().toISOString()}`) // Not expired
        .order('expiry_date', { ascending: true }); // Use oldest expiring first

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getPackagePageStats() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, data: {} };

    // Get all sales for this org
    const { data: sales, error } = await supabase
        .from('customer_packages')
        .select('price_paid, created_at, package_name, status')
        .eq('organization_id', userData.organization_id);

    if (error) return { success: false, error: error.message };

    // Calculate stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyRevenue = 0;
    let soldPackagesCount = sales.length;
    let packageCounts: Record<string, number> = {};

    sales.forEach(sale => {
        const saleDate = new Date(sale.created_at);
        if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
            monthlyRevenue += Number(sale.price_paid || 0);
        }

        const pkgName = sale.package_name || "Bilinmiyor";
        packageCounts[pkgName] = (packageCounts[pkgName] || 0) + 1;
    });

    // Active members (approximate by active packages)
    const { count: activeCount } = await supabase
        .from('customer_packages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', userData.organization_id)
        .eq('status', 'active');

    // Top package
    let topPackage = "-";
    let maxCount = 0;
    Object.entries(packageCounts).forEach(([name, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topPackage = name;
        }
    });

    return {
        success: true,
        data: {
            monthlyRevenue,
            soldPackagesCount,
            activeMembers: activeCount || 0,
            topPackage
        }
    };
}

export async function getRecentSales() {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) return { success: false, data: [] };

    const { data, error } = await supabase
        .from('customer_packages')
        .select(`
            id,
            price_paid,
            created_at,
            package_name,
            customer:customer_id (name, email)
        `)
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) return { success: false, error: error.message };

    // Flatten customer data
    const formatted = data.map(item => {
        const customer = Array.isArray(item.customer) ? item.customer[0] : item.customer;
        return {
            id: item.id,
            customerName: customer?.name || "Bilinmiyor",
            customerEmail: customer?.email,
            packageName: item.package_name,
            price: item.price_paid,
            date: item.created_at
        };
    });

    return { success: true, data: formatted };
}

export async function deletePackage(packageId: string) {
    const { userId } = await getSession();
    if (!userId) return { success: false, error: "Unauthorized" };

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('clerk_id', userId)
        .single();

    if (!userData?.organization_id) {
        return { success: false, error: "No organization found" };
    }

    const { error } = await supabase
        .from('packages')
        .update({ active: false })
        .eq('id', packageId)
        .eq('organization_id', userData.organization_id);

    if (error) {
        console.error("Delete package error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/packages');
    return { success: true };
}
