import { fetchMyProfile, updateMyProfile } from '../api.js'
import { el, clear } from './dom.js'
import { toast } from './toast.js'

export function renderProfil({ root, session }) {
  clear(root)

  const header = el('div', { class: 'page-header' }, [
    el('div', { class: 'page-header__title' }, [
      el('h1', { class: 'h1', text: 'Profil' }),
      el('p', { class: 'muted', text: 'Lengkapi nama, gelar, dan unit agar tampil rapi di monitoring.' }),
    ]),
  ])

  const card = el('div', { class: 'card' })
  const form = el('form', { class: 'form form--grid' })

  const fNama = inputField({ label: 'Nama', name: 'nama', placeholder: 'Contoh: Suriami', required: true })
  const fGelar = inputField({ label: 'Gelar', name: 'gelar', placeholder: 'Contoh: SKM' })
  const fUnit = inputField({ label: 'Unit', name: 'unit', placeholder: 'Contoh: Tata Usaha' })
  const note = el('div', { class: 'hint' })
  const actions = el('div', { class: 'form__actions' }, [
    el('button', { class: 'btn btn--primary', type: 'submit', text: 'Simpan profil' }),
  ])

  form.appendChild(fNama)
  form.appendChild(fGelar)
  form.appendChild(fUnit)
  form.appendChild(note)
  form.appendChild(actions)
  card.appendChild(form)

  root.appendChild(header)
  root.appendChild(card)

  const userId = session?.user?.id

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    setNote('')
    setBusy(true)
    const fd = new FormData(form)
    const nama = String(fd.get('nama') ?? '').trim()
    const gelar = String(fd.get('gelar') ?? '').trim()
    const unit = String(fd.get('unit') ?? '').trim()

    try {
      if (!nama) throw new Error('Nama wajib diisi.')
      await updateMyProfile(userId, { nama, gelar, unit })
      toast({ kind: 'success', message: 'Profil berhasil disimpan.' })
    } catch (err) {
      setNote(err?.message ? String(err.message) : 'Gagal menyimpan profil.')
    } finally {
      setBusy(false)
    }
  })

  load()

  async function load() {
    setBusy(true)
    try {
      const profile = await fetchMyProfile(userId)
      form.nama.value = profile?.nama ?? ''
      form.gelar.value = profile?.gelar ?? ''
      form.unit.value = profile?.unit ?? ''
    } catch (err) {
      toast({ kind: 'error', message: err?.message ? String(err.message) : 'Gagal memuat profil.' })
    } finally {
      setBusy(false)
    }
  }

  function setNote(msg) {
    note.textContent = msg
    note.classList.toggle('hint--error', Boolean(msg))
  }

  function setBusy(busy) {
    for (const input of root.querySelectorAll('input,textarea,button,select')) input.disabled = busy
    root.classList.toggle('is-busy', busy)
  }
}

function inputField({ label, name, placeholder = '', required = false }) {
  return el('label', { class: 'field' }, [
    el('div', { class: 'field__label', text: label }),
    el('input', { class: 'input', name, type: 'text', placeholder, required: required ? 'true' : undefined }),
  ])
}

