console.log("[init] script.js v7 başladı");

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

// =============== DOM REF ===============
const districtSelect = document.getElementById("districtSelect");
const listingsEl = document.getElementById("listings");
const emptyEl = document.getElementById("emptyState");
const guestNotice = document.getElementById("guestNotice");
const topNav = document.getElementById("topNav");
const ilanIlceSelect = document.getElementById("ilanIlceSelect");
const basSaat = document.getElementById("basSaat");
const bitSaat = document.getElementById("bitSaat");

// İlçe doldur (sol filtre + ilan formu)
ANKARA_ILCELERI.forEach(ilce => {
  districtSelect.appendChild(new Option(ilce, ilce));
  ilanIlceSelect.appendChild(new Option(ilce, ilce));
});
// Saat aralığı (00:00 - 23:00)
for (let h = 0; h < 24; h++) {
  const v = String(h).padStart(2, "0") + ":00";
  basSaat.appendChild(new Option(v, v));
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
        isAdresi: profile?.is_adresi || "",
        isTelefonu: profile?.is_telefonu || ""
      };
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
  await syncSession();
  await loadIlanlar();
  renderTopNav();
});

// =============== SUPABASE: İLANLAR ===============
async function loadIlanlar() {
  try {
    const filter = districtSelect.value;
    const tableOrView = currentUser ? "ilanlar" : "ilanlar_public";
    let q = sb.from(tableOrView).select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("ilce", filter);
    if (listingScope === "mine" && currentUser) q = q.eq("user_id", currentUser.id);
    // ilanlar tablosunda süresi dolmuş ilanları gizle (public view zaten filtreli)
    if (tableOrView === "ilanlar") q = q.gt("expires_at", new Date().toISOString());
    const { data, error } = await q;
    if (error) {
      console.error("[loadIlanlar]", error);
      showError("İlanlar yüklenemedi: " + error.message);
      ilanlar = [];
      renderListings();
      return;
    }
    ilanlar = data || [];

    if (currentUser && ilanlar.length) {
      const userIds = [...new Set(ilanlar.map(i => i.user_id))];
      const { data: profiles, error: pErr } = await sb.from("profiles")
        .select("id, ad, soyad, tel")
        .in("id", userIds);
      if (pErr) console.warn("[profiles batch]", pErr.message);
      const map = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      ilanlar.forEach(i => { i.profile = map[i.user_id]; });
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
      sb.auth.signOut({ scope: "local" }).catch(() => {});
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

function renderListings() {
  guestNotice.classList.toggle("hidden", !!currentUser);

  // İlanlarım paneli sadece girişli kullanıcıya görünür
  const myPanel = document.getElementById("myListingsPanel");
  if (myPanel) myPanel.classList.toggle("hidden", !currentUser);

  // Sayım göstergesi
  const cntEl = document.getElementById("myListingsCount");
  if (cntEl && currentUser) {
    cntEl.textContent = listingScope === "mine"
      ? `${ilanlar.length} ilanım`
      : `Toplam ${ilanlar.length} ilan`;
  }
  listingsEl.innerHTML = "";
  if (ilanlar.length === 0) {
    emptyEl.textContent = (listingScope === "mine" && currentUser)
      ? "Henüz hiç ilan yayınlamamışsın."
      : "Bu ilçede şu an aktif izinci ilanı yok.";
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  ilanlar.forEach(i => {
    const card = document.createElement("article");
    card.className = "card";
    const lockedClass = currentUser ? "" : "locked";
    const lockedTitle = currentUser ? "" : 'title="Önce kayıt olun"';
    const isMine = currentUser && i.user_id === currentUser.id;
    const mineTag = isMine ? '<span class="mine-tag">Senin ilanın</span>' : "";
    const deleteBar = isMine
      ? `<div class="delete-bar"><button class="delete-btn" data-act="delete" data-id="${i.id}">🗑 İlanı Kaldır</button></div>`
      : "";

    const remainingTxt = formatRemaining(i.expires_at);
    const isUrgent = remainingTxt.urgent;
    card.innerHTML = `
      <div class="card-top">
        <span class="badge">📍 ${i.ilce}</span>
        <span class="date">${formatDateTime(i.created_at)}</span>
      </div>
      <div class="time-left ${isUrgent ? 'urgent' : ''}">⏳ ${remainingTxt.text}</div>
      <h3>${escapeHtml(i.baslik)}${mineTag}</h3>
      <p>${escapeHtml(i.aciklama || "")}</p>
      <div class="card-meta">
        <span>⏱ ${i.saat} saat · ${i.bas_saat}–${i.bit_saat}</span>
        <span class="price">${i.fiyat} ₺ · ${i.km} ₺/km</span>
      </div>
      <div class="actions">
        <button class="action-btn call ${lockedClass}" data-act="call" data-id="${i.id}" ${lockedTitle}>📞 Ara</button>
        <button class="action-btn wa ${lockedClass}" data-act="wa" data-id="${i.id}" ${lockedTitle}>💬 WhatsApp</button>
        <button class="action-btn addr ${lockedClass}" data-act="addr" data-id="${i.id}" ${lockedTitle}>📍 Adres</button>
      </div>
      ${deleteBar}
    `;
    listingsEl.appendChild(card);
  });
}

// =============== KART AKSİYONLARI ===============
listingsEl.addEventListener("click", async e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if (act === "delete") {
    if (!currentUser) return;
    if (!confirm("Bu ilanı kaldırmak istediğinden emin misin?")) return;
    const { error } = await sb.from("ilanlar").delete().eq("id", id);
    if (error) { toast("Silme hatası: " + error.message, "error"); return; }
    await loadIlanlar();
    toast("İlan kaldırıldı", "ok");
    return;
  }

  if (!currentUser) {
    openModal("registerModal");
    return;
  }

  const ilan = ilanlar.find(x => x.id === id);
  if (!ilan) return;
  const tel = (ilan.profile?.tel || "").replace(/\s/g, "");

  if (act === "call") {
    if (!tel) return alert("Telefon bilgisi bulunamadı.");
    window.location.href = "tel:" + tel;
  } else if (act === "wa") {
    if (!tel) return alert("Telefon bilgisi bulunamadı.");
    let waNum = tel.replace(/\D/g, "");
    if (waNum.startsWith("0")) waNum = "9" + waNum;         // 0532... → 90532...
    else if (!waNum.startsWith("90")) waNum = "90" + waNum; // 532...  → 90532...
    window.open("https://wa.me/" + waNum, "_blank");
  } else if (act === "addr") {
    showAdres(ilan);
  }
});

function showAdres(i) {
  const tel = i.profile?.tel || "—";
  const ad = ((i.profile?.ad || "") + " " + (i.profile?.soyad || "")).trim() || "—";
  document.getElementById("adresContent").innerHTML = `
    <div class="row"><strong>İşyeri:</strong><span>${escapeHtml(i.isyeri_ad || "—")}</span></div>
    <div class="row"><strong>İlgili kişi:</strong><span>${escapeHtml(ad)}</span></div>
    <div class="row"><strong>Adres:</strong><span>${escapeHtml(i.isyeri_adres || "—")}</span></div>
    <div class="row"><strong>Telefon:</strong><span>${escapeHtml(tel)}</span></div>
  `;
  openModal("adresModal");
}

// =============== MODALLAR ===============
function openModal(id) {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.body.classList.add("modal-open");
  // İlk inputa odaklan (varsa)
  setTimeout(() => {
    const first = document.querySelector("#" + id + " input:not([type='hidden']):not([disabled]), #" + id + " select:not([disabled]), #" + id + " textarea:not([disabled])");
    if (first) first.focus();
  }, 50);
}
function closeModals() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.body.classList.remove("modal-open");
}

// Esc tuşu açık modalı kapatır + kullanıcı menüsünü kapatır
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    if (document.querySelector(".modal:not(.hidden)")) closeModals();
    closeUserMenu();
  }
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
  m.addEventListener("click", e => { if (e.target === m) closeModals(); })
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
    const adres = bf?.querySelector('input[name="is_adresi"]');
    if (adres) adres.required = isBiz;
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

  const is_adresi = (fd.get("is_adresi") || "").trim();
  const is_telefonu = (fd.get("is_telefonu") || "").trim();

  if (!kullanici_tipi) { alert("Önce hesap tipini seç (Kurye veya İşletme)."); return; }
  if (!ad || !soyad || !email || !tel || !sifre) {
    alert("Lütfen tüm zorunlu alanları doldurun."); return;
  }
  if (kullanici_tipi === "isletme" && !is_adresi) {
    alert("İşletme için iş adresi zorunludur."); return;
  }
  if (sifre.length < 6) { alert("Şifre en az 6 karakter olmalı."); return; }
  if (sifre !== sifre2) { alert("Şifreler eşleşmiyor."); return; }
  if (!sozlesme) { alert("Üyelik sözleşmesi ve KVKK onayı zorunludur."); return; }

  const { error } = await sb.auth.signUp({
    email,
    password: sifre,
    options: {
      data: { ad, soyad, tel, ticari, kullanici_tipi, is_adresi, is_telefonu },
      emailRedirectTo: window.location.origin + "/"
    }
  });
  if (error) { alert("Kayıt hatası: " + error.message); return; }

  closeModals();
  e.target.reset();
  alert("Üyelik oluşturuldu. Doğrulama linki için e-postanı kontrol et — onayladıktan sonra giriş yapabilirsin.");
});

// =============== GİRİŞ ===============
document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = normalizeEmail(fd.get("email"));
  const sifre = fd.get("sifre") || "";
  const hatirla = fd.get("hatirla") === "on";

  // "Beni hatırla" işaretliyse kalıcı; değilse sekme/tarayıcı kapanışında çıkış yapılır
  if (hatirla) localStorage.setItem("izk_remember", "1");
  else localStorage.setItem("izk_remember", "0");

  const { error } = await sb.auth.signInWithPassword({ email, password: sifre });
  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      alert("E-postanı henüz onaylamadın. Gelen kutunu kontrol et.");
    } else {
      alert("E-posta veya şifre hatalı.");
    }
    return;
  }
  // Bu sekmede oturum AKTİF — sayfa navigasyonlarında çıkış tetiklenmesin
  try { sessionStorage.setItem("izk_session_active", "1"); } catch {}
  closeModals();
  e.target.reset();
});

// =============== ŞİFREMİ UNUTTUM ===============
document.getElementById("forgotEmailForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const email = normalizeEmail(fd.get("email"));
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/"
  });
  if (error) { alert("Hata: " + error.message); return; }
  e.target.reset();
  closeModals();
  alert("Sıfırlama bağlantısı e-postana gönderildi. Linke tıklayınca yeni şifre belirleyebileceğin sayfa açılacak.");
});

document.getElementById("forgotResetForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const sifre = fd.get("sifre") || "";
  const sifre2 = fd.get("sifre2") || "";
  if (sifre.length < 6) { alert("Şifre en az 6 karakter olmalı."); return; }
  if (sifre !== sifre2) { alert("Şifreler eşleşmiyor."); return; }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    alert("Oturum bulunamadı. Lütfen e-postandaki şifre sıfırlama linkine yeniden tıkla. (Linkler 1 saat geçerli ve tek kullanımlıktır.)");
    return;
  }

  const { error } = await sb.auth.updateUser({ password: sifre });
  if (error) {
    alert("Hata: " + error.message);
    return;
  }
  e.target.reset();
  closeModals();
  alert("Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.");
});

// =============== İLAN VER ===============
const ilanVerBtn = document.getElementById("ilanVerBtn");
const saatRange = document.getElementById("saatRange");
const fiyatRange = document.getElementById("fiyatRange");
const kmRange = document.getElementById("kmRange");
const saatVal = document.getElementById("saatVal");
const fiyatVal = document.getElementById("fiyatVal");
const kmVal = document.getElementById("kmVal");

saatRange.addEventListener("input", () => saatVal.textContent = saatRange.value);
fiyatRange.addEventListener("input", () => fiyatVal.textContent = fiyatRange.value);
kmRange.addEventListener("input", () => kmVal.textContent = kmRange.value);

ilanVerBtn.addEventListener("click", () => {
  if (!currentUser) {
    alert("İlan vermek için kayıt olmanız gerekir.");
    openModal("registerModal");
    return;
  }

  // İşletme için kayıtlı bilgileri otomatik doldur
  const isyeriAd = document.getElementById("ilanIsyeriAd");
  const isyeriAdres = document.getElementById("ilanIsyeriAdres");
  const adHint = document.getElementById("adEditHint");
  const adresHint = document.getElementById("adresEditHint");

  if (currentUser.kullaniciTipi === "isletme") {
    // İşyeri adı için ad+soyad'ı varsayılan göster (yoksa boş)
    const defaultAd = (currentUser.ad + " " + currentUser.soyad).trim();
    if (defaultAd && !isyeriAd.value) {
      isyeriAd.value = defaultAd;
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

document.getElementById("ilanForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;
  const fd = new FormData(e.target);

  const baslik = (fd.get("baslik") || "").trim();
  const ilce = fd.get("ilce");
  const isyeri_ad = (fd.get("isyeriAd") || "").trim();
  const isyeri_adres = (fd.get("isyeriAdres") || "").trim();
  const bas_saat = fd.get("basSaat");
  const bit_saat = fd.get("bitSaat");

  if (!baslik || !ilce || !isyeri_ad || !isyeri_adres) {
    alert("Lütfen tüm zorunlu alanları doldurun."); return;
  }
  if (bas_saat >= bit_saat) {
    alert("Bitiş saati başlangıçtan büyük olmalı."); return;
  }

  const { error } = await sb.from("ilanlar").insert({
    user_id: currentUser.id,
    baslik,
    ilce,
    saat: parseInt(fd.get("saat"), 10),
    fiyat: parseInt(fd.get("fiyat"), 10),
    km: parseInt(fd.get("km"), 10),
    bas_saat,
    bit_saat,
    aciklama: (fd.get("aciklama") || "").trim() || null,
    isyeri_ad,
    isyeri_adres
  });
  if (error) { alert("İlan eklenemedi: " + error.message); return; }

  closeModals();
  e.target.reset();
  saatRange.value = 4; saatVal.textContent = "4";
  fiyatRange.value = 200; fiyatVal.textContent = "200";
  kmRange.value = 5; kmVal.textContent = "5";
  basSaat.value = "09:00"; bitSaat.value = "18:00";
  await loadIlanlar();
  toast("İlanın yayınlandı", "ok");
});

// =============== YARDIMCI ===============
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

// İlan kalan süre — 24 saatlik yayın
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

// =============== İLANLARIM TOGGLE ===============
document.querySelectorAll("#myListingsPanel .seg-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const scope = btn.dataset.scope;
    if (scope === listingScope) return;
    listingScope = scope;
    document.querySelectorAll("#myListingsPanel .seg-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.scope === scope);
    });
    await loadIlanlar();
  });
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
function formatTel(raw) {
  const d = (raw || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return d.slice(0, 4) + " " + d.slice(4);
  if (d.length <= 9) return d.slice(0, 4) + " " + d.slice(4, 7) + " " + d.slice(7);
  return d.slice(0, 4) + " " + d.slice(4, 7) + " " + d.slice(7, 9) + " " + d.slice(9);
}

function _telDigits(s) { return (s || "").replace(/\D/g, ""); }

function _readProfileForm() {
  const tercihIlceler = Array.from(document.getElementById("profileTercihIlceler")?.selectedOptions || []).map(o => o.value);
  const gunler = Array.from(document.querySelectorAll("#profileGunler .day-chip.active"))
    .map(c => parseInt(c.dataset.gun, 10))
    .filter(n => !isNaN(n))
    .sort((a,b) => a-b);
  const cbas = document.getElementById("profileCalismaBaslangic")?.value;
  const cbit = document.getElementById("profileCalismaBitis")?.value;
  const minU = document.getElementById("profileMinUcret")?.value;
  const maxU = document.getElementById("profileMaxUcret")?.value;
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
    tercih_ilceler: tercihIlceler,
    calisma_baslangic: cbas === "" ? null : parseInt(cbas, 10),
    calisma_bitis: cbit === "" ? null : parseInt(cbit, 10),
    calisma_gunleri: gunler,
    min_ucret: minU === "" ? null : parseInt(minU, 10),
    max_ucret: maxU === "" ? null : parseInt(maxU, 10),
    ticari: !!document.getElementById("bildirKampanya")?.checked,
    bildirimler
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
  if (JSON.stringify(f.tercih_ilceler) !== JSON.stringify(currentUser.tercihIlceler || [])) return true;
  if (f.calisma_baslangic !== (currentUser.calismaBaslangic ?? null)) return true;
  if (f.calisma_bitis !== (currentUser.calismaBitis ?? null)) return true;
  if (JSON.stringify(f.calisma_gunleri) !== JSON.stringify(currentUser.calismaGunleri || [])) return true;
  if (f.min_ucret !== (currentUser.minUcret ?? null)) return true;
  if (f.max_ucret !== (currentUser.maxUcret ?? null)) return true;
  if (JSON.stringify(f.bildirimler) !== JSON.stringify(currentUser.bildirimler || {})) return true;
  return false;
}

function refreshProfileSaveBtn() {
  const btn = document.getElementById("profileSaveBtn");
  if (btn) btn.disabled = !profileHasChanges();
}

// =============== PROFİL: tercih ilçeler + saat select doldur (bir kerelik) ===============
(() => {
  const ti = document.getElementById("profileTercihIlceler");
  if (ti) ANKARA_ILCELERI.forEach(ilce => ti.appendChild(new Option(ilce, ilce)));
  const cb = document.getElementById("profileCalismaBaslangic");
  const cbit = document.getElementById("profileCalismaBitis");
  for (let h = 0; h < 24; h++) {
    const lbl = String(h).padStart(2, "0") + ":00";
    if (cb) cb.appendChild(new Option(lbl, h));
    if (cbit) cbit.appendChild(new Option(lbl, h));
  }
})();

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

// Tercih ilçeler değişimi
document.getElementById("profileTercihIlceler")?.addEventListener("change", () => {
  refreshProfileSaveBtn();
  clearStatus("profileStatus");
});
["profileCalismaBaslangic","profileCalismaBitis","profileMinUcret","profileMaxUcret"].forEach(id => {
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
  // Form içi bölümler (profil, bildirim)
  const showForm = (name === "profil" || name === "bildirim");
  document.querySelectorAll("#profileModal [data-tab-section]").forEach(s => {
    s.classList.toggle("hidden", s.dataset.tabSection !== name);
  });
  document.getElementById("profileForm").classList.toggle("hidden", !showForm);
  document.getElementById("profileSaveBtn").classList.toggle("hidden", !showForm);
}

function computeProfileCompletion() {
  if (!currentUser) return 0;
  const fields = [
    !!(currentUser.ad && currentUser.ad.trim()),
    !!(currentUser.soyad && currentUser.soyad.trim()),
    !!(currentUser.email && currentUser.email.trim()),
    !!(_telDigits(currentUser.tel).length >= 10),
    !!currentUser.avatarUrl,
    !!(currentUser.bio && currentUser.bio.trim()),
    !!(currentUser.tercihIlceler && currentUser.tercihIlceler.length > 0),
    !!(currentUser.calismaBaslangic != null && currentUser.calismaBitis != null),
    !!(currentUser.calismaGunleri && currentUser.calismaGunleri.length > 0),
    !!(currentUser.minUcret != null && currentUser.maxUcret != null)
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
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
  const [{ data: profil }, { data: ilanlar }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
    sb.from("ilanlar").select("*").eq("user_id", currentUser.id)
  ]);
  const payload = {
    indirilme_tarihi: new Date().toISOString(),
    kullanici: { id: currentUser.id, email: currentUser.email },
    profil: profil || {},
    ilanlar: ilanlar || []
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
  // Üyelik gün sayısı
  const dayEl = document.getElementById("statMemberDays");
  if (dayEl && currentUser.createdAt) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(currentUser.createdAt).getTime()) / 86400000));
    dayEl.textContent = days;
  } else if (dayEl) {
    dayEl.textContent = "—";
  }

  // Kendi ilan sayısı (count head sorgusu)
  const ilanEl = document.getElementById("statMyIlan");
  if (ilanEl) {
    const { count, error } = await sb.from("ilanlar")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUser.id);
    if (error) console.warn("[stats]", error.message);
    ilanEl.textContent = (count ?? 0);
  }
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

document.getElementById("avatarFileInput").addEventListener("change", async e => {
  if (!currentUser) return;
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("profileStatus", "error", "Sadece görsel dosyalar yüklenebilir.");
    e.target.value = "";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    setStatus("profileStatus", "error", "Dosya 2 MB'dan büyük olamaz.");
    e.target.value = "";
    return;
  }

  clearStatus("profileStatus");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${currentUser.id}/avatar.${ext}`;

  // Yeni dosyayı yükle (üzerine yaz)
  const { error: upErr } = await sb.storage.from("avatars").upload(path, file, {
    cacheControl: "3600", upsert: true, contentType: file.type
  });
  if (upErr) {
    setStatus("profileStatus", "error", "Yükleme başarısız: " + upErr.message);
    return;
  }

  // Public URL al + cache-bust için ?t= ekle
  const { data: urlData } = sb.storage.from("avatars").getPublicUrl(path);
  const publicUrl = urlData.publicUrl + "?t=" + Date.now();

  // profiles.avatar_url güncelle
  const { error: dbErr } = await sb.from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", currentUser.id);
  if (dbErr) {
    setStatus("profileStatus", "error", "Profil güncellenemedi: " + dbErr.message);
    return;
  }

  currentUser.avatarUrl = publicUrl;
  setAvatarPreview(publicUrl);
  renderTopNav();
  refreshCompletion();
  setStatus("profileStatus", "ok", "Profil fotoğrafın güncellendi.");
  toast("Profil fotoğrafın güncellendi", "ok");
  e.target.value = "";
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

  // Tercih ilçeler
  const tiEl = document.getElementById("profileTercihIlceler");
  if (tiEl) {
    Array.from(tiEl.options).forEach(o => {
      o.selected = (currentUser.tercihIlceler || []).includes(o.value);
    });
  }

  // Çalışma saatleri
  document.getElementById("profileCalismaBaslangic").value = currentUser.calismaBaslangic ?? "";
  document.getElementById("profileCalismaBitis").value = currentUser.calismaBitis ?? "";

  // Çalışma günleri
  document.querySelectorAll("#profileGunler .day-chip").forEach(c => {
    const gun = parseInt(c.dataset.gun, 10);
    c.classList.toggle("active", (currentUser.calismaGunleri || []).includes(gun));
  });

  // Ücret aralığı
  document.getElementById("profileMinUcret").value = currentUser.minUcret ?? "";
  document.getElementById("profileMaxUcret").value = currentUser.maxUcret ?? "";

  // Bildirim toggle'ları
  const b = currentUser.bildirimler || {};
  document.getElementById("bildirYeniIlan").checked = b.yeni_ilan !== false;
  document.getElementById("bildirIlanimGoruldu").checked = b.ilanim_goruldu !== false;
  document.getElementById("bildirKampanya").checked = !!b.kampanya || !!currentUser.ticari;
  document.getElementById("profileTicari").value = (b.kampanya || currentUser.ticari) ? "on" : "";

  // Son giriş zamanı (Güvenlik sekmesi - Paket 4)
  loadLastSignIn();
  setAvatarPreview(currentUser.avatarUrl || "");

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
["profileAd","profileSoyad","profileEmail","profileTel"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    if (id === "profileTel") el.value = formatTel(el.value);
    refreshProfileSaveBtn();
    clearStatus("profileStatus");
  });
});
document.getElementById("profileTicari").addEventListener("change", () => {
  refreshProfileSaveBtn();
  clearStatus("profileStatus");
});

// İlanlarımı Görüntüle — modalı kapat, sidebar toggle'ı "İlanlarım"a geçir
document.getElementById("goToMyListingsBtn").addEventListener("click", async () => {
  if (!currentUser) return;
  closeModals();
  const mineBtn = document.querySelector('#myListingsPanel .seg-btn[data-scope="mine"]');
  if (mineBtn && !mineBtn.classList.contains("active")) {
    mineBtn.click();
  }
  // Sayfayı listings'e kaydır
  document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

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
  if (f.min_ucret != null && f.max_ucret != null && f.min_ucret > f.max_ucret) {
    setStatus("profileStatus", "error", "Min. ücret max. ücretten büyük olamaz.");
    return;
  }
  if (f.calisma_baslangic != null && f.calisma_bitis != null && f.calisma_baslangic >= f.calisma_bitis) {
    setStatus("profileStatus", "error", "Çalışma bitiş saati başlangıçtan büyük olmalı.");
    return;
  }

  const emailChanged = f.email !== normalizeEmail(currentUser.email);

  setBusy("profileSaveBtn", true, "Kaydediliyor...");

  // 1) profiles tablosu — tüm değişebilen alanlar
  const updateObj = {
    ad: f.ad, soyad: f.soyad, tel: f.tel, ticari: f.ticari,
    bio: f.bio || null,
    tercih_ilceler: f.tercih_ilceler.length ? f.tercih_ilceler : null,
    calisma_baslangic: f.calisma_baslangic,
    calisma_bitis: f.calisma_bitis,
    calisma_gunleri: f.calisma_gunleri.length ? f.calisma_gunleri : null,
    min_ucret: f.min_ucret,
    max_ucret: f.max_ucret,
    bildirimler: f.bildirimler
  };
  const { error: profErr } = await sb.from("profiles").update(updateObj).eq("id", currentUser.id);
  if (profErr) {
    setBusy("profileSaveBtn", false);
    setStatus("profileStatus", "error", "Profil güncellenemedi: " + profErr.message);
    return;
  }
  // Bellekte güncelle
  Object.assign(currentUser, {
    ad: f.ad, soyad: f.soyad, tel: f.tel, ticari: f.ticari,
    bio: f.bio,
    tercihIlceler: f.tercih_ilceler,
    calismaBaslangic: f.calisma_baslangic,
    calismaBitis: f.calisma_bitis,
    calismaGunleri: f.calisma_gunleri,
    minUcret: f.min_ucret,
    maxUcret: f.max_ucret,
    bildirimler: f.bildirimler
  });

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
  setStatus("profileStatus", "ok", "Profilin güncellendi.");
  toast("Profil güncellendi", "ok");
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

// =============== HESABI KAPAT ===============
document.getElementById("deleteAccountBtn").addEventListener("click", async () => {
  if (!currentUser) return;

  const ok1 = confirm(
    "Hesabını kapatmak istediğinden emin misin?\n\n" +
    "• Tüm ilanların silinecek\n" +
    "• Profil bilgilerin silinecek\n" +
    "• Bu işlem GERİ ALINAMAZ"
  );
  if (!ok1) return;

  const onay = prompt('Onaylamak için aşağıya tam olarak şunu yaz:\n\nHESABIMI KAPAT');
  if (onay !== "HESABIMI KAPAT") {
    alert("Onay metni eşleşmedi, işlem iptal edildi.");
    return;
  }

  // 1) Kullanıcının ilanlarını sil
  const { error: ilanErr } = await sb.from("ilanlar").delete().eq("user_id", currentUser.id);
  if (ilanErr) {
    alert("İlanlar silinemedi: " + ilanErr.message);
    return;
  }

  // 2) Profil satırını sil
  const { error: profErr } = await sb.from("profiles").delete().eq("id", currentUser.id);
  if (profErr) {
    alert("Profil silinemedi: " + profErr.message);
    return;
  }

  // 3) Storage temizle + oturumu kapat (local scope, hızlı)
  try {
    Object.keys(localStorage).filter(k => k.startsWith("sb-")).forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => k.startsWith("sb-")).forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem("izk_remember");
    sessionStorage.removeItem("izk_session_active");
  } catch {}
  sb.auth.signOut({ scope: "local" }).catch(() => {});

  alert("Hesabın kapatıldı. Geçmişin için teşekkürler.");
  window.location.href = "/";
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

// =============== İLK YÜKLEME ===============
// Şifre sıfırlama linkinden gelindiyse hash'i hemen yakala (supabase-js temizlemeden önce)
const _hashSnapshot = window.location.hash || "";
const _isRecoveryUrl = _hashSnapshot.includes("type=recovery");

async function _enforceRememberMe() {
  // "Beni hatirla" = 0 ise: yeni sekme/tarayici acilisinda oturumu sonlandir.
  // sessionStorage flag i sadece sayfa yenileme/ic navigasyonda korunur.
  try {
    if (localStorage.getItem("izk_remember") !== "0") return;
    const stillActive = sessionStorage.getItem("izk_session_active") === "1";
    if (!stillActive) {
      console.log("[init] Beni-hatirla=0 ve yeni sekme/tarayici → local signOut");
      await sb.auth.signOut({ scope: "local" }).catch(() => {});
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
  try { await syncSession(); console.log("[init] syncSession OK, currentUser:", currentUser); }
  catch (e) { console.error("init syncSession:", e); }
  try { await loadIlanlar(); console.log("[init] loadIlanlar OK, ilanlar:", ilanlar.length); }
  catch (e) { console.error("init loadIlanlar:", e); }
  try { renderTopNav(); console.log("[init] renderTopNav OK"); }
  catch (e) { console.error("init renderTopNav:", e); }

  if (_isRecoveryUrl) {
    openModal("forgotResetModal");
  }
})();
