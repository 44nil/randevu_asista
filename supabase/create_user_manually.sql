-- Kullanıcı kaydınızı manuel olarak oluşturun
-- Supabase Dashboard -> SQL Editor'da çalıştırın

-- 1. Önce Clerk User ID'nizi öğrenmeniz gerekiyor
-- Tarayıcıda localhost:3000'e gidin, Developer Console'u açın (Cmd+Option+I)
-- Console'a şunu yazın: window.Clerk.user.id
-- Çıkan değeri kopyalayın (user_... ile başlar)

-- 2. Bu SQL'i çalıştırın
INSERT INTO public.users (clerk_id, email, full_name, role, organization_id)
VALUES (
    'user_38WbrzfHJekCtsZZ83lu01zPcmj',
    'esranildogan@gmail.com',
    'Esra Nil',
    'owner',
    (SELECT id FROM public.organizations WHERE subdomain = 'elif-pilates' LIMIT 1)
);

-- 3. Kontrol edin
SELECT * FROM public.users;
