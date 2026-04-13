import { el } from './dom.js'

let host = null

export function ensureToastHost() {
  if (host) return host
  host = el('div', { class: 'toast-host', 'aria-live': 'polite' })
  document.body.appendChild(host)
  return host
}

export function toast({ message, kind = 'info', timeoutMs = 3500 }) {
  ensureToastHost()
  const item = el('div', { class: `toast toast--${kind}`, role: kind === 'error' ? 'alert' : 'status' }, [
    el('div', { class: 'toast__msg', text: message }),
  ])
  host.appendChild(item)

  const remove = () => {
    if (!item.isConnected) return
    item.classList.add('toast--hide')
    setTimeout(() => item.remove(), 200)
  }

  setTimeout(remove, timeoutMs)
  item.addEventListener('click', remove)
}

