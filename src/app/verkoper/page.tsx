'use client'

import { useState, useEffect } from 'react'
import { schatMarktwaarde, berekenBod, formatEuro, genereerReferentie, STANDAARD_MARGES, MargeInstellingen } from '@/lib/bod'

const STAPPEN = ['Voertuig', 'Details', 'Staat', "Foto's", 'Uw bod']
const STAAT_OPTIES = [
  { waarde: 'uitstekend', label: 'Uitstekend', omschrijving: 'Geen gebreken', icon: '⭐' },
  { waarde: 'goed', label: 'Goed', omschrijving: 'Kleine slijtage', icon: '👍' },
  { waarde: 'matig', label: 'Matig', omschrijving: 'Zichtbare schade', icon: '😐' },
  { waarde: 'herstel', label: 'Te herstellen', omschrijving: 'Herstelling nodig', icon: '🔧' },
]
const MERKEN = ['Audi','BMW','Citroën','Dacia','Ford','Hyundai','Kia','Mazda','Mercedes','Mini','Nissan','Opel','Peugeot','Renault','Seat','Skoda','Toyota','Volkswagen','Volvo','Andere']
const FOTO_SUGGESTIES = [
  { icon: '🚗', label: 'Voorkant' },
  { icon: '🔙', label: 'Achterkant' },
  { icon: '◀️', label: 'Linkerzijkant' },
  { icon: '▶️', label: 'Rechterzijkant' },
  { icon: '💺', label: 'Interieur' },
  { icon: '🎛️', label: 'Dashboard' },
  { icon: '⚙️', label: 'Motorruimte' },
  { icon: '🔍', label: 'Eventuele schade' },
]

type GarageInfo = { naam: string; logo_url: string | null; kleur: string; adres: string | null; telefoon: string | null }

export default function VerkoperWizard() {
  const [stap, setStap] = useState(1)
  const [verstuurd, setVerstuurd] = useState(false)
  const [laden, setLaden] = useState(false)
  const [referentie, setReferentie] = useState('')
  const [fout, setFout] = useState('')
  const [marges, setMarges] = useState<MargeInstellingen>(STANDAARD_MARGES)
  const [garage, setGarage] = useState<GarageInfo>({ naam: '2maal2', logo_url: null, kleur: '#1a3a8f', adres: 'Statiestraat 88, 8570 Anzegem', telefoon: null })
  const [fotoFiles, setFotoFiles] = useState<File[]>([])
  const [fotoUrls, setFotoUrls] = useState<string[]>([])
  const [fotosUploaden, setFotosUploaden] = useState(false)

  const [form, setForm] = useState({
    kenteken: '', merk: '', model: '', bouwjaar: '', brandstof: '',
    transmissie: '', carrosserie: '', kleur: '', km: '', pk: '', opties: '',
    staat: '', gebreken: '', onderhoud: '',
    verkoper_naam: '', verkoper_telefoon: '', verkoper_email: '',
  })

  useEffect(() => {
    fetch('/api/garages/marges').then(r => r.ok ? r.json() : null).then(d => { if (d) setMarges(d) }).catch(() => {})
    fetch('/api/garages/instellingen').then(r => r.ok ? r.json() : null).then(d => { if (d) setGarage(d) }).catch(() => {})
  }, [])

  const stel = (veld: string, waarde: string) => setForm(prev => ({ ...prev, [veld]: waarde }))
  const kleur = garage.kleur || '#1a3a8f'
  const adres = garage.adres || 'Statiestraat 88, 8570 Anzegem'
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(adres)}`

  const bod = form.merk && form.bouwjaar && form.km && form.staat
    ? berekenBod(schatMarktwaarde(form.merk, parseInt(form.bouwjaar), parseInt(form.km), form.brandstof), form.staat, parseInt(form.km), marges)
    : null

  async function uploadFotos(files: File[]): Promise<string[]> {
    if (!files.length) return []
    setFotosUploaden(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('fotos', f))
      const res = await fetch('/api/fotos', { method: 'POST', body: fd })
      if (res.ok) { const { urls } = await res.json(); return urls }
    } catch {} finally { setFotosUploaden(false) }
    return []
  }

  function volgende() {
    setFout('')
    if (stap === 1 && (!form.merk || !form.model || !form.bouwjaar || !form.brandstof)) { setFout('Vul merk, model, bouwjaar en brandstof in.'); return }
    if (stap === 2 && !form.km) { setFout('Vul de kilometerstand in.'); return }
    if (stap === 3 && !form.staat) { setFout('Selecteer de staat van het voertuig.'); return }
    setStap(s => s + 1)
  }

  async function verstuur() {
    setFout('')
    if (!form.verkoper_naam || !form.verkoper_telefoon) { setFout('Vul uw naam en telefoonnummer in.'); return }
    setLaden(true)
    try {
      const geuploadeFotos = fotoUrls.length ? await uploadFotos(fotoFiles) : []
      const ref = genereerReferentie('2M')
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          bouwjaar: parseInt(form.bouwjaar) || null,
          km: parseInt(form.km) || null,
          pk: parseInt(form.pk) || null,
          foto_urls: geuploadeFotos,
          bod: bod?.bod, marktwaarde: bod?.marktwaarde,
          staat_correctie: bod?.staat_correctie, km_correctie: bod?.km_correctie,
          herstel_reserve: bod?.herstel_reserve, referentie: ref,
        }),
      })
      if (res.ok) { setReferentie(ref); setVerstuurd(true) }
      else { const d = await res.json(); setFout(d.error || 'Er ging iets mis.') }
    } catch { setFout('Geen verbinding. Probeer opnieuw.') }
    finally { setLaden(false) }
  }

  if (verstuurd) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Aanvraag ontvangen!</h2>
          <p className="text-sm text-gray-500 mb-5 leading-relaxed">Breng uw wagen langs op onderstaand adres. Bel ons vooraf om een afspraak te maken.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 text-left">
            <div className="font-medium text-gray-900 mb-1">{garage.naam}</div>
            <div className="text-sm text-gray-500 mb-3">{adres}</div>
            {garage.telefoon && (
              <a href={`tel:${garage.telefoon}`} className="flex items-center gap-1.5 text-xs mb-2 hover:underline" style={{ color: kleur }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                {garage.telefoon}
              </a>
            )}
            <a href={mapsUrl} target="_blank" className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: kleur }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Route op Google Maps
            </a>
          </div>

          {/* Google Maps embed */}
          <div className="rounded-xl overflow-hidden mb-5 border border-gray-100">
            <iframe
              src={`https://maps.google.com/maps?q=${encodeURIComponent(adres)}&output=embed&z=15`}
              width="100%" height="180" style={{ border: 0 }} loading="lazy" />
          </div>

          <p className="text-xs text-gray-400 mb-4">Breng uw identiteitsbewijs en inschrijvingsbewijs mee.</p>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1">Uw referentienummer</div>
            <div className="text-lg font-medium text-gray-900 font-mono">{referentie}</div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Vermeld dit nummer bij uw bezoek</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          {garage.logo_url ? (
            <img src={garage.logo_url} alt={garage.naam} className="h-10 mx-auto mb-2 object-contain" />
          ) : (
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: kleur }}>
                {garage.naam.substring(0, 2).toUpperCase()}
              </div>
              <span className="font-medium text-gray-900">{garage.naam}</span>
            </div>
          )}
          <p className="text-sm text-gray-400">Verkoop uw wagen snel en zonder gedoe</p>
        </div>

        <div className="text-white rounded-xl p-4 mb-6 text-sm text-center" style={{ background: kleur }}>
          Vul uw gegevens in → ontvang een vrijblijvend bod → breng uw wagen langs
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center">
            {STAPPEN.map((_, i) => {
              const nr = i + 1
              return (
                <div key={nr} className="flex items-center" style={{ flex: i < STAPPEN.length - 1 ? '1' : 'none' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-all"
                    style={nr <= stap ? { background: kleur, color: 'white', boxShadow: nr === stap ? `0 0 0 4px ${kleur}30` : 'none' } : { background: 'white', border: '1px solid #e5e7eb', color: '#9ca3af' }}>
                    {nr < stap ? '✓' : nr}
                  </div>
                  {i < STAPPEN.length - 1 && <div className="flex-1 h-px mx-1" style={{ background: nr < stap ? kleur : '#e5e7eb' }} />}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            {STAPPEN.map((label, i) => (
              <span key={i} className="text-xs" style={{ color: i + 1 === stap ? kleur : '#9ca3af', fontWeight: i + 1 === stap ? 500 : 400, width: '56px', textAlign: i === 0 ? 'left' : i === STAPPEN.length - 1 ? 'right' : 'center', display: 'block' }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {stap === 1 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Uw voertuig identificeren</h2>
              <p className="text-sm text-gray-400 mb-5">Vul de basisgegevens in voor een eerste bod.</p>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kenteken <span className="text-gray-300 font-normal">(optioneel)</span></label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none uppercase tracking-widest font-medium"
                  placeholder="1-ABC-234" value={form.kenteken} onChange={e => stel('kenteken', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Merk <span className="text-red-400">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" value={form.merk} onChange={e => stel('merk', e.target.value)}>
                    <option value="">Kies merk</option>
                    {MERKEN.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Model <span className="text-red-400">*</span></label>
                  <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="Golf, 308, Clio..." value={form.model} onChange={e => stel('model', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bouwjaar <span className="text-red-400">*</span></label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="2019" min={1990} max={2025} value={form.bouwjaar} onChange={e => stel('bouwjaar', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Brandstof <span className="text-red-400">*</span></label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" value={form.brandstof} onChange={e => stel('brandstof', e.target.value)}>
                    <option value="">Kies type</option>
                    {['Benzine','Diesel','Hybride','Plug-in hybride','Elektrisch'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {stap === 2 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Technische details</h2>
              <p className="text-sm text-gray-400 mb-5">Hoe nauwkeuriger, hoe beter het bod.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Kilometerstand <span className="text-red-400">*</span></label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="45000" value={form.km} onChange={e => stel('km', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Vermogen (pk)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="115" value={form.pk} onChange={e => stel('pk', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Transmissie</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" value={form.transmissie} onChange={e => stel('transmissie', e.target.value)}>
                    <option value="">Kies type</option>
                    {['Manueel','Automaat','Semi-automaat'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Carrosserie</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" value={form.carrosserie} onChange={e => stel('carrosserie', e.target.value)}>
                    <option value="">Kies type</option>
                    {['Hatchback','Berline','Break','SUV','Coupé','Cabriolet','Bestelwagen'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Kleur</label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="Zwart, Zilver, Blauw..." value={form.kleur} onChange={e => stel('kleur', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Opties</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none" rows={3} placeholder="Navigatie, trekhaak, verwarmde zetels..." value={form.opties} onChange={e => stel('opties', e.target.value)} />
              </div>
            </div>
          )}

          {stap === 3 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Staat van het voertuig</h2>
              <p className="text-sm text-gray-400 mb-5">Wees eerlijk — dit vermijdt discussies bij het bezoek.</p>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {STAAT_OPTIES.map(opt => (
                  <button key={opt.waarde} type="button" onClick={() => stel('staat', opt.waarde)}
                    className="rounded-xl border-2 p-4 text-left transition-all"
                    style={{ borderColor: form.staat === opt.waarde ? kleur : '#e5e7eb', background: form.staat === opt.waarde ? `${kleur}10` : 'white' }}>
                    <div className="text-2xl mb-2">{opt.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{opt.omschrijving}</div>
                  </button>
                ))}
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Gekende gebreken</label>
                <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none resize-none" rows={3} placeholder="Kleine deuk, kras, airco werkt niet..." value={form.gebreken} onChange={e => stel('gebreken', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Onderhoud</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" value={form.onderhoud} onChange={e => stel('onderhoud', e.target.value)}>
                  <option value="">Kies optie</option>
                  <option>Volledig up-to-date met boekje</option>
                  <option>Gedeeltelijk onderhouden</option>
                  <option>Geen onderhoudshistoriek</option>
                </select>
              </div>
            </div>
          )}

          {stap === 4 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Foto&apos;s toevoegen</h2>
              <p className="text-sm text-gray-400 mb-4">Maak foto&apos;s van onderstaande onderdelen voor een nauwkeuriger bod.</p>

              {/* Suggesties grid */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {FOTO_SUGGESTIES.map((s, i) => (
                  <div key={s.label} className="rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all"
                    style={{ borderColor: i < fotoUrls.length ? `${kleur}60` : '#e5e7eb', background: i < fotoUrls.length ? `${kleur}08` : '#f9fafb' }}>
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-xs text-gray-600 text-center leading-tight">{s.label}</span>
                    {i < fotoUrls.length
                      ? <span className="text-xs font-medium" style={{ color: kleur }}>✓</span>
                      : <span className="text-xs text-gray-300">○</span>
                    }
                  </div>
                ))}
              </div>

              {/* Upload zone */}
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden"
                  onChange={e => {
                    const files = Array.from(e.target.files || [])
                    setFotoFiles(files)
                    setFotoUrls(files.map(f => URL.createObjectURL(f)))
                  }} />
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-all mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {fotoUrls.length > 0 ? `${fotoUrls.length} foto${fotoUrls.length > 1 ? "'s" : ''} geselecteerd` : "Klik om foto's te uploaden"}
                  </p>
                  <p className="text-xs text-gray-400">Selecteer meerdere tegelijk in de volgorde van de lijst hierboven</p>
                </div>
              </label>

              {/* Thumbnails */}
              {fotoUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {fotoUrls.map((url, i) => (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                      <img src={url} alt={FOTO_SUGGESTIES[i]?.label || `Foto ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => { setFotoFiles(prev => prev.filter((_, j) => j !== i)); setFotoUrls(prev => prev.filter((_, j) => j !== i)) }}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
              {fotosUploaden && <p className="text-xs text-center text-gray-400">Foto&apos;s uploaden...</p>}
              <p className="text-xs text-gray-400 mt-2 text-center">U kunt ook overslaan en de wagen gewoon langsbrengen.</p>
            </div>
          )}

          {stap === 5 && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-1">Uw vrijblijvend bod</h2>
              <p className="text-sm text-gray-400 mb-5">Indicatief bod op basis van uw opgegeven gegevens.</p>
              {bod ? (
                <div className="bg-gray-50 rounded-xl p-5 mb-5">
                  <div className="text-xs text-gray-400 mb-1">Indicatief bod</div>
                  <div className="text-4xl font-medium mb-1" style={{ color: kleur }}>{formatEuro(bod.bod)}</div>
                  <div className="text-xs text-gray-400 mb-4">Range: {formatEuro(bod.min_bod)} — {formatEuro(bod.max_bod)}</div>
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500"><span>Geschatte marktwaarde</span><span className="font-medium text-gray-700">{formatEuro(bod.marktwaarde)}</span></div>
                    <div className="flex justify-between text-sm text-gray-500"><span>Aankoopkorting</span><span>− {formatEuro(bod.basiskorting)}</span></div>
                    {bod.staat_correctie > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Staat ({form.staat})</span><span>− {formatEuro(bod.staat_correctie)}</span></div>}
                    {bod.km_correctie > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Km-correctie</span><span>− {formatEuro(bod.km_correctie)}</span></div>}
                    <div className="flex justify-between text-sm font-medium text-gray-900 border-t border-gray-200 pt-2"><span>Indicatief bod</span><span style={{ color: kleur }}>{formatEuro(bod.bod)}</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 rounded-xl p-4 mb-5 text-sm text-yellow-700">Vul in stap 1–3 de verplichte gegevens in.</div>
              )}
              <div className="rounded-xl p-4 mb-5 flex gap-3" style={{ background: `${kleur}12`, border: `1px solid ${kleur}30` }}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: kleur }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div className="text-xs leading-relaxed" style={{ color: kleur }}>
                  <strong>Volgende stap:</strong> breng uw wagen langs op <strong>{adres}</strong>. Na inspectie doen wij u een definitief bod. U bent nergens toe verplicht.
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Naam <span className="text-red-400">*</span></label>
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="Voornaam Achternaam" value={form.verkoper_naam} onChange={e => stel('verkoper_naam', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Telefoon <span className="text-red-400">*</span></label>
                  <input type="tel" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="04XX XX XX XX" value={form.verkoper_telefoon} onChange={e => stel('verkoper_telefoon', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">E-mail</label>
                  <input type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" placeholder="naam@email.be" value={form.verkoper_email} onChange={e => stel('verkoper_email', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {fout && <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{fout}</div>}

          <div className="flex justify-between items-center mt-6 pt-5 border-t border-gray-100">
            <button onClick={() => { setStap(s => s - 1); setFout('') }}
              className={`px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 ${stap === 1 ? 'invisible' : ''}`}>
              Vorige
            </button>
            <span className="text-xs text-gray-400">Stap {stap} van {STAPPEN.length}</span>
            {stap < STAPPEN.length ? (
              <button onClick={volgende} className="px-5 py-2 rounded-xl text-sm text-white font-medium" style={{ background: kleur }}>Volgende</button>
            ) : (
              <button onClick={verstuur} disabled={laden}
                className="px-5 py-2 rounded-xl text-sm text-white font-medium disabled:opacity-50 flex items-center gap-2" style={{ background: kleur }}>
                {laden && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {laden ? 'Versturen...' : 'Bod bevestigen & afspraak maken'}
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-5">Vrijblijvend · Geen verplichtingen · {garage.naam}</p>
      </div>
    </div>
  )
}
