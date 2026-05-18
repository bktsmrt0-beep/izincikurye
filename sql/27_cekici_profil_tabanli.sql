-- =====================================================================
-- 27: Çekici profil tabanlı modele geçiş (v186)
-- =====================================================================
-- ESKİ MODEL (sql/25, sql/26): ilanlar.tur='cekici' (ilan tabanlı, 30 gün
-- expires, moderatör onay).
-- YENİ MODEL: Müsait Kuryeler gibi profil tabanlı.
--   profiles tablosuna çekici alanları eklenir, kullanıcı bir kere doldurur,
--   sonra "müsait ol" toggle ile listelenir.
--
-- ÇEKİCİ İLAN VERİLERİ TAMAMEN SİLİNECEK (sql/25 sonrası test verisi varsa).
-- =====================================================================

-- 1) ESKİ MODELI TEMIZLE
-- (a) Mevcut çekici ilanları sil (test verisi)
delete from public.ilanlar where tur = 'cekici';

-- (b) ilanlar.tur CHECK constraint'ten 'cekici' çıkar
alter table public.ilanlar drop constraint if exists ilanlar_tur_check;
alter table public.ilanlar
  add constraint ilanlar_tur_check
  check (tur in ('anlik_kurye', 'tam_zamanli', 'esnaf_kurye', 'arabali_kurye', 'part_time'));

-- (c) View'ı ÖNCE düşür (cekici_arac_tipi kolonuna bağımlı olabilir)
drop view if exists public.ilanlar_public cascade;

-- (d) cekici_arac_tipi kolonu ilanlar tablosundan kaldır (artık view bağımlılığı yok)
alter table public.ilanlar drop column if exists cekici_arac_tipi;

-- (e) ilanlar_cekici_idx (sql/25) düşür
drop index if exists ilanlar_cekici_idx;

-- 2) profiles tablosuna ÇEKİCİ alanları ekle
alter table public.profiles
  add column if not exists cekici_aktif boolean not null default false;

alter table public.profiles
  add column if not exists cekici_arac_tipi text
    check (cekici_arac_tipi is null or cekici_arac_tipi in ('motor_cekici', 'arac_cekici', 'her_ikisi'));

alter table public.profiles
  add column if not exists cekici_bolge text;  -- ilçe adı veya 'tum'

alter table public.profiles
  add column if not exists cekici_min_ucret int;

alter table public.profiles
  add column if not exists cekici_max_ucret int;

alter table public.profiles
  add column if not exists cekici_aciklama text;

alter table public.profiles
  add column if not exists cekici_etiketler text[] default '{}';

alter table public.profiles
  add column if not exists cekici_musait boolean not null default false;

alter table public.profiles
  add column if not exists cekici_musait_at timestamptz;

-- 3) Index — müsait çekici listelemesi için
create index if not exists profiles_cekici_musait_idx on public.profiles(cekici_musait, cekici_musait_at desc)
  where cekici_aktif = true and cekici_musait = true;

-- 4) ilanlar_public view'ı yeniden oluştur (kolon drop sonrası)
create view public.ilanlar_public as
  select * from public.ilanlar
  where
    (tur = 'anlik_kurye' and expires_at > now() and durum = 'onayli')
    or
    (tur in ('tam_zamanli', 'esnaf_kurye', 'arabali_kurye', 'part_time') and durum = 'onayli');

-- =====================================================================
-- KONTROL:
--   select distinct tur from public.ilanlar;
--     -- 'cekici' GÖRÜNMEMELI
--   \d profiles
--     -- cekici_aktif/cekici_arac_tipi/cekici_bolge/... yeni kolonlar GÖRÜNMELI
--   select count(*) from public.profiles where cekici_aktif = true;
--     -- 0 olmalı (henüz kimse aktif etmedi)
-- =====================================================================
