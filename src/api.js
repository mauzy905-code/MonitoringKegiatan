import { supabase } from './supabaseClient.js'

function normalizeDigits(s) {
  return String(s ?? '').replaceAll(/\D/g, '')
}

export function toAuthEmail({ jenisPegawai, nomorId }) {
  const digits = normalizeDigits(nomorId)
  const kind = String(jenisPegawai ?? '').toLowerCase()
  const domain = kind === 'asn' ? 'asn.local' : 'nonasn.local'
  return `${digits}@${domain}`
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}

export async function signInWithPassword({ jenisPegawai, nomorId, password }) {
  const email = toAuthEmail({ jenisPegawai, nomorId })
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUpWithPassword({ jenisPegawai, nomorId, password, nama, gelar, unit }) {
  const email = toAuthEmail({ jenisPegawai, nomorId })
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nama: nama ?? '',
        gelar: gelar ?? '',
        unit: unit ?? '',
        jenis_pegawai: String(jenisPegawai ?? '').toLowerCase(),
        nomor_id: normalizeDigits(nomorId),
      },
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateMyProfile(userId, { nama, gelar, unit }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ nama, gelar, unit })
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function listKegiatan({ dateFrom, dateTo } = {}) {
  let q = supabase
    .from('kegiatan')
    .select('id,user_id,tanggal_mulai,tanggal_selesai,judul,lokasi,keterangan,created_at,updated_at,profiles(nama,gelar,unit)')
    .order('tanggal_mulai', { ascending: false })
    .order('created_at', { ascending: false })

  if (dateFrom && dateTo) {
    q = q.lte('tanggal_mulai', dateTo).gte('tanggal_selesai', dateFrom)
  } else if (dateFrom) {
    q = q.gte('tanggal_selesai', dateFrom)
  } else if (dateTo) {
    q = q.lte('tanggal_mulai', dateTo)
  }

  const { data, error } = await q
  if (error) throw error
  return data ?? []
}

export async function listKegiatanMine(userId) {
  const { data, error } = await supabase
    .from('kegiatan')
    .select('id,user_id,tanggal_mulai,tanggal_selesai,judul,lokasi,keterangan,created_at,updated_at')
    .eq('user_id', userId)
    .order('tanggal_mulai', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createKegiatan({ userId, tanggalMulai, tanggalSelesai, judul, lokasi, keterangan }) {
  const { data, error } = await supabase
    .from('kegiatan')
    .insert({
      user_id: userId,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      judul,
      lokasi: lokasi ?? null,
      keterangan: keterangan ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function updateKegiatan({ id, userId, tanggalMulai, tanggalSelesai, judul, lokasi, keterangan }) {
  const { data, error } = await supabase
    .from('kegiatan')
    .update({
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      judul,
      lokasi: lokasi ?? null,
      keterangan: keterangan ?? null,
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteKegiatan({ id, userId }) {
  const { error } = await supabase.from('kegiatan').delete().eq('id', id).eq('user_id', userId)
  if (error) throw error
}

export function subscribeKegiatanChanges(onChange) {
  const channel = supabase
    .channel('realtime:kegiatan')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'kegiatan' },
      () => onChange?.()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
