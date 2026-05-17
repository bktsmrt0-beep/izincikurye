-- =====================================================================
-- 18: Faz 2A — İlanlar tablosu genişletmesi (İş İlanları)
-- =====================================================================
-- Mevcut ilanlar tablosu DOKUNULMAZ şekilde genişletilir:
--   - tur kolonu: 'anlik_kurye' (default) + iş ilanı türleri
--   - durum kolonu: 'beklemede' / 'onayli' / 'reddedildi' (moderatör onayı için)
--   - maas_min, maas_max: iş ilanları için maaş aralığı
--   - red_sebebi: reddedildi durumunda admin'in girdiği sebep
-- Anlık ilanlar için default'lar (tur='anlik_kurye', durum='onayli') ile
-- mevcut akış aynen çalışır — geçiş yükü yok.
--
-- Faz 2B (Pazaryeri) için: tur enum'a sonra eklenir, alt_tur/foto_urls/
-- fiyat_modeli kolonları o zaman gelir. Bu dosyada YOK.
-- =====================================================================

-- 1) Yeni kolonlar
alter table public.ilanlar
  add column if not exists tur text not null default 'anlik_kurye'
    check (tur in ('anlik_kurye', 'tam_zamanli', 'esnaf_kurye', 'arabali_kurye'));

alter table public.ilanlar
  add column if not exists maas_min int;

alter table public.ilanlar
  add column if not exists maas_max int;

alter table public.ilanlar
  add column if not exists durum text not null default 'onayli'
    check (durum in ('beklemede', 'onayli', 'reddedildi'));

alter table public.ilanlar
  add column if not exists red_sebebi text;

-- 2) İş ilanları için anlık-spesifik alanlar NULL olabilmeli
-- (Anlık ilanlarda hâlâ form-level required; iş ilanlarında bu alanlar yok)
do $$ begin
  -- saat
  begin alter table public.ilanlar alter column saat drop not null; exception when others then null; end;
  -- fiyat
  begin alter table public.ilanlar alter column fiyat drop not null; exception when others then null; end;
  -- km
  begin alter table public.ilanlar alter column km drop not null; exception when others then null; end;
  -- bas_saat
  begin alter table public.ilanlar alter column bas_saat drop not null; exception when others then null; end;
  -- bit_saat
  begin alter table public.ilanlar alter column bit_saat drop not null; exception when others then null; end;
  -- iletisim_tel
  begin alter table public.ilanlar alter column iletisim_tel drop not null; exception when others then null; end;
end $$;

-- 3) İndex'ler
create index if not exists ilanlar_tur_idx on public.ilanlar(tur);
create index if not exists ilanlar_durum_bekleyen_idx on public.ilanlar(durum)
  where durum = 'beklemede';
create index if not exists ilanlar_is_ilani_listeleme_idx on public.ilanlar(tur, durum, created_at desc)
  where tur != 'anlik_kurye';

-- 4) ilanlar_public view — yeni durum mantığı ile yeniden oluştur
-- Anlık ilanlar: süre dolmadıysa görünür (durum hep 'onayli' default)
-- İş ilanları: süre kontrolü yok, sadece onaylı olanlar görünür
drop view if exists public.ilanlar_public;
create view public.ilanlar_public as
  select * from public.ilanlar
  where
    (tur = 'anlik_kurye' and expires_at > now() and durum = 'onayli')
    or
    (tur != 'anlik_kurye' and durum = 'onayli');

-- 5) RLS — yeni kolonlar mevcut policy'lerle uyumlu çalışır
-- Kendi ilanını görme/düzenleme: mevcut policy auth.uid()=user_id zaten yeterli
-- Public view ve admin policy'leri zaten var; yeni kolonlar select * ile döner.

-- =====================================================================
-- KONTROL:
--   select tur, durum, count(*) from public.ilanlar group by tur, durum;
--   select * from public.ilanlar where durum = 'beklemede' order by created_at desc;
--   select * from public.ilanlar_public where tur = 'tam_zamanli';
-- =====================================================================
