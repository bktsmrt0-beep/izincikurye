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
    part_time:     { label: "Part Time Kurye",   emoji: "⏰" },
    esnaf_kurye:   { label: "Esnaf Kurye",       emoji: "🏪" },
    arabali_kurye: { label: "Arabalı Kurye",     emoji: "🚗" }
  };

  // İş ilanı etiketleri (v158) — anlık ilan etiketlerinden bağımsız set
  const IS_ILAN_ETIKETLER = {
    yemek_dahil:        { ico: "🍽", label: "Yemek dahil" },
    yol_servis:         { ico: "🚌", label: "Yol/Servis var" },
    sgk_sigorta:        { ico: "📋", label: "SGK + Sigorta" },
    acil_alim:          { ico: "🆘", label: "Acil işe alım" },
    tecrube_gerekmez:   { ico: "🎓", label: "Tecrübe gerekmez" },
    esnek_saat:         { ico: "⏰", label: "Esnek saat" },
    prim_bahsis:        { ico: "💰", label: "Prim/Bahşiş" },
    hafta_sonu_izin:    { ico: "📅", label: "Hafta sonu izinli" }
  };

  let _isIlanAltTur = "tam_zamanli";    // aktif sub-tab
  let _isIlanlar = [];                   // yüklenen ilanlar
  let _isIlanScope = "all";              // "all" | "mine"
  let _isIlanIlce = "all";               // ilçe filtresi
  let _editingIsIlanId = null;           // düzenleme modunda mı?

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

  // Kısa maaş formatı — kart için (25000 → 25K, range 25-35K ₺)
  function _kisaSayi(n) {
    if (n == null) return "—";
    if (n >= 1000) {
      const k = n / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace(".0", "").replace(".", ",")) + "K";
    }
    return String(n);
  }
  function _formatMaasKisa(min, max) {
    if (min == null && max == null) return "—";
    if (min != null && max != null) return _kisaSayi(min) + "-" + _kisaSayi(max) + " ₺";
    if (min != null) return _kisaSayi(min) + "+ ₺";
    return "≤" + _kisaSayi(max) + " ₺";
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
    if (_isIlanIlce !== "all") params.set("ilce", "eq." + _isIlanIlce);
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
    const isletme = i.isyeri_ad || i.profile?.isletme_adi || (i.profile ? (i.profile.ad + " " + i.profile.soyad).trim() : "");
    const maas = _formatMaasKisa(i.maas_min, i.maas_max);  // kart için kısa (25K-35K ₺)
    const isOwn = window.currentUser && i.user_id === window.currentUser.id;
    const isAnonim = !window.currentUser;
    const durumLabel = isOwn ? _durumRozet(i.durum) : "";

    const redBlock = (isOwn && i.durum === "reddedildi" && i.red_sebebi)
      ? `<div class="red-sebebi">❌ <strong>Red sebebi:</strong> ${window.escapeHtml(i.red_sebebi)}</div>`
      : "";

    // Etiketler kart üstünde gösterilmez (compact için) — etiket sayısı varsa küçük rozet
    const etArr = Array.isArray(i.etiketler) ? i.etiketler : [];
    const etiketRozet = etArr.length
      ? `<span class="iir-etiket-sayi" title="${etArr.map(k => IS_ILAN_ETIKETLER[k]?.label || k).filter(Boolean).join(', ')}">🏷 ${etArr.length}</span>`
      : "";

    // Reaksiyon sayaçları (anlık ilan ile aynı kolon — DB seviyesinde paylaşılan)
    const begen = i.begen_sayisi || 0;
    const begenmeme = i.begenmeme_sayisi || 0;
    const net = begen - begenmeme;
    const netRozet = net > 0
      ? `<span class="net-rxn-pos">👍 +${net}</span>`
      : net < 0 ? `<span class="net-rxn-neg">👎 ${net}</span>` : "";

    // Aksiyon butonları satırı (Paylaş + Bildir + Düzenle + Sil)
    const aksiyonlar = [];
    aksiyonlar.push(`<button class="iir-act" data-iict="share" data-id="${i.id}" title="Paylaş">🔗</button>`);
    if (!isAnonim && !isOwn) {
      aksiyonlar.push(`<button class="iir-act" data-iict="rxn-up" data-id="${i.id}" title="Beğen">👍</button>`);
      aksiyonlar.push(`<button class="iir-act" data-iict="rxn-down" data-id="${i.id}" title="Beğenmeme">👎</button>`);
      aksiyonlar.push(`<button class="iir-act" data-iict="report" data-id="${i.id}" title="Sorun Bildir">⚠</button>`);
    }
    if (isOwn) {
      aksiyonlar.push(`<button class="iir-act" data-iict="edit" data-id="${i.id}" title="Düzenle">✏</button>`);
      aksiyonlar.push(`<button class="iir-act iir-act-danger" data-iict="delete" data-id="${i.id}" title="Sil">🗑</button>`);
    }

    // Compact (v169) — meta + aksiyon tek cell'de birleşik, mobilde sığsın
    return `
      <article class="is-ilan-row" data-id="${i.id}">
        <div class="iir-cell iir-isletme-baslik" title="${window.escapeHtml(turMeta.label)}">
          <span class="iir-isletme-ad">🏢 ${window.escapeHtml(isletme || "İlan")}</span>
        </div>
        <div class="iir-cell iir-ilce">
          <span class="cell-text">📍 ${window.escapeHtml(i.ilce)}</span>
        </div>
        <div class="iir-cell iir-maas">
          <strong class="iir-maas-val">${maas}</strong>
        </div>
        <div class="iir-cell iir-aksiyon">
          <div class="iir-rozet-row">${etiketRozet}${netRozet}${durumLabel}</div>
          <div class="iir-act-row">${aksiyonlar.join("")}</div>
        </div>
        ${redBlock}
      </article>
    `;
  }

  // ============== DETAIL MODAL ==============
  function openIsIlanDetail(ilan) {
    const body = document.getElementById("isIlanDetailBody");
    if (!body) return;
    const turMeta = IS_ILAN_TURLERI[ilan.tur] || { label: ilan.tur, emoji: "💼" };
    // İşyeri adı: ilan.isyeri_ad öncelikli (form'dan), yoksa profile.isletme_adi fallback
    const isyeriAdi = ilan.isyeri_ad || ilan.profile?.isletme_adi || (ilan.profile ? (ilan.profile.ad + " " + ilan.profile.soyad).trim() : "");
    // İşyeri adresi iş ilanlarında kullanılmaz (v161) — sadece ilçe gösterilir
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
      ? `<div class="iid-beklemede">⏳ Bu ilan moderatör incelemesinde. Onaylanınca yayına çıkacak (genelde 4 saat içinde).</div>`
      : "";

    // İletişim bölümü: anonim → Kayıt Ol CTA, kayıtlı → Ara + WhatsApp
    let iletisimBlock = "";
    if (ilan.durum === "onayli") {
      if (isAnonim) {
        iletisimBlock = `
          <div class="iid-iletisim iid-anonim-block">
            <div class="iid-anonim-notice">
              🔒 <strong>İletişim bilgilerini görmek için giriş yap.</strong><br>
              <span class="muted small">Telefon ve WhatsApp ile ulaşabilmen için önce kayıtlı olman gerekiyor.</span>
            </div>
            <button type="button" class="btn btn-primary btn-block" id="iidGirisYapBtn" style="margin-top:10px">Giriş Yap / Kayıt Ol</button>
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

    // Etiketler
    const etArr = Array.isArray(ilan.etiketler) ? ilan.etiketler : [];
    const etiketBlock = etArr.length
      ? `<div class="iid-etiketler">${etArr.map(k => {
          const meta = IS_ILAN_ETIKETLER[k];
          if (!meta) return "";
          return `<span class="iid-etiket-chip">${meta.ico} ${meta.label}</span>`;
        }).join("")}</div>`
      : "";

    // Reaksiyon butonları (kayıtlı kullanıcı + sahibi olmayan)
    const begen = ilan.begen_sayisi || 0;
    const begenmeme = ilan.begenmeme_sayisi || 0;
    let reaksiyonBlock = "";
    if (!isAnonim && !isOwn && ilan.durum === "onayli") {
      const userRxn = window.userReaksiyonlar?.get?.(ilan.id);  // anlık ilan ile aynı Map
      reaksiyonBlock = `
        <div class="iid-rxn-row">
          <button class="iid-rxn-btn ${userRxn === 'begen' ? 'active' : ''}" data-iict="rxn-up" data-id="${ilan.id}">👍 <span>${begen}</span></button>
          <button class="iid-rxn-btn ${userRxn === 'begenmeme' ? 'active' : ''}" data-iict="rxn-down" data-id="${ilan.id}">👎 <span>${begenmeme}</span></button>
        </div>
      `;
    } else if (isOwn) {
      reaksiyonBlock = `<div class="iid-rxn-info muted small">👍 ${begen} · 👎 ${begenmeme}</div>`;
    }

    // Paylaş + Bildir butonları
    const ekstraAksiyon = [];
    ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-iict="share" data-id="${ilan.id}">🔗 Paylaş</button>`);
    if (!isAnonim && !isOwn) {
      ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-iict="report" data-id="${ilan.id}">⚠ Sorun Bildir</button>`);
    }
    if (isOwn) {
      ekstraAksiyon.push(`<button type="button" class="btn btn-ghost btn-sm" data-iict="edit" data-id="${ilan.id}">✏ Düzenle</button>`);
    }

    body.innerHTML = `
      <div class="iid-header">
        <span class="iid-kategori">${turMeta.emoji} ${turMeta.label}</span>
        ${durumBlock}
      </div>
      <h2 class="iid-baslik">${window.escapeHtml(ilan.baslik)}</h2>
      ${bekleyenBlock}
      ${redBlock}
      ${etiketBlock}
      <div class="iid-meta">
        ${isyeriAdi ? `<div>🏢 <strong>${window.escapeHtml(isyeriAdi)}</strong></div>` : ""}
        <div>📍 ${window.escapeHtml(ilan.ilce)} (Ankara)</div>
        <div>💰 ${_formatMaasAralik(ilan.maas_min, ilan.maas_max)}</div>
      </div>
      ${ilan.aciklama ? `<div class="iid-aciklama">${window.escapeHtml(ilan.aciklama).replace(/\n/g, "<br>")}</div>` : ""}
      ${reaksiyonBlock}
      ${iletisimBlock}
      <div class="iid-ekstra-aksiyon">${ekstraAksiyon.join("")}</div>
    `;
    window.openModal?.("isIlanDetailModal");

    // Anonim için Giriş Yap butonu
    document.getElementById("iidGirisYapBtn")?.addEventListener("click", () => {
      window.closeModals?.();
      setTimeout(() => window.openModal?.("loginModal"), 100);
    });
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
  function _openIsIlanForm(editIlan = null) {
    if (!window.currentUser) {
      window.toast?.("İlan vermek için önce giriş yap.", "info", 4000);
      window.openModal?.("registerModal");
      return;
    }
    if (window.currentUser.kullaniciTipi !== "isletme") {
      window.toast?.("İş ilanı verebilmek için işletme hesabı gerekir.", "error", 5000);
      return;
    }

    _editingIsIlanId = editIlan ? editIlan.id : null;
    const form = document.getElementById("isIlanForm");
    if (form) form.reset();

    // Modal başlık + buton metni — edit modunda
    const title = document.querySelector("#isIlanFormModal h2");
    const submitBtn = form?.querySelector('button[type="submit"]');
    if (editIlan) {
      if (title) title.textContent = "✏ İş İlanını Düzenle";
      if (submitBtn) submitBtn.textContent = "Güncelle";
    } else {
      if (title) title.textContent = "💼 İş İlanı Ver";
      if (submitBtn) submitBtn.textContent = "Yayınla";
    }

    // İlçe select doldur (ilk açılışta)
    const ilceSel = document.getElementById("isIlanIlce");
    if (ilceSel && ilceSel.options.length <= 1 && Array.isArray(window.ANKARA_ILCELERI)) {
      ilceSel.innerHTML = `<option value="">Seçiniz...</option>` +
        window.ANKARA_ILCELERI.map(i => `<option value="${i}">${i}</option>`).join("");
    }

    // Kategori
    const turSel = document.getElementById("isIlanTur");
    if (turSel) turSel.value = editIlan ? editIlan.tur : _isIlanAltTur;

    if (editIlan) {
      // EDIT — mevcut değerleri yükle
      const baslikInput = document.querySelector("#isIlanForm [name=baslik]");
      if (baslikInput) baslikInput.value = editIlan.baslik || "";
      const adInput = document.getElementById("isIlanIsyeriAd");
      if (adInput) adInput.value = editIlan.isyeri_ad || "";
      if (ilceSel) ilceSel.value = editIlan.ilce || "";
      const maasMin = document.getElementById("isIlanMaasMin");
      if (maasMin) maasMin.value = editIlan.maas_min ?? "";
      const maasMax = document.getElementById("isIlanMaasMax");
      if (maasMax) maasMax.value = editIlan.maas_max ?? "";
      const aciklamaTa = document.getElementById("isIlanAciklama");
      if (aciklamaTa) aciklamaTa.value = editIlan.aciklama || "";
      const telInput = document.getElementById("isIlanTel");
      if (telInput) telInput.value = window.formatTel?.(editIlan.iletisim_tel) || editIlan.iletisim_tel || "";
      // Etiket checkbox'larını işaretle
      const etArr = Array.isArray(editIlan.etiketler) ? editIlan.etiketler : [];
      document.querySelectorAll('#isIlanForm input[name=isilan_etiket]').forEach(cb => {
        cb.checked = etArr.includes(cb.value);
      });
      // Hint'leri gizle (edit modunda kullanıcı zaten farkında)
      ["isIlanAdHint","isIlanTelHint"].forEach(id => document.getElementById(id)?.classList.add("hidden"));
      // Kelime sayacı güncelle
      const counter = document.getElementById("isIlanKelimeSayac");
      const n = (editIlan.aciklama || "").trim().split(/\s+/).filter(Boolean).length;
      if (counter) counter.textContent = `${n} / 300 kelime`;
    } else {
      // YENİ — otomatik doldurma (anlık ilan pattern)
      const adInput = document.getElementById("isIlanIsyeriAd");
      const adHint = document.getElementById("isIlanAdHint");
      if (adInput && window.currentUser.isletmeAdi) {
        adInput.value = window.currentUser.isletmeAdi;
        adHint?.classList.remove("hidden");
      } else {
        adHint?.classList.add("hidden");
      }
      // Tel otomatik doldur — önce cep (tel), boşsa iş tel (isTelefonu) fallback
      const telInput = document.getElementById("isIlanTel");
      const telHint = document.getElementById("isIlanTelHint");
      const userTel = window.currentUser?.tel || window.currentUser?.isTelefonu || "";
      if (telInput && userTel) {
        try {
          telInput.value = (typeof window.formatTel === "function") ? window.formatTel(userTel) : userTel;
        } catch (e) {
          telInput.value = userTel;
        }
        telHint?.classList.remove("hidden");
      } else {
        if (telInput) telInput.value = "";
        telHint?.classList.add("hidden");
      }
      // Etiketler temiz
      document.querySelectorAll('#isIlanForm input[name=isilan_etiket]').forEach(cb => { cb.checked = false; });
      // Kelime sayacı sıfırla
      const counter = document.getElementById("isIlanKelimeSayac");
      if (counter) counter.textContent = "0 / 300 kelime";
    }

    window.openModal?.("isIlanFormModal");
  }

  // "Düzenle" linkleri — alanı temizle ve focus ver (anlık ilan pattern)
  function _bindEditHints() {
    document.getElementById("isIlanAdEditBtn")?.addEventListener("click", e => {
      e.preventDefault();
      const input = document.getElementById("isIlanIsyeriAd");
      if (input) { input.value = ""; input.focus(); }
      document.getElementById("isIlanAdHint")?.classList.add("hidden");
    });
    document.getElementById("isIlanTelEditBtn")?.addEventListener("click", e => {
      e.preventDefault();
      const input = document.getElementById("isIlanTel");
      if (input) { input.value = ""; input.focus(); }
      document.getElementById("isIlanTelHint")?.classList.add("hidden");
    });
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
    const isyeri_ad = (fd.get("isyeri_ad") || "").trim();
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
    if (!isyeri_ad || isyeri_ad.length < 2) return window.toast?.("İşyeri / firma adı zorunlu.", "error");
    if (!ilce) return window.toast?.("İşin yapılacağı ilçe zorunlu.", "error");
    if (!aciklama || aciklama.length < 20) return window.toast?.("Açıklama en az 20 karakter olmalı.", "error");
    const aciklamaErr = _validateUzunForm(aciklama, "Açıklama");
    if (aciklamaErr) return window.toast?.(aciklamaErr, "error", 6000);
    const baslikErr = window._validateIcerik?.(baslik, "Başlık");
    if (baslikErr) return window.toast?.(baslikErr, "error", 6000);
    const isyeriAdErr = window._validateIcerik?.(isyeri_ad, "İşyeri adı");
    if (isyeriAdErr) return window.toast?.(isyeriAdErr, "error", 6000);
    if (!isNaN(maas_min) && !isNaN(maas_max) && maas_min > maas_max) {
      return window.toast?.("Maaş alt sınırı üst sınırdan büyük olamaz.", "error");
    }
    if (!tel_raw || !window._isMobileTr?.(tel_raw)) {
      return window.toast?.("Geçerli bir cep telefonu gerekli.", "error");
    }
    if (!kurallar) {
      return window.toast?.("İlan Verme Kuralları'nı okuyup onaylamalısın.", "error");
    }

    // Seçili etiketler
    const etiketler = Array.from(
      document.querySelectorAll('#isIlanForm input[name=isilan_etiket]:checked')
    ).map(cb => cb.value);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const submitBtnText = _editingIsIlanId ? "Güncelle" : "Yayınla";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = _editingIsIlanId ? "Güncelleniyor..." : "Gönderiliyor..."; }

    const payload = {
      tur,
      baslik,
      isyeri_ad,
      isyeri_adres: null,   // İş ilanlarında adres yok (firma farklı şehirde olabilir)
      ilce,
      aciklama,
      maas_min: isNaN(maas_min) ? null : maas_min,
      maas_max: isNaN(maas_max) ? null : maas_max,
      iletisim_tel: window._phoneToE164?.(tel_raw) || tel_raw,
      etiketler,
      durum: "beklemede",      // edit sonrası tekrar incelemeye gider
      red_sebebi: null
    };

    let error = null;
    if (_editingIsIlanId) {
      // PATCH — raw fetch (sb.from bypass)
      try {
        const r = await fetch(`${window.SUPABASE_URL}/rest/v1/ilanlar?id=eq.${_editingIsIlanId}&user_id=eq.${window.currentUser.id}`, {
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
      // INSERT
      payload.user_id = window.currentUser.id;
      const result = await window.rawInsert("ilanlar", payload, session.access_token);
      error = result.error;
    }

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtnText; }
    if (error) {
      window.toast?.((_editingIsIlanId ? "Güncellenemedi: " : "İlan gönderilemedi: ") + error.message, "error", 6000);
      return;
    }
    const wasEditing = !!_editingIsIlanId;
    _editingIsIlanId = null;
    window.closeModals?.();
    window.toast?.(wasEditing
      ? "✅ İlanın güncellendi — değişiklik nedeniyle tekrar moderatör incelemesinde."
      : "✅ İlanın incelemeye gönderildi. Onaylanınca yayına çıkacak (genelde 4 saat içinde).",
      "ok", 6000
    );
    loadIsIlanlari();
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

  // ============== ACTION DISPATCHER ==============
  // Tüm aksiyon butonları (kart + detay modal) buradan yönetilir
  function _handleIsIlanAction(act, id) {
    if (!id) return;
    const ilan = _isIlanlar.find(x => x.id === id);

    if (act === "detay") {
      if (ilan) openIsIlanDetail(ilan);
    }
    else if (act === "delete") {
      _deleteIsIlan(id);
    }
    else if (act === "edit") {
      if (!ilan) return;
      _openIsIlanForm(ilan);
    }
    else if (act === "share") {
      _copyIsIlanLink(id);
    }
    else if (act === "report") {
      if (!window.currentUser) {
        window.toast?.("Sorun bildirmek için giriş yap.", "info", 4000);
        window.openModal?.("loginModal");
        return;
      }
      if (typeof window.openSikayetModal === "function") {
        window.openSikayetModal(id);
      } else {
        window.toast?.("Şikayet sistemi şu an kullanılamıyor.", "error");
      }
    }
    else if (act === "rxn-up" || act === "rxn-down") {
      if (!window.currentUser) {
        window.toast?.("Reaksiyon vermek için giriş yap.", "info", 4000);
        window.openModal?.("loginModal");
        return;
      }
      const tip = act === "rxn-up" ? "begen" : "begenmeme";
      _toggleIsIlanRxn(id, tip);
    }
  }

  // Detay modal açıkken reaksiyon sayılarını ve aktif tipini canlı güncelle (v165)
  function _updateDetailRxnCounts(ilanId, ilan, verilenTip) {
    const modal = document.getElementById("isIlanDetailModal");
    if (!modal || modal.classList.contains("hidden")) return;
    // Doğru ilanın detayı mı açık?
    const upBtn = modal.querySelector(`[data-iict="rxn-up"][data-id="${ilanId}"]`);
    const downBtn = modal.querySelector(`[data-iict="rxn-down"][data-id="${ilanId}"]`);
    if (!upBtn && !downBtn) return;  // farklı ilanın detayı açık veya butonlar yok
    if (upBtn) {
      const span = upBtn.querySelector("span");
      if (span) span.textContent = ilan.begen_sayisi || 0;
      if (verilenTip === "begen") upBtn.classList.add("active");
    }
    if (downBtn) {
      const span = downBtn.querySelector("span");
      if (span) span.textContent = ilan.begenmeme_sayisi || 0;
      if (verilenTip === "begenmeme") downBtn.classList.add("active");
    }
  }

  // İş ilanı reaksiyon — TEK SEFERLİK (v164)
  // Manipülasyon önleme: bir kez verilen reaksiyon GERİ ALINAMAZ + DEĞİŞTİRİLEMEZ.
  // DB tarafında UPDATE/DELETE policy'leri kaldırıldı (sql/22), UNIQUE constraint
  // duplicate'i engeller. JS tarafında ön kontrol + optimistic UI.
  async function _toggleIsIlanRxn(ilanId, tip) {
    const session = window.readStoredSession?.();
    if (!session?.access_token) {
      window.toast?.("Oturumun sona ermiş.", "error");
      return;
    }
    const userId = window.currentUser.id;
    const base = `${window.SUPABASE_URL}/rest/v1/reaksiyonlar`;
    const headers = {
      apikey: window.SUPABASE_KEY,
      Authorization: "Bearer " + session.access_token,
      "Content-Type": "application/json"
    };

    // 1) Önceden reaksiyon vermiş mi?
    try {
      const checkRes = await fetch(`${base}?user_id=eq.${userId}&ilan_id=eq.${ilanId}&select=tip`, { headers });
      const existing = checkRes.ok ? await checkRes.json() : [];
      if (existing.length > 0) {
        const mevcut = existing[0].tip;
        const label = mevcut === "begen" ? "👍 Beğendin" : "👎 Beğenmedin";
        window.toast?.(`Bu ilana zaten reaksiyon verdin (${label}). Geri alınamaz.`, "info", 4500);
        return;
      }
    } catch (e) {
      // check başarısız olsa bile insert dene; UNIQUE constraint koruma sağlar
    }

    // 2) Optimistic UI — sayacı anında artır (liste + detay modal)
    const ilan = _isIlanlar.find(x => x.id === ilanId);
    if (ilan) {
      if (tip === "begen") ilan.begen_sayisi = (ilan.begen_sayisi || 0) + 1;
      else ilan.begenmeme_sayisi = (ilan.begenmeme_sayisi || 0) + 1;
      renderIsIlanlari();
      _updateDetailRxnCounts(ilanId, ilan, tip);  // detay modal açıksa orayı da güncelle
    }

    // 3) DB'ye yaz (INSERT-only)
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: userId, ilan_id: ilanId, tip })
      });
      if (!res.ok) {
        const text = await res.text();
        // Optimistic geri al
        if (ilan) {
          if (tip === "begen") ilan.begen_sayisi = Math.max(0, (ilan.begen_sayisi || 1) - 1);
          else ilan.begenmeme_sayisi = Math.max(0, (ilan.begenmeme_sayisi || 1) - 1);
          renderIsIlanlari();
          _updateDetailRxnCounts(ilanId, ilan, null);
        }
        if (text.includes("duplicate") || text.includes("unique")) {
          window.toast?.("Bu ilana zaten reaksiyon verdin. Geri alınamaz.", "info", 4500);
        } else if (text.includes("REAKSIYON_HIZ_LIMITI")) {
          window.toast?.("⏱ Çok hızlı reaksiyon — biraz yavaşla.", "error", 5000);
        } else {
          window.toast?.("Reaksiyon kaydedilemedi: " + text.slice(0, 100), "error");
        }
        return;
      }
      // Başarılı — kullanıcıya bilgi
      const ikon = tip === "begen" ? "👍" : "👎";
      window.toast?.(`${ikon} Reaksiyonun kaydedildi. (Geri alınamaz)`, "ok", 3000);
      // Gerçek sayıları DB'den senkronize et
      await loadIsIlanlari();
    } catch (e) {
      // Optimistic geri al
      if (ilan) {
        if (tip === "begen") ilan.begen_sayisi = Math.max(0, (ilan.begen_sayisi || 1) - 1);
        else ilan.begenmeme_sayisi = Math.max(0, (ilan.begenmeme_sayisi || 1) - 1);
        renderIsIlanlari();
      }
      window.toast?.("Bağlantı hatası: " + (e.message || e), "error");
    }
  }

  // Paylaş — mobilde native share sheet (WhatsApp/Telegram/SMS vs), desktop'ta clipboard
  async function _copyIsIlanLink(ilanId) {
    const ilan = _isIlanlar.find(x => x.id === ilanId);
    const url = `${window.location.origin}/ilan/${ilanId}`;
    const title = ilan ? `İş İlanı: ${ilan.baslik}` : "İzinci Kurye İş İlanı";
    const text = ilan
      ? `${ilan.baslik}\n📍 ${ilan.ilce} · 💰 ${_formatMaasAralik(ilan.maas_min, ilan.maas_max)}\n${url}`
      : url;

    // 1) Önce native share API (mobilde WhatsApp/Telegram/SMS listesi açar)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;  // Başarılı, kullanıcı paylaştı veya iptal etti
      } catch (e) {
        // AbortError = kullanıcı iptal etti, başka error fallback'e geç
        if (e?.name === "AbortError") return;
      }
    }
    // 2) Fallback: clipboard kopyala
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
    // "Düzenle" hint linkleri
    _bindEditHints();
    // Row click delegasyonu (compact row pattern — anlık ilan ile aynı)
    document.getElementById("isilanlariListings")?.addEventListener("click", (e) => {
      // Önce aksiyon butonları kontrol (satır click'ini engelle)
      const actBtn = e.target.closest("[data-iict]");
      if (actBtn) {
        e.stopPropagation();
        const id = actBtn.dataset.id;
        const act = actBtn.dataset.iict;
        _handleIsIlanAction(act, id);
        return;
      }
      // Satırın herhangi bir yerine tıklama → detay
      const row = e.target.closest(".is-ilan-row");
      if (row) {
        const ilan = _isIlanlar.find(x => x.id === row.dataset.id);
        if (ilan) openIsIlanDetail(ilan);
      }
    });

    // Detay modal click delegasyonu (paylaş/bildir/düzenle/reaksiyon butonları)
    document.getElementById("isIlanDetailBody")?.addEventListener("click", (e) => {
      const actBtn = e.target.closest("[data-iict]");
      if (!actBtn) return;
      e.stopPropagation();
      _handleIsIlanAction(actBtn.dataset.iict, actBtn.dataset.id);
    });

    // İlçe filtresi
    document.getElementById("isilanlariIlceFilter")?.addEventListener("change", (e) => {
      _isIlanIlce = e.target.value || "all";
      loadIsIlanlari();
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
    // İlçe filtresi dropdown'ı doldur
    const ilceFilter = document.getElementById("isilanlariIlceFilter");
    if (ilceFilter && ilceFilter.options.length <= 1 && Array.isArray(window.ANKARA_ILCELERI)) {
      window.ANKARA_ILCELERI.forEach(i => {
        ilceFilter.appendChild(new Option(i, i));
      });
    }
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
