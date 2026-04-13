import { el, clear } from './dom.js'

export function renderLayout({ root, session, activeRoute, onNavigate, onSignOutClick }) {
  clear(root)

  const header = el('header', { class: 'app-header' }, [
    el('div', { class: 'brand' }, [
      el('div', { class: 'brand__title', text: 'Monitoring Kegiatan RS' }),
      el('div', { class: 'brand__subtitle', text: 'RSUD AMI' }),
    ]),
    el('nav', { class: 'nav' }, [
      navLink({ label: 'Monitoring', href: '#/monitoring', active: activeRoute === 'monitoring', onNavigate }),
      navLink({ label: 'Kegiatan Saya', href: '#/kegiatan-saya', active: activeRoute === 'kegiatan-saya', onNavigate }),
      navLink({ label: 'Profil', href: '#/profil', active: activeRoute === 'profil', onNavigate }),
    ]),
    el('div', { class: 'userbar' }, [
      el('div', { class: 'userbar__email', text: session?.user?.email ?? '' }),
      el(
        'button',
        {
          class: 'btn btn--ghost',
          type: 'button',
          onclick: () => onSignOutClick?.(),
        },
        [el('span', { text: 'Keluar' })]
      ),
    ]),
  ])

  const main = el('main', { class: 'app-main' })

  root.appendChild(header)
  root.appendChild(main)

  return { main }
}

function navLink({ label, href, active, onNavigate }) {
  return el(
    'a',
    {
      class: active ? 'nav__link nav__link--active' : 'nav__link',
      href,
      onclick: (e) => {
        e.preventDefault()
        onNavigate?.(href)
      },
    },
    [label]
  )
}

