export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag)

  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === undefined || v === null) continue
    if (k === 'class') node.className = v
    else if (k === 'dataset') Object.assign(node.dataset, v)
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v)
    else if (k === 'text') node.textContent = v
    else if (k === 'html') node.innerHTML = v
    else node.setAttribute(k, String(v))
  }

  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === undefined || child === null) continue
    if (typeof child === 'string') node.appendChild(document.createTextNode(child))
    else node.appendChild(child)
  }

  return node
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild)
}

export function formatDateRange({ start, end }) {
  if (!start && !end) return '-'
  if (start && end && start !== end) return `${start}–${end}`
  return start || end
}

export function normalizeText(s) {
  return String(s ?? '').trim().toLowerCase()
}

export function debounce(fn, waitMs) {
  let t = null
  return (...args) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), waitMs)
  }
}

