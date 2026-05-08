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
    // Süresi dolmuşsa null
    if (data.expires_at && Date.now() / 1000 > data.expires_at) return null;
    return { user: data.user, access_token: data.access_token };
  } catch { return null; }
}
window.readStoredSession = readStoredSession;
