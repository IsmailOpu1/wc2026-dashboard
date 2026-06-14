// ── API cache — 5 minute TTL, survives 429 rate limit errors ──────────────────
const CACHE = new Map()
const CACHE_TTL = 45 * 1000 // 45 s — short enough to catch kick-offs without hammering the API

function getCached(key) {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { CACHE.delete(key); return null }
  return entry.data
}

function setCache(key, data) {
  CACHE.set(key, { data, ts: Date.now() })
}

// ── Base config ───────────────────────────────────────────────────────────────
const BASE = '/api/v4'

function authHeaders() {
  const key = import.meta.env.VITE_FOOTBALL_API_KEY
  if (!key) throw new Error('VITE_FOOTBALL_API_KEY is not set.')
  return { 'X-Auth-Token': key }
}

// ── Smart fetch: cache-first, retry on 429 ───────────────────────────────────
async function smartFetch(url, cacheKey) {
  // 1. Return cache if fresh
  const cached = getCached(cacheKey)
  if (cached) return cached

  // 2. Try the request
  try {
    const res = await fetch(url, { headers: authHeaders() })

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
    `${BASE}/competitions/WC/standings?season=2026`,
    `${BASE}/competitions/WC/standings`,
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
    `${BASE}/competitions/WC/matches${status ? `?status=${status}&season=2026` : '?season=2026'}`,
    `${BASE}/competitions/WC/matches${status ? `?status=${status}` : ''}`,
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
  CACHE.clear()
}
