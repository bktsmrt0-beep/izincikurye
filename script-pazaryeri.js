// =====================================================================
// script-pazaryeri.js — Müsait Çekiciler (v186, profil tabanlı)
// =====================================================================
// Müsait Kuryeler sekmesinin paraleli — çekici hizmeti veren işletmeler
// profillerinde "Çekici" sekmesini doldurup "Müsait Ol" toggle açtığında
// bu listede görünür.
//
// Bağımlılıklar window.* (script.js'ten): rawSelect, readStoredSession,
// openModal, closeModals, toast, escapeHtml, formatTel, _phoneToE164,
// _isMobileTr, _displayPhone, currentUser, ANKARA_ILCELERI,
// SUPABASE_URL, SUPABASE_KEY, _updateCekiciBanner.
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

  let _cekiciler = [];
  let _ilceFilter = "all";
  let _hizmetFilter = "all";

  function _ilceDisplay(b) {
    if (!b || b === "tum") return "Tüm Ankara";
    return b + ", Ankara";
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
  function _formatFiyat(n) {
    if (n == null) return "—";
    return Number(n).toLocaleString("tr-TR") + " ₺";
  }
  function _formatFiyatAralik(min, max) {
    if (min == null && max == null) return "Belirtilmemiş";
    if (min != null && max != null) return _formatFiyat(min) + " — " + _formatFiyat(max);
    if (min != null) return _formatFiyat(min) + "+";
    return "≤ " + _formatFiyat(max);
  }

  // ============== LOAD ==============
  async function loadMusaitCekiciler() {
    const listEl = document.getElementById("pzrCekiciListings");
    const emptyEl = document.getElementById("pzrCekiciEmpty");
    const guestEl = document.getElementById("pzrCekiciGuestNotice");
    if (!listEl || !emptyEl) return;

    // Anonim kullanıcı → güneşli mesaj (kurye listesindeki gibi)
    if (!window.currentUser) {
      listEl.innerHTML = "";
      emptyEl.classList.add("hidden");
      guestEl?.classList.remove("hidden");
      return;
    }
    guestEl?.classList.add("hidden");

    listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px">Yükleniyor...</div>`;
    emptyEl.classList.add("hidden");

    const session = window.readStoredSession?.();
    if (!session?.access_token) return;

    const params = new URLSearchParams();
    params.set("select", "id,ad,soyad,isletme_adi,avatar_url,tel,puan_ort,puan_sayisi,cekici_arac_tipi,cekici_bolge,cekici_min_ucret,cekici_max_ucret,cekici_aciklama,cekici_etiketler,cekici_musait,cekici_musait_at,created_at");
    params.set("cekici_aktif", "eq.true");
    params.set("cekici_musait", "eq.true");
    if (_hizmetFilter !== "all") {
      // motor_cekici filtresi → cekici_arac_tipi 'motor_cekici' veya 'her_ikisi'
      // arac_cekici filtresi → cekici_arac_tipi 'arac_cekici' veya 'her_ikisi'
      if (_hizmetFilter === "motor_cekici") params.set("cekici_arac_tipi", "in.(motor_cekici,her_ikisi)");
      else if (_hizmetFilter === "arac_cekici") params.set("cekici_arac_tipi", "in.(arac_cekici,her_ikisi)");
      else if (_hizmetFilter === "her_ikisi") params.set("cekici_arac_tipi", "eq.her_ikisi");
    }
    if (_ilceFilter !== "all") {
      // İlçe filtresi: cekici_bolge='tum' (her yerden) VEYA spesifik ilçe eşleşmesi
      params.set("or", `(cekici_bolge.eq.tum,cekici_bolge.eq.${_ilceFilter})`);
    }
    params.set("order", "cekici_musait_at.desc");
    params.set("limit", "100");

    const { data, error } = await window.rawSelect(
      `profiles?${params.toString()}`,
      session.access_token,
      8000
    );
    if (error) {
      listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px;color:#dc2626">Yüklenemedi: ${error.message}</div>`;
      return;
    }
    _cekiciler = Array.isArray(data) ? data : [];
    renderMusaitCekiciler();
  }

  // ============== RENDER ==============
  function renderMusaitCekiciler() {
    const listEl = document.getElementById("pzrCekiciListings");
    const emptyEl = document.getElementById("pzrCekiciEmpty");
    if (!listEl || !emptyEl) return;

    if (!_cekiciler.length) {
      listEl.innerHTML = "";
      emptyEl.innerHTML = `
        <div class="empty-icon">🚛</div>
        <h3>Şu an müsait çekici görünmüyor</h3>
        <p>Çekiciler farklı saatlerde müsait olabilir. Filtreyi değiştirip tekrar dene veya yakın bir zamanda kontrol et.</p>
      `;
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    listEl.innerHTML = _cekiciler.map(c => buildCekiciRowHTML(c)).join("");
  }

  function _aktiflikSuresi(musaitAt) {
    if (!musaitAt) return "—";
    const ms = Date.now() - new Date(musaitAt).getTime();
    const dk = Math.floor(ms / 60000);
    if (dk < 1) return "yeni";
    if (dk < 60) return dk + " dk";
    const sa = Math.floor(dk / 60);
    if (sa < 24) return sa + " sa";
    const gun = Math.floor(sa / 24);
    return gun + " gün";
  }

  function buildCekiciRowHTML(c) {
    const ad = c.isletme_adi || ((c.ad || "") + " " + (c.soyad || "")).trim() || "—";
    const aracMeta = CEKICI_ARAC_INFO[c.cekici_arac_tipi] || { ico: "🚛", label: "—" };
    const fiyat = _formatFiyatKisa(c.cekici_min_ucret, c.cekici_max_ucret);
    const bolge = _ilceDisplay(c.cekici_bolge);
    const sure = _aktiflikSuresi(c.cekici_musait_at);
    const puan = (c.puan_sayisi || 0) > 0
      ? `⭐ ${Number(c.puan_ort).toFixed(1)} <small>(${c.puan_sayisi})</small>`
      : `<span class="yeni-uye-badge">🆕 Yeni</span>`;

    return `
      <article class="kurye-row pzr-cekici-row" data-id="${c.id}">
        <div class="kurye-row-cell cell-ad">
          <span class="cell-label">Çekici</span>
          <strong>${window.escapeHtml(ad)}</strong>
        </div>
        <div class="kurye-row-cell cell-puan">
          <span class="cell-label">Puan</span>
          <strong>${puan}</strong>
        </div>
        <div class="kurye-row-cell cell-bolge">
          <span class="cell-label">Hakim Bölge</span>
          <strong>${window.escapeHtml(bolge)}</strong>
        </div>
        <div class="kurye-row-cell cell-ucret">
          <span class="cell-label">${aracMeta.ico} ${aracMeta.label}</span>
          <strong>${fiyat}</strong>
        </div>
        <div class="kurye-row-cell cell-musait">
          <span class="cell-dot"></span>
          <strong>${sure}</strong>
        </div>
      </article>
    `;
  }

  // ============== DETAY MODAL ==============
  function openCekiciDetail(cekici) {
    const body = document.getElementById("cekiciDetailBody");
    if (!body) return;
    const ad = cekici.isletme_adi || ((cekici.ad || "") + " " + (cekici.soyad || "")).trim() || "—";
    const aracMeta = CEKICI_ARAC_INFO[cekici.cekici_arac_tipi] || { ico: "🚛", label: "—" };
    const bolge = _ilceDisplay(cekici.cekici_bolge);
    const tel = cekici.tel;
    const telDisplay = tel ? (window._displayPhone?.(tel) || tel) : "";
    const telE164 = tel ? (window._phoneToE164?.(tel) || tel) : "";
    const isMobil = tel && window._isMobileTr?.(tel);
    const avatar = cekici.avatar_url
      ? `<img src="${cekici.avatar_url}" class="kd-avatar" alt="" />`
      : `<div class="kd-avatar kd-avatar-placeholder">🚛</div>`;

    const puanBlock = (cekici.puan_sayisi || 0) > 0
      ? `<div class="kd-puan">⭐ <strong>${Number(cekici.puan_ort).toFixed(1)}</strong> <span class="muted small">(${cekici.puan_sayisi} yorum)</span></div>`
      : `<div class="kd-puan"><span class="yeni-uye-badge">🆕 Yeni üye</span></div>`;

    const etArr = Array.isArray(cekici.cekici_etiketler) ? cekici.cekici_etiketler : [];
    const etiketBlock = etArr.length
      ? `<div class="iid-etiketler">${etArr.map(k => {
          const m = CEKICI_ETIKETLER[k];
          if (!m) return "";
          return `<span class="iid-etiket-chip">${m.ico} ${m.label}</span>`;
        }).join("")}</div>`
      : "";

    const iletisimBlock = tel ? `
      <div class="iid-iletisim">
        <a href="tel:${telE164}" class="btn btn-primary btn-block">📞 Ara</a>
        ${isMobil ? `<a href="https://wa.me/${telE164.replace("+", "")}" target="_blank" class="btn btn-wa btn-block" style="margin-top:8px">💬 WhatsApp ile Yaz</a>` : ""}
      </div>
    ` : "";

    body.innerHTML = `
      <div class="kd-header">
        ${avatar}
        <div class="kd-info">
          <h2 class="kd-ad">${window.escapeHtml(ad)}</h2>
          ${puanBlock}
        </div>
      </div>

      <div class="kd-grid">
        <div class="kd-cell"><span class="kd-label">Hizmet Türü</span><strong>${aracMeta.ico} ${aracMeta.label}</strong></div>
        <div class="kd-cell"><span class="kd-label">Bölge</span><strong>📍 ${window.escapeHtml(bolge)}</strong></div>
        <div class="kd-cell"><span class="kd-label">Çağrı Başı</span><strong>${_formatFiyatAralik(cekici.cekici_min_ucret, cekici.cekici_max_ucret)}</strong></div>
        <div class="kd-cell"><span class="kd-label">Müsait süre</span><strong>🟢 ${_aktiflikSuresi(cekici.cekici_musait_at)}</strong></div>
      </div>

      ${etiketBlock}

      ${cekici.cekici_aciklama ? `<div class="iid-aciklama">${window.escapeHtml(cekici.cekici_aciklama).replace(/\n/g, "<br>")}</div>` : ""}

      ${iletisimBlock}
    `;
    window.openModal?.("cekiciDetailModal");
    try { history.pushState({ modal: "cekiciDetail" }, "", "/cekici/" + cekici.id); } catch (e) {}
  }

  // ============== EVENT BINDING ==============
  function _bindEvents() {
    // Sub-tab geçişi
    document.querySelectorAll("#pazaryeriSubTabs .sub-tab").forEach(btn => {
      btn.addEventListener("click", () => _setPazaryeriSubTab(btn.dataset.pzr));
    });

    // Liste row click → detay
    document.getElementById("pzrCekiciListings")?.addEventListener("click", (e) => {
      const row = e.target.closest(".pzr-cekici-row");
      if (!row) return;
      const cekici = _cekiciler.find(x => x.id === row.dataset.id);
      if (cekici) openCekiciDetail(cekici);
    });

    // Filtreler
    document.getElementById("pzrCekiciIlceFilter")?.addEventListener("change", (e) => {
      _ilceFilter = e.target.value || "all";
      loadMusaitCekiciler();
    });
    document.getElementById("pzrCekiciHizmetFilter")?.addEventListener("change", (e) => {
      _hizmetFilter = e.target.value || "all";
      loadMusaitCekiciler();
    });

    // Pazaryeri tab'ı aktive olunca yükle
    document.querySelectorAll('.content-tab[data-content-tab="pazaryeri"]').forEach(t => {
      t.addEventListener("click", () => {
        setTimeout(() => {
          if (document.querySelector('.content-tab.active[data-content-tab="pazaryeri"]')) {
            const aktifSub = document.querySelector("#pazaryeriSubTabs .sub-tab.active")?.dataset.pzr || "cekici";
            if (aktifSub === "cekici") loadMusaitCekiciler();
            window._updateCekiciBanner?.();
          }
        }, 50);
      });
    });
  }

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
    if (sub === "cekici") {
      loadMusaitCekiciler();
      window._updateCekiciBanner?.();
    }
    try { history.replaceState({}, "", "#pazaryeri-" + sub); } catch (e) {}
  }

  // ============== INIT ==============
  function _init() {
    _bindEvents();

    // İlçe filtresi dropdown'ı doldur
    const ilceFilter = document.getElementById("pzrCekiciIlceFilter");
    if (ilceFilter && ilceFilter.options.length <= 1 && Array.isArray(window.ANKARA_ILCELERI)) {
      window.ANKARA_ILCELERI.forEach(i => ilceFilter.appendChild(new Option(i, i)));
    }

    // Hash bazlı sub-tab açılışı
    const hash = window.location.hash || "";
    if (hash.startsWith("#pazaryeri-")) {
      const sub = hash.replace("#pazaryeri-", "");
      if (["cekici", "tamir", "satis", "muhasebe"].includes(sub)) {
        _setPazaryeriSubTab(sub);
      }
    }
    if (document.querySelector('.content-tab.active[data-content-tab="pazaryeri"]')) {
      const aktifSub = document.querySelector("#pazaryeriSubTabs .sub-tab.active")?.dataset.pzr || "cekici";
      if (aktifSub === "cekici") loadMusaitCekiciler();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init);
  } else {
    _init();
  }

  window.izPazaryeri = {
    load: loadMusaitCekiciler,
    setSubTab: _setPazaryeriSubTab,
    openDetail: openCekiciDetail
  };
})();
