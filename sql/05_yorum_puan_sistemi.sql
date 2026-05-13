-- ============================================================
-- izincikurye — Yorum & Puan Sistemi
-- Akış:
--   1) İşletme kendi ilanını kaldırırken kurye telefonunu girer.
--   2) Telefon kayıtlı bir kuryeye denk gelirse yorum_haklari'na 1 satır eklenir.
--   3) İşletme o hakkı kullanarak yorumlar tablosuna 1 yorum yazabilir.
--   4) Yorum eklenince profiles.puan_ort & puan_sayisi otomatik güncellenir.
--
-- Supabase SQL Editor'da SIRAYLA çalıştır.
-- ============================================================

-- ============================================================
-- 1) yorumlar tablosu
-- ============================================================
create table if not exists yorumlar (
  id           uuid primary key default gen_random_uuid(),
  kurye_id     uuid not null references profiles(id) on delete cascade,
  isletme_id   uuid not null references profiles(id) on delete cascade,
  ilan_id      uuid,                       -- kaldırılan ilan referansı (null olabilir; ilan silinmiş olabilir)
  puan         smallint not null check (puan between 1 and 5),
  yorum        text check (char_length(yorum) <= 500),
  created_at   timestamptz not null default now(),
  unique (kurye_id, isletme_id, ilan_id)   -- aynı ilan icin iki yorum yok
);

create index if not exists yorumlar_kurye_idx on yorumlar(kurye_id, created_at desc);
create index if not exists yorumlar_isletme_idx on yorumlar(isletme_id, created_at desc);

-- ============================================================
-- 2) yorum_haklari tablosu — işletmenin hangi kurye için yorum yazma hakkı var?
-- ============================================================
create table if not exists yorum_haklari (
  id           uuid primary key default gen_random_uuid(),
  kurye_id     uuid not null references profiles(id) on delete cascade,
  isletme_id   uuid not null references profiles(id) on delete cascade,
  ilan_id      uuid,                       -- hangi ilandan dogdu (referans, ilan silinmis olabilir)
  ilan_baslik  text,                       -- ilan silindiginde kalsin diye snapshot
  kullanildi   boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (kurye_id, isletme_id, ilan_id)
);

create index if not exists yorum_haklari_isletme_idx on yorum_haklari(isletme_id, kullanildi, created_at desc);

-- ============================================================
-- 3) profiles tablosuna denormalize puan alanları
-- ============================================================
alter table profiles add column if not exists puan_ort numeric(3,2);  -- 0.00 - 5.00
alter table profiles add column if not exists puan_sayisi int not null default 0;

-- ============================================================
-- 4) Yorum eklenince/silinince kuryenin puan_ort & puan_sayisi güncelle
-- ============================================================
create or replace function refresh_kurye_puan(p_kurye_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update profiles
  set puan_ort = (
        select round(avg(puan)::numeric, 2)
        from yorumlar where kurye_id = p_kurye_id
      ),
      puan_sayisi = (
        select count(*) from yorumlar where kurye_id = p_kurye_id
      )
  where id = p_kurye_id;
end;
$$;

create or replace function yorum_after_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if tg_op = 'DELETE' then
    perform refresh_kurye_puan(old.kurye_id);
  else
    perform refresh_kurye_puan(new.kurye_id);
  end if;
  return null;
end;
$$;

drop trigger if exists yorum_refresh_trigger on yorumlar;
create trigger yorum_refresh_trigger
  after insert or update or delete on yorumlar
  for each row execute function yorum_after_change();

-- ============================================================
-- 5) Yorum hakkı verme fonksiyonu (RPC) — işletme tel girdiğinde çağırır
--    Telefon eşleşirse: yeni yorum_haklari satırı oluşturulur ve ilan silinir.
--    Eşleşmezse: ilan yine silinir ama hak verilmez.
-- ============================================================
create or replace function grant_review_and_delete_ilan(
  p_ilan_id uuid,
  p_kurye_tel text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_ilan ilanlar%rowtype;
  v_kurye_id uuid;
  v_normalized_tel text;
begin
  -- İlanı çek + sahiplik kontrolü
  select * into v_ilan from ilanlar where id = p_ilan_id;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'ilan_bulunamadi');
  end if;
  if v_ilan.user_id <> auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'yetkisiz');
  end if;

  -- Telefon normalize (sadece rakam)
  v_normalized_tel := regexp_replace(coalesce(p_kurye_tel, ''), '\D', '', 'g');

  -- Telefondan kurye bul (kurye olmali, regexp_replace ile rakam eslestir)
  if length(v_normalized_tel) >= 10 then
    select id into v_kurye_id
    from profiles
    where kullanici_tipi = 'kurye'
      and regexp_replace(coalesce(tel,''), '\D', '', 'g') = v_normalized_tel
    limit 1;
  end if;

  -- Eslesme varsa yorum hakkı ver
  if v_kurye_id is not null and v_kurye_id <> auth.uid() then
    insert into yorum_haklari (kurye_id, isletme_id, ilan_id, ilan_baslik)
    values (v_kurye_id, auth.uid(), v_ilan.id, v_ilan.baslik)
    on conflict (kurye_id, isletme_id, ilan_id) do nothing;
  end if;

  -- Sonra ilanı sil
  delete from ilanlar where id = p_ilan_id;

  return jsonb_build_object(
    'ok', true,
    'matched', v_kurye_id is not null,
    'kurye_id', v_kurye_id
  );
end;
$$;

-- ============================================================
-- 6) RLS — yorumlar & yorum_haklari
-- ============================================================
alter table yorumlar enable row level security;
alter table yorum_haklari enable row level security;

-- yorumlar: herkes okuyabilir (kurye karti uzerinde gosterilecek)
drop policy if exists yorumlar_select_all on yorumlar;
create policy yorumlar_select_all on yorumlar
  for select to anon, authenticated using (true);

-- yorumlar: SADECE hakkı olan işletme insert yapabilir
drop policy if exists yorumlar_insert_with_right on yorumlar;
create policy yorumlar_insert_with_right on yorumlar
  for insert to authenticated
  with check (
    isletme_id = auth.uid()
    and exists (
      select 1 from yorum_haklari yh
      where yh.isletme_id = auth.uid()
        and yh.kurye_id = yorumlar.kurye_id
        and yh.ilan_id is not distinct from yorumlar.ilan_id
        and yh.kullanildi = false
    )
  );

-- yorumlar: kendi yorumunu silebilir (ileri vadede edit eklenebilir)
drop policy if exists yorumlar_delete_own on yorumlar;
create policy yorumlar_delete_own on yorumlar
  for delete to authenticated using (isletme_id = auth.uid());

-- yorum_haklari: sadece sahibi (işletme) okur
drop policy if exists yorum_haklari_select_self on yorum_haklari;
create policy yorum_haklari_select_self on yorum_haklari
  for select to authenticated using (isletme_id = auth.uid());

-- yorum_haklari: insert yalnız grant_review_and_delete_ilan RPC'si (security definer) tarafından yapılır
-- Direct insert client'tan yapılmasın diye policy yok (security definer bypass eder)

-- yorum_haklari: kullanılınca update edilir
drop policy if exists yorum_haklari_update_self on yorum_haklari;
create policy yorum_haklari_update_self on yorum_haklari
  for update to authenticated using (isletme_id = auth.uid())
  with check (isletme_id = auth.uid());

-- ============================================================
-- 7) Yorum yazıldığında hakkı 'kullanildi' işaretle
-- ============================================================
create or replace function mark_yorum_hakki_used()
returns trigger
language plpgsql
security definer
as $$
begin
  update yorum_haklari
  set kullanildi = true
  where isletme_id = new.isletme_id
    and kurye_id = new.kurye_id
    and ilan_id is not distinct from new.ilan_id;
  return new;
end;
$$;

drop trigger if exists yorum_hakki_used_trigger on yorumlar;
create trigger yorum_hakki_used_trigger
  after insert on yorumlar
  for each row execute function mark_yorum_hakki_used();

-- ============================================================
-- Test:
--   select * from yorum_haklari where isletme_id = auth.uid();
--   select grant_review_and_delete_ilan('<ilan_uuid>', '05321234567');
-- ============================================================
