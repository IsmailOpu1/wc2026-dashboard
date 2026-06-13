const BASE = import.meta.env.DEV
  ? '/api/v4'
  : 'https://api.football-data.org/v4'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function headers() {
  const key = import.meta.env.VITE_FOOTBALL_API_KEY
  if (!key) throw new Error('VITE_FOOTBALL_API_KEY is not set.')
  return { 'X-Auth-Token': key }
}

function getCached(key) {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_DURATION) return null
    return data
  } catch {
    return null
  }
}

function setCached(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {}
}

export async function fetchStandings() {
  const cacheKey = 'wc2026_standings'
  const cached = getCached(cacheKey)
  if (cached) return cached

  // Try 2026 first, fall back to no season param (gets current/latest)
  const urls = [
    `${BASE}/competitions/WC/standings?season=2026`,
    `${BASE}/competitions/WC/standings`,
  ]
  let lastErr
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: headers() })
      if (!res.ok) { lastErr = `API ${res.status}`; continue }
      const data = await res.json()
      // football-data returns TOTAL, HOME, AWAY — we only want TOTAL
      const standings = (data.standings || []).filter(g => g.type === 'TOTAL')
      const result = { ...data, standings }
      setCached(cacheKey, result)
      return result
    } catch (e) { lastErr = e.message }
  }
  throw new Error(lastErr || 'Failed to fetch standings')
}

export async function fetchMatches(status = '') {
  const cacheKey = `wc2026_matches_${status}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const urls = [
    `${BASE}/competitions/WC/matches${status ? `?status=${status}&season=2026` : '?season=2026'}`,
    `${BASE}/competitions/WC/matches${status ? `?status=${status}` : ''}`,
  ]
  let lastErr
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: headers() })
      if (!res.ok) { lastErr = `API ${res.status}`; continue }
      const data = await res.json()
      setCached(cacheKey, data)
      return data
    } catch (e) { lastErr = e.message }
  }
  throw new Error(lastErr || 'Failed to fetch matches')
}
