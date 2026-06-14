// ── API cache — 5 minute TTL, survives 429 rate limit errors ──────────────────
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCached(key) {
  try {
    const serialized = sessionStorage.getItem(`wc2026_cache_${key}`)
    if (!serialized) return null
    const entry = JSON.parse(serialized)
    if (Date.now() - entry.ts > CACHE_TTL) {
      sessionStorage.removeItem(`wc2026_cache_${key}`)
      return null
    }
    return entry.data
  } catch (e) {
    console.error('Cache read error', e)
    return null
  }
}

function setCache(key, data) {
  try {
    const entry = { data, ts: Date.now() }
    sessionStorage.setItem(`wc2026_cache_${key}`, JSON.stringify(entry))
  } catch (e) {
    console.error('Cache write error', e)
  }
}

// ── Base config ───────────────────────────────────────────────────────────────
const IS_DEV = import.meta.env.DEV

function getHeaders() {
  // In production, Vercel Serverless Function injects the key securely.
  // We only send the header locally where Vite proxy expects it.
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
      const stale = CACHE.get(cacheKey)
      if (stale) {
        console.warn('Rate limited (429) — serving stale cache from', new Date(stale.ts).toLocaleTimeString())
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
    const stale = CACHE.get(cacheKey)
    if (stale) {
      console.warn('Network error — serving stale cache')
      return stale.data
    }
    throw e
  }
}

// ── Public API functions ──────────────────────────────────────────────────────
export async function fetchStandings() {
  // Try 2026 season first, fall back to current
  const urls = [
    buildUrl('competitions/WC/standings', 'season=2026'),
    buildUrl('competitions/WC/standings'),
  ]
  let lastErr
  for (const url of urls) {
    try {
      const data = await smartFetch(url, `standings:${url}`)
      // football-data returns TOTAL, HOME, AWAY — only want TOTAL
      const standings = (data.standings || []).filter(g => g.type === 'TOTAL')
      return { ...data, standings }
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Failed to fetch standings')
}

export async function fetchMatches(status = '') {
  const urls = [
    buildUrl('competitions/WC/matches', status ? `status=${status}&season=2026` : 'season=2026'),
    buildUrl('competitions/WC/matches', status ? `status=${status}` : ''),
  ]
  let lastErr
  for (const url of urls) {
    try {
      return await smartFetch(url, `matches:${url}`)
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
