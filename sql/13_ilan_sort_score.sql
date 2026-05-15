-- =============================================================
-- sql/13_ilan_sort_score.sql
-- İlan sıralaması için birleşik skor sütunu (otomatik hesaplanır).
--
-- Formul:
--   sort_score = (fiyat * 2) + (km * 10) + (begen_sayisi * 3) - (begenmeme_sayisi * 3)
--
-- Niye GENERATED ALWAYS AS ... STORED?
--   - Postgres her INSERT/UPDATE'te otomatik hesaplar
--   - Manuel trigger yazmamıza gerek yok
--   - Reaksiyon değişince begen_sayisi/begenmeme_sayisi (sql/11 trigger'ı)
--     güncelleniyor → otomatik bu sütun da yeniden hesaplanıyor
--   - Üstüne index koyarak sıralama çok hızlı
--
-- Idempotent: yeniden çalıştırılabilir.
-- ESKİ KAYITLAR ETKİLENMEZ — generated column tüm satırlar için
-- otomatik hesaplanır (begen_sayisi=0, begenmeme_sayisi=0 olanlar için
-- skor = fiyat*2 + km*10).
-- =============================================================

-- 1) Sütunu ekle (eğer yoksa)
alter table public.ilanlar
  add column if not exists sort_score int
  generated always as (
    (coalesce(fiyat, 0) * 2)
    + (coalesce(km, 0) * 10)
    + (coalesce(begen_sayisi, 0) * 3)
    - (coalesce(begenmeme_sayisi, 0) * 3)
  ) stored;

-- 2) Sıralama için index (büyük listede hızlı sort)
create index if not exists ilanlar_sort_score_idx
  on public.ilanlar(sort_score desc);

-- 3) Sütuna açıklama
comment on column public.ilanlar.sort_score is
  'Birleşik sıralama skoru — DB otomatik hesaplar (fiyat*2 + km*10 + begen*3 - begenmeme*3). v117 ücret-odaklı + topluluk geri bildirimi.';

-- =============================================================
-- Doğrulama: skorların doğru hesaplandığını gör
--   select id, kisa_id, fiyat, km, begen_sayisi, begenmeme_sayisi, sort_score
--   from ilanlar
--   order by sort_score desc
--   limit 10;
-- =============================================================
