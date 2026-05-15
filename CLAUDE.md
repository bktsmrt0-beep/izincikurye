# izincikurye — Codebase Haritası

## Proje Özeti

- **Adı:** izincikurye.com — Ankara izinci kurye ilan platformu
- **Stack:** HTML + CSS + Vanilla JS + Supabase (Postgres + Auth + Storage + RLS)
- **Hosting:** Vercel (auto-deploy from `main`), domain: https://izincikurye.vercel.app
- **Repo:** https://github.com/bktsmrt0-beep/izincikurye

> **Not:** Her HTML/JS/CSS değişiminde `index.html` ve `admin.html`'de `?v=N` query parametresi artırılır. Commit + push → Vercel otomatik deploy ~30-60sn. Şu an `?v=106`.

> **Önemli:** script.js'in başında **YOL HARİTASI** yorum bloğu vardır (satır 3-95) — feature için doğrudan satır aralığına git, Grep tarama yapmadan. Bu CLAUDE.md o haritanın geniş açıklamasıdır.

---

## script.js Haritası (v106)

Bölümler `// =============== BÖLÜM ===============` marker'larıyla ayrılmıştır. script.js başındaki **yorum haritası** (satır 3-95) öncelikli referans.

| Bölüm | Satır | Anahtar fonksiyonlar |
|---|---|---|
| YOL HARİTASI yorum bloğu | 3-95 | (dokümantasyon) |
| BFCACHE FIX | 17-29 | `pageshow` restore reload (admin↔home stale state fix) |
| VERİ | 31-37 | `ANKARA_ILCELERI` listesi (25 ilçe) |
| DURUM (state) | 39-58 | `currentUser`, `ilanlar`, `favoriler` Set, `userReaksiyonlar` Map, `_editingIlanId`, `ETIKET_LABELS` |
| DOM REF | 60-86 | top-level `getElementById` const'ları |
| TOAST / HATA BANNER | 87-112 | `toast()`, `showError()` |
| SUPABASE: SESSION | 113-184 | `syncSession()`, `onAuthStateChange` listener |
| SUPABASE: İLANLAR | 185-254 | `loadIlanlar({append})` — pagination + profile batch |
| RENDER: TOP NAV | 256-358 | `renderTopNav()` — user-menu dropdown |
| RENDER: FİLTRELER | 360-405 | `getFilteredIlanlar()`, `activeFilterCount()`, `formatMembership()` |
| **RENDER: İLAN COMPACT LİSTE** | **406-508** | `renderListings()` — compact satır (📍 Bölge \| ⏰ Süre \| 💰 Saatlik \| 🏍 KM \| 💵 Tahmini \| 🟢 Aktif) |
| **İLAN DETAY MODAL** | **509-679** | `buildIlanCardHTML(i)` (tam kart), `openIlanDetail(ilan)` (modal aç + `/ilan/<id>` URL) |
| renderEmptyState | 681-717 | İlçe öneri chip'leri |
| FAVORİLER (DB hâlâ aktif) | 735-740 | `loadFavoriler()` — favoriler Set + userReaksiyonlar Map yükler |
| **REAKSİYON SİSTEMİ** | **755-822** | `toggleReaksiyon(ilanId, tip)` — beğen/beğenmeme birbirini iter (Reddit), `_refreshRxnBtns()` |
| toggleFavori (UI yok) | 837-878 | DB tablosu açık ama UI butonu yok — `favoriler` revival için |
| KEBAB DROPDOWN | 881-911 | `_openKebab()` / `_closeKebab()` — mobil ⋮ butonu için (Paylaş + reaksiyonlar) |
| ŞİKAYET | 914-931 | `openSikayetModal(ilanId)` + form submit |
| EDIT İLAN | 947-979 | `openEditIlan(ilan)`, `resetIlanFormMode()` — formu UPDATE moduna alır |
| _isHemenBasla | 988 | bas_saat ±2sa içinde mi (Hemen Başla rozeti) |
| KART AKSİYONLARI | 998-1109 | **global document click delegasyon**: open-detail, kebab, share, edit, report, rxn, call, wa, addr, delete |
| YORUM/PUAN SİSTEMİ | 1110-1410 | `refreshPendingReviewCount`, `openReviewListModal`, `openReviewWriteModal`, `openReviewViewModal` |
| İLAN KALDIRMA AKIŞI | 1412-1592 | `openDeleteIlanModal`, `performDeleteWithReview` (RPC) |
| eski showAdres | 1528-1591 | (DEPRECATED ama hâlâ tanımlı) — eski derin link |
| MODALLAR (open/close) | 1592-1670 | `closeModals()` — ilanDetailModal + kuryeDetailModal + adresModal popstate desteği |
| SIDEBAR DRAWER | 1647-1726 | Hamburger menü açma/kapama |
| KAYIT/AUTH | 1728-1791 | register form + `_bindPhoneInput` (her telefon input için +90 prefix bind) |
| GİRİŞ | 1807-1848 | login form (Beni hatırla, rawSignIn) |
| ŞİFREMİ UNUTTUM | 1849-1886 | resetPasswordForEmail + forgotResetForm |
| İLAN VER (form) | 1887-2098 | `calcSureSaat`, `_updateSureOzeti`, ilanForm submit (INSERT vs UPDATE branch) |
| YARDIMCI | 2099-2154 | `escapeHtml`, `formatAktifSure`, `_updateAktifSayaclar` (setInterval 1sn) |
| FİLTRELER | 2155-2185 | client-side saat/fiyat/sort/urgent filtre handler'ları |
| İLANLARIM TOGGLE | 2186-2198 | sidebar `all↔mine` |
| PROFİLİM YARDIMCILARI | 2199-2415 | `formatTel`, `_displayPhone`, `_phoneToE164`, `_isMobileTr`, `_readProfileForm`, `profileHasChanges`, `switchProfileTab`, `computeProfileCompletion`, `loadLastSignIn` |
| PROFİL: tercih+saat doldur | 2314-2375 | day-chip listener, bio counter, bildirim toggle |
| Smart Profile (loadProfileStats) | 2469-2741 | hero + KPI + smart card + tile badges + progress chip |
| PROFİL MODAL | 2742-3001 | `openProfileModal()`, profileForm submit, avatar upload/remove |
| MÜSAİTLİK TOGGLE | 3016-3042 | kurye `musait` boolean DB update |
| ŞİFRE DEĞİŞTİR | 3043-3085 | changePasswordForm submit |
| HESABI KAPAT | 3086-3149 | çift onay → ilan+profil sil → signOut |
| KURYE KONTROL PANELİ | 3150-3279 | `renderKuryeDashboard()`, `syncDashboardToggle()` (kurye için anasayfa dashboard) |
| **MÜSAİT KURYELER COMPACT LİSTE** | **3280-3384** | `loadMusaitKuryeler()`, `renderMusaitKuryeler()` — compact satır (Ad \| Puan \| Bölge \| Ücret \| Müsait) |
| **KURYE DETAY MODAL** | **3385-3509** | `buildKuryeDetailHTML(k)` (avatar+puan+grid+chips+aksiyon), `openKuryeDetail(k)` (modal aç + `/kurye/<id>` URL) |
| KURYE click handler | 3540-3548 | global document click — `data-kact` delegasyon (open-kurye-detail, show-reviews, call, wa) |
| İLK YÜKLEME (IIFE) | 3564-end | `_enforceRememberMe`, `syncSession`, parallel init + `openIlanFromUrl`, `copyIlanLink` |

---

## index.html — Modal Haritası

| Modal | Satır |
|---|---|
| KAYIT MODAL | 78-160 (kullanici_tipi + businessFields + ad/soyad/email/tel/şifre/sözleşme) |
| GİRİŞ MODAL | 163-186 |
| İLAN VER MODAL | 188-260 (auto-fill ipuçları satır 230, 240) |
| ŞİFREMİ UNUTTUM (E-POSTA) | 262-275 |
| ŞİFREMİ UNUTTUM (YENİ ŞİFRE) | 277-292 |
| ADRES MODAL | 295-302 |
| PROFİLİM MODAL | 304-459 (sekmeler 318-323, Genel 326-339, Profil form 341-407, Bildirim 409-422, Güvenlik 449-454) |
| ŞİFRE DEĞİŞTİR MODAL | 461-479 |

Cache-bust scriptleri en altta:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4"></script>
<script src="supabase-config.js?v=106"></script>
<script src="script.js?v=106"></script>
```
Ek olarak `style.css?v=106` (her ikisi index.html ve admin.html'de).

> CDN versiyonu **pinned** (`@2.45.4`) — minor sürüm bozulmasından korur.

### Yeni modal'lar (v99+)
| Modal | Amaç |
|---|---|
| `#ilanDetailModal` | Compact listede ilana tıklayınca tam kart açılır (`buildIlanCardHTML`) |
| `#kuryeDetailModal` | Compact listede kuryeye tıklayınca detay kart (avatar+puan+grid+chips) |
| `#sikayetModal` | İlan şikayeti — sebep dropdown + açıklama |

---

## style.css — Bölüm Haritası

| Bölüm | Satır |
|---|---|
| HEADER | 33-74 |
| LAYOUT + SIDEBAR + CONTENT (kart, badge) | 76-224 |
| MODAL + FORM + SCALE | 225-288 |
| FOOTER + ADRES İÇERİĞİ | 289-305 |
| MOBILE @media (760px, 520px) | 306-333 |
| Şifre göster/gizle | 335-360 |
| İlanlarım toggle (segmented) | 362-413 |
| Avatar | 415-486 |
| Toast | 488-519 |
| Kullanıcı menüsü dropdown | 521-564 |
| Profil sekmeleri + tamamlama | 566-620 |
| Paket 2: gün seçici, char counter | 622-650 |
| Paket 3: bildirim toggle satırları | 652-666 |
| Paket 4: güvenlik info | 668-676 |
| İlan kalan süre rozeti | 678-694 |
| Kullanıcı tipi (kayıt) | 696-732 |
| Kullanıcı tipi rozeti (profil) | 738-end |

---

## Yardımcı Fonksiyon İndeksi

| Fonksiyon | Konum | Amaç |
|---|---|---|
| `toast(msg, type, ms)` | script.js:55 | Sayfa üstü 3sn bildirim |
| `showError(msg)` | script.js:69 | Kalıcı kırmızı banner |
| `setStatus(elId, type, msg)` | script.js:739 | Modal içi inline durum |
| `clearStatus(elId)` | script.js:745 | Inline statusu temizle |
| `setBusy(btnId, busy, text)` | script.js:747 | Submit butonu pasif + "Kaydediliyor..." |
| `formatTel(raw)` | script.js:759 | `0532 123 45 67` formatlama |
| `_telDigits(s)` | script.js:770 | Telefon sayı çıkarma (karşılaştırma için) |
| `formatDateTime(iso)` | script.js:704 | TR locale tarih+saat |
| `formatRemaining(expIso)` | script.js:713 | "X sa Y dk kaldı" + urgent flag |
| `escapeHtml(s)` | script.js:697 | XSS önleme |
| `openModal(id)` / `closeModals()` | script.js:393, 401 | Modal göster/gizle + body scroll lock + focus |
| `openUserMenu()` / `closeUserMenu()` | script.js:430, 437 | Üst sağ kullanıcı dropdown |
| `readStoredSession()` | supabase-config.js | localStorage'dan token JSON oku (getSession bypass) |
| `rawSelect(path, accessToken, ms)` | supabase-config.js | Ham fetch SELECT (supabase-js bypass) |
| `rawRpc(fnName, params, token, ms)` | supabase-config.js | Ham fetch RPC çağrısı |
| `rawInsert(table, row, token, ms)` | supabase-config.js | Ham fetch INSERT (PostgREST) |
| `rawSignIn(email, password)` | supabase-config.js | Ham auth/v1/token (login hang fix) |
| `rawSignUp(email, password, metadata, redirect)` | supabase-config.js | Ham auth/v1/signup |
| `getFilteredIlanlar()` | script.js | Client-side filtre + sıralama (saat/fiyat/sort/urgent) |
| `formatMembership(createdAt)` | script.js | "Üye 8 ay" / "Üye 2 yıl" |
| `openIlanFromUrl()` | script.js | `?ilan=<id>` query param ile derin link açar |
| `copyIlanLink(ilanId)` | script.js | Bağlantıyı clipboard'a kopyala |
| `openDeleteIlanModal(ilan)` | script.js | İlan kaldırma + kurye telefon modalı |
| `performDeleteWithReview(id, tel)` | script.js | `grant_review_and_delete_ilan` RPC çağrısı |
| `_phoneRaw10(input)` | script.js | Telefon → son 10 rakam (0/90 prefix kırpar) |
| `_formatPhone10(d)` | script.js | "5XX XXX XX XX" canlı format |
| `formatTel(raw)` | script.js | Her zaman "+90 XXX XXX XX XX" formatında döner (input live format için) |
| `_phoneToE164(raw)` | script.js | "+905XXXXXXXXX" formatına normalize eder (DB storage) |
| `_isMobileTr(raw)` | script.js | Son 10 hanenin ilki 5 mi? (cep telefonu kontrolü, WhatsApp için) |
| `_displayPhone(raw)` | script.js | "+90 532 123 45 67" görsel format (render) |
| `_bindPhoneInput(id)` | script.js | Telefon input'una canlı format + focus/blur "+90 " prefix bağlar |
| `calcSureSaat(bas, bit)` | script.js | İlan saat aralığından toplam süreyi hesaplar (gece geçişi destekli) |
| `formatAktifSure(createdIso)` | script.js | "21 dakika 14 saniyedir aktif" canlı sayaç metni |
| `_updateAktifSayaclar()` | script.js | Tüm `.ilan-aktif-sayac` elemanlarını günceller (setInterval 1sn ile) |
| `refreshPendingReviewCount()` | script.js | İşletme yorum banner + menü badge günceller |
| `openReviewListModal()` | script.js | Bekleyen / yorumladıklarım modal |
| `openReviewWriteModal(d)` | script.js | Yıldız + metin yorum yazma |
| `openReviewViewModal(kuryeId, ad)` | script.js | Kurye için tüm yorumları göster |
| `renderSkeletons(n)` | script.js | İskelet kart render (loading) |
| `loadProfileStats()` | script.js | Smart Profile Genel sekmesini doldur (hero + KPI + smart card + tile badges + progress) |
| `renderSmartCard({...})` | script.js | Duruma göre "Sıradaki Adım" kartı içeriği (bekleyen yorum / ilan ver / müsait aç / profil tamamla / her şey hazır) |
| `checkProfilEksikBanner()` | script.js | İşletme için boş alan varsa sayfada sarı uyarı bandı gösterir, sessionStorage ile dismiss |
| `switchProfileTab(name)` | script.js:890 | Genel/Profil/Bildirim/Güvenlik sekme geçişi |
| `computeProfileCompletion()` | script.js:909 | 10 alana göre yüzde hesaplar |
| `refreshCompletion()` | script.js:924 | Bar ve metni günceller |
| `refreshProfileSaveBtn()` | script.js:778 | Değişiklik yoksa Kaydet pasif |
| `_readProfileForm()` | script.js:783 | Form alanlarından obje üret |
| `profileHasChanges()` | script.js:803 | currentUser ile karşılaştır |
| `setAvatarPreview(url)` | script.js:1000 | Yuvarlak avatar görsel set |
| `loadProfileStats()` | script.js:955 | İlan sayısı + üyelik gün hesabı |
| `loadLastSignIn()` | script.js:939 | auth.users.last_sign_in_at göster |

### v99+ — Compact List + Detail Modal Helpers
| Fonksiyon | Konum | Amaç |
|---|---|---|
| `buildIlanCardHTML(i)` | script.js:511 | Tam ilan kartı HTML (modal içine yerleştirilir) |
| `openIlanDetail(ilan)` | script.js:663 | İlan detay modalı aç + `/ilan/<id>` URL push |
| `buildKuryeDetailHTML(k)` | script.js:3387 | Tam kurye kartı HTML (avatar/puan/grid/chips/aksiyonlar) |
| `openKuryeDetail(k)` | script.js:3492 | Kurye detay modalı aç + `/kurye/<id>` URL push |
| `renderListings()` | script.js:406 | Compact satır render (6 hücre PC, 2-satır mobil) |
| `renderMusaitKuryeler()` | script.js:3308 | Compact kurye satırı render (5 hücre PC, 2-satır mobil) |

### v77+ — Reaksiyon Sistemi
| Fonksiyon | Konum | Amaç |
|---|---|---|
| `loadFavoriler()` | script.js:735 | `favoriler` Set + `userReaksiyonlar` Map paralel yükle |
| `toggleFavori(ilanId)` | script.js:837 | (UI yok ama DB aktif — revival için tutuldu) |
| `toggleReaksiyon(ilanId, tip)` | script.js:755 | Beğen/Beğenmeme — Reddit/YT tarzı birbirini iter |
| `_refreshRxnBtns(ilanId)` | script.js:820 | Reaksiyon butonlarını re-render et |
| `_openKebab(btn, ilan)` | script.js:886 | Mobil ⋮ dropdown aç (Paylaş + Beğen + Beğenmeme + Sorun Bildir) |

### v75+ — Etiket, Düzenle, Şikayet
| Fonksiyon | Konum | Amaç |
|---|---|---|
| `openSikayetModal(ilanId)` | script.js:914 | İlan şikayeti modalı aç |
| `openEditIlan(ilan)` | script.js:947 | İlan formunu UPDATE modunda doldur |
| `resetIlanFormMode()` | script.js:979 | Form'u INSERT moduna çevir |
| `_isHemenBasla(basSaat)` | script.js:988 | bas_saat ±'a yakınsa "Hemen Başla" rozeti |

---

## DB Şeması

### `profiles` tablosu

```
id              uuid PK FK auth.users(id) ON DELETE CASCADE
ad, soyad, tel  text NOT NULL
ticari          boolean DEFAULT false
created_at      timestamptz
role            text DEFAULT 'user' CHECK ('user'|'admin')
avatar_url      text
bio             text
tercih_ilceler  text[]
calisma_baslangic, calisma_bitis  smallint (0-23)
calisma_gunleri smallint[] (1=Pzt..7=Paz)
min_ucret, max_ucret  int
bildirimler     jsonb DEFAULT '{"yeni_ilan":true,"ilanim_goruldu":true,"kampanya":false}'
kullanici_tipi  text CHECK ('kurye'|'isletme')
isletme_adi     text
isletme_tipi    text CHECK in ('restoran','market','eczane','cafe','diger')
is_adresi       text
is_telefonu     text
musait          boolean DEFAULT false
musait_at       timestamptz
puan_ort        numeric(3,2)         -- 0.00-5.00 (yorumlardan denormalize)
puan_sayisi     int DEFAULT 0
```

### `yorumlar` tablosu

```
id           uuid PK
kurye_id     uuid FK profiles(id) ON DELETE CASCADE
isletme_id   uuid FK profiles(id) ON DELETE CASCADE
ilan_id      uuid (nullable — ilan silinmiş olabilir)
puan         smallint CHECK (1-5)
yorum        text (max 500)
created_at   timestamptz
UNIQUE (kurye_id, isletme_id, ilan_id)
```

### `yorum_haklari` tablosu

```
id           uuid PK
kurye_id     uuid FK profiles(id)
isletme_id   uuid FK profiles(id)
ilan_id      uuid
ilan_baslik  text                -- ilan silindiğinde kalsın
kullandi    boolean DEFAULT false
created_at   timestamptz
UNIQUE (kurye_id, isletme_id, ilan_id)
```

### `ilanlar` tablosu

```
id           uuid PK
user_id      uuid FK auth.users(id) ON DELETE CASCADE
baslik       text (3-80)
ilce         text
saat         int (otomatik hesap: bas/bit'ten gece geçişi destekli; 1-23)
fiyat        int (200-300)  -- SAATLİK ücret
km           int (5-10)     -- motosiklet KM ücreti
bas_saat, bit_saat   text (HH:00) -- gece geçişi: bit < bas
aciklama     text
isyeri_ad, isyeri_adres   text
iletisim_tel text  -- E.164 formatında (+90...), boşsa profiles.tel fallback
etiketler    text[] DEFAULT '{}'   -- paket_teslimati / guvenli_odeme / anlik_ihtiyac
kisa_id      text UNIQUE          -- KRY-XXXX okunabilir kısa ID (sequence + trigger)
kalp_sayisi  int DEFAULT 0        -- favoriler denormalized count
begen_sayisi int DEFAULT 0        -- reaksiyonlar (begen) denormalized count
begenmeme_sayisi int DEFAULT 0    -- reaksiyonlar (begenmeme) denormalized count
created_at   timestamptz
expires_at   timestamptz DEFAULT now() + 24h
```

### `favoriler` tablosu (sql/10)
```
id, user_id, ilan_id, created_at
UNIQUE (user_id, ilan_id)
```
RLS: kullanıcı sadece kendi satırlarını okur/yazar/siler.

### `reaksiyonlar` tablosu (sql/11)
```
id, user_id, ilan_id, tip text CHECK (tip in ('begen','begenmeme')), created_at
UNIQUE (user_id, ilan_id)   -- bir kullanıcı tek reaksiyon (Reddit/YT tarzı)
```
RLS: SELECT herkes, INSERT/UPDATE/DELETE sadece sahibi. Trigger `bump_reaksiyon_sayilar()` ilanlar.begen_sayisi / begenmeme_sayisi'ni günceller.

### `sikayetler` tablosu (sql/10)
```
id, ilan_id, user_id, sebep text, aciklama text, durum text DEFAULT 'beklemede', created_at
durum: 'beklemede' | 'incelendi' | 'reddedildi'
```
RLS: kullanıcı kendi şikayetlerini görür, admin hepsini görür ve günceller.

### Yardımcı

- **View:** `ilanlar_public` → `WHERE expires_at > now()` (anon tarafından okunabilir)
- **Function:** `is_admin()` SECURITY DEFINER → RLS politikalarında recursion önler
- **Function:** `handle_new_user()` SECURITY DEFINER → `auth.users` insert trigger'ı, profiles satırı oluşturur (metadata'dan alır)
- **Function:** `cleanup_expired_ilanlar()` SECURITY DEFINER → pg_cron ile günlük 03:00 UTC, 7+ gün önce expire olan ilanları siler
- **Function:** `check_daily_ilan_limit()` trigger → 24h içinde 5'ten fazla ilan açan kullanıcıya `GUNLUK_ILAN_LIMITI` hatası
- **Function:** `my_daily_ilan_count()` RPC → kullanıcının son 24 saatteki ilan sayısı
- **Function:** `grant_review_and_delete_ilan(p_ilan_id, p_kurye_tel)` RPC SECURITY DEFINER → ilanı sil + telefon eşleşirse yorum hakkı ver; **son 10 haneye göre** karşılaştırır (sql/06)
- **Function:** `refresh_kurye_puan(p_kurye_id)` SECURITY DEFINER → yorum eklenince/silinince profiles.puan_ort + puan_sayisi günceller (trigger ile otomatik)
- **Function:** `mark_yorum_hakki_used()` trigger → yorum yazılınca yorum_haklari.kullanildi=true
- **Function:** `notify_new_ilan_webhook()` trigger (opsiyonel, sql/04) → pg_net ile Edge Function'a webhook (email bildirim)

### SQL migration dosyaları (sql/ klasöründe)

| Dosya | İçerik |
|---|---|
| `03_cleanup_and_rate_limit.sql` | pg_cron + 24h ilan limiti trigger |
| `04_notify_trigger.sql` | Yeni ilan → Edge Function webhook |
| `05_yorum_puan_sistemi.sql` | yorumlar + yorum_haklari + RPC + RLS + trigger |
| `06_phone_match_fix.sql` | grant_review_and_delete_ilan son-10-hane karşılaştırma |
| `07_isletme_alanlari.sql` | profiles.isletme_tipi sütunu + CHECK constraint |
| `08_iletisim_tel.sql` | ilanlar.iletisim_tel sütunu (ilana özel cep telefonu) |
| `09_phone_e164.sql` | Tüm telefonları E.164 (+90...) formatına çevirir + `_phone_to_e164()` SQL helper |
| `10_etiketler_favoriler_kisaid.sql` | ilanlar.etiketler/kisa_id (sequence) + favoriler + sikayetler + RLS |
| `11_reaksiyonlar_sayilar.sql` | reaksiyonlar tablo + kalp/begen/begenmeme sayaçları + trigger'lar |

### Storage

- Bucket: `avatars` (public)
- Path: `avatars/{user_id}/avatar.{ext}`
- RLS: herkes okur; sahibi yükler/günceller/siler

---

## Sürekli Kullanılan Pattern'lar

### getSession bypass (kritik)

`sb.auth.getSession()` Supabase publishable key + lock mekanizmasıyla takılabilir. Yerine:

```js
const session = readStoredSession(); // localStorage'dan direkt
if (session?.user) { /* logged in */ }
```

### Profile sorgusu bypass (kritik)

`sb.from("profiles").select(...)` da takılabilir. Yerine ham fetch:

```js
const { data, error } = await rawSelect(
  `profiles?id=eq.${userId}&select=*`,
  session.access_token,
  6000  // timeout ms
);
const profile = data?.[0] || null;
```

### RPC ve INSERT bypass (yeni — kritik)

`sb.rpc()` ve `sb.from().insert()` de aynı kilitleme sorununa takılabilir. Yorum sistemi için:

```js
// RPC çağrısı
const { data, error } = await rawRpc(
  "grant_review_and_delete_ilan",
  { p_ilan_id: ilanId, p_kurye_tel: "+905321234567" },
  session?.access_token,
  8000
);

// INSERT
const { data, error } = await rawInsert(
  "yorumlar",
  { kurye_id, isletme_id, puan, yorum },
  session?.access_token
);
```

Tüm helper'lar `supabase-config.js`'te. **Yeni feature yazarken** `sb.from`/`sb.rpc` yerine ham fetch'i tercih et.

### Toast vs banner vs alert

- **`toast(msg, "ok")`** → kısa süreli onay (Profil güncellendi)
- **`setStatus(modalEl, "error", msg)`** → modal içi inline (form validation)
- **`showError(msg)`** → kalıcı sayfa üstü banner (kritik init hatası)
- **`alert()`** → eski; mümkünse toast/setStatus tercih et

### Form değişiklik takibi

```js
profileHasChanges() // tüm alanları currentUser ile karşılaştır
refreshProfileSaveBtn() // değişiklik yoksa Kaydet pasif
```

---

## "Nereye Dokunmalı" Cheatsheet

### 🎯 Feature → Dosya/Satır Hızlı Bakış (v106)

| Çalışıyorum | script.js satır | style.css satır | Detay |
|---|---|---|---|
| **İlan compact liste** | 406-508 (`renderListings`) | `.ilan-row`, `.ilan-row-cell` | 6 hücre PC, 2 satır mobil |
| **İlan detay modal** | 511-665 (`buildIlanCardHTML`, `openIlanDetail`) | `#ilanDetailModal`, `.ilan-card-v75` | Tam kart modal'da |
| **Müsait kurye liste** | 3308 (`renderMusaitKuryeler`) | `.kurye-row` | 5 hücre PC, 2 satır mobil |
| **Kurye detay modal** | 3387 (`buildKuryeDetailHTML`), 3492 (`openKuryeDetail`) | `#kuryeDetailModal`, `.kurye-detail-v75` | Avatar + grid + chips + aksiyon |
| **Reaksiyonlar (👍 👎)** | 755 (`toggleReaksiyon`), 820 (`_refreshRxnBtns`) | `.menu-item.rxn-*`, `.kmenu-rxn` | Reddit tarzı birbirini iter |
| **İlan form (yeni/edit)** | 1873-2098, 947 (`openEditIlan`) | İlan VER modal stilleri | INSERT/UPDATE branch |
| **Şikayet** | 914 (`openSikayetModal`) | `#sikayetModal` | Sebep dropdown + açıklama |
| **Yorum/Puan** | 1110-1410 | review modal stilleri | İşletme→kurye yorumu |
| **Filtreler (saat/fiyat/sort/urgent)** | 360 (`getFilteredIlanlar`), 2155-2185 | `.filter-*`, `.seg-*` | client-side filtre |
| **Profil modal** | 2742 (`openProfileModal`) | Smart Profile stilleri | Hero + KPI + Smart Card |
| **Auth (kayıt/giriş)** | 1728-1848 | KAYIT/GİRİŞ modal | rawSignIn/rawSignUp |

### `profiles` tablosuna yeni alan ekle
1. **SQL:** `alter table profiles add column ...`
2. **Trigger:** `handle_new_user`'a metadata'dan alma satırı (yeni kullanıcılar için)
3. **script.js:syncSession** zaten `select("*")` çekiyor, otomatik gelir
4. **currentUser** mapping (camelCase): `currentUser.yeniAlan = profile?.yeni_alan || ""`
5. **openProfileModal** (script.js:2756)'da inputu doldur
6. **`_readProfileForm`** (script.js:2272)'a inputu ekle, `profileHasChanges`'e karşılaştırma
7. **`profileForm` submit**'te `updateObj`'e ekle
8. **`computeProfileCompletion`** (script.js:2393) isteğe bağlı genişlet
9. **CLAUDE.md** güncelle (DB Şeması bölümü)

### Yeni modal eklemek
1. **index.html** sonuna `<div class="modal hidden" id="newModal">` ekle
2. **script.js:MODALLAR** (1592) zaten `openModal`/`closeModals` global; URL state istersen `history.pushState` ekle, `closeModals()` ve `popstate`'i güncelle
3. CSS gerekirse style.css sonuna ekle (ID specificity ile `.modal-wide` override edilebilir)
4. **Cache-bust** `?v=N` artır

### Yeni ilan alanı
1. **DB:** `ilanlar` tablosuna sütun (SQL migration)
2. **index.html:İLAN VER MODAL** input ekle
3. **script.js:1887+** `ilanForm` submit'te `payload` objesine ekle (INSERT/UPDATE her ikisi de aynı payload)
4. **script.js:511 `buildIlanCardHTML`** template'ine ekle (modal'da görünmesi için)
5. **script.js:406 `renderListings`** compact satıra eklemek istersen ekle (yer kısıtlı)
6. View `ilanlar_public` tanımını da gerekirse güncelle

### Yeni reaksiyon eklemek (örn. ⭐ favori UI revival)
1. **DB:** `reaksiyonlar.tip` CHECK constraint'ine yeni değer ekle veya yeni tablo
2. **script.js:755 `toggleReaksiyon`** branch ekle
3. **script.js:820 `_refreshRxnBtns`** tip-based render güncelle
4. **buildIlanCardHTML / _openKebab** yeni butona ekle (`data-act="rxn" data-rxn-tip="..."`)

### RLS politikası
- Recursion riski varsa `is_admin()` SECURITY DEFINER fonksiyonunu kullan
- Yeni rol kontrolü için yeni fonksiyon ekle, içinde RLS'i bypass et

---

## Bilinen Tuzaklar

1. **Supabase publishable key** (`sb_publishable_*`) ile `getSession`/`from().select`/`rpc`/`insert` bazen takılır → `readStoredSession` + `rawSelect`/`rawRpc`/`rawInsert` ile bypass edildi.
2. **`autoRefreshToken: false`** + **`lock: noopLock`** ayarlandı (supabase-config.js).
3. **`detectSessionInUrl`** sadece URL hash'inde `type=recovery` varsa `true`.
4. **BFCache restore'da** sayfa otomatik reload (script.js:5-15, admin.js sonu).
5. **Mobil:** `.row-2` 520px altında otomatik tek sütun.
6. **WhatsApp tel:** numara `9` yerine `90` ile prefix'lenir (script.js içinde fix var).
7. **Esc** modal kapatır + user-menu kapatır.
8. **Beni hatırla:** sessionStorage flag (`izk_session_active`) ile sekme bazında çalışır.
9. **Telefon eşleştirme**: son 10 haneye göre yapılır (sql/06). `+90`, `0`, boşluk farkı önemli değil.
10. **Yorum hakkı**: işletme `kullanici_tipi`'ne bakılmaz — yorum hakkı oluşmuş herkes banner görür. Yetki kontrolü tamamen DB tarafında (RLS + `yorum_haklari` tablosu).
11. **Sticky banner z-index**: header z=60, banner z=40, banner top=56px (header altında sticky kalır, üstüne çıkmaz).
12. **`?ilan=<id>`** URL ile derin link: sayfa açılışında `openIlanFromUrl()` çağrılır, anonim ise kayıt modalı açar.
13. **Profilim modal yapısı (Smart Profile, v57+):** "Genel" sekmesi tamamen yeniden — `pf-hero` / `pf-kpi-row` / `pf-smart-card` / `pf-actions-grid` / `pf-progress-chip`. Eski `statMyIlan`/`statMemberDays`/`goToMyListingsBtn` ID'leri DOM'da hidden korunuyor (geri uyumluluk).
14. **İşletme alanları zorunluluğu (v58+):** Kayıtta + profil kaydetmede `isletme_adi`, `is_adresi`, `is_telefonu` (>= 10 hane) hepsi zorunlu. Eksik ise toast hatası + ilgili sekmeye otomatik geçiş.
15. **Profil eksik uyarı banner (v59+):** İşletme için `checkProfilEksikBanner()` sayfa init'inde + her profil kaydından sonra çağrılır. Dismiss `sessionStorage.izk_dismiss_pebanner_<id>`.
16. **3 sticky banner z-index sırası:** header(60) > kurye müsait(40) > işletme yorum(40) > profil eksik(35).
17. **Telefon E.164 formatı (v71+):** Tüm `tel`/`is_telefonu`/`iletisim_tel` alanları `+905XXXXXXXXX` formatında saklanır. UI giriş `formatTel()`, DB yazım `_phoneToE164()`, render `_displayPhone()`. WhatsApp + tel: linkleri E.164 ile çalışır. Eski kayıtlar `sql/09_phone_e164.sql` migration ile dönüştürüldü.
18. **Cep zorunluluğu (v71+):** Kayıtta `tel` 5XX ile başlamalı (mobile); ilan `iletisim_tel` de mobile zorunlu (WhatsApp için). İşletme `is_telefonu` sabit hat olabilir (312...).
19. **İlan saati otomatik (v74+):** Form'da slider yok; `saat` alanı `calcSureSaat(bas, bit)` ile otomatik hesaplanır (gece geçişi: `(bit - bas + 24) % 24`). Hidden input `#saatRange` ile gönderilir.
20. **İlan kartı yeni hiyerarşi (v74+):** `.card-top` (ilçe + canlı sayaç + 🔥 acil chip) → başlık → kurye rozetleri → `.ilan-hero` (büyük saat aralığı + süre) → `.ilan-chips` (fiyat/km/tahmini kazanç) → açıklama → aksiyonlar. Eski `time-left`, `card-meta`, "kalan süre" kaldırıldı.
21. **Canlı aktif sayaç:** `setInterval(1000ms)` ile `_updateAktifSayaclar()` tüm `.ilan-aktif-sayac` elemanlarını günceller. `document.visibilityState === "visible"` kontrolü ile sekme arkaplanda dururken pil tasarrufu.
22. **Yasal metinler (v65+):** `/sozlesmeler.html` standalone sayfa, 4 anchor bölüm: `#uyelik`, `#kvkk`, `#cerez`, `#ticari-ileti`. Şirket: Carga Kurye Ltd. Şti. · Mithatpaşa V.D. 2030889421. İletişim: info@cargakurye.com. Kayıt modal'daki link'ler ve footer link'leri buraya gider.
23. **Mobil geri tuşu (v63+):** İlan detay modal'ı `pushState({modal:'adres'})` ile history girişi ekler; `popstate` listener geri tuşunda modalı kapatır. `closeModals()` `history.back()` ile push'u geri alır.
24. **Duplicate syncSession bug fix (v62+):** `onAuthStateChange` listener'ı `INITIAL_SESSION` ve `TOKEN_REFRESHED` event'lerinde early return — init IIFE zaten syncSession çağırıyor, duplicate önlenir.
25. **Compact liste + Detay modal pattern (v99+):** Liste sayfası `renderListings` artık tam kart yerine **compact satır** üretir (her satır `data-act="open-detail"`). Tıklayınca `openIlanDetail()` mevcut `buildIlanCardHTML(i)` ile detay modal açar. Aynı yapı `renderMusaitKuryeler` + `openKuryeDetail` için.
26. **Reaksiyon sistemi (v77+):** `reaksiyonlar` tablosu, `UNIQUE(user_id, ilan_id)` constraint ile bir kullanıcı tek tip seçer (begen veya begenmeme — Reddit/YT tarzı birbirini iter). `toggleReaksiyon` önce DELETE + sonra INSERT eder. Trigger `bump_reaksiyon_sayilar()` ilanlar.begen_sayisi/begenmeme_sayisi denormalize column'larını günceller.
27. **Favoriler DB var, UI yok (v84+):** `favoriler` tablosu + `toggleFavori` fonksiyonu korunur; UI'da kalp butonu kaldırıldı. Revival edilirse `data-rxn-tip="kalp"` butonu eklenip handler `toggleFavori`'yi çağırabilir (bkz. v77 kebab dropdown'undaki eski kullanım).
28. **Kebab dropdown (v77+):** Mobil `.mcr-more` ve PC `.contact-more` buttonları `data-act="kebab"` ile `_openKebab()` tetikler. Menüde Paylaş + (sahibe) Düzenle + ayraç + Beğen[N] + Beğenmeme[N] + Sorun Bildir var. PC'de inline `menu-item` ile redundant ama hidden (sadece mobilde aktif).
29. **3 detay modal birbirine bağlı (v99+ pop/close):** `#ilanDetailModal`, `#kuryeDetailModal`, `#adresModal` — `closeModals()` üçünü de gözetir. URL state'leri: `modal:'ilanDetail'|'kuryeDetail'|'adres'`. Popstate herhangi biri açıksa modalı kapatır (siteden çıkmaz).
30. **Compact liste satırları farklı container:** `.listings` (ilan) ve `.kurye-listings` (kurye) ikisi de `flex column, max-width 1100px, margin auto` — eski auto-fill grid kaldırıldı. `.ilan-row` ve `.kurye-row` her ikisi de PC'de grid, mobilde grid-template-areas ile 2-satır.
31. **İlan detay modal genişlik bug (v100):** `.modal-card.modal-wide` max-width 480px kuralı detay modalı sıkıştırıyordu — `#ilanDetailModal .modal-card` ID specificity ile 880px override edildi. Aynı pattern `#kuryeDetailModal` için 640px.
32. **Tahmini kazanç formülü (v98):** `saat × saatlik_ücret + saat × 10 km/saat × km_ücreti`. Varsayım: kurye saatte ortalama 10 km gider. Hem compact satırda hem detayda gösterilir.
33. **CSS dead code temizliği (v106):** `.kurye-card/.kurye-head/.kurye-avatar/.kurye-info/.kurye-meta/.kurye-ilce/.kurye-saat/.kurye-bio` eski kurye kart tasarımı; `.contact-fav/.fav-ico/.contact-share/.share-ico/.reaction-row/.rxn-btn/.rxn-emoji/.rxn-count` eski reaksiyon row CSS — hepsi silindi. `.rxn-item.rxn-begen.active` vb. menu-item state'leri korundu. Toplam -184 satır.
34. **Detail modal kebab redundancy:** PC'de `.contact-more` (⋮) `display: none` (inline menü zaten görünür). Mobilde `.mcr-more` görünür ve kebab dropdown açar — mobilde inline menü gizli (sticky bar yerine compact ikon kolonu vs.).

---

## Cache-bust + Deploy Workflow

1. Değişiklik yap (script.js / index.html / style.css / admin.*)
2. `index.html` ve `admin.html`'de `?v=N` → `?v=N+1` (replace_all=true ile tek seferde)
3. `node -c script.js` ve `node -c admin.js` (sözdizimi)
4. `git add -A && git -c user.name="bktsmrt0-beep" -c user.email="bktsmrt0@gmail.com" commit -m "..."`
5. `git push origin main`
6. Vercel auto-deploy ~30-60sn
7. Doğrulama: `curl https://izincikurye.vercel.app/script.js?v=N | grep <yeni anahtar>`

---

## Yapılacaklar (TODO)

**Yapılan (referans için):**
- ✅ Süresi dolmuş ilanların pg_cron temizliği (sql/03)
- ✅ Bildirim email tetiklemesi — Edge Function kodu hazır (`supabase/functions/notify-new-ilan/`), DB trigger sql/04; **kullanıcı kendi deploy etmeli** (Resend API key + supabase functions deploy)
- ✅ Puan & yorum sistemi (sql/05, sql/06)
- ✅ Pagination (Daha Fazla Yükle)
- ✅ Skeleton loader
- ✅ Paylaşılabilir ilan URL (`?ilan=<id>`)
- ✅ SEO basics (robots, sitemap, og-image)
- ✅ Filtre çubuğu (saat/fiyat/sıralama/acil)
- ✅ Müsait büyük banner (kurye) + Bekleyen yorum banner (işletme)
- ✅ 24h rate limit (max 5 ilan)

**Kalan:**
- İşletme hesaplarının `isletme_adi` boş olanlar için profil modalına işletme bilgileri sekmesi
- Telefon SMS doğrulama (Netgsm + Edge Function — uzun vadeli)
- Avatar kırpma (canvas crop)
- "Atla" yerine işletme telefonu zorunlu yapmak (spam'i azaltır)
- Edge Function deploy + Resend API key (email bildirim aktif olsun)
- Detay sayfası `/ilan/:id` route (şu an query param ile çalışıyor; clean URL Vercel rewrites ile yapılabilir)
- Çok-şehir desteği (`ANKARA_ILCELERI` hardcoded)
- Konum harita view (ilçe yerine pin)

---

## Notes for Future Sessions

- Bu dosya proje kökündeki `CLAUDE.md`'dir; Claude Code session başlangıcında otomatik yüklenir.
- Bir görev için **önce bu dosyadan** ilgili bölümü bul, sonra dosyayı satır aralığıyla aç (örn. `Read script.js offset=1092 limit=210`).
- Büyük değişiklikler sonrası bu dosyanın **ilgili tablolarını güncelle** (özellikle satır numaraları kayar).
