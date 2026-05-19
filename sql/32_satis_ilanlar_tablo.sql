-- =====================================================================
-- 32: satis_ilanlar tablosu (v194) — sahibinden tarzı pazaryeri
-- =====================================================================
-- ESKİ (sql/31): profiles tablosunda satis_* kolonları (1 kullanıcı = 1 ilan)
-- YENİ: ayrı satis_ilanlar tablosu (1 kullanıcı = N ilan)
--
-- Kullanıcı talebi: sahibinden.com benzeri yapı — birden çok ilan, 5 foto,
-- 30 gün otomatik pasif, kategori bazlı detay alanlar.
--
-- Kapsam (kuryelere odaklı): motor / scooter / bisiklet / ekipman / yedek_parca
-- =====================================================================

-- 1) Yeni tablo
create table if not exists public.satis_ilanlar (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kategori text not null check (kategori in ('motor', 'scooter', 'bisiklet', 'ekipman', 'yedek_parca')),
  baslik text not null check (length(baslik) >= 3 and length(baslik) <= 100),
  marka_model text,
  yil int check (yil is null or (yil >= 1980 and yil <= 2030)),
  motor_hacmi text,     -- '125cc', '250cc' vb (motor/scooter için)
  yakit text check (yakit is null or yakit in ('benzin', 'elektrikli', 'hibrit')),
  km int,
  durum text check (durum is null or durum in ('sifir', 'ikinci_el', 'hasarli', 'parca_icin')),
  fiyat int not null check (fiyat >= 0),
  aciklama text check (aciklama is null or length(aciklama) <= 2000),
  foto_urls text[] not null default '{}',
  bolge text,           -- ilçe adı veya 'tum'
  ozellikler jsonb default '{}',  -- esnek extra alanlar (ekipman tipi, parça tipi vs)
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  constraint satis_ilanlar_foto_count check (array_length(foto_urls, 1) is null or array_length(foto_urls, 1) <= 5)
);

-- 2) Indexler
-- NOT: partial index predicate'inde now() kullanılamaz (IMMUTABLE değil).
-- aktif=true filtresi yeterli; expires_at filtresi query tarafında uygulanır.
create index if not exists satis_ilanlar_kategori_idx on public.satis_ilanlar(kategori, aktif, created_at desc)
  where aktif = true;
create index if not exists satis_ilanlar_user_idx on public.satis_ilanlar(user_id, created_at desc);
create index if not exists satis_ilanlar_bolge_idx on public.satis_ilanlar(bolge) where aktif = true;
create index if not exists satis_ilanlar_fiyat_idx on public.satis_ilanlar(fiyat) where aktif = true;
create index if not exists satis_ilanlar_expires_idx on public.satis_ilanlar(expires_at) where aktif = true;

-- 3) RLS
alter table public.satis_ilanlar enable row level security;

drop policy if exists satis_ilanlar_select_public on public.satis_ilanlar;
create policy satis_ilanlar_select_public
  on public.satis_ilanlar
  for select
  using (true);

drop policy if exists satis_ilanlar_insert_own on public.satis_ilanlar;
create policy satis_ilanlar_insert_own
  on public.satis_ilanlar
  for insert
  with check (auth.uid() = user_id);

drop policy if exists satis_ilanlar_update_own on public.satis_ilanlar;
create policy satis_ilanlar_update_own
  on public.satis_ilanlar
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists satis_ilanlar_delete_own on public.satis_ilanlar;
create policy satis_ilanlar_delete_own
  on public.satis_ilanlar
  for delete
  using (auth.uid() = user_id);

-- Admin tüm satırlarda UPDATE/DELETE (moderasyon)
drop policy if exists satis_ilanlar_admin_update on public.satis_ilanlar;
create policy satis_ilanlar_admin_update
  on public.satis_ilanlar
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists satis_ilanlar_admin_delete on public.satis_ilanlar;
create policy satis_ilanlar_admin_delete
  on public.satis_ilanlar
  for delete
  using (public.is_admin());

-- 4) Public view (anonim erişim — aktif + süresi dolmamış)
drop view if exists public.satis_ilanlar_public cascade;
create view public.satis_ilanlar_public as
  select * from public.satis_ilanlar
  where aktif = true and expires_at > now();

-- 5) profiles tablosundan eski satis_* kolonlarını KALDIR (sql/31 ile eklendi)
alter table public.profiles drop column if exists satis_aktif;
alter table public.profiles drop column if exists satis_kategori;
alter table public.profiles drop column if exists satis_baslik;
alter table public.profiles drop column if exists satis_marka_model;
alter table public.profiles drop column if exists satis_yil;
alter table public.profiles drop column if exists satis_durum;
alter table public.profiles drop column if exists satis_fiyat;
alter table public.profiles drop column if exists satis_bolge;
alter table public.profiles drop column if exists satis_aciklama;
alter table public.profiles drop column if exists satis_foto_url;
alter table public.profiles drop column if exists satis_musait;
alter table public.profiles drop column if exists satis_musait_at;

-- 6) Otomatik pasifleştirme (opsiyonel — şu an aktif=true tutar, expires_at filtresi yeterli)
-- pg_cron job ileride eklenebilir.

-- =====================================================================
-- KONTROL:
--   \d satis_ilanlar  -- yeni tablo görünmeli
--   \d profiles       -- satis_* kolonları KALMAMIŞ olmalı
--   select count(*) from public.satis_ilanlar;  -- 0 olmalı
-- =====================================================================
