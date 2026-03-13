'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatEuro, berekenBod, schatMarktwaarde, STANDAARD_MARGES, MargeInstellingen } from '@/lib/bod'

type Lead = {
  id: string; referentie: string; merk: string; model: string; bouwjaar: number; km: number
  staat: string; bod: number; marktwaarde: number; status: string; verkoper_naam: string
  verkoper_telefoon: string; verkoper_email: string; gebreken: string; onderhoud: string
  brandstof: string; transmissie: string; kleur: string; aangemaakt_op: string; foto_urls: string[]
  notitie?: string
}
type GarageInstellingen = {
  naam: string; email: string; logo_url: string | null; kleur: string
  telefoon: string; website: string; adres: string
  notificatie_email: string; notificatie_sms: string
  openingsuren: string; welkomstbericht: string; auto_bod: boolean
}

const STATUS_LABELS: Record<string, string> = {
  nieuw: 'Nieuw', in_review: 'In review', bod_verstuurd: 'Bod verstuurd',
  geaccepteerd: 'Geaccepteerd', inspectie: 'Inspectie', afgerond: 'Afgerond',
  afgewezen: 'Afgewezen', vervallen: 'Vervallen',
}
const STATUS_KLEUREN: Record<string, string> = {
  nieuw: 'bg-blue-50 text-blue-700', in_review: 'bg-yellow-50 text-yellow-700',
  bod_verstuurd: 'bg-green-50 text-green-700', geaccepteerd: 'bg-green-100 text-green-800',
  inspectie: 'bg-purple-50 text-purple-700', afgerond: 'bg-gray-100 text-gray-500',
  afgewezen: 'bg-red-50 text-red-700', vervallen: 'bg-orange-50 text-orange-700',
}
const NAV = [
  { id: 'overzicht', label: 'Overzicht', icon: '◻' },
  { id: 'leads', label: 'Leads', icon: '◻' },
  { id: 'marges', label: 'Marges', icon: '◻' },
  { id: 'notificaties', label: 'Notificaties', icon: '◻' },
  { id: 'whitelabel', label: 'Instellingen', icon: '◻' },
]
const KLEUREN_PRESETS = [
  '#1a3a8f', '#991b1b', '#065f46', '#5b21b6', '#c2410c', '#111827', '#0369a1', '#b45309'
]

export default function Dashboard() {
  const [actief, setActief] = useState('overzicht')
  const [leads, setLeads] = useState<Lead[]>([])
  const [marges, setMarges] = useState<MargeInstellingen>(STANDAARD_MARGES)
  const [garage, setGarage] = useState<GarageInstellingen>({
    naam: '2maal2', email: '', logo_url: null, kleur: '#1a3a8f',
    telefoon: '', website: '', adres: 'Statiestraat 88, 8570 Anzegem',
    notificatie_email: '', notificatie_sms: '',
    openingsuren: 'Ma–Vr: 9:00–18:00\nZa: 9:00–13:00', welkomstbericht: '', auto_bod: true
  })
  const [margesLaden, setMargesLaden] = useState(true)
  const [margesOpgeslagen, setMargesOpgeslagen] = useState(false)
  const [instellingenOpgeslagen, setInstellingenOpgeslagen] = useState(false)
  const [logoUploaden, setLogoUploaden] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [geselecteerd, setGeselecteerd] = useState<Lead | null>(null)
  const [leadsLaden, setLeadsLaden] = useState(true)
  const [fotoViewer, setFotoViewer] = useState<{ urls: string[]; index: number } | null>(null)
  const [notitie, setNotitie] = useState('')
  const [notitieOpgeslagen, setNotitieOpgeslagen] = useState(false)

  const kleur = garage.kleur || '#1a3a8f'

  const laadLeads = useCallback(async () => {
    setLeadsLaden(true)
    try {
      const url = statusFilter ? `/api/leads?status=${statusFilter}` : '/api/leads'
      const res = await fetch(url)
      if (res.ok) setLeads(await res.json())
    } finally { setLeadsLaden(false) }
  }, [statusFilter])

  const laadMarges = useCallback(async () => {
    setMargesLaden(true)
    try {
      const res = await fetch('/api/garages/marges')
      if (res.ok) { const d = await res.json(); if (d) setMarges(d) }
    } finally { setMargesLaden(false) }
  }, [])

  const laadGarage = useCallback(async () => {
    try {
      const res = await fetch('/api/garages/instellingen')
      if (res.ok) { const d = await res.json(); if (d) setGarage(prev => ({ ...prev, ...d })) }
    } catch {}
  }, [])

  useEffect(() => { laadLeads() }, [laadLeads])
  useEffect(() => { laadMarges() }, [laadMarges])
  useEffect(() => { laadGarage() }, [laadGarage])

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    laadLeads()
    setGeselecteerd(prev => prev ? { ...prev, status } : null)
  }

  async function slaMargesOp() {
    const res = await fetch('/api/garages/marges', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(marges) })
    if (res.ok) { setMargesOpgeslagen(true); setTimeout(() => setMargesOpgeslagen(false), 2500) }
  }

  async function slaInstellingenOp() {
    const res = await fetch('/api/garages/instellingen', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(garage) })
    if (res.ok) { setInstellingenOpgeslagen(true); setTimeout(() => setInstellingenOpgeslagen(false), 2500) }
  }

  async function uploadLogo(file: File) {
    setLogoUploaden(true)
    try {
      const fd = new FormData(); fd.append('logo', file)
      const res = await fetch('/api/garages/logo', { method: 'POST', body: fd })
      if (res.ok) { const { url } = await res.json(); setGarage(prev => ({ ...prev, logo_url: url })) }
    } finally { setLogoUploaden(false) }
  }

  function selecteerLead(lead: Lead) {
    setGeselecteerd(lead)
    setNotitie(lead.notitie || '')
    setNotitieOpgeslagen(false)
  }

  const previewMW = schatMarktwaarde('Volkswagen', 2020, 60000, 'Benzine')
  const previewBod = berekenBod(previewMW, 'goed', 60000, marges)
  const nieuweLeads = leads.filter(l => l.status === 'nieuw').length
  const afgerond = leads.filter(l => l.status === 'afgerond').length
  const conversie = leads.length > 0 ? Math.round((afgerond / leads.length) * 100) : 0
  const totaalBodWaarde = leads.filter(l => l.bod).reduce((s, l) => s + l.bod, 0)

  return (
    <div className="flex min-h-screen bg-gray-50 text-sm">

      {/* Foto viewer */}
      {fotoViewer && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={() => setFotoViewer(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20">×</button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20"
            onClick={e => { e.stopPropagation(); setFotoViewer(p => p && p.index > 0 ? { ...p, index: p.index - 1 } : p) }}>‹</button>
          <img src={fotoViewer.urls[fotoViewer.index]} alt="" className="max-h-screen max-w-screen-lg object-contain p-8" onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20"
            onClick={e => { e.stopPropagation(); setFotoViewer(p => p && p.index < p.urls.length - 1 ? { ...p, index: p.index + 1 } : p) }}>›</button>
          <div className="absolute bottom-4 text-white text-xs opacity-60">{fotoViewer.index + 1} / {fotoViewer.urls.length}</div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-52 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2.5">
          {garage.logo_url
            ? <img src={garage.logo_url} alt={garage.naam} className="h-7 object-contain" />
            : <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: kleur }}>{garage.naam.substring(0, 2).toUpperCase()}</div>
          }
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{garage.naam}</div>
            <div className="text-xs text-gray-400">Dashboard</div>
          </div>
        </div>
        <nav className="flex-1 p-2 pt-3">
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setActief(item.id); setGeselecteerd(null) }}
              className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors`}
              style={actief === item.id ? { background: `${kleur}18`, color: kleur, fontWeight: 500 } : { color: '#6b7280' }}>
              {item.label}
              {item.id === 'leads' && nieuweLeads > 0 && (
                <span className="text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center" style={{ background: kleur }}>{nieuweLeads}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-1">
          <a href="/verkoper" target="_blank" className="block text-center text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">Bekijk wizard ↗</a>
        </div>
      </div>

      {/* Hoofdinhoud */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ═══ OVERZICHT ═══ */}
        {actief === 'overzicht' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <h1 className="text-base font-semibold text-gray-900">Overzicht</h1>
              <button onClick={laadLeads} className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">↺ Vernieuwen</button>
            </div>
            <div className="p-6 overflow-auto">
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Totaal leads', waarde: leads.length, sub: 'alle tijd' },
                  { label: 'Nieuw', waarde: nieuweLeads, sub: 'wachten op review', highlight: nieuweLeads > 0 },
                  { label: 'Conversie', waarde: `${conversie}%`, sub: `${afgerond} afgerond` },
                  { label: 'Totale bodwaarde', waarde: formatEuro(totaalBodWaarde), sub: 'indicatief' },
                ].map(m => (
                  <div key={m.label} className="rounded-xl border bg-white p-4"
                    style={m.highlight ? { borderColor: `${kleur}40`, background: `${kleur}06` } : { borderColor: '#f3f4f6' }}>
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className="text-2xl font-semibold mb-0.5" style={m.highlight ? { color: kleur } : { color: '#111827' }}>{m.waarde}</div>
                    <div className="text-xs text-gray-400">{m.sub}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border border-gray-100">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <div className="text-sm font-medium text-gray-700">Recente leads</div>
                  <button onClick={() => setActief('leads')} className="text-xs" style={{ color: kleur }}>Alle leads →</button>
                </div>
                {leadsLaden
                  ? <div className="py-10 text-center text-xs text-gray-400">Laden...</div>
                  : leads.length === 0
                  ? <div className="py-10 text-center text-xs text-gray-400">Nog geen leads. <a href="/verkoper" target="_blank" className="underline" style={{ color: kleur }}>Test de wizard</a></div>
                  : leads.slice(0, 8).map(lead => (
                    <div key={lead.id} onClick={() => { selecteerLead(lead); setActief('leads') }}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div>
                        <div className="font-medium text-gray-900">{lead.merk} {lead.model} <span className="font-normal text-gray-400">{lead.bouwjaar}</span></div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{lead.referentie} · {new Date(lead.aangemaakt_op).toLocaleDateString('nl-BE')}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-sm" style={{ color: kleur }}>{lead.bod ? formatEuro(lead.bod) : '—'}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_KLEUREN[lead.status] || ''}`}>{STATUS_LABELS[lead.status]}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </>
        )}

        {/* ═══ LEADS ═══ */}
        {actief === 'leads' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <h1 className="text-base font-semibold text-gray-900">Leads <span className="text-gray-400 font-normal text-sm">({leads.length})</span></h1>
              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white" value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setGeselecteerd(null) }}>
                <option value="">Alle statussen</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-auto">
                {leadsLaden
                  ? <div className="py-12 text-center text-xs text-gray-400">Laden...</div>
                  : leads.length === 0
                  ? <div className="py-12 text-center text-xs text-gray-400">Geen leads gevonden.</div>
                  : (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          {['Referentie', 'Voertuig', 'Km', 'Staat', 'Foto\'s', 'Bod', 'Status', 'Datum', ''].map(h => (
                            <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {leads.map(lead => (
                          <tr key={lead.id} onClick={() => selecteerLead(geselecteerd?.id === lead.id ? null as unknown as Lead : lead)}
                            className="border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50"
                            style={geselecteerd?.id === lead.id ? { background: `${kleur}08` } : {}}>
                            <td className="px-4 py-3 font-mono text-xs text-gray-400">{lead.referentie}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{lead.merk} {lead.model}</div>
                              <div className="text-xs text-gray-400">{lead.bouwjaar} · {lead.brandstof}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{lead.km?.toLocaleString('nl-BE')} km</td>
                            <td className="px-4 py-3 text-gray-500 capitalize text-xs">{lead.staat}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{lead.foto_urls?.length || 0}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{lead.bod ? formatEuro(lead.bod) : '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_KLEUREN[lead.status] || ''}`}>{STATUS_LABELS[lead.status]}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(lead.aangemaakt_op).toLocaleDateString('nl-BE')}</td>
                            <td className="px-4 py-3">
                              {lead.status === 'nieuw' && (
                                <button onClick={e => { e.stopPropagation(); updateStatus(lead.id, 'in_review') }}
                                  className="text-xs px-2.5 py-1 text-white rounded-lg whitespace-nowrap" style={{ background: kleur }}>
                                  Behandelen
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                }
              </div>

              {/* Detail panel */}
              {geselecteerd && (
                <div className="w-72 border-l border-gray-100 bg-white overflow-auto flex-shrink-0 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{geselecteerd.merk} {geselecteerd.model}</div>
                      <div className="text-xs font-mono text-gray-400 select-all">{geselecteerd.referentie}</div>
                    </div>
                    <button onClick={() => setGeselecteerd(null)} className="text-gray-300 text-xl hover:text-gray-500">×</button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 space-y-4">
                    {/* Foto's */}
                    {geselecteerd.foto_urls?.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-2">{geselecteerd.foto_urls.length} foto{geselecteerd.foto_urls.length > 1 ? "'s" : ''}</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {geselecteerd.foto_urls.map((url, i) => (
                            <button key={i} onClick={() => setFotoViewer({ urls: geselecteerd.foto_urls, index: i })}
                              className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Voertuig details */}
                    <div className="space-y-1.5">
                      {([
                        ['Bouwjaar', geselecteerd.bouwjaar?.toString()],
                        ['Kilometerstand', geselecteerd.km ? `${geselecteerd.km.toLocaleString('nl-BE')} km` : ''],
                        ['Brandstof', geselecteerd.brandstof], ['Transmissie', geselecteerd.transmissie],
                        ['Kleur', geselecteerd.kleur], ['Staat', geselecteerd.staat],
                        ['Onderhoud', geselecteerd.onderhoud],
                      ] as [string, string][]).filter(([, v]) => v).map(([l, v]) => (
                        <div key={l} className="flex justify-between text-xs">
                          <span className="text-gray-400">{l}</span>
                          <span className="text-gray-900 capitalize">{v}</span>
                        </div>
                      ))}
                      {geselecteerd.gebreken && (
                        <div className="pt-1">
                          <div className="text-xs text-gray-400 mb-1">Gebreken</div>
                          <div className="text-xs text-gray-700 bg-orange-50 rounded-lg p-2 leading-relaxed">{geselecteerd.gebreken}</div>
                        </div>
                      )}
                    </div>

                    {/* Bod */}
                    <div className="border-t border-gray-100 pt-3 space-y-1.5">
                      <div className="text-xs font-medium text-gray-500 mb-2">Bod</div>
                      <div className="flex justify-between text-xs"><span className="text-gray-400">Marktwaarde</span><span className="text-gray-700">{geselecteerd.marktwaarde ? formatEuro(geselecteerd.marktwaarde) : '—'}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-400">Indicatief bod</span><span className="font-semibold" style={{ color: kleur }}>{geselecteerd.bod ? formatEuro(geselecteerd.bod) : '—'}</span></div>
                    </div>

                    {/* Verkoper */}
                    <div className="border-t border-gray-100 pt-3 space-y-1.5">
                      <div className="text-xs font-medium text-gray-500 mb-2">Verkoper</div>
                      {([['Naam', geselecteerd.verkoper_naam], ['Telefoon', geselecteerd.verkoper_telefoon], ['E-mail', geselecteerd.verkoper_email]] as [string, string][])
                        .filter(([, v]) => v).map(([l, v]) => (
                          <div key={l} className="flex justify-between text-xs gap-2">
                            <span className="text-gray-400 flex-shrink-0">{l}</span>
                            <span className="text-gray-900 text-right break-all">{v}</span>
                          </div>
                        ))}
                      {geselecteerd.verkoper_telefoon && (
                        <a href={`tel:${geselecteerd.verkoper_telefoon}`}
                          className="mt-2 flex items-center justify-center gap-1.5 text-xs text-white rounded-lg py-2" style={{ background: kleur }}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Bel {geselecteerd.verkoper_naam?.split(' ')[0] || 'verkoper'}
                        </a>
                      )}
                    </div>

                    {/* Interne notitie */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">Interne notitie</div>
                      <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs resize-none focus:outline-none" rows={3}
                        placeholder="Notities voor intern gebruik..." value={notitie} onChange={e => setNotitie(e.target.value)} />
                      <button onClick={async () => {
                        await fetch(`/api/leads/${geselecteerd.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notitie }) })
                        setNotitieOpgeslagen(true); setTimeout(() => setNotitieOpgeslagen(false), 2000)
                      }} className="mt-1.5 w-full text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                        {notitieOpgeslagen ? '✓ Opgeslagen' : 'Notitie opslaan'}
                      </button>
                    </div>

                    {/* Status */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-xs font-medium text-gray-500 mb-2">Status wijzigen</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <button key={v} onClick={() => updateStatus(geselecteerd.id, v)}
                            className="text-xs px-2 py-2 rounded-lg border transition-colors text-left"
                            style={geselecteerd.status === v ? { borderColor: kleur, background: `${kleur}12`, color: kleur, fontWeight: 500 } : { borderColor: '#e5e7eb', color: '#6b7280' }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ MARGES ═══ */}
        {actief === 'marges' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Marges instellen</h1>
                <p className="text-xs text-gray-400 mt-0.5">De verkoper ziet enkel het eindbod — nooit de berekening</p>
              </div>
              <button onClick={slaMargesOp} className="text-xs px-4 py-2 rounded-lg font-medium text-white" style={{ background: margesOpgeslagen ? '#16a34a' : kleur }}>
                {margesOpgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
              </button>
            </div>
            <div className="p-6 max-w-xl overflow-auto">
              {margesLaden ? <div className="py-12 text-center text-xs text-gray-400">Laden...</div> : (
                <>
                  <div className="space-y-3 mb-5">
                    {([
                      { label: 'Basiskorting op marktwaarde', veld: 'basis_korting', min: 5, max: 35, step: 1, suffix: '%', toelichting: `Bij €10.000 marktwaarde → korting −€${Math.round(10000 * marges.basis_korting / 100).toLocaleString('nl-BE')}` },
                      { label: 'Vaste herstelreserve', veld: 'herstel_reserve', min: 0, max: 1000, step: 50, suffix: '€', toelichting: 'Altijd afgetrokken voor reconditioning' },
                      { label: 'Correctie staat "Uitstekend"', veld: 'correctie_uitstekend', min: 0, max: 500, step: 50, suffix: '€', toelichting: '' },
                      { label: 'Correctie staat "Goed"', veld: 'correctie_goed', min: 0, max: 1000, step: 50, suffix: '€', toelichting: '' },
                      { label: 'Correctie staat "Matig"', veld: 'correctie_matig', min: 0, max: 2000, step: 100, suffix: '€', toelichting: '' },
                      { label: 'Correctie staat "Te herstellen"', veld: 'correctie_herstel', min: 0, max: 4000, step: 100, suffix: '€', toelichting: '' },
                      { label: 'Km-drempel voor extra correctie', veld: 'km_drempel', min: 30000, max: 200000, step: 5000, suffix: 'km', toelichting: 'Boven deze grens wordt extra afgetrokken' },
                      { label: 'Correctie per 1.000 km boven drempel', veld: 'km_correctie_per_1000', min: 10, max: 100, step: 5, suffix: '€', toelichting: '' },
                    ] as { label: string; veld: keyof MargeInstellingen; min: number; max: number; step: number; suffix: string; toelichting: string }[]).map(({ label, veld, min, max, step, suffix, toelichting }) => (
                      <div key={veld} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex justify-between mb-2">
                          <label className="text-sm text-gray-700 font-medium">{label}</label>
                          <span className="font-semibold text-sm" style={{ color: kleur }}>
                            {suffix === '€' ? formatEuro(marges[veld] as number) : suffix === 'km' ? `${(marges[veld] as number).toLocaleString('nl-BE')} km` : `${marges[veld]}%`}
                          </span>
                        </div>
                        <input type="range" min={min} max={max} step={step} value={marges[veld] as number}
                          onChange={e => setMarges(prev => ({ ...prev, [veld]: parseInt(e.target.value) }))}
                          className="w-full" style={{ accentColor: kleur }} />
                        {toelichting && <p className="text-xs text-gray-400 mt-1">{toelichting}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl border p-4" style={{ background: `${kleur}08`, borderColor: `${kleur}25` }}>
                    <div className="text-xs font-semibold mb-3" style={{ color: kleur }}>Live preview — VW Golf 2020, goed, 60.000 km</div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        ['Marktwaarde', formatEuro(previewMW)],
                        [`Basiskorting (${marges.basis_korting}%)`, `− ${formatEuro(previewBod.basiskorting)}`],
                        ['Staat correctie (goed)', `− ${formatEuro(previewBod.staat_correctie)}`],
                        ['Herstelreserve', `− ${formatEuro(previewBod.herstel_reserve)}`],
                      ].map(([l, v]) => (
                        <div key={l} className="flex justify-between text-gray-600"><span>{l}</span><span>{v}</span></div>
                      ))}
                      <div className="flex justify-between font-semibold border-t pt-2 mt-1" style={{ color: kleur, borderColor: `${kleur}30` }}>
                        <span>Bod aan verkoper</span><span>{formatEuro(previewBod.bod)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ═══ NOTIFICATIES ═══ */}
        {actief === 'notificaties' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Notificaties</h1>
                <p className="text-xs text-gray-400 mt-0.5">Stel in wanneer en hoe u op de hoogte wordt gebracht</p>
              </div>
              <button onClick={slaInstellingenOp} className="text-xs px-4 py-2 rounded-lg font-medium text-white" style={{ background: instellingenOpgeslagen ? '#16a34a' : kleur }}>
                {instellingenOpgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
              </button>
            </div>
            <div className="p-6 max-w-lg space-y-4 overflow-auto">

              {/* E-mail notificaties */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kleur}15` }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: kleur }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">E-mail notificaties</div>
                    <div className="text-xs text-gray-400">Ontvang een e-mail bij elke nieuwe lead</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Notificatie-adres</label>
                  <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    placeholder="dieter@2maal2.be"
                    value={garage.notificatie_email || ''}
                    onChange={e => setGarage(prev => ({ ...prev, notificatie_email: e.target.value }))} />
                  <p className="text-xs text-gray-400 mt-1.5">Laat leeg om geen e-mails te ontvangen. Meerdere adressen: komma-gescheiden.</p>
                </div>
              </div>

              {/* SMS notificaties */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kleur}15` }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: kleur }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">SMS notificaties</div>
                    <div className="text-xs text-gray-400">Ontvang een sms bij elke nieuwe lead</div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">GSM-nummer</label>
                  <input type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                    placeholder="+32 4XX XX XX XX"
                    value={garage.notificatie_sms || ''}
                    onChange={e => setGarage(prev => ({ ...prev, notificatie_sms: e.target.value }))} />
                  <p className="text-xs text-gray-400 mt-1.5">SMS-notificaties vereisen een Twilio-koppeling (in te stellen via Vercel env).</p>
                </div>
              </div>

              {/* Automatisch bod */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kleur}15` }}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: kleur }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Automatisch bod tonen</div>
                      <div className="text-xs text-gray-400">Verkoper ziet meteen een indicatief bod</div>
                    </div>
                  </div>
                  <button onClick={() => setGarage(prev => ({ ...prev, auto_bod: !prev.auto_bod }))}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
                    style={{ background: garage.auto_bod ? kleur : '#e5e7eb' }}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${garage.auto_bod ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {!garage.auto_bod && (
                  <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                    Verkoper ziet geen prijs — alleen &quot;We nemen contact op&quot;. Dit verhoogt de afhankeijkheid van uw follow-up.
                  </div>
                )}
              </div>

              {/* Welkomstbericht */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-1">Welkomstbericht in de wizard</div>
                <div className="text-xs text-gray-400 mb-3">Persoonlijk berichtje bovenaan de wizardpagina (optioneel)</div>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none" rows={3}
                  placeholder="Bijv: Welkom bij 2maal2 — uw wagen verkopen in 3 stappen..."
                  value={garage.welkomstbericht || ''}
                  onChange={e => setGarage(prev => ({ ...prev, welkomstbericht: e.target.value }))} />
              </div>
            </div>
          </>
        )}

        {/* ═══ INSTELLINGEN ═══ */}
        {actief === 'whitelabel' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
              <div>
                <h1 className="text-base font-semibold text-gray-900">Garage instellingen</h1>
                <p className="text-xs text-gray-400 mt-0.5">Branding, adres, openingsuren en embed</p>
              </div>
              <button onClick={slaInstellingenOp} className="text-xs px-4 py-2 rounded-lg font-medium text-white" style={{ background: instellingenOpgeslagen ? '#16a34a' : kleur }}>
                {instellingenOpgeslagen ? '✓ Opgeslagen' : 'Opslaan'}
              </button>
            </div>
            <div className="p-6 max-w-lg space-y-4 overflow-auto">

              {/* Logo */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-3">Logo</div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                    {garage.logo_url ? <img src={garage.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                      : <span className="text-gray-300 text-xs text-center leading-tight">Geen<br/>logo</span>}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
                      <div className="text-xs px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 inline-block">{logoUploaden ? 'Uploaden...' : '↑ Logo uploaden'}</div>
                    </label>
                    <p className="text-xs text-gray-400 mt-1.5">PNG of SVG. Zichtbaar in wizard en dashboard.</p>
                  </div>
                </div>
              </div>

              {/* Merkkleur */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-3">Merkkleur</div>
                <div className="flex gap-2 mb-3">
                  {KLEUREN_PRESETS.map(hex => (
                    <button key={hex} onClick={() => setGarage(prev => ({ ...prev, kleur: hex }))}
                      className="w-8 h-8 rounded-lg transition-all flex-shrink-0"
                      style={{ background: hex, outline: garage.kleur === hex ? `3px solid ${hex}` : 'none', outlineOffset: '2px' }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={garage.kleur} onChange={e => setGarage(prev => ({ ...prev, kleur: e.target.value }))}
                    className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
                  <input type="text" value={garage.kleur} onChange={e => setGarage(prev => ({ ...prev, kleur: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none" placeholder="#1a3a8f" />
                </div>
                <div className="mt-3 rounded-xl p-2.5 text-xs text-white text-center" style={{ background: kleur }}>Voorbeeld knopkleur</div>
              </div>

              {/* Garage info */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-3">Garage informatie</div>
                <div className="space-y-3">
                  {([
                    { label: 'Naam', veld: 'naam', placeholder: '2maal2', type: 'text' },
                    { label: 'Adres', veld: 'adres', placeholder: 'Statiestraat 88, 8570 Anzegem', type: 'text' },
                    { label: 'Telefoon', veld: 'telefoon', placeholder: '+32 56 00 00 00', type: 'tel' },
                    { label: 'Website', veld: 'website', placeholder: 'https://2maal2.be', type: 'url' },
                  ] as { label: string; veld: keyof GarageInstellingen; placeholder: string; type: string }[]).map(({ label, veld, placeholder, type }) => (
                    <div key={veld}>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                      <input type={type} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                        placeholder={placeholder} value={(garage[veld] as string) || ''}
                        onChange={e => setGarage(prev => ({ ...prev, [veld]: e.target.value }))} />
                    </div>
                  ))}
                  {/* Adres preview */}
                  {garage.adres && (
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                      <iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(garage.adres)}&output=embed&z=15`}
                        width="100%" height="160" style={{ border: 0 }} loading="lazy" />
                    </div>
                  )}
                </div>
              </div>

              {/* Openingsuren */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-1">Openingsuren</div>
                <p className="text-xs text-gray-400 mb-3">Wordt getoond op de bevestigingspagina voor verkopers</p>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none font-mono" rows={4}
                  placeholder={"Ma–Vr: 9:00–18:00\nZa: 9:00–13:00\nZo: Gesloten"}
                  value={garage.openingsuren || ''}
                  onChange={e => setGarage(prev => ({ ...prev, openingsuren: e.target.value }))} />
              </div>

              {/* Embed */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-1">Embed op uw website</div>
                <p className="text-xs text-gray-400 mb-3">Plak dit in de HTML van uw website.</p>
                <div className="bg-gray-50 rounded-xl p-3 font-mono text-xs text-gray-600 leading-relaxed select-all">
                  {'<script'}<br/>
                  &nbsp;&nbsp;{'src="https://autoplatform1-git-main-dieter-holvoets-projects-9e50a667.vercel.app/embed.js"'}<br/>
                  &nbsp;&nbsp;{`data-garage="${(garage.naam || '2maal2').toLowerCase()}"`}<br/>
                  {'></script>'}
                </div>
              </div>

              {/* Eigen domein */}
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="text-sm font-semibold text-gray-900 mb-2">Eigen domein instellen</div>
                <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Vercel → uw project → Settings → Domains</li>
                  <li>Voeg <span className="font-mono bg-gray-100 px-1 rounded">autos.2maal2.be</span> toe</li>
                  <li>Vercel toont een CNAME-record → toevoegen bij Combell</li>
                  <li>Na 5–30 min actief</li>
                </ol>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
