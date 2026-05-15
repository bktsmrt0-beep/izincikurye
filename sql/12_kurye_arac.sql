-- =============================================================
-- sql/12_kurye_arac.sql
-- Kurye profilinde araç bilgileri:
--   arac_tipi          text (motosiklet/bisiklet/scooter/araba)
--   arac_marka_model   text (serbest yazı, örn: "Honda CB125F")
-- Idempotent: yeniden çalıştırılabilir (IF NOT EXISTS sayesinde).
-- ESKİ KAYITLAR ETKİLENMEZ — yeni alanlar NULL gelir.
-- =============================================================

-- 1) Yeni sütunlar -----------------------------------------------
alter table public.profiles
  add column if not exists arac_tipi text,
  add column if not exists arac_marka_model text;

-- 2) CHECK constraint — araç tipi sadece şu 4 değerden biri olabilir
--    (ileride genişletmek için tekrar drop + add gerekir)
do $$
begin
  -- Önce mevcut constraint varsa kaldır (idempotency için)
  if exists (
    select 1 from pg_constraint
    where conname = 'profiles_arac_tipi_check'
  ) then
    alter table public.profiles drop constraint profiles_arac_tipi_check;
  end if;

  -- Yeni constraint ekle
  alter table public.profiles
    add constraint profiles_arac_tipi_check
    check (arac_tipi is null or arac_tipi in (
      'motosiklet',
      'bisiklet',
      'scooter',
      'araba'
    ));
end $$;

-- 3) Yorumla — şema neyi temsil ediyor (DB içinden de okunabilsin)
comment on column public.profiles.arac_tipi is
  'Kurye aracı tipi: motosiklet | bisiklet | scooter | araba (yalnız kurye profilleri için)';
comment on column public.profiles.arac_marka_model is
  'Kurye aracının marka ve modeli (serbest yazı, max 60 hane önerilir)';

-- =============================================================
-- Doğrulama: bu satırları çalıştırınca yeni alanları gör
--   select id, kullanici_tipi, arac_tipi, arac_marka_model
--   from profiles
--   where kullanici_tipi = 'kurye'
--   limit 5;
-- =============================================================
