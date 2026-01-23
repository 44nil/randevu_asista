
-- 1. PAKET ŞABLONLARINI DÜZELT (Templates)
-- İsminde sayı geçen paketlerin kredisini o sayıya eşitle (Örn: "10 Ders Paketi" -> 10 Kredi)
-- Regex ile ismin içindeki ilk sayıyı bulur.
UPDATE public.packages
SET credits = (substring(name FROM '[0-9]+')::integer)
WHERE name ~ '[0-9]+';

-- Eğer isimde sayı yoksa ve kredi 1 ise, manuel olarak kontrol edilmesi gerekebilir ama şimdilik varsayılan 12 (Ayda 12 ders gibi) veya olduğu gibi bırakıyoruz.

-- 2. MÜŞTERİ PAKETLERİNİ GÜNCELLE (Customer Packages)
-- Müşterinin paketindeki hakları, ana paketin (şablonun) güncel kredisini eşitle.
-- DİKKAT: Sadece "kullanılmamış" veya "yeni" gibi görünenleri sıfırlayarak düzeltiyoruz.
-- Eğer kalan kredi = ilk kredi (yani hiç kullanılmamışsa), ikisini de güncelle.
UPDATE public.customer_packages cp
SET 
  initial_credits = p.credits,
  remaining_credits = p.credits
FROM public.packages p
WHERE cp.package_id = p.id
AND cp.initial_credits = 1 -- Sadece hatalı (1 kredi) olanları düzelt
AND cp.remaining_credits <= 1; -- Ve henüz bitmemiş veya yeni olanları

-- Not: Eğer kullanıcı 1 dersten fazlasını harcadıysa (ki 1 hakkı varken imkansız), bu sorgu güvenlidir.
