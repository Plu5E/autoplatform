export type FotoConfig = { id: string; label: string; icon: string; verplicht: boolean; actief: boolean }

export const STANDAARD_FOTOS_CONFIG: FotoConfig[] = [
  { id: 'voor', label: 'Voorkant', icon: '🚗', verplicht: true, actief: true },
  { id: 'achter', label: 'Achterkant', icon: '🔙', verplicht: true, actief: true },
  { id: 'links', label: 'Linkerzijkant', icon: '◀️', verplicht: true, actief: true },
  { id: 'rechts', label: 'Rechterzijkant', icon: '▶️', verplicht: true, actief: true },
  { id: 'interieur', label: 'Interieur voorin', icon: '💺', verplicht: true, actief: true },
  { id: 'dashboard_foto', label: 'Dashboard', icon: '🎛️', verplicht: false, actief: true },
  { id: 'motor', label: 'Motorruimte', icon: '⚙️', verplicht: false, actief: true },
  { id: 'km', label: 'Kilometerstand', icon: '📍', verplicht: false, actief: false },
  { id: 'gebreken', label: 'Gebreken/schade', icon: '🔍', verplicht: false, actief: false },
  { id: 'extra', label: 'Extra foto', icon: '📷', verplicht: false, actief: false },
]
