-- =====================================================================
-- 25: Faz 2B — Pazaryeri / Çekici İlanları
-- =====================================================================
-- ilanlar.tur CHECK constraint'e 'cekici' eklenir.
-- Çekici ilanlarına özel cekici_arac_tipi kolonu eklenir (lastikli /
-- sürüklemeli / platformlu / agir_vasita).
--
-- Fiyat aralığı için mevcut maas_min/maas_max reuse edilir
-- (render katmanında "Çağrı başı 750-1500 ₺" gibi gösterilir).
--
-- Yayın süresi: 30 gün (frontend INSERT'te expires_at = now()+30d set eder).
-- ilanlar_public view'a 'cekici' satırları dahil edilir (süre + onay kontrolü).
--
-- Yetki kuralı (frontend-level): kullanici_tipi='isletme' olan kullanıcılar
-- çekici ilanı verebilir. Kurye kullanıcılar SADECE arama yapabilir.
-- DB'de policy değişmiyor — RLS zaten user_id=auth.uid() bazlı.
-- =====================================================================

-- 1) tur CHECK constraint'i 'cekici' içerecek şekilde güncelle
alter table public.ilanlar drop constraint if exists ilanlar_tur_check;
alter table public.ilanlar
  add constraint ilanlar_tur_check
  check (tur in ('anlik_kurye', 'tam_zamanli', 'esnaf_kurye', 'arabali_kurye', 'cekici'));

-- 2) Çekici aracı tipi kolonu
alter table public.ilanlar
  add column if not exists cekici_arac_tipi text
    check (cekici_arac_tipi is null or cekici_arac_tipi in
      ('lastikli', 'suruklemeli', 'platformlu', 'agir_vasita'));

-- 3) Index — çekici listelemesi için
create index if not exists ilanlar_cekici_idx on public.ilanlar(tur, durum, created_at desc)
  where tur = 'cekici';

-- 4) ilanlar_public view recreate — CLAUDE.md tuzak #49+#63 gereği
-- Anlık kurye + çekici: süre + onay kontrolü.
-- İş ilanları: sadece onay (süresiz).
drop view if exists public.ilanlar_public cascade;

create view public.ilanlar_public as
  select * from public.ilanlar
  where
    (tur in ('anlik_kurye', 'cekici') and expires_at > now() and durum = 'onayli')
    or
    (tur in ('tam_zamanli', 'esnaf_kurye', 'arabali_kurye') and durum = 'onayli');

-- =====================================================================
-- KONTROL:
--   select tur, count(*) from public.ilanlar group by tur;
--   \d ilanlar_public  -- cekici_arac_tipi kolonu listede olmalı
--   insert into public.ilanlar (user_id, baslik, ilce, tur, cekici_arac_tipi,
--     maas_min, maas_max, durum, expires_at, iletisim_tel, aciklama)
--     values (auth.uid(), 'Test', 'Çankaya', 'cekici', 'platformlu',
--     75000, 150000, 'beklemede', now()+interval '30 days', '+905XXXXXXXXX', 'test');
-- =====================================================================
