// =====================================================================
// script-pazaryeri.js — Faz 2B Pazaryeri (Çekici) modülü (v184)
// =====================================================================
// script-is-ilani.js şablonu — Çekici ilanları için.
// Bağımlılıklar window.* (script.js'ten): rawSelect, rawInsert, readStoredSession,
// openModal, closeModals, toast, escapeHtml, formatTel, _phoneToE164,
// _isMobileTr, _displayPhone, _validateIcerik, currentUser, ANKARA_ILCELERI,
// SUPABASE_URL, SUPABASE_KEY, userReaksiyonlar, openSikayetModal.
// Script tag sırası: supabase-config → script → script-is-ilani → script-pazaryeri
// =====================================================================

(function () {
  "use strict";

  const CEKICI_ARAC_INFO = {
    motor_cekici: { ico: "🏍", label: "Motosiklet" },
    arac_cekici:  { ico: "🚗", label: "Araç" },
    her_ikisi:    { ico: "🚛", label: "Her ikisi" }
  };

  const CEKICI_ETIKETLER = {
    acik_7_24:      { ico: "🕐", label: "7/24 Açık" },
    sehirler_arasi: { ico: "🛣", label: "Şehirler arası" },
    kredi_karti:    { ico: "💳", label: "Kredi kartı geçer" },
    kapora_yok:     { ico: "✅", label: "Kapora yok" },
    garantili:      { ico: "🛡", label: "Garantili / sigortalı" },
    hizli_servis:   { ico: "⚡", label: "30 dk içinde" },
    otoyol_dahil:   { ico: "🛤", label: "Otoyol ücreti dahil" },
    avans_yok:      { ico: "💵", label: "Avans alınmaz" }
  };

  // "Tüm İlçeler" gösterimi için yardımcı
  function _ilceDisplay(ilce) {
    if (!ilce || ilce === "tum") return "Tüm Ankara";
    return ilce + ", Ankara";
  }

  let _cekiciler = [];
  let _cekiciScope = "all";
  let _cekiciIlce = "all";
  let _editingCekiciId = null;

  // ============== HELPERS ==============
  function _validateUzunForm(text, alanAdi = "Açıklama") {
    const baseErr = window._validateIcerik?.(text, alanAdi);
    if (baseErr) return baseErr;
    if (!text) return null;
    const n = text.trim().split(/\s+/).filter(Boolean).length;
    if (n > 300) return `${alanAdi} en fazla 300 kelime olabilir (şu an ${n}).`;
    return null;
  }

  function _formatFiyat(n) {
    if (n == null) return "—";
    return Number(n).toLocaleString("tr-TR") + " ₺";
  }

  function _formatFiyatAralik(min, max) {
    if (min == null && max == null) return "Belirtilmemiş";
    if (min != null && max != null) return _formatFiyat(min) + " — " + _formatFiyat(max);
    if (min != null) return _formatFiyat(min) + " +";
    return "≤ " + _formatFiyat(max);
  }

  function _kisaSayi(n) {
    if (n == null) return "—";
    if (n >= 1000) {
      const k = n / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(".0", "").replace(".", ",")) + "K";
    }
    return String(n);
  }
  function _formatFiyatKisa(min, max) {
    if (min == null && max == null) return "—";
    if (min != null && max != null) return _kisaSayi(min) + "-" + _kisaSayi(max) + " ₺";
    if (min != null) return _kisaSayi(min) + "+ ₺";
    return "≤" + _kisaSayi(max) + " ₺";
  }

  function _durumRozet(durum) {
    if (durum === "beklemede")  return `<span class="durum-rozet durum-bekleme">⏳ İncelemede</span>`;
    if (durum === "reddedildi") return `<span class="durum-rozet durum-red">❌ Reddedildi</span>`;
    if (durum === "onayli")     return `<span class="durum-rozet durum-onay">✅ Onaylı</span>`;
    return "";
  }

  // ============== LOAD ==============
  async function loadCekiciler() {
    const listEl = document.getElementById("pzrCekiciListings");
    const emptyEl = document.getElementById("pzrCekiciEmpty");
    if (!listEl || !emptyEl) return;

    listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px">Yükleniyor...</div>`;
    emptyEl.classList.add("hidden");

    const session = window.readStoredSession?.();
    const isMine = (_cekiciScope === "mine") && window.currentUser;
    const table = isMine ? "ilanlar" : "ilanlar_public";
    const params = new URLSearchParams();
    params.set("select", "*");
    params.set("tur", "eq.cekici");
    if (isMine) params.set("user_id", "eq." + window.currentUser.id);
    if (_cekiciIlce !== "all") params.set("ilce", "eq." + _cekiciIlce);
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
    _cekiciler = Array.isArray(data) ? data : [];

    if (_cekiciler.length && window.currentUser) {
      const userIds = [...new Set(_cekiciler.map(i => i.user_id))];
      const profUrl = `profiles?id=in.(${userIds.join(",")})&select=id,isletme_adi,ad,soyad,puan_ort,puan_sayisi`;
      const { data: profiles } = await window.rawSelect(profUrl, session?.access_token, 5000);
      const map = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      _cekiciler.forEach(i => { i.profile = map[i.user_id]; });
    }

    renderCekiciler();
  }

  // ============== RENDER ==============
  function renderCekiciler() {
    const listEl = document.getElementById("pzrCekiciListings");
    const emptyEl = document.getElementById("pzrCekiciEmpty");
    if (!listEl || !emptyEl) return;

    if (!_cekiciler.length) {
      listEl.innerHTML = "";
      const isMine = _cekiciScope === "mine";
      emptyEl.innerHTML = `
        <div class="empty-icon">🚛</div>
        <h3>${isMine ? "Henüz çekici ilanı vermemişsin" : "Şu an aktif çekici ilanı yok"}</h3>
        <p>${isMine
          ? "Çekici/kurtarıcı hizmeti veriyorsan ilk ilanını verebilirsin."
          : "Çekiciler bölgenizi seçerek hızlı bulabilirsiniz."}
        </p>
      `;
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    listEl.innerHTML = _cekiciler.map(i => buildCekiciCardHTML(i)).join("");
  }

  function buildCekiciCardHTML(i) {
    const aracMeta = CEKICI_ARAC_INFO[i.cekici_arac_tipi] || { ico: "🚛", label: "—" };
    const fiyat = _formatFiyatKisa(i.maas_min, i.maas_max);
    const isOwn = window.currentUser && i.user_id === window.currentUser.id;
    const durumLabel = isOwn ? _durumRozet(i.durum) : "";
    const durumMini = isOwn && durumLabel ? `<div class="iir-durum-mini">${durumLabel}</div>` : "";
    const redBlock = (isOwn && i.durum === "reddedildi" && i.red_sebebi)
      ? `<div class="red-sebebi">❌ <strong>Red sebebi:</strong> ${window.escapeHtml(i.red_sebebi)}</div>`
      : "";

    return `
      <article class="ilan-row is-ilan-row pzr-cekici-row" data-id="${i.id}">
        ${durumMini}
        <div class="ilan-row-cell cell-bolge">
          <span class="cell-ico">📍</span>
          <span class="cell-text">${window.escapeHtml(_ilceDisplay(i.ilce))}</span>
        </div>
        <div class="ilan-row-cell cell-sure">
          <span class="cell-label">Hizmet</span>
          <strong>${aracMeta.ico} ${aracMeta.label}</strong>
        </div>
        <div class="ilan-row-cell cell-kazanc">
          <span class="cell-label">Çağrı başı</span>
          <strong>${fiyat}</strong>
        </div>
        <div class="ilan-row-cell cell-aktif">
          <span class="cell-dot"></span>
          <span class="ilan-aktif-sayac" data-created="${i.created_at}">…</span>
        </div>
        ${redBlock}
      </article>
    `;
  }

  // ============== DETAIL MODAL ==============
  function openCekiciDetail(ilan) {
    const body = document.getElementById("cekiciDetailBody");
    if (!body) return;
    const aracMeta = CEKICI_ARAC_INFO[ilan.cekici_arac_tipi] || { ico: "🚛", label: "—" };
    const isyeriAdi = ilan.isyeri_ad || ilan.profile?.isletme_adi || (ilan.profile ? (ilan.profile.ad + " " + ilan.profile.soyad).trim() : "");
    const tel = ilan.iletisim_tel || ilan.profile?.tel;
    const telDisplay = tel ? (window._displayPhone?.(tel) || tel) : "";
    const telE164 = tel ? (window._phoneToE164?.(tel) || tel) : "";
    const isMobil = tel && window._isMobileTr?.(tel);

    const isAnonim = !window.currentUser;
    const isOwn = window.currentUser && ilan.user_id === window.currentUser.id;
    const durumBlock = isOwn ? _durumRozet(ilan.durum) : "";
    const redBlock = (isOwn && ilan.durum === "reddedildi" && ilan.red_sebebi)
      ? `<div class="iid-red-sebebi"><strong>❌ Bu ilan reddedildi.</strong><br>Sebep: ${window.escapeHtml(ilan.red_sebebi)}</div>`
      : "";
    const bekleyenBlock = (isOwn && ilan.durum === "beklemede")
      ? `<div class="iid-beklemede">⏳ Bu ilan moderatör incelemesinde. Onaylanınca yayına çıkacak (~4 saat).</div>`
      : "";

    let iletisimBlock = "";
    if (ilan.durum === "onayli") {
      if (isAnonim) {
        iletisimBlock = `
          <div class="iid-iletisim iid-anonim-block">
            <div class="iid-anonim-notice">
              🔒 <strong>İletişim bilgilerini görmek için giriş yap.</strong><br>
              <span class="muted small">Telefon ve WhatsApp ile ulaşabilmen için önce kayıtlı olman gerekiyor.</span>
            </div>
            <button type="button" class="btn btn-primary btn-block" id="cidGirisYapBtn" style="margin-top:10px">Giriş Yap / Kayıt Ol</button>
          </div>
        `;
      } else if (tel) {
        iletisimBlock = `
          <div class="iid-iletisim">
            <a href="tel:${telE164}" class="btn btn-primary btn-block">📞 Ara</a>
            ${isMobil ? `<a href="https://wa.me/${telE164.replace("+", "")}" target="_blank" class="btn btn-wa btn-block" style="margin-top:8px">💬 WhatsApp ile Yaz</a>` : ""}
          </div>
        `;
      }
    }

    const etArr = Array.isArray(ilan.etiketler) ? ilan.etiketler : [];
    const etiketBlock = etArr.length
      ? `<div class="iid-etiketler">${etArr.map(k => {
          const m = CEKICI_ETIKETLER[k];
          if (!m) return "";
          return `<span class="iid-etiket-chip">${m.ico} ${m.label}</span>`;
        }).join("")}</div>`
      : "";

    const begen = ilan.begen_sayisi || 0;
    const begenmeme = ilan.begenmeme_sayisi || 0;
    let reaksiyonBlock = "";
    if (!isAnonim && !isOwn && ilan.durum === "onayli") {
      const userRxn = window.userReaksiyonlar?.get?.(ilan.id);
      reaksiyonBlock = `
        <div class="iid-rxn-row">
          <button class="iid-rxn-btn ${userRxn === 'begen' ? 'active' : ''}" data-cct="rxn-up" data-id="${ilan.id}">👍 <span>${begen}</span></button>
          <button class="iid-rxn-btn ${userRxn === 'begenmeme' ? 'active' : ''}" data-cct="rxn-down" data-id="${ilan.id}">👎 <span>${begenmeme}</span></button>
        </div>
      `;
    } else if (isOwn) {
      reaksiyonBlock = `<div class="iid-rxn-info muted small">👍 ${begen} · 👎 ${begenmeme}</div>`;
    }

    const ekstraAksiyon = [];
    ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-cct="share" data-id="${ilan.id}">🔗 Paylaş</button>`);
    if (!isAnonim && !isOwn) {
      ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-cct="report" data-id="${ilan.id}">⚠ Sorun Bildir</button>`);
    }
    if (isOwn) {
      ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-cct="edit" data-id="${ilan.id}">✏ Düzenle</button>`);
      ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-cct="delete" data-id="${ilan.id}" style="color:#dc2626">🗑 Sil</button>`);
    }

    body.innerHTML = `
      <div class="iid-header">
        <span class="iid-kategori">🚛 Çekici Hizmeti</span>
        ${durumBlock}
      </div>
      <h2 class="iid-baslik">${window.escapeHtml(ilan.baslik)}</h2>
      ${bekleyenBlock}
      ${redBlock}
      ${etiketBlock}
      <div class="iid-meta">
        ${isyeriAdi ? `<div>🏢 <strong>${window.escapeHtml(isyeriAdi)}</strong></div>` : ""}
        <div>📍 ${window.escapeHtml(_ilceDisplay(ilan.ilce))}</div>
        <div>${aracMeta.ico} <strong>${aracMeta.label} çekme hizmeti</strong></div>
        <div>💰 Çağrı başı: <strong>${_formatFiyatAralik(ilan.maas_min, ilan.maas_max)}</strong></div>
      </div>
      ${ilan.aciklama ? `<div class="iid-aciklama">${window.escapeHtml(ilan.aciklama).replace(/\n/g, "<br>")}</div>` : ""}
      ${reaksiyonBlock}
      ${iletisimBlock}
      <div class="iid-ekstra-aksiyon">${ekstraAksiyon.join("")}</div>
    `;
    window.openModal?.("cekiciDetailModal");

    document.getElementById("cidGirisYapBtn")?.addEventListener("click", () => {
      window.closeModals?.();
      setTimeout(() => window.openModal?.("loginModal"), 100);
    });
  }

  // ============== SCOPE ==============
  function _setCekiciScope(scope) {
    _cekiciScope = scope;
    document.querySelectorAll("#pzrCekiciScope .seg-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.scope === scope);
    });
    loadCekiciler();
  }

  // ============== FORM ==============
  async function _openCekiciForm(editIlan = null) {
    if (!window.currentUser) {
      window.toast?.("İlan vermek için önce giriş yap.", "info", 4000);
      window.openModal?.("registerModal");
      return;
    }
    if (window.currentUser.kullaniciTipi !== "isletme") {
      window.toast?.("Çekici ilanı verebilmek için işletme hesabı gerekir.", "error", 5000);
      return;
    }
    // Form açılışında DB'den taze profile çek (cache stale olabilir)
    if (!editIlan) {
      const session = window.readStoredSession?.();
      if (session?.access_token) {
        try {
          const { data } = await window.rawSelect(
            `profiles?id=eq.${window.currentUser.id}&select=isletme_adi,tel,is_telefonu`,
            session.access_token, 5000
          );
          const p = Array.isArray(data) && data[0];
          if (p) {
            window.currentUser.isletmeAdi = p.isletme_adi || "";
            window.currentUser.tel = p.tel || "";
            window.currentUser.isTelefonu = p.is_telefonu || "";
          }
        } catch (e) { console.warn("[cekiciForm profile refresh]", e); }
      }
      if (!window.currentUser.isletmeAdi || !window.currentUser.tel) {
        window.toast?.("Önce profilinden işletme adını ve cep telefonunu tamamla.", "info", 6000);
        setTimeout(() => {
          if (typeof window.openProfileModal === "function") window.openProfileModal();
          else window.openModal?.("profileModal");
        }, 800);
        return;
      }
    }

    _editingCekiciId = editIlan ? editIlan.id : null;
    const form = document.getElementById("cekiciForm");
    if (form) form.reset();

    const title = document.querySelector("#cekiciFormModal h2");
    const submitBtn = form?.querySelector('button[type="submit"]');
    if (editIlan) {
      if (title) title.textContent = "✏ Çekici İlanını Düzenle";
      if (submitBtn) submitBtn.textContent = "Güncelle";
    } else {
      if (title) title.textContent = "🚛 Çekici İlanı Ver";
      if (submitBtn) submitBtn.textContent = "Yayınla";
    }

    // İlçe dropdown'ı: HTML'de 2 statik option var (Seçiniz + Tüm İlçeler).
    // 25 Ankara ilçesini sadece bir kez append et.
    const ilceSel = document.getElementById("cekiciIlce");
    if (ilceSel && ilceSel.options.length <= 2 && Array.isArray(window.ANKARA_ILCELERI)) {
      window.ANKARA_ILCELERI.forEach(i => ilceSel.appendChild(new Option(i, i)));
    }

    if (editIlan) {
      document.getElementById("cekiciAracTipi").value = editIlan.cekici_arac_tipi || "";
      document.getElementById("cekiciBaslik").value = editIlan.baslik || "";
      document.getElementById("cekiciIsyeriAd").value = editIlan.isyeri_ad || "";
      if (ilceSel) ilceSel.value = editIlan.ilce || "";
      const fMin = document.getElementById("cekiciFiyatMin");
      if (fMin) {
        fMin.value = editIlan.maas_min != null ? Number(editIlan.maas_min).toLocaleString("tr-TR") : "";
        _updateFiyatPreview(fMin, document.getElementById("cekiciFiyatMinPreview"));
      }
      const fMax = document.getElementById("cekiciFiyatMax");
      if (fMax) {
        fMax.value = editIlan.maas_max != null ? Number(editIlan.maas_max).toLocaleString("tr-TR") : "";
        _updateFiyatPreview(fMax, document.getElementById("cekiciFiyatMaxPreview"));
      }
      document.getElementById("cekiciAciklama").value = editIlan.aciklama || "";
      const telInput = document.getElementById("cekiciTel");
      if (telInput) telInput.value = window.formatTel?.(editIlan.iletisim_tel) || editIlan.iletisim_tel || "";
      const etArr = Array.isArray(editIlan.etiketler) ? editIlan.etiketler : [];
      document.querySelectorAll('#cekiciForm input[name=cekici_etiket]').forEach(cb => {
        cb.checked = etArr.includes(cb.value);
      });
      document.getElementById("cekiciAdHint")?.classList.add("hidden");
      const counter = document.getElementById("cekiciKelimeSayac");
      const n = (editIlan.aciklama || "").trim().split(/\s+/).filter(Boolean).length;
      if (counter) counter.textContent = `${n} / 300 kelime`;
    } else {
      const adInput = document.getElementById("cekiciIsyeriAd");
      const adHint = document.getElementById("cekiciAdHint");
      if (adInput && window.currentUser.isletmeAdi) {
        adInput.value = window.currentUser.isletmeAdi;
        adHint?.classList.remove("hidden");
      } else {
        adHint?.classList.add("hidden");
      }
      const telInput = document.getElementById("cekiciTel");
      const userTel = window.currentUser?.tel || window.currentUser?.isTelefonu || "";
      if (telInput && userTel) {
        try { telInput.value = window.formatTel?.(userTel) || userTel; }
        catch (e) { telInput.value = userTel; }
      } else if (telInput) {
        telInput.value = "";
      }
      document.querySelectorAll('#cekiciForm input[name=cekici_etiket]').forEach(cb => { cb.checked = false; });
      ["cekiciFiyatMin", "cekiciFiyatMax"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
      ["cekiciFiyatMinPreview", "cekiciFiyatMaxPreview"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
      });
      const counter = document.getElementById("cekiciKelimeSayac");
      if (counter) counter.textContent = "0 / 300 kelime";
    }

    window.openModal?.("cekiciFormModal");
  }

  function _updateFiyatPreview(input, previewEl) {
    if (!input || !previewEl) return;
    const raw = (input.value || "").replace(/\D/g, "");
    if (!raw) { previewEl.textContent = ""; return; }
    const n = parseInt(raw, 10);
    if (isNaN(n) || n <= 0) { previewEl.textContent = ""; return; }
    if (n >= 1000) {
      const k = n / 1000;
      const kStr = (k % 1 === 0) ? k.toFixed(0) : k.toFixed(1).replace(".", ",");
      previewEl.textContent = "= " + kStr + " bin ₺";
    } else {
      previewEl.textContent = "= " + n + " ₺";
    }
  }
  function _bindFiyatInput(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input) return;
    input.addEventListener("input", () => {
      const raw = (input.value || "").replace(/\D/g, "");
      const clipped = raw.slice(0, 9);
      input.value = clipped ? parseInt(clipped, 10).toLocaleString("tr-TR") : "";
      _updateFiyatPreview(input, preview);
    });
  }

  function _bindEditHints() {
    const telInput = document.getElementById("cekiciTel");
    if (telInput) {
      const warn = () => {
        window.toast?.("🔒 İletişim numarası düzenlenemez. Kayıtlı cep numaran kullanılır. Değiştirmek için Profilim → Güvenlik.", "info", 5000);
      };
      telInput.addEventListener("click", warn);
      telInput.addEventListener("focus", warn);
    }
  }

  async function _submitCekici(e) {
    e.preventDefault();
    if (!window.currentUser) return;
    const session = window.readStoredSession?.();
    if (!session?.access_token) {
      window.toast?.("Oturumun sona ermiş, tekrar giriş yap.", "error", 5000);
      return;
    }
    const fd = new FormData(e.target);
    const arac_tipi = fd.get("cekici_arac_tipi");
    const baslik = (fd.get("baslik") || "").trim();
    const isyeri_ad = (fd.get("isyeri_ad") || "").trim();
    const ilce = fd.get("ilce");
    const aciklama = (fd.get("aciklama") || "").trim();
    const maas_min = parseInt((fd.get("maas_min") || "").replace(/\D/g, ""), 10);
    const maas_max = parseInt((fd.get("maas_max") || "").replace(/\D/g, ""), 10);
    const tel_raw = (fd.get("iletisim_tel") || "").trim();
    const kurallar = document.getElementById("cekiciKurallarOnay")?.checked;

    if (!CEKICI_ARAC_INFO[arac_tipi]) return window.toast?.("Araç tipi seç.", "error");
    if (!baslik || baslik.length < 3) return window.toast?.("Başlık en az 3 karakter olmalı.", "error");
    if (baslik.length > 80) return window.toast?.("Başlık 80 karakteri geçemez.", "error");
    if (!isyeri_ad || isyeri_ad.length < 2) return window.toast?.("İşyeri / firma adı zorunlu.", "error");
    if (!ilce) return window.toast?.("Hizmet bölgesi (ilçe) zorunlu.", "error");
    if (!aciklama || aciklama.length < 20) return window.toast?.("Açıklama en az 20 karakter olmalı.", "error");
    const aciklamaErr = _validateUzunForm(aciklama, "Açıklama");
    if (aciklamaErr) return window.toast?.(aciklamaErr, "error", 6000);
    const baslikErr = window._validateIcerik?.(baslik, "Başlık");
    if (baslikErr) return window.toast?.(baslikErr, "error", 6000);
    const isyeriAdErr = window._validateIcerik?.(isyeri_ad, "İşyeri adı");
    if (isyeriAdErr) return window.toast?.(isyeriAdErr, "error", 6000);
    if (!isNaN(maas_min) && !isNaN(maas_max) && maas_min > maas_max) {
      return window.toast?.("Çağrı başı alt sınır üst sınırdan büyük olamaz.", "error");
    }
    // Mantık dışı fiyat uyarısı: <100 veya >50K
    const checkFiyat = (n, label) => {
      if (isNaN(n)) return null;
      if (n > 0 && n < 100) return `${label} 100 ₺ altında — kontrol et.`;
      if (n > 50000) return `${label} 50.000 ₺ üstünde — fazla yüksek görünüyor, kontrol et.`;
      return null;
    };
    const minErr = checkFiyat(maas_min, "Çağrı başı alt sınır");
    const maxErr = checkFiyat(maas_max, "Çağrı başı üst sınır");
    if (minErr) return window.toast?.(minErr, "error", 6000);
    if (maxErr) return window.toast?.(maxErr, "error", 6000);
    if (!tel_raw || !window._isMobileTr?.(tel_raw)) {
      return window.toast?.("Geçerli bir cep telefonu gerekli.", "error");
    }
    if (!kurallar) return window.toast?.("İlan Verme Kuralları'nı okuyup onaylamalısın.", "error");

    const etiketler = Array.from(
      document.querySelectorAll('#cekiciForm input[name=cekici_etiket]:checked')
    ).map(cb => cb.value);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitBtnText = _editingCekiciId ? "Güncelle" : "Yayınla";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = _editingCekiciId ? "Güncelleniyor..." : "Gönderiliyor..."; }

    // 30 gün yayın süresi
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      tur: "cekici",
      cekici_arac_tipi: arac_tipi,
      baslik,
      isyeri_ad,
      isyeri_adres: null,
      ilce,
      aciklama,
      maas_min: isNaN(maas_min) ? null : maas_min,
      maas_max: isNaN(maas_max) ? null : maas_max,
      iletisim_tel: window._phoneToE164?.(tel_raw) || tel_raw,
      etiketler,
      durum: "beklemede",
      red_sebebi: null,
      expires_at
    };

    let error = null;
    if (_editingCekiciId) {
      try {
        const r = await fetch(`${window.SUPABASE_URL}/rest/v1/ilanlar?id=eq.${_editingCekiciId}&user_id=eq.${window.currentUser.id}`, {
          method: "PATCH",
          headers: {
            apikey: window.SUPABASE_KEY,
            Authorization: "Bearer " + session.access_token,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify(payload)
        });
        if (!r.ok) error = { message: "HTTP " + r.status + " — " + (await r.text()) };
      } catch (e) { error = { message: e.message || String(e) }; }
    } else {
      payload.user_id = window.currentUser.id;
      const result = await window.rawInsert("ilanlar", payload, session.access_token);
      error = result.error;
    }

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtnText; }
    if (error) {
      window.toast?.((_editingCekiciId ? "Güncellenemedi: " : "İlan gönderilemedi: ") + error.message, "error", 6000);
      return;
    }
    const wasEditing = !!_editingCekiciId;
    _editingCekiciId = null;
    window.closeModals?.();
    window.toast?.(wasEditing
      ? "✅ İlanın güncellendi — değişiklik nedeniyle tekrar moderatör incelemesinde."
      : "✅ İlanın incelemeye gönderildi. Onaylanınca yayına çıkacak (~4 saat).",
      "ok", 6000
    );
    loadCekiciler();
  }

  async function _deleteCekici(ilanId) {
    if (!window.currentUser) return;
    if (!confirm("Bu çekici ilanını silmek istediğine emin misin?")) return;
    const session = window.readStoredSession?.();
    if (!session?.access_token) return;
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
      loadCekiciler();
    } catch (e) {
      window.toast?.("Silinemedi: " + (e.message || e), "error");
    }
  }

  // ============== ACTION DISPATCHER ==============
  function _handleCekiciAction(act, id) {
    if (!id) return;
    const ilan = _cekiciler.find(x => x.id === id);

    if (act === "delete") { _deleteCekici(id); return; }
    if (act === "edit") { if (ilan) _openCekiciForm(ilan); return; }
    if (act === "share") { _copyCekiciLink(id); return; }
    if (act === "report") {
      if (!window.currentUser) {
        window.toast?.("Sorun bildirmek için giriş yap.", "info", 4000);
        window.openModal?.("loginModal");
        return;
      }
      if (typeof window.openSikayetModal === "function") window.openSikayetModal(id);
      else window.toast?.("Şikayet sistemi şu an kullanılamıyor.", "error");
      return;
    }
    if (act === "rxn-up" || act === "rxn-down") {
      if (!window.currentUser) {
        window.toast?.("Reaksiyon vermek için giriş yap.", "info", 4000);
        window.openModal?.("loginModal");
        return;
      }
      _toggleCekiciRxn(id, act === "rxn-up" ? "begen" : "begenmeme");
    }
  }

  async function _toggleCekiciRxn(ilanId, tip) {
    const session = window.readStoredSession?.();
    if (!session?.access_token) return;
    const userId = window.currentUser.id;
    const base = `${window.SUPABASE_URL}/rest/v1/reaksiyonlar`;
    const headers = {
      apikey: window.SUPABASE_KEY,
      Authorization: "Bearer " + session.access_token,
      "Content-Type": "application/json"
    };
    try {
      const checkRes = await fetch(`${base}?user_id=eq.${userId}&ilan_id=eq.${ilanId}&select=tip`, { headers });
      const existing = checkRes.ok ? await checkRes.json() : [];
      if (existing.length > 0) {
        const label = existing[0].tip === "begen" ? "👍 Beğendin" : "👎 Beğenmedin";
        window.toast?.(`Bu ilana zaten reaksiyon verdin (${label}). Geri alınamaz.`, "info", 4500);
        return;
      }
    } catch (e) { /* ignore */ }

    const ilan = _cekiciler.find(x => x.id === ilanId);
    if (ilan) {
      if (tip === "begen") ilan.begen_sayisi = (ilan.begen_sayisi || 0) + 1;
      else ilan.begenmeme_sayisi = (ilan.begenmeme_sayisi || 0) + 1;
      renderCekiciler();
    }
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: userId, ilan_id: ilanId, tip })
      });
      if (!res.ok) {
        if (ilan) {
          if (tip === "begen") ilan.begen_sayisi = Math.max(0, (ilan.begen_sayisi || 1) - 1);
          else ilan.begenmeme_sayisi = Math.max(0, (ilan.begenmeme_sayisi || 1) - 1);
          renderCekiciler();
        }
        const text = await res.text();
        if (text.includes("REAKSIYON_HIZ_LIMITI")) {
          window.toast?.("⏱ Çok hızlı reaksiyon — biraz yavaşla.", "error", 5000);
        } else {
          window.toast?.("Reaksiyon kaydedilemedi.", "error");
        }
        return;
      }
      const ikon = tip === "begen" ? "👍" : "👎";
      window.toast?.(`${ikon} Reaksiyonun kaydedildi. (Geri alınamaz)`, "ok", 3000);
      await loadCekiciler();
    } catch (e) {
      if (ilan) {
        if (tip === "begen") ilan.begen_sayisi = Math.max(0, (ilan.begen_sayisi || 1) - 1);
        else ilan.begenmeme_sayisi = Math.max(0, (ilan.begenmeme_sayisi || 1) - 1);
        renderCekiciler();
      }
    }
  }

  async function _copyCekiciLink(ilanId) {
    const ilan = _cekiciler.find(x => x.id === ilanId);
    const url = `${window.location.origin}/ilan/${ilanId}`;
    const title = ilan ? `Çekici: ${ilan.baslik}` : "İzinci Kurye Çekici İlanı";
    const text = ilan
      ? `${ilan.baslik}\n📍 ${ilan.ilce} · 💰 ${_formatFiyatAralik(ilan.maas_min, ilan.maas_max)}\n${url}`
      : url;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; }
      catch (e) { if (e?.name === "AbortError") return; }
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        window.toast?.("🔗 İlan bağlantısı kopyalandı.", "ok", 3000);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url; ta.style.position = "fixed"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        window.toast?.("🔗 Bağlantı kopyalandı.", "ok", 3000);
      }
    } catch (e) {
      window.toast?.("Kopyalanamadı: " + url, "info", 5000);
    }
  }

  // ============== SUB-TAB (Pazaryeri içi) ==============
  function _setPazaryeriSubTab(sub) {
    document.querySelectorAll("#pazaryeriSubTabs .sub-tab").forEach(b => {
      b.classList.toggle("active", b.dataset.pzr === sub);
    });
    const panels = {
      cekici: "pzrCekiciPanel",
      tamir: "pzrTamirPanel",
      satis: "pzrSatisPanel",
      muhasebe: "pzrMuhasebePanel"
    };
    Object.entries(panels).forEach(([k, id]) => {
      document.getElementById(id)?.classList.toggle("hidden", k !== sub);
    });
    if (sub === "cekici") loadCekiciler();
    // Hash persistance
    try { history.replaceState({}, "", "#pazaryeri-" + sub); } catch (e) {}
  }

  // ============== EVENT BINDING ==============
  function _bindEvents() {
    document.querySelectorAll("#pazaryeriSubTabs .sub-tab").forEach(btn => {
      btn.addEventListener("click", () => _setPazaryeriSubTab(btn.dataset.pzr));
    });
    document.querySelectorAll("#pzrCekiciScope .seg-btn").forEach(btn => {
      btn.addEventListener("click", () => _setCekiciScope(btn.dataset.scope));
    });
    // arrow ile sar — event parametresi editIlan olmasın (CLAUDE.md tuzak #62)
    document.getElementById("pzrCekiciVerBtn")?.addEventListener("click", () => _openCekiciForm());
    document.getElementById("cekiciForm")?.addEventListener("submit", _submitCekici);
    _bindEditHints();
    _bindFiyatInput("cekiciFiyatMin", "cekiciFiyatMinPreview");
    _bindFiyatInput("cekiciFiyatMax", "cekiciFiyatMaxPreview");

    document.getElementById("pzrCekiciListings")?.addEventListener("click", (e) => {
      const actBtn = e.target.closest("[data-cct]");
      if (actBtn) {
        e.stopPropagation();
        _handleCekiciAction(actBtn.dataset.cct, actBtn.dataset.id);
        return;
      }
      const row = e.target.closest(".pzr-cekici-row");
      if (row) {
        const ilan = _cekiciler.find(x => x.id === row.dataset.id);
        if (ilan) openCekiciDetail(ilan);
      }
    });

    document.getElementById("cekiciDetailBody")?.addEventListener("click", (e) => {
      const actBtn = e.target.closest("[data-cct]");
      if (!actBtn) return;
      e.stopPropagation();
      _handleCekiciAction(actBtn.dataset.cct, actBtn.dataset.id);
    });

    document.getElementById("pzrCekiciIlceFilter")?.addEventListener("change", (e) => {
      _cekiciIlce = e.target.value || "all";
      loadCekiciler();
    });

    document.getElementById("cekiciAciklama")?.addEventListener("input", (e) => {
      const counter = document.getElementById("cekiciKelimeSayac");
      if (!counter) return;
      const n = e.target.value.trim().split(/\s+/).filter(Boolean).length;
      counter.textContent = `${n} / 300 kelime`;
      counter.classList.toggle("over-limit", n > 300);
    });

    // Pazaryeri tab'ı aktive olunca yükle
    document.querySelectorAll('.content-tab[data-content-tab="pazaryeri"]').forEach(t => {
      t.addEventListener("click", () => {
        setTimeout(() => {
          if (document.querySelector('.content-tab.active[data-content-tab="pazaryeri"]')) {
            const aktifSub = document.querySelector("#pazaryeriSubTabs .sub-tab.active")?.dataset.pzr || "cekici";
            if (aktifSub === "cekici") loadCekiciler();
          }
        }, 50);
      });
    });
  }

  function _init() {
    _bindEvents();
    const ilceFilter = document.getElementById("pzrCekiciIlceFilter");
    if (ilceFilter && ilceFilter.options.length <= 1 && Array.isArray(window.ANKARA_ILCELERI)) {
      window.ANKARA_ILCELERI.forEach(i => ilceFilter.appendChild(new Option(i, i)));
    }
    // Hash bazlı sub-tab açılışı (#pazaryeri-cekici vb)
    const hash = window.location.hash || "";
    if (hash.startsWith("#pazaryeri-")) {
      const sub = hash.replace("#pazaryeri-", "");
      if (["cekici", "tamir", "satis", "muhasebe"].includes(sub)) {
        _setPazaryeriSubTab(sub);
      }
    }
    if (document.querySelector('.content-tab.active[data-content-tab="pazaryeri"]')) {
      const aktifSub = document.querySelector("#pazaryeriSubTabs .sub-tab.active")?.dataset.pzr || "cekici";
      if (aktifSub === "cekici") loadCekiciler();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init);
  } else {
    _init();
  }

  window.izPazaryeri = {
    load: loadCekiciler,
    setSubTab: _setPazaryeriSubTab,
    setScope: _setCekiciScope,
    openForm: _openCekiciForm,
    openDetail: openCekiciDetail
  };
})();
