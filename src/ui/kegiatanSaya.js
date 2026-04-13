import { createKegiatan, deleteKegiatan, listKegiatanMine, updateKegiatan } from '../api.js'
import { el, clear, formatDateRange } from './dom.js'
import { toast } from './toast.js'

export function renderKegiatanSaya({ root, session }) {
  clear(root)

  const header = el('div', { class: 'page-header' }, [
    el('div', { class: 'page-header__title' }, [
      el('h1', { class: 'h1', text: 'Kegiatan Saya' }),
      el('p', { class: 'muted', text: 'Tambah, edit, atau hapus kegiatan Anda.' }),
    ]),
  ])

  const formCard = el('div', { class: 'card' })
  const formTitle = el('h2', { class: 'h2', text: 'Tambah kegiatan' })
  const form = el('form', { class: 'form form--grid' })

  const fMulai = inputField({ label: 'Tanggal mulai', type: 'date', name: 'tanggalMulai', required: true })
  const fSelesai = inputField({ label: 'Tanggal selesai', type: 'date', name: 'tanggalSelesai', required: true })
  const fJudul = inputField({ label: 'Kegiatan', type: 'text', name: 'judul', placeholder: 'Contoh: Pertemuan', required: true })
  const fLokasi = inputField({ label: 'Lokasi/Instansi', type: 'text', name: 'lokasi', placeholder: 'Contoh: Diskominfo' })
  const fKet = textareaField({ label: 'Keterangan', name: 'keterangan', placeholder: 'Opsional' })

  const note = el('div', { class: 'hint' })
  const actions = el('div', { class: 'form__actions' }, [
    el('button', { class: 'btn btn--primary', type: 'submit', text: 'Simpan' }),
    el('button', { class: 'btn btn--ghost', type: 'button', text: 'Batal' }),
  ])

  form.appendChild(fMulai)
  form.appendChild(fSelesai)
  form.appendChild(fJudul)
  form.appendChild(fLokasi)
  form.appendChild(fKet)
  form.appendChild(note)
  form.appendChild(actions)
  formCard.appendChild(formTitle)
  formCard.appendChild(form)

  const listCard = el('div', { class: 'card' })
  const listTitle = el('h2', { class: 'h2', text: 'Daftar kegiatan' })
  const listMeta = el('div', { class: 'meta' })
  const list = el('div', { class: 'list' })
  listCard.appendChild(listTitle)
  listCard.appendChild(listMeta)
  listCard.appendChild(list)

  root.appendChild(header)
  root.appendChild(formCard)
  root.appendChild(listCard)

  const userId = session?.user?.id
  const draftKey = userId ? `draft:kegiatan:${userId}` : null
  let items = []
  let editingId = null
  let draft = readDraft()

  const btnCancel = actions.querySelector('button[type="button"]')

  btnCancel.addEventListener('click', () => {
    if (editingId) {
      setEditing(null)
      return
    }
    draft = null
    if (draftKey) sessionStorage.removeItem(draftKey)
    applyDraftToForm()
    setNote('')
  })

  wireDraftPersistence()

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    setNote('')
    const payload = readPayload()

    try {
      if (!payload.tanggalMulai || !payload.tanggalSelesai) throw new Error('Tanggal mulai dan selesai wajib diisi.')
      if (payload.tanggalSelesai < payload.tanggalMulai) throw new Error('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.')
      if (!payload.judul) throw new Error('Kegiatan wajib diisi.')

      setBusy(true)
      if (editingId) {
        await updateKegiatan({ id: editingId, ...payload })
        toast({ kind: 'success', message: 'Kegiatan berhasil diperbarui.' })
      } else {
        await createKegiatan(payload)
        toast({ kind: 'success', message: 'Kegiatan berhasil ditambahkan.' })
      }

      await load()
      draft = null
      if (draftKey) sessionStorage.removeItem(draftKey)
      setEditing(null)
    } catch (err) {
      setNote(err?.message ? String(err.message) : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  })

  applyDraftToForm()
  load()

  async function load() {
    setBusy(true)
    try {
      items = await listKegiatanMine(userId)
      renderList()
    } catch (err) {
      toast({ kind: 'error', message: err?.message ? String(err.message) : 'Gagal memuat data.' })
    } finally {
      setBusy(false)
    }
  }

  function renderList() {
    clear(list)
    listMeta.textContent = `${items.length} kegiatan`

    if (items.length === 0) {
      list.appendChild(el('div', { class: 'muted', text: 'Belum ada kegiatan.' }))
      return
    }

    for (const it of items) {
      const title = el('div', { class: 'list-item__title', text: it.judul })
      const sub = el('div', { class: 'list-item__sub muted', text: formatDateRange({ start: it.tanggal_mulai, end: it.tanggal_selesai }) })
      const meta = el('div', { class: 'list-item__meta muted', text: [it.lokasi, it.keterangan].filter(Boolean).join(' • ') || '-' })

      const btnEdit = el('button', { class: 'btn btn--sm', type: 'button', text: 'Edit' })
      const btnDel = el('button', { class: 'btn btn--sm btn--danger', type: 'button', text: 'Hapus' })

      btnEdit.addEventListener('click', () => setEditing(it))
      btnDel.addEventListener('click', async () => {
        const ok = confirm('Hapus kegiatan ini?')
        if (!ok) return
        setBusy(true)
        try {
          await deleteKegiatan({ id: it.id, userId })
          toast({ kind: 'success', message: 'Kegiatan dihapus.' })
          await load()
          if (editingId === it.id) setEditing(null)
        } catch (err) {
          toast({ kind: 'error', message: err?.message ? String(err.message) : 'Gagal menghapus.' })
        } finally {
          setBusy(false)
        }
      })

      list.appendChild(
        el('div', { class: 'list-item' }, [
          el('div', { class: 'list-item__body' }, [title, sub, meta]),
          el('div', { class: 'list-item__actions' }, [btnEdit, btnDel]),
        ])
      )
    }
  }

  function setEditing(it) {
    editingId = it?.id ?? null
    formTitle.textContent = editingId ? 'Edit kegiatan' : 'Tambah kegiatan'
    form.querySelector('button[type="submit"]').textContent = editingId ? 'Simpan perubahan' : 'Simpan'
    btnCancel.textContent = editingId ? 'Batal' : 'Bersihkan'

    if (editingId) {
      form.tanggalMulai.value = it?.tanggal_mulai ?? ''
      form.tanggalSelesai.value = it?.tanggal_selesai ?? ''
      form.judul.value = it?.judul ?? ''
      form.lokasi.value = it?.lokasi ?? ''
      form.keterangan.value = it?.keterangan ?? ''
    } else {
      applyDraftToForm()
    }
    setNote('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function setNote(msg) {
    note.textContent = msg
    note.classList.toggle('hint--error', Boolean(msg))
  }

  function setBusy(busy) {
    for (const input of root.querySelectorAll('input,textarea,button,select')) input.disabled = busy
    root.classList.toggle('is-busy', busy)
  }

  function readDraft() {
    if (!draftKey) return null
    try {
      const raw = sessionStorage.getItem(draftKey)
      if (!raw) return null
      const obj = JSON.parse(raw)
      if (!obj || typeof obj !== 'object') return null
      return {
        tanggalMulai: String(obj.tanggalMulai ?? ''),
        tanggalSelesai: String(obj.tanggalSelesai ?? ''),
        judul: String(obj.judul ?? ''),
        lokasi: String(obj.lokasi ?? ''),
        keterangan: String(obj.keterangan ?? ''),
      }
    } catch {
      return null
    }
  }

  function applyDraftToForm() {
    form.tanggalMulai.value = draft?.tanggalMulai ?? ''
    form.tanggalSelesai.value = draft?.tanggalSelesai ?? ''
    form.judul.value = draft?.judul ?? ''
    form.lokasi.value = draft?.lokasi ?? ''
    form.keterangan.value = draft?.keterangan ?? ''
  }

  function wireDraftPersistence() {
    if (!draftKey) return
    const handler = () => {
      if (editingId) return
      draft = {
        tanggalMulai: String(form.tanggalMulai.value ?? ''),
        tanggalSelesai: String(form.tanggalSelesai.value ?? ''),
        judul: String(form.judul.value ?? ''),
        lokasi: String(form.lokasi.value ?? ''),
        keterangan: String(form.keterangan.value ?? ''),
      }
      sessionStorage.setItem(draftKey, JSON.stringify(draft))
    }

    for (const control of [form.tanggalMulai, form.tanggalSelesai, form.judul, form.lokasi, form.keterangan]) {
      control.addEventListener('input', handler)
      control.addEventListener('change', handler)
    }
  }

  function readPayload() {
    const fd = new FormData(form)
    return {
      userId,
      tanggalMulai: String(fd.get('tanggalMulai') ?? ''),
      tanggalSelesai: String(fd.get('tanggalSelesai') ?? ''),
      judul: String(fd.get('judul') ?? '').trim(),
      lokasi: String(fd.get('lokasi') ?? '').trim(),
      keterangan: String(fd.get('keterangan') ?? '').trim(),
    }
  }
}

function inputField({ label, name, type, placeholder = '', required = false }) {
  return el('label', { class: 'field' }, [
    el('div', { class: 'field__label', text: label }),
    el('input', { class: 'input', name, type, placeholder, required: required ? 'true' : undefined }),
  ])
}

function textareaField({ label, name, placeholder = '' }) {
  return el('label', { class: 'field field--span2' }, [
    el('div', { class: 'field__label', text: label }),
    el('textarea', { class: 'input textarea', name, placeholder, rows: '3' }),
  ])
}
