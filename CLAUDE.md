# izincikurye — Codebase Haritası

## Proje Özeti

- **Adı:** izincikurye.com — Ankara izinci kurye ilan platformu
- **Stack:** HTML + CSS + Vanilla JS + Supabase (Postgres + Auth + Storage + RLS)
- **Hosting:** Vercel (auto-deploy from `main`), domain: https://izincikurye.vercel.app
- **Repo:** https://github.com/bktsmrt0-beep/izincikurye

> **Not:** Her HTML/JS/CSS değişiminde `index.html` ve `admin.html`'de `?v=N` query parametresi artırılır. Commit + push → Vercel otomatik deploy ~30-60sn. Şu an `?v=74`.

> **Önemli:** Satır numaraları büyüktür kayar; Grep ile fonksiyon/marker adı arayarak gel. Aşağıdaki tablolar yaklaşık yer gösterir.

---

## script.js Haritası

Bölümler `// =============== BÖLÜM ===============` marker'larıyla ayrılmıştır.

| Bölüm | Satır | Ne yapar |
|---|---|---|
| BFCACHE FIX | 3-15 | `pageshow` restore reload (admin↔home stale state fix) |
| VERİ | 17-23 | `ANKARA_ILCELERI` listesi (25 ilçe) |
| DURUM | 25-28 | `currentUser`, `ilanlar`, `listingScope` (`"all"|"mine"`) |
| DOM REF | 30-52 | top-level `getElementById` const'ları (sidebar, listings, modals) |
| TOAST | 54-66 | `toast(msg, type, ms)` — sayfa üstü bildirim |
| HATA BANNER | 68-78 | `showError(msg)` — kalıcı kırmızı banner |
| SUPABASE: SESSION | 80-145 | `_withTimeout`, `syncSession` (rawSelect ile profil çeker) |
| SUPABASE: İLANLAR | 147-182 | `loadIlanlar` — `expires_at > now()` filtresi |
| RENDER | 184-338 | `renderTopNav` (user-menu dropdown), `renderListings` (kart + kalan süre) |
| KART AKSİYONLARI | 340-390 | call/wa/addr handler, `showAdres`, ilan sahipleri için sil |
| MODALLAR | 392-467 | `openModal`/`closeModals`, Esc handler, user-menu open/close |
| KAYIT | 469-526 | register form (kullanici_tipi radio + businessFields toggle) |
| GİRİŞ | 528-553 | login form (Beni hatırla flag) |
| ŞİFREMİ UNUTTUM | 555-591 | `forgotEmailForm` (resetPasswordForEmail) + `forgotResetForm` (updateUser password) |
| İLAN VER | 593-695 | `ilanForm` submit, **işletme auto-fill + Düzenle linkleri** |
| YARDIMCI | 697-724 | `escapeHtml`, `formatDateTime`, `formatRemaining` |
| İLANLARIM TOGGLE | 726-737 | sidebar `seg-btn` click (`all`↔`mine`) |
| PROFİLİM YARDIMCILARI | 739-826 | `setStatus`, `setBusy`, `formatTel`, `_telDigits`, `_readProfileForm`, `profileHasChanges`, `computeProfileCompletion`, `refreshCompletion`, `refreshProfileSaveBtn` |
| PROFİL: tercih+saat doldur | 828-887 | bir kerelik option dolduran IIFE, day-chip listener, bio counter, bildirim toggle listeners |
| PROFİL SEKMELERİ | 889-936 | `switchProfileTab`, `loadProfileStats` |
| PAKET 4: Son giriş+veri indir | 938-997 | `loadLastSignIn`, `downloadDataBtn` |
| AVATAR | 999-1090 | `setAvatarPreview`, upload/remove handler (Supabase Storage) |
| PROFİLİM | 1092-1299 | `openProfileModal`, `profileForm` submit, ticari/email/tel input listeners |
| ŞİFRE DEĞİŞTİR | 1301-1342 | `changePasswordForm` submit (signInWithPassword + updateUser) |
| MÜSAİTLİK TOGGLE | 1303-1326 | kurye `musait` boolean toggle + DB update |
| HESABI KAPAT | ~1370 | çift onay → ilanları+profili sil → signOut |
| KURYELER (Müsait Liste) | ~1430-1545 | `loadMusaitKuryeler` (rawSelect), `renderMusaitKuryeler`, kart click handler, content-tab switch |
| İLK YÜKLEME | ~1550-end | IIFE: `_enforceRememberMe`, `syncSession`, `loadIlanlar`, `renderTopNav` |

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
<script src="supabase-config.js?v=59"></script>
<script src="script.js?v=59"></script>
```

> CDN versiyonu **pinned** (`@2.45.4`) — minor sürüm bozulmasından korur.

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
created_at   timestamptz
expires_at   timestamptz DEFAULT now() + 24h
```

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

### `profiles` tablosuna yeni alan ekle
1. **SQL:** `alter table profiles add column ...`
2. **Trigger:** `handle_new_user`'a metadata'dan alma satırı (yeni kullanıcılar için)
3. **script.js:syncSession** zaten `select("*")` çekiyor, otomatik gelir
4. **currentUser** mapping (camelCase): `currentUser.yeniAlan = profile?.yeni_alan || ""`
5. **openProfileModal**'da inputu doldur
6. **`_readProfileForm`**'a inputu ekle, `profileHasChanges`'e karşılaştırma
7. **`profileForm` submit**'te `updateObj`'e ekle
8. **`computeProfileCompletion`** isteğe bağlı genişlet
9. **CLAUDE.md** güncelle (DB Şeması bölümü)

### Yeni modal eklemek
1. **index.html** sonuna `<div class="modal hidden" id="newModal">` ekle
2. **script.js:MODALLAR** içinde yeni handler'lar (zaten `openModal`/`closeModals` var)
3. CSS gerekirse style.css sonuna ekle
4. **Cache-bust** `?v=N` artır

### Yeni ilan alanı
1. **DB:** `ilanlar` tablosuna sütun
2. **index.html:İLAN VER MODAL** input ekle
3. **script.js:İLAN VER** `ilanForm` submit'te insert objesine ekle
4. **script.js:RENDER** `renderListings` template'ine ekle
5. View `ilanlar_public` tanımını da gerekirse güncelle

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
