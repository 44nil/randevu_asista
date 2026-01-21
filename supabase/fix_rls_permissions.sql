-- Bu SQL'i Supabase Dashboard -> SQL Editor'da çalıştırın
-- Kullanıcıların kendi organizasyon bilgilerini güncelleyebilmesi için gerekli

-- Önce varsa eski policy'yi sil
drop policy if exists "Users can update their own org if null" on public.users;

-- Users tablosuna UPDATE politikası ekle
create policy "Users can update their own org if null"
  on public.users for update
  using (clerk_id = auth.uid()::text)
  with check (clerk_id = auth.uid()::text);
