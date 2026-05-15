-- =============================================================
-- sql/11_reaksiyonlar_sayilar.sql
-- Eğlenceli reaksiyonlar: beğen / beğenmeme (birbirini iter)
-- + ilanlar tablosunda denormalized sayaçlar (kalp/begen/begenmeme)
-- + auto-update trigger'ları
-- Idempotent: yeniden çalıştırılabilir.
-- =============================================================

-- 1) DENORMALIZED SAYAÇLAR (ilanlar üzerinde) -----------------
alter table public.ilanlar
  add column if not exists kalp_sayisi int not null default 0,
  add column if not exists begen_sayisi int not null default 0,
  add column if not exists begenmeme_sayisi int not null default 0;

-- 2) REAKSİYONLAR TABLOSU --------------------------------------
create table if not exists public.reaksiyonlar (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ilan_id     uuid not null references public.ilanlar(id) on delete cascade,
  tip         text not null check (tip in ('begen','begenmeme')),
  created_at  timestamptz not null default now(),
  unique (user_id, ilan_id)  -- bir kullanıcı bir ilan için tek reaksiyon (begen veya begenmeme)
);

create index if not exists reaksiyonlar_ilan_idx on public.reaksiyonlar(ilan_id);
create index if not exists reaksiyonlar_user_idx on public.reaksiyonlar(user_id);

alter table public.reaksiyonlar enable row level security;

drop policy if exists "reaksiyonlar_select_all" on public.reaksiyonlar;
create policy "reaksiyonlar_select_all" on public.reaksiyonlar
  for select using (true);  -- herkes okur (kendi reaksiyonunu bilmek için)

drop policy if exists "reaksiyonlar_insert_own" on public.reaksiyonlar;
create policy "reaksiyonlar_insert_own" on public.reaksiyonlar
  for insert with check (auth.uid() = user_id);

drop policy if exists "reaksiyonlar_update_own" on public.reaksiyonlar;
create policy "reaksiyonlar_update_own" on public.reaksiyonlar
  for update using (auth.uid() = user_id);

drop policy if exists "reaksiyonlar_delete_own" on public.reaksiyonlar;
create policy "reaksiyonlar_delete_own" on public.reaksiyonlar
  for delete using (auth.uid() = user_id);

-- 3) TRIGGER: reaksiyonlar -> ilanlar.begen_sayisi/begenmeme_sayisi
create or replace function public.bump_reaksiyon_sayilar()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    if new.tip = 'begen' then
      update public.ilanlar set begen_sayisi = begen_sayisi + 1 where id = new.ilan_id;
    else
      update public.ilanlar set begenmeme_sayisi = begenmeme_sayisi + 1 where id = new.ilan_id;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.tip <> new.tip then
      if old.tip = 'begen' then
        update public.ilanlar set begen_sayisi = greatest(0, begen_sayisi - 1) where id = old.ilan_id;
      else
        update public.ilanlar set begenmeme_sayisi = greatest(0, begenmeme_sayisi - 1) where id = old.ilan_id;
      end if;
      if new.tip = 'begen' then
        update public.ilanlar set begen_sayisi = begen_sayisi + 1 where id = new.ilan_id;
      else
        update public.ilanlar set begenmeme_sayisi = begenmeme_sayisi + 1 where id = new.ilan_id;
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    if old.tip = 'begen' then
      update public.ilanlar set begen_sayisi = greatest(0, begen_sayisi - 1) where id = old.ilan_id;
    else
      update public.ilanlar set begenmeme_sayisi = greatest(0, begenmeme_sayisi - 1) where id = old.ilan_id;
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_reaksiyon_sayilar on public.reaksiyonlar;
create trigger trg_reaksiyon_sayilar
  after insert or update or delete on public.reaksiyonlar
  for each row execute function public.bump_reaksiyon_sayilar();

-- 4) TRIGGER: favoriler -> ilanlar.kalp_sayisi
create or replace function public.bump_kalp_sayisi()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.ilanlar set kalp_sayisi = kalp_sayisi + 1 where id = new.ilan_id;
  elsif tg_op = 'DELETE' then
    update public.ilanlar set kalp_sayisi = greatest(0, kalp_sayisi - 1) where id = old.ilan_id;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_kalp_sayisi on public.favoriler;
create trigger trg_kalp_sayisi
  after insert or delete on public.favoriler
  for each row execute function public.bump_kalp_sayisi();

-- 5) BACKFILL — mevcut favorilerden kalp_sayisi'nı doldur
update public.ilanlar i
set kalp_sayisi = coalesce((
  select count(*) from public.favoriler f where f.ilan_id = i.id
), 0);

-- Mevcut reaksiyonlar zaten yok ama formalite için reset
update public.ilanlar set begen_sayisi = 0, begenmeme_sayisi = 0 where begen_sayisi <> 0 or begenmeme_sayisi <> 0;

-- =============================================================
-- Doğrulama:
--   select id, kisa_id, kalp_sayisi, begen_sayisi, begenmeme_sayisi
--   from ilanlar order by created_at desc limit 5;
-- =============================================================
