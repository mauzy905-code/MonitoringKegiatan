# Monitoring Kegiatan RSUD AMI

Website monitoring kegiatan pegawai (Supabase + GitHub Pages).

## Fitur

- Login / Daftar (email + password)
- Monitoring kegiatan semua pegawai (filter tanggal, unit, pencarian, export CSV, print)
- Kegiatan saya (tambah/edit/hapus)
- Profil (isi nama, gelar, unit)

## Setup Supabase

1. Buat project di Supabase.
2. Buka SQL Editor, jalankan `supabase.sql`.
3. Auth:
   - Aktifkan Email provider (email + password)
   - Jika Email confirmation aktif, user baru perlu verifikasi email sebelum login.
4. Realtime:
   - Pastikan Realtime aktif (script sudah menambahkan tabel `kegiatan` ke publication `supabase_realtime`).

## Environment

Buat `.env.local`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Jalankan Lokal

```
npm install
npm run dev
```

## Deploy GitHub Pages

1. Push repo ke GitHub (branch `main`).
2. Buat Secrets di GitHub repo:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Di repo GitHub: Settings → Pages → Source: GitHub Actions.
4. Setelah deploy, tambahkan Site URL di Supabase:
   - Supabase Dashboard → Authentication → URL Configuration
   - Site URL: `https://<username>.github.io/<repo>/`
