// Supabase yapılandırması
// Publishable key zaten public — frontend'de durabilir
const SUPABASE_URL = "https://abgxzseyaefivyzdzefz.supabase.co";
const SUPABASE_KEY = "sb_publishable_Wbfy8peaa3E672Ru24pxtw_dHBy3MaS";

// detectSessionInUrl: sadece URL'de recovery hash'i varsa aç (init takılmasını önler)
const _hasRecoveryHash = (window.location.hash || "").includes("type=recovery");

const _noopLock = (_name, _timeout, fn) => fn();

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: _hasRecoveryHash,
    lock: _noopLock
  }
});

// Storage'dan session'ı doğrudan okumak için yardımcı (getSession'ı bypass eder)
function readStoredSession() {
  try {
    const keys = Object.keys(localStorage);
    const tokenKey = keys.find(k => k.startsWith("sb-") && k.endsWith("-auth-token"));
    if (!tokenKey) return null;
    const raw = localStorage.getItem(tokenKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.access_token || !data?.user) return null;
    if (data.expires_at && Date.now() / 1000 > data.expires_at) return null;
    return { user: data.user, access_token: data.access_token };
  } catch { return null; }
}
window.readStoredSession = readStoredSession;

// Ham REST çağrısı — supabase-js client'ını bypass eder (init/lock hang'lerini önler)
async function rawSelect(path, accessToken, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + (accessToken || SUPABASE_KEY),
        Accept: "application/json"
      },
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return { data: null, error: { message: "HTTP " + res.status, status: res.status } };
    const arr = await res.json();
    return { data: arr, error: null };
  } catch (e) {
    clearTimeout(t);
    return { data: null, error: { message: e.message || "fetch error" } };
  }
}
window.rawSelect = rawSelect;
