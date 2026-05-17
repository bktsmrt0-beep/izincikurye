// =====================================================================
// script-is-ilani.js — Faz 2A İş İlanları modülü (v153)
// =====================================================================
// Mevcut script.js'e dokunmadan, ayrı modül olarak yüklenir.
// Bağımlılıklar (script.js'te global tanımlı): rawSelect, rawInsert,
// readStoredSession, openModal, closeModals, toast, setStatus, setBusy,
// escapeHtml, formatDateTime, formatTel, _phoneToE164, _isMobileTr,
// _validateIcerik, currentUser, ANKARA_ILCELERI, SUPABASE_URL, SUPABASE_KEY.
// Script tag sırası: supabase-config.js → script.js → script-is-ilani.js
// =====================================================================

(function () {
  "use strict";

  // ============== STATE ==============
  const IS_ILAN_TURLERI = {
    tam_zamanli:   { label: "Tam Zamanlı Kurye", emoji: "💼" },
    esnaf_kurye:   { label: "Esnaf Kurye",       emoji: "🏪" },
    arabali_kurye: { label: "Arabalı Kurye",     emoji: "🚗" }
  };

  let _isIlanAltTur = "tam_zamanli";   // aktif sub-tab
  let _isIlanlar = [];                  // yüklenen ilanlar
  let _isIlanScope = "all";             // "all" | "mine"

  // ============== HELPERS ==============
  // 300 kelime kontrolü — _validateIcerik üstüne wrapper
  function _validateUzunForm(text, alanAdi = "Açıklama") {
    const baseErr = window._validateIcerik?.(text, alanAdi);
    if (baseErr) return baseErr;
    if (!text) return null;
    const kelimeler = text.trim().split(/\s+/).filter(Boolean);
    if (kelimeler.length > 300) {
      return `${alanAdi} en fazla 300 kelime olabilir (şu an ${kelimeler.length}).`;
    }
    return null;
  }

  // Maaş formatı: 25000 → "25.000 ₺"
  function _formatMaas(n) {
    if (n == null) return "—";
    return Number(n).toLocaleString("tr-TR") + " ₺";
  }

  function _formatMaasAralik(min, max) {
    if (min == null && max == null) return "Belirtilmemiş";
    if (min != null && max != null) return _formatMaas(min) + " — " + _formatMaas(max);
    if (min != null) return _formatMaas(min) + " +";
    return "≤ " + _formatMaas(max);
  }

  // Durum rozeti
  function _durumRozet(durum) {
    if (durum === "beklemede")  return `<span class="durum-rozet durum-bekleme">⏳ İncelemede</span>`;
    if (durum === "reddedildi") return `<span class="durum-rozet durum-red">❌ Reddedildi</span>`;
    if (durum === "onayli")     return `<span class="durum-rozet durum-onay">✅ Onaylı</span>`;
    return "";
  }

  // ============== LOAD ==============
  async function loadIsIlanlari() {
    const listEl = document.getElementById("isilanlariListings");
    const emptyEl = document.getElementById("isilanlariEmpty");
    if (!listEl || !emptyEl) return;

    listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px">Yükleniyor...</div>`;
    emptyEl.classList.add("hidden");

    const session = window.readStoredSession?.();
    const isMine = (_isIlanScope === "mine") && window.currentUser;
    // Kendi ilanlarımı görüntülerken `ilanlar` (RLS ile kendi satırlar) — durum filtresiz
    // Genel görüntülemede `ilanlar_public` view (sadece onaylı)
    const table = isMine ? "ilanlar" : "ilanlar_public";
    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("tur", "eq." + _isIlanAltTur);
    if (isMine) params.set("user_id", "eq." + window.currentUser.id);
    params.set("order", "created_at.desc");
    params.set("limit", "50");

    const { data, error } = await window.rawSelect(
      `${table}?${params.toString()}`,
      session?.access_token,
      8000
    );
    if (error) {
      listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px;color:#dc2626">Yüklenemedi: ${error.message}</div>`;
      return;
    }
    _isIlanlar = Array.isArray(data) ? data : [];

    // İşletme profil bilgisi çek (kart üstünde adı göstermek için)
    if (_isIlanlar.length && window.currentUser) {
      const userIds = [...new Set(_isIlanlar.map(i => i.user_id))];
      const profUrl = `profiles?id=in.(${userIds.join(",")})&select=id,isletme_adi,ad,soyad,puan_ort,puan_sayisi`;
      const { data: profiles } = await window.rawSelect(profUrl, session?.access_token, 5000);
      const map = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      _isIlanlar.forEach(i => { i.profile = map[i.user_id]; });
    }

    renderIsIlanlari();
  }

  // ============== RENDER ==============
  function renderIsIlanlari() {
    const listEl = document.getElementById("isilanlariListings");
    const emptyEl = document.getElementById("isilanlariEmpty");
    if (!listEl || !emptyEl) return;

    if (!_isIlanlar.length) {
      listEl.innerHTML = "";
      const turMeta = IS_ILAN_TURLERI[_isIlanAltTur];
      const isMine = _isIlanScope === "mine";
      emptyEl.innerHTML = `
        <div class="empty-icon">${turMeta.emoji}</div>
        <h3>${isMine ? "Henüz iş ilanı vermemişsin" : turMeta.label + " ilanı bulunmuyor"}</h3>
        <p>${isMine
          ? "Personel arıyorsan ilk ilanını verebilirsin."
          : "Şu an bu kategoride aktif ilan yok. Sık aralıklarla kontrol et veya farklı kategoriye bak."}
        </p>
      `;
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    listEl.innerHTML = _isIlanlar.map(i => buildIsIlanCardHTML(i)).join("");
  }

  function buildIsIlanCardHTML(i) {
    const turMeta = IS_ILAN_TURLERI[i.tur] || { label: i.tur, emoji: "💼" };
    const isletme = i.profile?.isletme_adi || (i.profile ? (i.profile.ad + " " + i.profile.soyad).trim() : "");
    const maas = _formatMaasAralik(i.maas_min, i.maas_max);
    const isOwn = window.currentUser && i.user_id === window.currentUser.id;
    const durumLabel = isOwn ? _durumRozet(i.durum) : "";

    const redBlock = (isOwn && i.durum === "reddedildi" && i.red_sebebi)
      ? `<div class="red-sebebi">❌ <strong>Red sebebi:</strong> ${window.escapeHtml(i.red_sebebi)}</div>`
      : "";

    return `
      <article class="is-ilan-card" data-id="${i.id}">
        <div class="iic-top">
          <span class="iic-kategori">${turMeta.emoji} ${turMeta.label}</span>
          ${durumLabel}
          <span class="iic-tarih">${window.formatDateTime ? window.formatDateTime(i.created_at) : ""}</span>
        </div>
        <h3 class="iic-baslik">${window.escapeHtml(i.baslik)}</h3>
        <div class="iic-meta">
          ${isletme ? `<span class="iic-isletme">🏢 ${window.escapeHtml(isletme)}</span>` : ""}
          <span class="iic-ilce">📍 ${window.escapeHtml(i.ilce)}</span>
        </div>
        <div class="iic-maas">💰 ${maas}</div>
        ${redBlock}
        <div class="iic-actions">
          <button class="btn btn-primary btn-sm" data-iict="detay" data-id="${i.id}">Detay</button>
          ${isOwn ? `<button class="btn btn-ghost btn-sm" data-iict="delete" data-id="${i.id}">🗑</button>` : ""}
        </div>
      </article>
    `;
  }

  // ============== DETAIL MODAL ==============
  function openIsIlanDetail(ilan) {
    const body = document.getElementById("isIlanDetailBody");
    if (!body) return;
    const turMeta = IS_ILAN_TURLERI[ilan.tur] || { label: ilan.tur, emoji: "💼" };
    const isletme = ilan.profile?.isletme_adi || (ilan.profile ? (ilan.profile.ad + " " + ilan.profile.soyad).trim() : "");
    const tel = ilan.iletisim_tel || ilan.profile?.tel;
    const telDisplay = tel ? (window._displayPhone?.(tel) || tel) : "";
    const telE164 = tel ? (window._phoneToE164?.(tel) || tel) : "";
    const isMobil = tel && window._isMobileTr?.(tel);

    const isOwn = window.currentUser && ilan.user_id === window.currentUser.id;
    const durumBlock = isOwn ? _durumRozet(ilan.durum) : "";
    const redBlock = (isOwn && ilan.durum === "reddedildi" && ilan.red_sebebi)
      ? `<div class="iid-red-sebebi"><strong>❌ Bu ilan reddedildi.</strong><br>Sebep: ${window.escapeHtml(ilan.red_sebebi)}</div>`
      : "";
    const bekleyenBlock = (isOwn && ilan.durum === "beklemede")
      ? `<div class="iid-beklemede">⏳ Bu ilan moderatör incelemesinde. Onaylanınca yayına çıkacak (genelde 4 saat içinde).</div>`
      : "";

    body.innerHTML = `
      <div class="iid-header">
        <span class="iid-kategori">${turMeta.emoji} ${turMeta.label}</span>
        ${durumBlock}
      </div>
      <h2 class="iid-baslik">${window.escapeHtml(ilan.baslik)}</h2>
      ${bekleyenBlock}
      ${redBlock}
      <div class="iid-meta">
        ${isletme ? `<div>🏢 <strong>${window.escapeHtml(isletme)}</strong></div>` : ""}
        <div>📍 ${window.escapeHtml(ilan.ilce)}</div>
        <div>💰 ${_formatMaasAralik(ilan.maas_min, ilan.maas_max)}</div>
      </div>
      ${ilan.aciklama ? `<div class="iid-aciklama">${window.escapeHtml(ilan.aciklama).replace(/\n/g, "<br>")}</div>` : ""}
      ${tel && ilan.durum === "onayli" ? `
        <div class="iid-iletisim">
          <a href="tel:${telE164}" class="btn btn-primary btn-block">📞 ${window.escapeHtml(telDisplay)}</a>
          ${isMobil ? `<a href="https://wa.me/${telE164.replace("+", "")}" target="_blank" class="btn btn-success btn-block" style="margin-top:8px">💬 WhatsApp ile Yaz</a>` : ""}
        </div>
      ` : ""}
    `;
    window.openModal?.("isIlanDetailModal");
  }

  // ============== SUB-TAB ==============
  function _setIsIlanAltTur(altTur) {
    if (!IS_ILAN_TURLERI[altTur]) return;
    _isIlanAltTur = altTur;
    document.querySelectorAll("#isilanlariSubTabs .sub-tab").forEach(b => {
      b.classList.toggle("active", b.dataset.sub === altTur);
    });
    loadIsIlanlari();
  }

  function _setIsIlanScope(scope) {
    _isIlanScope = scope;
    document.querySelectorAll("#isilanlariScope .seg-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.scope === scope);
    });
    loadIsIlanlari();
  }

  // ============== FORM ==============
  function _openIsIlanForm() {
    if (!window.currentUser) {
      window.toast?.("İlan vermek için önce giriş yap.", "info", 4000);
      window.openModal?.("registerModal");
      return;
    }
    if (window.currentUser.kullaniciTipi !== "isletme") {
      window.toast?.("İş ilanı verebilmek için işletme hesabı gerekir.", "error", 5000);
      return;
    }
    const form = document.getElementById("isIlanForm");
    if (form) form.reset();
    // İlçe select doldur
    const ilceSel = document.getElementById("isIlanIlce");
    if (ilceSel && ilceSel.options.length <= 1 && Array.isArray(window.ANKARA_ILCELERI)) {
      ilceSel.innerHTML = `<option value="">Seçiniz...</option>` +
        window.ANKARA_ILCELERI.map(i => `<option value="${i}">${i}</option>`).join("");
    }
    // Kategori default: aktif sub-tab
    const turSel = document.getElementById("isIlanTur");
    if (turSel) turSel.value = _isIlanAltTur;
    // Tel ön doldur
    const telInput = document.getElementById("isIlanTel");
    if (telInput && window.currentUser.tel) {
      telInput.value = window.formatTel?.(window.currentUser.tel) || window.currentUser.tel;
    }
    // Kelime sayacı sıfırla
    const counter = document.getElementById("isIlanKelimeSayac");
    if (counter) counter.textContent = "0 / 300 kelime";
    window.openModal?.("isIlanFormModal");
  }

  async function _submitIsIlan(e) {
    e.preventDefault();
    if (!window.currentUser) return;
    const session = window.readStoredSession?.();
    if (!session?.access_token) {
      window.toast?.("Oturumun sona ermiş, tekrar giriş yap.", "error", 5000);
      return;
    }
    const fd = new FormData(e.target);
    const tur = fd.get("tur");
    const baslik = (fd.get("baslik") || "").trim();
    const ilce = fd.get("ilce");
    const aciklama = (fd.get("aciklama") || "").trim();
    const maas_min = parseInt(fd.get("maas_min"), 10);
    const maas_max = parseInt(fd.get("maas_max"), 10);
    const tel_raw = (fd.get("iletisim_tel") || "").trim();
    const kurallar = document.getElementById("isIlanKurallarOnay")?.checked;

    // Validasyonlar
    if (!IS_ILAN_TURLERI[tur]) return window.toast?.("Kategori seç.", "error");
    if (!baslik || baslik.length < 3) return window.toast?.("Başlık en az 3 karakter olmalı.", "error");
    if (baslik.length > 80) return window.toast?.("Başlık 80 karakteri geçemez.", "error");
    if (!ilce) return window.toast?.("İlçe seç.", "error");
    if (!aciklama || aciklama.length < 20) return window.toast?.("Açıklama en az 20 karakter olmalı.", "error");
    const aciklamaErr = _validateUzunForm(aciklama, "Açıklama");
    if (aciklamaErr) return window.toast?.(aciklamaErr, "error", 6000);
    const baslikErr = window._validateIcerik?.(baslik, "Başlık");
    if (baslikErr) return window.toast?.(baslikErr, "error", 6000);
    if (!isNaN(maas_min) && !isNaN(maas_max) && maas_min > maas_max) {
      return window.toast?.("Maaş alt sınırı üst sınırdan büyük olamaz.", "error");
    }
    if (!tel_raw || !window._isMobileTr?.(tel_raw)) {
      return window.toast?.("Geçerli bir cep telefonu gerekli.", "error");
    }
    if (!kurallar) {
      return window.toast?.("İlan Verme Kuralları'nı okuyup onaylamalısın.", "error");
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Gönderiliyor..."; }

    const payload = {
      user_id: window.currentUser.id,
      tur,
      baslik,
      ilce,
      aciklama,
      maas_min: isNaN(maas_min) ? null : maas_min,
      maas_max: isNaN(maas_max) ? null : maas_max,
      iletisim_tel: window._phoneToE164?.(tel_raw) || tel_raw,
      durum: "beklemede"
    };

    const { error } = await window.rawInsert("ilanlar", payload, session.access_token);
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Yayınla"; }
    if (error) {
      window.toast?.("İlan gönderilemedi: " + error.message, "error", 6000);
      return;
    }
    window.closeModals?.();
    window.toast?.("✅ İlanın incelemeye gönderildi. Onaylanınca yayına çıkacak (genelde 4 saat içinde).", "ok", 6000);
    if (_isIlanScope === "mine") loadIsIlanlari();
  }

  // ============== DELETE ==============
  async function _deleteIsIlan(ilanId) {
    if (!window.currentUser) return;
    if (!confirm("Bu ilanı silmek istediğine emin misin?")) return;
    const session = window.readStoredSession?.();
    if (!session?.access_token) {
      window.toast?.("Oturumun sona ermiş, tekrar giriş yap.", "error");
      return;
    }
    try {
      const r = await fetch(`${window.SUPABASE_URL}/rest/v1/ilanlar?id=eq.${ilanId}&user_id=eq.${window.currentUser.id}`, {
        method: "DELETE",
        headers: {
          apikey: window.SUPABASE_KEY,
          Authorization: "Bearer " + session.access_token,
          Prefer: "return=minimal"
        }
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      window.toast?.("İlan silindi.", "ok");
      loadIsIlanlari();
    } catch (e) {
      window.toast?.("Silinemedi: " + (e.message || e), "error");
    }
  }

  // ============== EVENT BINDING ==============
  function _bindEvents() {
    // Sub-tab geçişi
    document.querySelectorAll("#isilanlariSubTabs .sub-tab").forEach(btn => {
      btn.addEventListener("click", () => _setIsIlanAltTur(btn.dataset.sub));
    });
    // Scope (Tümü / İlanlarım)
    document.querySelectorAll("#isilanlariScope .seg-btn").forEach(btn => {
      btn.addEventListener("click", () => _setIsIlanScope(btn.dataset.scope));
    });
    // "+ İş İlanı Ver" butonu
    document.getElementById("isIlanVerBtn")?.addEventListener("click", _openIsIlanForm);
    // Form submit
    document.getElementById("isIlanForm")?.addEventListener("submit", _submitIsIlan);
    // Card click delegasyonu
    document.getElementById("isilanlariListings")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-iict]");
      if (!btn) {
        // Kart genel tıklaması → detay
        const card = e.target.closest(".is-ilan-card");
        if (card) {
          const ilan = _isIlanlar.find(x => x.id === card.dataset.id);
          if (ilan) openIsIlanDetail(ilan);
        }
        return;
      }
      const id = btn.dataset.id;
      const act = btn.dataset.iict;
      if (act === "detay") {
        const ilan = _isIlanlar.find(x => x.id === id);
        if (ilan) openIsIlanDetail(ilan);
      } else if (act === "delete") {
        _deleteIsIlan(id);
      }
    });
    // Kelime sayacı
    document.getElementById("isIlanAciklama")?.addEventListener("input", (e) => {
      const counter = document.getElementById("isIlanKelimeSayac");
      if (!counter) return;
      const n = e.target.value.trim().split(/\s+/).filter(Boolean).length;
      counter.textContent = `${n} / 300 kelime`;
      counter.classList.toggle("over-limit", n > 300);
    });
    // Tab değişiminde modül aktive olunca yükle
    document.querySelectorAll('.content-tab[data-content-tab="isilanlari"]').forEach(t => {
      t.addEventListener("click", () => {
        // Tab değişimi script.js'in kendi handler'ında yapılıyor; biz sadece yükleyiciyi tetikleyelim
        setTimeout(() => {
          if (document.querySelector('.content-tab.active[data-content-tab="isilanlari"]')) {
            loadIsIlanlari();
          }
        }, 50);
      });
    });
  }

  // ============== INIT ==============
  function _init() {
    _bindEvents();
    // Eğer sayfa açılışında isilanlari tab'ı zaten aktifse yükle (deep link)
    if (document.querySelector('.content-tab.active[data-content-tab="isilanlari"]')) {
      loadIsIlanlari();
    }
  }

  // DOM hazır olunca init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init);
  } else {
    _init();
  }

  // Public API (debug + diğer modüllerden çağırma için)
  window.izIsIlani = {
    load: loadIsIlanlari,
    setAltTur: _setIsIlanAltTur,
    setScope: _setIsIlanScope,
    openForm: _openIsIlanForm,
    openDetail: openIsIlanDetail
  };
})();
