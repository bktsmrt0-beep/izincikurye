-- =====================================================================
-- 23: İş ilanları için çalışılacak süre aralığı (v172)
-- =====================================================================
-- Form alanı: "4-6", "6-8", "8-10", "10-12", "12-14", "14-16" saat aralığı.
-- Anlık ilanlar için NULL kalır (zaten "saat" kolonu kullanıyor).
-- =====================================================================

alter table public.ilanlar
  add column if not exists calisma_suresi text;

-- =====================================================================
-- KONTROL:
--   select tur, calisma_suresi, count(*) from public.ilanlar
--     where tur != 'anlik_kurye' group by tur, calisma_suresi;
-- =====================================================================
