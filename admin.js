window.addEventListener("pageshow", (e) => {
  if (e.persisted) window.location.reload();
});

const loadingEl = document.getElementById("loading");
const forbiddenEl = document.getElementById("forbidden");
const contentEl = document.getElementById("adminContent");

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

document.getElementById("logoutBtn").addEventListener("click", () => {
  if (!confirm("Çıkmak istediğine emin misin?")) return;
  try {
    Object.keys(localStorage).filter(k => k.startsWith("sb-")).forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => k.startsWith("sb-")).forEach(k => sessionStorage.removeItem(k));
    localStorage.removeItem("izk_remember");
    sessionStorage.removeItem("izk_session_active");
  } catch {}
  sb.auth.signOut({ scope: "local" }).catch((e) => console.warn("[signOut]", e));
  window.location.href = "/";
});

(async function init() {
  try {
    // getSession'ı bypass: storage'dan direkt oku
    const session = (typeof readStoredSession === "function") ? readStoredSession() : null;
    if (!session) {
      window.location.href = "/";
      return;
    }
    // Ham REST çağrısı: supabase-js bypass
    const { data: arr, error: pErr } = await rawSelect(
      `profiles?id=eq.${session.user.id}&select=role`,
      session.access_token,
      6000
    );
    const me = Array.isArray(arr) ? (arr[0] || null) : null;
    if (pErr) console.warn("[profile]", pErr.message);

    if (me?.role !== "admin") {
      loadingEl.classList.add("hidden");
      forbiddenEl.classList.remove("hidden");
      return;
    }

    loadingEl.classList.add("hidden");
    contentEl.classList.remove("hidden");
    await Promise.all([loadIlanlar(), loadUsers()]);
  } catch (e) {
    console.error("[admin init]", e);
    loadingEl.classList.add("hidden");
    showError("Admin paneli yüklenemedi: " + (e.message || e));
  }
})();

async function loadIlanlar() {
  try {
    const { data: ilanlar, error } = await sb.from("ilanlar")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const userIds = [...new Set((ilanlar || []).map(i => i.user_id))];
    let profileMap = {};
    if (userIds.length) {
      const { data: profiles, error: pErr } = await sb.from("profiles")
        .select("id, ad, soyad, tel")
        .in("id", userIds);
      if (pErr) console.warn("[ilanlar profil batch]", pErr.message);
      profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    }

    document.getElementById("statIlan").textContent = ilanlar.length;

    const tbody = document.querySelector("#ilanlarTable tbody");
    tbody.innerHTML = "";
    if (!ilanlar.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">Henüz ilan yok.</td></tr>`;
      return;
    }
    ilanlar.forEach(i => {
      const owner = profileMap[i.user_id];
      const ownerName = owner ? `${owner.ad} ${owner.soyad}` : "—";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDateTime(i.created_at)}</td>
        <td>${escapeHtml(i.baslik)}</td>
        <td>${escapeHtml(i.ilce)}</td>
        <td>${i.saat}h · ${i.bas_saat}–${i.bit_saat}</td>
        <td>${i.fiyat} ₺ · ${i.km} ₺/km</td>
        <td>${escapeHtml(i.isyeri_ad)}</td>
        <td>${escapeHtml(ownerName)} <br><span class="muted small">${escapeHtml(owner?.tel || "")}</span></td>
        <td><button class="danger-btn" data-act="delete-ilan" data-id="${i.id}">Sil</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("[loadIlanlar]", e);
    showError("İlanlar yüklenemedi: " + (e.message || e));
  }
}

async function loadUsers() {
  try {
    const { data: users, error } = await sb.from("profiles")
      .select("id, ad, soyad, tel, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    document.getElementById("statKul").textContent = users.length;
    document.getElementById("statAdmin").textContent =
      users.filter(u => u.role === "admin").length;

    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    users.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml((u.ad || "") + " " + (u.soyad || ""))}</td>
        <td>${escapeHtml(u.tel || "—")}</td>
        <td>${formatDateTime(u.created_at)}</td>
        <td><span class="role-badge ${u.role}">${u.role === "admin" ? "Admin" : "Kullanıcı"}</span></td>
        <td>
          ${u.role === "admin"
            ? `<button class="toggle-btn demote" data-act="demote" data-id="${u.id}">Adminliği Al</button>`
            : `<button class="toggle-btn" data-act="promote" data-id="${u.id}">Admin Yap</button>`}
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error("[loadUsers]", e);
    showError("Kullanıcılar yüklenemedi: " + (e.message || e));
  }
}

document.addEventListener("click", async e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const act = btn.dataset.act;
  const id = btn.dataset.id;

  if (act === "delete-ilan") {
    if (!confirm("Bu ilanı silmek istediğinden emin misin?")) return;
    const { error } = await sb.from("ilanlar").delete().eq("id", id);
    if (error) return alert("Silme hatası: " + error.message);
    await loadIlanlar();
  }
  else if (act === "promote" || act === "demote") {
    const yeniRol = act === "promote" ? "admin" : "user";
    if (!confirm(`Bu kullanıcının rolü '${yeniRol}' yapılacak. Emin misin?`)) return;
    const { error } = await sb.from("profiles")
      .update({ role: yeniRol }).eq("id", id);
    if (error) return alert("Güncelleme hatası: " + error.message);
    await loadUsers();
  }
});

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])
  );
}
function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
