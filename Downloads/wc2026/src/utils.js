export const COUNTRY_CODE = {
  'Mexico': 'mx', 'South Korea': 'kr', 'Czechia': 'cz', 'Czech Republic': 'cz',
  'South Africa': 'za', 'Canada': 'ca', 'Switzerland': 'ch',
  'Bosnia and Herzegovina': 'ba', 'Qatar': 'qa', 'Brazil': 'br',
  'Morocco': 'ma', 'Scotland': 'gb-sct', 'Haiti': 'ht',
  'United States': 'us', 'USA': 'us', 'Türkiye': 'tr', 'Turkey': 'tr',
  'Australia': 'au', 'Paraguay': 'py', 'Germany': 'de',
  "Côte d'Ivoire": 'ci', 'Ivory Coast': 'ci', 'Ecuador': 'ec',
  'Curaçao': 'cw', 'Netherlands': 'nl', 'Japan': 'jp',
  'Sweden': 'se', 'Tunisia': 'tn', 'Belgium': 'be', 'Egypt': 'eg',
  'Iran': 'ir', 'New Zealand': 'nz', 'Spain': 'es', 'Uruguay': 'uy',
  'Saudi Arabia': 'sa', 'Cape Verde': 'cv', 'France': 'fr',
  'Senegal': 'sn', 'Norway': 'no', 'Iraq': 'iq', 'Argentina': 'ar',
  'Algeria': 'dz', 'Austria': 'at', 'Jordan': 'jo', 'Portugal': 'pt',
  'Colombia': 'co', 'DR Congo': 'cd', 'Congo DR': 'cd',
  'Uzbekistan': 'uz', 'England': 'gb-eng', 'Croatia': 'hr',
  'Panama': 'pa', 'Ghana': 'gh',
}

export function formatKickoff(utcDate) {
  if (!utcDate) return 'TBD'
  try {
    return new Date(utcDate).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return utcDate }
}

export function statusLabel(status) {
  switch (status) {
    case 'IN_PLAY':   return { text: 'LIVE', color: 'var(--red)' }
    case 'PAUSED':    return { text: 'HT',   color: 'var(--amber)' }
    case 'FINISHED':  return { text: 'FT',   color: 'var(--faint)' }
    case 'SCHEDULED': return { text: 'SCH',  color: 'var(--muted)' }
    default:          return { text: status, color: 'var(--muted)' }
  }
}
