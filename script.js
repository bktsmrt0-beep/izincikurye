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
    console.log("[syncSession] getSession start");
    const { data, error: sErr } = await _withTimeout(sb.auth.getSession(), 8000, "getSession");
    console.log("[syncSession] getSession done", { hasSession: !!data?.session, sErr });
    if (sErr) throw sErr;
    const session = data?.session;
    if (session?.user) {
      console.log("[syncSession] profile query start for", session.user.id);
      const { data: profile, error: pErr } = await _withTimeout(
        sb.from("profiles").select("ad, soyad, tel, role").eq("id", session.user.id).maybeSingle(),
        8000, "profiles.select"
      );
      console.log("[syncSession] profile query done", { profile, pErr });
      if (pErr) console.warn("[profile]", pErr.message);
      currentUser = {
        id: session.user.id,
        email: session.user.email,
        ad: profile?.ad || "",
        soyad: profile?.soyad || "",
        tel: profile?.tel || "",
        role: profile?.role || "user"
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
    const chip = document.createElement("span");
    chip.className = "user-chip";
    chip.textContent = "👤 " + (currentUser.ad + " " + currentUser.soyad).trim();
    topNav.append(chip);

    const profile = document.createElement("button");
    profile.className = "btn btn-ghost btn-sm";
    profile.textContent = "👤 Profilim";
    profile.addEventListener("click", openProfileModal);
    topNav.append(profile);

    if (currentUser.role === "admin") {
      const admin = document.createElement("a");
      admin.href = "admin.html";
      admin.className = "btn btn-ghost btn-sm";
      admin.textContent = "🛡 Admin";
      topNav.append(admin);
    }

    const out = document.createElement("button");
    out.className = "btn btn-ghost btn-sm";
    out.textContent = "Çıkış";
    out.addEventListener("click", () => {
      if (!confirm("Çıkmak istediğine emin misin?")) return;
      // Storage anahtarlarını hemen sil (network beklemeden)
      try {
        Object.keys(localStorage).filter(k => k.startsWith("sb-")).forEach(k => localStorage.removeItem(k));
        Object.keys(sessionStorage).filter(k => k.startsWith("sb-")).forEach(k => sessionStorage.removeItem(k));
        localStorage.removeItem("izk_remember");
        sessionStorage.removeItem("izk_session_active");
      } catch {}
      // Local scope: revoke network çağrısı yapmaz, hemen döner
      sb.auth.signOut({ scope: "local" }).catch(() => {});
      window.location.href = "/";
    });
    topNav.append(out);
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

    card.innerHTML = `
      <div class="card-top">
        <span class="badge">📍 ${i.ilce}</span>
        <span class="date">${formatDateTime(i.created_at)}</span>
      </div>
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
    if (error) { alert("Silme hatası: " + error.message); return; }
    await loadIlanlar();
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
}
function closeModals() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
}
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

document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const ad = (fd.get("ad") || "").trim();
  const soyad = (fd.get("soyad") || "").trim();
  const email = normalizeEmail(fd.get("email"));
  const tel = (fd.get("tel") || "").trim();
  const sifre = fd.get("sifre") || "";
  const sifre2 = fd.get("sifre2") || "";
  const sozlesme = fd.get("sozlesme") === "on";
  const ticari = fd.get("ticari") === "on";

  if (!ad || !soyad || !email || !tel || !sifre) {
    alert("Lütfen tüm zorunlu alanları doldurun."); return;
  }
  if (sifre.length < 6) { alert("Şifre en az 6 karakter olmalı."); return; }
  if (sifre !== sifre2) { alert("Şifreler eşleşmiyor."); return; }
  if (!sozlesme) { alert("Üyelik sözleşmesi ve KVKK onayı zorunludur."); return; }

  const { error } = await sb.auth.signUp({
    email,
    password: sifre,
    options: {
      data: { ad, soyad, tel, ticari },
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
  openModal("ilanModal");
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
  alert("İlanın yayınlandı.");
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

// =============== PROFİLİM ===============
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById("profileAd").value = currentUser.ad || "";
  document.getElementById("profileSoyad").value = currentUser.soyad || "";
  document.getElementById("profileEmail").value = currentUser.email || "";
  document.getElementById("profileTel").value = currentUser.tel || "";
  document.getElementById("profileEmailHint").style.display = "none";
  document.getElementById("profileTelHint").style.display = "none";
  openModal("profileModal");
}

// E-posta/telefon değiştirildiğinde uyarıyı göster
document.getElementById("profileEmail").addEventListener("input", e => {
  const changed = normalizeEmail(e.target.value) !== normalizeEmail(currentUser?.email || "");
  document.getElementById("profileEmailHint").style.display = changed ? "block" : "none";
});
document.getElementById("profileTel").addEventListener("input", e => {
  const changed = (e.target.value || "").trim() !== (currentUser?.tel || "").trim();
  document.getElementById("profileTelHint").style.display = changed ? "block" : "none";
});

document.getElementById("profileForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;
  const fd = new FormData(e.target);
  const ad = (fd.get("ad") || "").trim();
  const soyad = (fd.get("soyad") || "").trim();
  const email = normalizeEmail(fd.get("email"));
  const tel = (fd.get("tel") || "").trim();

  if (!ad || !soyad || !email || !tel) {
    alert("Lütfen tüm alanları doldurun.");
    return;
  }

  const emailChanged = email !== normalizeEmail(currentUser.email);
  const telChanged = tel !== (currentUser.tel || "").trim();
  const nameChanged = ad !== currentUser.ad || soyad !== currentUser.soyad;

  // 1) profiles tablosunda ad/soyad/tel güncelle (değişmişse)
  if (nameChanged || telChanged) {
    const { error: profErr } = await sb.from("profiles")
      .update({ ad, soyad, tel })
      .eq("id", currentUser.id);
    if (profErr) {
      alert("Profil güncellenemedi: " + profErr.message);
      return;
    }
    currentUser.ad = ad;
    currentUser.soyad = soyad;
    currentUser.tel = tel;
  }

  // 2) E-posta değişikliği — Supabase doğrulama akışı
  if (emailChanged) {
    const { error: emailErr } = await sb.auth.updateUser(
      { email },
      { emailRedirectTo: window.location.origin + "/" }
    );
    if (emailErr) {
      alert("E-posta güncellenemedi: " + emailErr.message);
      // ad/soyad/tel zaten güncellendi; kullanıcıyı bilgilendir
      renderTopNav();
      return;
    }
    closeModals();
    renderTopNav();
    alert(
      "Profil güncellendi.\n\n" +
      "E-posta değişikliği için her iki adrese de onay maili gönderildi. " +
      "Her ikisini de onaylayana kadar yeni e-posta aktif olmayacak."
    );
    return;
  }

  closeModals();
  renderTopNav();
  alert("Profilin güncellendi.");
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
