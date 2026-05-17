console.log("[init] script.js v7 başladı");

// ============================================================
// SCRIPT.JS YOL HARİTASI (v106) — Bölüm:Satır
// ============================================================
// BFCACHE FIX              : 17-29
// VERİ (ilçeler)           : 31-37
// DURUM (state)            : 39-58
// DOM REF                  : 60-86
// TOAST                    : 87-100
// HATA BANNER              : 101-112
// SUPABASE: SESSION        : 113-184
// SUPABASE: İLANLAR        : 185-254
//   ├─ renderSkeletons     : 186
//   └─ loadIlanlar         : 211
// RENDER                   : 255-508
//   ├─ renderTopNav        : 256
//   ├─ getFilteredIlanlar  : 360
//   ├─ activeFilterCount   : 387
//   └─ renderListings (compact row): 406-508
// DETAY KARTI (modal)      : 509-679
//   ├─ buildIlanCardHTML   : 511 — tam ilan kartı HTML
//   └─ openIlanDetail      : 663 — modal aç + URL
// renderEmptyState         : 681
// FAVORİLER/ŞİKAYET/EDIT/KEBAB : 733-997
//   ├─ loadFavoriler       : 735
//   ├─ toggleReaksiyon     : 755 — beğen/beğenmeme birbirini iter
//   ├─ _refreshRxnBtns     : 820
//   ├─ toggleFavori        : 837 (UI yok ama DB aktif)
//   ├─ _closeKebab/_openKebab : 881/886 (mobil ⋮ butonu)
//   ├─ openSikayetModal    : 914 + form submit 923
//   ├─ openEditIlan        : 947
//   ├─ resetIlanFormMode   : 979
//   └─ _isHemenBasla       : 988
// KART AKSİYONLARI         : 998-1109 — global click delegasyon
// YORUM/PUAN SİSTEMİ       : 1110-1410
//   ├─ refreshPendingReviewCount : 1114
//   ├─ openReviewListModal : 1189
//   ├─ loadReviewList      : 1207
//   ├─ openReviewWriteModal: 1279
//   └─ openReviewViewModal : 1352 — kurye yorumlarını göster
// İLAN KALDIRMA AKIŞI      : 1412-1592
//   ├─ openDeleteIlanModal : 1413
//   ├─ _phoneRaw10/_formatPhone10 : 1427/1434
//   ├─ performDeleteWithReview : 1471
//   └─ showAdres           : 1528 (eski adres modal — hâlâ var)
// MODALLAR (open/close)    : 1592-1670 — closeModals popstate dahil
// SIDEBAR DRAWER           : 1647-1726
// KAYIT/AUTH               : 1728-1791
// GİRİŞ                    : 1807-1848
// ŞİFREMİ UNUTTUM          : 1849-1886
// İLAN VER                 : 1887-2098
//   ├─ calcSureSaat        : 1901 — gece geçişi destekli süre hesabı
//   └─ ilanForm submit     : İLAN VER bölümünün sonunda
// YARDIMCI                 : 2099-2154
//   ├─ escapeHtml          : 2100
//   ├─ formatAktifSure     : 2114
//   ├─ _updateAktifSayaclar: 2129
//   └─ formatRemaining     : 2141
// FİLTRELER (client-side)  : 2155-2185
// İLANLARIM TOGGLE         : 2186-2198
// PROFİLİM YARDIMCILARI    : 2199-2415
//   ├─ formatTel/_displayPhone/_phoneToE164/_isMobileTr : 2225-2263
//   ├─ _readProfileForm/profileHasChanges : 2272/2293
//   ├─ switchProfileTab    : 2376
//   ├─ computeProfileCompletion : 2393
//   └─ loadLastSignIn      : 2431
// PROFİL: doldur listener   : 2314-2375 (gun-chip, bio counter, vs.)
// PROFİL STATS / SMART CARD : 2469-2741
// PROFİL MODAL             : 2742-3001
//   ├─ openProfileModal    : 2756
//   └─ _goToMyListings     : 2869
// MÜSAİTLİK TOGGLE         : 3016-3042
// ŞİFRE DEĞİŞTİR           : 3043-3085
// HESABI KAPAT             : 3086-3149
// KURYE KONTROL PANELİ     : 3150-3279
//   ├─ renderKuryeDashboard: 3151
//   └─ syncDashboardToggle : 3198
// MÜSAİT KURYELER          : 3280-3384
//   ├─ loadMusaitKuryeler  : 3281
//   └─ renderMusaitKuryeler (compact row): 3308
// KURYE DETAY MODAL        : 3385-3509
//   ├─ buildKuryeDetailHTML: 3387
//   └─ openKuryeDetail     : 3492
// İLK YÜKLEME (IIFE)       : 3564-end
//   ├─ _enforceRememberMe  : 3569
//   ├─ openIlanFromUrl     : 3617 — deep link açıcı
//   └─ copyIlanLink        : 3659 — paylaş URL
// ============================================================

// =============== BFCACHE FIX ===============
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    console.log("[init] bfcache restore — reload");
    window.location.reload();
  }
});

// Fallback butonlara hemen click handler bağla (JS sonradan takılırsa bile çalışsınlar)
const _fbLogin = document.getElementById("fallbackLoginBtn");
const _fbReg = document.getElementById("fallbackRegisterBtn");
if (_fbLogin) _fbLogin.addEventListener("click", () => openModal("loginModal"));
if (_fbReg) _fbReg.addEventListener("click", () => openModal("registerModal"));

// =============== VERİ ===============
const ANKARA_ILCELERI = [
  "Altındağ","Akyurt","Ayaş","Bala","Beypazarı","Çamlıdere","Çankaya","Çubuk",
  "Elmadağ","Etimesgut","Evren","Gölbaşı","Güdül","Haymana","Kalecik","Kazan",
  "Keçiören","Kızılcahamam","Mamak","Nallıhan","Polatlı","Pursaklar","Sincan",
  "Şereflikoçhisar","Yenimahalle"
];

// =============== DURUM ===============
let currentUser = null;   // { id, email, ad, soyad, tel }
let ilanlar = [];
let listingScope = "all"; // "all" | "mine"
let contentTab = "ilanlar"; // "ilanlar" | "kuryeler"
let currentFilters = { saat: "all", fiyat: "all", sort: "smart", urgentOnly: false };
const PAGE_SIZE = 20;
let pageOffset = 0;
let hasMoreIlanlar = true;
let kuryeler = [];
let favoriler = new Set(); // ilan_id Set — kullanıcının kalpleri (favoriler)
let userReaksiyonlar = new Map(); // ilan_id -> "begen" | "begenmeme"
let _editingIlanId = null; // ilan formu düzenleme modunda mı?

// Etiket etiket→görsel eşleştirme
const ETIKET_LABELS = {
  paket_teslimati: { ico: "📦", label: "Paket Teslimatı" },
  guvenli_odeme:   { ico: "🛡", label: "Güvenli Ödeme" },
  anlik_ihtiyac:   { ico: "⏱", label: "Anlık İhtiyaç" }
};

// Araç tipi→ikon+etiket eşleştirme (kurye profili)
const ARAC_INFO = {
  motosiklet: { ico: "🏍", label: "Motosiklet" },
  bisiklet:   { ico: "🚲", label: "Bisiklet" },
  scooter:    { ico: "🛴", label: "Scooter" },
  araba:      { ico: "🚗", label: "Araba" }
};

// =============== DOM REF ===============
const districtSelect = document.getElementById("districtSelect");
const listingsEl = document.getElementById("listings");
const emptyEl = document.getElementById("emptyState");
const guestNotice = document.getElementById("guestNotice");
const topNav = document.getElementById("topNav");
const ilanIlceSelect = document.getElementById("ilanIlceSelect");
const basSaat = document.getElementById("basSaat");
const bitSaat = document.getElementById("bitSaat");
const kuryeListingsEl = document.getElementById("kuryeListings");
const kuryeEmptyEl = document.getElementById("kuryeEmptyState");
const kuryeGuestNoticeEl = document.getElementById("kuryeGuestNotice");

// İlçe doldur (sol filtre + ilan formu)
ANKARA_ILCELERI.forEach(ilce => {
  districtSelect.appendChild(new Option(ilce, ilce));
  ilanIlceSelect.appendChild(new Option(ilce, ilce));
});
// Başlangıç saati: 00:00 → 23:00 (standart)
for (let h = 0; h < 24; h++) {
  const v = String(h).padStart(2, "0") + ":00";
  basSaat.appendChild(new Option(v, v));
}
// Bitiş saati: 07:00 → 23:00 → 24:00 (gece yarısı, DB'de "00:00") → 01:00 → 06:00 (ertesi gün)
// Vardiya/mesai mantığı: kurye saat 07-06 arası bir aralıkta çalışır
for (let h = 7; h <= 23; h++) {
  const v = String(h).padStart(2, "0") + ":00";
  bitSaat.appendChild(new Option(v, v));
}
bitSaat.appendChild(new Option("24:00", "00:00"));  // label=24:00, value=00:00 (mevcut render uyumu)
for (let h = 1; h <= 6; h++) {
  const v = String(h).padStart(2, "0") + ":00";
  bitSaat.appendChild(new Option(v, v));
}
basSaat.value = "09:00";
bitSaat.value = "18:00";

// =============== TOAST ===============
function toast(msg, type = "info", ms = 3000) {
  const host = document.getElementById("toastHost");
  if (!host) { console.log("[toast]", msg); return; }
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 250);
  }, ms);
}

// =============== HATA BANNER ===============
function showError(msg) {
  let bar = document.getElementById("appError");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "appError";
    bar.style.cssText = "background:#fee2e2;color:#991b1b;padding:10px 16px;border-bottom:1px solid #fecaca;font-size:14px;";
    document.body.prepend(bar);
  }
  bar.textContent = "⚠ " + msg;
}

// =============== SUPABASE: SESSION ===============
function _withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT(${ms}ms): ${label}`)), ms))
  ]);
}

async function syncSession() {
  try {
    // getSession'ı bypass et: storage'dan doğrudan oku (network/init hang riskini ortadan kaldırır)
    const session = (typeof readStoredSession === "function") ? readStoredSession() : null;
    console.log("[syncSession] storage check", { hasSession: !!session });
    if (session?.user) {
      console.log("[syncSession] profile query start for", session.user.id);
      // Ham REST çağrısı: supabase-js bypass
      const { data: arr, error: pErr } = await rawSelect(
        `profiles?id=eq.${session.user.id}&select=*`,
        session.access_token,
        6000
      );
      const profile = Array.isArray(arr) ? (arr[0] || null) : null;
      console.log("[syncSession] profile query done", { profile, pErr });
      if (pErr) console.warn("[profile]", pErr.message);
      currentUser = {
        id: session.user.id,
        email: session.user.email,
        ad: profile?.ad || "",
        soyad: profile?.soyad || "",
        tel: profile?.tel || "",
        role: profile?.role || "user",
        avatarUrl: profile?.avatar_url || "",
        createdAt: profile?.created_at || null,
        ticari: !!profile?.ticari,
        bio: profile?.bio || "",
        tercihIlceler: Array.isArray(profile?.tercih_ilceler) ? profile.tercih_ilceler : [],
        calismaBaslangic: profile?.calisma_baslangic ?? null,
        calismaBitis: profile?.calisma_bitis ?? null,
        calismaGunleri: Array.isArray(profile?.calisma_gunleri) ? profile.calisma_gunleri : [],
        minUcret: profile?.min_ucret ?? null,
        maxUcret: profile?.max_ucret ?? null,
        bildirimler: profile?.bildirimler || { yeni_ilan: true, ilanim_goruldu: true, kampanya: false },
        kullaniciTipi: profile?.kullanici_tipi || "",
        isletmeAdi: profile?.isletme_adi || "",
        isletmeTipi: profile?.isletme_tipi || "",
        isAdresi: profile?.is_adresi || "",
        isTelefonu: profile?.is_telefonu || "",
        musait: !!profile?.musait,
        musaitAt: profile?.musait_at || null,
        aracTipi: profile?.arac_tipi || "",
        aracMarkaModel: profile?.arac_marka_model || "",
        silinmekUzereAt: profile?.silinmek_uzere_at || null
      };
      // Soft-delete banner — kullanıcı 7 gün içinde geri dönmüşse uyar
      if (typeof window._showSilinecekBanner === "function") window._showSilinecekBanner();
    } else {
      currentUser = null;
    }
  } catch (e) {
    console.error("[syncSession]", e);
    showError("Oturum bilgisi alınamadı: " + (e.message || e));
    currentUser = null;
  }
}

sb.auth.onAuthStateChange(async (event) => {
  if (event === "PASSWORD_RECOVERY") {
    openModal("forgotResetModal");
    return;
  }
  // INITIAL_SESSION init IIFE'de zaten syncSession() çağırıyor — duplicate olmasın
  if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
  await syncSession();
  await loadIlanlar();
  renderTopNav();
});

// =============== SUPABASE: İLANLAR ===============
function renderSkeletons(n = 4) {
  emptyEl.classList.add("hidden");
  const html = Array.from({ length: n }).map(() => `
    <article class="card skeleton">
      <div class="card-top">
        <span class="sk sk-badge"></span>
        <span class="sk sk-date"></span>
      </div>
      <div class="sk sk-line sk-line-md"></div>
      <div class="sk sk-line sk-line-lg"></div>
      <div class="sk sk-line sk-line-sm"></div>
      <div class="card-meta">
        <span class="sk sk-meta"></span>
        <span class="sk sk-meta"></span>
      </div>
      <div class="actions">
        <span class="sk sk-btn"></span>
        <span class="sk sk-btn"></span>
        <span class="sk sk-btn"></span>
      </div>
    </article>
  `).join("");
  listingsEl.innerHTML = html;
}

async function loadIlanlar({ append = false } = {}) {
  if (!append) {
    pageOffset = 0;
    hasMoreIlanlar = true;
    if (ilanlar.length === 0) renderSkeletons(4);
  }
  try {
    const filter = districtSelect.value;
    const tableOrView = currentUser ? "ilanlar" : "ilanlar_public";
    // Sıralama: sort_score DESC (DB generated column — sql/13)
    // Formul: fiyat*2 + km*10 + begen*3 - begenmeme*3
    // İşletme yüksek ücret verir → üstte; çok beğenmeme alırsa → aşağı iner
    //
    // rawSelect bypass: sb.from(...) lock'a takılabilir, ham fetch güvenli (CLAUDE.md tuzak #1+#48)
    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("order", "sort_score.desc,created_at.desc");
    if (filter !== "all") params.set("ilce", "eq." + filter);
    if (listingScope === "mine" && currentUser) params.set("user_id", "eq." + currentUser.id);
    if (tableOrView === "ilanlar") params.set("expires_at", "gt." + new Date().toISOString());
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String(pageOffset));

    const session = readStoredSession();
    const { data, error } = await rawSelect(
      `${tableOrView}?${params.toString()}`,
      session?.access_token,
      8000
    );
    if (error) {
      console.error("[loadIlanlar]", error);
      showError("İlanlar yüklenemedi: " + error.message);
      ilanlar = [];
      renderListings();
      return;
    }
    const page = Array.isArray(data) ? data : [];
    hasMoreIlanlar = page.length === PAGE_SIZE;
    ilanlar = append ? [...ilanlar, ...page] : page;
    pageOffset += page.length;

    if (currentUser && page.length) {
      const userIds = [...new Set(page.map(i => i.user_id))];
      // rawSelect ile profile batch fetch — sb.from bypass
      const idsParam = userIds.join(",");
      const profUrl = `profiles?id=in.(${idsParam})&select=id,ad,soyad,tel,created_at,musait,musait_at,kullanici_tipi,puan_ort,puan_sayisi`;
      const { data: profiles, error: pErr } = await rawSelect(profUrl, session?.access_token, 6000);
      if (pErr) console.warn("[profiles batch]", pErr.message);
      const map = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      page.forEach(i => { i.profile = map[i.user_id]; });
    }
  } catch (e) {
    console.error("[loadIlanlar throw]", e);
    showError("İlan yükleme hatası: " + (e.message || e));
    ilanlar = [];
  }
  renderListings();
}

// =============== RENDER ===============
function renderTopNav() {
  topNav.innerHTML = "";
  if (currentUser) {
    // Kullanıcı menüsü — tek buton + açılır menü
    const wrap = document.createElement("div");
    wrap.className = "user-menu-wrap";

    const trigger = document.createElement("button");
    trigger.className = "btn btn-ghost btn-sm user-menu-trigger";
    trigger.setAttribute("aria-haspopup", "true");
    trigger.setAttribute("aria-expanded", "false");
    const adSoyad = (currentUser.ad + " " + currentUser.soyad).trim() || "Hesabım";
    if (currentUser.avatarUrl) {
      const av = document.createElement("span");
      av.className = "user-chip-avatar";
      av.style.backgroundImage = `url("${currentUser.avatarUrl}")`;
      trigger.append(av);
      trigger.append(document.createTextNode(adSoyad));
    } else {
      trigger.textContent = "👤 " + adSoyad;
    }
    const caret = document.createElement("span");
    caret.className = "user-menu-caret";
    caret.textContent = " ▾";
    trigger.append(caret);
    wrap.append(trigger);

    const menu = document.createElement("div");
    menu.className = "user-menu hidden";

    const editItem = document.createElement("button");
    editItem.className = "user-menu-item";
    editItem.innerHTML = "✏️ <span>Hesabımı Düzenle</span>";
    editItem.addEventListener("click", () => { closeUserMenu(); openProfileModal(); });
    menu.append(editItem);

    const myItem = document.createElement("button");
    myItem.className = "user-menu-item";
    myItem.innerHTML = "📋 <span>İlanlarım</span>";
    myItem.addEventListener("click", () => {
      closeUserMenu();
      const mineBtn = document.querySelector('#myListingsPanel .seg-btn[data-scope="mine"]');
      if (mineBtn && !mineBtn.classList.contains("active")) mineBtn.click();
      document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    menu.append(myItem);

    // Yorum bekleyen / yazılmış (her kullanıcı görür — yorum yapan kim olursa)
    const reviewItem = document.createElement("button");
    reviewItem.className = "user-menu-item";
    reviewItem.id = "userMenuReviewLink";
    reviewItem.innerHTML = '⭐ <span>Kurye Yorumla <span class="review-badge hidden" id="reviewPendingBadge">0</span></span>';
    reviewItem.addEventListener("click", () => { closeUserMenu(); openReviewListModal(); });
    menu.append(reviewItem);
    refreshPendingReviewCount();

    if (currentUser.role === "admin") {
      const adminItem = document.createElement("a");
      adminItem.href = "admin.html";
      adminItem.className = "user-menu-item";
      adminItem.innerHTML = "🛡 <span>Admin Paneli</span>";
      menu.append(adminItem);
    }

    const sep = document.createElement("div");
    sep.className = "user-menu-sep";
    menu.append(sep);

    const out = document.createElement("button");
    out.className = "user-menu-item user-menu-item-danger";
    out.innerHTML = "🚪 <span>Çıkış Yap</span>";
    out.addEventListener("click", () => {
      closeUserMenu();
      if (!confirm("Çıkmak istediğine emin misin?")) return;
      try {
        Object.keys(localStorage).filter(k => k.startsWith("sb-")).forEach(k => localStorage.removeItem(k));
        Object.keys(sessionStorage).filter(k => k.startsWith("sb-")).forEach(k => sessionStorage.removeItem(k));
        localStorage.removeItem("izk_remember");
        sessionStorage.removeItem("izk_session_active");
      } catch {}
      // Not: sb.auth.signOut çağrısı kaldırıldı — localStorage zaten temizlendi,
      // ek olarak signOut takılma riski taşıyor (publishable key + lock).
      window.location.href = "/";
    });
    menu.append(out);

    wrap.append(menu);
    topNav.append(wrap);

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !menu.classList.contains("hidden");
      isOpen ? closeUserMenu() : openUserMenu();
    });
  } else {
    const giris = document.createElement("button");
    giris.className = "btn btn-ghost"; giris.textContent = "Giriş";
    giris.addEventListener("click", () => openModal("loginModal"));
    const kayit = document.createElement("button");
    kayit.className = "btn btn-primary"; kayit.textContent = "Kayıt Ol";
    kayit.addEventListener("click", () => openModal("registerModal"));
    topNav.append(giris, kayit);
  }
}

function getFilteredIlanlar() {
  let arr = ilanlar.slice();
  const { saat, fiyat, sort, urgentOnly } = currentFilters;

  if (saat !== "all") {
    const [min, max] = saat.split("-").map(Number);
    arr = arr.filter(i => i.saat >= min && i.saat <= max);
  }
  if (fiyat !== "all") {
    const [min, max] = fiyat.split("-").map(Number);
    arr = arr.filter(i => i.fiyat >= min && i.fiyat <= max);
  }
  if (urgentOnly) {
    arr = arr.filter(i => formatRemaining(i.expires_at).urgent);
  }

  if (sort === "urgent") {
    arr.sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
  } else if (sort === "price-asc") {
    arr.sort((a, b) => a.fiyat - b.fiyat);
  } else if (sort === "price-desc") {
    arr.sort((a, b) => b.fiyat - a.fiyat);
  } else if (sort === "new") {
    arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  // "smart" is default DB order: fiyat DESC, km DESC, created_at DESC
  return arr;
}

function activeFilterCount() {
  let n = 0;
  if (currentFilters.saat !== "all") n++;
  if (currentFilters.fiyat !== "all") n++;
  if (currentFilters.urgentOnly) n++;
  if (currentFilters.sort !== "smart") n++;
  if (districtSelect?.value && districtSelect.value !== "all") n++;
  return n;
}

function formatMembership(createdAtIso) {
  if (!createdAtIso) return "";
  const days = Math.floor((Date.now() - new Date(createdAtIso).getTime()) / 86400000);
  if (days < 7) return "Yeni üye";
  if (days < 30) return `Üye ${Math.floor(days / 7)} hafta`;
  if (days < 365) return `Üye ${Math.floor(days / 30)} ay`;
  return `Üye ${Math.floor(days / 365)} yıl`;
}

function renderListings() {
  guestNotice.classList.toggle("hidden", !!currentUser);

  const myPanel = document.getElementById("myListingsPanel");
  if (myPanel) myPanel.classList.toggle("hidden", !currentUser);

  const filtered = getFilteredIlanlar();

  // Sayım göstergesi (sidebar)
  const cntEl = document.getElementById("myListingsCount");
  if (cntEl && currentUser) {
    cntEl.textContent = listingScope === "mine"
      ? `${ilanlar.length} ilanım`
      : `Toplam ${ilanlar.length} ilan`;
  }

  // Sıfırla butonu görünürlüğü
  const resetBtn = document.getElementById("filterResetBtn");
  if (resetBtn) {
    const n = activeFilterCount();
    resetBtn.classList.toggle("hidden", n === 0);
    resetBtn.textContent = n > 0 ? `Sıfırla (${n})` : "Sıfırla";
  }

  // Sayfa başlığı: gösterilen sayı / toplam + seçili ilçe
  const pageH1 = document.querySelector(".page-head h1");
  const pageSub = document.querySelector(".page-head .page-sub");
  const selectedIlce = districtSelect?.value || "all";
  if (pageH1) {
    if (filtered.length === ilanlar.length) {
      pageH1.textContent = ilanlar.length > 0
        ? `İzinci Kurye İlanları (${ilanlar.length})`
        : "İzinci Kurye İlanları";
    } else {
      pageH1.textContent = `İlanlar (${filtered.length} / ${ilanlar.length})`;
    }
  }
  if (pageSub) {
    pageSub.textContent = selectedIlce === "all"
      ? "Ankara'da anlık olarak izinci arayanlar"
      : `${selectedIlce} bölgesindeki aktif ilanlar`;
  }

  listingsEl.innerHTML = "";
  if (filtered.length === 0) {
    renderEmptyState();
    return;
  }
  emptyEl.classList.add("hidden");

  filtered.forEach(i => {
    const tahminiKazanc = (i.saat * i.fiyat + i.saat * 10 * i.km).toLocaleString("tr-TR");
    // Ücret kademeleri: 250-270 → 🚀 rekabetçi, 280+ → 🚀🔥 önerilen
    const isFire = i.fiyat >= 280;
    const isRocket = i.fiyat >= 250;
    const tierBadge = isFire
      ? '<span class="tier-badge tier-fire" title="Önerilen ücret — listede üstte">🚀🔥</span>'
      : (isRocket ? '<span class="tier-badge tier-rocket" title="Rekabetçi ücret">🚀</span>' : "");
    const tierClass = isFire ? " ilan-row-fire" : (isRocket ? " ilan-row-rocket" : "");

    // Net beğeni rozeti: pozitif yeşil, negatif kırmızı, 0 gizli
    const netRxn = (i.begen_sayisi || 0) - (i.begenmeme_sayisi || 0);
    const netRxnBadge = netRxn > 0
      ? `<span class="net-rxn net-rxn-pos" title="${i.begen_sayisi} beğen − ${i.begenmeme_sayisi} beğenmeme">👍 +${netRxn}</span>`
      : (netRxn < 0
        ? `<span class="net-rxn net-rxn-neg" title="${i.begen_sayisi} beğen − ${i.begenmeme_sayisi} beğenmeme">👎 ${netRxn}</span>`
        : "");

    const row = document.createElement("article");
    row.className = "ilan-row" + (currentUser && i.user_id === currentUser.id ? " ilan-row-mine" : "") + tierClass;
    row.dataset.id = i.id;
    row.dataset.act = "open-detail";
    row.innerHTML = `
      <div class="ilan-row-cell cell-bolge">
        ${tierBadge}
        <span class="cell-ico">📍</span>
        <span class="cell-text">${escapeHtml(i.ilce)}, Ankara</span>
      </div>
      <div class="ilan-row-cell cell-sure">
        <span class="cell-label">Süre</span>
        <strong>${i.saat} <small>sa</small></strong>
      </div>
      <div class="ilan-row-cell cell-saatlik">
        <span class="cell-label">Saatlik</span>
        <strong>${i.fiyat} <small>₺/sa</small></strong>
      </div>
      <div class="ilan-row-cell cell-km">
        <span class="cell-label">KM</span>
        <strong>${i.km} <small>₺/km</small></strong>
      </div>
      <div class="ilan-row-cell cell-kazanc">
        <span class="cell-label">Tahmini</span>
        <strong>${tahminiKazanc} <small>₺</small></strong>
      </div>
      <div class="ilan-row-cell cell-aktif">
        <span class="cell-dot"></span>
        <span class="ilan-aktif-sayac" data-created="${i.created_at}">…</span>
        ${netRxnBadge}
      </div>
    `;
    listingsEl.appendChild(row);
  });

  // Yeni eklenen sayaçları hemen güncelle
  _updateAktifSayaclar();

  // "Daha Fazla Yükle" butonu
  if (hasMoreIlanlar) {
    const moreWrap = document.createElement("div");
    moreWrap.className = "load-more-wrap";
    moreWrap.innerHTML = `<button class="btn btn-ghost" id="loadMoreBtn">Daha Fazla Yükle</button>`;
    listingsEl.appendChild(moreWrap);
    document.getElementById("loadMoreBtn")?.addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      btn.disabled = true;
      btn.textContent = "Yükleniyor...";
      await loadIlanlar({ append: true });
    });
  }
}

// =============== DETAY KARTI (modal) ===============

function buildIlanCardHTML(i) {
  const lockedClass = currentUser ? "" : "locked";
  const lockedTitle = currentUser ? "" : 'title="Önce kayıt olun"';
  const isMine = currentUser && i.user_id === currentUser.id;
  const hemenBasla = _isHemenBasla(i.bas_saat);
  const tahminiKazanc = (i.saat * i.fiyat + i.saat * 10 * i.km).toLocaleString("tr-TR");
  const kisaId = i.kisa_id || ("#" + String(i.id).slice(0, 8));

  let kuryeBadges = "";
  if (currentUser && i.profile && i.profile.kullanici_tipi === "kurye") {
    const p = i.profile;
    const musaitBadge = p.musait ? '<span class="t-badge t-musait">🟢 Müsait</span>' : "";
    let puanBadge = "";
    if (p.puan_sayisi > 0) {
      const ort = Number(p.puan_ort).toFixed(1);
      puanBadge = `<button type="button" class="t-badge t-puan" data-act="show-reviews" data-kurye-id="${p.id}" data-kurye-ad="${escapeHtml(((p.ad||'')+' '+(p.soyad||'')).trim())}">⭐ ${ort} (${p.puan_sayisi})</button>`;
    }
    if (puanBadge || musaitBadge) {
      kuryeBadges = `<div class="trust-badges">${puanBadge}${musaitBadge}</div>`;
    }
  }

  let etiketHtml = "";
  const etArr = Array.isArray(i.etiketler) ? i.etiketler : [];
  if (etArr.length) {
    etiketHtml = `<div class="card-etiketler">${etArr.map(k => {
      const meta = ETIKET_LABELS[k];
      if (!meta) return "";
      return `<span class="etiket-chip"><span class="etiket-chip-ico">${meta.ico}</span>${meta.label}</span>`;
    }).join("")}</div>`;
  }

  return `
    <article class="ilan-card-v75" data-id="${i.id}">

      <div class="card-main">
        <div class="card-top-row">
          <span class="card-pill pill-ilce">📍 ${escapeHtml(i.ilce)}, Ankara</span>
          ${isMine ? '<span class="card-pill pill-mine">⚡ Senin İlanın</span>' : ""}
          ${i.fiyat >= 280
            ? '<span class="card-pill pill-fire" title="Önerilen ücret — listede üstte">🚀🔥 Önerilen Ücret</span>'
            : (i.fiyat >= 250 ? '<span class="card-pill pill-rocket" title="Rekabetçi ücret">🚀 Rekabetçi Ücret</span>' : "")}
        </div>

        <div class="card-title-row">
          <h3 class="card-title">${escapeHtml(i.baslik)}</h3>
          ${hemenBasla ? '<span class="pill-hemen">⏰ Hemen Başla</span>' : ""}
        </div>
        ${kuryeBadges}

        <div class="card-time-row">
          <div class="card-time-box">
            <span class="time-ico">🕐</span>
            <div class="time-body">
              <div class="time-big">${i.bas_saat} → ${i.bit_saat}</div>
              <div class="time-lbl">Çalışma Saati</div>
            </div>
          </div>
          <div class="card-time-box card-time-box-sec">
            <span class="time-ico">📅</span>
            <div class="time-body">
              <div class="time-big">${i.saat} saat</div>
              <div class="time-lbl">Süre</div>
            </div>
          </div>
        </div>

        <div class="card-price-row">
          <div class="price-cell">
            <span class="price-ico">💰</span>
            <div class="price-big">${i.fiyat} <span class="price-tl">₺</span><small>/saat</small></div>
            <div class="price-lbl">Saatlik Ücret</div>
          </div>
          <div class="price-cell">
            <span class="price-ico">🏍</span>
            <div class="price-big">${i.km} <span class="price-tl">₺</span><small>/km</small></div>
            <div class="price-lbl">KM Ücreti</div>
          </div>
          <div class="price-cell price-cell-kazanc">
            <span class="price-ico">💵</span>
            <div class="price-big">${tahminiKazanc} <span class="price-tl">₺</span></div>
            <div class="price-lbl">Tahmini Kazanç</div>
          </div>
        </div>

        ${i.aciklama ? `<div class="card-aciklama"><span class="aciklama-ico">ℹ</span><span class="aciklama-text">${escapeHtml(i.aciklama)}</span></div>` : ""}

        <!-- Mobile-only inline iletişim satırı (açıklamanın altında) -->
        <div class="mobile-contact-row">
          <button type="button" class="mcr-btn mcr-call ${lockedClass}" data-act="call" data-id="${i.id}" ${lockedTitle}>
            <span class="mcr-ico">📞</span><span class="mcr-label">Ara</span>
          </button>
          <button type="button" class="mcr-btn mcr-wa ${lockedClass}" data-act="wa" data-id="${i.id}" ${lockedTitle}>
            <span class="mcr-ico">💬</span><span class="mcr-label">WhatsApp</span>
          </button>
          <button type="button" class="mcr-btn mcr-addr ${lockedClass}" data-act="addr" data-id="${i.id}" ${lockedTitle}>
            <span class="mcr-ico">📍</span><span class="mcr-label">Adres</span>
          </button>
          <button type="button" class="mcr-btn mcr-more" data-act="kebab" data-id="${i.id}" aria-label="Daha fazla">
            <span class="mcr-ico">⋮</span>
          </button>
        </div>

        ${etiketHtml}

        <div class="card-bottom">
          <span class="card-aktif"><span class="aktif-dot"></span><span class="ilan-aktif-sayac" data-created="${i.created_at}">başlatılıyor…</span></span>
          ${isMine ? `<button type="button" class="card-edit-btn" data-act="edit" data-id="${i.id}">✏️ Düzenle</button>` : ""}
          ${isMine ? `<button type="button" class="card-delete-btn" data-act="delete" data-id="${i.id}">🗑 Kaldır</button>` : ""}
          <span class="card-kisaid">${escapeHtml(kisaId)}</span>
        </div>
      </div>

      <aside class="card-contact">
        <h4 class="contact-title">Hızlı İletişim</h4>
        <div class="contact-actions">
          <button type="button" class="contact-btn contact-call ${lockedClass}" data-act="call" data-id="${i.id}" ${lockedTitle}>
            <span class="contact-ico">📞</span><span class="contact-label">Ara</span>
          </button>
          <button type="button" class="contact-btn contact-wa ${lockedClass}" data-act="wa" data-id="${i.id}" ${lockedTitle}>
            <span class="contact-ico">💬</span><span class="contact-label">WhatsApp</span>
          </button>
          <button type="button" class="contact-btn contact-addr ${lockedClass}" data-act="addr" data-id="${i.id}" ${lockedTitle}>
            <span class="contact-ico">📍</span><span class="contact-label">Adres</span>
          </button>
          <button type="button" class="contact-btn contact-more" data-act="kebab" data-id="${i.id}" aria-label="Daha fazla">
            <span class="contact-ico">⋮</span>
          </button>
        </div>

        <div class="contact-divider"></div>

        <button type="button" class="menu-item" data-act="share-main" data-id="${i.id}">
          <span class="mi-ico">🔗</span><span class="mi-label">Paylaş</span>
        </button>

        ${currentUser ? `
        <div class="contact-divider"></div>

        <button type="button" class="menu-item rxn-item rxn-begen ${userReaksiyonlar.get(i.id) === 'begen' ? 'active' : ''}" data-act="rxn" data-rxn-tip="begen" data-rxn-id="${i.id}" data-id="${i.id}">
          <span class="mi-ico">👍</span><span class="mi-label">Beğen</span>
          <span class="mi-count">${(i.begen_sayisi || 0) > 0 ? i.begen_sayisi : ""}</span>
        </button>
        <button type="button" class="menu-item rxn-item rxn-dis ${userReaksiyonlar.get(i.id) === 'begenmeme' ? 'active' : ''}" data-act="rxn" data-rxn-tip="begenmeme" data-rxn-id="${i.id}" data-id="${i.id}">
          <span class="mi-ico">👎</span><span class="mi-label">Beğenmeme</span>
          <span class="mi-count">${(i.begenmeme_sayisi || 0) > 0 ? i.begenmeme_sayisi : ""}</span>
        </button>
        <button type="button" class="menu-item rxn-item rxn-rep" data-act="rxn" data-rxn-tip="report" data-id="${i.id}">
          <span class="mi-ico">🚩</span><span class="mi-label">Sorun Bildir</span>
        </button>` : ""}
      </aside>
    </article>
  `;
}

function openIlanDetail(ilan) {
  const body = document.getElementById("ilanDetailBody");
  if (!body) return;
  body.innerHTML = buildIlanCardHTML(ilan);
  openModal("ilanDetailModal");
  // URL'i güncelle (derin link) — openModal zaten push etti, replace ile tek entry kalsın
  try {
    const url = "/ilan/" + ilan.id;
    if (!(history.state?.modal === "ilanDetail" && history.state?.id === ilan.id)) {
      history.replaceState({ modal: "ilanDetail", id: ilan.id }, "", url);
    }
  } catch {}
  _updateAktifSayaclar();
}

// Boş durum: bağlama göre yardımcı mesaj + öneri chip'leri
function renderEmptyState() {
  const selectedIlce = districtSelect?.value || "all";
  const filtersActive = currentFilters.saat !== "all" || currentFilters.fiyat !== "all" || currentFilters.urgentOnly;

  if (listingScope === "mine" && currentUser) {
    emptyEl.innerHTML = `
      <div class="empty-icon">📋</div>
      <h3>Henüz ilan vermemişsin</h3>
      <p>İlk ilanını verince işletmeler hemen ulaşabilir.</p>
      <button class="btn btn-primary" id="emptyIlanVerBtn">+ İlk İlanımı Ver</button>
    `;
    document.getElementById("emptyIlanVerBtn")?.addEventListener("click", () => ilanVerBtn.click());
  } else if (filtersActive && ilanlar.length > 0) {
    // Filtreler eşleşme bulamadı (ama veri var)
    emptyEl.innerHTML = `
      <div class="empty-icon">🔍</div>
      <h3>Bu filtrelerle eşleşen ilan yok</h3>
      <p>Toplam ${ilanlar.length} aktif ilan var. Filtreleri gevşet veya sıfırla:</p>
      <button class="btn btn-primary" id="emptyFilterReset">Filtreleri Sıfırla</button>
    `;
    document.getElementById("emptyFilterReset")?.addEventListener("click", () => {
      document.getElementById("filterResetBtn")?.click();
    });
  } else if (selectedIlce !== "all") {
    // Belirli ilçede ilan yok → davet edici, başka bölgeleri öner
    emptyEl.innerHTML = `
      <div class="empty-icon">🔍</div>
      <h3>İlanları istediğiniz bölgede filtreleyebilirsiniz</h3>
      <p>${escapeHtml(selectedIlce)} bölgesinde şu an ilan yok. Aşağıdan farklı bölge seçebilirsin:</p>
      <div class="empty-chips">
        <button class="chip" data-ilce="all">Tüm İlçeler</button>
        ${ANKARA_ILCELERI.filter(i => i !== selectedIlce).slice(0, 6).map(i =>
          `<button class="chip" data-ilce="${i}">${i}</button>`
        ).join("")}
      </div>
    `;
    emptyEl.querySelectorAll(".chip").forEach(c => {
      c.addEventListener("click", () => {
        districtSelect.value = c.dataset.ilce;
        loadIlanlar();
      });
    });
  } else {
    emptyEl.innerHTML = `
      <div class="empty-icon">⏳</div>
      <h3>İlanları istediğiniz bölgede filtreleyebilirsiniz</h3>
      <p>Şu an aktif ilan yok. Üst menüden ilçe seçerek arama yapabilirsin — yeni ilanlar genelde sabah ve öğle saatlerinde yayınlanır.</p>
    `;
  }
  emptyEl.classList.remove("hidden");
}

// =============== FAVORİLER / ŞİKAYET / EDIT / KEBAB ===============

async function loadFavoriler() {
  favoriler = new Set();
  userReaksiyonlar = new Map();
  if (!currentUser) return;
  try {
    const session = readStoredSession();
    if (!session?.access_token) return;
    // Favoriler (kalp) + reaksiyonlar (begen/begenmeme) paralel
    const [favRes, rxnRes] = await Promise.all([
      rawSelect(`favoriler?user_id=eq.${currentUser.id}&select=ilan_id`, session.access_token, 5000),
      rawSelect(`reaksiyonlar?user_id=eq.${currentUser.id}&select=ilan_id,tip`, session.access_token, 5000)
    ]);
    if (favRes?.error) console.warn("[loadFavoriler]", favRes.error);
    else (favRes.data || []).forEach(r => favoriler.add(r.ilan_id));
    if (rxnRes?.error) console.warn("[loadReaksiyonlar]", rxnRes.error);
    else (rxnRes.data || []).forEach(r => userReaksiyonlar.set(r.ilan_id, r.tip));
  } catch (e) { console.warn("[loadFavoriler throw]", e); }
}

// Reaksiyon (begen/begenmeme) — Reddit/YT tarzı: birbirini iter
async function toggleReaksiyon(ilanId, tip) {
  if (!currentUser) { openModal("registerModal"); return; }
  const session = readStoredSession();
  if (!session?.access_token) return;
  const ilan = ilanlar.find(x => x.id === ilanId);
  if (!ilan) return;

  const current = userReaksiyonlar.get(ilanId); // "begen" | "begenmeme" | undefined
  // Optimistic UI değişiklikleri
  const prev = { current, begen: ilan.begen_sayisi || 0, begenmeme: ilan.begenmeme_sayisi || 0 };

  if (current === tip) {
    // Toggle off: bu reaksiyonu sil
    userReaksiyonlar.delete(ilanId);
    if (tip === "begen") ilan.begen_sayisi = Math.max(0, (ilan.begen_sayisi || 0) - 1);
    else ilan.begenmeme_sayisi = Math.max(0, (ilan.begenmeme_sayisi || 0) - 1);
  } else if (current) {
    // Swap: diğerinden bu tarafa al
    userReaksiyonlar.set(ilanId, tip);
    if (current === "begen") {
      ilan.begen_sayisi = Math.max(0, (ilan.begen_sayisi || 0) - 1);
      ilan.begenmeme_sayisi = (ilan.begenmeme_sayisi || 0) + 1;
    } else {
      ilan.begenmeme_sayisi = Math.max(0, (ilan.begenmeme_sayisi || 0) - 1);
      ilan.begen_sayisi = (ilan.begen_sayisi || 0) + 1;
    }
  } else {
    // Yeni reaksiyon
    userReaksiyonlar.set(ilanId, tip);
    if (tip === "begen") ilan.begen_sayisi = (ilan.begen_sayisi || 0) + 1;
    else ilan.begenmeme_sayisi = (ilan.begenmeme_sayisi || 0) + 1;
  }
  _refreshRxnBtns(ilanId);

  // Backend: önce DELETE (varsa), sonra INSERT (toggle off değilse)
  try {
    if (current) {
      // Mevcut reaksiyonu sil
      const delUrl = `${SUPABASE_URL}/rest/v1/reaksiyonlar?user_id=eq.${currentUser.id}&ilan_id=eq.${ilanId}`;
      const r = await fetch(delUrl, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }
      });
      if (!r.ok) throw new Error("DELETE " + r.status);
    }
    if (current !== tip) {
      // Yeni reaksiyon ekle
      const { error } = await rawInsert(
        "reaksiyonlar",
        { user_id: currentUser.id, ilan_id: ilanId, tip },
        session.access_token
      );
      if (error) throw new Error(error.message);
    }
  } catch (e) {
    // Rollback
    if (prev.current) userReaksiyonlar.set(ilanId, prev.current);
    else userReaksiyonlar.delete(ilanId);
    ilan.begen_sayisi = prev.begen;
    ilan.begenmeme_sayisi = prev.begenmeme;
    _refreshRxnBtns(ilanId);
    // Rate limit hatası özel mesaj (sql/14)
    const msg = (e.message || String(e));
    if (msg.includes("REAKSIYON_HIZ_LIMITI") || msg.includes("hızlı reaksiyon")) {
      toast("⏱ Çok hızlı reaksiyon yapıyorsun. Lütfen 1 dakika bekle.", "error", 5000);
    } else {
      toast("Reaksiyon kaydedilemedi: " + msg, "error");
    }
  }
}

function _refreshRxnBtns(ilanId) {
  const ilan = ilanlar.find(x => x.id === ilanId);
  if (!ilan) return;
  const cur = userReaksiyonlar.get(ilanId);

  document.querySelectorAll(`[data-rxn-id="${ilanId}"]`).forEach(btn => {
    const tip = btn.dataset.rxnTip;
    const countEl = btn.querySelector(".kmi-count") || btn.querySelector(".mi-count");
    let active = false;
    let count = 0;
    if (tip === "begen") { active = cur === "begen"; count = ilan.begen_sayisi || 0; }
    else if (tip === "begenmeme") { active = cur === "begenmeme"; count = ilan.begenmeme_sayisi || 0; }
    btn.classList.toggle("active", active);
    if (countEl) countEl.textContent = count > 0 ? count : "";
  });
}

async function toggleFavori(ilanId) {
  if (!currentUser) { openModal("registerModal"); return; }
  const session = readStoredSession();
  if (!session?.access_token) return;
  const ilan = ilanlar.find(x => x.id === ilanId);
  if (!ilan) return;
  const isFav = favoriler.has(ilanId);

  if (isFav) {
    favoriler.delete(ilanId);
    ilan.kalp_sayisi = Math.max(0, (ilan.kalp_sayisi || 0) - 1);
    _refreshRxnBtns(ilanId);
    try {
      const url = `${SUPABASE_URL}/rest/v1/favoriler?user_id=eq.${currentUser.id}&ilan_id=eq.${ilanId}`;
      const r = await fetch(url, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token }
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
    } catch (e) {
      favoriler.add(ilanId);
      ilan.kalp_sayisi = (ilan.kalp_sayisi || 0) + 1;
      _refreshRxnBtns(ilanId);
      toast("Kalp kaldırılamadı: " + (e.message || e), "error");
    }
  } else {
    favoriler.add(ilanId);
    ilan.kalp_sayisi = (ilan.kalp_sayisi || 0) + 1;
    _refreshRxnBtns(ilanId);
    const { error } = await rawInsert(
      "favoriler",
      { user_id: currentUser.id, ilan_id: ilanId },
      session.access_token
    );
    if (error) {
      favoriler.delete(ilanId);
      ilan.kalp_sayisi = Math.max(0, (ilan.kalp_sayisi || 0) - 1);
      _refreshRxnBtns(ilanId);
      toast("Kalbe eklenemedi: " + error.message, "error");
    }
  }
}

// Kebab dropdown — DOM'a bir tane menü, hangi karta açıldıysa data ile takip
function _closeKebab() {
  document.querySelectorAll(".kebab-menu").forEach(m => m.remove());
  document.querySelectorAll(".kebab-btn.open").forEach(b => b.classList.remove("open"));
}

function _openKebab(btn, ilan) {
  _closeKebab();
  btn.classList.add("open");
  const cur = userReaksiyonlar.get(ilan.id);
  const items = [];
  items.push(`<button type="button" class="kmenu-item" data-act="share" data-id="${ilan.id}"><span class="kmi-ico">🔗</span><span class="kmi-label">Paylaş</span></button>`);
  items.push(`<div class="kmenu-sep"></div>`);
  items.push(`<button type="button" class="kmenu-item kmenu-rxn ${cur === 'begen' ? 'active' : ''}" data-act="rxn" data-rxn-tip="begen" data-rxn-id="${ilan.id}" data-id="${ilan.id}">
    <span class="kmi-ico">👍</span><span class="kmi-label">Beğen</span>
    <span class="kmi-count">${(ilan.begen_sayisi || 0) > 0 ? ilan.begen_sayisi : ""}</span>
  </button>`);
  items.push(`<button type="button" class="kmenu-item kmenu-rxn ${cur === 'begenmeme' ? 'active' : ''}" data-act="rxn" data-rxn-tip="begenmeme" data-rxn-id="${ilan.id}" data-id="${ilan.id}">
    <span class="kmi-ico">👎</span><span class="kmi-label">Beğenmeme</span>
    <span class="kmi-count">${(ilan.begenmeme_sayisi || 0) > 0 ? ilan.begenmeme_sayisi : ""}</span>
  </button>`);
  items.push(`<button type="button" class="kmenu-item kmenu-rxn-rep" data-act="rxn" data-rxn-tip="report" data-id="${ilan.id}"><span class="kmi-ico">🚩</span><span class="kmi-label">Sorun Bildir</span></button>`);
  const menu = document.createElement("div");
  menu.className = "kebab-menu";
  menu.innerHTML = items.join("");
  btn.parentElement.appendChild(menu);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".kebab-btn") || e.target.closest(".kebab-menu")) return;
  _closeKebab();
}, true);

// Şikayet modalı
function openSikayetModal(ilanId) {
  if (!currentUser) { openModal("registerModal"); return; }
  document.getElementById("sikayetIlanId").value = ilanId;
  document.getElementById("sikayetSebep").value = "";
  document.getElementById("sikayetAciklama").value = "";
  setStatus("sikayetStatus", "info", "");
  openModal("sikayetModal");
}

document.getElementById("sikayetForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const ilanId = document.getElementById("sikayetIlanId").value;
  const sebep = document.getElementById("sikayetSebep").value;
  const aciklama = document.getElementById("sikayetAciklama").value.trim();
  if (!sebep) { setStatus("sikayetStatus", "error", "Sebep seçmelisin."); return; }
  const session = readStoredSession();
  if (!session?.access_token) return;
  const { error } = await rawInsert("sikayetler", {
    ilan_id: ilanId || null,
    user_id: currentUser.id,
    sebep,
    aciklama: aciklama || null
  }, session.access_token);
  if (error) {
    setStatus("sikayetStatus", "error", "Bildirilemedi: " + error.message);
    return;
  }
  closeModals();
  toast("Şikayetin alındı. Moderatörler inceleyecek.", "ok", 3500);
});

// İlan düzenleme modu — formu doldur
function openEditIlan(ilan) {
  if (!currentUser || ilan.user_id !== currentUser.id) return;
  _editingIlanId = ilan.id;

  // Form değerlerini doldur
  const form = document.getElementById("ilanForm");
  form.querySelector("[name=ilan_id]").value = ilan.id;
  form.querySelector("[name=baslik]").value = ilan.baslik || "";
  form.querySelector("[name=ilce]").value = ilan.ilce || "";
  form.querySelector("[name=fiyat]").value = ilan.fiyat || 200;
  document.getElementById("fiyatVal").textContent = ilan.fiyat || 200;
  form.querySelector("[name=km]").value = ilan.km || 5;
  document.getElementById("kmVal").textContent = ilan.km || 5;
  form.querySelector("[name=basSaat]").value = ilan.bas_saat || "09:00";
  form.querySelector("[name=bitSaat]").value = ilan.bit_saat || "18:00";
  form.querySelector("[name=isyeriAd]").value = ilan.isyeri_ad || "";
  form.querySelector("[name=isyeriAdres]").value = ilan.isyeri_adres || "";
  form.querySelector("[name=iletisimTel]").value = ilan.iletisim_tel ? _displayPhone(ilan.iletisim_tel) : "";
  form.querySelector("[name=aciklama]").value = ilan.aciklama || "";
  // Düzenleme modunda kurallar zaten önce kabul edilmişti — otomatik işaretle
  const onayEl = document.getElementById("ilanKurallarOnay");
  if (onayEl) onayEl.checked = true;

  // Etiketler
  const etArr = ilan.etiketler || [];
  form.querySelectorAll("[name=etiketler]").forEach(cb => {
    cb.checked = etArr.includes(cb.value);
  });

  if (typeof _updateSureOzeti === "function") _updateSureOzeti();
  document.getElementById("ilanModalTitle").textContent = "İlanı Düzenle";
  document.getElementById("ilanSubmitBtn").textContent = "Güncelle";
  openModal("ilanModal");
}

function resetIlanFormMode() {
  _editingIlanId = null;
  const idInput = document.querySelector("#ilanForm [name=ilan_id]");
  if (idInput) idInput.value = "";
  document.getElementById("ilanModalTitle").textContent = "İzinci İlanı Ver";
  document.getElementById("ilanSubmitBtn").textContent = "İlanı Yayınla";
}

// "Hemen Başla" rozeti — bas_saat şimdiden ±'ye yakınsa
function _isHemenBasla(basSaat) {
  if (!basSaat) return false;
  const [h, m] = String(basSaat).split(":").map(Number);
  if (Number.isNaN(h)) return false;
  const now = new Date();
  const start = new Date(); start.setHours(h, m || 0, 0, 0);
  const diffMin = (start.getTime() - now.getTime()) / 60000;
  return diffMin >= -120 && diffMin <= 60;
}

// =============== KART AKSİYONLARI ===============
// Liste row click & detay modal içindeki aksiyonlar — tek event delegasyonu
document.addEventListener("click", async e => {
  // Liste satırı (compact row) tıklandı → detay modalı aç
  const rowEl = e.target.closest(".ilan-row");
  if (rowEl && !e.target.closest("[data-act]") && rowEl.dataset.act === "open-detail") {
    const ilan = ilanlar.find(x => x.id === rowEl.dataset.id);
    if (ilan) openIlanDetail(ilan);
    return;
  }

  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  // Sadece kart/detay/list aksiyonları (kebab/share/edit/delete/call/wa/addr/rxn/show-reviews/open-detail)
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if (act === "open-detail") {
    const ilan = ilanlar.find(x => x.id === id);
    if (ilan) openIlanDetail(ilan);
    return;
  }

  if (act === "show-reviews") {
    const kuryeId = btn.dataset.kuryeId;
    const kuryeAd = btn.dataset.kuryeAd || "Kurye";
    openReviewViewModal(kuryeId, kuryeAd);
    return;
  }

  if (act === "kebab") {
    e.stopPropagation();
    const ilan = ilanlar.find(x => x.id === id);
    if (!ilan) return;
    if (btn.classList.contains("open")) _closeKebab();
    else _openKebab(btn, ilan);
    return;
  }

  if (act === "share") {
    _closeKebab();
    copyIlanLink(id);
    return;
  }

  if (act === "edit") {
    _closeKebab();
    const ilan = ilanlar.find(x => x.id === id);
    if (ilan) openEditIlan(ilan);
    return;
  }

  if (act === "report") {
    _closeKebab();
    openSikayetModal(id);
    return;
  }

  if (act === "rxn") {
    e.stopPropagation();
    const tip = btn.dataset.rxnTip;
    if (tip === "kalp") {
      toggleFavori(id);
    } else if (tip === "begen" || tip === "begenmeme") {
      toggleReaksiyon(id, tip);
    } else if (tip === "report") {
      openSikayetModal(id);
    }
    return;
  }

  if (act === "share-main") {
    e.stopPropagation();
    copyIlanLink(id);
    return;
  }

  if (act === "delete") {
    if (!currentUser) return;
    const ilan = ilanlar.find(x => x.id === id);
    if (!ilan) return;
    // Yeni akış: telefon girme modalı aç
    openDeleteIlanModal(ilan);
    return;
  }

  if (!currentUser) {
    openModal("registerModal");
    return;
  }

  const ilan = ilanlar.find(x => x.id === id);
  if (!ilan) return;
  // İlan kendi iletişim telefonunu taşır; yoksa profile.tel fallback
  const telRaw = (ilan.iletisim_tel || ilan.profile?.tel || "").trim();
  const tel = telRaw.replace(/\s/g, "");

  if (act === "call") {
    if (!tel) return toast("Telefon bilgisi bulunamadı.", "error");
    window.location.href = "tel:" + tel;
  } else if (act === "wa") {
    if (!tel) return toast("Telefon bilgisi bulunamadı.", "error");
    let waNum = tel.replace(/\D/g, "");
    if (waNum.startsWith("0")) waNum = "9" + waNum;         // 0532... → 90532...
    else if (!waNum.startsWith("90")) waNum = "90" + waNum; // 532...  → 90532...
    const msg = `Merhaba, izincikurye.com'da "${ilan.baslik}" ilanını gördüm. Hâlâ müsait misin?`;
    window.open("https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg), "_blank");
  } else if (act === "addr") {
    showAdres(ilan);
  }
});

// =============== YORUM / PUAN SİSTEMİ ===============

let _reviewTab = "pending"; // pending | done

async function refreshPendingReviewCount() {
  const banner = document.getElementById("isletmeYorumBanner");
  const badge = document.getElementById("reviewPendingBadge");

  // Sadece girişli olması yeterli — kullaniciTipi filtresine gerek yok
  // (yorum_haklari'na satır eklendiyse hangi tip olursa olsun banner görünsün)
  if (!currentUser) {
    banner?.classList.add("hidden");
    badge?.classList.add("hidden");
    return;
  }

  const session = readStoredSession();
  const { data, error } = await rawSelect(
    `yorum_haklari?isletme_id=eq.${currentUser.id}&kullanildi=eq.false&select=id`,
    session?.access_token, 6000
  );
  if (error) console.warn("[banner] yorum_haklari sorgu hatası:", error);
  const n = (data || []).length;

  if (badge) {
    badge.textContent = n;
    badge.classList.toggle("hidden", !n);
  }
  if (banner) {
    banner.classList.toggle("hidden", n === 0);
    const cnt = document.getElementById("iybCount");
    if (cnt) cnt.textContent = n;
  }
}

// Banner tıklama → yorum listesi modalı aç
document.getElementById("iybOpen")?.addEventListener("click", () => openReviewListModal());

// =============== PROFİL EKSİK BANNER ===============
function checkProfilEksikBanner() {
  const banner = document.getElementById("profilEksikBanner");
  const detailEl = document.getElementById("pebDetail");
  if (!banner) return;
  if (!currentUser || currentUser.kullaniciTipi !== "isletme") {
    banner.classList.add("hidden");
    return;
  }
  // Oturumda dismiss edildiyse gösterme
  if (sessionStorage.getItem("izk_dismiss_pebanner_" + currentUser.id)) {
    banner.classList.add("hidden");
    return;
  }
  // Eksik alan kontrolü
  const missing = [];
  if (!currentUser.isletmeAdi) missing.push("işletme adı");
  if (!currentUser.isAdresi) missing.push("iş adresi");
  if (_telDigits(currentUser.isTelefonu).length < 10) missing.push("iş telefonu");
  if (missing.length === 0) {
    banner.classList.add("hidden");
    return;
  }
  if (detailEl) {
    detailEl.textContent = "Eksik: " + missing.join(", ") + ". Müşterilerin sana ulaşabilmesi için tamamla.";
  }
  banner.classList.remove("hidden");
}

document.getElementById("pebClose")?.addEventListener("click", () => {
  document.getElementById("profilEksikBanner")?.classList.add("hidden");
  if (currentUser?.id) {
    try { sessionStorage.setItem("izk_dismiss_pebanner_" + currentUser.id, "1"); } catch {}
  }
});
document.getElementById("pebOpen")?.addEventListener("click", () => {
  openProfileModal();
  // İşletme sekmesine geç — eksik alan büyük ihtimal orada
  setTimeout(() => switchProfileTab("isletme"), 50);
});

async function openReviewListModal() {
  _reviewTab = "pending";
  document.querySelectorAll("#reviewListModal .seg-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.rtab === "pending");
  });
  openModal("reviewListModal");
  await loadReviewList();
}

document.querySelectorAll("#reviewListModal .seg-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    _reviewTab = btn.dataset.rtab;
    document.querySelectorAll("#reviewListModal .seg-btn").forEach(b =>
      b.classList.toggle("active", b === btn));
    await loadReviewList();
  });
});

async function loadReviewList() {
  const listEl = document.getElementById("reviewList");
  listEl.innerHTML = `<p class="muted small">Yükleniyor...</p>`;

  const session = readStoredSession();
  if (_reviewTab === "pending") {
    const { data: haklar, error } = await rawSelect(
      `yorum_haklari?isletme_id=eq.${currentUser.id}&kullanildi=eq.false&select=*&order=created_at.desc`,
      session?.access_token, 6000
    );
    if (error) { listEl.innerHTML = `<p class="muted">Hata: ${error.message}</p>`; return; }
    if (!haklar?.length) {
      listEl.innerHTML = `<div class="empty" style="padding:20px"><div class="empty-icon">✨</div><p>Bekleyen yorum yok. İlanını kaldırırken kurye telefonu girersen burada görünür.</p></div>`;
      return;
    }
    const kuryeIds = [...new Set(haklar.map(h => h.kurye_id))];
    const { data: kuryeler } = await rawSelect(
      `profiles?id=in.(${kuryeIds.join(",")})&select=id,ad,soyad,puan_ort,puan_sayisi`,
      session?.access_token, 6000
    );
    const kMap = Object.fromEntries((kuryeler || []).map(k => [k.id, k]));
    listEl.innerHTML = haklar.map(h => {
      const k = kMap[h.kurye_id] || {};
      const name = ((k.ad || "") + " " + (k.soyad || "")).trim() || "Kurye";
      return `
        <div class="review-item">
          <div class="review-item-info">
            <strong>${escapeHtml(name)}</strong>
            <small>${escapeHtml(h.ilan_baslik || "")}</small>
            <small style="color:var(--gray-500)">${formatDateTime(h.created_at)}</small>
          </div>
          <button class="btn btn-primary btn-sm review-write-btn" data-hakki-id="${h.id}" data-kurye-id="${h.kurye_id}" data-kurye-ad="${escapeHtml(name)}" data-ilan-id="${h.ilan_id || ''}" data-ilan-baslik="${escapeHtml(h.ilan_baslik || '')}">Yorum Yaz</button>
        </div>
      `;
    }).join("");
    listEl.querySelectorAll(".review-write-btn").forEach(b => {
      b.addEventListener("click", () => openReviewWriteModal(b.dataset));
    });
  } else {
    // Yorumladıklarım
    const { data: yorums, error } = await rawSelect(
      `yorumlar?isletme_id=eq.${currentUser.id}&select=*&order=created_at.desc`,
      session?.access_token, 6000
    );
    if (error) { listEl.innerHTML = `<p class="muted">Hata: ${error.message}</p>`; return; }
    if (!yorums?.length) {
      listEl.innerHTML = `<p class="muted">Henüz yorum yazmadın.</p>`;
      return;
    }
    const kuryeIds = [...new Set(yorums.map(y => y.kurye_id))];
    const { data: kuryeler } = await rawSelect(
      `profiles?id=in.(${kuryeIds.join(",")})&select=id,ad,soyad`,
      session?.access_token, 6000
    );
    const kMap = Object.fromEntries((kuryeler || []).map(k => [k.id, k]));
    listEl.innerHTML = yorums.map(y => {
      const k = kMap[y.kurye_id] || {};
      const name = ((k.ad || "") + " " + (k.soyad || "")).trim() || "Kurye";
      return `
        <div class="review-item review-item-done">
          <div class="review-item-info">
            <strong>${escapeHtml(name)}</strong>
            <div class="stars-display">${"★".repeat(y.puan)}${"☆".repeat(5 - y.puan)}</div>
            ${y.yorum ? `<p style="margin:4px 0;font-size:13px">${escapeHtml(y.yorum)}</p>` : ""}
            <small style="color:var(--gray-500)">${formatDateTime(y.created_at)}</small>
          </div>
        </div>
      `;
    }).join("");
  }
}

function openReviewWriteModal(d) {
  document.getElementById("rwHakkiId").value = d.hakkiId;
  document.getElementById("rwKuryeId").value = d.kuryeId;
  document.getElementById("rwIlanId").value = d.ilanId || "";
  document.getElementById("rwPuan").value = "0";
  document.getElementById("rwYorum").value = "";
  document.getElementById("rwStatus").textContent = "";
  document.getElementById("reviewWriteTitle").textContent = `${d.kuryeAd} için Yorum`;
  document.getElementById("reviewWriteSub").textContent = d.ilanBaslik ? `İlan: ${d.ilanBaslik}` : "";
  // Yıldızları sıfırla
  document.querySelectorAll("#rwStars .star").forEach(s => {
    s.textContent = "☆";
    s.classList.remove("active");
  });
  openModal("reviewWriteModal");
}

// Yıldız tıklama
document.querySelectorAll("#rwStars .star").forEach(star => {
  star.addEventListener("click", () => {
    const val = parseInt(star.dataset.val, 10);
    document.getElementById("rwPuan").value = String(val);
    document.querySelectorAll("#rwStars .star").forEach(s => {
      const sv = parseInt(s.dataset.val, 10);
      s.textContent = sv <= val ? "★" : "☆";
      s.classList.toggle("active", sv <= val);
    });
  });
  star.addEventListener("mouseenter", () => {
    const val = parseInt(star.dataset.val, 10);
    document.querySelectorAll("#rwStars .star").forEach(s => {
      const sv = parseInt(s.dataset.val, 10);
      s.classList.toggle("hover", sv <= val);
    });
  });
});
document.getElementById("rwStars")?.addEventListener("mouseleave", () => {
  document.querySelectorAll("#rwStars .star").forEach(s => s.classList.remove("hover"));
});

document.getElementById("reviewWriteForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const puan = parseInt(document.getElementById("rwPuan").value, 10);
  if (!puan || puan < 1 || puan > 5) {
    setStatus("rwStatus", "error", "1-5 yıldız seç.");
    return;
  }
  const kurye_id = document.getElementById("rwKuryeId").value;
  const ilan_id = document.getElementById("rwIlanId").value || null;
  const yorum = document.getElementById("rwYorum").value.trim() || null;

  const btn = e.submitter;
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = "Gönderiliyor...";
  const session = readStoredSession();
  const { error } = await rawInsert(
    "yorumlar",
    { kurye_id, isletme_id: currentUser.id, ilan_id, puan, yorum },
    session?.access_token,
    8000
  );
  btn.disabled = false; btn.textContent = orig;

  if (error) {
    setStatus("rwStatus", "error", "Hata: " + error.message);
    return;
  }
  closeModals();
  toast("⭐ Yorumun gönderildi. Teşekkürler!", "ok");
  refreshPendingReviewCount();
});

// ===== Kurye için yorumları gösterme modalı =====
async function openReviewViewModal(kuryeId, kuryeAd) {
  document.getElementById("reviewViewTitle").textContent = `${kuryeAd} için Yorumlar`;
  document.getElementById("reviewViewList").innerHTML = `<p class="muted small">Yükleniyor...</p>`;
  document.getElementById("reviewViewSummary").innerHTML = "";
  openModal("reviewViewModal");

  // Özet (profiles.puan_ort + sayisi)
  const session = readStoredSession();
  const { data: profArr } = await rawSelect(
    `profiles?id=eq.${kuryeId}&select=puan_ort,puan_sayisi`,
    session?.access_token, 6000
  );
  const prof = (profArr || [])[0] || null;
  if (prof?.puan_sayisi) {
    const ort = Number(prof.puan_ort).toFixed(1);
    const fullStars = Math.round(prof.puan_ort);
    document.getElementById("reviewViewSummary").innerHTML = `
      <div class="review-summary-inner">
        <div class="review-summary-num">${ort}</div>
        <div class="review-summary-stars">${"★".repeat(fullStars)}${"☆".repeat(5 - fullStars)}</div>
        <div class="review-summary-count">${prof.puan_sayisi} yorum</div>
      </div>
    `;
  } else {
    document.getElementById("reviewViewSummary").innerHTML = `<p class="muted small">Bu kurye için henüz yorum yok.</p>`;
  }

  // Yorum listesi
  const { data: yorums } = await rawSelect(
    `yorumlar?kurye_id=eq.${kuryeId}&select=puan,yorum,created_at,isletme_id&order=created_at.desc&limit=50`,
    session?.access_token, 6000
  );
  const listEl = document.getElementById("reviewViewList");
  if (!yorums?.length) {
    listEl.innerHTML = "";
    return;
  }
  // İşletme adı join
  const isletmeIds = [...new Set(yorums.map(y => y.isletme_id))];
  const { data: bizs } = await rawSelect(
    `profiles?id=in.(${isletmeIds.join(",")})&select=id,ad,soyad,isletme_adi,kullanici_tipi`,
    session?.access_token, 6000
  );
  const bMap = Object.fromEntries((bizs || []).map(b => [b.id, b]));
  listEl.innerHTML = yorums.map(y => {
    const b = bMap[y.isletme_id] || {};
    const name = b.isletme_adi || ((b.ad || "") + " " + (b.soyad || "")).trim() || "İşletme";
    return `
      <div class="review-item review-item-done">
        <div class="review-item-info">
          <strong>${escapeHtml(name)}</strong>
          <div class="stars-display">${"★".repeat(y.puan)}${"☆".repeat(5 - y.puan)}</div>
          ${y.yorum ? `<p style="margin:4px 0;font-size:13px">${escapeHtml(y.yorum)}</p>` : ""}
          <small style="color:var(--gray-500)">${formatDateTime(y.created_at)}</small>
        </div>
      </div>
    `;
  }).join("");
}

// =============== İLAN KALDIRMA AKIŞI ===============
function openDeleteIlanModal(ilan) {
  document.getElementById("deleteIlanId").value = ilan.id;
  document.getElementById("deleteIlanSub").textContent = `"${ilan.baslik}" — hangi kurye ile anlaştın?`;
  const tel = document.getElementById("deleteIlanTel");
  tel.value = "";
  tel.classList.remove("invalid", "valid");
  document.getElementById("deleteIlanHint").textContent = "10 hane gir (baştaki 0 olmadan)";
  document.getElementById("deleteIlanHint").className = "phone-hint";
  document.getElementById("deleteIlanStatus").textContent = "";
  document.getElementById("deleteIlanStatus").className = "status";
  openModal("deleteIlanModal");
}

// +90 telefon input: sadece rakam kabul, baştaki 0/90 strip, canlı format "5XX XXX XX XX"
function _phoneRaw10(input) {
  let d = (input || "").replace(/\D/g, "");
  // Baştaki 0 veya 90 prefix'i kullanıcı kazara yazdıysa kırp
  if (d.length === 12 && d.startsWith("90")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}
function _formatPhone10(d) {
  // "5XX XXX XX XX"
  let out = "";
  if (d.length > 0) out += d.slice(0, 3);
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += " " + d.slice(6, 8);
  if (d.length > 8) out += " " + d.slice(8, 10);
  return out;
}

document.getElementById("deleteIlanTel")?.addEventListener("input", e => {
  const d = _phoneRaw10(e.target.value);
  e.target.value = _formatPhone10(d);
  const hint = document.getElementById("deleteIlanHint");
  if (d.length === 0) {
    e.target.classList.remove("invalid", "valid");
    hint.textContent = "10 hane gir (baştaki 0 olmadan)";
    hint.className = "phone-hint";
  } else if (d.length < 10) {
    e.target.classList.add("invalid");
    e.target.classList.remove("valid");
    hint.textContent = `${10 - d.length} hane daha…`;
    hint.className = "phone-hint phone-hint-warn";
  } else {
    e.target.classList.remove("invalid");
    e.target.classList.add("valid");
    // Türkiye mobil 5'le başlar — info notu
    if (!d.startsWith("5")) {
      hint.textContent = "⚠ Türkiye mobil numaraları 5 ile başlar.";
      hint.className = "phone-hint phone-hint-warn";
    } else {
      hint.textContent = "✓ Doğru format";
      hint.className = "phone-hint phone-hint-ok";
    }
  }
});

async function performDeleteWithReview(ilanId, kuryeTel) {
  const session = readStoredSession();
  const { data, error } = await rawRpc(
    "grant_review_and_delete_ilan",
    { p_ilan_id: ilanId, p_kurye_tel: kuryeTel || "" },
    session?.access_token,
    8000
  );
  if (error) {
    toast("İlan silinemedi: " + error.message, "error");
    return null;
  }
  return data;
}

document.getElementById("deleteIlanForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const id = document.getElementById("deleteIlanId").value;
  const d = _phoneRaw10(document.getElementById("deleteIlanTel").value);
  if (d.length === 0) {
    setStatus("deleteIlanStatus", "error", "Telefon gir veya 'Atla' tıkla.");
    return;
  }
  if (d.length !== 10) {
    setStatus("deleteIlanStatus", "error", "Telefon eksik — 10 hane gerekli.");
    return;
  }
  // +90 prefix ile gönder (SQL fonksiyonu zaten son 10 haneyi alıp eşleştirir)
  const telFull = "+90" + d;
  const btn = e.submitter;
  const orig = btn.textContent;
  btn.disabled = true; btn.textContent = "Kaydediliyor...";
  const result = await performDeleteWithReview(id, telFull);
  btn.disabled = false; btn.textContent = orig;
  if (!result) return;
  closeModals();
  await loadIlanlar();
  if (result.matched) {
    toast("✅ İlan kaldırıldı. Bu kurye için yorum hakkın oluştu.", "ok", 5000);
    refreshPendingReviewCount();
  } else {
    toast("İlan kaldırıldı. Telefon kayıtlı kurye değil — yorum hakkı verilmedi.", "ok", 5000);
  }
});

document.getElementById("deleteIlanSkip")?.addEventListener("click", async () => {
  const id = document.getElementById("deleteIlanId").value;
  if (!confirm("Yorum hakkı olmadan ilanı kaldıracak. Devam?")) return;
  const result = await performDeleteWithReview(id, "");
  if (!result) return;
  closeModals();
  await loadIlanlar();
  toast("İlan kaldırıldı.", "ok");
});


let _adresCurrentIlan = null;
function showAdres(i) {
  _adresCurrentIlan = i;
  const telRaw = i.iletisim_tel || i.profile?.tel || "";
  const tel = telRaw ? _displayPhone(telRaw) : "—";
  const ad = ((i.profile?.ad || "") + " " + (i.profile?.soyad || "")).trim() || "—";
  const titleEl = document.getElementById("adresModalTitle");
  if (titleEl) titleEl.textContent = i.baslik || "İlan Detayı";

  const remainingTxt = formatRemaining(i.expires_at);
  const remainingHtml = `<div class="row"><strong>Kalan süre:</strong><span class="${remainingTxt.urgent ? 'urgent-text' : ''}">⏳ ${remainingTxt.text}</span></div>`;

  document.getElementById("adresContent").innerHTML = `
    <div class="row"><strong>İlçe:</strong><span>📍 ${escapeHtml(i.ilce)}</span></div>
    <div class="row"><strong>Çalışma:</strong><span>${i.bas_saat} → ${i.bit_saat} · ${i.saat} saat</span></div>
    <div class="row"><strong>Ücret:</strong><span><strong>${i.fiyat} ₺</strong> · ${i.km} ₺/km</span></div>
    ${remainingHtml}
    <div class="row"><strong>İşyeri:</strong><span>${escapeHtml(i.isyeri_ad || "—")}</span></div>
    <div class="row"><strong>İlgili kişi:</strong><span>${escapeHtml(ad)}</span></div>
    <div class="row"><strong>Adres:</strong><span>${escapeHtml(i.isyeri_adres || "—")}</span></div>
    <div class="row"><strong>Telefon:</strong><span>${escapeHtml(tel)}</span></div>
    ${i.aciklama ? `<div class="row"><strong>Not:</strong><span>${escapeHtml(i.aciklama)}</span></div>` : ""}
  `;
  // Sticky CTA göster (tel varsa)
  const cta = document.getElementById("adresStickyCTA");
  if (cta) cta.style.display = (i.iletisim_tel || i.profile?.tel) ? "" : "none";

  // URL'i güncelle: clean URL `/ilan/<id>` — pushState ile history girişi ekle
  // (geri tuşu modalı kapatsın, siteden çıkmasın)
  // openModal'ı önce çağır (push state'i o yapar), sonra URL ve title'ı replace ile güncelle
  openModal("adresModal");
  try {
    history.replaceState({ modal: "adres", id: i.id }, "", "/ilan/" + i.id);
    document.title = `${i.baslik} · ${i.ilce} · ${i.fiyat}₺ — izincikurye`;
  } catch {}
}

// Adres modal sticky CTA — call/wa
document.getElementById("adresCallBtn")?.addEventListener("click", () => {
  const i = _adresCurrentIlan;
  const telRaw = i?.iletisim_tel || i?.profile?.tel || "";
  if (!telRaw) return toast("Telefon bilgisi bulunamadı.", "error");
  window.location.href = "tel:" + _phoneToE164(telRaw);
});
document.getElementById("adresWaBtn")?.addEventListener("click", () => {
  const i = _adresCurrentIlan;
  const telRaw = i?.iletisim_tel || i?.profile?.tel || "";
  if (!telRaw) return toast("Telefon bilgisi bulunamadı.", "error");
  if (!_isMobileTr(telRaw)) return toast("Bu numara WhatsApp desteklemiyor (sabit hat).", "error", 4000);
  // E.164'ten WA formatına: +905XXX → 905XXX
  const waNum = _phoneToE164(telRaw).replace(/\D/g, "");
  const msg = `Merhaba, izincikurye.com'da "${i.baslik}" ilanını gördüm. Hâlâ müsait misin?`;
  window.open("https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg), "_blank");
});
document.getElementById("adresShareBtn")?.addEventListener("click", () => {
  const i = _adresCurrentIlan;
  if (!i) return;
  copyIlanLink(i.id);
});

// =============== MODALLAR ===============
function openModal(id) {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.body.classList.add("modal-open");

  // History state ekle — geri tuşu sayfadan çıkmasın, modal'ı kapatsın.
  // Akıllı: zaten bir modal state varsa replace, yoksa push.
  try {
    const cur = history.state?.modal;
    if (cur === id) {
      // zaten doğru state, no-op
    } else if (cur) {
      // başka modal'dan geçiş — entry sayısı artmasın diye replace
      history.replaceState({ modal: id }, "", window.location.href);
    } else {
      // yeni modal açılışı — push (back tuşu kapatacak)
      history.pushState({ modal: id }, "", window.location.href);
    }
  } catch {}

  // İlk inputa odaklan (varsa)
  setTimeout(() => {
    const first = document.querySelector("#" + id + " input:not([type='hidden']):not([disabled]), #" + id + " select:not([disabled]), #" + id + " textarea:not([disabled])");
    if (first) first.focus();
  }, 50);
}
let _closingFromPopstate = false;
function closeModals() {
  const wasAnyModalOpen = !!document.querySelector(".modal:not(.hidden)");
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.body.classList.remove("modal-open");

  if (!wasAnyModalOpen) return;

  // History temizliği — modal state'i geri al
  if (!_closingFromPopstate && history.state?.modal) {
    // openModal'ın push'unu geri al → URL ve state baştaki haline döner
    history.back();
  }

  document.title = "İzinci Kurye — Ankara";
}

// Geri tuşu öncelik sırası: 1) Modal 2) Sidebar 3) Tab geçişi
window.addEventListener("popstate", () => {
  const anyModalOpen = !!document.querySelector(".modal:not(.hidden)");
  if (anyModalOpen) {
    _closingFromPopstate = true;
    closeModals();
    _closingFromPopstate = false;
    return;
  }
  const sidebarOpen = document.getElementById("sidebarDrawer")?.classList.contains("open");
  if (sidebarOpen) {
    _closingSidebarFromPopstate = true;
    closeSidebar();
    _closingSidebarFromPopstate = false;
    return;
  }
  // Sekme geçişi: state.tab varsa veya yoksa default'a dön
  const wantedTab = history.state?.tab || "ilanlar";
  if (typeof contentTab !== "undefined" && wantedTab !== contentTab) {
    _switchingTabFromPopstate = true;
    const btn = document.querySelector(`.content-tab[data-content-tab="${wantedTab}"]`);
    if (btn) btn.click();
    _switchingTabFromPopstate = false;
  }
});

// Esc tuşu açık modalı kapatır + kullanıcı menüsünü kapatır
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (document.querySelector(".modal:not(.hidden)")) closeModals();
    closeUserMenu();
    closeSidebar();
  }
});

// =============== SIDEBAR DRAWER (Hamburger) ===============
function openSidebar() {
  document.getElementById("sidebarDrawer")?.classList.add("open");
  document.getElementById("sidebarOverlay")?.classList.remove("hidden");
  document.getElementById("hamburgerBtn")?.setAttribute("aria-expanded", "true");
  document.body.classList.add("sidebar-open");
  // History state — geri tuşu sidebar'ı kapatır
  try {
    if (!history.state?.sidebar) {
      history.pushState({ sidebar: true }, "", window.location.href);
    }
  } catch {}
}
let _closingSidebarFromPopstate = false;
function closeSidebar() {
  // Görsel-only kapat. history.back ÇAĞRILMAZ — race önleme (v140):
  // Hamburger'da "İlan Ver" tıklanınca closeSidebar+openModal arka arkaya çağrılır.
  // history.back() popstate'i ASYNC fire ederken openModal pushState SYNC çalışır
  // → popstate handler modal AÇIKKEN tetiklenir → modal anında kapanır = bug.
  // Çözüm: closeSidebar history'ye dokunmasın. Yeni pushState (modal/diğer)
  // mevcut sidebar entry'sini overwrite eder; kullanıcı geri tuşuna basarsa
  // popstate handler DOM'a bakar, sidebar zaten kapalı → no-op.
  document.getElementById("sidebarDrawer")?.classList.remove("open");
  document.getElementById("sidebarOverlay")?.classList.add("hidden");
  document.getElementById("hamburgerBtn")?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("sidebar-open");
}
function toggleSidebar() {
  const open = document.getElementById("sidebarDrawer")?.classList.contains("open");
  if (open) closeSidebar(); else openSidebar();
}
document.getElementById("hamburgerBtn")?.addEventListener("click", toggleSidebar);
document.getElementById("sidebarCloseBtn")?.addEventListener("click", closeSidebar);
document.getElementById("sidebarOverlay")?.addEventListener("click", closeSidebar);
// İlan Ver tıklanınca drawer kapansın (modal açılacak)
document.getElementById("ilanVerBtn")?.addEventListener("click", closeSidebar);

// Sağ alt FAB: aynı işi yapsın (mevcut ilanVerBtn click handler'ını tetikle)
document.getElementById("fabIlanBtn")?.addEventListener("click", () => {
  document.getElementById("ilanVerBtn")?.click();
});

// Kullanıcı menüsü helper
function openUserMenu() {
  const m = document.querySelector(".user-menu");
  const t = document.querySelector(".user-menu-trigger");
  if (!m) return;
  m.classList.remove("hidden");
  t?.setAttribute("aria-expanded", "true");
}
function closeUserMenu() {
  const m = document.querySelector(".user-menu");
  const t = document.querySelector(".user-menu-trigger");
  if (!m) return;
  m.classList.add("hidden");
  t?.setAttribute("aria-expanded", "false");
}
// Menü dışına tıklama
document.addEventListener("click", (e) => {
  if (!e.target.closest(".user-menu-wrap")) closeUserMenu();
});
document.querySelectorAll("[data-close]").forEach(b =>
  b.addEventListener("click", closeModals)
);
document.querySelectorAll(".modal").forEach(m =>
  m.addEventListener("click", e => {
    if (e.target !== m) return;  // sadece backdrop click
    // Form içeren modal'ı kazara kapatma — veri kaybı önleme
    // Kullanıcı × butonu veya Esc ile bilinçli kapatabilir
    if (m.querySelector("form")) return;
    closeModals();
  })
);

document.getElementById("guestRegisterLink").addEventListener("click", e => {
  e.preventDefault(); openModal("registerModal");
});
document.getElementById("toRegister").addEventListener("click", e => {
  e.preventDefault(); openModal("registerModal");
});
document.getElementById("toLogin").addEventListener("click", e => {
  e.preventDefault(); openModal("loginModal");
});
document.getElementById("forgotPasswordLink").addEventListener("click", e => {
  e.preventDefault(); openModal("forgotEmailModal");
});

// Sözleşme/KVKK/Ticari ileti linkleri
document.querySelectorAll("[data-doc]").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    const doc = a.dataset.doc;
    const metinler = {
      sozlesme: "Üyelik Sözleşmesi (özet):\n\n• izincikurye.com'a üye olarak iletişim bilgilerinin sitede paylaşılmasını kabul edersin.\n• Doğru ve güncel bilgi vermek senin sorumluluğundur.\n• Yanıltıcı veya uygunsuz ilanlar kaldırılır.",
      kvkk: "KVKK Aydınlatma Metni (özet):\n\n• Kişisel verilerin (ad, e-posta, telefon) yalnız platformun çalışması için işlenir.\n• İletişim bilgilerin yalnız kayıtlı kullanıcılara gösterilir.",
      ticari: "Ticari Elektronik İleti İzni (özet):\n\n• İşaretlersen kampanya/duyuru e-postaları alabilirsin."
    };
    alert(metinler[doc] || "Metin yakında eklenecek.");
  });
});

// =============== KAYIT (Supabase Auth) ===============
function normalizeEmail(s) { return String(s || "").trim().toLowerCase(); }

// Hesap tipi seçimine göre işletme alanlarını göster/gizle
document.querySelectorAll('#registerForm input[name="kullanici_tipi"]').forEach(r => {
  r.addEventListener("change", () => {
    const isBiz = r.value === "isletme" && r.checked;
    const bf = document.getElementById("businessFields");
    if (bf) bf.classList.toggle("hidden", !isBiz);
    // Required toggle
    bf?.querySelectorAll('input[name="isletme_adi"], input[name="is_adresi"]').forEach(inp => {
      inp.required = isBiz;
    });
  });
});

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const kullanici_tipi = fd.get("kullanici_tipi");
  const ad = (fd.get("ad") || "").trim();
  const soyad = (fd.get("soyad") || "").trim();
  const email = normalizeEmail(fd.get("email"));
  const tel = (fd.get("tel") || "").trim();
  const sifre = fd.get("sifre") || "";
  const sifre2 = fd.get("sifre2") || "";
  const sozlesme = fd.get("sozlesme") === "on";
  const ticari = fd.get("ticari") === "on";

  const isletme_adi = (fd.get("isletme_adi") || "").trim();
  const is_adresi = (fd.get("is_adresi") || "").trim();
  const is_telefonu = (fd.get("is_telefonu") || "").trim();

  if (!kullanici_tipi) { toast("Önce hesap tipini seç (Kurye veya İşletme).", "error"); return; }
  if (!ad || !soyad || !email || !tel || !sifre) {
    toast("Lütfen tüm zorunlu alanları doldurun.", "error"); return;
  }
  if (!_isMobileTr(tel)) { toast("Cep telefonu numarası 5 ile başlamalı (örn. 0532...).", "error"); return; }
  if (kullanici_tipi === "isletme") {
    if (!isletme_adi) { toast("İşletme adı zorunludur.", "error"); return; }
    if (!is_adresi) { toast("İş adresi zorunludur.", "error"); return; }
    if (!is_telefonu) { toast("İş telefonu zorunludur.", "error"); return; }
    if (_telDigits(is_telefonu).length < 10) { toast("İş telefonu en az 10 hane olmalı.", "error"); return; }
  }
  if (sifre.length < 6) { toast("Şifre en az 6 karakter olmalı.", "error"); return; }
  if (sifre !== sifre2) { toast("Şifreler eşleşmiyor.", "error"); return; }
  if (!sozlesme) { toast("Üyelik sözleşmesi ve KVKK onayı zorunludur.", "error"); return; }

  // Tüm telefonları E.164 formatına (+90) çevir
  const telE164 = _phoneToE164(tel);
  const isTelE164 = is_telefonu ? _phoneToE164(is_telefonu) : "";

  const { error } = await rawSignUp(
    email,
    sifre,
    { ad, soyad, tel: telE164, ticari, kullanici_tipi, isletme_adi, is_adresi, is_telefonu: isTelE164 },
    window.location.origin + "/"
  );
  if (error) { toast("Kayıt hatası: " + error.message, "error"); return; }

  closeModals();
  e.target.reset();
  toast("Üyelik oluşturuldu. E-postanı kontrol et ve doğrulama linkine tıkla.", "ok", 6000);
});

// Kayıt + profil + ilan telefon input'larına canlı +90 format
function _bindPhoneInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", e => { e.target.value = formatTel(e.target.value); });
  el.addEventListener("focus", e => {
    if (!e.target.value || e.target.value === "") e.target.value = "+90 ";
  });
  el.addEventListener("blur", e => {
    if (e.target.value === "+90 " || e.target.value === "+90") e.target.value = "";
  });
}
["regTel", "regIsTel", "profileTel", "profileIsTelefonu", "ilanIletisimTel"].forEach(_bindPhoneInput);

// =============== GİRİŞ ===============
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = normalizeEmail(fd.get("email"));
  const sifre = fd.get("sifre") || "";
  const hatirla = fd.get("hatirla") === "on";
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!email || !sifre) { toast("E-posta ve şifre gerekli.", "error"); return; }

  // "Beni hatırla" işaretliyse kalıcı; değilse sekme/tarayıcı kapanışında çıkış yapılır
  if (hatirla) localStorage.setItem("izk_remember", "1");
  else localStorage.setItem("izk_remember", "0");

  // Ham fetch ile giriş (supabase-js bypass — hang sorunu için)
  const orig = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Giriş yapılıyor...";

  const { error } = await rawSignIn(email, sifre);

  submitBtn.disabled = false;
  submitBtn.textContent = orig;

  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("not confirmed") || msg.includes("confirmation")) {
      toast("E-postanı henüz onaylamadın. Gelen kutunu kontrol et.", "error", 5000);
    } else if (msg.includes("invalid") || msg.includes("credentials") || msg.includes("password")) {
      toast("E-posta veya şifre hatalı.", "error");
    } else {
      toast("Giriş başarısız: " + error.message, "error");
    }
    return;
  }
  // Bu sekmede oturum AKTİF — sayfa navigasyonlarında çıkış tetiklenmesin
  try { sessionStorage.setItem("izk_session_active", "1"); } catch {}
  // Yeni oturum yüklensin diye sayfayı yenile (syncSession storage'dan token okuyacak)
  window.location.href = "/";
});

// =============== ŞİFREMİ UNUTTUM ===============
document.getElementById("forgotEmailForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = normalizeEmail(fd.get("email"));
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/"
  });
  if (error) { toast("Hata: " + error.message, "error"); return; }
  e.target.reset();
  closeModals();
  toast("Sıfırlama bağlantısı e-postana gönderildi.", "ok", 5000);
});

document.getElementById("forgotResetForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const sifre = fd.get("sifre") || "";
  const sifre2 = fd.get("sifre2") || "";
  if (sifre.length < 6) { toast("Şifre en az 6 karakter olmalı.", "error"); return; }
  if (sifre !== sifre2) { toast("Şifreler eşleşmiyor.", "error"); return; }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    toast("Oturum bulunamadı. E-postandaki sıfırlama linkine yeniden tıkla.", "error", 6000);
    return;
  }

  const { error } = await sb.auth.updateUser({ password: sifre });
  if (error) {
    toast("Hata: " + error.message, "error");
    return;
  }
  e.target.reset();
  closeModals();
  toast("Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.", "ok", 5000);
});

// =============== İLAN VER ===============
const ilanVerBtn = document.getElementById("ilanVerBtn");
const saatRange = document.getElementById("saatRange");
const fiyatRange = document.getElementById("fiyatRange");
const kmRange = document.getElementById("kmRange");
const saatVal = document.getElementById("saatVal"); // mevcut değilse null
const fiyatVal = document.getElementById("fiyatVal");
const kmVal = document.getElementById("kmVal");
const sureOzetiEl = document.getElementById("sureOzeti");

fiyatRange.addEventListener("input", () => fiyatVal.textContent = fiyatRange.value);
kmRange.addEventListener("input", () => kmVal.textContent = kmRange.value);

// bas/bit saatten toplam saati hesapla (gece geçişi destekli)
function calcSureSaat(bas, bit) {
  const bh = parseInt((bas || "0").split(":")[0], 10);
  const eh = parseInt((bit || "0").split(":")[0], 10);
  if (isNaN(bh) || isNaN(eh) || bh === eh) return 0;
  return (eh - bh + 24) % 24;
}
function _updateSureOzeti() {
  const sure = calcSureSaat(basSaat.value, bitSaat.value);
  saatRange.value = sure;
  const fiyat = parseInt(fiyatRange.value, 10) || 0;
  const tahmini = sure * fiyat;
  if (sureOzetiEl) {
    sureOzetiEl.innerHTML = sure > 0
      ? `⏱ <strong>${sure} saat</strong> · Tahmini kazanç: <strong>${tahmini.toLocaleString("tr-TR")} ₺</strong> (KM ücreti hariç)`
      : `⚠ Başlangıç ve bitiş saati aynı olamaz.`;
  }
}
[basSaat, bitSaat, fiyatRange].forEach(el => el?.addEventListener("input", _updateSureOzeti));
// İlk yüklemede de güncelle
setTimeout(_updateSureOzeti, 0);

ilanVerBtn.addEventListener("click", () => {
  if (!currentUser) {
    toast("İlan vermek için önce kayıt ol.", "error");
    openModal("registerModal");
    return;
  }

  // Açık başka bir modal varsa görsel-only kapat (history race önle, v140).
  // Profilim modalı açıkken FAB ilan ver tıklanırsa iki modal üst üste açık olur;
  // ayrıca history.back/pushState sırası popstate-modal-kapatma bug'ı doğurur.
  // closeModals() yerine sadece DOM'dan hidden — yeni pushState (openModal aşağıda)
  // mevcut state'i overwrite eder.
  document.querySelectorAll(".modal:not(.hidden)").forEach(m => m.classList.add("hidden"));
  document.body.classList.remove("modal-open");

  // Yeni ilan: edit modunu reset et
  resetIlanFormMode();
  document.querySelectorAll("#ilanForm input[name=etiketler]").forEach(c => { c.checked = false; });

  // İşletme için kayıtlı bilgileri otomatik doldur
  const isyeriAd = document.getElementById("ilanIsyeriAd");
  const isyeriAdres = document.getElementById("ilanIsyeriAdres");
  const iletisimTel = document.getElementById("ilanIletisimTel");
  const adHint = document.getElementById("adEditHint");
  const adresHint = document.getElementById("adresEditHint");
  const telHint = document.getElementById("telEditHint");

  if (currentUser.kullaniciTipi === "isletme") {
    if (currentUser.isletmeAdi && !isyeriAd.value) {
      isyeriAd.value = currentUser.isletmeAdi;
      adHint?.classList.remove("hidden");
    }
    if (currentUser.isAdresi && !isyeriAdres.value) {
      isyeriAdres.value = currentUser.isAdresi;
      adresHint?.classList.remove("hidden");
    }
  } else {
    adHint?.classList.add("hidden");
    adresHint?.classList.add("hidden");
  }

  // Telefon: HER ZAMAN cep telefonu (currentUser.tel) — WhatsApp için
  // İşletmenin sabit hattı (is_telefonu) ilan iletişiminde kullanılmaz
  const kayitliTel = currentUser.tel || "";
  if (kayitliTel && !iletisimTel.value) {
    iletisimTel.value = formatTel(kayitliTel);
    telHint?.classList.remove("hidden");
  } else {
    telHint?.classList.add("hidden");
  }

  openModal("ilanModal");
});

// Düzenle linkleri — alanı temizle ve focus ver
document.getElementById("adEditBtn")?.addEventListener("click", e => {
  e.preventDefault();
  const inp = document.getElementById("ilanIsyeriAd");
  inp.value = "";
  inp.focus();
  document.getElementById("adEditHint").classList.add("hidden");
});
document.getElementById("adresEditBtn")?.addEventListener("click", e => {
  e.preventDefault();
  const inp = document.getElementById("ilanIsyeriAdres");
  inp.value = "";
  inp.focus();
  document.getElementById("adresEditHint").classList.add("hidden");
});
document.getElementById("telEditBtn")?.addEventListener("click", e => {
  e.preventDefault();
  const inp = document.getElementById("ilanIletisimTel");
  inp.value = "";
  inp.focus();
  document.getElementById("telEditHint").classList.add("hidden");
});

// (ilanIletisimTel live format _bindPhoneInput içinde)

document.getElementById("ilanForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;
  const fd = new FormData(e.target);

  const baslik = (fd.get("baslik") || "").trim();
  const ilce = fd.get("ilce");
  const isyeri_ad = (fd.get("isyeriAd") || "").trim();
  const isyeri_adres = (fd.get("isyeriAdres") || "").trim();
  const iletisim_tel_raw = (fd.get("iletisimTel") || "").trim();
  const iletisim_tel_digits = _telDigits(iletisim_tel_raw);
  const bas_saat = fd.get("basSaat");
  const bit_saat = fd.get("bitSaat");

  if (!baslik || !ilce || !isyeri_ad || !isyeri_adres || !iletisim_tel_raw) {
    toast("Lütfen tüm zorunlu alanları doldurun.", "error"); return;
  }
  if (iletisim_tel_digits.length < 10) {
    toast("İletişim telefonu en az 10 hane olmalı.", "error"); return;
  }
  if (!_isMobileTr(iletisim_tel_raw)) {
    toast("İletişim telefonu cep numarası olmalı (5 ile başlamalı). Sabit hat (312, 232, vb.) WhatsApp desteklemez.", "error", 6000); return;
  }
  // Kural onayı zorunlu
  if (!document.getElementById("ilanKurallarOnay")?.checked) {
    toast("Önce İlan Verme Kuralları'nı okuyup onaylamalısın.", "error", 5000);
    document.getElementById("ilanKurallarOnay")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  // İçerik filtresi — başlık ve açıklama için (v142, _validateIcerik)
  const baslikErr = _validateIcerik(baslik, "Başlık");
  if (baslikErr) {
    toast(baslikErr, "error", 6000);
    const el = document.querySelector('#ilanForm [name="baslik"]');
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return;
  }
  const aciklamaRaw = (fd.get("aciklama") || "").trim();
  const aciklamaErr = _validateIcerik(aciklamaRaw, "Açıklama");
  if (aciklamaErr) {
    toast(aciklamaErr, "error", 6000);
    const el = document.querySelector('#ilanForm [name="aciklama"]');
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
    return;
  }
  const iletisim_tel_e164 = _phoneToE164(iletisim_tel_raw);
  if (bas_saat === bit_saat) {
    toast("Başlangıç ve bitiş saati aynı olamaz.", "error"); return;
  }
  // Toplam saati otomatik hesapla (gece geçişi destekli)
  const calcSaat = calcSureSaat(bas_saat, bit_saat);
  if (calcSaat <= 0) {
    toast("Geçersiz saat aralığı.", "error"); return;
  }
  saatRange.value = calcSaat;

  // Seçili etiketler
  const etiketler = Array.from(
    document.querySelectorAll("#ilanForm input[name=etiketler]:checked")
  ).map(c => c.value);

  const payload = {
    baslik,
    ilce,
    saat: calcSaat,
    fiyat: parseInt(fd.get("fiyat"), 10),
    km: parseInt(fd.get("km"), 10),
    bas_saat,
    bit_saat,
    aciklama: (fd.get("aciklama") || "").trim() || null,
    isyeri_ad,
    isyeri_adres,
    iletisim_tel: iletisim_tel_e164,
    etiketler
  };

  let opError = null;
  if (_editingIlanId) {
    // UPDATE modu
    const session = readStoredSession();
    if (!session?.access_token) { toast("Oturum geçersiz", "error"); return; }
    try {
      const url = `${SUPABASE_URL}/rest/v1/ilanlar?id=eq.${_editingIlanId}&user_id=eq.${currentUser.id}`;
      const r = await fetch(url, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + session.access_token,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });
      if (!r.ok) opError = { message: "HTTP " + r.status + " — " + (await r.text()) };
    } catch (e) { opError = { message: e.message || String(e) }; }
  } else {
    // INSERT modu — rawInsert bypass (sb.from takılma riski)
    const session = readStoredSession();
    if (!session?.access_token) {
      // Token expired/eksik → RLS başarısız olur. Önceden yakala.
      toast("Oturumun sona ermiş görünüyor. Lütfen tekrar giriş yap.", "error", 6000);
      setTimeout(() => openModal("loginModal"), 800);
      return;
    }
    console.log("[ilanInsert] user_id:", currentUser.id, "hasToken:", !!session.access_token);
    const { error } = await rawInsert(
      "ilanlar",
      { user_id: currentUser.id, ...payload },
      session.access_token
    );
    if (error) {
      console.error("[ilanInsert] error:", error);
      // RLS hatası ise muhtemelen token bozuk veya user_id mismatch
      if (error.message?.includes("row-level security") || error.message?.includes("RLS")) {
        toast("Oturum doğrulanamadı. Lütfen çıkış yapıp tekrar giriş yap.", "error", 6000);
        opError = error;
      } else {
        opError = error;
      }
    } else {
      opError = null;
    }
  }

  if (opError) {
    if (opError.message?.includes("GUNLUK_ILAN_LIMITI")) {
      toast("Günlük ilan limitine ulaştın (24 saatte max 5). Yarın tekrar dene.", "error", 6000);
    } else {
      toast((_editingIlanId ? "Güncellenemedi: " : "İlan eklenemedi: ") + opError.message, "error");
    }
    return;
  }

  const wasEditing = !!_editingIlanId;
  closeModals();
  e.target.reset();
  resetIlanFormMode();
  saatRange.value = 4;
  fiyatRange.value = 280; fiyatVal.textContent = "280";
  kmRange.value = 8; kmVal.textContent = "8";
  basSaat.value = "09:00"; bitSaat.value = "18:00";
  _updateSureOzeti();
  document.getElementById("ilanIletisimTel").value = "";
  document.getElementById("telEditHint")?.classList.add("hidden");
  await loadIlanlar();
  toast(wasEditing ? "İlanın güncellendi" : "İlanın yayınlandı", "ok");
});

// =============== YARDIMCI ===============

// İlan başlık/açıklama içerik filtresi (v142)
// Kötüye kullanım önleme — kütüphanesiz, client-side guard rail.
// Yakalama hedefi: telefon, e-posta, URL/link, yaygın Türkçe küfür.
// Bypass kolay (boşluklu numara, eğri harf vs.) — ana güvence değil,
// kurallar onayı + şikayet sistemi + reaktif moderasyon ile birlikte çalışır.
function _validateIcerik(text, alanAdi = "Metin") {
  if (!text) return null;
  const t = text.toString();

  // Telefon: tüm boşluk/tire/parantez/nokta temizlenince 10+ ardışık rakam
  const tDigits = t.replace(/[\s\-\(\)\.\/]/g, "");
  if (/\d{10,}/.test(tDigits)) {
    return `${alanAdi} bölümüne telefon numarası yazılamaz — İletişim Cep Telefonu alanını kullan.`;
  }

  // E-posta
  if (/[\w.+-]+@[\w-]+\.\w{2,}/.test(t)) {
    return `${alanAdi} bölümüne e-posta yazılamaz — kuryeler buraya ulaşmamalı.`;
  }

  // URL/link — açık link veya yaygın TLD
  if (/(https?:\/\/|www\.)/i.test(t) ||
      /\.(com|net|org|info|io|tr|co|me|biz|app|dev|xyz)(\b|\/)/i.test(t)) {
    return `${alanAdi} bölümüne web bağlantısı yazılamaz.`;
  }

  // Küfür/hakaret — iki katmanlı:
  // (a) substring güvenli: uzun/açık kelimeler, false positive yok
  // (b) word-boundary: kısa kelimeler "götür", "amaca" gibi içermeli yakalanmasın
  const tLower = t.toLocaleLowerCase("tr");
  const kufurSubstrings = [
    "amına", "amına koy", "ananı sik", "anasını sik",
    "orospu", "piç", "siktir", "sikim", "sikiyim", "yarrak", "yarak", "dalyarak",
    "götlek", "godoş", "godos", "ibne", "iibne", "kahpe", "kaltak", "yarrağım"
  ];
  for (const k of kufurSubstrings) {
    if (tLower.includes(k)) {
      return `${alanAdi} bölümünde uygunsuz ifade tespit edildi — lütfen nazik bir dil kullan.`;
    }
  }
  // Kısa kelimeler word-boundary ile (Türkçe harfler için ASCII \b kullanılmıyor — manuel sınır)
  const kufurStandalone = /(?:^|[^a-zçğıöşüâîû0-9])(?:amk|göt|got|ibn(?:e|i)?)(?=[^a-zçğıöşüâîû0-9]|$)/i;
  if (kufurStandalone.test(tLower)) {
    return `${alanAdi} bölümünde uygunsuz ifade tespit edildi — lütfen nazik bir dil kullan.`;
  }

  return null;  // temiz
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
  );
}
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const tarih = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  const saat = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `${tarih} · ${saat}`;
}

// İlan "ne kadar süredir aktif" — ileri sayan canlı sayaç
function formatAktifSure(createdIso) {
  if (!createdIso) return "";
  const elapsedMs = Date.now() - new Date(createdIso).getTime();
  if (elapsedMs < 0) return "az önce eklendi";
  const totalSec = Math.floor(elapsedMs / 1000);
  const sn = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const dk = totalMin % 60;
  const saat = Math.floor(totalMin / 60);
  if (saat > 0) return `${saat} saat ${dk} dakikadır aktif`;
  if (totalMin > 0) return `${dk} dakika ${sn} saniyedir aktif`;
  return `${sn} saniyedir aktif`;
}

// Tüm görünür sayaçları güncelle
function _updateAktifSayaclar() {
  document.querySelectorAll(".ilan-aktif-sayac").forEach(el => {
    const c = el.dataset.created;
    if (c) el.textContent = formatAktifSure(c);
  });
}
// Saniyede bir tüm sayaçları yenile (visibility kontrolü ile pil tasarrufu)
setInterval(() => {
  if (document.visibilityState === "visible") _updateAktifSayaclar();
}, 1000);

// İlan kalan süre — 24 saatlik yayın (urgent flag için hâlâ kullanılıyor)
function formatRemaining(expIso) {
  if (!expIso) return { text: "", urgent: false };
  const ms = new Date(expIso).getTime() - Date.now();
  if (ms <= 0) return { text: "Süresi dolmuş", urgent: true };
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const urgent = totalMin <= 60;
  if (h >= 1) return { text: `${h} sa ${m} dk kaldı`, urgent };
  return { text: `${m} dk kaldı`, urgent };
}

districtSelect.addEventListener("change", loadIlanlar);

// =============== FİLTRELER (client-side) ===============
document.getElementById("saatFilter")?.addEventListener("change", e => {
  currentFilters.saat = e.target.value;
  renderListings();
});
document.getElementById("fiyatFilter")?.addEventListener("change", e => {
  currentFilters.fiyat = e.target.value;
  renderListings();
});
document.getElementById("sortFilter")?.addEventListener("change", e => {
  currentFilters.sort = e.target.value;
  renderListings();
});
document.getElementById("urgentOnly")?.addEventListener("change", e => {
  currentFilters.urgentOnly = e.target.checked;
  renderListings();
});
document.getElementById("filterResetBtn")?.addEventListener("click", () => {
  currentFilters = { saat: "all", fiyat: "all", sort: "smart", urgentOnly: false };
  document.getElementById("saatFilter").value = "all";
  document.getElementById("fiyatFilter").value = "all";
  document.getElementById("sortFilter").value = "smart";
  document.getElementById("urgentOnly").checked = false;
  if (districtSelect.value !== "all") {
    districtSelect.value = "all";
    loadIlanlar();
  } else {
    renderListings();
  }
});

// =============== İLANLARIM TOGGLE ===============
// Listing scope helper — sidebar segment + banner butonu aynı yere bağlı
async function _setListingScope(newScope) {
  if (newScope === listingScope) return;
  listingScope = newScope;
  // Sidebar seg butonlarını senkronla
  document.querySelectorAll("#myListingsPanel .seg-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.scope === newScope);
  });
  // Banner: "mine" modunda + "Aktif İlanlar" sekmesinde göster
  _updateIlanlarimBanner();
  await loadIlanlar();
}

function _updateIlanlarimBanner() {
  const banner = document.getElementById("ilanlarimBanner");
  if (!banner) return;
  const shouldShow = listingScope === "mine" && contentTab === "ilanlar";
  banner.classList.toggle("hidden", !shouldShow);
}

document.querySelectorAll("#myListingsPanel .seg-btn").forEach(btn => {
  btn.addEventListener("click", () => _setListingScope(btn.dataset.scope));
});

// Banner "Tüm İlanlar →" butonu
document.getElementById("ilanlarimBannerBack")?.addEventListener("click", () => {
  _setListingScope("all");
});

// =============== PROFİLİM YARDIMCILARI ===============
function setStatus(elId, type, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (!msg) { el.classList.add("hidden"); return; }
  el.className = "form-status " + type;
  el.textContent = msg;
}
function clearStatus(elId) { setStatus(elId, "", ""); }

function setBusy(btnId, busy, busyText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (busy) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = busyText || "Kaydediliyor...";
    btn.disabled = true;
  } else {
    if (btn.dataset.originalText) btn.textContent = btn.dataset.originalText;
    btn.disabled = false;
  }
}

// Telefon otomatik formatla: 05XX XXX XX XX
// Telefon canlı format: çıktı her zaman "+90 XXX XXX XX XX"
// Girişte 0 veya 90 prefix'i kırpılır, son 10 hane formatlanır.
function formatTel(raw) {
  if (!raw) return "";
  let d = (raw || "").replace(/\D/g, "");
  // Her zaman baştaki '90' veya '0' prefix'lerini kaldır
  // (TR cep numarası 5 ile başlar; 90 her zaman ülke kodu, 0 her zaman ulusal prefix)
  // Önceki kod 'length >= 12' kontrolüyle sadece tam E.164 yapıştırmasında striplerdi —
  // ama focus handler '+90 ' pre-fill ediyor + kullanıcı 1 hane yazınca '905' oluyor
  // → length 3 → strip yapılmıyor → bug: '+90 905' (kullanıcı düzeltemiyor).
  if (d.startsWith("90")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  d = d.slice(0, 10);
  if (!d) return "+90 ";
  if (d.length <= 3) return "+90 " + d;
  if (d.length <= 6) return "+90 " + d.slice(0, 3) + " " + d.slice(3);
  if (d.length <= 8) return "+90 " + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6);
  return "+90 " + d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6, 8) + " " + d.slice(8);
}

function _telDigits(s) { return (s || "").replace(/\D/g, ""); }

// Telefonu E.164 formatına çevir (+905XXXXXXXXX)
// 10 hane "5321234567" → "+905321234567"
// 11 hane "05321234567" → "+905321234567"
// 12 hane "905321234567" → "+905321234567"
// 13 hane "+905321234567" → "+905321234567"
function _phoneToE164(raw) {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 10) return "+90" + d;
  if (d.length === 11 && d.startsWith("0")) return "+90" + d.slice(1);
  if (d.length === 12 && d.startsWith("90")) return "+" + d;
  if (d.length === 13 && d.startsWith("90")) return "+" + d.slice(0, 12);
  return "+" + d;
}

// Cep telefonu mu? (Türkiye: son 10 hanenin ilki 5)
function _isMobileTr(raw) {
  const d = (raw || "").replace(/\D/g, "");
  const last10 = d.slice(-10);
  return last10.length === 10 && last10.startsWith("5");
}

// Görsel format: "+905321234567" → "+90 532 123 45 67"
function _displayPhone(raw) {
  const e = _phoneToE164(raw);
  if (!e || e.length < 13) {
    // E.164'e çevrilemediyse eski formatlı göster
    return formatTel(raw);
  }
  return e.slice(0, 3) + " " + e.slice(3, 6) + " " + e.slice(6, 9) + " " + e.slice(9, 11) + " " + e.slice(11);
}

function _readProfileForm() {
  const bildirimler = {
    yeni_ilan: !!document.getElementById("bildirYeniIlan")?.checked,
    ilanim_goruldu: !!document.getElementById("bildirIlanimGoruldu")?.checked,
    kampanya: !!document.getElementById("bildirKampanya")?.checked
  };
  return {
    ad: document.getElementById("profileAd").value.trim(),
    soyad: document.getElementById("profileSoyad").value.trim(),
    email: normalizeEmail(document.getElementById("profileEmail").value),
    tel: document.getElementById("profileTel").value.trim(),
    bio: document.getElementById("profileBio")?.value.trim() || "",
    ticari: !!document.getElementById("bildirKampanya")?.checked,
    bildirimler,
    isletme_adi: document.getElementById("profileIsletmeAdi")?.value.trim() || "",
    isletme_tipi: document.getElementById("profileIsletmeTipi")?.value || "",
    is_telefonu: document.getElementById("profileIsTelefonu")?.value.trim() || "",
    is_adresi: document.getElementById("profileIsAdresi")?.value.trim() || "",
    // Kurye alanları
    arac_tipi: document.getElementById("profileAracTipi")?.value || "",
    arac_marka_model: document.getElementById("profileAracMarkaModel")?.value.trim() || "",
    tercih_ilceler: document.getElementById("profileTumBolgeler")?.checked
      ? []
      : Array.from(document.querySelectorAll("#profileTercihIlceler .ilce-chip.active")).map(c => c.dataset.ilce),
    calisma_gunleri: Array.from(document.querySelectorAll("#profileGunler .day-chip.active")).map(c => parseInt(c.dataset.day, 10)).filter(n => !Number.isNaN(n)),
    calisma_baslangic: (() => { const v = document.getElementById("profileCalismaBaslangic")?.value; return v === "" || v == null ? null : parseInt(v, 10); })(),
    calisma_bitis: (() => { const v = document.getElementById("profileCalismaBitis")?.value; return v === "" || v == null ? null : parseInt(v, 10); })(),
    min_ucret: (() => { const v = document.getElementById("profileMinUcret")?.value; return v === "" || v == null ? null : parseInt(v, 10); })(),
    max_ucret: (() => { const v = document.getElementById("profileMaxUcret")?.value; return v === "" || v == null ? null : parseInt(v, 10); })()
  };
}

function profileHasChanges() {
  if (!currentUser) return false;
  const f = _readProfileForm();
  if (f.ad !== currentUser.ad) return true;
  if (f.soyad !== currentUser.soyad) return true;
  if (f.email !== normalizeEmail(currentUser.email)) return true;
  if (_telDigits(f.tel) !== _telDigits(currentUser.tel)) return true;
  if (f.bio !== (currentUser.bio || "")) return true;
  if (JSON.stringify(f.bildirimler) !== JSON.stringify(currentUser.bildirimler || {})) return true;
  if (f.isletme_adi !== (currentUser.isletmeAdi || "")) return true;
  if (f.isletme_tipi !== (currentUser.isletmeTipi || "")) return true;
  if (_telDigits(f.is_telefonu) !== _telDigits(currentUser.isTelefonu || "")) return true;
  if (f.is_adresi !== (currentUser.isAdresi || "")) return true;
  // Kurye alanları
  if (f.arac_tipi !== (currentUser.aracTipi || "")) return true;
  if (f.arac_marka_model !== (currentUser.aracMarkaModel || "")) return true;
  if (JSON.stringify([...f.tercih_ilceler].sort()) !== JSON.stringify([...(currentUser.tercihIlceler || [])].sort())) return true;
  if (JSON.stringify([...f.calisma_gunleri].sort()) !== JSON.stringify([...(currentUser.calismaGunleri || [])].sort())) return true;
  if (f.calisma_baslangic !== (currentUser.calismaBaslangic ?? null)) return true;
  if (f.calisma_bitis !== (currentUser.calismaBitis ?? null)) return true;
  if (f.min_ucret !== (currentUser.minUcret ?? null)) return true;
  if (f.max_ucret !== (currentUser.maxUcret ?? null)) return true;
  return false;
}

function refreshProfileSaveBtn() {
  const btn = document.getElementById("profileSaveBtn");
  if (btn) btn.disabled = !profileHasChanges();
}

// =============== PROFİL: tercih ilçeler (chip) + saat select doldur (bir kerelik) ===============
(() => {
  const ip = document.getElementById("profileTercihIlceler");
  if (ip) {
    ANKARA_ILCELERI.forEach(ilce => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ilce-chip";
      chip.dataset.ilce = ilce;
      chip.textContent = ilce;
      chip.addEventListener("click", () => {
        if (document.getElementById("profileTumBolgeler")?.checked) return; // "her bölge" açıkken pasif
        chip.classList.toggle("active");
        refreshProfileSaveBtn();
        clearStatus("profileStatus");
      });
      ip.appendChild(chip);
    });
  }
  const cb = document.getElementById("profileCalismaBaslangic");
  const cbit = document.getElementById("profileCalismaBitis");
  for (let h = 0; h < 24; h++) {
    const lbl = String(h).padStart(2, "0") + ":00";
    if (cb) cb.appendChild(new Option(lbl, h));
    if (cbit) cbit.appendChild(new Option(lbl, h));
  }
})();

// "Her bölgede çalışabilirim" toggle — açıkken tüm chip'leri devre dışı bırak
document.getElementById("profileTumBolgeler")?.addEventListener("change", (e) => {
  const isAll = e.target.checked;
  document.querySelectorAll("#profileTercihIlceler .ilce-chip").forEach(chip => {
    chip.classList.toggle("disabled", isAll);
    if (isAll) chip.classList.remove("active");
  });
  refreshProfileSaveBtn();
  clearStatus("profileStatus");
});

// Day chip toggle
document.querySelectorAll("#profileGunler .day-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    chip.classList.toggle("active");
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
});

// Bio character counter
const _bioEl = document.getElementById("profileBio");
const _bioCntEl = document.getElementById("bioCount");
if (_bioEl && _bioCntEl) {
  _bioEl.addEventListener("input", () => {
    _bioCntEl.textContent = _bioEl.value.length;
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
}

// Tercih ilçeler chip değişimleri zaten her chip'in click handler'ında refreshProfileSaveBtn çağırıyor
["profileCalismaBaslangic","profileCalismaBitis","profileMinUcret","profileMaxUcret","profileAracTipi","profileAracMarkaModel"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", () => {
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
  document.getElementById(id)?.addEventListener("input", () => {
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
});

// Bildirim toggle'ları
["bildirYeniIlan","bildirIlanimGoruldu","bildirKampanya"].forEach(id => {
  document.getElementById(id)?.addEventListener("change", (e) => {
    // Kampanya toggle = ticari kabul (eski alan)
    if (id === "bildirKampanya") {
      document.getElementById("profileTicari").value = e.target.checked ? "on" : "";
    }
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
});

// =============== PROFİL SEKMELERİ ===============
function switchProfileTab(name) {
  document.querySelectorAll("#profileModal .tab-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === name);
  });
  // Form-dışı paneller (genel, guvenlik)
  document.querySelectorAll("#profileModal [data-tab-panel]").forEach(p => {
    p.classList.toggle("hidden", p.dataset.tabPanel !== name);
  });
  // Form içi bölümler (profil, isletme, bildirim)
  const showForm = (name === "profil" || name === "isletme" || name === "bildirim");
  document.querySelectorAll("#profileModal [data-tab-section]").forEach(s => {
    s.classList.toggle("hidden", s.dataset.tabSection !== name);
  });
  document.getElementById("profileForm").classList.toggle("hidden", !showForm);
  document.getElementById("profileSaveBtn").classList.toggle("hidden", !showForm);
}

function computeProfileCompletion() {
  if (!currentUser) return 0;
  const base = [
    !!(currentUser.ad && currentUser.ad.trim()),
    !!(currentUser.soyad && currentUser.soyad.trim()),
    !!(currentUser.email && currentUser.email.trim()),
    !!(_telDigits(currentUser.tel).length >= 10),
    !!currentUser.avatarUrl,
    !!(currentUser.bio && currentUser.bio.trim())
  ];
  let extra = [];
  if (currentUser.kullaniciTipi === "isletme") {
    extra = [
      !!(currentUser.isletmeAdi && currentUser.isletmeAdi.trim()),
      !!(currentUser.isletmeTipi && currentUser.isletmeTipi.trim()),
      !!(_telDigits(currentUser.isTelefonu).length >= 10),
      !!(currentUser.isAdresi && currentUser.isAdresi.trim())
    ];
  }
  const all = base.concat(extra);
  const filled = all.filter(Boolean).length;
  return Math.round((filled / all.length) * 100);
}

function refreshCompletion() {
  const pct = computeProfileCompletion();
  const fill = document.getElementById("completionFill");
  const txt = document.getElementById("completionPct");
  if (fill) fill.style.width = pct + "%";
  if (txt) txt.textContent = pct;
}

// Sekme buton click listener'ları
document.querySelectorAll("#profileModal .tab-btn").forEach(btn => {
  btn.addEventListener("click", () => switchProfileTab(btn.dataset.tab));
});

// =============== PAKET 4: Son giriş + veri indir ===============
async function loadLastSignIn() {
  const el = document.getElementById("lastSignInInfo");
  if (!el) return;
  try {
    const { data } = await sb.auth.getUser();
    const last = data?.user?.last_sign_in_at;
    el.textContent = "Son giriş: " + (last ? formatDateTime(last) : "—");
  } catch {
    el.textContent = "Son giriş: —";
  }
}

document.getElementById("downloadDataBtn")?.addEventListener("click", async () => {
  if (!currentUser) return;
  toast("Verilerin hazırlanıyor...", "info", 1500);
  // Raw fetch bypass — sb.from lock takılma riski (CLAUDE.md tuzak #48)
  const session = readStoredSession();
  const [{ data: profArr }, { data: ilanArr }] = await Promise.all([
    rawSelect(`profiles?id=eq.${currentUser.id}&select=*&limit=1`, session?.access_token, 6000),
    rawSelect(`ilanlar?user_id=eq.${currentUser.id}&select=*`, session?.access_token, 6000)
  ]);
  const profil = Array.isArray(profArr) && profArr.length ? profArr[0] : null;
  const payload = {
    indirilme_tarihi: new Date().toISOString(),
    kullanici: { id: currentUser.id, email: currentUser.email },
    profil: profil || {},
    ilanlar: ilanArr || []
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const tarih = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `izincikurye-verilerim-${tarih}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Verilerin indirildi", "ok");
});

async function loadProfileStats() {
  if (!currentUser) return;
  const isIsletme = currentUser.kullaniciTipi === "isletme";
  const isKurye = currentUser.kullaniciTipi === "kurye";
  const session = readStoredSession();

  // ============ HERO ============
  const nameEl = document.getElementById("pfName");
  const ratingEl = document.getElementById("pfRating");
  const metaEl = document.getElementById("pfMeta");
  const verifiedEl = document.getElementById("pfVerified");

  // Ad — işletme için işletme adı (varsa), yoksa kişi adı
  const fullName = isIsletme && currentUser.isletmeAdi
    ? currentUser.isletmeAdi
    : ((currentUser.ad || "") + " " + (currentUser.soyad || "")).trim() || "Kullanıcı";
  if (nameEl) nameEl.textContent = fullName;

  // Puan rozeti — sadece kuryede ve yorumu varsa
  if (ratingEl) {
    // currentUser'da puan_ort yok — rawSelect ile çek (sadece kurye için)
    ratingEl.classList.add("hidden");
    if (isKurye) {
      const { data: pArr } = await rawSelect(
        `profiles?id=eq.${currentUser.id}&select=puan_ort,puan_sayisi`,
        session?.access_token, 5000
      );
      const p = (pArr || [])[0];
      if (p?.puan_sayisi > 0) {
        ratingEl.textContent = `★ ${Number(p.puan_ort).toFixed(1)} · ${p.puan_sayisi} yorum`;
        ratingEl.classList.remove("hidden");
      }
    }
  }

  // Üyelik + tip
  if (metaEl) {
    const days = currentUser.createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(currentUser.createdAt).getTime()) / 86400000))
      : 0;
    let membership = "Yeni üye";
    if (days >= 365) membership = `Üye ${Math.floor(days/365)} yıl`;
    else if (days >= 30) membership = `Üye ${Math.floor(days/30)} ay`;
    else if (days > 0) membership = `Üye ${days} gün`;
    metaEl.textContent = membership;
  }

  // Doğrulama rozetleri
  if (verifiedEl) {
    const pills = [];
    if (isIsletme) pills.push(`<span class="pf-verified-pill pill-type">🏪 İşletme</span>`);
    else if (isKurye) pills.push(`<span class="pf-verified-pill pill-type">🏍 Kurye</span>`);
    pills.push(`<span class="pf-verified-pill">✓ E-posta</span>`);
    if (_telDigits(currentUser.tel).length >= 10) pills.push(`<span class="pf-verified-pill">✓ Telefon</span>`);
    else pills.push(`<span class="pf-verified-pill pill-warn">! Telefon</span>`);
    verifiedEl.innerHTML = pills.join("");
  }

  // ============ KPI ============
  // KPI 1 — Aktif İlan sayısı (expires_at > now) — raw bypass
  let aktifIlan = 0;
  try {
    const session = readStoredSession();
    const nowIso = new Date().toISOString();
    const { data } = await rawSelect(
      `ilanlar?user_id=eq.${currentUser.id}&expires_at=gt.${encodeURIComponent(nowIso)}&select=id`,
      session?.access_token,
      4000
    );
    aktifIlan = Array.isArray(data) ? data.length : 0;
  } catch (e) { console.warn("[kpi aktif ilan]", e); }

  // KPI 2 — bekleyen yorum (işletme) veya aldığım yorum (kurye)
  let bekleyen = 0;
  let bekleyenLbl = "Bekleyen ⭐";
  if (isIsletme) {
    const { data } = await rawSelect(
      `yorum_haklari?isletme_id=eq.${currentUser.id}&kullanildi=eq.false&select=id`,
      session?.access_token, 5000
    );
    bekleyen = (data || []).length;
  } else if (isKurye) {
    const { data: pArr } = await rawSelect(
      `profiles?id=eq.${currentUser.id}&select=puan_sayisi`,
      session?.access_token, 5000
    );
    bekleyen = (pArr || [])[0]?.puan_sayisi || 0;
    bekleyenLbl = "Aldığım Yorum";
  } else {
    bekleyenLbl = "—";
  }

  const k1n = document.getElementById("pfKpi1Num");
  const k2n = document.getElementById("pfKpi2Num");
  const k3n = document.getElementById("pfKpi3Num");
  const k2l = document.getElementById("pfKpi2Lbl");
  if (k1n) { k1n.textContent = aktifIlan; k1n.classList.toggle("num-zero", aktifIlan === 0); }
  if (k2n) { k2n.textContent = bekleyen; k2n.classList.toggle("num-highlight", bekleyen > 0 && isIsletme); k2n.classList.toggle("num-zero", bekleyen === 0); }
  if (k2l) k2l.textContent = bekleyenLbl;
  const pct = computeProfileCompletion();
  if (k3n) { k3n.textContent = pct + "%"; k3n.classList.toggle("num-zero", pct === 0); }

  // ============ SMART CARD ============
  renderSmartCard({ isIsletme, isKurye, aktifIlan, bekleyen, pct });

  // ============ TILE BADGES ============
  const ilanBadge = document.getElementById("pfTileIlanlarimBadge");
  if (ilanBadge) {
    ilanBadge.textContent = aktifIlan;
    ilanBadge.classList.toggle("hidden", aktifIlan === 0);
  }
  const yorumBadge = document.getElementById("pfTileYorumBadge");
  if (yorumBadge) {
    if (isIsletme) {
      yorumBadge.textContent = bekleyen;
      yorumBadge.classList.toggle("hidden", bekleyen === 0);
    } else {
      yorumBadge.classList.add("hidden");
    }
  }

  // ============ PROGRESS CHIP ============
  const fill = document.getElementById("pfProgressFill");
  const txt = document.getElementById("pfProgressText");
  if (fill) fill.style.width = pct + "%";
  if (txt) {
    if (pct >= 100) txt.textContent = "🎉 Profilin tam dolu — harika iş!";
    else txt.textContent = `Profil tamamlanma: %${pct} — daha iyi görünürlük için tamamla.`;
  }
}

// Smart card — duruma göre içerik üret
function renderSmartCard({ isIsletme, isKurye, aktifIlan, bekleyen, pct }) {
  const card = document.getElementById("pfSmartCard");
  const icon = document.getElementById("pfSmartIcon");
  const title = document.getElementById("pfSmartTitle");
  const text = document.getElementById("pfSmartText");
  const cta = document.getElementById("pfSmartCta");
  if (!card) return;

  card.classList.remove("tone-success", "tone-info");
  cta.classList.remove("hidden");
  cta.onclick = null;

  // Öncelik sırası: işletmenin bekleyen yorumu > eksik profil > aktif ilan yok > müsait değil (kurye) > her şey tamam
  if (isIsletme && bekleyen > 0) {
    icon.textContent = "⭐";
    title.textContent = `${bekleyen} kurye için yorum bekliyor`;
    text.textContent = "Anlaştığın kuryelere puan ver — itibarlarını sen inşa edeceksin.";
    cta.textContent = "Yorum Yaz →";
    cta.onclick = () => { closeModals(); openReviewListModal(); };
    return;
  }

  if (isIsletme && aktifIlan === 0) {
    icon.textContent = "✨";
    title.textContent = "İlk ilanını ver";
    text.textContent = "Kuryeler bekliyor — birkaç saniyede bir ilan yayınla, bölgendeki kuryelere bildirim git­sin.";
    cta.textContent = "+ İlan Ver";
    cta.onclick = () => { document.getElementById("ilanVerBtn")?.click(); };
    return;
  }

  if (isKurye && !currentUser.musait) {
    icon.textContent = "🟢";
    title.textContent = "Müsaitliğini aç";
    text.textContent = "Aşağıdaki anahtarı aç → işletmeler seni 'Müsait Kuryeler' listesinde görsün.";
    cta.classList.add("hidden");
    card.classList.add("tone-info");
    return;
  }

  if (pct < 80) {
    icon.textContent = "📝";
    title.textContent = "Profilin daha iyi olabilir";
    text.textContent = `%${pct} tamam. Birkaç alan daha doldurursan görünürlüğün artar.`;
    cta.textContent = "Profili Tamamla →";
    cta.onclick = () => switchProfileTab(isIsletme ? "isletme" : "profil");
    return;
  }

  // Her şey iyi
  icon.textContent = "🎉";
  title.textContent = "Her şey hazır";
  if (isIsletme) {
    text.textContent = `${aktifIlan} aktif ilanın var. Yeni ihtiyaç olunca tek tıkla yayınla.`;
  } else if (isKurye) {
    text.textContent = "Müsaitliğin aktif, profilin tam. İşletmeler seninle iletişime geçebilir.";
  } else {
    text.textContent = "Profilin tamamlanmış görünüyor.";
  }
  cta.textContent = "Yeni İlan Ver";
  cta.onclick = () => { document.getElementById("ilanVerBtn")?.click(); };
  card.classList.add("tone-success");
}

// =============== AVATAR ===============
function setAvatarPreview(url) {
  const prev = document.getElementById("avatarPreview");
  const removeBtn = document.getElementById("avatarRemoveBtn");
  if (!prev) return;
  if (url) {
    prev.style.backgroundImage = `url("${url}")`;
    prev.dataset.hasImage = "1";
    if (removeBtn) removeBtn.classList.remove("hidden");
  } else {
    prev.style.backgroundImage = "";
    delete prev.dataset.hasImage;
    if (removeBtn) removeBtn.classList.add("hidden");
  }
}

// =============== AVATAR KIRPMA (v139) ===============
// Akış: dosya seçimi → modal'da canvas üzerinde kaydır+zoom → kare 512x512
// JPEG olarak storage'a yükle. raw fetch ile profiles.avatar_url PATCH.
const _crop = {
  img: null,        // Image()
  scale: 1,         // zoom (1-3)
  offsetX: 0,
  offsetY: 0,
  dragging: false,
  startX: 0,
  startY: 0,
  baseScale: 1      // image'i canvas'a sığdıracak min ölçek (cover)
};

function _drawCrop() {
  const cv = document.getElementById("avatarCropCanvas");
  if (!cv || !_crop.img) return;
  const ctx = cv.getContext("2d");
  const W = cv.width, H = cv.height;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, H);
  const eff = _crop.baseScale * _crop.scale;
  const drawW = _crop.img.width * eff;
  const drawH = _crop.img.height * eff;
  // Pan limiti — image canvas'ı her zaman tamamen kaplasın (overlay dairesi içine boşluk girmesin)
  const maxX = Math.max(0, (drawW - W) / 2);
  const maxY = Math.max(0, (drawH - H) / 2);
  _crop.offsetX = Math.max(-maxX, Math.min(maxX, _crop.offsetX));
  _crop.offsetY = Math.max(-maxY, Math.min(maxY, _crop.offsetY));
  const dx = (W - drawW) / 2 + _crop.offsetX;
  const dy = (H - drawH) / 2 + _crop.offsetY;
  ctx.drawImage(_crop.img, dx, dy, drawW, drawH);
}

function _openAvatarCropModal(file) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      _crop.img = img;
      _crop.scale = 1;
      _crop.offsetX = 0;
      _crop.offsetY = 0;
      // cover: kısa kenar 320px'e tam otursun
      const cv = document.getElementById("avatarCropCanvas");
      _crop.baseScale = Math.max(cv.width / img.width, cv.height / img.height);
      const zoom = document.getElementById("avatarCropZoom");
      if (zoom) zoom.value = "1";
      openModal("avatarCropModal");
      _drawCrop();
    };
    img.onerror = () => toast("Görsel okunamadı", "error");
    img.src = ev.target.result;
  };
  reader.onerror = () => toast("Dosya okunamadı", "error");
  reader.readAsDataURL(file);
}

// Drag (pointer events — mouse + touch ortak)
(() => {
  const stage = document.getElementById("avatarCropStage");
  if (!stage) return;
  stage.addEventListener("pointerdown", e => {
    _crop.dragging = true;
    _crop.startX = e.clientX - _crop.offsetX;
    _crop.startY = e.clientY - _crop.offsetY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener("pointermove", e => {
    if (!_crop.dragging) return;
    _crop.offsetX = e.clientX - _crop.startX;
    _crop.offsetY = e.clientY - _crop.startY;
    _drawCrop();
  });
  const end = e => {
    _crop.dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch {}
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
})();

document.getElementById("avatarCropZoom")?.addEventListener("input", e => {
  _crop.scale = parseFloat(e.target.value) || 1;
  _drawCrop();
});

// Dosya seçimi → modal aç
document.getElementById("avatarFileInput").addEventListener("change", e => {
  if (!currentUser) return;
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("profileStatus", "error", "Sadece görsel dosyalar yüklenebilir.");
    e.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setStatus("profileStatus", "error", "Dosya 5 MB'dan büyük olamaz.");
    e.target.value = "";
    return;
  }
  clearStatus("profileStatus");
  _openAvatarCropModal(file);
  e.target.value = "";  // Aynı dosyayı tekrar seçebilmek için reset
});

// "Kullan" → kırpılmış 512x512 JPEG'i yükle
document.getElementById("avatarCropConfirm")?.addEventListener("click", async () => {
  if (!currentUser || !_crop.img) return;
  const btn = document.getElementById("avatarCropConfirm");
  if (btn) { btn.disabled = true; btn.textContent = "Yükleniyor..."; }

  // 512x512 output canvas — preview canvas içeriğini scale ile aynısı, daha yüksek çözünürlükte
  const OUT = 512;
  const cv = document.createElement("canvas");
  cv.width = OUT; cv.height = OUT;
  const ctx = cv.getContext("2d");
  const eff = _crop.baseScale * _crop.scale * (OUT / 320);  // preview 320 → 512 oran
  const drawW = _crop.img.width * eff;
  const drawH = _crop.img.height * eff;
  const dx = (OUT - drawW) / 2 + _crop.offsetX * (OUT / 320);
  const dy = (OUT - drawH) / 2 + _crop.offsetY * (OUT / 320);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, OUT, OUT);
  ctx.drawImage(_crop.img, dx, dy, drawW, drawH);

  const blob = await new Promise(res => cv.toBlob(res, "image/jpeg", 0.9));
  if (!blob) {
    toast("Görsel oluşturulamadı", "error");
    if (btn) { btn.disabled = false; btn.textContent = "Kullan"; }
    return;
  }

  const path = `${currentUser.id}/avatar.jpg`;
  const { error: upErr } = await sb.storage.from("avatars").upload(path, blob, {
    cacheControl: "3600", upsert: true, contentType: "image/jpeg"
  });
  if (upErr) {
    if (btn) { btn.disabled = false; btn.textContent = "Kullan"; }
    toast("Yükleme başarısız: " + upErr.message, "error");
    return;
  }
  const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
  const publicUrl = urlData.publicUrl + "?t=" + Date.now();

  // profiles.avatar_url — raw PATCH (sb.from bypass, tutarlılık)
  const session = readStoredSession();
  if (!session?.access_token) {
    if (btn) { btn.disabled = false; btn.textContent = "Kullan"; }
    toast("Oturumun sona ermiş, tekrar giriş yap.", "error");
    return;
  }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ avatar_url: publicUrl })
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " — " + (await r.text()));
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "Kullan"; }
    toast("Profil güncellenemedi: " + (e.message || e), "error");
    return;
  }

  currentUser.avatarUrl = publicUrl;
  setAvatarPreview(publicUrl);
  renderTopNav();
  refreshCompletion();
  closeModals();
  toast("Profil fotoğrafın güncellendi", "ok");
  if (btn) { btn.disabled = false; btn.textContent = "Kullan"; }
});

document.getElementById("avatarRemoveBtn").addEventListener("click", async () => {
  if (!currentUser || !currentUser.avatarUrl) return;
  if (!confirm("Profil fotoğrafını kaldırmak istediğine emin misin?")) return;

  // Storage'dan dosyaları sil (uzantı bilinmiyor olabilir; tüm avatar.* dosyalarını listele/sil)
  const { data: files } = await sb.storage.from("avatars").list(currentUser.id);
  if (files?.length) {
    const paths = files.map(f => `${currentUser.id}/${f.name}`);
    await sb.storage.from("avatars").remove(paths);
  }

  const { error: dbErr } = await sb.from("profiles")
    .update({ avatar_url: null })
    .eq("id", currentUser.id);
  if (dbErr) {
    setStatus("profileStatus", "error", "Profil güncellenemedi: " + dbErr.message);
    return;
  }

  currentUser.avatarUrl = "";
  setAvatarPreview("");
  renderTopNav();
  refreshCompletion();
  setStatus("profileStatus", "ok", "Profil fotoğrafın kaldırıldı.");
});

// =============== PROFİLİM ===============
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById("profileAd").value = currentUser.ad || "";
  document.getElementById("profileSoyad").value = currentUser.soyad || "";
  document.getElementById("profileEmail").value = currentUser.email || "";
  document.getElementById("profileTel").value = formatTel(currentUser.tel || "");
  document.getElementById("profileEmailHint").style.display = "none";
  document.getElementById("profileTelHint").style.display = "none";

  // Bio + character counter
  const bioEl = document.getElementById("profileBio");
  if (bioEl) {
    bioEl.value = currentUser.bio || "";
    document.getElementById("bioCount").textContent = bioEl.value.length;
  }

  // Bildirim toggle'ları
  const b = currentUser.bildirimler || {};
  document.getElementById("bildirYeniIlan").checked = b.yeni_ilan !== false;
  document.getElementById("bildirIlanimGoruldu").checked = b.ilanim_goruldu !== false;
  document.getElementById("bildirKampanya").checked = !!b.kampanya || !!currentUser.ticari;
  document.getElementById("profileTicari").value = (b.kampanya || currentUser.ticari) ? "on" : "";

  // Son giriş zamanı (Güvenlik sekmesi - Paket 4)
  loadLastSignIn();
  setAvatarPreview(currentUser.avatarUrl || "");

  // Müsaitlik (sadece kurye)
  const musaitSec = document.getElementById("musaitToggleSection");
  if (musaitSec) musaitSec.classList.toggle("hidden", currentUser.kullaniciTipi !== "kurye");
  const mt = document.getElementById("musaitToggle");
  const mTitle = document.getElementById("musaitTitle");
  if (mt) {
    mt.checked = !!currentUser.musait;
    if (mTitle) mTitle.textContent = mt.checked ? "🟢 Şu an müsaitim" : "🔴 Müsait değilim";
    document.getElementById("musaitCard")?.classList.toggle("active", mt.checked);
  }

  // İşletme sekmesi sadece kullanici_tipi='isletme' ise görünür
  const isIsletme = currentUser.kullaniciTipi === "isletme";
  document.getElementById("profileTabIsletme")?.classList.toggle("hidden", !isIsletme);

  // İşletme için "İletişim Kişisi" başlığını göster
  const isletmeHeader = document.getElementById("profileIsletmeHeader");
  if (isletmeHeader) isletmeHeader.style.display = isIsletme ? "block" : "none";

  // İşletme için Hakkımda gizle, İş Adresi göster (kurye için tersi)
  document.getElementById("profileBioWrap")?.classList.toggle("hidden", isIsletme);
  document.getElementById("profileIsletmeAdresWrap")?.classList.toggle("hidden", !isIsletme);

  // Kurye-only blok: göster + değerleri yükle
  const isKurye = currentUser.kullaniciTipi === "kurye";
  document.getElementById("profileKuryeWrap")?.classList.toggle("hidden", !isKurye);
  if (isKurye) {
    document.getElementById("profileAracTipi").value = currentUser.aracTipi || "";
    document.getElementById("profileAracMarkaModel").value = currentUser.aracMarkaModel || "";

    // Hakim bölgeler (chip + "her bölge" toggle)
    const userIlceler = Array.isArray(currentUser.tercihIlceler) ? currentUser.tercihIlceler : null;
    // tercih_ilceler boş dizi [] → "her bölge"; null → henüz doldurmadı; dolu → spesifik ilçeler
    const isTumBolgeler = userIlceler !== null && userIlceler.length === 0;
    const tumBolEl = document.getElementById("profileTumBolgeler");
    if (tumBolEl) tumBolEl.checked = isTumBolgeler;
    document.querySelectorAll("#profileTercihIlceler .ilce-chip").forEach(chip => {
      chip.classList.toggle("active", (userIlceler || []).includes(chip.dataset.ilce));
      chip.classList.toggle("disabled", isTumBolgeler);
    });

    // Çalışma günleri (day chips)
    const userGunler = currentUser.calismaGunleri || [];
    document.querySelectorAll("#profileGunler .day-chip").forEach(chip => {
      const d = parseInt(chip.dataset.day, 10);
      chip.classList.toggle("active", userGunler.includes(d));
    });

    // Çalışma saati
    const cb = document.getElementById("profileCalismaBaslangic");
    const cbit = document.getElementById("profileCalismaBitis");
    if (cb) cb.value = currentUser.calismaBaslangic != null ? String(currentUser.calismaBaslangic) : "";
    if (cbit) cbit.value = currentUser.calismaBitis != null ? String(currentUser.calismaBitis) : "";

    // Ücret aralığı
    document.getElementById("profileMinUcret").value = currentUser.minUcret ?? "";
    document.getElementById("profileMaxUcret").value = currentUser.maxUcret ?? "";
  }

  // İşletme alanlarını doldur
  const isletmeAdiEl = document.getElementById("profileIsletmeAdi");
  const isletmeTipiEl = document.getElementById("profileIsletmeTipi");
  const isTelEl = document.getElementById("profileIsTelefonu");
  const isAdresEl = document.getElementById("profileIsAdresi");
  if (isletmeAdiEl) isletmeAdiEl.value = currentUser.isletmeAdi || "";
  if (isletmeTipiEl) isletmeTipiEl.value = currentUser.isletmeTipi || "";
  if (isTelEl) isTelEl.value = formatTel(currentUser.isTelefonu || "");
  if (isAdresEl) isAdresEl.value = currentUser.isAdresi || "";

  // Kullanıcı tipi rozeti
  const tb = document.getElementById("profileTypeBadge");
  if (tb) {
    if (currentUser.kullaniciTipi === "kurye") {
      tb.textContent = "🏍️ Kurye";
      tb.className = "user-type-badge type-kurye";
    } else if (currentUser.kullaniciTipi === "isletme") {
      tb.textContent = "🏪 İşletme";
      tb.className = "user-type-badge type-isletme";
    } else {
      tb.className = "user-type-badge hidden";
    }
  }

  clearStatus("profileStatus");
  refreshProfileSaveBtn();
  refreshCompletion();
  switchProfileTab("genel");

  // İstatistikler — kendi ilan sayısı + üyelik gün sayısı
  loadProfileStats();

  // Son güncelleme zamanı (varsa profiles.updated_at; yoksa boş)
  const lastEl = document.getElementById("profileLastUpdated");
  if (lastEl) {
    lastEl.textContent = currentUser.updatedAt
      ? "Son güncelleme: " + formatDateTime(currentUser.updatedAt)
      : "";
  }

  openModal("profileModal");
}

// Her input değişiminde Kaydet butonunu güncelle ve statüsü temizle
["profileAd","profileSoyad","profileEmail","profileTel","profileIsletmeAdi","profileIsTelefonu","profileIsAdresi"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    if (id === "profileTel" || id === "profileIsTelefonu") el.value = formatTel(el.value);
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
});
document.getElementById("profileIsletmeTipi")?.addEventListener("change", () => {
  refreshProfileSaveBtn();
  clearStatus("profileStatus");
});
document.getElementById("profileTicari").addEventListener("change", () => {
  refreshProfileSaveBtn();
  clearStatus("profileStatus");
});

// Smart Profile tile click handlers
function _goToMyListings() {
  closeModals();
  const mineBtn = document.querySelector('#myListingsPanel .seg-btn[data-scope="mine"]');
  if (mineBtn && !mineBtn.classList.contains("active")) mineBtn.click();
  document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
}
document.getElementById("pfTileYeniIlan")?.addEventListener("click", () => {
  // closeModals() ÇAĞIRMA — ilanVerBtn handler zaten açık modalı görsel kapatır (v140).
  // closeModals history.back yapardı → popstate race → modal anında kapanırdı.
  document.getElementById("ilanVerBtn")?.click();
});
document.getElementById("pfTileIlanlarim")?.addEventListener("click", _goToMyListings);
document.getElementById("pfTileYorum")?.addEventListener("click", () => {
  closeModals();
  if (currentUser?.kullaniciTipi === "kurye") {
    openReviewViewModal(currentUser.id, ((currentUser.ad || "") + " " + (currentUser.soyad || "")).trim() || "Profilim");
  } else {
    openReviewListModal();
  }
});
document.getElementById("pfTileDuzen")?.addEventListener("click", () => {
  switchProfileTab(currentUser?.kullaniciTipi === "isletme" ? "isletme" : "profil");
});
// Eski uyumluluk (admin/diğer kodlardan referans varsa)
document.getElementById("goToMyListingsBtn")?.addEventListener("click", _goToMyListings);

// E-posta/telefon değiştirildiğinde uyarıyı göster
document.getElementById("profileEmail").addEventListener("input", e => {
  const changed = normalizeEmail(e.target.value) !== normalizeEmail(currentUser?.email || "");
  document.getElementById("profileEmailHint").style.display = changed ? "block" : "none";
});
document.getElementById("profileTel").addEventListener("input", e => {
  const changed = _telDigits(e.target.value) !== _telDigits(currentUser?.tel);
  document.getElementById("profileTelHint").style.display = changed ? "block" : "none";
});

document.getElementById("profileForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;
  const f = _readProfileForm();

  if (!f.ad || !f.soyad || !f.email || !f.tel) {
    setStatus("profileStatus", "error", "Lütfen tüm zorunlu alanları doldurun.");
    return;
  }
  if (_telDigits(f.tel).length < 10) {
    setStatus("profileStatus", "error", "Telefon numarası eksik görünüyor.");
    return;
  }
  if (!_isMobileTr(f.tel)) {
    setStatus("profileStatus", "error", "Cep telefonu 5 ile başlamalı (örn. 0532...).");
    return;
  }
  // Telefonları E.164 formatına normalize et (+90...)
  f.tel = _phoneToE164(f.tel);
  if (f.is_telefonu) f.is_telefonu = _phoneToE164(f.is_telefonu);
  const emailChanged = f.email !== normalizeEmail(currentUser.email);

  setBusy("profileSaveBtn", true, "Kaydediliyor...");

  // İşletme alanları — yalnız isletme tipi için doğrulama
  const isIsletmeUser = currentUser.kullaniciTipi === "isletme";
  if (isIsletmeUser) {
    if (!f.isletme_adi || f.isletme_adi.length < 3) {
      setStatus("profileStatus", "error", "İşletme adı zorunlu (en az 3 karakter).");
      switchProfileTab("isletme");
      return;
    }
    if (!f.is_adresi) {
      setStatus("profileStatus", "error", "İş adresi zorunlu — Profil sekmesinden gir.");
      switchProfileTab("profil");
      return;
    }
    if (!f.is_telefonu || _telDigits(f.is_telefonu).length < 10) {
      setStatus("profileStatus", "error", "İş telefonu zorunlu (en az 10 hane).");
      switchProfileTab("isletme");
      return;
    }
  }

  // 1) profiles tablosu — tüm değişebilen alanlar
  const updateObj = {
    ad: f.ad, soyad: f.soyad, tel: f.tel, ticari: f.ticari,
    bio: f.bio || null,
    bildirimler: f.bildirimler
  };
  if (isIsletmeUser) {
    updateObj.isletme_adi = f.isletme_adi || null;
    updateObj.isletme_tipi = f.isletme_tipi || null;
    updateObj.is_telefonu = f.is_telefonu || null;
    updateObj.is_adresi = f.is_adresi || null;
  }
  // Kurye alanları
  const isKuryeUser = currentUser.kullaniciTipi === "kurye";
  if (isKuryeUser) {
    updateObj.arac_tipi = f.arac_tipi || null;
    updateObj.arac_marka_model = f.arac_marka_model || null;
    updateObj.tercih_ilceler = f.tercih_ilceler;
    updateObj.calisma_gunleri = f.calisma_gunleri;
    updateObj.calisma_baslangic = f.calisma_baslangic;
    updateObj.calisma_bitis = f.calisma_bitis;
    updateObj.min_ucret = f.min_ucret;
    updateObj.max_ucret = f.max_ucret;
  }
  // Ham PATCH — sb.from takılma riski bypass
  const session = readStoredSession();
  if (!session?.access_token) {
    setBusy("profileSaveBtn", false);
    setStatus("profileStatus", "error", "Oturumun sona ermiş, lütfen tekrar giriş yap.");
    setTimeout(() => { closeModals(); openModal("loginModal"); }, 1200);
    return;
  }
  let profErr = null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(updateObj)
    });
    if (!r.ok) {
      const txt = await r.text();
      profErr = { message: "HTTP " + r.status + " — " + txt };
    }
  } catch (e) { profErr = { message: e.message || String(e) }; }
  if (profErr) {
    setBusy("profileSaveBtn", false);
    setStatus("profileStatus", "error", "Profil güncellenemedi: " + profErr.message);
    return;
  }
  // Bellekte güncelle
  Object.assign(currentUser, {
    ad: f.ad, soyad: f.soyad, tel: f.tel, ticari: f.ticari,
    bio: f.bio,
    bildirimler: f.bildirimler
  });
  if (isIsletmeUser) {
    Object.assign(currentUser, {
      isletmeAdi: f.isletme_adi,
      isletmeTipi: f.isletme_tipi,
      isTelefonu: f.is_telefonu,
      isAdresi: f.is_adresi
    });
  }
  if (isKuryeUser) {
    Object.assign(currentUser, {
      aracTipi: f.arac_tipi,
      aracMarkaModel: f.arac_marka_model,
      tercihIlceler: f.tercih_ilceler,
      calismaGunleri: f.calisma_gunleri,
      calismaBaslangic: f.calisma_baslangic,
      calismaBitis: f.calisma_bitis,
      minUcret: f.min_ucret,
      maxUcret: f.max_ucret
    });
  }

  // E-posta değiştiyse Supabase auth update
  const email = f.email;
  if (false) {} // placeholder for old structure

  // 2) E-posta değişikliği — Supabase doğrulama akışı
  if (emailChanged) {
    const { error: emailErr } = await sb.auth.updateUser(
      { email },
      { emailRedirectTo: window.location.origin + "/" }
    );
    setBusy("profileSaveBtn", false);
    if (emailErr) {
      renderTopNav();
      setStatus("profileStatus", "error", "E-posta güncellenemedi: " + emailErr.message);
      return;
    }
    renderTopNav();
    refreshProfileSaveBtn();
    setStatus("profileStatus", "info",
      "Kaydedildi. E-posta değişikliği için her iki adrese de onay maili gönderildi.");
    toast("Profil güncellendi · Onay maillerini kontrol et", "info", 4000);
    return;
  }

  setBusy("profileSaveBtn", false);
  renderTopNav();
  refreshProfileSaveBtn();
  refreshCompletion();
  checkProfilEksikBanner();
  setStatus("profileStatus", "ok", "Profilin güncellendi.");
  toast("Profil güncellendi", "ok");
  // Modalı otomatik kapat (kullanıcı hâlâ form karşısında kalmasın)
  setTimeout(() => closeModals(), 600);
});

// =============== MÜSAİTLİK TOGGLE ===============
// Müsait toggle ortak helper'ı — DB update + UI sync (raw fetch ile sb.from bypass)
async function _commitMusait(yeni) {
  if (!currentUser) return;
  const session = readStoredSession();
  if (!session?.access_token) {
    toast("Oturumun sona ermiş, lütfen tekrar giriş yap.", "error", 5000);
    setTimeout(() => openModal("loginModal"), 800);
    return;
  }
  const nowIso = new Date().toISOString();

  // Optimistic UI — anında her iki yerde de güncelle
  currentUser.musait = yeni;
  const mt = document.getElementById("musaitToggle");
  if (mt) mt.checked = yeni;
  const mTitle = document.getElementById("musaitTitle");
  if (mTitle) mTitle.textContent = yeni ? "🟢 Şu an müsaitim" : "🔴 Müsait değilim";
  document.getElementById("musaitCard")?.classList.toggle("active", yeni);
  syncDashboardToggle();

  // Ham PATCH — sb.from bypass
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ musait: yeni, musait_at: nowIso })
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " — " + (await r.text()));
    currentUser.musaitAt = nowIso;
    toast(yeni ? "🟢 Müsait olarak işaretlendin" : "🔴 Artık müsait değilsin", "ok");
  } catch (e) {
    // Rollback
    currentUser.musait = !yeni;
    if (mt) mt.checked = !yeni;
    if (mTitle) mTitle.textContent = !yeni ? "🟢 Şu an müsaitim" : "🔴 Müsait değilim";
    document.getElementById("musaitCard")?.classList.toggle("active", !yeni);
    syncDashboardToggle();
    toast("Güncellenemedi: " + (e.message || e), "error");
  }
}

// Müsait olma onay modalı — açma için kural beyanı gerek, kapatma direkt
function _openMusaitOnay(onConfirm) {
  const cb = document.getElementById("musaitKurallarOnay");
  const btn = document.getElementById("musaitOnayConfirm");
  if (cb) cb.checked = false;
  if (btn) btn.disabled = true;
  if (cb && btn) {
    cb.onchange = () => { btn.disabled = !cb.checked; };
  }
  if (btn) {
    btn.onclick = () => {
      if (!cb?.checked) return;
      closeModals();
      onConfirm();
    };
  }
  openModal("musaitOnayModal");
}

document.getElementById("musaitToggle")?.addEventListener("change", e => {
  if (!currentUser) return;
  const yeni = e.target.checked;
  if (yeni) {
    // Açma → onay iste, gerçek değişiklik onaylanınca
    e.target.checked = false;  // onay verilene kadar gerçek değişiklik yok
    _openMusaitOnay(() => _commitMusait(true));
  } else {
    // Kapatma → doğrudan
    _commitMusait(false);
  }
});

// =============== ŞİFRE DEĞİŞTİR (girişli kullanıcı) ===============
document.getElementById("changePasswordBtn").addEventListener("click", () => {
  document.getElementById("changePasswordForm").reset();
  clearStatus("changePasswordStatus");
  openModal("changePasswordModal");
});

document.getElementById("changePasswordForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;
  const fd = new FormData(e.target);
  const eski = fd.get("oldSifre") || "";
  const yeni = fd.get("yeniSifre") || "";
  const yeni2 = fd.get("yeniSifre2") || "";

  if (yeni.length < 6)   { setStatus("changePasswordStatus","error","Yeni şifre en az 6 karakter olmalı."); return; }
  if (yeni !== yeni2)    { setStatus("changePasswordStatus","error","Yeni şifreler eşleşmiyor."); return; }
  if (yeni === eski)     { setStatus("changePasswordStatus","error","Yeni şifre eskisiyle aynı olamaz."); return; }

  setBusy("changePasswordSaveBtn", true, "Güncelleniyor...");

  const { error: verifyErr } = await sb.auth.signInWithPassword({
    email: currentUser.email,
    password: eski
  });
  if (verifyErr) {
    setBusy("changePasswordSaveBtn", false);
    setStatus("changePasswordStatus","error","Mevcut şifren hatalı.");
    return;
  }

  const { error: updErr } = await sb.auth.updateUser({ password: yeni });
  setBusy("changePasswordSaveBtn", false);
  if (updErr) {
    setStatus("changePasswordStatus","error","Şifre güncellenemedi: " + updErr.message);
    return;
  }

  e.target.reset();
  setStatus("changePasswordStatus","ok","Şifren güncellendi.");
  toast("Şifren güncellendi", "ok");
});

// =============== HESABI KAPAT (v138 — soft-delete + 7 gün bekleme) ===============
// Akış: kullanıcı modal'da anket + onay → ilanlar silinir + geri bildirim INSERT
// + profiles.silinmek_uzere_at = now(). 7 gün içinde login olursa banner → vazgeç PATCH.
// 7 gün dolarsa pg_cron job auth.users CASCADE ile siler (sql/16).

let _hkSelectedSebep = null;

document.getElementById("deleteAccountBtn")?.addEventListener("click", () => {
  if (!currentUser) return;
  // Modal state reset
  _hkSelectedSebep = null;
  document.querySelectorAll("#hkSebepPicker .ilce-chip").forEach(c => c.classList.remove("active"));
  const ac = document.getElementById("hkAciklama"); if (ac) ac.value = "";
  const cb = document.getElementById("hkOnay"); if (cb) cb.checked = false;
  const btn = document.getElementById("hesapKapatConfirm"); if (btn) btn.disabled = true;
  openModal("hesapKapatModal");
});

// Sebep chip seçimi (tek seçim)
document.querySelectorAll("#hkSebepPicker .ilce-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    const sebep = chip.dataset.sebep;
    if (_hkSelectedSebep === sebep) {
      _hkSelectedSebep = null;
      chip.classList.remove("active");
    } else {
      _hkSelectedSebep = sebep;
      document.querySelectorAll("#hkSebepPicker .ilce-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
    }
  });
});

// Onay tick → confirm butonu aktif
document.getElementById("hkOnay")?.addEventListener("change", e => {
  const btn = document.getElementById("hesapKapatConfirm");
  if (btn) btn.disabled = !e.target.checked;
});

// Verilerini indir — modal içinden tetik (mevcut downloadDataBtn akışını çağır)
document.getElementById("hkVeriIndirBtn")?.addEventListener("click", () => {
  document.getElementById("downloadDataBtn")?.click();
});

// Asıl kapatma — soft-delete
document.getElementById("hesapKapatConfirm")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const session = readStoredSession();
  if (!session?.access_token) {
    toast("Oturumun sona ermiş, lütfen tekrar giriş yap.", "error", 5000);
    return;
  }
  const btn = document.getElementById("hesapKapatConfirm");
  if (btn) { btn.disabled = true; btn.textContent = "İşleniyor..."; }

  // 1) Geri bildirim INSERT (sebep + aciklama) — opsiyonel, hata olursa devam et
  const aciklama = (document.getElementById("hkAciklama")?.value || "").trim() || null;
  if (_hkSelectedSebep || aciklama) {
    try {
      await rawInsert("hesap_kapatma_geri_bildirim", {
        user_id: currentUser.id,
        sebep: _hkSelectedSebep,
        aciklama,
        email_snapshot: currentUser.email
      }, session.access_token);
    } catch (e) { console.warn("[hk geri bildirim]", e); }
  }

  // 2) İlanları sil (artık görünmesin)
  const _rawDelete = async (path) => {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + session.access_token,
          Prefer: "return=minimal"
        }
      });
      if (!r.ok) return { error: { message: "HTTP " + r.status + " — " + (await r.text()) } };
      return { error: null };
    } catch (e) { return { error: { message: e.message || String(e) } }; }
  };
  const { error: ilanErr } = await _rawDelete(`ilanlar?user_id=eq.${currentUser.id}`);
  if (ilanErr) {
    if (btn) { btn.disabled = false; btn.textContent = "Hesabımı Kapat"; }
    toast("İlanlar silinemedi: " + ilanErr.message, "error");
    return;
  }

  // 3) Profil soft-delete — silinmek_uzere_at = now()
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ silinmek_uzere_at: new Date().toISOString() })
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " — " + (await r.text()));
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = "Hesabımı Kapat"; }
    toast("Hesap kapatma işaretlenemedi: " + (e.message || e), "error");
    return;
  }

  // 4) localStorage temizle + çıkış
  try {
    Object.keys(localStorage).filter(k => k.startsWith("sb-")).forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => k.startsWith("sb-")).forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem("izk_remember");
    sessionStorage.removeItem("izk_session_active");
  } catch {}

  closeModals();
  toast("Hesabın kapatma sürecine alındı. 7 gün içinde geri dönebilirsin.", "ok", 6000);
  setTimeout(() => { window.location.href = "/"; }, 2000);
});

// =============== "Hesabımı Geri Aç" — soft-delete iptali ===============
function _showSilinecekBanner() {
  if (!currentUser?.silinmekUzereAt) {
    document.getElementById("silinecekBanner")?.classList.add("hidden");
    return;
  }
  const baslangic = new Date(currentUser.silinmekUzereAt);
  const silmeTarihi = new Date(baslangic.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tarihStr = silmeTarihi.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const el = document.getElementById("silinecekTarih");
  if (el) el.textContent = tarihStr;
  document.getElementById("silinecekBanner")?.classList.remove("hidden");
}
window._showSilinecekBanner = _showSilinecekBanner;

document.getElementById("silinmektenVazgecBtn")?.addEventListener("click", async () => {
  if (!currentUser) return;
  const session = readStoredSession();
  if (!session?.access_token) {
    toast("Oturumun sona ermiş, lütfen tekrar giriş yap.", "error");
    return;
  }
  const btn = document.getElementById("silinmektenVazgecBtn");
  if (btn) { btn.disabled = true; btn.textContent = "..."; }
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${currentUser.id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + session.access_token,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ silinmek_uzere_at: null })
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    currentUser.silinmekUzereAt = null;
    document.getElementById("silinecekBanner")?.classList.add("hidden");
    toast("Hoş geldin! Hesabın aktif durumda.", "ok", 4000);
  } catch (e) {
    toast("İşlem başarısız: " + (e.message || e), "error");
    if (btn) { btn.disabled = false; btn.textContent = "↩ Hesabımı Geri Aç"; }
  }
});
document.querySelectorAll('input[type="password"]').forEach(input => {
  const wrap = document.createElement("span");
  wrap.className = "pw-wrap";
  input.parentNode.insertBefore(wrap, input);
  wrap.appendChild(input);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pw-toggle";
  btn.setAttribute("aria-label", "Şifreyi göster");
  btn.textContent = "👁";
  btn.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    btn.textContent = show ? "🙈" : "👁";
    btn.setAttribute("aria-label", show ? "Şifreyi gizle" : "Şifreyi göster");
  });
  wrap.appendChild(btn);
});

// =============== KURYE KONTROL PANELİ ===============
async function renderKuryeDashboard() {
  const dash = document.getElementById("kuryeDashboard");
  if (!dash) return;
  if (!currentUser || currentUser.kullaniciTipi !== "kurye") {
    dash.classList.add("hidden");
    return;
  }
  dash.classList.remove("hidden");

  // Greeting
  const adEl = document.getElementById("kdName");
  if (adEl) adEl.textContent = (currentUser.ad || "Kurye").trim();

  // Avatar
  const av = document.getElementById("kdAvatar");
  if (av) {
    if (currentUser.avatarUrl) {
      av.style.backgroundImage = `url("${currentUser.avatarUrl}")`;
      av.dataset.hasImage = "1";
    } else {
      av.style.backgroundImage = "";
      delete av.dataset.hasImage;
    }
  }

  // Stats
  const days = currentUser.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(currentUser.createdAt).getTime()) / 86400000))
    : 0;
  document.getElementById("kdMemberDays").textContent = days;
  document.getElementById("kdComplete").textContent = computeProfileCompletion() + "%";

  // İlan sayısı (count head)
  try {
    const session = readStoredSession();
    const { data } = await rawSelect(
      `ilanlar?user_id=eq.${currentUser.id}&select=id`,
      session?.access_token,
      4000
    );
    document.getElementById("kdMyIlan").textContent = (data || []).length;
  } catch { document.getElementById("kdMyIlan").textContent = "—"; }

  // Toggle state senkronu
  syncDashboardToggle();
}

function syncDashboardToggle() {
  const on = !!currentUser?.musait;
  const isKurye = currentUser && currentUser.kullaniciTipi === "kurye";

  // Dashboard mesajını güncelle
  const msg = document.getElementById("kdStatusMsg");
  if (msg) {
    msg.innerHTML = on
      ? "🟢 İşletmeler seni <strong>Müsait Kuryeler</strong> listesinde görüyor."
      : "Hazır olduğunda yukarıdaki banner'dan <strong>Müsait</strong> konumuna al.";
  }

  // Büyük banner'ı senkronize et
  const banner = document.getElementById("kuryeMusaitBanner");
  if (banner) {
    banner.classList.toggle("hidden", !isKurye);
    banner.classList.toggle("active", on);
  }
  const btn = document.getElementById("kmbToggle");
  if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");

  const icon = document.getElementById("kmbIcon");
  const headline = document.getElementById("kmbHeadline");
  const hint = document.getElementById("kmbHint");
  const action = document.getElementById("kmbAction");
  if (icon && headline && hint && action) {
    if (on) {
      icon.textContent = "🟢";
      headline.textContent = "ŞU AN MÜSAİTSİN";
      hint.innerHTML = "İşletmeler seni listede görüyor — meşgul olunca tıkla";
      action.textContent = "MEŞGUL'E GEÇ";
    } else {
      icon.textContent = "🟠";
      headline.textContent = "MEŞGUL DURUMDASIN";
      hint.innerHTML = "Tek tıkla <b>Müsait</b> ol — işletmeler seni görür";
      action.textContent = "MÜSAİT OL";
    }
  }
}

// Büyük banner handler — müsait OLURKEN kurallar onayı ister
document.getElementById("kmbToggle")?.addEventListener("click", () => {
  if (!currentUser) return;
  const yeni = !currentUser.musait;
  if (yeni) {
    _openMusaitOnay(() => _commitMusait(true));
  } else {
    _commitMusait(false);
  }
});

// Hızlı bağlantılar
document.getElementById("kdProfileLink")?.addEventListener("click", () => openProfileModal());
document.getElementById("kdMyIlanLink")?.addEventListener("click", () => {
  const mineBtn = document.querySelector('#myListingsPanel .seg-btn[data-scope="mine"]');
  if (mineBtn && !mineBtn.classList.contains("active")) mineBtn.click();
  document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

// =============== KURYELER (Müsait Liste) ===============
async function loadMusaitKuryeler() {
  try {
    if (!currentUser) {
      kuryeler = [];
      renderMusaitKuryeler();
      return;
    }
    const session = readStoredSession();
    // Sıralama: puan_ort DESC (NULL'lar sonda) → puan_sayisi DESC → musait_at DESC
    let q = `profiles?kullanici_tipi=eq.kurye&musait=eq.true&id=neq.${currentUser.id}`
      + `&select=id,ad,soyad,tel,avatar_url,tercih_ilceler,calisma_baslangic,calisma_bitis,calisma_gunleri,musait_at,bio,puan_ort,puan_sayisi,min_ucret,max_ucret,arac_tipi,arac_marka_model,created_at`
      + `&order=puan_sayisi.desc,puan_ort.desc.nullslast,musait_at.desc`;
    const { data, error } = await rawSelect(q, session?.access_token, 6000);
    if (error) {
      console.error("[loadMusaitKuryeler]", error);
      showError("Müsait kurye listesi yüklenemedi: " + error.message);
      kuryeler = [];
    } else {
      kuryeler = data || [];
    }
  } catch (e) {
    console.error("[loadMusaitKuryeler throw]", e);
    kuryeler = [];
  }
  // Yeni üye serpiştirme — adil görünürlük (3. ve 7. sıralara yeni üye)
  kuryeler = _serpistirYeniUyeler(kuryeler);
  renderMusaitKuryeler();
}

// Yeni üye (puan_sayisi=0) kuryeleri 3. ve 7. sıralara serpiştir.
// SQL zaten yorumlu kuryeleri üstte verir (puan_sayisi DESC). Yeni üyeler sondadır.
// Bu fonksiyon, görünürlük şansı için bazı yeni üyeleri öne çeker.
function _serpistirYeniUyeler(liste) {
  if (!Array.isArray(liste) || liste.length < 5) return liste; // çok az kişi varsa serpiştirmeye gerek yok
  const yorumlular = liste.filter(k => (k.puan_sayisi || 0) > 0);
  const yeniler = liste.filter(k => (k.puan_sayisi || 0) === 0);
  if (yeniler.length === 0) return liste;

  // Yeniler arasında "en yeni müsait olan" üstte
  yeniler.sort((a, b) => {
    const ta = a.musait_at ? new Date(a.musait_at).getTime() : 0;
    const tb = b.musait_at ? new Date(b.musait_at).getTime() : 0;
    return tb - ta;
  });

  // Hedef pozisyonlar: 3. (index 2) ve 7. (index 6)
  const sonuc = [...yorumlular];
  const slots = [2, 6];
  let yeniIdx = 0;
  for (const slot of slots) {
    if (yeniler[yeniIdx] && sonuc.length >= slot) {
      sonuc.splice(slot, 0, yeniler[yeniIdx]);
      yeniIdx++;
    }
  }
  // Kalan yeni üyeler sona eklenir (mevcut kuryelerden farkı olmayacak şekilde)
  for (let i = yeniIdx; i < yeniler.length; i++) sonuc.push(yeniler[i]);
  return sonuc;
}

function renderMusaitKuryeler() {
  if (!kuryeListingsEl) return;
  kuryeListingsEl.innerHTML = "";

  // Anonim kullanıcı görmesin
  if (!currentUser) {
    kuryeListingsEl.classList.add("hidden");
    kuryeEmptyEl.classList.add("hidden");
    if (kuryeGuestNoticeEl && contentTab === "kuryeler") kuryeGuestNoticeEl.classList.remove("hidden");
    return;
  }
  kuryeGuestNoticeEl?.classList.add("hidden");

  if (kuryeler.length === 0) {
    kuryeListingsEl.classList.add("hidden");
    if (contentTab === "kuryeler") kuryeEmptyEl.classList.remove("hidden");
    return;
  }
  kuryeEmptyEl.classList.add("hidden");
  kuryeListingsEl.classList.remove("hidden");

  kuryeler.forEach(k => {
    const adSoyad = ((k.ad || "") + " " + (k.soyad || "")).trim() || "Kurye";
    const ilceArrRow = Array.isArray(k.tercih_ilceler) ? k.tercih_ilceler : null;
    const ilceText = ilceArrRow === null ? "Belirtilmemiş"
      : ilceArrRow.length === 0 ? "🌍 Her bölgede çalışıyor"
      : ilceArrRow.join(", ");
    const ucretText = (k.min_ucret && k.max_ucret)
      ? `${k.min_ucret}-${k.max_ucret}<small>₺</small>`
      : (k.min_ucret ? `${k.min_ucret}+ <small>₺</small>`
      : (k.max_ucret ? `≤${k.max_ucret}<small>₺</small>` : "—"));
    const isYeniUye = !k.puan_sayisi || k.puan_sayisi === 0;
    const puanText = !isYeniUye
      ? `<strong>${Number(k.puan_ort).toFixed(1)}</strong> <small>(${k.puan_sayisi})</small>`
      : "";  // yeni üye için ayrı badge kullanılıyor
    const musaitDakika = k.musait_at
      ? Math.max(0, Math.floor((Date.now() - new Date(k.musait_at).getTime()) / 60000))
      : 0;
    const musaitText = musaitDakika < 60
      ? `${musaitDakika} dk`
      : musaitDakika < 1440
      ? `${Math.floor(musaitDakika / 60)} sa`
      : `${Math.floor(musaitDakika / 1440)} gün`;
    const avatarStyle = k.avatar_url
      ? `style="background-image:url('${k.avatar_url.replace(/'/g, "%27")}')"`
      : "";
    const avatarFallback = k.avatar_url ? "" : "👤";

    const row = document.createElement("article");
    row.className = "kurye-row";
    row.dataset.id = k.id;
    row.dataset.kact = "open-kurye-detail";
    row.innerHTML = `
      <div class="kurye-row-cell cell-ad">
        <span class="kurye-row-avatar" ${avatarStyle}>${avatarFallback}</span>
        <span class="cell-text">${escapeHtml(adSoyad)}</span>
      </div>
      <div class="kurye-row-cell cell-puan">
        <span class="cell-label">${isYeniUye ? "Durum" : "Puan"}</span>
        ${isYeniUye
          ? `<span class="yeni-uye-badge">🆕 Yeni Üye</span>`
          : `<span class="kurye-puan-inline">⭐ ${puanText}</span>`}
      </div>
      <div class="kurye-row-cell cell-bolge">
        <span class="cell-label">Hakim Bölge</span>
        <span class="cell-text">📍 ${escapeHtml(ilceText)}</span>
      </div>
      <div class="kurye-row-cell cell-ucret">
        <span class="cell-label">Ücret</span>
        <strong>${ucretText}</strong>
      </div>
      <div class="kurye-row-cell cell-musait">
        <span class="cell-dot"></span>
        <span>${musaitText}</span>
      </div>
    `;
    kuryeListingsEl.appendChild(row);
  });
}

// =============== KURYE DETAY MODAL ===============

function buildKuryeDetailHTML(k) {
  const adSoyad = ((k.ad || "") + " " + (k.soyad || "")).trim() || "Kurye";

  const avatarStyle = k.avatar_url
    ? `style="background-image:url('${k.avatar_url.replace(/'/g, "%27")}')"`
    : "";
  const avatarFallback = k.avatar_url ? "" : "👤";

  const ilceArr = Array.isArray(k.tercih_ilceler) ? k.tercih_ilceler : null;
  // null → henüz doldurmadı; [] → her bölge; [...] → spesifik
  const ilceler = ilceArr === null
    ? `<span class="muted small">Bölge belirtilmemiş</span>`
    : ilceArr.length === 0
    ? `<span class="kd-chip" style="background:#dbeafe;border-color:#93c5fd;color:#1e40af">🌍 Her bölgede çalışıyor</span>`
    : ilceArr.map(i => `<span class="kd-chip kd-chip-ilce">📍 ${escapeHtml(i)}</span>`).join("");
  const ilceSummary = ilceArr === null ? "—"
    : ilceArr.length === 0 ? "🌍 Her bölge"
    : ilceArr.length === 1 ? ilceArr[0]
    : ilceArr.length === 2 ? `${ilceArr[0]}, ${ilceArr[1]}`
    : `${ilceArr[0]}, ${ilceArr[1]} <small>+${ilceArr.length - 2}</small>`;

  const saatText = (k.calisma_baslangic != null && k.calisma_bitis != null)
    ? `${String(k.calisma_baslangic).padStart(2, "0")}:00 → ${String(k.calisma_bitis).padStart(2, "0")}:00`
    : "—";

  // Araç bilgisi (eski "günler" yerine — işletme için araç tipi daha kritik)
  const aracInfo = ARAC_INFO[k.arac_tipi] || null;
  const aracIco = aracInfo ? aracInfo.ico : "🛵";
  const aracLabel = aracInfo ? aracInfo.label : "Belirtilmemiş";
  const aracMarka = (k.arac_marka_model || "").trim();

  const ucretText = (k.min_ucret && k.max_ucret)
    ? `${k.min_ucret} - ${k.max_ucret} ₺/saat`
    : (k.min_ucret ? `${k.min_ucret}₺+ /saat`
    : (k.max_ucret ? `≤ ${k.max_ucret}₺/saat` : "—"));

  let puanHtml = "";
  if (k.puan_sayisi > 0) {
    const ort = Number(k.puan_ort).toFixed(1);
    const fullStars = Math.round(k.puan_ort);
    puanHtml = `<button type="button" class="kd-puan" data-kact="show-reviews" data-id="${k.id}" data-ad="${escapeHtml(adSoyad)}" title="Yorumları gör">
      <span class="kd-puan-stars">${"★".repeat(fullStars)}${"☆".repeat(5 - fullStars)}</span>
      <strong>${ort}</strong>
      <small>(${k.puan_sayisi} yorum)</small>
    </button>`;
  } else {
    puanHtml = `<span class="yeni-uye-badge yeni-uye-badge-lg">🆕 Yeni Üye</span>`;
  }

  const musaitDakika = k.musait_at
    ? Math.max(0, Math.floor((Date.now() - new Date(k.musait_at).getTime()) / 60000))
    : 0;
  const musaitText = musaitDakika < 60
    ? `${musaitDakika} dakikadır müsait`
    : musaitDakika < 1440
    ? `${Math.floor(musaitDakika / 60)} saattir müsait`
    : `${Math.floor(musaitDakika / 1440)} gündür müsait`;

  return `
    <article class="kurye-detail-v75">
      <div class="kd-header">
        <div class="kd-avatar" ${avatarStyle}>${avatarFallback}</div>
        <div class="kd-info">
          <h2 class="kd-name">${escapeHtml(adSoyad)}</h2>
          <div class="kd-musait"><span class="aktif-dot"></span> ${musaitText}</div>
          ${puanHtml}
        </div>
      </div>

      ${k.bio ? `<div class="kd-bio"><span class="aciklama-ico">ℹ</span><span>${escapeHtml(k.bio)}</span></div>` : ""}

      <div class="kd-grid">
        <div class="kd-cell">
          <span class="kd-cell-label">⏰ Çalışma Saati</span>
          <strong>${saatText}</strong>
        </div>
        <div class="kd-cell">
          <span class="kd-cell-label">${aracIco} Araç</span>
          <strong>${escapeHtml(aracLabel)}${aracMarka ? `<small style="display:block;font-weight:500;color:#64748b;margin-top:2px;font-size:11.5px">${escapeHtml(aracMarka)}</small>` : ""}</strong>
        </div>
        <div class="kd-cell">
          <span class="kd-cell-label">💰 Beklenen Ücret</span>
          <strong>${ucretText}</strong>
        </div>
        <div class="kd-cell">
          <span class="kd-cell-label">📍 Hakim Bölge</span>
          <strong>${ilceSummary}</strong>
        </div>
      </div>

      <div class="kd-bolge-wrap">
        <span class="kd-cell-label">Hakim Olduğu Bölgeler</span>
        <div class="kd-chips">${ilceler}</div>
      </div>

      <div class="kd-actions">
        <button type="button" class="contact-btn contact-call" data-kact="call" data-id="${k.id}">
          <span class="contact-ico">📞</span><span>Ara</span>
        </button>
        <button type="button" class="contact-btn contact-wa" data-kact="wa" data-id="${k.id}">
          <span class="contact-ico">💬</span><span>WhatsApp</span>
        </button>
        ${k.puan_sayisi > 0 ? `<button type="button" class="contact-btn contact-addr" data-kact="show-reviews" data-id="${k.id}" data-ad="${escapeHtml(adSoyad)}">
          <span class="contact-ico">⭐</span><span>Yorumlar</span>
        </button>` : ""}
      </div>
    </article>
  `;
}

function openKuryeDetail(k) {
  const body = document.getElementById("kuryeDetailBody");
  if (!body) return;
  body.innerHTML = buildKuryeDetailHTML(k);
  openModal("kuryeDetailModal");
  // openModal push etti, URL'i replace ile değiştir (tek history entry)
  try {
    if (history.state?.modal !== "kuryeDetail" || history.state?.id !== k.id) {
      history.replaceState({ modal: "kuryeDetail", id: k.id }, "", `/kurye/${k.id}`);
    }
  } catch {}
}

// Kurye kart aksiyonları — global delegasyon (liste + detay modal)
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-kact]");
  if (!btn) return;
  if (!currentUser) { openModal("registerModal"); return; }
  if (btn.dataset.kact === "open-kurye-detail") {
    const k = kuryeler.find(x => x.id === btn.dataset.id);
    if (k) openKuryeDetail(k);
    return;
  }
  if (btn.dataset.kact === "show-reviews") {
    openReviewViewModal(btn.dataset.id, btn.dataset.ad || "Kurye");
    return;
  }
  const k = kuryeler.find(x => x.id === btn.dataset.id);
  if (!k) return;
  const tel = (k.tel || "").replace(/\s/g, "");
  if (!tel) { toast("Telefon bilgisi bulunamadı.", "error"); return; }
  if (btn.dataset.kact === "call") {
    window.location.href = "tel:" + tel;
  } else if (btn.dataset.kact === "wa") {
    let waNum = tel.replace(/\D/g, "");
    if (waNum.startsWith("0")) waNum = "9" + waNum;
    else if (!waNum.startsWith("90")) waNum = "90" + waNum;
    window.open("https://wa.me/" + waNum, "_blank");
  }
});

// Sekme geçişi popstate'ten geldiyse history push etme (sonsuz döngü olmasın)
let _switchingTabFromPopstate = false;

// Ana içerik sekme şeridi
document.querySelectorAll(".content-tab").forEach(btn => {
  btn.addEventListener("click", async () => {
    const newTab = btn.dataset.contentTab;
    if (newTab === contentTab) return;  // zaten bu sekmedeyiz

    // History yönetimi: geri tuşu sekme arasında gezsin, siteden çıkmasın
    if (!_switchingTabFromPopstate) {
      try {
        const isDefault = (newTab === "ilanlar");
        const wasDefault = (history.state?.tab || "ilanlar") === "ilanlar";
        if (isDefault && !wasDefault) {
          // Müsait Kuryeler → Aktif İlanlar: state.tab'i geri al
          history.back();
          return;  // popstate handler tab'ı zaten değiştirecek
        } else if (!isDefault) {
          // Aktif İlanlar → Müsait Kuryeler: yeni state push
          history.pushState({ tab: newTab }, "", window.location.href);
        }
      } catch {}
    }

    contentTab = newTab;
    document.querySelectorAll(".content-tab").forEach(b => b.classList.toggle("active", b === btn));
    const showK = contentTab === "kuryeler";
    listingsEl.classList.toggle("hidden", showK);
    emptyEl.classList.toggle("hidden", showK);
    document.getElementById("myListingsPanel")?.classList.toggle("hidden", showK || !currentUser);
    _updateIlanlarimBanner();  // sekme değişince banner görünürlüğünü güncelle
    if (showK) {
      if (!currentUser) {
        kuryeListingsEl.classList.add("hidden");
        kuryeEmptyEl.classList.add("hidden");
        kuryeGuestNoticeEl?.classList.remove("hidden");
      } else {
        await loadMusaitKuryeler();
      }
    } else {
      kuryeListingsEl.classList.add("hidden");
      kuryeEmptyEl.classList.add("hidden");
      kuryeGuestNoticeEl?.classList.add("hidden");
      // Aktif İlanlar'a dönerken empty/listing durumunu yeniden uygula
      if (ilanlar.length === 0) emptyEl.classList.remove("hidden");
    }
  });
});

document.getElementById("kuryeGuestLink")?.addEventListener("click", e => {
  e.preventDefault();
  openModal("loginModal");
});

// =============== İLK YÜKLEME ===============
// Şifre sıfırlama linkinden gelindiyse hash'i hemen yakala (supabase-js temizlemeden önce)
const _hashSnapshot = window.location.hash || "";
const _isRecoveryUrl = _hashSnapshot.includes("type=recovery");

async function _enforceRememberMe() {
  // "Beni hatirla" = 0 ise: yeni sekme/tarayici acilisinda oturumu sonlandir.
  // sessionStorage flag i sadece sayfa yenileme/ic navigasyonda korunur.
  //
  // ÖNEMLİ: sb.auth.signOut() supabase-js publishable key + lock'a takılabilir
  // ve init'i bloklar. Bunun yerine localStorage'daki token'ları MANUEL siliyoruz
  // (signOut'un yaptığı şey budur — local scope).
  try {
    if (localStorage.getItem("izk_remember") !== "0") return;
    const stillActive = sessionStorage.getItem("izk_session_active") === "1";
    if (!stillActive) {
      console.log("[init] Beni-hatirla=0 ve yeni sekme/tarayici → local token clear");
      try {
        // sb-<ref>-auth-token formatındaki tüm Supabase tokenlarını sil
        Object.keys(localStorage)
          .filter(k => k.startsWith("sb-") && k.endsWith("-auth-token"))
          .forEach(k => localStorage.removeItem(k));
      } catch {}
      localStorage.removeItem("izk_remember");
    }
    sessionStorage.setItem("izk_session_active", "1");
  } catch (e) {
    console.warn("[enforceRememberMe]", e);
  }
}

(async () => {
  console.log("[init] IIFE start");
  try {
    ["izk_user","izk_users","izk_session","izk_ilanlar"].forEach(k => localStorage.removeItem(k));
  } catch {}
  await _enforceRememberMe();

  // 1) Session önce (geri kalan her şey currentUser'a bağlı)
  try { await syncSession(); console.log("[init] syncSession OK"); }
  catch (e) { console.error("init syncSession:", e); }

  // 2) Top nav — DB sorgu yok, anında render
  try { renderTopNav(); } catch (e) { console.error("init renderTopNav:", e); }

  // 3) Kalan tüm init işlerini PARALEL kullanılır (her biri bağımsız)
  await Promise.allSettled([
    (async () => { try { await loadIlanlar(); } catch (e) { console.error("init loadIlanlar:", e); } })(),
    (async () => { try { await loadFavoriler(); } catch (e) { console.error("init loadFavoriler:", e); } })(),
    (async () => { try { await renderKuryeDashboard(); } catch (e) { console.error("init renderKuryeDashboard:", e); } })(),
    (async () => { try { await refreshPendingReviewCount(); } catch (e) { console.error("init refreshPendingReviewCount:", e); } })(),
    (async () => { try { await openIlanFromUrl(); } catch (e) { console.error("init openIlanFromUrl:", e); } })()
  ]);

  // 4) Senkron son rötuşlar
  try { checkProfilEksikBanner(); } catch (e) { console.error("init checkProfilEksikBanner:", e); }

  if (_isRecoveryUrl) {
    openModal("forgotResetModal");
  }
})();

// ===== Paylaşılabilir ilan detay (/ilan/<id> veya ?ilan=<id>) =====
async function openIlanFromUrl() {
  // Önce clean URL: /ilan/<id>
  const pathMatch = window.location.pathname.match(/^\/ilan\/([^/?#]+)/);
  let id = pathMatch ? pathMatch[1] : null;
  // Yedek olarak query string
  if (!id) {
    const params = new URLSearchParams(window.location.search);
    id = params.get("ilan");
  }
  if (!id) return;

  // Önce yüklü listede ara
  let ilan = ilanlar.find(x => x.id === id);

  // Yüklü değilse direkt çek (deep link senaryosu) — rawSelect bypass
  if (!ilan) {
    const tableOrView = currentUser ? "ilanlar" : "ilanlar_public";
    const session = readStoredSession();
    const { data, error } = await rawSelect(
      `${tableOrView}?id=eq.${id}&select=*&limit=1`,
      session?.access_token,
      6000
    );
    const row = Array.isArray(data) && data.length ? data[0] : null;
    if (error || !row) {
      toast("İlan bulunamadı veya süresi dolmuş.", "error");
      history.replaceState(null, "", "/");
      return;
    }
    ilan = row;
    // Profil bilgisini de çek (rawSelect)
    if (currentUser) {
      const { data: profArr } = await rawSelect(
        `profiles?id=eq.${ilan.user_id}&select=id,ad,soyad,tel,created_at,musait,musait_at,kullanici_tipi&limit=1`,
        session?.access_token,
        4000
      );
      ilan.profile = (Array.isArray(profArr) && profArr.length) ? profArr[0] : null;
    }
  }

  if (!currentUser) {
    toast("İlan detayı için kayıt ol veya giriş yap.", "ok", 5000);
    openModal("registerModal");
    return;
  }
  openIlanDetail(ilan);
}

// Paylaşım: clean URL kopyala
async function copyIlanLink(ilanId) {
  const url = window.location.origin + "/ilan/" + ilanId;
  try {
    await navigator.clipboard.writeText(url);
    toast("Bağlantı kopyalandı 📋", "ok");
  } catch {
    prompt("Bağlantıyı kopyala:", url);
  }
}
