-- =====================================================================
-- 26: Çekici araç tipi 3 değere indirildi (v185)
-- =====================================================================
-- ESKİ (sql/25): lastikli / suruklemeli / platformlu / agir_vasita
-- YENİ:           motor_cekici / arac_cekici / her_ikisi
--
-- Kullanıcı için daha anlaşılır: hizmetin kime (motorcu / sürücü) hitap
-- ettiği teknik araç ayrımından önemli.
--
-- Mevcut çekici ilanı verisi varsa map et (lastikli/suruklemeli/agir_vasita
-- → arac_cekici, platformlu → her_ikisi gibi). Şu an yeni feature olduğu
-- için muhtemelen veri yok.
-- =====================================================================

-- 1) Mevcut veriyi yeni şemaya map et (varsa)
update public.ilanlar
   set cekici_arac_tipi = case
     when cekici_arac_tipi = 'platformlu' then 'her_ikisi'
     when cekici_arac_tipi in ('lastikli','suruklemeli','agir_vasita') then 'arac_cekici'
     else cekici_arac_tipi
   end
 where cekici_arac_tipi in ('lastikli','suruklemeli','platformlu','agir_vasita');

-- 2) Eski CHECK constraint'i bul ve drop et (ad bağımsız)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.ilanlar'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%cekici_arac_tipi%'
  loop
    execute 'alter table public.ilanlar drop constraint ' || quote_ident(c.conname);
  end loop;
end $$;

-- 3) Yeni CHECK constraint
alter table public.ilanlar
  add constraint ilanlar_cekici_arac_tipi_check
  check (cekici_arac_tipi is null or cekici_arac_tipi in ('motor_cekici', 'arac_cekici', 'her_ikisi'));

-- 4) View recreate (CLAUDE.md tuzak #49) — kolon eklemiyoruz ama constraint
--    değişikliğinde view'ı yenilemek alışkanlık olarak iyi.
drop view if exists public.ilanlar_public cascade;
create view public.ilanlar_public as
  select * from public.ilanlar
  where
    (tur in ('anlik_kurye', 'cekici') and expires_at > now() and durum = 'onayli')
    or
    (tur in ('tam_zamanli', 'esnaf_kurye', 'arabali_kurye') and durum = 'onayli');

-- =====================================================================
-- KONTROL:
--   select distinct cekici_arac_tipi from public.ilanlar where tur = 'cekici';
--   -- Sadece yeni değerler (motor_cekici/arac_cekici/her_ikisi) görünmeli.
-- =====================================================================
