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

// Ham RPC çağrısı — supabase-js bypass (sb.rpc() takılma sorununu önler)
async function rawRpc(fnName, params, accessToken, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + fnName, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + (accessToken || SUPABASE_KEY),
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(params || {}),
      signal: ctrl.signal
    });
    clearTimeout(t);
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.details)) || ("HTTP " + res.status);
      return { data: null, error: { message: msg, status: res.status } };
    }
    return { data, error: null };
  } catch (e) {
    clearTimeout(t);
    return { data: null, error: { message: e.message || "rpc fetch error" } };
  }
}
window.rawRpc = rawRpc;

// Ham INSERT — supabase-js bypass
async function rawInsert(table, row, accessToken, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + (accessToken || SUPABASE_KEY),
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(row),
      signal: ctrl.signal
    });
    clearTimeout(t);
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.details)) || ("HTTP " + res.status);
      return { data: null, error: { message: msg, status: res.status } };
    }
    return { data, error: null };
  } catch (e) {
    clearTimeout(t);
    return { data: null, error: { message: e.message || "insert fetch error" } };
  }
}
window.rawInsert = rawInsert;

// Ham giriş — supabase-js'i bypass eder (init/lock hang sorunu)
async function rawSignIn(email, password, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    const data = await res.json();
    if (!res.ok) {
      return {
        data: null,
        error: { message: data.error_description || data.msg || data.error || "Giriş başarısız", status: res.status }
      };
    }
    // Storage'a yaz: sb-<ref>-auth-token (Supabase-js v2 ile uyumlu format)
    const ref = SUPABASE_URL.replace(/^https:\/\//, "").split(".")[0];
    const key = "sb-" + ref + "-auth-token";
    const stored = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      token_type: data.token_type,
      user: data.user
    };
    try { localStorage.setItem(key, JSON.stringify(stored)); } catch {}
    return { data, error: null };
  } catch (e) {
    clearTimeout(t);
    return {
      data: null,
      error: { message: e.name === "AbortError" ? "Bağlantı zaman aşımı" : (e.message || "Bağlantı hatası") }
    };
  }
}
window.rawSignIn = rawSignIn;

// Ham kayıt — supabase-js'i bypass eder
async function rawSignUp(email, password, metadata, redirectTo, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const url = SUPABASE_URL + "/auth/v1/signup";
    const body = {
      email, password,
      data: metadata || {}
    };
    if (redirectTo) body.email_redirect_to = redirectTo;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(t);
    const data = await res.json();
    if (!res.ok) {
      return {
        data: null,
        error: { message: data.error_description || data.msg || data.error || "Kayıt başarısız", status: res.status }
      };
    }
    return { data, error: null };
  } catch (e) {
    clearTimeout(t);
    return {
      data: null,
      error: { message: e.name === "AbortError" ? "Bağlantı zaman aşımı" : (e.message || "Bağlantı hatası") }
    };
  }
}
window.rawSignUp = rawSignUp;
