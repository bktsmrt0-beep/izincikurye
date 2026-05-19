// =====================================================================
// script-pazaryeri.js — Generic Pazaryeri 4 servis modülü (v192)
// =====================================================================
// 4 servis: cekici / tamir / satis / muhasebe
// Hepsi profil tabanlı (profiles tablosu kolonları).
// Tek SERVICE_CFG config + generic loadAndRender/renderRow/openDetail.
// =====================================================================

(function () {
  "use strict";

  // ============== CONFIG ==============
  const SERVICE_CFG = {
    cekici: {
      label: "Müsait Çekiciler",
      sub: "cekici",
      cols: "id,ad,soyad,isletme_adi,avatar_url,tel,puan_ort,puan_sayisi,cekici_arac_tipi,cekici_bolge,cekici_min_ucret,cekici_max_ucret,cekici_aciklama,cekici_etiketler,cekici_musait,cekici_musait_at,created_at",
      activeCol: "cekici_aktif",
      musaitCol: "cekici_musait",
      musaitAtCol: "cekici_musait_at",
      bolgeCol: "cekici_bolge",
      typeCol: "cekici_arac_tipi",
      types: {
        motor_cekici: { ico: "🏍", label: "Motosiklet" },
        arac_cekici:  { ico: "🚗", label: "Araç" },
        her_ikisi:    { ico: "🚛", label: "Her ikisi" }
      },
      typeFilterId: "pzrCekiciHizmetFilter",
      typeFilterLogic: (val) => {
        if (val === "motor_cekici") return "cekici_arac_tipi=in.(motor_cekici,her_ikisi)";
        if (val === "arac_cekici") return "cekici_arac_tipi=in.(arac_cekici,her_ikisi)";
        if (val === "her_ikisi") return "cekici_arac_tipi=eq.her_ikisi";
        return null;
      },
      ilceFilterId: "pzrCekiciIlceFilter",
      listingsId: "pzrCekiciListings",
      emptyId: "pzrCekiciEmpty",
      rowClass: "pzr-cekici-row",
      detailModal: "cekiciDetailModal",
      detailBody: "cekiciDetailBody",
      detailIcon: "🚛",
      emptyIcon: "🚛",
      emptyTitle: "Şu an müsait çekici görünmüyor",
      etiketler: {
        acik_7_24: { ico: "🕐", label: "7/24 Açık" },
        sehirler_arasi: { ico: "🛣", label: "Şehirler arası" },
        kredi_karti: { ico: "💳", label: "Kredi kartı geçer" },
        kapora_yok: { ico: "✅", label: "Kapora yok" },
        garantili: { ico: "🛡", label: "Garantili / sigortalı" },
        hizli_servis: { ico: "⚡", label: "30 dk içinde" },
        otoyol_dahil: { ico: "🛤", label: "Otoyol ücreti dahil" },
        avans_yok: { ico: "💵", label: "Avans alınmaz" }
      },
      fiyatLabel: "Çağrı başı",
      fiyatMinCol: "cekici_min_ucret",
      fiyatMaxCol: "cekici_max_ucret",
      aciklamaCol: "cekici_aciklama",
      etiketCol: "cekici_etiketler"
    },
    tamir: {
      label: "Açık Tamir Yerleri",
      sub: "tamir",
      cols: "id,ad,soyad,isletme_adi,avatar_url,tel,puan_ort,puan_sayisi,tamir_hizmet_tipi,tamir_bolge,tamir_min_ucret,tamir_max_ucret,tamir_aciklama,tamir_etiketler,tamir_musait,tamir_musait_at,created_at",
      activeCol: "tamir_aktif",
      musaitCol: "tamir_musait",
      musaitAtCol: "tamir_musait_at",
      bolgeCol: "tamir_bolge",
      typeCol: "tamir_hizmet_tipi",
      types: {
        motor:     { ico: "🏍", label: "Motor" },
        arac:      { ico: "🚗", label: "Araç" },
        her_ikisi: { ico: "🚛", label: "Her ikisi" },
        elektrik:  { ico: "⚡", label: "Oto elektrik" },
        lastik:    { ico: "🛞", label: "Lastik" }
      },
      typeFilterId: "pzrTamirHizmetFilter",
      typeFilterLogic: (val) => `tamir_hizmet_tipi=eq.${val}`,
      ilceFilterId: "pzrTamirIlceFilter",
      listingsId: "pzrTamirListings",
      emptyId: "pzrTamirEmpty",
      rowClass: "pzr-tamir-row",
      detailModal: "tamirDetailModal",
      detailBody: "tamirDetailBody",
      detailIcon: "🔧",
      emptyIcon: "🔧",
      emptyTitle: "Şu an müsait tamirci görünmüyor",
      etiketler: {
        acik_7_24:    { ico: "🕐", label: "7/24 Açık" },
        hafta_sonu:   { ico: "📅", label: "Hafta sonu açık" },
        garantili:    { ico: "🛡", label: "Garantili işçilik" },
        kredi_karti:  { ico: "💳", label: "Kredi kartı geçer" },
        yedek_parca:  { ico: "🔩", label: "Orijinal yedek parça" },
        hizli_servis: { ico: "⚡", label: "Hızlı servis" }
      },
      fiyatLabel: "İşçilik",
      fiyatMinCol: "tamir_min_ucret",
      fiyatMaxCol: "tamir_max_ucret",
      aciklamaCol: "tamir_aciklama",
      etiketCol: "tamir_etiketler"
    },
    satis: {
      label: "Alım-Satım",
      sub: "satis",
      table: "satis_ilanlar_public",  // v194: ayrı tablo
      cols: "id,user_id,kategori,baslik,marka_model,yil,motor_hacmi,yakit,km,durum,fiyat,aciklama,foto_urls,bolge,ozellikler,created_at,expires_at",
      isSatis: true,  // ilan tabanlı (profil değil)
      bolgeCol: "bolge",
      typeCol: "kategori",
      types: {
        motor:       { ico: "🏍", label: "Motor" },
        scooter:     { ico: "🛴", label: "Scooter" },
        bisiklet:    { ico: "🚲", label: "Bisiklet" },
        ekipman:     { ico: "🎒", label: "Ekipman" },
        yedek_parca: { ico: "🔩", label: "Yedek Parça" }
      },
      typeFilterId: "pzrSatisKategoriFilter",
      typeFilterLogic: (val) => `kategori=eq.${val}`,
      ilceFilterId: "pzrSatisIlceFilter",
      listingsId: "pzrSatisListings",
      emptyId: "pzrSatisEmpty",
      rowClass: "pzr-satis-row",
      detailModal: "satisDetailModal",
      detailBody: "satisDetailBody",
      detailIcon: "🏍",
      emptyIcon: "🏍",
      emptyTitle: "Şu an satışta ürün görünmüyor",
      etiketler: {},
      fiyatLabel: "Fiyat",
      fiyatCol: "fiyat",
      aciklamaCol: "aciklama",
      etiketCol: null,
      baslikCol: "baslik",
      markaModelCol: "marka_model",
      yilCol: "yil",
      durumCol: "durum",
      fotoUrlsCol: "foto_urls",  // text[]
      orderCol: "created_at"
    },
    muhasebe: {
      label: "Muhasebe / Danışmanlık",
      sub: "muhasebe",
      cols: "id,ad,soyad,isletme_adi,avatar_url,tel,puan_ort,puan_sayisi,muhasebe_hizmet,muhasebe_bolge,muhasebe_aciklama,muhasebe_etiketler,muhasebe_musait,muhasebe_musait_at,created_at",
      activeCol: "muhasebe_aktif",
      musaitCol: "muhasebe_musait",
      musaitAtCol: "muhasebe_musait_at",
      bolgeCol: "muhasebe_bolge",
      typeCol: "muhasebe_hizmet",
      types: {
        vergi:           { ico: "📑", label: "Vergi" },
        sgk:             { ico: "🛡", label: "SGK" },
        sirket_kurulum:  { ico: "🏢", label: "Şirket Kurulum" },
        genel:           { ico: "📋", label: "Genel" },
        diger:           { ico: "📊", label: "Diğer" }
      },
      typeFilterId: "pzrMuhasebeHizmetFilter",
      typeFilterLogic: (val) => `muhasebe_hizmet=eq.${val}`,
      ilceFilterId: "pzrMuhasebeIlceFilter",
      listingsId: "pzrMuhasebeListings",
      emptyId: "pzrMuhasebeEmpty",
      rowClass: "pzr-muhasebe-row",
      detailModal: "muhasebeDetailModal",
      detailBody: "muhasebeDetailBody",
      detailIcon: "📊",
      emptyIcon: "📊",
      emptyTitle: "Şu an müsait muhasebeci görünmüyor",
      etiketler: {
        online:                 { ico: "💻", label: "Online görüşme" },
        ev_ziyareti:            { ico: "🏠", label: "Evde/işyerinde ziyaret" },
        esnaf_uzmani:           { ico: "🏪", label: "Esnaf uzmanı" },
        kurye_uzmani:           { ico: "🏍", label: "Kurye uzmanı" },
        aylik_paket:            { ico: "📦", label: "Aylık abonelik" },
        ucretsiz_ilk_gorusme:   { ico: "🎁", label: "Ücretsiz ilk görüşme" }
      },
      fiyatLabel: "",
      aciklamaCol: "muhasebe_aciklama",
      etiketCol: "muhasebe_etiketler",
      noFiyat: true
    }
  };

  // State per service
  const _state = {
    cekici:   { list: [], ilce: "all", type: "all" },
    tamir:    { list: [], ilce: "all", type: "all" },
    satis:    { list: [], ilce: "all", type: "all" },
    muhasebe: { list: [], ilce: "all", type: "all" }
  };

  // ============== HELPERS ==============
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
  function _aktiflikSuresi(at) {
    if (!at) return "—";
    const ms = Date.now() - new Date(at).getTime();
    const dk = Math.floor(ms / 60000);
    if (dk < 1) return "yeni";
    if (dk < 60) return dk + " dk";
    const sa = Math.floor(dk / 60);
    if (sa < 24) return sa + " sa";
    return Math.floor(sa / 24) + " gün";
  }

  // ============== LOAD ==============
  async function loadService(svc) {
    const cfg = SERVICE_CFG[svc];
    if (!cfg) return;
    const listEl = document.getElementById(cfg.listingsId);
    const emptyEl = document.getElementById(cfg.emptyId);
    if (!listEl || !emptyEl) return;

    const guestEl = svc === "cekici" ? document.getElementById("pzrCekiciGuestNotice") : null;
    if (!window.currentUser) {
      listEl.innerHTML = "";
      emptyEl.classList.add("hidden");
      if (guestEl) guestEl.classList.remove("hidden");
      else {
        emptyEl.innerHTML = `<div class="empty-icon">${cfg.emptyIcon}</div><h3>Görmek için giriş yap</h3>`;
        emptyEl.classList.remove("hidden");
      }
      return;
    }
    if (guestEl) guestEl.classList.add("hidden");

    listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px">Yükleniyor...</div>`;
    emptyEl.classList.add("hidden");

    const session = window.readStoredSession?.();
    if (!session?.access_token) return;

    const st = _state[svc];
    let qs;
    let tableName;
    let postProcess = null;  // satış için profile join

    if (cfg.isSatis) {
      // Satış: satis_ilanlar tablosundan, filtre kolon adları farklı
      tableName = cfg.table;  // satis_ilanlar_public
      qs = `select=${cfg.cols}`;
      if (st.type !== "all" && cfg.typeFilterLogic) {
        qs += "&" + cfg.typeFilterLogic(st.type);
      }
      if (st.ilce !== "all") {
        qs += `&or=(${cfg.bolgeCol}.eq.tum,${cfg.bolgeCol}.eq.${st.ilce})`;
      }
      qs += `&order=${cfg.orderCol}.desc&limit=100`;
      // Satış için satıcı profilini ayrıca çek (isletme_adi/ad göstermek için)
      postProcess = async (data, token) => {
        const userIds = [...new Set(data.map(d => d.user_id))];
        if (!userIds.length) return data;
        const profUrl = `profiles?id=in.(${userIds.join(",")})&select=id,isletme_adi,ad,soyad,avatar_url,tel,puan_ort,puan_sayisi`;
        const { data: profiles } = await window.rawSelect(profUrl, token, 5000);
        const map = Object.fromEntries((profiles || []).map(p => [p.id, p]));
        data.forEach(d => { d.profile = map[d.user_id]; });
        return data;
      };
    } else {
      // Profil tabanlı (cekici/tamir/muhasebe)
      tableName = "profiles";
      qs = `select=${cfg.cols}&${cfg.activeCol}=eq.true&${cfg.musaitCol}=eq.true`;
      if (st.type !== "all" && cfg.typeFilterLogic) {
        const f = cfg.typeFilterLogic(st.type);
        if (f) qs += "&" + f;
      }
      if (st.ilce !== "all") {
        qs += `&or=(${cfg.bolgeCol}.eq.tum,${cfg.bolgeCol}.eq.${st.ilce})`;
      }
      qs += `&order=${cfg.musaitAtCol}.desc&limit=100`;
    }

    const { data, error } = await window.rawSelect(
      `${tableName}?${qs}`,
      session.access_token,
      8000
    );
    if (error) {
      listEl.innerHTML = `<div class="muted small" style="text-align:center;padding:24px;color:#dc2626">Yüklenemedi: ${error.message}</div>`;
      return;
    }
    let list = Array.isArray(data) ? data : [];
    if (postProcess) list = await postProcess(list, session.access_token);
    st.list = list;
    renderService(svc);
  }

  // ============== RENDER ==============
  function renderService(svc) {
    const cfg = SERVICE_CFG[svc];
    const st = _state[svc];
    const listEl = document.getElementById(cfg.listingsId);
    const emptyEl = document.getElementById(cfg.emptyId);
    if (!listEl || !emptyEl) return;

    if (!st.list.length) {
      listEl.innerHTML = "";
      emptyEl.innerHTML = `
        <div class="empty-icon">${cfg.emptyIcon}</div>
        <h3>${cfg.emptyTitle}</h3>
        <p>Filtreyi değiştirip tekrar dene veya yakın bir zamanda kontrol et.</p>
      `;
      emptyEl.classList.remove("hidden");
      return;
    }
    emptyEl.classList.add("hidden");

    listEl.innerHTML = st.list.map(p => buildRowHTML(svc, p)).join("");
  }

  function buildRowHTML(svc, p) {
    const cfg = SERVICE_CFG[svc];
    // Satış: profile join'den isletme_adi, profil tabanlı: p.isletme_adi
    const prof = p.profile || p;
    const ad = prof.isletme_adi || ((prof.ad || "") + " " + (prof.soyad || "")).trim() || "—";
    const tip = p[cfg.typeCol];
    const tipMeta = (cfg.types && cfg.types[tip]) || { ico: cfg.detailIcon, label: "—" };
    const bolge = _ilceDisplay(p[cfg.bolgeCol]);
    const sure = cfg.isSatis
      ? _aktiflikSuresi(p[cfg.orderCol])
      : _aktiflikSuresi(p[cfg.musaitAtCol]);
    const puan = (prof.puan_sayisi || 0) > 0
      ? `⭐ ${Number(prof.puan_ort).toFixed(1)} <small>(${prof.puan_sayisi})</small>`
      : `<span class="yeni-uye-badge">🆕 Yeni</span>`;

    let fiyatCell = "";
    if (cfg.isSatis) {
      // Satışta tek fiyat + foto thumb
      const f = p[cfg.fiyatCol];
      const fotos = Array.isArray(p[cfg.fotoUrlsCol]) ? p[cfg.fotoUrlsCol] : [];
      const thumb = fotos[0]
        ? `<img src="${fotos[0]}" alt="" class="pzr-satis-thumb" />`
        : `<div class="pzr-satis-thumb pzr-satis-noimg">${cfg.detailIcon}</div>`;
      return `
        <article class="kurye-row ${cfg.rowClass}" data-id="${p.id}">
          ${thumb}
          <div class="kurye-row-cell cell-ad">
            <span class="cell-label">${tipMeta.ico} ${tipMeta.label}</span>
            <strong>${window.escapeHtml(p[cfg.baslikCol] || ad)}</strong>
          </div>
          <div class="kurye-row-cell cell-bolge">
            <span class="cell-label">Bölge</span>
            <strong>${window.escapeHtml(bolge)}</strong>
          </div>
          <div class="kurye-row-cell cell-ucret">
            <span class="cell-label">Fiyat</span>
            <strong>${f != null ? _kisaSayi(f) + " ₺" : "—"}</strong>
          </div>
          <div class="kurye-row-cell cell-musait">
            <span class="cell-dot"></span>
            <strong>${sure}</strong>
          </div>
        </article>
      `;
    } else if (cfg.noFiyat) {
      // Muhasebe: fiyat yok, hizmet tipini göster
      fiyatCell = `
        <div class="kurye-row-cell cell-ucret">
          <span class="cell-label">Hizmet</span>
          <strong>${tipMeta.ico} ${tipMeta.label}</strong>
        </div>`;
    } else {
      const f = _formatFiyatKisa(p[cfg.fiyatMinCol], p[cfg.fiyatMaxCol]);
      fiyatCell = `
        <div class="kurye-row-cell cell-ucret">
          <span class="cell-label">${tipMeta.ico} ${tipMeta.label}</span>
          <strong>${f}</strong>
        </div>`;
    }

    return `
      <article class="kurye-row ${cfg.rowClass}" data-id="${p.id}">
        <div class="kurye-row-cell cell-ad">
          <span class="cell-label">${cfg.isSatis ? "Satıcı" : "Hizmet"}</span>
          <strong>${window.escapeHtml(cfg.isSatis ? (p[cfg.baslikCol] || ad) : ad)}</strong>
        </div>
        <div class="kurye-row-cell cell-puan">
          <span class="cell-label">Puan</span>
          <strong>${puan}</strong>
        </div>
        <div class="kurye-row-cell cell-bolge">
          <span class="cell-label">Bölge</span>
          <strong>${window.escapeHtml(bolge)}</strong>
        </div>
        ${fiyatCell}
        <div class="kurye-row-cell cell-musait">
          <span class="cell-dot"></span>
          <strong>${sure}</strong>
        </div>
      </article>
    `;
  }

  // ============== DETAY MODAL ==============
  function openDetail(svc, p) {
    const cfg = SERVICE_CFG[svc];
    const body = document.getElementById(cfg.detailBody);
    if (!body) return;
    const prof = p.profile || p;
    const ad = prof.isletme_adi || ((prof.ad || "") + " " + (prof.soyad || "")).trim() || "—";
    const tip = p[cfg.typeCol];
    const tipMeta = (cfg.types && cfg.types[tip]) || { ico: cfg.detailIcon, label: "—" };
    const bolge = _ilceDisplay(p[cfg.bolgeCol]);
    const tel = prof.tel;
    const telE164 = tel ? (window._phoneToE164?.(tel) || tel) : "";
    const isMobil = tel && window._isMobileTr?.(tel);
    const avatar = prof.avatar_url
      ? `<img src="${prof.avatar_url}" class="kd-avatar" alt="" />`
      : `<div class="kd-avatar kd-avatar-placeholder">${cfg.detailIcon}</div>`;

    const puanBlock = (prof.puan_sayisi || 0) > 0
      ? `<div class="kd-puan">⭐ <strong>${Number(prof.puan_ort).toFixed(1)}</strong> <span class="muted small">(${prof.puan_sayisi} yorum)</span></div>`
      : `<div class="kd-puan"><span class="yeni-uye-badge">🆕 Yeni üye</span></div>`;

    let etiketBlock = "";
    if (cfg.etiketCol && cfg.etiketler) {
      const etArr = Array.isArray(p[cfg.etiketCol]) ? p[cfg.etiketCol] : [];
      if (etArr.length) {
        etiketBlock = `<div class="iid-etiketler">${etArr.map(k => {
          const m = cfg.etiketler[k];
          if (!m) return "";
          return `<span class="iid-etiket-chip">${m.ico} ${m.label}</span>`;
        }).join("")}</div>`;
      }
    }

    const iletisimBlock = tel ? `
      <div class="iid-iletisim">
        <a href="tel:${telE164}" class="btn btn-primary btn-block">📞 Ara</a>
        ${isMobil ? `<a href="https://wa.me/${telE164.replace("+", "")}" target="_blank" class="btn btn-wa btn-block" style="margin-top:8px">💬 WhatsApp ile Yaz</a>` : ""}
      </div>
    ` : "";

    // Grid hücreleri servise göre farklı
    let gridCells = "";
    if (cfg.isSatis) {
      const durumLabel = ({ sifir: "Sıfır", ikinci_el: "2.el", hasarli: "Hasarlı", parca_icin: "Parça için" })[p[cfg.durumCol]] || "—";
      const oz = p.ozellikler || {};
      gridCells = `
        <div class="kd-cell"><span class="kd-cell-label">Kategori</span><strong>${tipMeta.ico} ${tipMeta.label}</strong></div>
        ${p[cfg.markaModelCol] ? `<div class="kd-cell"><span class="kd-cell-label">Marka/Model</span><strong>${window.escapeHtml(p[cfg.markaModelCol])}</strong></div>` : ""}
        ${p[cfg.yilCol] ? `<div class="kd-cell"><span class="kd-cell-label">Yıl</span><strong>${p[cfg.yilCol]}</strong></div>` : ""}
        <div class="kd-cell"><span class="kd-cell-label">Durum</span><strong>${durumLabel}</strong></div>
        ${p.motor_hacmi ? `<div class="kd-cell"><span class="kd-cell-label">Motor</span><strong>${window.escapeHtml(p.motor_hacmi)}</strong></div>` : ""}
        ${p.yakit ? `<div class="kd-cell"><span class="kd-cell-label">Yakıt</span><strong>${window.escapeHtml(p.yakit)}</strong></div>` : ""}
        ${p.km != null ? `<div class="kd-cell"><span class="kd-cell-label">KM</span><strong>${Number(p.km).toLocaleString("tr-TR")}</strong></div>` : ""}
        ${oz.tip ? `<div class="kd-cell"><span class="kd-cell-label">Tip</span><strong>${window.escapeHtml(oz.tip)}</strong></div>` : ""}
        ${oz.marka ? `<div class="kd-cell"><span class="kd-cell-label">Marka</span><strong>${window.escapeHtml(oz.marka)}</strong></div>` : ""}
        <div class="kd-cell"><span class="kd-cell-label">Fiyat</span><strong style="color:#dc2626">${_formatFiyat(p[cfg.fiyatCol])}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">Konum</span><strong>📍 ${window.escapeHtml(bolge)}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">İlan</span><strong>🟢 ${_aktiflikSuresi(p[cfg.orderCol])}</strong></div>
      `;
    } else if (cfg.noFiyat) {
      gridCells = `
        <div class="kd-cell"><span class="kd-cell-label">Hizmet</span><strong>${tipMeta.ico} ${tipMeta.label}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">Bölge</span><strong>📍 ${window.escapeHtml(bolge)}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">Müsait süre</span><strong>🟢 ${_aktiflikSuresi(p[cfg.musaitAtCol])}</strong></div>
      `;
    } else {
      gridCells = `
        <div class="kd-cell"><span class="kd-cell-label">Tipi</span><strong>${tipMeta.ico} ${tipMeta.label}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">Bölge</span><strong>📍 ${window.escapeHtml(bolge)}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">${cfg.fiyatLabel}</span><strong>${_formatFiyatAralik(p[cfg.fiyatMinCol], p[cfg.fiyatMaxCol])}</strong></div>
        <div class="kd-cell"><span class="kd-cell-label">Müsait süre</span><strong>🟢 ${_aktiflikSuresi(p[cfg.musaitAtCol])}</strong></div>
      `;
    }

    let fotoBlock = "";
    if (cfg.isSatis && Array.isArray(p[cfg.fotoUrlsCol]) && p[cfg.fotoUrlsCol].length) {
      const fotos = p[cfg.fotoUrlsCol];
      fotoBlock = `
        <div class="satis-detay-galeri">
          ${fotos.map((url, i) => `<img src="${url}" alt="" data-idx="${i}" onerror="this.style.display='none'" />`).join("")}
        </div>
      `;
    }

    body.innerHTML = `
      <div class="kurye-detail-v75">
        <div class="kd-header">
          ${avatar}
          <div class="kd-info">
            <h2 class="kd-name">${window.escapeHtml(cfg.isSatis ? (p[cfg.baslikCol] || ad) : ad)}</h2>
            ${cfg.isSatis ? `<div class="muted small">Satıcı: ${window.escapeHtml(ad)}</div>` : ""}
            ${puanBlock}
          </div>
        </div>

        ${fotoBlock}

        <div class="kd-grid">${gridCells}</div>

        ${etiketBlock}

        ${p[cfg.aciklamaCol] ? `<div class="kd-bio">${window.escapeHtml(p[cfg.aciklamaCol]).replace(/\n/g, "<br>")}</div>` : ""}

        ${iletisimBlock}
      </div>
    `;
    window.openModal?.(cfg.detailModal);
  }

  // ============== EVENT BINDING ==============
  function _bindEvents() {
    // Sub-tab
    document.querySelectorAll("#pazaryeriSubTabs .sub-tab").forEach(btn => {
      btn.addEventListener("click", () => _setPazaryeriSubTab(btn.dataset.pzr));
    });

    // Her servis için liste + filtre + detay binding
    Object.keys(SERVICE_CFG).forEach(svc => {
      const cfg = SERVICE_CFG[svc];
      document.getElementById(cfg.listingsId)?.addEventListener("click", (e) => {
        const row = e.target.closest("." + cfg.rowClass);
        if (!row) return;
        const p = _state[svc].list.find(x => x.id === row.dataset.id);
        if (p) openDetail(svc, p);
      });
      document.getElementById(cfg.ilceFilterId)?.addEventListener("change", (e) => {
        _state[svc].ilce = e.target.value || "all";
        loadService(svc);
      });
      document.getElementById(cfg.typeFilterId)?.addEventListener("change", (e) => {
        _state[svc].type = e.target.value || "all";
        loadService(svc);
      });
    });

    // Pazaryeri tab aktive olunca aktif sub yükle
    document.querySelectorAll('.content-tab[data-content-tab="pazaryeri"]').forEach(t => {
      t.addEventListener("click", () => {
        setTimeout(() => {
          if (document.querySelector('.content-tab.active[data-content-tab="pazaryeri"]')) {
            const aktifSub = document.querySelector("#pazaryeriSubTabs .sub-tab.active")?.dataset.pzr || "cekici";
            if (SERVICE_CFG[aktifSub]) loadService(aktifSub);
            window._updatePazaryeriBanner?.();
          }
        }, 50);
      });
    });

    // Anonim giriş linki (sadece çekici için)
    document.getElementById("pzrCekiciGuestLink")?.addEventListener("click", e => {
      e.preventDefault();
      window.openModal?.("loginModal");
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
    if (SERVICE_CFG[sub]) loadService(sub);
    window._updatePazaryeriBanner?.();
    window._updateFabVisibility?.();
    try { history.replaceState({}, "", "#pazaryeri-" + sub); } catch (e) {}
  }

  // Aktif sub-tab'ı yeniden yükle (sticky banner toggle vs sonrası)
  function loadActive() {
    const aktifSub = document.querySelector("#pazaryeriSubTabs .sub-tab.active")?.dataset.pzr || "cekici";
    if (SERVICE_CFG[aktifSub]) loadService(aktifSub);
  }

  // ============== INIT ==============
  function _init() {
    _bindEvents();

    // İlçe filtresi dropdown'larını doldur (her servis için)
    Object.keys(SERVICE_CFG).forEach(svc => {
      const cfg = SERVICE_CFG[svc];
      const el = document.getElementById(cfg.ilceFilterId);
      if (el && el.options.length <= 1 && Array.isArray(window.ANKARA_ILCELERI)) {
        window.ANKARA_ILCELERI.forEach(i => el.appendChild(new Option(i, i)));
      }
    });

    // Hash bazlı sub-tab
    const hash = window.location.hash || "";
    if (hash.startsWith("#pazaryeri-")) {
      const sub = hash.replace("#pazaryeri-", "");
      if (SERVICE_CFG[sub]) _setPazaryeriSubTab(sub);
    }
    if (document.querySelector('.content-tab.active[data-content-tab="pazaryeri"]')) {
      loadActive();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _init);
  } else {
    _init();
  }

  // Public API
  window.izPazaryeri = {
    load: loadActive,
    loadService,
    setSubTab: _setPazaryeriSubTab,
    openDetail
  };
})();
