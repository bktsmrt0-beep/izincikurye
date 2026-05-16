-- =============================================================
-- sql/15_ilanlar_public_view_refresh.sql
-- Niye: ilanlar_public view'ı eski (sort_score, kalp_sayisi, begen_sayisi,
-- begenmeme_sayisi, etiketler, kisa_id sütunlarından önce oluşturulmuştu)
--
-- Sonuç: anonim kullanıcı `order=sort_score.desc` çağırınca 400 hatası →
-- sayfa skeleton'da takılır.
--
-- Çözüm: view'ı DROP + CREATE ile yeniden oluştur, tüm sütunları EXPLICIT
-- listele. Böylece ileride yeni sütun eklenince hangisinin view'da olduğu net.
--
-- DİKKAT: 'create or replace view' bazı durumlarda sütun ekleme/sırasını
-- değiştirmeye izin vermez. Onun için 'drop + create' kullanıyoruz.
-- =============================================================

drop view if exists public.ilanlar_public;

create view public.ilanlar_public as
  select
    id,
    user_id,
    baslik,
    ilce,
    saat,
    fiyat,
    km,
    bas_saat,
    bit_saat,
    aciklama,
    isyeri_ad,
    isyeri_adres,
    iletisim_tel,
    etiketler,
    kisa_id,
    kalp_sayisi,
    begen_sayisi,
    begenmeme_sayisi,
    sort_score,
    created_at,
    expires_at
  from public.ilanlar
  where expires_at > now();

-- View RLS davranışı: 'security invoker' (Postgres 15+) ile çağıran kullanıcı
-- haklarıyla çalışır. Eski Postgres'te view tablonun RLS'ini bypass eder.
-- Mevcut davranışı korumak için açıkça belirtmiyoruz.

-- Doğrulama: tüm sütunların var olduğunu gör
--   select column_name from information_schema.columns
--   where table_schema = 'public' and table_name = 'ilanlar_public'
--   order by ordinal_position;
--
-- En altta 'sort_score' görmelisin.
-- =============================================================
