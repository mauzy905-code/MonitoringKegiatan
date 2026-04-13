import { getSession, onAuthStateChange, signInWithPassword, signOut, signUpWithPassword } from './api.js'
import { renderLayout } from './ui/layout.js'
import { renderLogin } from './ui/login.js'
import { renderMonitoring } from './ui/monitoring.js'
import { renderKegiatanSaya } from './ui/kegiatanSaya.js'
import { renderProfil } from './ui/profil.js'
import { toast } from './ui/toast.js'

export function startApp(root) {
  let session = null
  let routeCleanup = null

  const sync = async () => {
    session = await getSession()
    render()
  }

  const { data: authListener } = onAuthStateChange((s) => {
    session = s
    render()
  })

  window.addEventListener('hashchange', render)

  sync().catch((err) => {
    toast({ kind: 'error', message: err?.message ? String(err.message) : 'Gagal memuat sesi.' })
    render()
  })

  function render() {
    if (routeCleanup) {
      routeCleanup()
      routeCleanup = null
    }

    const route = parseRoute(location.hash)

    if (!session) {
      routeCleanup = null
      renderLogin({
        root,
        onLogin: async ({ jenisPegawai, nomorId, password }) => {
          await signInWithPassword({ jenisPegawai, nomorId, password })
          toast({ kind: 'success', message: 'Berhasil masuk.' })
        },
        onRegister: async ({ jenisPegawai, nomorId, password, nama, gelar, unit }) => {
          const res = await signUpWithPassword({ jenisPegawai, nomorId, password, nama, gelar, unit })
          if (res?.user && !res?.session) {
            toast({ kind: 'info', message: 'Pendaftaran berhasil. Silakan login.' })
          } else {
            toast({ kind: 'success', message: 'Pendaftaran berhasil.' })
          }
        },
      })
      return
    }

    const { main } = renderLayout({
      root,
      session,
      activeRoute: route,
      onNavigate: (href) => {
        location.hash = href.replace('#', '')
      },
      onSignOutClick: async () => {
        try {
          await signOut()
          toast({ kind: 'success', message: 'Anda sudah keluar.' })
        } catch (err) {
          toast({ kind: 'error', message: err?.message ? String(err.message) : 'Gagal keluar.' })
        }
      },
    })

    if (route === 'kegiatan-saya') {
      routeCleanup = renderKegiatanSaya({ root: main, session })
    } else if (route === 'profil') {
      routeCleanup = renderProfil({ root: main, session })
    } else {
      routeCleanup = renderMonitoring({ root: main, session })
    }
  }

  return () => {
    window.removeEventListener('hashchange', render)
    authListener?.subscription?.unsubscribe?.()
  }
}

function parseRoute(hash) {
  const h = String(hash || '').replace(/^#\/?/, '')
  if (h.startsWith('kegiatan-saya')) return 'kegiatan-saya'
  if (h.startsWith('profil')) return 'profil'
  return 'monitoring'
}
