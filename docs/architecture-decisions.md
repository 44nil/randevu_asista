# Architecture Decisions

Burası bilinçli alınan mimari kararların kaydıdır.  
"Neden böyle yaptık?" sorusuna cevap verir.

---

## ADR-001: class_sessions tüm sektörlerde kullanılır (kapasite=1 ile)

**Tarih:** 11 Mart 2026  
**Durum:** Karara varıldı ✅

### Bağlam
Her randevu oluşturma işlemi iki tabloya yazar:
```
class_sessions  → slot (saat, kapasite, eğitmen/hekim)
appointments    → katılım (hangi müşteri o slota bağlı)
```
Pilates için bu mantıklı (kapasite=8, birden fazla üye aynı slota).  
Ama diş, psikolog, diyetisyen gibi sektörler için her randevu zaten 1 kişilik.

### Karar
`features.classes: false` olan sektörler (dental, hair, physio, vs.) için **class_sessions atlanmaz**, kapasite **otomatik olarak 1** set edilir.

```typescript
// appointment-actions.ts — createClassSession()
const defaultCapacity = data.capacity || (config.features.classes ? 8 : 1);
```

### Gerekçe
- DB şemasını değiştirmek deploy öncesinde riskli
- Kapasite=1 ile davranış zaten doğru (çakışma engellenir, tek hasta girer)
- Sorgular, raporlama ve müşteri portalı tek kod yoluyla çalışır
- İleride ayrıştırma gerekirse `session_id IS NULL` filtresiyle standalone appointments kolayca eklenir

### Gelecekte değiştirilirse
`features.classes: false` sektörler için `createClassSession()` yerine direkt `appointments` tablosuna yazar yeni bir `createAppointment()` fonksiyonu yazılabilir.

---

## ADR-002: DB'de 4 industry_type, UI'da 9 sektör

**Tarih:** 11 Mart 2026  
**Durum:** Karara varıldı ✅

### Bağlam
Supabase `organizations.industry_type` kolonu enum kısıtlı: `pilates | hair | dental | general`  
Ama onboarding'de 9 sektör seçeneği var.

### Karar
- DB'ye yazarken `INDUSTRY_DB_ALIAS` ile 4 tipe eşle
- Gerçek sektör `settings.real_industry` alanına kaydedilir
- `getIndustryConfig()` her zaman `real_industry`'i okur → UI doğru config'i gösterir

```
yoga  → DB: pilates  | settings.real_industry: yoga  → UI: Yoga config
physio → DB: dental  | settings.real_industry: physio → UI: Fizyoterapi config
```

### Gerekçe
- DB migration riski olmadan 9 sektör desteklenir
- İleride DB enum genişletilirse sadece `INDUSTRY_DB_ALIAS` tablosu güncellenir

---
