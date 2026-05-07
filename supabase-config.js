// Supabase yapılandırması
// Publishable key zaten public — frontend'de durabilir
const SUPABASE_URL = "https://abgxzseyaefivyzdzefz.supabase.co";
const SUPABASE_KEY = "sb_publishable_Wbfy8peaa3E672Ru24pxtw_dHBy3MaS";

// No-op lock: navigator.locks API beklemesi getSession'ı sonsuz bloklayabilir
// (başka takılı sekme/lock olduğunda). Lock'ı bypass et.
const _noopLock = (_name, _timeout, fn) => fn();

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: true,
    lock: _noopLock
  }
});
