// Supabase yapılandırması
// Publishable key zaten public — frontend'de durabilir
const SUPABASE_URL = "https://abgxzseyaefivyzdzefz.supabase.co";
const SUPABASE_KEY = "sb_publishable_Wbfy8peaa3E672Ru24pxtw_dHBy3MaS";

// "Beni hatırla" durumuna göre localStorage <-> sessionStorage arasında geçiş yapan
// custom storage adaptörü. Bayrak işaretli ise localStorage (kalıcı), değilse
// sessionStorage (sekme kapanınca silinir) kullanılır.
const REMEMBER_KEY = "izk_remember";

function _isRemember() {
  try { return localStorage.getItem(REMEMBER_KEY) === "1"; } catch { return false; }
}

const switchStorage = {
  getItem: (key) => {
    try { return (_isRemember() ? localStorage : sessionStorage).getItem(key); }
    catch { return null; }
  },
  setItem: (key, value) => {
    try { (_isRemember() ? localStorage : sessionStorage).setItem(key, value); } catch {}
  },
  removeItem: (key) => {
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  }
};

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: switchStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
