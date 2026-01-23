
-- Önce paketin (template) kredilerini düzeltmemiz gerekebilir
-- Ama esas sorun Müşteriye satılmış olan pakette.
-- "10 ders" yazıyor ama remaining 1 kalmış.
-- Bunu düzeltmek için:

UPDATE public.customer_packages
SET initial_credits = 10, remaining_credits = 10
WHERE customer_id = (SELECT id FROM public.customers WHERE email ILIKE '%esra%') -- Esra'yı bul
AND remaining_credits = 1; -- Sadece yanlış olanı güncelle
