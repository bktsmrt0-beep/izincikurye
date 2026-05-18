# MAP.md — Grep-optimize edilmiş kod indeksi

> **Kullanım:** Tek satır = tek sembol. `grep "funcAdı" MAP.md` → satır numarası → doğrudan oraya `Read`. CLAUDE.md "neden/nasıl/tuzak" için; bu dosya "nerede" için.
>
> **Format:** `sembol | dosya:satır | kısa açıklama`
> **Güncelleme:** Büyük refactor sonrası bu dosyayı da yenile. Satır numaraları kayar; emin değilsen `Grep -n "^function symbolName"` ile teyit et.

---

## script.js — fonksiyonlar (alfabetik)

```
_bindPhoneInput          | script.js:1964 | telefon input'una canlı format + focus/blur prefix bind
_closeKebab              | script.js:1011 | mobil ⋮ dropdown kapat
_closingFromPopstate     | script.js:1747 | modal popstate döngüsü flag
_closingSidebarFromPopstate | script.js:1812 | sidebar popstate döngüsü flag
_commitMusait            | script.js:3497 | müsait toggle ortak DB PATCH (raw fetch + rollback)
_displayPhone            | script.js:2481 | telefon render: "+90 5XX XXX XX XX"
_drawCrop                | script.js:2958 | avatar crop canvas çizimi (drag/zoom sonrası)
_editingIlanId           | script.js:125  | ilan formu düzenleme modu flag
_enforceRememberMe       | script.js:4264 | beni hatırla kapalıysa localStorage temizle (init)
_formatPhone10           | script.js:1567 | 5XX XXX XX XX canlı format (delete modal)
_goToMyListings          | script.js:3300 | sidebar "İlanlarım" → scope mine
_hkSelectedSebep         | script.js:3622 | hesap kapatma sebep chip state
_isHemenBasla            | script.js:1121 | bas_saat ±2sa içinde mi (Hemen Başla rozeti)
_isMobileTr              | script.js:2474 | son 10 hanenin ilki 5 mi (cep kontrol)
_openAvatarCropModal     | script.js:2978 | dosya seçince crop modalı aç
_openBildirimAboneModal  | script.js:~2402 | ilçe bazlı bildirim aboneliği modalı aç (empty state CTA'sından)
_openKebab               | script.js:1016 | mobil ⋮ dropdown aç
_openMusaitOnay          | script.js:3543 | müsait olma kurallar onay modalı aç
_phoneRaw10              | script.js:1560 | telefon → son 10 hane (0/90 prefix kırp)
_phoneToE164             | script.js:2463 | "+905XXXXXXXXX" normalize (DB storage)
_readProfileForm         | script.js:2490 | profil form alanlarından obje üret
_refreshRxnBtns          | script.js:950  | reaksiyon butonlarını re-render
_serpistirYeniUyeler     | script.js:3943 | müsait kurye listesinde yeni üyeleri 3 ve 7. sıraya yerleştir
_setListingScope         | script.js:2384 | sidebar segment + #ilanlarimBanner senkron
_showSilinecekBanner     | script.js:3740 | soft-delete bekleyen kullanıcı için sticky banner
_switchingTabFromPopstate| script.js:4205 | sekme popstate döngüsü flag
_telDigits               | script.js:2456 | (s||"").replace(/\D/g,"")
_updateAktifSayaclar     | script.js:2325 | .ilan-aktif-sayac elemanlarını günceller (setInterval 1sn)
_updateIlanlarimBanner   | script.js:2396 | banner görünürlüğü scope+tab kombosuna göre
_validateIcerik          | script.js:~2307 | başlık/açıklama içerik filtresi (telefon/email/link/küfür)
_updateSureOzeti         | script.js:2077 | ilan formu süre özeti güncelle
_withTimeout             | script.js:196  | promise + timeout wrapper
activeFilterCount        | script.js:492  | aktif filtre adedi
buildIlanCardHTML        | script.js:634  | tam ilan kartı HTML (modal içine)
buildKuryeDetailHTML     | script.js:4053 | tam kurye kartı HTML (avatar+grid+chips+aksiyon)
calcSureSaat             | script.js:2071 | bas/bit saatten toplam süre (gece geçişi destekli)
checkProfilEksikBanner   | script.js:1282 | işletme için sarı uyarı banner
clearStatus              | script.js:2420 | inline form status temizle
closeModals              | script.js:1748 | tüm modallar kapat + popstate
closeSidebar             | script.js:1813 | sidebar drawer kapat
closeUserMenu            | script.js:1847 | user dropdown kapat
computeProfileCompletion | script.js:2653 | 10 alana göre yüzde
copyIlanLink             | script.js:4372 | ilan linkini clipboard'a kopyala
escapeHtml               | script.js:2296 | XSS önleme
formatAktifSure          | script.js:2310 | "21 dakika 14 saniyedir aktif"
formatDateTime           | script.js:2301 | TR locale tarih+saat
formatMembership         | script.js:502  | "Üye 8 ay" / "Üye 2 yıl"
formatRemaining          | script.js:2337 | "X sa Y dk kaldı" + urgent flag
formatTel                | script.js:2438 | "+90 XXX XXX XX XX" canlı format
getFilteredIlanlar       | script.js:463  | client-side filtre + sıralama
loadFavoriler            | script.js:859  | favoriler Set + userReaksiyonlar Map yükle
loadIlanlar              | script.js:298  | ilanları rawSelect ile çek + profile batch
loadLastSignIn           | script.js:2691 | auth.users.last_sign_in_at göster
loadMusaitKuryeler       | script.js:3911 | müsait kurye listesi yükle
loadProfileStats         | script.js:2732 | smart profile (hero+KPI+smart card+tile badges)
loadReviewList           | script.js:1340 | bekleyen/yorumladıklarım listesi yükle
normalizeEmail           | script.js:1899 | email lowercase + trim
openDeleteIlanModal      | script.js:1546 | ilan kaldırma modalı (kurye telefon)
openEditIlan             | script.js:1077 | form'u UPDATE moduna al
openIlanDetail           | script.js:789  | ilan detay modalı + /ilan/<id> URL push
openIlanFromUrl          | script.js:4322 | deep link açıcı (?ilan=<id>)
openKuryeDetail          | script.js:4163 | kurye detay modalı + /kurye/<id> URL push
openModal                | script.js:1721 | modal göster + body scroll lock + history push
openProfileModal         | script.js:3151 | profilim modal aç + tüm alanları doldur
openReviewListModal      | script.js:1322 | bekleyen/yorumladıklarım modal
openReviewViewModal      | script.js:1485 | kurye için tüm yorumları göster
openReviewWriteModal     | script.js:1412 | yıldız + metin yorum yazma
openSidebar              | script.js:1800 | hamburger drawer aç
openSikayetModal         | script.js:1044 | ilan şikayeti modalı
openUserMenu             | script.js:1840 | üst sağ kullanıcı dropdown
performDeleteWithReview  | script.js:1604 | grant_review_and_delete_ilan RPC
profileHasChanges        | script.js:2522 | currentUser ile karşılaştır
refreshCompletion        | script.js:2677 | bar ve metni güncelle
refreshPendingReviewCount| script.js:1247 | yorum banner + menü badge günceller
refreshProfileSaveBtn    | script.js:2547 | değişiklik yoksa kaydet pasif
renderEmptyState         | script.js:805  | ilçe öneri chip'leri
renderKuryeDashboard     | script.js:3804 | kurye için dashboard (banner + öneriler)
renderListings           | script.js:511  | compact ilan satır render (6 hücre PC, 2-satır mobil)
renderMusaitKuryeler     | script.js:3971 | compact kurye satır render
renderSkeletons          | script.js:273  | iskelet kart render (loading)
renderSmartCard          | script.js:2864 | smart profile "Sıradaki Adım" kartı
renderTopNav             | script.js:358  | user menu dropdown
resetIlanFormMode        | script.js:1112 | form'u INSERT moduna çevir
setAvatarPreview         | script.js:2929 | yuvarlak avatar görsel set
setBusy                  | script.js:2422 | submit butonu pasif + "Kaydediliyor..."
setStatus                | script.js:2413 | modal içi inline durum
showAdres                | script.js:1661 | (DEPRECATED) eski derin link
showError                | script.js:184  | kalıcı kırmızı banner
switchProfileTab         | script.js:2636 | genel/profil/bildirim/güvenlik sekme
syncDashboardToggle      | script.js:3851 | büyük banner + profilim toggle senkron
syncSession              | script.js:203  | readStoredSession + profile fetch → currentUser
toast                    | script.js:170  | sayfa üstü 3sn bildirim
toggleFavori             | script.js:967  | favori DB toggle (UI yok, revival için)
toggleReaksiyon          | script.js:879  | beğen/beğenmeme — Reddit tarzı iter
toggleSidebar            | script.js:1824 | sidebar aç/kapa
```

---

## script.js — bölüm marker'ları (`// =============== ... ===============`)

```
BFCACHE FIX                  | script.js:91
VERİ (ANKARA_ILCELERI)       | script.js:105
DURUM (state)                | script.js:113
DOM REF                      | script.js:142
TOAST                        | script.js:169
HATA BANNER                  | script.js:183
SUPABASE: SESSION            | script.js:195
SUPABASE: İLANLAR            | script.js:272
RENDER (top nav, filters)    | script.js:357
DETAY KARTI (modal)          | script.js:632
FAVORİLER/ŞİKAYET/EDIT/KEBAB | script.js:857
KART AKSİYONLARI             | script.js:1131
YORUM/PUAN SİSTEMİ           | script.js:1243
PROFİL EKSİK BANNER          | script.js:1281
İLAN KALDIRMA AKIŞI          | script.js:1545
MODALLAR                     | script.js:1720
SIDEBAR DRAWER               | script.js:1799
KAYIT (Supabase Auth)        | script.js:1898
GİRİŞ                        | script.js:1977
ŞİFREMİ UNUTTUM              | script.js:2019
İLAN VER                     | script.js:2057
YARDIMCI                     | script.js:2295
PROFİLİM YARDIMCILARI        | script.js:~2410
AVATAR                       | script.js:2928
AVATAR KIRPMA (v139)         | script.js:~2956
PROFİL MODAL                 | script.js:3151
MÜSAİTLİK TOGGLE             | script.js:~3496
ŞİFRE DEĞİŞTİR               | script.js:~3580
HESABI KAPAT (v138)          | script.js:~3620
HESABIMI GERİ AÇ             | script.js:~3740
KURYE DASHBOARD              | script.js:3804
MÜSAİT KURYELER              | script.js:3911
KURYE DETAY MODAL            | script.js:4053
TAB / İLK YÜKLEME            | script.js:~4205
```

---

## index.html — modallar ve banner'lar

```
KAYIT MODAL                  | index.html:~78    | #registerModal, kullanici_tipi + businessFields
GİRİŞ MODAL                  | index.html:~163   | #loginModal
İLAN VER MODAL               | index.html:~188   | #ilanFormModal, #ilanForm (#ilanKurallarOnay required)
ŞİFREMİ UNUTTUM EMAIL        | index.html:~262   | #forgotEmailModal
ŞİFREMİ UNUTTUM YENİ ŞİFRE   | index.html:~277   | #forgotResetModal
ADRES MODAL                  | index.html:~295   | #adresModal
PROFİLİM MODAL               | index.html:~304   | #profileModal (sekmeli: genel/profil/bildirim/güvenlik)
ŞİFRE DEĞİŞTİR MODAL         | index.html:~461   | #changePasswordModal
MÜSAİT ONAY MODAL (v135)     | index.html:~443   | #musaitOnayModal + #musaitKurallarOnay
AVATAR KIRPMA MODAL (v139)   | index.html:~469   | #avatarCropModal + #avatarCropCanvas + #avatarCropZoom
HESABI KAPAT MODAL (v138)    | index.html:~493   | #hesapKapatModal + #hkSebepPicker + #hkOnay
İLAN BİLDİRİM ABONE (v149)   | index.html:~478   | #ilanBildirimAboneModal + #ibIlceLabel + #ibAboneOlBtn
İŞ İLANI VER MODAL (v153)    | index.html:~?     | #isIlanFormModal + #isIlanForm + #isIlanKelimeSayac + #isIlanKurallarOnay
İŞ İLANI DETAY MODAL (v153)  | index.html:~?     | #isIlanDetailModal + #isIlanDetailBody
ŞİKAYET MODAL                | index.html:~531   | #sikayetModal
İLAN KALDIRMA MODAL          | index.html:~640   | #deleteIlanModal + #deleteIlanSkip (Atla yolu)
YORUM LİSTE MODAL            | index.html:~?     | #reviewListModal (sekmeli pending/done)
YORUM YAZMA MODAL            | index.html:~?     | #reviewWriteModal (yıldız + textarea)
YORUM GÖRME MODAL            | index.html:~?     | #reviewViewModal
İLAN DETAY MODAL             | index.html:~?     | #ilanDetailModal
KURYE DETAY MODAL            | index.html:~?     | #kuryeDetailModal
```

### Sticky banner'lar (z-index sırası)

```
header                       | z=60  | site-header
silinecekBanner (v138)       | z=45  | top:56px, kırmızı, "Hesabımı Geri Aç"
kuryeMusaitBanner            | z=40  | top:56px, kurye girişli
isletmeYorumBanner           | z=40  | top:56px, bekleyen yorum
profilEksikBanner            | z=35  | top:56px, işletme bilgileri eksik
ilanlarimBanner (v132)       | z=?   | content içinde, "Sadece kendi ilanların"
```

---

## script-is-ilani.js — Faz 2A modülü (v153, IIFE)

```
loadIsIlanlari           | script-is-ilani.js | rawSelect ile iş ilanları çek (alt-tur + scope + ilçe filtreli)
renderIsIlanlari         | script-is-ilani.js | compact kart listesi render
buildIsIlanCardHTML      | script-is-ilani.js | .ilan-row class miras (anlık ilan kopya) — 4 hücre
openIsIlanDetail         | script-is-ilani.js | detay modal aç (#isIlanDetailModal)
_setIsIlanAltTur         | script-is-ilani.js | sub-tab değişimi (tam_zamanli/part_time/esnaf_kurye/arabali_kurye)
_setIsIlanScope          | script-is-ilani.js | scope değişimi (all/mine)
_openIsIlanForm          | script-is-ilani.js | form modal aç + DB'den taze profile fetch + edit modu (editIlan param)
_submitIsIlan            | script-is-ilani.js | INSERT (yeni) veya PATCH (edit — durum=beklemede reset)
_deleteIsIlan            | script-is-ilani.js | raw DELETE iş ilanı
_validateUzunForm        | script-is-ilani.js | _validateIcerik + 300 kelime kontrolü
_durumRozet              | script-is-ilani.js | ⏳ İncelemede / ✅ Onaylı / ❌ Reddedildi rozet
_formatMaasAralik        | script-is-ilani.js | "25.000 ₺ — 45.000 ₺" (uzun, detay için)
_formatMaasKisa          | script-is-ilani.js | "25K-35K ₺" (kart için)
_kisaSayi                | script-is-ilani.js | 25000 → "25K"
_handleIsIlanAction      | script-is-ilani.js | aksiyon dispatcher (detay/edit/delete/share/report/rxn)
_toggleIsIlanRxn         | script-is-ilani.js | reaksiyon ekle (INSERT-only, geri alınmaz)
_updateDetailRxnCounts   | script-is-ilani.js | detay modal'da reaksiyon sayısı canlı güncelle
_copyIsIlanLink          | script-is-ilani.js | navigator.share + clipboard fallback
_refreshSureDropdown     | script-is-ilani.js | kategoriye göre süre options (PT:4-8, TZ:8-16, Esnaf/Arabalı:4-16)
_bindKategoriChange      | script-is-ilani.js | kategori değişiminde süre dropdown + başlık placeholder yenile
_bindMaasInput           | script-is-ilani.js | input → binlik nokta + "X bin ₺" preview
_updateMaasPreview       | script-is-ilani.js | maaş alt yazı bin gösterimi
_bindEditHints           | script-is-ilani.js | telefon click → uyarı toast + Profilim link
IS_ILAN_TURLERI          | script-is-ilani.js | kategori → label+emoji
IS_ILAN_ETIKETLER        | script-is-ilani.js | 8 iş ilanı etiketi (yemek_dahil, sgk, vb.)
SURE_SECENEKLER          | script-is-ilani.js | kategori bazlı süre listesi
BASLIK_PLACEHOLDER       | script-is-ilani.js | kategori bazlı dinamik placeholder
window.izIsIlani         | script-is-ilani.js | Public API: load/setAltTur/setScope/openForm/openDetail
```

---

## admin.js — Faz 2A genişlemesi

```
loadBekleyen             | admin.js | durum='beklemede' iş ilanları listesi + SLA (4 saat) renk uyarısı
_bekleyenSure            | admin.js | "X sa Y dk" + late flag
KATEGORI_LABEL           | admin.js | tam_zamanli/esnaf_kurye/arabali_kurye → emoji+label
onayla-ilan / reddet-ilan handler | admin.js | sb.from update durum + red_sebebi prompt
```

---

## supabase-config.js — yardımcılar

```
readStoredSession            | supabase-config.js:21  | localStorage'dan token JSON
rawSelect                    | supabase-config.js:37  | ham fetch SELECT (timeout)
rawRpc                       | supabase-config.js:61  | ham fetch RPC
rawInsert                    | supabase-config.js:93  | ham fetch INSERT
rawSignIn                    | supabase-config.js:125 | ham fetch auth/v1/token
rawSignUp                    | supabase-config.js:170 | ham fetch auth/v1/signup
SUPABASE_URL, SUPABASE_KEY   | supabase-config.js:3-4
sb (client)                  | supabase-config.js:11  | createClient (lock: noopLock)
```

---

## style.css — bölüm marker'ları

```
HEADER                       | style.css:~33
LAYOUT + SIDEBAR + CONTENT   | style.css:~76
MODAL + FORM + SCALE         | style.css:~225
.modal-close (v131 fixed)    | style.css:~944
FOOTER + ADRES İÇERİĞİ       | style.css:~289
MOBILE @media                | style.css:~306
Şifre göster/gizle           | style.css:~335
İlanlarım toggle             | style.css:~362
Avatar                       | style.css:~415
Toast                        | style.css:~488
Kullanıcı menüsü dropdown    | style.css:~521
Profil sekmeleri + tamamlama | style.css:~566
İlan kalan süre rozeti       | style.css:~678
İlanlarım banner (v132)      | style.css:~?
Kurye liste (.kurye-row)     | style.css:~?
İlan liste (.ilan-row)       | style.css:~?
#ilanDetailModal .modal-close (v137 fixed) | style.css:~796
#kuryeDetailModal .modal-close (v137 fixed)| style.css:~622
Avatar kırpma (v139)         | style.css:~3720
```

---

## SQL migration dosyaları (sql/)

```
03_cleanup_and_rate_limit       | pg_cron + 24h ilan limiti trigger
04_notify_trigger               | yeni ilan → Edge Function webhook
05_yorum_puan_sistemi           | yorumlar + yorum_haklari + RPC + RLS
06_phone_match_fix              | son-10-hane karşılaştırma
07_isletme_alanlari             | profiles.isletme_tipi + CHECK
08_iletisim_tel                 | ilanlar.iletisim_tel sütunu
09_phone_e164                   | E.164 dönüşüm + _phone_to_e164() helper
10_etiketler_favoriler_kisaid   | etiketler + kisa_id + favoriler + sikayetler
11_reaksiyonlar_sayilar         | reaksiyonlar + denormalize sayaçlar + trigger
12_kurye_arac                   | profiles.arac_tipi + arac_marka_model
13_ilan_sort_score              | ilanlar.sort_score generated column
14_reaksiyon_rate_limit         | 60sn/10 reaksiyon trigger
15_ilanlar_public_view_refresh  | view DROP+CREATE explicit kolon listesi
16_hesap_kapatma                | soft-delete + geri bildirim tablosu + pg_cron
17_ilan_bildirim_takip          | ilçe bazlı bildirim aboneliği tablosu + RLS
18_ilanlar_faz2                 | ilanlar.tur + maas_min/max + durum + red_sebebi; iş ilanları için NOT NULL'lar gevşetildi; ilanlar_public view recreate
19_isyeri_alanlari_optional     | isyeri_ad / isyeri_adres NOT NULL kaldırıldı (iş ilanı için)
20_ilanlar_admin_update_policy  | admin UPDATE RLS policy (onay/red için)
21_part_time_tur                | tur CHECK constraint'e 'part_time' eklendi
22_reaksiyon_kalici             | reaksiyonlar UPDATE+DELETE policy kaldırıldı (geri alınmaz)
23_calisma_suresi               | ilanlar.calisma_suresi text (iş ilanı çalışma süresi)
24_view_refresh_calisma_suresi  | ilanlar_public view recreate (calisma_suresi yansısın)
```

---

## DB tablolar (özet)

```
profiles                | id, ad/soyad/tel, ticari, role, avatar_url, bio,
                          tercih_ilceler[], calisma_*, min/max_ucret, bildirimler,
                          kullanici_tipi, isletme_*, musait, musait_at, puan_*,
                          arac_tipi, arac_marka_model, silinmek_uzere_at (v138)
ilanlar                 | user_id, baslik, ilce, saat, fiyat, km, bas/bit_saat,
                          aciklama, isyeri_*, iletisim_tel, etiketler[],
                          kisa_id, kalp/begen/begenmeme_sayisi, sort_score,
                          created_at, expires_at
ilanlar_public          | view; expires_at > now()
yorumlar                | kurye_id, isletme_id, ilan_id, puan, yorum, UNIQUE
yorum_haklari           | kurye_id, isletme_id, ilan_id, ilan_baslik, kullanildi, UNIQUE
favoriler               | user_id, ilan_id, UNIQUE
reaksiyonlar            | user_id, ilan_id, tip ('begen'|'begenmeme'), UNIQUE
sikayetler              | ilan_id, user_id, sebep, aciklama, durum
hesap_kapatma_geri_bildirim (v138) | user_id (SET NULL), sebep, aciklama, email_snapshot
```

---

## Notlar

- **Satır numaraları yaklaşık.** Büyük edit sonrası `Grep -n "^function adi"` ile teyit et, sonra MAP'i güncelle.
- **CLAUDE.md ile birlikte kullan:** CLAUDE.md "neden/nasıl/tuzak"; MAP.md "nerede".
- **Yeni fonksiyon eklediğinde:** Alfabetik bloğa, sonra ilgili bölüm marker'ı altına ekle.
