import { el, clear } from './dom.js'

export function renderLogin({ root, onLogin, onRegister }) {
  clear(root)

  const container = el('div', { class: 'auth' })
  const card = el('div', { class: 'card auth__card' })

  const title = el('h1', { class: 'h1', text: 'Masuk' })
  const subtitle = el('p', { class: 'muted', text: 'Gunakan email dan password untuk melihat & mengisi kegiatan.' })

  const modeTabs = el('div', { class: 'tabs' }, [
    el('button', { class: 'tabs__btn tabs__btn--active', type: 'button', dataset: { mode: 'login' }, text: 'Login' }),
    el('button', { class: 'tabs__btn', type: 'button', dataset: { mode: 'register' }, text: 'Daftar' }),
  ])

  const form = el('form', { class: 'form' })

  const namaField = fieldText({ label: 'Nama', name: 'nama', placeholder: 'Contoh: Suriami' })
  const gelarField = fieldText({ label: 'Gelar', name: 'gelar', placeholder: 'Contoh: SKM (opsional)' })
  const unitField = fieldText({ label: 'Unit', name: 'unit', placeholder: 'Contoh: Tata Usaha (opsional)' })
  const emailField = fieldText({ label: 'Email', name: 'email', type: 'email', placeholder: 'nama@rsud.go.id' })
  const passField = fieldText({ label: 'Password', name: 'password', type: 'password', placeholder: 'Minimal 6 karakter' })

  const note = el('div', { class: 'hint' })
  const actions = el('div', { class: 'form__actions' }, [
    el('button', { class: 'btn btn--primary', type: 'submit', text: 'Masuk' }),
  ])

  form.appendChild(namaField)
  form.appendChild(gelarField)
  form.appendChild(unitField)
  form.appendChild(emailField)
  form.appendChild(passField)
  form.appendChild(note)
  form.appendChild(actions)

  const footer = el('div', { class: 'auth__footer muted', html: 'Jika Anda baru daftar, cek email untuk verifikasi (jika fitur verifikasi email aktif).' })

  card.appendChild(title)
  card.appendChild(subtitle)
  card.appendChild(modeTabs)
  card.appendChild(form)
  card.appendChild(footer)
  container.appendChild(card)
  root.appendChild(container)

  let mode = 'login'
  applyMode()

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
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    const nama = String(fd.get('nama') ?? '').trim()
    const gelar = String(fd.get('gelar') ?? '').trim()
    const unit = String(fd.get('unit') ?? '').trim()

    setNote('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await onLogin?.({ email, password })
      } else {
        if (!nama) throw new Error('Nama wajib diisi saat daftar.')
        await onRegister?.({ email, password, nama, gelar, unit })
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
    namaField.classList.toggle('is-hidden', !isRegister)
    gelarField.classList.toggle('is-hidden', !isRegister)
    unitField.classList.toggle('is-hidden', !isRegister)
    setNote('')
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

