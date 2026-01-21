# Clerk JWT Template Kurulum Rehberi

## Sorun
"No suitable key or wrong key type" hatası alıyorsunuz. Bu, Clerk JWT template'inin Supabase ile uyumlu olmadığı anlamına geliyor.

## Çözüm Adımları

### 1. Mevcut Template'i Silin
1. Clerk Dashboard → **JWT Templates**
2. `supabase` template'ini bulun
3. Sağ üstteki **"..."** menüsünden **Delete** seçin

### 2. Yeni Template Oluşturun (Doğru Ayarlarla)
1. **New Template** butonuna tıklayın
2. **"Blank"** seçin (Supabase preset kullanmayın!)
3. Şu ayarları yapın:

**Name:** `supabase`

**Token lifetime:** `60` seconds

**Signing algorithm:** `HS256`

**Signing key:** Supabase JWT Secret'ınızı yapıştırın (Settings → API → JWT Secret)

**Claims:**
```json
{
  "aud": "authenticated",
  "role": "authenticated"
}
```

4. **Apply changes** butonuna tıklayın

### 3. Test Edin
1. Tarayıcıda sayfayı yenileyin
2. Organizasyon oluşturmayı tekrar deneyin

## Alternatif Çözüm
Eğer hala çalışmazsa, Clerk JWT yerine **Supabase Service Role Key** kullanabiliriz. Bu daha basit ama daha az güvenli bir yöntemdir.
