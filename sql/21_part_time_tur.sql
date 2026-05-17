-- =====================================================================
-- 21: ilanlar.tur enum'a 'part_time' eklenir (v162)
-- =====================================================================
-- Mevcut CHECK constraint kaldırılıp yeniden yaratılır.
-- Anlık ilanlar (anlik_kurye) + iş ilanları (tam_zamanli/part_time/esnaf_kurye/arabali_kurye).
-- =====================================================================

do $$
declare
  cons_name text;
begin
  -- Mevcut CHECK constraint adını bul ve düşür
  select conname into cons_name
  from pg_constraint
  where conrelid = 'public.ilanlar'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%tur%anlik_kurye%';
  if cons_name is not null then
    execute format('alter table public.ilanlar drop constraint %I', cons_name);
  end if;

  -- Yeni constraint ekle
  alter table public.ilanlar
    add constraint ilanlar_tur_check
    check (tur in ('anlik_kurye', 'tam_zamanli', 'part_time', 'esnaf_kurye', 'arabali_kurye'));
end $$;

-- =====================================================================
-- KONTROL:
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conrelid='public.ilanlar'::regclass and contype='c';
-- =====================================================================
