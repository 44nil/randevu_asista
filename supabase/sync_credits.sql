
-- BU SORGULAR KREDİLERİ GERÇEK KULLANIMA GÖRE DÜZELTİR

-- 1. Temp Table ile her müşterinin kaç "confirmed" veya "completed" randevusu var hesapla
WITH usage_counts AS (
    SELECT 
        customer_id, 
        COUNT(*) as used_count
    FROM public.appointments
    WHERE status IN ('confirmed', 'completed')
    GROUP BY customer_id
)
-- 2. Customer Packages tablosunu güncelle
UPDATE public.customer_packages cp
SET remaining_credits = cp.initial_credits - uc.used_count
FROM usage_counts uc
WHERE cp.customer_id = uc.customer_id
AND cp.status = 'active'; -- Sadece aktif paketleri güncelle

-- Not: Eğer birden fazla paketi varsa bu basit mantık en son paketten düşmeyebilir,
-- ama şu anki MVP yapısında genelde 1 aktif paket var.
-- Daha karmaşık senaryoda appointment tarihine göre hangi paketten düştüğünü bulmak gerekir.
-- Şimdilik bu "toplam düşüm" mantığı çoğu durumu kurtarır.
