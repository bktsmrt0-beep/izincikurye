// Supabase yapılandırması
// Publishable key zaten public — frontend'de durabilir
const SUPABASE_URL = "https://abgxzseyaefivyzdzefz.supabase.co";
const SUPABASE_KEY = "sb_publishable_Wbfy8peaa3E672Ru24pxtw_dHBy3MaS";

// Varsayılan storage (localStorage). "Beni hatırla" sekme kapanışında signOut ile yapılır.
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
