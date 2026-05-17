-- =====================================================================
-- 17: İlçe bazlı yeni ilan bildirim aboneliği (v149)
-- =====================================================================
-- Kullanıcı belirli bir Ankara ilçesi için "yeni ilan paylaşılınca bildir"
-- talebini kaydeder. Mail teslim sistemi (Edge Function + Resend) henüz
-- aktif değil; bu fazda sadece tablo + RLS hazırlanır. Edge Function
-- deploy edildiğinde notify_new_ilan_webhook (sql/04) bu tabloyu join'le
-- abone listesi çekip Resend batch send yapacak.
-- =====================================================================

create table if not exists public.ilan_bildirim_takip (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ilce        text not null,    -- Ankara ilçesi; "all" desteklenmez (spam önleme — UI level)
  created_at  timestamptz not null default now(),
  unique (user_id, ilce)
);

create index if not exists ilan_bildirim_takip_ilce_idx on public.ilan_bildirim_takip(ilce);
create index if not exists ilan_bildirim_takip_user_idx on public.ilan_bildirim_takip(user_id);

alter table public.ilan_bildirim_takip enable row level security;

-- Kendi aboneliklerini görür
drop policy if exists "bildirim_takip_select_own" on public.ilan_bildirim_takip;
create policy "bildirim_takip_select_own"
  on public.ilan_bildirim_takip for select to authenticated
  using (auth.uid() = user_id);

-- Kendi aboneliğini ekler
drop policy if exists "bildirim_takip_insert_own" on public.ilan_bildirim_takip;
create policy "bildirim_takip_insert_own"
  on public.ilan_bildirim_takip for insert to authenticated
  with check (auth.uid() = user_id);

-- Kendi aboneliğini siler
drop policy if exists "bildirim_takip_delete_own" on public.ilan_bildirim_takip;
create policy "bildirim_takip_delete_own"
  on public.ilan_bildirim_takip for delete to authenticated
  using (auth.uid() = user_id);

-- Admin tümünü görür (Edge Function batch için)
drop policy if exists "bildirim_takip_select_admin" on public.ilan_bildirim_takip;
create policy "bildirim_takip_select_admin"
  on public.ilan_bildirim_takip for select to authenticated
  using (is_admin());

-- =====================================================================
-- KONTROL:
--   select * from public.ilan_bildirim_takip order by created_at desc;
--   select ilce, count(*) as abone from public.ilan_bildirim_takip group by ilce;
-- =====================================================================
