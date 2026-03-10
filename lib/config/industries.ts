
export type IndustryType = 'pilates' | 'hair' | 'dental' | 'general';

export interface IndustryConfig {
    labels: {
        appointment: string; // e.g. "Ders", "Randevu"
        createAppointment: string; // e.g. "Ders Ekle", "Randevu Oluştur"
        customer: string; // e.g. "Üye", "Müşteri", "Hasta"
        createCustomer: string; // e.g. "Yeni Üye", "Yeni Müşteri"
        program: string; // e.g. "Haftalık Program", "Randevu Takvimi"
        package: string; // e.g. "Paket", "Hizmet"
        session: string; // e.g. "Seans", "Randevu Hakkı"
        instructor: string; // e.g. "Eğitmen", "Hekim", "Uzman"
    };
    appointmentTypes: { value: string; label: string }[];
    packageTypes: { value: string; label: string; booking_type?: 'individual' | 'group' }[];
    features: {
        measurements: boolean; // Vücut ölçümleri
        classes: boolean; // Grup dersleri (Reformer vb.) vs Birebir Randevu
        packages: boolean; // Paket satışı var mı?
        recurring: boolean; // Tekrarlı randevu var mı?
    };
}

export const INDUSTRY_CONFIG: Record<IndustryType, IndustryConfig> = {
    pilates: {
        labels: {
            appointment: "Ders",
            createAppointment: "Ders Ekle",
            customer: "Üye",
            createCustomer: "Yeni Üye",
            program: "Haftalık Program",
            package: "Paket",
            session: "Seans",
            instructor: "Eğitmen"
        },
        appointmentTypes: [
            { value: 'reformer', label: 'Reformer' },
            { value: 'mat', label: 'Mat Pilates' },
            { value: 'private', label: 'Özel Ders' }
        ],
        packageTypes: [
            { value: 'group', label: 'Grup Reformer' },
            { value: 'private', label: 'Özel Ders' },
            { value: 'duo', label: 'Düet' }
        ],
        features: {
            measurements: true,
            classes: true,
            packages: true,
            recurring: true
        }
    },
    hair: {
        labels: {
            appointment: "Randevu",
            createAppointment: "Randevu Ekle",
            customer: "Müşteri",
            createCustomer: "Yeni Müşteri",
            program: "Randevu Takvimi",
            package: "Hizmet",
            session: "Adet",
            instructor: "Uzman"
        },
        appointmentTypes: [
            { value: 'hair_cut', label: 'Saç Kesimi' },
            { value: 'blow_dry', label: 'Fön (Düz, Dalgalı, Maşa)' },
            { value: 'root_color', label: 'Dip Boyası' },
            { value: 'full_color', label: 'Bütün Boya' },
            { value: 'highlights', label: 'Röfle / Balyaj' },
            { value: 'ombre', label: 'Ombre / Sombre' },
            { value: 'bleach', label: 'Saç Açma (Oryal)' },
            { value: 'keratin', label: 'Keratin Bakımı / Brezilya Fönü' },
            { value: 'botox', label: 'Saç Botoksu ve Maske' },
            { value: 'manicure', label: 'Manikür' },
            { value: 'pedicure', label: 'Pedikür' },
            { value: 'gel_polish', label: 'Kalıcı Oje' },
            { value: 'prosthetic_nail', label: 'Protez / Jel Tırnak' },
            { value: 'nail_art', label: 'Nail Art' },
            { value: 'eyebrow', label: 'Kaş ve Bıyık Alımı' },
            { value: 'lamination', label: 'Kaş Laminasyonu / Microblading' },
            { value: 'lash_lift', label: 'Kirpik Lifting / İpek Kirpik' },
            { value: 'makeup', label: 'Günlük ve Gece Makyajı' },
            { value: 'bridal', label: 'Gelin Başı ve Makyaj' },
            { value: 'bun_braid', label: 'Topuz ve Örgü Modelleri' },
            { value: 'skincare', label: 'Cilt Bakımı ve Maske' },
            { value: 'extensions', label: 'Saç Kaynak' },
            { value: 'wax', label: 'Yüz ve Vücut Ağdası' }
        ],
        packageTypes: [
            { value: 'standard', label: 'Genel / Diğer' },
            { value: 'package_deal', label: 'Çoklu Paket' },
            { value: 'bridal_package', label: 'Gelin Paketi' },
            { value: 'hair_cut', label: 'Saç Kesimi' },
            { value: 'blow_dry', label: 'Fön (Düz, Dalgalı, Maşa)' },
            { value: 'root_color', label: 'Dip Boyası' },
            { value: 'full_color', label: 'Bütün Boya' },
            { value: 'highlights', label: 'Röfle / Balyaj' },
            { value: 'ombre', label: 'Ombre / Sombre' },
            { value: 'bleach', label: 'Saç Açma (Oryal)' },
            { value: 'keratin', label: 'Keratin Bakımı / Brezilya Fönü' },
            { value: 'botox', label: 'Saç Botoksu ve Maske' },
            { value: 'manicure', label: 'Manikür' },
            { value: 'pedicure', label: 'Pedikür' },
            { value: 'gel_polish', label: 'Kalıcı Oje' },
            { value: 'prosthetic_nail', label: 'Protez / Jel Tırnak' },
            { value: 'nail_art', label: 'Nail Art' },
            { value: 'eyebrow', label: 'Kaş ve Bıyık Alımı' },
            { value: 'lamination', label: 'Kaş Laminasyonu / Microblading' },
            { value: 'lash_lift', label: 'Kirpik Lifting / İpek Kirpik' },
            { value: 'makeup', label: 'Günlük ve Gece Makyajı' },
            { value: 'bridal', label: 'Gelin Başı ve Makyaj' },
            { value: 'bun_braid', label: 'Topuz ve Örgü Modelleri' },
            { value: 'skincare', label: 'Cilt Bakımı ve Maske' },
            { value: 'extensions', label: 'Saç Kaynak' },
            { value: 'wax', label: 'Yüz ve Vücut Ağdası' }
        ],
        features: {
            measurements: false,
            classes: false,
            packages: true,
            recurring: false
        }
    },
    dental: {
        labels: {
            appointment: "Randevu",
            createAppointment: "Randevu Oluştur",
            customer: "Hasta",
            createCustomer: "Yeni Hasta",
            program: "Randevu Takvimi",
            package: "Tedavi",
            session: "Seans",
            instructor: "Hekim"
        },
        appointmentTypes: [
            { value: 'checkup', label: 'Muayene' },
            { value: 'cleaning', label: 'Temizlik' },
            { value: 'treatment', label: 'Tedavi' }
        ],
        packageTypes: [
            { value: 'checkup', label: 'Diş Hekimi Muayenesi' },
            { value: 'xray', label: 'Panoramik Röntgen (Görüntüleme)' },
            { value: 'scaling', label: 'Diş Taşı Temizliği (Detertraj)' },
            { value: 'filling_composite', label: 'Kompozit Dolgu' },
            { value: 'filling_amalgam', label: 'Amalgam Dolgu' },
            { value: 'root_canal_1', label: 'Kanal Tedavisi (Tek Kanal)' },
            { value: 'root_canal_multi', label: 'Kanal Tedavisi (Çoklu Kanal)' },
            { value: 'extraction', label: 'Diş Çekimi' },
            { value: 'extraction_wisdom', label: 'Gömülü 20 Yaş Diş Çekimi' },
            { value: 'implant', label: 'İmplant Tedavisi' },
            { value: 'crown_porcelain', label: 'Porselen Kuron (Kaplama)' },
            { value: 'crown_zirconium', label: 'Zirkonyum Kaplama' },
            { value: 'laminate', label: 'Lamine Diş (Yaprak Porselen)' },
            { value: 'whitening_home', label: 'Diş Beyazlatma (Ev Tipi)' },
            { value: 'whitening_office', label: 'Diş Beyazlatma (Ofis Tipi)' },
            { value: 'orthodontics_metal', label: 'Ortodonti (Metal Braket)' },
            { value: 'orthodontics_clear', label: 'Ortodonti (Şeffaf Plak/Invisalign)' },
            { value: 'pedodontics', label: 'Çocuk Diş Hekimliği (Flor, Fissür Örtücü)' },
            { value: 'prosthesis_total', label: 'Tam / Bölümlü Protez' },
            { value: 'night_guard', label: 'Gece Plağı (Bruksizm)' }
        ],
        features: {
            measurements: false,
            classes: false,
            packages: true,
            recurring: false
        }
    },
    general: {
        labels: {
            appointment: "Randevu",
            createAppointment: "Randevu Ekle",
            customer: "Müşteri",
            createCustomer: "Yeni Müşteri",
            program: "Takvim",
            package: "Paket",
            session: "Hak",
            instructor: "Eğitmen"
        },
        appointmentTypes: [
            { value: 'standard', label: 'Standart Randevu' },
            { value: 'meeting', label: 'Görüşme' }
        ],
        packageTypes: [
            { value: 'standard', label: 'Standart Paket' }
        ],
        features: {
            measurements: false,
            classes: false,
            packages: true,
            recurring: false
        }
    }
};

// Onboarding'de seçilen sektörleri mevcut DB config'lerine eşler
const INDUSTRY_ALIAS: Record<string, IndustryType> = {
    pilates: 'pilates',
    yoga: 'pilates',
    pt: 'pilates',
    dental: 'dental',
    physio: 'dental',
    dietitian: 'dental',
    psychologist: 'dental',
    hair: 'hair',
    beauty: 'hair',
    general: 'general',
    other: 'general',
};

export function getIndustryConfig(type?: string): IndustryConfig {
    const mapped = INDUSTRY_ALIAS[type || ''] || 'general';
    return INDUSTRY_CONFIG[mapped];
}
