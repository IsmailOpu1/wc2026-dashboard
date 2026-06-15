// ── API cache — dynamic TTL, survives 429 rate limit errors ──────────────────
function getCached(key) {
  try {
    const serialized = sessionStorage.getItem(`wc2026_cache_${key}`)
    if (!serialized) return null
    const entry = JSON.parse(serialized)
    
    // Dynamic TTL: 15 seconds if there is a live match in progress, otherwise 2 minutes
    const ttl = entry.isLiveMatch ? 15 * 1000 : 2 * 60 * 1000
    if (Date.now() - entry.ts > ttl) {
      return null
    }
    return entry.data
  } catch (e) {
    return null
  }
}

function getStaleCached(key) {
  try {
    const serialized = sessionStorage.getItem(`wc2026_cache_${key}`)
    if (!serialized) return null
    const entry = JSON.parse(serialized)
    return entry.data
  } catch (e) {
    return null
  }
}

function setCache(key, data) {
  try {
    // Determine if any match in the data is currently live
    let isLiveMatch = false
    if (key.startsWith('matches')) {
      const matches = data.matches || []
      isLiveMatch = matches.some(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
    }
    const entry = { data, ts: Date.now(), isLiveMatch }
    sessionStorage.setItem(`wc2026_cache_${key}`, JSON.stringify(entry))
  } catch (e) {
    console.error('Cache write error', e)
  }
}

// ── Base config ───────────────────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV

function getHeaders() {
  if (!IS_DEV) return {}

  const key = import.meta.env.VITE_FOOTBALL_API_KEY
  if (!key) throw new Error('VITE_FOOTBALL_API_KEY is not set in local environment.')
  return { 'X-Auth-Token': key }
}

function buildUrl(endpoint, params = '') {
  if (IS_DEV) {
    return `/api/v4/${endpoint}${params ? `?${params}` : ''}`
  } else {
    return `/api/football?endpoint=${endpoint}${params ? `&${params}` : ''}`
  }
}

// ── Smart fetch: cache-first, retry on 429 ───────────────────────────────────
async function smartFetch(url, cacheKey) {
  // 1. Return cache if fresh
  const cached = getCached(cacheKey)
  if (cached) return cached

  // 2. Try the request
  try {
    const res = await fetch(url, { headers: getHeaders() })

    // Rate limited — serve stale cache if available, else throw
    if (res.status === 429) {
      const stale = getStaleCached(cacheKey)
      if (stale) {
        console.warn('Rate limited (429) — serving stale cache')
        return stale.data
      }
      const retryAfter = res.headers.get('X-RateLimit-Reset') || res.headers.get('Retry-After')
      throw new Error(`Rate limited. Try again ${retryAfter ? `after ${retryAfter}` : 'in a minute'}.`)
    }

    if (!res.ok) throw new Error(`API error ${res.status}`)

    const data = await res.json()
    setCache(cacheKey, data)
    return data

  } catch (e) {
    // Network error — try stale cache before giving up
    const stale = getStaleCached(cacheKey)
    if (stale) {
      console.warn('Network error — serving stale cache')
      return stale.data
    }
    throw e
  }
}

// ── Public API functions ──────────────────────────────────────────────────────
export async function fetchStandings() {
  const urls = [
    buildUrl('competitions/WC/standings', 'season=2026'),
    buildUrl('competitions/WC/standings'),
  ]
  let lastErr
  for (const url of urls) {
    try {
      const data = await smartFetch(url, `standings:${url}`)
      const standings = (data.standings || []).filter(g => g.type === 'TOTAL')
      return { ...data, standings }
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Failed to fetch standings')
}

export async function fetchMatches() {
  const urls = [
    buildUrl('competitions/WC/matches', 'season=2026'),
    buildUrl('competitions/WC/matches'),
  ]
  let lastErr
  for (const url of urls) {
    try {
      return await smartFetch(url, 'matches:all')
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Failed to fetch matches')
}

// Force-refresh bypasses cache (for manual refresh button)
export function clearCache() {
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith('wc2026_cache_')) {
        sessionStorage.removeItem(key)
      }
    }
  } catch (e) {
    console.error('Cache clear error', e)
  }
}
