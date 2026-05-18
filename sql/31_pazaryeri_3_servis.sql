-- =====================================================================
-- 31: Pazaryeri 3 yeni servis tipi — Tamir / Satış / Muhasebe (v192)
-- =====================================================================
-- profiles tablosuna 3 set kolon ekler (çekici pattern paraleli).
-- Her servis için ayrı bir alanlar setine ve müsait toggle'a sahiptir.
-- Bir işletme aynı anda birden fazla servis aktif edebilir (örn. hem
-- çekici hem tamir hizmeti veriyor olabilir).
-- =====================================================================

-- ============================== TAMIR ==============================
alter table public.profiles add column if not exists tamir_aktif boolean not null default false;
alter table public.profiles add column if not exists tamir_hizmet_tipi text
  check (tamir_hizmet_tipi is null or tamir_hizmet_tipi in ('motor', 'arac', 'her_ikisi', 'elektrik', 'lastik'));
alter table public.profiles add column if not exists tamir_bolge text;
alter table public.profiles add column if not exists tamir_min_ucret int;
alter table public.profiles add column if not exists tamir_max_ucret int;
alter table public.profiles add column if not exists tamir_aciklama text;
alter table public.profiles add column if not exists tamir_etiketler text[] default '{}';
alter table public.profiles add column if not exists tamir_musait boolean not null default false;
alter table public.profiles add column if not exists tamir_musait_at timestamptz;

create index if not exists profiles_tamir_musait_idx on public.profiles(tamir_musait, tamir_musait_at desc)
  where tamir_aktif = true and tamir_musait = true;

-- ============================== SATIŞ ==============================
-- Satış "müsait" değil, "ilanım aktif" anlamı taşır. Aynı pattern.
alter table public.profiles add column if not exists satis_aktif boolean not null default false;
alter table public.profiles add column if not exists satis_kategori text
  check (satis_kategori is null or satis_kategori in ('motor', 'scooter', 'ekipman', 'parca', 'bisiklet'));
alter table public.profiles add column if not exists satis_baslik text;
alter table public.profiles add column if not exists satis_marka_model text;
alter table public.profiles add column if not exists satis_yil int;
alter table public.profiles add column if not exists satis_durum text
  check (satis_durum is null or satis_durum in ('sifir', 'ikinci_el'));
alter table public.profiles add column if not exists satis_fiyat int;
alter table public.profiles add column if not exists satis_bolge text;
alter table public.profiles add column if not exists satis_aciklama text;
alter table public.profiles add column if not exists satis_foto_url text;
alter table public.profiles add column if not exists satis_musait boolean not null default false;
alter table public.profiles add column if not exists satis_musait_at timestamptz;

create index if not exists profiles_satis_aktif_idx on public.profiles(satis_musait, satis_musait_at desc)
  where satis_aktif = true and satis_musait = true;

-- ============================== MUHASEBE ==============================
alter table public.profiles add column if not exists muhasebe_aktif boolean not null default false;
alter table public.profiles add column if not exists muhasebe_hizmet text
  check (muhasebe_hizmet is null or muhasebe_hizmet in ('vergi', 'sgk', 'sirket_kurulum', 'genel', 'diger'));
alter table public.profiles add column if not exists muhasebe_bolge text;
alter table public.profiles add column if not exists muhasebe_aciklama text;
alter table public.profiles add column if not exists muhasebe_etiketler text[] default '{}';
alter table public.profiles add column if not exists muhasebe_musait boolean not null default false;
alter table public.profiles add column if not exists muhasebe_musait_at timestamptz;

create index if not exists profiles_muhasebe_musait_idx on public.profiles(muhasebe_musait, muhasebe_musait_at desc)
  where muhasebe_aktif = true and muhasebe_musait = true;

-- =====================================================================
-- KONTROL:
--   \d profiles  -- 25+ yeni kolon görünmeli
--   select tamir_aktif, satis_aktif, muhasebe_aktif from public.profiles limit 5;
-- =====================================================================
