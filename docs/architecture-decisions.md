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
## ADR-003: Müşteri portalı rezervasyon — çift mod (B/C)

**Tarih:** 11 Mart 2026  
**Durum:** Karara varıldı ✅

### Bağlam
Müşteri portalındaki rezervasyon takvimi pilates mantığı üzerine kuruluydu:  
staff haftalık slotları manuel oluşturur, müşteri mevcut slota tıklar (Mod B).  
Ama diş hekimi, psikolog, kuaför gibi sektörlerde staff her slotu manuel açamaz;  
müşterinin istediği saatte kendisi randevu oluşturması gerekir (Mod C).

### Karar
`config.features.classes` flag'ine göre takvim iki farklı mod çalışır:

| Mod | Sektörler | Nasıl çalışır |
|-----|-----------|--------------|
| **B — Staff-curated** | Pilates, Yoga | Staff `class_sessions` oluşturur → müşteri mevcut slota tıklar → timeline UI |
| **C — Auto-slot** | Diş, Saç, PT, Psikolog, Fizyo, Diyetisyen, Güzellik | Sistem `staff_schedules`'dan boş saatleri üretir → müşteri saat çipi seçer |

### Auto-slot algoritması (Mod C)
```
1. staff_schedules  → personelin haftalık çalışma saatleri (gün/saat)
2. staff_time_offs  → izin/tatil günlerini çıkar
3. 30 dakikalık grid üret (09:00, 09:30, 10:00 …)
4. Her slot için: slot bitiş zamanı (slot_start + duration_minutes) ≤ gün sonu?
5. Mevcut appointments ile çakışma kontrolü:
   - existing.start < slot_end  AND  existing.end > slot_start  → DOLU
6. Kalan slotlar: yeşil chip → tıklanabilir; dolu slotlar: gri üstü çizili
```

**Görüntü = tam/yarım saatler; Mantık = duration bazlı çakışma**  
(Psikolog 50dk seansı için görüntü 09:00, 09:30… ama 09:30 slotu  
09:00'daki 50dk seans bitmeden başlayacaksa `DOLU` sayılır)

### Gerekçe
- Grup sektörler için mevcut timeline UI dokunulmadan korunur
- Non-grup sektörler için staff manueli gereksiz 90+ slot açmak zorunda kalmaz
- Aynı `bookAppointment()` server action her iki modda da çalışır
- `staff_schedules` ve `staff_time_offs` tabloları zaten DB'de mevcuttu

### Gelecekte değiştirilirse
Mod C'de `bookAppointment()` çağrısı öncesinde bir "onay adımı" (hizmet seç → personel seç → saat seç → onayla) eklenebilir.