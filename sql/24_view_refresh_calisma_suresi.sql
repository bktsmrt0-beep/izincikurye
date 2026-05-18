-- =====================================================================
-- 24: ilanlar_public view yeniden oluşturulur (calisma_suresi dahil)
-- =====================================================================
-- sql/23 ile calisma_suresi kolonu eklendi ama ilanlar_public view sql/18'de
-- "SELECT *" ile oluşturulduğu için yeni kolonu YANSITMIYOR (CLAUDE.md tuzak #49).
-- View'ı drop edip yeniden oluştururuz — şu anki tüm kolonlar (eski + calisma_suresi) gelir.
--
-- GENEL KURAL: ilanlar tablosuna yeni kolon eklenince view'ı recreate et.
-- =====================================================================

drop view if exists public.ilanlar_public cascade;

create view public.ilanlar_public as
  select * from public.ilanlar
  where
    (tur = 'anlik_kurye' and expires_at > now() and durum = 'onayli')
    or
    (tur != 'anlik_kurye' and durum = 'onayli');

-- =====================================================================
-- KONTROL:
--   \d ilanlar_public  -- calisma_suresi kolonu listede olmalı
--   SELECT calisma_suresi FROM public.ilanlar_public WHERE tur != 'anlik_kurye' LIMIT 5;
-- =====================================================================
