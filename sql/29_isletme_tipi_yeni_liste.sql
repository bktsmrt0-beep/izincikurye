-- =====================================================================
-- 29: İşletme tipi listesi güncellendi (v189)
-- =====================================================================
-- ESKİ liste (sql/07): restoran / market / eczane / cafe / diger
-- YENİ liste:           restoran / cekici / tamirci / muhasebe / diger
--
-- market/eczane/cafe değerleri (eski kayıtlarda olabilir) → 'diger'e
-- migrate edilir (veri kaybı yok, sadece tip değişir).
-- =====================================================================

-- 1) Eski değerleri 'diger'e map et
update public.profiles
   set isletme_tipi = 'diger'
 where isletme_tipi in ('market', 'eczane', 'cafe');

-- 2) Eski CHECK constraint'i bul ve drop et (ad bağımsız)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%isletme_tipi%'
  loop
    execute 'alter table public.profiles drop constraint ' || quote_ident(c.conname);
  end loop;
end $$;

-- 3) Yeni CHECK constraint
alter table public.profiles
  add constraint profiles_isletme_tipi_check
  check (isletme_tipi is null or isletme_tipi in ('restoran', 'cekici', 'tamirci', 'muhasebe', 'diger'));

-- =====================================================================
-- KONTROL:
--   select distinct isletme_tipi from public.profiles;
--   -- Sadece yeni değerler + null görünmeli
-- =====================================================================
