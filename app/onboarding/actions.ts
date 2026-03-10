'use server'

import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { INDUSTRY_DB_ALIAS } from "@/lib/config/industries";

export async function createOrganization(prevState: any, formData: FormData) {
    try {
        const { userId } = await auth();
        const user = await currentUser();


        if (!userId || !user) {
            return { error: "Oturum açmanız gerekiyor (Auth Hatası)." };
        }

        const businessName = formData.get("businessName") as string;
        const industryType = formData.get("industryType") as string;
        const phone = formData.get("phone") as string;

        if (!businessName || !industryType) {
            return { error: "Lütfen işletme adı ve sektör seçiniz." };
        }

        const supabase = createSupabaseAdmin();

        // 1. Kullanıcı Kontrolü
        let { data: dbUser, error: findUserError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", userId)
            .single();

        if (findUserError && findUserError.code !== 'PGRST116') { // PGRST116: veri bulunamadı
            console.error("Find User Error:", findUserError);
            return { error: "Kullanıcı sorgulanırken hata: " + findUserError.message };
        }

        if (!dbUser) {
            const email = user.emailAddresses[0]?.emailAddress;
            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert({
                    clerk_id: userId,
                    email: email,
                    full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                    role: 'customer'
                })
                .select("id")
                .single();

            if (createError || !newUser) {
                console.error("User Create Error:", createError);
                return { error: "Kullanıcı oluşturulamadı: " + createError?.message };
            }
            dbUser = newUser;
        }

        // 2. Benzersiz Subdomain oluştur
        const subdomain = businessName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-') + '-' + Math.floor(Math.random() * 1000);

        // DB sadece 4 tipi kabul ediyor: 'pilates' | 'hair' | 'dental' | 'general'
        // Gerçek sektör settings.real_industry'e kaydedilir, config'de kullanılır
        const dbIndustryType = INDUSTRY_DB_ALIAS[industryType] || 'general';

        // 3. Organizasyonu oluştur
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .insert({
                name: businessName,
                industry_type: dbIndustryType,
                phone: phone,
                subdomain: subdomain,
                email: user.emailAddresses[0]?.emailAddress,
                settings: { real_industry: industryType }
            })
            .select("id")
            .single();


        if (orgError) {
            console.error("Org Create Error:", orgError);
            return { error: "Organizasyon oluşturulamadı: " + orgError.message };
        }

        // 4. Kullanıcı Güncelleme
        const { error: updateError } = await supabase
            .from("users")
            .update({ organization_id: org.id, role: 'owner' })
            .eq("id", dbUser.id);

        if (updateError) {
            console.error("User Update Error:", updateError);
            return { error: "Kullanıcı role güncellenemedi: " + updateError.message };
        }

        // 5. Servisler
        const defaultServices: Record<string, any[]> = {
            'pilates': [
                { name: 'Reformer Pilates (Birebir)', duration_minutes: 60, price: 750, color: '#fda4af', category: 'Ders' },
                { name: 'Mat Pilates (Grup)', duration_minutes: 60, price: 500, color: '#f0abfc', category: 'Ders' },
                { name: 'Deneme Dersi', duration_minutes: 45, price: 250, color: '#e2e8f0', category: 'Ders' }
            ],
            'yoga': [
                { name: 'Yoga (Grup)', duration_minutes: 60, price: 400, color: '#a3e635', category: 'Ders' },
                { name: 'Özel Yoga', duration_minutes: 60, price: 800, color: '#86efac', category: 'Ders' },
                { name: 'Meditasyon', duration_minutes: 45, price: 300, color: '#c4b5fd', category: 'Ders' }
            ],
            'pt': [
                { name: 'PT Seansı', duration_minutes: 60, price: 800, color: '#ef4444', category: 'Antrenman' },
                { name: 'Grup Antrenmanı', duration_minutes: 60, price: 400, color: '#f97316', category: 'Antrenman' },
                { name: 'Online Koçluk', duration_minutes: 30, price: 400, color: '#3b82f6', category: 'Online' }
            ],
            'physio': [
                { name: 'Fizyoterapi Seansı', duration_minutes: 45, price: 1200, color: '#38bdf8', category: 'Tedavi' },
                { name: 'Manuel Terapi', duration_minutes: 60, price: 1500, color: '#0284c7', category: 'Tedavi' },
                { name: 'Değerlendirme', duration_minutes: 60, price: 800, color: '#7dd3fc', category: 'Muayene' }
            ],
            'dietitian': [
                { name: 'İlk Muayene', duration_minutes: 45, price: 1000, color: '#84cc16', category: 'Muayene' },
                { name: 'Kontrol', duration_minutes: 20, price: 500, color: '#84cc16', category: 'Muayene' },
                { name: 'Online Danışmanlık', duration_minutes: 30, price: 400, color: '#65a30d', category: 'Online' }
            ],
            'psychologist': [
                { name: 'Psikoterapi Seansı', duration_minutes: 50, price: 2000, color: '#a78bfa', category: 'Seans' },
                { name: 'Çift Terapisi', duration_minutes: 60, price: 2500, color: '#8b5cf6', category: 'Seans' },
                { name: 'İlk Görüşme', duration_minutes: 60, price: 1500, color: '#c4b5fd', category: 'Muayene' }
            ],
            'beauty': [
                { name: 'Cilt Bakımı', duration_minutes: 90, price: 1500, color: '#2dd4bf', category: 'Bakım' },
                { name: 'Lazer Epilasyon', duration_minutes: 30, price: 2000, color: '#c084fc', category: 'Bakım' },
                { name: 'Manikür', duration_minutes: 45, price: 400, color: '#fb7185', category: 'Bakım' },
                { name: 'Pedikür', duration_minutes: 60, price: 500, color: '#fb7185', category: 'Bakım' }
            ],
            'hair': [
                { name: 'Saç Kesimi', duration_minutes: 45, price: 500, color: '#fbbf24', category: 'Saç' },
                { name: 'Fön', duration_minutes: 30, price: 200, color: '#facc15', category: 'Saç' },
                { name: 'Saç Boyama', duration_minutes: 120, price: 1500, color: '#a855f7', category: 'Saç' },
                { name: 'Gelin Başı', duration_minutes: 180, price: 5000, color: '#ec4899', category: 'Özel' },
                { name: 'Keratin Bakım', duration_minutes: 90, price: 2500, color: '#10b981', category: 'Bakım' }
            ],
            'general': [
                { name: 'Standart Randevu', duration_minutes: 60, price: 500, color: '#94a3b8', category: 'Genel' }
            ]
        };

        const servicesToAdd = defaultServices[industryType] || defaultServices['general'];

        if (servicesToAdd && servicesToAdd.length > 0) {
            const servicesWithOrg = servicesToAdd.map(s => ({ ...s, organization_id: org.id }));
            const { error: serviceError } = await supabase.from('services').insert(servicesWithOrg);
            if (serviceError) console.error("Service Error:", serviceError);
        }

        return { success: true };

    } catch (err: any) {
        console.error("CRITICAL SERVER ACTION ERROR:", err);
        return { error: "Sunucu hatası: " + (err.message || JSON.stringify(err)) };
    }
}
