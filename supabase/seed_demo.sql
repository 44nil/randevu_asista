-- BU SORGULARI SUPABASE DASHBOARD -> SQL EDITOR KISMINDA ÇALIŞTIRIN

-- 1. Demo Organizasyon Oluştur (Eğer yoksa)
INSERT INTO public.organizations (name, subdomain, industry_type, settings)
VALUES ('Demo Pilates', 'demo-pilates', 'pilates', '{"sms_enabled": true}'::jsonb)
ON CONFLICT (subdomain) DO NOTHING;

-- 2. Kendinizi bu organizasyonun sahibi yapın
-- 'user_...' yerine Clerk'ten aldığınız User ID'yi yapıştırın.
-- Eğer Clerk ID'nizi bilmiyorsanız, uygulamanın sol üst köşesindeki "Hoşgeldin" yazısından veya Clerk Dashboard'dan bakabilirsiniz.

UPDATE public.users
SET 
    organization_id = (SELECT id FROM public.organizations WHERE subdomain = 'demo-pilates' LIMIT 1),
    role = 'owner'
WHERE email = 'BURAYA_GIRIS_YAPTIGINIZ_EMAILI_YAZIN'; 
-- Email ile eşleştirmek daha kolay olacaktır çünkü Clerk ID'yi kopyalamak zor olabilir.
