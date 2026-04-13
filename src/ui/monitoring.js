import { listKegiatan, subscribeKegiatanChanges } from '../api.js'
import { el, clear, debounce, formatDateRange, normalizeText } from './dom.js'
import { toast } from './toast.js'
import { downloadCsv } from '../utils/csv.js'

export function renderMonitoring({ root }) {
  clear(root)

  const header = el('div', { class: 'page-header' }, [
    el('div', { class: 'page-header__title' }, [
      el('h1', { class: 'h1', text: 'Monitoring Kegiatan' }),
      el('p', { class: 'muted', text: 'Semua pegawai yang login dapat melihat seluruh kegiatan.' }),
    ]),
  ])

  const filters = el('div', { class: 'filters' })
  const dateFrom = el('input', { class: 'input', type: 'date' })
  const dateTo = el('input', { class: 'input', type: 'date' })
  const search = el('input', { class: 'input', type: 'search', placeholder: 'Cari nama pegawai / kegiatan...' })
  const unit = el('select', { class: 'input' }, [el('option', { value: '', text: 'Semua unit' })])

  const btnRefresh = el('button', { class: 'btn', type: 'button', text: 'Muat ulang' })
  const btnCsv = el('button', { class: 'btn', type: 'button', text: 'Export CSV' })
  const btnPrint = el('button', { class: 'btn btn--ghost', type: 'button', text: 'Print' })

  filters.appendChild(fieldInline({ label: 'Dari', control: dateFrom }))
  filters.appendChild(fieldInline({ label: 'Sampai', control: dateTo }))
  filters.appendChild(fieldInline({ label: 'Unit', control: unit }))
  filters.appendChild(fieldInline({ label: 'Cari', control: search }))
  filters.appendChild(el('div', { class: 'filters__actions' }, [btnRefresh, btnCsv, btnPrint]))

  const meta = el('div', { class: 'meta' })
  const tableWrap = el('div', { class: 'table-wrap' })
  const table = el('table', { class: 'table' })
  table.appendChild(
    el('thead', {}, [
      el('tr', {}, [
        el('th', { text: 'Pegawai' }),
        el('th', { text: 'Unit' }),
        el('th', { text: 'Tanggal' }),
        el('th', { text: 'Kegiatan' }),
        el('th', { text: 'Lokasi' }),
        el('th', { text: 'Keterangan' }),
      ]),
    ])
  )
  const tbody = el('tbody')
  table.appendChild(tbody)
  tableWrap.appendChild(table)

  root.appendChild(header)
  root.appendChild(filters)
  root.appendChild(meta)
  root.appendChild(tableWrap)

  let allRows = []
  let unsubscribe = null

  const load = async () => {
    setBusy(true)
    try {
      const items = await listKegiatan({
        dateFrom: dateFrom.value || undefined,
        dateTo: dateTo.value || undefined,
      })
      allRows = items.map(toRow)
      refreshUnits(allRows)
      renderRows()
      meta.textContent = `${allRows.length} kegiatan`
    } catch (err) {
      toast({ kind: 'error', message: err?.message ? String(err.message) : 'Gagal memuat data.' })
    } finally {
      setBusy(false)
    }
  }

  btnRefresh.addEventListener('click', load)
  btnPrint.addEventListener('click', () => window.print())
  btnCsv.addEventListener('click', () => {
    const rows = getFilteredRows()
    downloadCsv({
      filename: `monitoring-kegiatan-${new Date().toISOString().slice(0, 10)}.csv`,
      rows: rows.map((r) => ({
        Pegawai: r.pegawaiLabel,
        Unit: r.unit,
        TanggalMulai: r.tanggalMulai,
        TanggalSelesai: r.tanggalSelesai,
        Kegiatan: r.judul,
        Lokasi: r.lokasi,
        Keterangan: r.keterangan,
      })),
    })
  })

  dateFrom.addEventListener('change', load)
  dateTo.addEventListener('change', load)
  unit.addEventListener('change', renderRows)
  search.addEventListener('input', debounce(renderRows, 120))

  unsubscribe = subscribeKegiatanChanges(() => {
    if (document.visibilityState !== 'visible') return
    load()
  })

  load()

  return () => {
    if (unsubscribe) unsubscribe()
  }

  function renderRows() {
    clear(tbody)
    const rows = getFilteredRows()
    meta.textContent = `${rows.length} kegiatan`
    if (rows.length === 0) {
      tbody.appendChild(
        el('tr', {}, [
          el('td', { class: 'muted', colspan: 6, text: 'Tidak ada data untuk filter ini.' }),
        ])
      )
      return
    }

    for (const r of rows) {
      tbody.appendChild(
        el('tr', {}, [
          el('td', {}, [
            el('div', { class: 'cell-main', text: r.pegawaiLabel }),
            r.email ? el('div', { class: 'cell-sub muted', text: r.email }) : null,
          ]),
          el('td', { text: r.unit || '-' }),
          el('td', { text: formatDateRange({ start: r.tanggalMulai, end: r.tanggalSelesai }) }),
          el('td', { text: r.judul }),
          el('td', { text: r.lokasi || '-' }),
          el('td', { text: r.keterangan || '-' }),
        ])
      )
    }
  }

  function getFilteredRows() {
    const q = normalizeText(search.value)
    const unitValue = unit.value
    let rows = allRows

    if (unitValue) rows = rows.filter((r) => normalizeText(r.unit) === normalizeText(unitValue))
    if (q) {
      rows = rows.filter((r) => {
        const hay = normalizeText([r.pegawaiLabel, r.unit, r.judul, r.lokasi, r.keterangan].join(' '))
        return hay.includes(q)
      })
    }
    return rows
  }

  function refreshUnits(rows) {
    const prev = unit.value
    const units = Array.from(
      new Set(rows.map((r) => String(r.unit ?? '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))

    clear(unit)
    unit.appendChild(el('option', { value: '', text: 'Semua unit' }))
    for (const u of units) unit.appendChild(el('option', { value: u, text: u }))
    if (units.includes(prev)) unit.value = prev
  }

  function setBusy(busy) {
    btnRefresh.disabled = busy
    btnCsv.disabled = busy
    dateFrom.disabled = busy
    dateTo.disabled = busy
    unit.disabled = busy
    search.disabled = busy
    root.classList.toggle('is-busy', busy)
  }
}

function fieldInline({ label, control }) {
  return el('label', { class: 'field-inline' }, [
    el('div', { class: 'field-inline__label muted', text: label }),
    control,
  ])
}

function toRow(item) {
  const p = item.profiles ?? {}
  const nama = String(p.nama ?? '').trim()
  const gelar = String(p.gelar ?? '').trim()
  const pegawaiLabel = [nama, gelar].filter(Boolean).join(', ') || 'Tanpa Nama'

  return {
    id: item.id,
    userId: item.user_id,
    pegawaiLabel,
    unit: p.unit ?? '',
    tanggalMulai: item.tanggal_mulai,
    tanggalSelesai: item.tanggal_selesai,
    judul: item.judul ?? '',
    lokasi: item.lokasi ?? '',
    keterangan: item.keterangan ?? '',
    email: '',
  }
}

