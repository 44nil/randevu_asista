-- Kullanıcınızı organizasyona bağlayın
-- Supabase Dashboard -> SQL Editor'da çalıştırın

UPDATE public.users
SET 
    organization_id = (SELECT id FROM public.organizations WHERE subdomain = 'elif-pilates' LIMIT 1),
    role = 'owner'
WHERE email = 'esranildogan@gmail.com';

-- Kontrol edin
SELECT * FROM public.users WHERE email = 'esranildogan@gmail.com';
