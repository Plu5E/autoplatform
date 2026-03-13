export interface MargeInstellingen {
  basis_korting: number
  correctie_uitstekend: number
  correctie_goed: number
  correctie_matig: number
  correctie_herstel: number
  km_drempel: number
  km_correctie_per_1000: number
  herstel_reserve: number
}

export interface BodBerekening {
  marktwaarde: number
  staat_correctie: number
  km_correctie: number
  basiskorting: number
  herstel_reserve: number
  bod: number
  min_bod: number
  max_bod: number
}

const NIEUWE_PRIJS: Record<string, number> = {
  'Audi': 38000, 'BMW': 40000, 'Mercedes': 42000,
  'Volkswagen': 28000, 'Peugeot': 24000, 'Renault': 22000,
  'Toyota': 27000, 'Ford': 25000, 'Opel': 22000,
  'Hyundai': 25000, 'Kia': 26000, 'Skoda': 24000,
  'Seat': 22000, 'Nissan': 24000, 'Citroën': 21000,
  'Dacia': 15000, 'Mazda': 26000, 'Volvo': 38000,
  'Mini': 30000, 'Andere': 22000,
}

function afschrijvingsFactor(leeftijd: number): number {
  if (leeftijd <= 0) return 1.0
  if (leeftijd === 1) return 0.80
  if (leeftijd === 2) return 0.68
  if (leeftijd === 3) return 0.60
  return 0.60 * Math.pow(0.90, leeftijd - 3)
}

const BRANDSTOF_FACTOR: Record<string, number> = {
  'Elektrisch': 1.05, 'Plug-in hybride': 1.03, 'Hybride': 1.02,
  'Benzine': 1.00, 'Diesel': 0.95,
}

export function schatMarktwaarde(
  merk: string,
  bouwjaar: number,
  km: number,
  brandstof: string
): number {
  const huidigJaar = new Date().getFullYear()
  const leeftijd = Math.max(0, huidigJaar - bouwjaar)
  const nieuwePrijs = NIEUWE_PRIJS[merk] || NIEUWE_PRIJS['Andere']
  const afschrijving = afschrijvingsFactor(leeftijd)
  const brandstofFactor = BRANDSTOF_FACTOR[brandstof] || 1.0

  let waarde = nieuwePrijs * afschrijving * brandstofFactor

  const normKm = 15000 * Math.max(leeftijd, 1)
  const kmVerschil = km - normKm
  if (kmVerschil > 0) {
    waarde -= Math.min(3000, (kmVerschil / 10000) * 350)
  } else {
    waarde += Math.min(800, Math.abs(kmVerschil) / 10000 * 200)
  }

  return Math.max(800, Math.round(waarde / 50) * 50)
}

export function berekenBod(
  marktwaarde: number,
  staat: string,
  km: number,
  marges: MargeInstellingen
): BodBerekening {
  const staatCorrecties: Record<string, number> = {
    'uitstekend': marges.correctie_uitstekend,
    'goed': marges.correctie_goed,
    'matig': marges.correctie_matig,
    'herstel': marges.correctie_herstel,
  }
  const staatCorrectie = staatCorrecties[staat] ?? marges.correctie_goed
  const kmOverDrempel = Math.max(0, km - marges.km_drempel)
  const kmCorrectie = Math.round((kmOverDrempel / 1000) * marges.km_correctie_per_1000 / 50) * 50
  const basisKorting = Math.round(marktwaarde * (marges.basis_korting / 100) / 50) * 50
  const bodRuw = marktwaarde - basisKorting - staatCorrectie - kmCorrectie - marges.herstel_reserve
  const bod = Math.max(500, Math.round(bodRuw / 50) * 50)

  return {
    marktwaarde,
    staat_correctie: staatCorrectie,
    km_correctie: kmCorrectie,
    basiskorting: basisKorting,
    herstel_reserve: marges.herstel_reserve,
    bod,
    min_bod: Math.max(500, Math.round(bod * 0.93 / 50) * 50),
    max_bod: Math.round(bod * 1.07 / 50) * 50,
  }
}

export function formatEuro(bedrag: number): string {
  return new Intl.NumberFormat('nl-BE', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(bedrag)
}

export function genereerReferentie(prefix: string): string {
  const jaar = new Date().getFullYear()
  const willekeurig = Math.floor(Math.random() * 90000) + 10000
  return `${prefix.substring(0, 2).toUpperCase()}-${jaar}-${willekeurig}`
}

export const STANDAARD_MARGES: MargeInstellingen = {
  basis_korting: 15,
  correctie_uitstekend: 0,
  correctie_goed: 300,
  correctie_matig: 700,
  correctie_herstel: 1400,
  km_drempel: 80000,
  km_correctie_per_1000: 35,
  herstel_reserve: 300,
}
