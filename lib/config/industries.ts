
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
        service?: string; // e.g. "Hizmet", "Tedavi"
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

// Onboarding'de seçilen sektörlere özel genişletilmiş config'ler
// (DB'de 4 tip var ama UI'da her sektör kendi randevu/paket tiplerini gösterir)
const INDUSTRY_EXTENDED_CONFIG: Partial<Record<string, IndustryConfig>> = {
    yoga: {
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
            { value: 'group_yoga', label: 'Grup Yoga' },
            { value: 'private_yoga', label: 'Özel Yoga' },
            { value: 'meditation', label: 'Meditasyon' },
            { value: 'yin_yoga', label: 'Yin Yoga' },
        ],
        packageTypes: [
            { value: 'group', label: 'Grup Ders Paketi' },
            { value: 'private', label: 'Özel Ders' },
            { value: 'monthly', label: 'Aylık Üyelik' },
        ],
        features: { measurements: false, classes: true, packages: true, recurring: true }
    },
    pt: {
        labels: {
            appointment: "Antrenman",
            createAppointment: "Antrenman Ekle",
            customer: "Danışan",
            createCustomer: "Yeni Danışan",
            program: "Antrenman Programı",
            package: "Paket",
            session: "Seans",
            instructor: "Antrenör"
        },
        appointmentTypes: [
            { value: 'pt_session', label: 'PT Seansı' },
            { value: 'group_training', label: 'Grup Antrenmanı' },
            { value: 'online_coaching', label: 'Online Koçluk' },
            { value: 'assessment', label: 'Değerlendirme' },
        ],
        packageTypes: [
            { value: 'individual_pt', label: 'Bireysel PT' },
            { value: 'group_pt', label: 'Grup Antrenmanı' },
            { value: 'online_coaching', label: 'Online Koçluk' },
        ],
        features: { measurements: true, classes: false, packages: true, recurring: true }
    },
    physio: {
        labels: {
            appointment: "Seans",
            createAppointment: "Seans Ekle",
            customer: "Hasta",
            createCustomer: "Yeni Hasta",
            program: "Tedavi Planı",
            package: "Tedavi",
            session: "Seans",
            instructor: "Fizyoterapist"
        },
        appointmentTypes: [
            { value: 'physio_session', label: 'Fizyoterapi Seansı' },
            { value: 'manual_therapy', label: 'Manuel Terapi' },
            { value: 'assessment', label: 'Değerlendirme' },
            { value: 'dry_needling', label: 'Dry Needling' },
        ],
        packageTypes: [
            { value: 'physio_session', label: 'Fizyoterapi Seansı' },
            { value: 'posture_analysis', label: 'Duruş Analizi' },
            { value: 'treatment_package', label: 'Tedavi Paketi' },
        ],
        features: { measurements: false, classes: false, packages: true, recurring: false }
    },
    dietitian: {
        labels: {
            appointment: "Randevu",
            createAppointment: "Randevu Ekle",
            customer: "Danışan",
            createCustomer: "Yeni Danışan",
            program: "Diyet Programı",
            package: "Program",
            session: "Seans",
            instructor: "Diyetisyen"
        },
        appointmentTypes: [
            { value: 'first_visit', label: 'İlk Muayene' },
            { value: 'checkup', label: 'Kontrol' },
            { value: 'online', label: 'Online Danışmanlık' },
        ],
        packageTypes: [
            { value: 'first_visit', label: 'İlk Muayene' },
            { value: 'monthly_program', label: 'Aylık Program' },
            { value: 'online_program', label: 'Online Danışmanlık' },
        ],
        features: { measurements: true, classes: false, packages: true, recurring: false }
    },
    psychologist: {
        labels: {
            appointment: "Seans",
            createAppointment: "Seans Ekle",
            customer: "Danışan",
            createCustomer: "Yeni Danışan",
            program: "Terapi Planı",
            package: "Seans Paketi",
            session: "Seans",
            instructor: "Psikolog"
        },
        appointmentTypes: [
            { value: 'individual_therapy', label: 'Bireysel Terapi' },
            { value: 'couples_therapy', label: 'Çift Terapisi' },
            { value: 'first_session', label: 'İlk Görüşme' },
            { value: 'online_therapy', label: 'Online Terapi' },
        ],
        packageTypes: [
            { value: 'individual', label: 'Bireysel Seans' },
            { value: 'couples', label: 'Çift Seansı' },
            { value: 'package_5', label: '5\'li Seans Paketi' },
        ],
        features: { measurements: false, classes: false, packages: true, recurring: false }
    },
    beauty: {
        labels: {
            appointment: "Randevu",
            createAppointment: "Randevu Ekle",
            customer: "Müşteri",
            createCustomer: "Yeni Müşteri",
            program: "Randevu Takvimi",
            package: "Bakım Paketi",
            session: "Seans",
            instructor: "Uzman"
        },
        appointmentTypes: [
            { value: 'skincare', label: 'Cilt Bakımı' },
            { value: 'laser', label: 'Lazer Epilasyon' },
            { value: 'manicure', label: 'Manikür' },
            { value: 'pedicure', label: 'Pedikür' },
            { value: 'eyebrow', label: 'Kaş & Kirpik' },
            { value: 'massage', label: 'Masaj' },
        ],
        packageTypes: [
            { value: 'skincare_package', label: 'Cilt Bakım Paketi' },
            { value: 'laser_package', label: 'Lazer Paketi' },
            { value: 'nail_package', label: 'Tırnak Bakım Paketi' },
        ],
        features: { measurements: false, classes: false, packages: true, recurring: false }
    },
};

// Onboarding'de seçilen sektörleri DB'deki kısıtlı tiplere eşler (sadece DB yazımı için)
export const INDUSTRY_DB_ALIAS: Record<string, IndustryType> = {
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
    const key = type || 'general';
    // 1. Önce extended config'e bak (yoga, pt, physio, beauty, vs.)
    if (INDUSTRY_EXTENDED_CONFIG[key]) return INDUSTRY_EXTENDED_CONFIG[key]!;
    // 2. Yoksa DB tip config'ini kullan (pilates, hair, dental, general)
    const mapped = INDUSTRY_DB_ALIAS[key] || 'general';
    return INDUSTRY_CONFIG[mapped];
}
