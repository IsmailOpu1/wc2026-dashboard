import { useState, useEffect, useCallback } from 'react'
import { fetchMatches } from './api.js'
import { formatKickoff, statusLabel, COUNTRY_CODE } from './utils.js'
import { Spinner, ErrorBox, Empty, LiveDot } from './components.jsx'
import { GROUPS } from './groupsData.js'

const WATCH_LINK = 'https://roxiestreams.su/soccer-streams-1'

const FILTERS = [
  { id: 'ALL',       label: 'All Matches' },
  { id: 'IN_PLAY',   label: 'Live Now' },
  { id: 'SCHEDULED', label: 'Upcoming' },
  { id: 'FINISHED',  label: 'Finished' },
]

// Build team->group map from hardcoded data
function buildTeamGroupMap() {
  const map = {}
  for (const g of GROUPS) {
    for (const t of g.teams) {
      map[t.name.toLowerCase()] = g.id
    }
  }
  return map
}
const TEAM_GROUP_MAP = buildTeamGroupMap()

function getGroupForMatch(home, away) {
  const h = (home || '').toLowerCase()
  const a = (away || '').toLowerCase()
  for (const [k, v] of Object.entries(TEAM_GROUP_MAP)) {
    if (h === k || h.includes(k) || k.includes(h)) return v
    if (a === k || a.includes(k) || k.includes(a)) return v
  }
  return null
}

function getCode(name) {
  if (!name) return 'xx'
  if (COUNTRY_CODE[name]) return COUNTRY_CODE[name]
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(COUNTRY_CODE)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v
  }
  return 'xx'
}

function isKnockoutMatch(m) {
  const stage = (m.stage || m.group || '').toLowerCase()
  return stage.includes('32') || stage.includes('16') || stage.includes('quarter') ||
    stage.includes('semi') || stage.includes('final') || stage.includes('knockout') ||
    stage.includes('round of')
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const status = filter === 'IN_PLAY' ? 'IN_PLAY,PAUSED' : filter === 'ALL' ? '' : filter
      const json = await fetchMatches(status)
      setMatches(json.matches || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s only on live tab
  useEffect(() => {
    if (filter !== 'IN_PLAY') return
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [filter, load])

  const liveMatches    = matches.filter(m => m.status === 'IN_PLAY' || m.status === 'PAUSED')
  const groupMatches   = matches.filter(m => !isKnockoutMatch(m))
  const knockoutMatches = matches.filter(m => isKnockoutMatch(m))
  const liveCount = liveMatches.length

  return (
    <div className="fade-up">

      {/* ── Filter bar — NO global Watch Now ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '8px 18px', borderRadius: '30px', cursor: 'pointer',
            fontWeight: 700, fontSize: '13px', letterSpacing: '0.02em',
            border: filter === f.id
              ? `1.5px solid ${f.id === 'IN_PLAY' ? 'var(--red)' : 'var(--green)'}`
              : '1.5px solid var(--border)',
            background: filter === f.id
              ? (f.id === 'IN_PLAY' ? 'var(--red-dim)' : 'var(--green-dim)')
              : 'transparent',
            color: filter === f.id
              ? (f.id === 'IN_PLAY' ? 'var(--red)' : 'var(--green)')
              : 'var(--muted)',
            display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            {f.id === 'IN_PLAY' && liveCount > 0 && <LiveDot />}
            {f.label}{f.id === 'IN_PLAY' && liveCount > 0 ? ` (${liveCount})` : ''}
          </button>
        ))}

        <button onClick={load} style={{
          marginLeft: 'auto',
          background: 'transparent', border: '1.5px solid var(--border)',
          color: 'var(--muted)', borderRadius: '30px', padding: '8px 16px',
          fontSize: '13px', cursor: 'pointer', fontWeight: 600,
        }}>↻ Refresh</button>
      </div>

      {loading && <Spinner label="Loading matches…" />}
      {!loading && error && <ErrorBox message={error} onRetry={load} />}
      {!loading && !error && matches.length === 0 && (
        <Empty message={filter === 'IN_PLAY' ? 'No matches live right now.' : 'No matches found.'} />
      )}

      {!loading && !error && matches.length > 0 && (
        <>
          {/* ── LIVE NOW section: Watch Now button only when live matches exist ── */}
          {filter === 'IN_PLAY' && liveMatches.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '10px',
              marginBottom: '20px', padding: '12px 18px',
              background: 'rgba(255,61,61,0.07)',
              border: '1px solid rgba(255,61,61,0.25)',
              borderRadius: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LiveDot />
                <span style={{ fontFamily: 'var(--font-disp)', fontSize: '18px', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.06em' }}>
                  {liveMatches.length} MATCH{liveMatches.length > 1 ? 'ES' : ''} LIVE NOW
                </span>
              </div>
              <a
                href={WATCH_LINK}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: 'var(--red)', color: '#fff',
                  borderRadius: '30px', padding: '10px 22px',
                  fontWeight: 800, fontSize: '14px', letterSpacing: '0.06em',
                  textDecoration: 'none', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <LiveDot />
                WATCH NOW
              </a>
            </div>
          )}

          {/* Group stage matches */}
          {groupMatches.length > 0 && (
            <MatchSection
              title="GROUP STAGE"
              matches={groupMatches}
              knockout={false}
            />
          )}

          {/* Knockout matches */}
          {knockoutMatches.length > 0 && (
            <MatchSection
              title="KNOCKOUT MATCHES"
              matches={knockoutMatches}
              knockout={true}
            />
          )}
        </>
      )}

    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function MatchSection({ title, matches, knockout }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        marginBottom: '14px', paddingBottom: '10px',
        borderBottom: `2px solid ${knockout ? 'rgba(255,171,0,0.4)' : 'rgba(0,200,83,0.35)'}`,
      }}>
        <span style={{
          fontFamily: 'var(--font-disp)',
          fontSize: '20px', fontWeight: 900, letterSpacing: '0.06em',
          color: knockout ? 'var(--amber)' : 'var(--green)',
        }}>
          {knockout ? '🏆' : '⚽'} {title}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--faint)' }}>
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: '12px',
      }}>
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  )
}

// ── Individual match card ─────────────────────────────────────────────────────
function MatchCard({ match }) {
  const home = match.homeTeam?.name || 'TBD'
  const away = match.awayTeam?.name || 'TBD'
  const hScore = match.score?.fullTime?.home
  const aScore = match.score?.fullTime?.away
  const htH    = match.score?.halfTime?.home
  const htA    = match.score?.halfTime?.away
  const isLive     = match.status === 'IN_PLAY' || match.status === 'PAUSED'
  const isFinished = match.status === 'FINISHED'
  const isUpcoming = match.status === 'SCHEDULED' || match.status === 'TIMED'
  const hasScore   = hScore !== null && hScore !== undefined
  const sl = statusLabel(match.status)

  // Group label — keep it short and readable
  const groupLetter = match.group?.replace('Group ', '') || getGroupForMatch(home, away)
  const stageLabel  = !groupLetter ? (match.stage || '') : null

  return (
    <div style={{
      background: isLive ? 'rgba(255,61,61,0.06)' : 'var(--surface)',
      border: `1px solid ${isLive ? 'rgba(255,61,61,0.3)' : 'var(--border)'}`,
      borderRadius: '16px', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = isLive ? 'rgba(255,61,61,0.5)' : 'rgba(0,200,83,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = isLive ? 'rgba(255,61,61,0.3)' : 'var(--border)'}
    >
      {/* ── Top strip ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 14px',
        background: isLive ? 'rgba(255,61,61,0.1)' : isFinished ? 'rgba(255,255,255,0.02)' : 'rgba(0,200,83,0.05)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Group badge — fixed small size, no overflow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {groupLetter && (
            <span style={{
              fontFamily: 'var(--font-disp)',
              background: 'var(--green)', color: '#000',
              fontWeight: 800, fontSize: '11px',
              borderRadius: '5px', padding: '2px 7px',
              letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
            }}>GRP {groupLetter}</span>
          )}
          {stageLabel && (
            <span style={{
              fontFamily: 'var(--font-disp)',
              background: 'rgba(255,171,0,0.15)', color: 'var(--amber)',
              fontWeight: 800, fontSize: '11px',
              borderRadius: '5px', padding: '2px 7px',
              letterSpacing: '0.04em', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px',
            }}>{stageLabel}</span>
          )}
          {match.matchday && (
            <span style={{ fontSize: '11px', color: 'var(--faint)', whiteSpace: 'nowrap' }}>MD {match.matchday}</span>
          )}
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {isLive && <LiveDot />}
          <span style={{
            fontFamily: 'var(--font-disp)',
            fontSize: '13px', fontWeight: 800, letterSpacing: '0.06em',
            color: sl.color,
          }}>
            {isLive && match.minute ? `${match.minute}'` : sl.text}
          </span>
        </div>
      </div>

      {/* ── Teams + Score ── */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center', gap: '10px',
        }}>
          {/* Home team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <img
              src={`https://flagcdn.com/h40/${getCode(home)}.png`}
              alt={home}
              style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px' }}
              onError={e => e.target.style.display = 'none'}
            />
            <span style={{ fontWeight: 700, fontSize: '14px', textAlign: 'right', lineHeight: 1.25 }}>{home}</span>
          </div>

          {/* Score / VS */}
          <div style={{ textAlign: 'center', minWidth: '88px' }}>
            {hasScore ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-disp)',
                  fontSize: '40px', fontWeight: 900, lineHeight: 1, letterSpacing: '3px',
                  color: isLive ? 'var(--red)' : isFinished ? 'var(--text)' : 'var(--faint)',
                }}>
                  {hScore}<span style={{ color: 'var(--faint)', margin: '0 2px' }}>–</span>{aScore}
                </div>
                {htH !== null && htH !== undefined && !isLive && (
                  <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '3px' }}>HT {htH}–{htA}</div>
                )}
              </>
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-disp)', fontSize: '22px', fontWeight: 900, color: 'var(--faint)' }}>VS</div>
                {isUpcoming && (
                  <div style={{ marginTop: '5px' }}>
                    <div style={{ fontFamily: 'var(--font-disp)', fontSize: '14px', fontWeight: 800, color: 'var(--amber)', letterSpacing: '0.04em' }}>
                      {formatDateShort(match.utcDate)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-disp)', fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '0.04em', marginTop: '1px' }}>
                      {formatTimeOnly(match.utcDate)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Away team */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <img
              src={`https://flagcdn.com/h40/${getCode(away)}.png`}
              alt={away}
              style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px' }}
              onError={e => e.target.style.display = 'none'}
            />
            <span style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.25 }}>{away}</span>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <div style={{
            textAlign: 'center', marginTop: '11px', paddingTop: '10px',
            borderTop: '1px solid var(--border)',
            fontSize: '12px', color: 'var(--faint)',
          }}>
            📍 {match.venue}
          </div>
        )}

        {/* Watch Live — only on live match cards, one per match */}
        {isLive && (
          <a
            href={WATCH_LINK}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              marginTop: '12px', padding: '9px',
              background: 'var(--red)', borderRadius: '10px',
              color: '#fff', fontWeight: 800, fontSize: '13px',
              letterSpacing: '0.06em', textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <LiveDot />
            WATCH LIVE
          </a>
        )}
      </div>
    </div>
  )
}

function formatDateShort(utcDate) {
  if (!utcDate) return ''
  try { return new Date(utcDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return '' }
}

function formatTimeOnly(utcDate) {
  if (!utcDate) return ''
  try { return new Date(utcDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}
