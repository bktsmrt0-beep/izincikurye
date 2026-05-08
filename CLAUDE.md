# izincikurye — Codebase Haritası

## Proje Özeti

- **Adı:** izincikurye.com — Ankara izinci kurye ilan platformu
- **Stack:** HTML + CSS + Vanilla JS + Supabase (Postgres + Auth + Storage + RLS)
- **Hosting:** Vercel (auto-deploy from `main`), domain: https://izincikurye.vercel.app
- **Repo:** https://github.com/bktsmrt0-beep/izincikurye

> **Not:** Her HTML/JS/CSS değişiminde `index.html` ve `admin.html`'de `?v=N` query parametresi artırılır. Commit + push → Vercel otomatik deploy ~30-60sn. Şu an `?v=33`.

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
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="supabase-config.js?v=33"></script>
<script src="script.js?v=33"></script>
```

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
| `rawSelect(path, accessToken, ms)` | supabase-config.js | Ham fetch REST (supabase-js bypass) |
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
is_adresi       text
is_telefonu     text
musait          boolean DEFAULT false
musait_at       timestamptz
```

### `ilanlar` tablosu

```
id           uuid PK
user_id      uuid FK auth.users(id) ON DELETE CASCADE
baslik       text (3-80)
ilce         text
saat         int (4-16)
fiyat        int (200-300)
km           int (5-10)
bas_saat, bit_saat   text (HH:00)
aciklama     text
isyeri_ad, isyeri_adres   text
created_at   timestamptz
expires_at   timestamptz DEFAULT now() + 24h
```

### Yardımcı

- **View:** `ilanlar_public` → `WHERE expires_at > now()` (anon tarafından okunabilir)
- **Function:** `is_admin()` SECURITY DEFINER → RLS politikalarında recursion önler
- **Function:** `handle_new_user()` SECURITY DEFINER → `auth.users` insert trigger'ı, profiles satırı oluşturur (metadata'dan alır)

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

1. **Supabase publishable key** (`sb_publishable_*`) ile `getSession`/`profiles.select` bazen takılır → `readStoredSession` + `rawSelect` ile bypass edildi.
2. **`autoRefreshToken: false`** + **`lock: noopLock`** ayarlandı (supabase-config.js).
3. **`detectSessionInUrl`** sadece URL hash'inde `type=recovery` varsa `true`.
4. **BFCache restore'da** sayfa otomatik reload (script.js:5-15, admin.js sonu).
5. **Mobil:** `.row-2` 520px altında otomatik tek sütun.
6. **WhatsApp tel:** numara `9` yerine `90` ile prefix'lenir (script.js içinde fix var).
7. **Esc** modal kapatır + user-menu kapatır.
8. **Beni hatırla:** sessionStorage flag (`izk_session_active`) ile sekme bazında çalışır.

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

- Mevcut işletme hesapların `isletme_adi` boş; profil modalına işletme bilgileri sekmesi eklenecek (Profil sekmesi içinde, kullanici_tipi=isletme görünür)
- Telefon SMS doğrulama (Netgsm + Supabase Edge Function — uzun vadeli)
- Bildirim tercihlerini gerçek e-posta tetiklemesine bağlamak (Edge Function)
- Süresi dolmuş ilanların pg_cron ile otomatik silinmesi
- Avatar kırpma (canvas crop)

---

## Notes for Future Sessions

- Bu dosya proje kökündeki `CLAUDE.md`'dir; Claude Code session başlangıcında otomatik yüklenir.
- Bir görev için **önce bu dosyadan** ilgili bölümü bul, sonra dosyayı satır aralığıyla aç (örn. `Read script.js offset=1092 limit=210`).
- Büyük değişiklikler sonrası bu dosyanın **ilgili tablolarını güncelle** (özellikle satır numaraları kayar).
