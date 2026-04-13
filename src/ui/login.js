import { el, clear } from './dom.js'

export function renderLogin({ root, onLogin, onRegister }) {
  clear(root)

  const container = el('div', { class: 'auth' })
  const card = el('div', { class: 'card auth__card' })

  const title = el('h1', { class: 'h1', text: 'Masuk' })
  const subtitle = el('p', { class: 'muted', text: 'Login menggunakan NIP (ASN) atau NIK (Non ASN) dan password.' })

  const modeTabs = el('div', { class: 'tabs' }, [
    el('button', { class: 'tabs__btn tabs__btn--active', type: 'button', dataset: { mode: 'login' }, text: 'Login' }),
    el('button', { class: 'tabs__btn', type: 'button', dataset: { mode: 'register' }, text: 'Daftar' }),
  ])

  const form = el('form', { class: 'form' })

  const jenisField = fieldSelect({
    label: 'Jenis pegawai',
    name: 'jenisPegawai',
    options: [
      { value: 'asn', label: 'ASN (NIP)' },
      { value: 'non-asn', label: 'Non ASN (NIK)' },
    ],
  })

  const nomorIdField = fieldText({ label: 'NIP', name: 'nomorId', placeholder: 'Isi NIP (18 digit)' })
  const namaField = fieldText({ label: 'Nama', name: 'nama', placeholder: 'Contoh: Suriami' })
  const gelarField = fieldText({ label: 'Gelar', name: 'gelar', placeholder: 'Contoh: SKM (opsional)' })
  const unitField = fieldText({ label: 'Unit', name: 'unit', placeholder: 'Contoh: Tata Usaha (opsional)' })
  const passField = fieldText({ label: 'Password', name: 'password', type: 'password', placeholder: 'Minimal 6 karakter' })

  const note = el('div', { class: 'hint' })
  const actions = el('div', { class: 'form__actions' }, [
    el('button', { class: 'btn btn--primary', type: 'submit', text: 'Masuk' }),
  ])

  form.appendChild(jenisField)
  form.appendChild(nomorIdField)
  form.appendChild(namaField)
  form.appendChild(gelarField)
  form.appendChild(unitField)
  form.appendChild(passField)
  form.appendChild(note)
  form.appendChild(actions)

  const footer = el('div', { class: 'auth__footer muted', html: 'Jika verifikasi email masih aktif di Supabase, sebaiknya dimatikan agar tidak perlu email.' })

  card.appendChild(title)
  card.appendChild(subtitle)
  card.appendChild(modeTabs)
  card.appendChild(form)
  card.appendChild(footer)
  container.appendChild(card)
  root.appendChild(container)

  let mode = 'login'
  applyMode()

  jenisField.querySelector('select').addEventListener('change', () => {
    applyNomorIdLabel()
    setNote('')
  })

  modeTabs.addEventListener('click', (e) => {
    const btn = e.target?.closest?.('button[data-mode]')
    if (!btn) return
    mode = btn.dataset.mode
    for (const b of modeTabs.querySelectorAll('button[data-mode]')) {
      b.classList.toggle('tabs__btn--active', b.dataset.mode === mode)
    }
    applyMode()
  })

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const jenisPegawai = String(fd.get('jenisPegawai') ?? 'asn')
    const nomorIdRaw = String(fd.get('nomorId') ?? '')
    const nomorId = nomorIdRaw.replaceAll(/\D/g, '')
    const password = String(fd.get('password') ?? '')
    const nama = String(fd.get('nama') ?? '').trim()
    const gelar = String(fd.get('gelar') ?? '').trim()
    const unit = String(fd.get('unit') ?? '').trim()

    setNote('')
    setLoading(true)

    try {
      if (mode === 'login') {
        validateNomorId({ jenisPegawai, nomorId })
        await onLogin?.({ jenisPegawai, nomorId, password })
      } else {
        if (!nama) throw new Error('Nama wajib diisi saat daftar.')
        validateNomorId({ jenisPegawai, nomorId })
        await onRegister?.({ jenisPegawai, nomorId, password, nama, gelar, unit })
      }
    } catch (err) {
      setNote(err?.message ? String(err.message) : 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  })

  function applyMode() {
    const isRegister = mode === 'register'
    title.textContent = isRegister ? 'Daftar' : 'Masuk'
    actions.querySelector('button[type="submit"]').textContent = isRegister ? 'Daftar' : 'Masuk'
    jenisField.classList.toggle('is-hidden', false)
    nomorIdField.classList.toggle('is-hidden', false)
    namaField.classList.toggle('is-hidden', !isRegister)
    gelarField.classList.toggle('is-hidden', !isRegister)
    unitField.classList.toggle('is-hidden', !isRegister)
    applyNomorIdLabel()
    setNote('')
  }

  function applyNomorIdLabel() {
    const jenis = String(form.jenisPegawai.value ?? 'asn')
    const isAsn = jenis === 'asn'
    nomorIdField.querySelector('.field__label').textContent = isAsn ? 'NIP' : 'NIK'
    nomorIdField.querySelector('input').placeholder = isAsn ? 'Isi NIP (18 digit)' : 'Isi NIK (16 digit)'
  }

  function setNote(msg) {
    note.textContent = msg
    note.classList.toggle('hint--error', Boolean(msg))
  }

  function setLoading(loading) {
    for (const input of form.querySelectorAll('input,button')) input.disabled = loading
  }
}

function fieldText({ label, name, type = 'text', placeholder = '' }) {
  const wrap = el('label', { class: 'field' })
  wrap.appendChild(el('div', { class: 'field__label', text: label }))
  wrap.appendChild(
    el('input', {
      class: 'input',
      name,
      type,
      placeholder,
      autocomplete: name === 'password' ? 'current-password' : 'on',
    })
  )
  return wrap
}

function fieldSelect({ label, name, options }) {
  const wrap = el('label', { class: 'field' })
  wrap.appendChild(el('div', { class: 'field__label', text: label }))
  const select = el('select', { class: 'input', name })
  for (const opt of options) select.appendChild(el('option', { value: opt.value, text: opt.label }))
  wrap.appendChild(select)
  return wrap
}

function validateNomorId({ jenisPegawai, nomorId }) {
  const jenis = String(jenisPegawai ?? '').toLowerCase()
  if (!nomorId) throw new Error(jenis === 'asn' ? 'NIP wajib diisi.' : 'NIK wajib diisi.')
  if (!/^\d+$/.test(nomorId)) throw new Error(jenis === 'asn' ? 'NIP harus angka.' : 'NIK harus angka.')
  if (jenis === 'asn' && nomorId.length !== 18) throw new Error('NIP harus 18 digit.')
  if (jenis !== 'asn' && nomorId.length !== 16) throw new Error('NIK harus 16 digit.')
}
