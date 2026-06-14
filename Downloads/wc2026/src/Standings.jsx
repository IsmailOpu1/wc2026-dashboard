import { useState, useEffect } from 'react'
import { fetchStandings, fetchMatches, clearCache } from './api.js'
import { Spinner } from './components.jsx'
import { GROUPS, KNOCKOUT_ROUNDS } from './groupsData.js'
import { COUNTRY_CODE } from './utils.js'

function getCode(name) {
  if (!name) return 'xx'
  const direct = COUNTRY_CODE[name]
  if (direct) return direct
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(COUNTRY_CODE)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v
  }
  return 'xx'
}
const getCodeByName = getCode

function Flag({ name, size = 24 }) {
  const code = getCode(name)
  return (
    <img
      src={`https://flagcdn.com/h40/${code}.png`}
      alt={name}
      style={{ width: size * 1.5, height: size, objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }}
      onError={e => e.target.style.display = 'none'}
    />
  )
}

export default function Standings() {
  const [liveStandings, setLiveStandings] = useState({})
  const [knockoutMatches, setKnockoutMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('groups')

  useEffect(() => {
    async function load() {
      try {
        const [standingsJson, matchesJson] = await Promise.allSettled([
          fetchStandings(),
          fetchMatches(''),
        ])

        // Build live standings map: teamName -> row
        if (standingsJson.status === 'fulfilled') {
          const map = {}
          for (const g of (standingsJson.value?.standings || [])) {
            for (const row of (g.table || [])) {
              const name = row.team?.name
              if (name) map[name] = row
            }
          }
          setLiveStandings(map)
        }

        // Extract knockout matches
        if (matchesJson.status === 'fulfilled') {
          const allMatches = matchesJson.value?.matches || []
          const ko = allMatches.filter(m => {
            const stage = (m.stage || m.group || '').toLowerCase()
            return stage.includes('32') || stage.includes('16') ||
              stage.includes('quarter') || stage.includes('semi') ||
              stage.includes('final') || stage.includes('knockout') ||
              stage.includes('round of')
          })
          setKnockoutMatches(ko)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function getLiveStats(teamName) {
    if (liveStandings[teamName]) return liveStandings[teamName]
    const lower = teamName.toLowerCase()
    for (const [k, v] of Object.entries(liveStandings)) {
      if (k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())) return v
    }
    return null
  }

  // Build sorted rows for a group
  function buildGroupRows(group) {
    return group.teams.map(t => {
      const live = getLiveStats(t.name)
      return {
        name: t.name,
        code: t.code || getCode(t.name),
        host: t.host || false,
        played: live?.playedGames ?? 0,
        won:    live?.won ?? 0,
        drawn:  live?.draw ?? 0,
        lost:   live?.lost ?? 0,
        gf:     live?.goalsFor ?? 0,
        ga:     live?.goalsAgainst ?? 0,
        points: live?.points ?? 0,
      }
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      const gdDiff = (b.gf - b.ga) - (a.gf - a.ga)
      if (gdDiff !== 0) return gdDiff
      return b.gf - a.gf
    })
  }

  return (
    <div className="fade-up">
      {/* Sub-tab */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        {[['groups', 'GROUP STAGE'], ['knockout', 'KNOCKOUT STAGE']].map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)} style={{
            fontFamily: 'var(--font-disp)',
            fontSize: '17px', fontWeight: 800, letterSpacing: '0.05em',
            padding: '10px 24px', border: 'none', background: 'transparent', cursor: 'pointer',
            color: subTab === id ? (id === 'knockout' ? 'var(--amber)' : 'var(--green)') : 'var(--muted)',
            borderBottom: subTab === id
              ? `3px solid ${id === 'knockout' ? 'var(--amber)' : 'var(--green)'}`
              : '3px solid transparent',
            marginBottom: '-1px', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {loading && <Spinner label="Loading live data…" />}

      {/* GROUP STAGE */}
      {subTab === 'groups' && !loading && (
        <GroupStageView groups={GROUPS} buildGroupRows={buildGroupRows} hasLive={Object.keys(liveStandings).length > 0} />
      )}

      {/* KNOCKOUT STAGE */}
      {subTab === 'knockout' && !loading && (
        <KnockoutStageView knockoutMatches={knockoutMatches} buildGroupRows={buildGroupRows} />
      )}
    </div>
  )
}

// ─── GROUP STAGE ──────────────────────────────────────────────────────────────

function GroupStageView({ groups, buildGroupRows, hasLive }) {
  const [selectedGroup, setSelectedGroup] = useState(null)
  // Only one group's matches open at a time
  const [openMatchesGroup, setOpenMatchesGroup] = useState(null)

  const toggleMatches = (id) => {
    setOpenMatchesGroup(prev => (prev === id ? null : id))
  }

  const visible = selectedGroup ? groups.filter(g => g.id === selectedGroup) : groups

  return (
    <>
      {/* Group filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
        <button onClick={() => setSelectedGroup(null)} style={pillStyle(!selectedGroup, false)}>ALL</button>
        {groups.map(g => (
          <button key={g.id} onClick={() => setSelectedGroup(g.id === selectedGroup ? null : g.id)}
            style={pillStyle(selectedGroup === g.id, false)}>
            {g.id}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '16px', alignItems: 'start' }}>
        {visible.map(g => (
          <GroupCard
            key={g.id}
            group={g}
            rows={buildGroupRows(g)}
            hasLive={hasLive}
            showMatches={openMatchesGroup === g.id}
            onToggleMatches={() => toggleMatches(g.id)}
          />
        ))}
      </div>

    </>
  )
}

function GroupCard({ group, rows, hasLive, showMatches, onToggleMatches }) {

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px', overflow: 'hidden',
      transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(0,200,83,0.55)'
        e.currentTarget.style.boxShadow = '0 0 28px rgba(0,200,83,0.16), 0 0 80px rgba(0,200,83,0.06), inset 0 0 30px rgba(0,200,83,0.025)'
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        background: 'linear-gradient(90deg, rgba(0,200,83,0.1) 0%, transparent 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontFamily: 'var(--font-disp)',
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--green), #00a846)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '22px', color: '#000',
            boxShadow: '0 4px 12px rgba(0,200,83,0.25)', flexShrink: 0,
          }}>{group.id}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-disp)', fontWeight: 900, fontSize: '20px', letterSpacing: '0.05em', lineHeight: 1 }}>
              GROUP {group.id}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--faint)', marginTop: '3px' }}>
              {group.teams.map(t => t.name).join(' · ')}
            </div>
          </div>
        </div>
        {hasLive && (
          <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, letterSpacing: '0.06em' }}>● LIVE</span>
        )}
      </div>

      {/* Standings table */}
      <div style={{ padding: '0 18px 2px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '380px' }}>
          <thead>
            <tr style={{ fontSize: '11px', color: 'var(--faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', padding: '10px 0 8px', fontWeight: 600, width: '28px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '10px 0 8px', fontWeight: 600 }}>Team</th>
              <th style={{ textAlign: 'center', padding: '10px 5px 8px', fontWeight: 600 }}>MP</th>
              <th style={{ textAlign: 'center', padding: '10px 5px 8px', fontWeight: 600 }}>W</th>
              <th style={{ textAlign: 'center', padding: '10px 5px 8px', fontWeight: 600 }}>D</th>
              <th style={{ textAlign: 'center', padding: '10px 5px 8px', fontWeight: 600 }}>L</th>
              <th style={{ textAlign: 'center', padding: '10px 5px 8px', fontWeight: 600 }}>GD</th>
              <th style={{ textAlign: 'center', padding: '10px 5px 8px', fontWeight: 700, color: 'var(--amber)' }}>PTS</th>
              <th style={{ textAlign: 'center', padding: '10px 0 8px', fontWeight: 600, width: '60px' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const gd = row.gf - row.ga
              const advances = i < 2
              const possible = i === 2
              const qualColor = advances ? 'var(--green)' : possible ? 'var(--amber)' : 'var(--faint)'
              return (
                <tr key={row.name} style={{
                  borderTop: '1px solid var(--border)',
                  background: advances ? 'rgba(0,200,83,0.04)' : 'transparent',
                }}>
                  <td style={{ padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '3px', height: '22px', borderRadius: '2px', background: qualColor, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-disp)', fontSize: '15px', fontWeight: 700, color: 'var(--faint)' }}>{i + 1}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 12px 12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                      <Flag name={row.name} size={18} />
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{row.name}</span>
                      {row.host && <span style={{ fontSize: '10px', background: 'rgba(255,171,0,0.15)', color: 'var(--amber)', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>HOST</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)' }}>{row.played}</td>
                  <td style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{row.won}</td>
                  <td style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{row.drawn}</td>
                  <td style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>{row.lost}</td>
                  <td style={{ textAlign: 'center', fontSize: '14px', fontWeight: 600, color: gd > 0 ? 'var(--green)' : gd < 0 ? 'var(--red)' : 'var(--muted)' }}>
                    {gd > 0 ? `+${gd}` : gd}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-disp)', fontSize: '20px', fontWeight: 900, color: 'var(--amber)' }}>{row.points}</span>
                  </td>
                  <td style={{ textAlign: 'center', padding: '12px 0' }}>
                    {advances ? (
                      <span style={{ fontSize: '10px', background: 'rgba(0,200,83,0.15)', color: 'var(--green)', borderRadius: '5px', padding: '3px 7px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        ✓ ADVANCE
                      </span>
                    ) : possible ? (
                      <span style={{ fontSize: '10px', background: 'rgba(255,171,0,0.12)', color: 'var(--amber)', borderRadius: '5px', padding: '3px 7px', fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        ? POSSIBLE
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', background: 'rgba(255,61,61,0.1)', color: 'var(--red)', borderRadius: '5px', padding: '3px 7px', fontWeight: 700, letterSpacing: '0.04em' }}>
                        OUT
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', padding: '8px 18px', fontSize: '10px', color: 'var(--faint)', letterSpacing: '0.05em', borderTop: '1px solid var(--border)' }}>
        <span><span style={{ color: 'var(--green)' }}>▌</span> TOP 2 ADVANCE</span>
        <span><span style={{ color: 'var(--amber)' }}>▌</span> POSSIBLE 3RD</span>
        <span><span style={{ color: 'var(--faint)' }}>▌</span> ELIMINATED</span>
      </div>

      {/* Matches toggle */}
      <button onClick={onToggleMatches} style={{
        width: '100%', padding: '10px 18px',
        background: 'rgba(255,255,255,0.02)', border: 'none',
        borderTop: '1px solid var(--border)',
        cursor: 'pointer', color: 'var(--muted)', fontSize: '12px', fontWeight: 700,
        letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span>GROUP MATCHES</span>
        <span style={{ transition: 'transform 0.2s', display: 'inline-block', transform: showMatches ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {showMatches && (
        <div style={{ padding: '4px 18px 14px' }}>
          {group.matches.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 110px 1fr',
              alignItems: 'center', gap: '8px',
              padding: '9px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}>
              {/* Home team — flag + name right-aligned */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '7px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', textAlign: 'right' }}>{m.home}</span>
                <img
                  src={`https://flagcdn.com/h20/${getCodeByName(m.home)}.png`}
                  alt={m.home}
                  style={{ width: '22px', height: '14px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
                  onError={e => e.target.style.display = 'none'}
                />
              </div>
              {/* Date + venue */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-disp)', fontWeight: 800, color: 'var(--amber)', letterSpacing: '0', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '11px' }}>{m.date.split(' ')[0]}</div>
                  <div style={{ fontSize: '18px' }}>{m.date.split(' ')[1]}</div>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.venue}</div>
              </div>
              {/* Away team — flag + name left-aligned */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <img
                  src={`https://flagcdn.com/h20/${getCodeByName(m.away)}.png`}
                  alt={m.away}
                  style={{ width: '22px', height: '14px', objectFit: 'cover', borderRadius: '2px', flexShrink: 0 }}
                  onError={e => e.target.style.display = 'none'}
                />
                <span style={{ fontWeight: 700, fontSize: '13px' }}>{m.away}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── KNOCKOUT STAGE ───────────────────────────────────────────────────────────

function KnockoutStageView({ knockoutMatches, buildGroupRows }) {
  const [expandedRound, setExpandedRound] = useState(null)

  // Build advance data per round from live knockout matches
  function getAdvancedTeams(roundLabel) {
    const roundMatches = knockoutMatches.filter(m => {
      const s = (m.stage || '').toLowerCase()
      const r = roundLabel.toLowerCase()
      if (r.includes('32')) return s.includes('32')
      if (r.includes('16')) return s.includes('16')
      if (r.includes('quarter')) return s.includes('quarter')
      if (r.includes('semi')) return s.includes('semi')
      if (r.includes('final') && !r.includes('semi') && !r.includes('third')) return s === 'final' || s.includes('world cup final')
      if (r.includes('third')) return s.includes('third') || s.includes('3rd')
      return false
    })

    if (roundMatches.length === 0) return { teams: [], pending: true }

    const teams = []
    for (const m of roundMatches) {
      const hScore = m.score?.fullTime?.home
      const aScore = m.score?.fullTime?.away
      const home = m.homeTeam?.name
      const away = m.awayTeam?.name
      const isFinished = m.status === 'FINISHED'
      const isScheduled = m.status === 'SCHEDULED' || m.status === 'TIMED'

      if (isFinished && hScore !== null && aScore !== null) {
        if (hScore > aScore) teams.push({ name: home, result: 'WIN' })
        else if (aScore > hScore) teams.push({ name: away, result: 'WIN' })
        else {
          // draw — check extra time / penalties
          const etH = m.score?.extraTime?.home
          const etA = m.score?.extraTime?.away
          const penH = m.score?.penalties?.home
          const penA = m.score?.penalties?.away
          if (penH !== null && penA !== null) {
            teams.push({ name: penH > penA ? home : away, result: 'PEN' })
          } else if (etH !== null && etA !== null) {
            teams.push({ name: etH > etA ? home : away, result: 'AET' })
          }
        }
      } else if (!isScheduled) {
        if (home) teams.push({ name: home, result: 'TBD' })
        if (away) teams.push({ name: away, result: 'TBD' })
      }
    }
    return { teams, pending: roundMatches.every(m => m.status === 'SCHEDULED' || m.status === 'TIMED') }
  }

  // For Round of 32 — show which group teams qualify
  function getRound32Preview() {
    const qualifiers = []
    for (const g of GROUPS) {
      const rows = buildGroupRows(g)
      const top2 = rows.slice(0, 2)
      qualifiers.push({ group: g.id, teams: top2 })
    }
    return qualifiers
  }

  return (
    <div>
      {/* Explanation banner */}
      <div style={{
        padding: '14px 18px', marginBottom: '20px',
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
        fontSize: '14px', color: 'var(--muted)', lineHeight: 1.7,
      }}>
        <strong style={{ color: 'var(--text)' }}>Format:</strong> Top 2 from each group (24) + best 8 third-place teams = <strong style={{ color: 'var(--green)' }}>32 teams</strong> enter the knockout stage. Single elimination. Click any round to see who's in it.
      </div>

      {/* Round cards */}
      <div style={{ display: 'grid', gap: '10px' }}>
        {KNOCKOUT_ROUNDS.map((r, i) => {
          const isOpen = expandedRound === r.round
          const isFinal = r.round === 'Final'
          const advData = getAdvancedTeams(r.round)
          const isR32 = r.round === 'Round of 32'
          const r32Preview = isR32 ? getRound32Preview() : null

          return (
            <div key={r.round} style={{
              background: 'var(--surface)',
              border: `1px solid ${isFinal ? 'rgba(255,171,0,0.3)' : isOpen ? 'rgba(0,200,83,0.3)' : 'var(--border)'}`,
              borderRadius: '14px', overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}>
              {/* Round header — clickable */}
              <button
                onClick={() => setExpandedRound(isOpen ? null : r.round)}
                style={{
                  width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
                  textAlign: 'left',
                }}
              >
                {/* Round badge */}
                <div style={{
                  fontFamily: 'var(--font-disp)',
                  width: '46px', height: '46px', borderRadius: '10px', flexShrink: 0,
                  background: isFinal
                    ? 'linear-gradient(135deg, var(--amber), #ff8f00)'
                    : isOpen
                      ? 'var(--green-dim)'
                      : 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: '18px',
                  color: isFinal ? '#000' : isOpen ? 'var(--green)' : 'var(--muted)',
                  boxShadow: isFinal ? '0 4px 14px rgba(255,171,0,0.3)' : 'none',
                  border: isOpen && !isFinal ? '1.5px solid var(--green)' : 'none',
                }}>
                  {KNOCKOUT_ROUNDS.length - i}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-disp)',
                    fontSize: '21px', fontWeight: 900, letterSpacing: '0.05em',
                    color: isFinal ? 'var(--amber)' : 'var(--text)',
                  }}>
                    {r.round.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--faint)', marginTop: '2px' }}>{r.dates}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-disp)', fontSize: '30px', fontWeight: 900, color: isFinal ? 'var(--amber)' : 'var(--green)', lineHeight: 1 }}>
                    {r.matches}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--faint)', letterSpacing: '0.05em' }}>
                    {r.matches === 1 ? 'MATCH' : 'MATCHES'}
                  </div>
                </div>

                <span style={{
                  fontSize: '18px', color: 'var(--faint)',
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s', display: 'inline-block', marginLeft: '8px',
                }}>▾</span>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px' }}>

                  {/* Round of 32 — show group qualifiers preview */}
                  {isR32 && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--faint)', letterSpacing: '0.06em', marginBottom: '12px', fontWeight: 700 }}>
                        QUALIFIED / PROJECTED QUALIFIERS FROM GROUP STAGE
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {r32Preview.map(({ group, teams }) => (
                          <div key={group} style={{
                            background: 'var(--surface2)', borderRadius: '10px', padding: '10px 12px',
                            border: '1px solid var(--border)',
                          }}>
                            <div style={{ fontFamily: 'var(--font-disp)', fontSize: '13px', fontWeight: 800, color: 'var(--green)', marginBottom: '8px', letterSpacing: '0.06em' }}>
                              GROUP {group}
                            </div>
                            {teams.map((t, ti) => (
                              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: ti === 0 ? '5px' : '0' }}>
                                <Flag name={t.name} size={14} />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{t.name}</span>
                                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-disp)', fontSize: '12px', color: 'var(--amber)', fontWeight: 800 }}>
                                  {t.points}pts
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other rounds — show actual advancing teams from API */}
                  {!isR32 && (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--faint)', letterSpacing: '0.06em', marginBottom: '12px', fontWeight: 700 }}>
                        TEAMS IN THIS ROUND
                      </div>
                      {advData.pending || advData.teams.length === 0 ? (
                        <div style={{
                          textAlign: 'center', padding: '20px',
                          color: 'var(--faint)', fontSize: '13px',
                          background: 'var(--surface2)', borderRadius: '10px',
                          border: '1px dashed var(--border)',
                        }}>
                          ⏳ Data will appear here once teams advance from the previous round
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                          {advData.teams.map(t => (
                            <div key={t.name} style={{
                              display: 'flex', alignItems: 'center', gap: '9px',
                              background: 'var(--surface2)', borderRadius: '10px', padding: '10px 12px',
                              border: '1px solid var(--border)',
                            }}>
                              <Flag name={t.name} size={16} />
                              <span style={{ fontSize: '14px', fontWeight: 600 }}>{t.name}</span>
                              {t.result !== 'WIN' && (
                                <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--faint)', fontWeight: 700 }}>{t.result}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Final venue callout */}
                  {isFinal && (
                    <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(255,171,0,0.06)', border: '1px solid rgba(255,171,0,0.2)', borderRadius: '10px' }}>
                      <div style={{ fontFamily: 'var(--font-disp)', fontSize: '15px', fontWeight: 800, color: 'var(--amber)', marginBottom: '4px' }}>🏟️ VENUE</div>
                      <div style={{ fontSize: '13px', color: 'var(--muted)' }}>MetLife Stadium, East Rutherford, New Jersey · Capacity: 82,500</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function pillStyle(active, danger) {
  return {
    padding: '7px 15px', borderRadius: '30px', cursor: 'pointer',
    fontFamily: 'var(--font-disp)',
    fontWeight: 700, fontSize: '14px', letterSpacing: '0.04em',
    border: active
      ? `1.5px solid ${danger ? 'var(--red)' : 'var(--green)'}`
      : '1.5px solid var(--border)',
    background: active
      ? (danger ? 'var(--red-dim)' : 'var(--green-dim)')
      : 'transparent',
    color: active ? (danger ? 'var(--red)' : 'var(--green)') : 'var(--muted)',
    transition: 'all 0.15s',
  }
}
