create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  gelar text,
  unit text,
  jenis_pegawai text,
  nip text,
  nik text,
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_nip_unique on public.profiles (nip) where nip is not null;
create unique index if not exists profiles_nik_unique on public.profiles (nik) where nik is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, nama, gelar, unit, jenis_pegawai, nip, nik)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', ''),
    nullif(new.raw_user_meta_data->>'gelar', ''),
    nullif(new.raw_user_meta_data->>'unit', ''),
    nullif(lower(new.raw_user_meta_data->>'jenis_pegawai'), ''),
    case
      when lower(new.raw_user_meta_data->>'jenis_pegawai') = 'asn' then nullif(new.raw_user_meta_data->>'nomor_id', '')
      else null
    end,
    case
      when lower(new.raw_user_meta_data->>'jenis_pegawai') <> 'asn' then nullif(new.raw_user_meta_data->>'nomor_id', '')
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.kegiatan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  judul text not null,
  lokasi text,
  keterangan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tanggal_valid check (tanggal_selesai >= tanggal_mulai)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kegiatan_set_updated_at on public.kegiatan;

create trigger kegiatan_set_updated_at
before update on public.kegiatan
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.kegiatan enable row level security;

drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles
for select
to authenticated
using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists kegiatan_select_authenticated on public.kegiatan;
create policy kegiatan_select_authenticated
on public.kegiatan
for select
to authenticated
using (true);

drop policy if exists kegiatan_insert_own on public.kegiatan;
create policy kegiatan_insert_own
on public.kegiatan
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists kegiatan_update_own on public.kegiatan;
create policy kegiatan_update_own
on public.kegiatan
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists kegiatan_delete_own on public.kegiatan;
create policy kegiatan_delete_own
on public.kegiatan
for delete
to authenticated
using (user_id = auth.uid());

alter publication supabase_realtime add table public.kegiatan;
