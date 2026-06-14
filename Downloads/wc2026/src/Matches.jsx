import { useState, useEffect, useCallback } from 'react'
import { fetchMatches, clearCache } from './api.js'
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

// Knockout round definitions — correct match counts
const KNOCKOUT_STAGES = [
  { key: 'r32',  label: 'Round of 32',    sublabel: 'Last 32 · Knockout Stage', matches: 16, color: 'var(--green)',  keywords: ['32'] },
  { key: 'r16',  label: 'Round of 16',    sublabel: 'Last 16 · Knockout Stage', matches: 8,  color: '#38bdf8',      keywords: ['16'] },
  { key: 'qf',   label: 'Quarter-finals', sublabel: 'Last 8 · Knockout Stage',  matches: 4,  color: 'var(--amber)', keywords: ['quarter'] },
  { key: 'sf',   label: 'Semi-finals',    sublabel: 'Last 4 · Knockout Stage',  matches: 2,  color: '#c084fc',      keywords: ['semi'] },
  { key: 'tp',   label: 'Third Place',    sublabel: 'Bronze Match',             matches: 1,  color: '#94a3b8',      keywords: ['third','3rd','bronze'] },
  { key: 'fin',  label: 'THE FINAL',      sublabel: 'Jul 19 · MetLife Stadium', matches: 1,  color: 'var(--amber)', keywords: ['final'] },
]

function getStageKey(match) {
  const stage = (match.stage || match.group || '').toLowerCase()
  for (const s of KNOCKOUT_STAGES) {
    if (s.keywords.some(k => stage.includes(k))) return s.key
  }
  return null
}


function buildTeamGroupMap() {
  const map = {}
  for (const g of GROUPS) {
    for (const t of g.teams) map[t.name.toLowerCase()] = g.id
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

function isKnockout(m) {
  return getStageKey(m) !== null
}

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [alwaysLive, setAlwaysLive] = useState([]) // always-on live fetch, independent of filter

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) clearCache()
    setLoading(true); setError(null)
    try {
      const status = filter === 'IN_PLAY' ? 'IN_PLAY,PAUSED' : filter === 'ALL' ? '' : filter
      const json = await fetchMatches(status)
      setMatches(json.matches || [])
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [filter])

  // Always-on live match poller — updates every 30s regardless of which tab is open
  useEffect(() => {
    async function fetchLive() {
      try {
        const json = await fetchMatches('IN_PLAY,PAUSED')
        setAlwaysLive(json.matches || [])
      } catch {}
    }
    fetchLive()
    const t = setInterval(fetchLive, 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { load() }, [load])
  // Auto-refresh: every 30s on Live Now, every 45s on ALL (to catch kick-offs)
  useEffect(() => {
    if (filter !== 'IN_PLAY' && filter !== 'ALL') return
    const interval = filter === 'IN_PLAY' ? 30000 : 45000
    const t = setInterval(load, interval)
    return () => clearInterval(t)
  }, [filter, load])

  const liveCount    = alwaysLive.length // always accurate, from dedicated poller
  const groupMatches    = matches.filter(m => !isKnockout(m))
  const knockoutMatches = matches.filter(m => isKnockout(m))

  return (
    <div className="fade-up">

      {/* Filter pills */}
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
        <button onClick={() => load(true)} style={{
          marginLeft: 'auto', background: 'transparent',
          border: '1.5px solid var(--border)', color: 'var(--muted)',
          borderRadius: '30px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
        }}>↻ Refresh</button>
      </div>

      {loading && <Spinner label="Loading matches…" />}
      {!loading && error && <ErrorBox message={error} onRetry={load} />}
      {!loading && !error && matches.length === 0 && (
        <>
          {liveCount > 0 && filter !== 'IN_PLAY' && (
            <div
              onClick={() => setFilter('IN_PLAY')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '10px', marginBottom: '20px',
                padding: '11px 18px',
                background: 'rgba(255,61,61,0.08)',
                border: '1px solid rgba(255,61,61,0.3)', borderRadius: '12px',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,61,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,61,61,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <LiveDot />
                <span style={{ fontFamily: 'var(--font-disp)', fontSize: '15px', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.05em' }}>
                  {liveCount} MATCH{liveCount > 1 ? 'ES' : ''} LIVE NOW
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {alwaysLive.map(m => `${m.homeTeam?.name || '?'} vs ${m.awayTeam?.name || '?'}`).join('  ·  ')}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>VIEW LIVE →</span>
            </div>
          )}
          <Empty message={filter === 'IN_PLAY' ? 'No matches live right now.' : 'No matches found.'} />
        </>
      )}

      {!loading && !error && matches.length > 0 && (
        <>
          {/* ── Persistent live alert — visible on every tab except Live Now ── */}
          {liveCount > 0 && filter !== 'IN_PLAY' && (
            <div
              onClick={() => setFilter('IN_PLAY')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '10px', marginBottom: '20px',
                padding: '11px 18px',
                background: 'rgba(255,61,61,0.08)',
                border: '1px solid rgba(255,61,61,0.3)', borderRadius: '12px',
                cursor: 'pointer', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,61,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,61,61,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <LiveDot />
                <span style={{ fontFamily: 'var(--font-disp)', fontSize: '15px', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.05em' }}>
                  {liveCount} MATCH{liveCount > 1 ? 'ES' : ''} LIVE NOW
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {alwaysLive.map(m => `${m.homeTeam?.name || '?'} vs ${m.awayTeam?.name || '?'}`).join('  ·  ')}
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--red)', whiteSpace: 'nowrap' }}>VIEW LIVE →</span>
            </div>
          )}

          {/* ── GROUP STAGE ── */}
          {groupMatches.length > 0 && (
            <GroupMatchSection matches={groupMatches} />
          )}

          {/* ── KNOCKOUT STAGE — split by round ── */}
          {knockoutMatches.length > 0 && (
            <KnockoutMatchSection matches={knockoutMatches} />
          )}
        </>
      )}

    </div>
  )
}

// ── Group Stage section ───────────────────────────────────────────────────────
function GroupMatchSection({ matches }) {
  return (
    <div style={{ marginBottom: '36px' }}>
      <SectionHeader title="GROUP STAGE" icon="⚽" color="var(--green)" count={matches.length} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
        {matches.map(m => <MatchCard key={m.id} match={m} />)}
      </div>
    </div>
  )
}

// ── Knockout Stage — one subsection per round ─────────────────────────────────
function KnockoutMatchSection({ matches }) {
  return (
    <div>
      {/* Big knockout header */}
      <div style={{
        marginBottom: '20px', paddingBottom: '12px',
        borderBottom: '2px solid rgba(255,171,0,0.5)',
      }}>
        <div style={{ fontFamily: 'var(--font-disp)', fontSize: '26px', fontWeight: 900, letterSpacing: '0.06em', color: 'var(--amber)' }}>
          🏆 KNOCKOUT STAGE
        </div>
        <div style={{ fontSize: '12px', color: 'var(--faint)', marginTop: '3px' }}>
          Single elimination · {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* One block per round */}
      {KNOCKOUT_STAGES.map((stage, si) => {
        const stageMatches = matches.filter(m => getStageKey(m) === stage.key)
        if (stageMatches.length === 0) return null
        const isFinal = stage.key === 'fin'

        return (
          <div key={stage.key} style={{ marginBottom: '28px' }}>
            {/* Round divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '14px', paddingBottom: '10px',
              borderBottom: `1.5px solid ${stage.color}55`,
            }}>
              <div style={{
                fontFamily: 'var(--font-disp)',
                fontSize: isFinal ? '22px' : '18px',
                fontWeight: 900, letterSpacing: '0.06em',
                color: stage.color,
              }}>
                {isFinal ? '🥇' : `R${si + 1}`} {stage.label.toUpperCase()}
              </div>
              <div style={{ height: '1px', flex: 1, background: `${stage.color}33` }} />
              <div style={{ fontSize: '11px', color: 'var(--faint)', whiteSpace: 'nowrap' }}>
                {stage.sublabel}
              </div>
              <div style={{
                fontFamily: 'var(--font-disp)',
                fontSize: '13px', fontWeight: 800,
                color: stage.color, opacity: 0.7,
                whiteSpace: 'nowrap',
              }}>
                {stageMatches.length}/{stage.matches} matches
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' }}>
              {stageMatches.map(m => <MatchCard key={m.id} match={m} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title, icon, color, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '14px', paddingBottom: '10px',
      borderBottom: `2px solid ${color}55`,
    }}>
      <span style={{ fontFamily: 'var(--font-disp)', fontSize: '20px', fontWeight: 900, letterSpacing: '0.06em', color }}>
        {icon} {title}
      </span>
      <span style={{ fontSize: '12px', color: 'var(--faint)' }}>{count} match{count !== 1 ? 'es' : ''}</span>
    </div>
  )
}

// ── Match card ────────────────────────────────────────────────────────────────
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

  const rawGroup = match.group?.replace(/^Group\s*/i, '') || getGroupForMatch(home, away)
  const groupLetter = rawGroup && rawGroup.length <= 2 ? rawGroup : rawGroup
  const stageLabel  = !groupLetter ? (match.stage || '') : null

  // Team color glow on hover
  const TEAM_COLORS = {
    'brazil': '#009C3B', 'argentina': '#74ACDF', 'france': '#002395',
    'germany': '#000000', 'spain': '#AA151B', 'england': '#CF1020',
    'portugal': '#006600', 'netherlands': '#AE1C28', 'mexico': '#006847',
    'united states': '#B22234', 'japan': '#BC002D', 'south korea': '#C60C30',
    'morocco': '#C1272D', 'senegal': '#00853F', 'colombia': '#FCD116',
  }
  const getTeamGlow = () => {
    const h = home.toLowerCase(), a = away.toLowerCase()
    for (const [team, color] of Object.entries(TEAM_COLORS)) {
      if (h.includes(team) || a.includes(team)) return color
    }
    return null
  }
  const teamGlow = getTeamGlow()

  return (
    <div style={{
      background: isLive ? 'rgba(255,61,61,0.06)' : 'var(--surface)',
      border: `1px solid ${isLive ? 'rgba(255,61,61,0.3)' : 'var(--border)'}`,
      borderRadius: '16px', overflow: 'hidden',
      transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => {
        const gc  = isLive ? 'rgba(255,61,61,0.6)'  : teamGlow ? `${teamGlow}99` : 'rgba(0,200,83,0.5)'
        const sc1 = isLive ? 'rgba(255,61,61,0.2)'  : teamGlow ? `${teamGlow}30` : 'rgba(0,200,83,0.12)'
        const sc2 = isLive ? 'rgba(255,61,61,0.06)' : teamGlow ? `${teamGlow}0e` : 'rgba(0,200,83,0.04)'
        e.currentTarget.style.borderColor = gc
        e.currentTarget.style.boxShadow = `0 0 28px 4px ${sc1}, 0 0 70px ${sc2}`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isLive ? 'rgba(255,61,61,0.3)' : 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '7px 14px',
        background: isLive ? 'rgba(255,61,61,0.1)' : isFinished ? 'rgba(255,255,255,0.02)' : 'rgba(0,200,83,0.04)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Group badge — lighter, smaller, readable */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          {groupLetter && (
            <span style={{
              fontFamily: 'var(--font-disp)',
              background: 'rgba(0,200,83,0.12)',
              color: 'var(--green)',
              border: '1px solid rgba(0,200,83,0.25)',
              fontWeight: 600,
              fontSize: '11px',
              borderRadius: '5px', padding: '2px 7px',
              letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0,
            }}>GROUP {groupLetter}</span>
          )}
          {stageLabel && (
            <span style={{
              fontFamily: 'var(--font-disp)',
              background: 'rgba(255,171,0,0.1)', color: 'var(--amber)',
              border: '1px solid rgba(255,171,0,0.2)',
              fontWeight: 600, fontSize: '11px',
              borderRadius: '5px', padding: '2px 7px',
              letterSpacing: '0.04em', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px',
            }}>{stageLabel}</span>
          )}
          {match.matchday && (
            <span style={{ fontSize: '11px', color: 'var(--faint)', whiteSpace: 'nowrap' }}>MD {match.matchday}</span>
          )}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          {isLive && <LiveDot />}
          <span style={{ fontFamily: 'var(--font-disp)', fontSize: '13px', fontWeight: 700, letterSpacing: '0.06em', color: sl.color }}>
            {isLive && match.minute ? `${match.minute}'` : sl.text}
          </span>
        </div>
      </div>

      {/* Teams + Score */}
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px' }}>

          {/* Home */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
            <img src={`https://flagcdn.com/h40/${getCode(home)}.png`} alt={home}
              style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px' }}
              onError={e => e.target.style.display = 'none'} />
            <span style={{ fontWeight: 700, fontSize: '14px', textAlign: 'right', lineHeight: 1.25 }}>{home}</span>
          </div>

          {/* Score / VS */}
          <div style={{ textAlign: 'center', minWidth: '88px' }}>
            {hasScore ? (
              <>
                <div style={{
                  fontFamily: 'var(--font-disp)', fontSize: '40px', fontWeight: 900,
                  lineHeight: 1, letterSpacing: '3px',
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
                    <div style={{ fontFamily: 'var(--font-disp)', fontSize: '14px', fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.04em' }}>
                      {fmtDate(match.utcDate)}
                    </div>
                    <div style={{ fontFamily: 'var(--font-disp)', fontSize: '20px', fontWeight: 900, color: 'var(--text)', letterSpacing: '0.04em', marginTop: '1px' }}>
                      {fmtTime(match.utcDate)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Away */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <img src={`https://flagcdn.com/h40/${getCode(away)}.png`} alt={away}
              style={{ width: '36px', height: '24px', objectFit: 'cover', borderRadius: '3px' }}
              onError={e => e.target.style.display = 'none'} />
            <span style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.25 }}>{away}</span>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <div style={{ textAlign: 'center', marginTop: '11px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--faint)' }}>
            📍 {match.venue}
          </div>
        )}

        {/* Watch Live — only on live cards, one per match */}
        {isLive && (
          <a href={WATCH_LINK} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            marginTop: '12px', padding: '9px', background: 'var(--red)', borderRadius: '10px',
            color: '#fff', fontWeight: 800, fontSize: '13px', letterSpacing: '0.06em',
            textDecoration: 'none', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <LiveDot /> WATCH LIVE
          </a>
        )}
      </div>
    </div>
  )
}

function fmtDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  catch { return '' }
}
function fmtTime(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}
