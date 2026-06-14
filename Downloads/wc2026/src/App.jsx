import { useState, useEffect } from 'react'
import Standings from './Standings.jsx'
import Matches from './Matches.jsx'
import { fetchMatches } from './api.js'
import { COUNTRY_CODE } from './utils.js'
import { LiveDot } from './components.jsx'

const WATCH_LINK = 'https://roxiestreams.su/soccer-streams-1'

function getCode(name) {
  if (!name) return 'xx'
  if (COUNTRY_CODE[name]) return COUNTRY_CODE[name]
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(COUNTRY_CODE)) {
    if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) return v
  }
  return 'xx'
}

// Pre-computed particle positions for animated background
const PARTICLES = [
  { left: '4%',  top: '88%', delay: '0s',   dur: '12s', size: 2, c: 'rgba(0,200,83,0.65)' },
  { left: '12%', top: '75%', delay: '2.4s', dur: '10s', size: 3, c: 'rgba(255,171,0,0.55)' },
  { left: '20%', top: '91%', delay: '5s',   dur: '14s', size: 2, c: 'rgba(0,200,83,0.55)' },
  { left: '28%', top: '82%', delay: '1.2s', dur: '11s', size: 2, c: 'rgba(56,189,248,0.5)'  },
  { left: '36%', top: '94%', delay: '7s',   dur: '9s',  size: 3, c: 'rgba(0,200,83,0.55)'  },
  { left: '44%', top: '79%', delay: '3.6s', dur: '13s', size: 2, c: 'rgba(255,171,0,0.5)'  },
  { left: '52%', top: '87%', delay: '0.8s', dur: '10s', size: 2, c: 'rgba(56,189,248,0.45)' },
  { left: '60%', top: '92%', delay: '4.8s', dur: '12s', size: 3, c: 'rgba(0,200,83,0.55)'  },
  { left: '68%', top: '81%', delay: '2s',   dur: '11s', size: 2, c: 'rgba(255,171,0,0.5)'  },
  { left: '76%', top: '86%', delay: '6.5s', dur: '10s', size: 2, c: 'rgba(0,200,83,0.55)'  },
  { left: '84%', top: '93%', delay: '1.8s', dur: '13s', size: 3, c: 'rgba(56,189,248,0.45)' },
  { left: '92%', top: '83%', delay: '3.2s', dur: '9s',  size: 2, c: 'rgba(255,171,0,0.55)' },
  { left: '8%',  top: '68%', delay: '8s',   dur: '11s', size: 2, c: 'rgba(0,200,83,0.45)'  },
  { left: '50%', top: '71%', delay: '5.5s', dur: '14s', size: 2, c: 'rgba(255,171,0,0.45)' },
  { left: '88%', top: '66%', delay: '9s',   dur: '12s', size: 3, c: 'rgba(56,189,248,0.45)' },
]

function AnimatedBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-180px', left: '-180px',
        width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(0,200,83,0.1) 0%, rgba(0,200,83,0.03) 45%, transparent 70%)',
        animation: 'orbFloat1 24s ease-in-out infinite',
        filter: 'blur(60px)', willChange: 'transform',
      }} />
      <div style={{
        position: 'absolute', top: '10%', right: '-200px',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(255,171,0,0.08) 0%, rgba(255,171,0,0.02) 45%, transparent 70%)',
        animation: 'orbFloat2 30s ease-in-out infinite',
        filter: 'blur(55px)', willChange: 'transform',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '28%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(56,189,248,0.07) 0%, rgba(56,189,248,0.02) 45%, transparent 70%)',
        animation: 'orbFloat3 20s ease-in-out infinite',
        filter: 'blur(50px)', willChange: 'transform',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `radial-gradient(circle, rgba(0,200,83,0.15) 1px, transparent 1px)`,
        backgroundSize: '44px 44px', opacity: 0.35,
      }} />
      {[720, 470, 230].map((size, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          border: `1px solid rgba(0,200,83,${0.045 - i * 0.012})`,
        }} />
      ))}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: p.left, top: p.top,
          width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%',
          background: p.c, boxShadow: `0 0 ${p.size * 4}px ${p.c}`,
          animation: `particleRise ${p.dur} ease-in-out infinite ${p.delay}`,
          willChange: 'transform, opacity',
        }} />
      ))}
    </div>
  )
}

// ── Live match widget shown in the hero right panel ───────────────────────────
function LiveHeroWidget({ liveMatches }) {
  if (liveMatches.length === 0) return null

  return (
    <div style={{
      background: 'rgba(10,15,28,0.88)',
      border: '1px solid rgba(255,61,61,0.35)',
      borderRadius: '16px', overflow: 'hidden',
      backdropFilter: 'blur(14px)',
      boxShadow: '0 0 40px rgba(255,61,61,0.1), 0 0 0 1px rgba(255,61,61,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(255,61,61,0.12)',
        borderBottom: '1px solid rgba(255,61,61,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LiveDot />
          <span style={{
            fontFamily: 'var(--font-disp)', fontSize: '14px',
            fontWeight: 800, color: 'var(--red)', letterSpacing: '0.07em',
          }}>
            {liveMatches.length} MATCH{liveMatches.length > 1 ? 'ES' : ''} LIVE NOW
          </span>
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(255,61,61,0.6)', fontWeight: 700, letterSpacing: '0.05em' }}>
          LIVE
        </span>
      </div>

      {/* One row per live match */}
      {liveMatches.map((m, i) => {
        const home   = m.homeTeam?.name || 'TBD'
        const away   = m.awayTeam?.name || 'TBD'
        const homeCrest = m.homeTeam?.crest
        const awayCrest = m.awayTeam?.crest
        const hScore = m.score?.fullTime?.home != null ? m.score.fullTime.home : '–'
        const aScore = m.score?.fullTime?.away != null ? m.score.fullTime.away : '–'
        const group  = m.group?.replace(/^GROUP_/, 'GROUP ') || ''

        return (
          <div key={m.id} style={{
            padding: '14px 16px',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            {/* Group label */}
            {group && (
              <div style={{ fontSize: '10px', color: 'rgba(255,61,61,0.55)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '8px' }}>
                {group}
              </div>
            )}

            {/* Teams + score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px' }}>
              {/* Home */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                {homeCrest
                  ? <img src={homeCrest} alt={home} style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                  : <span style={{ fontSize: '22px' }}>🏴</span>
                }
                <span style={{ fontSize: '12px', fontWeight: 700, textAlign: 'right', color: 'var(--text)', lineHeight: 1.2 }}>
                  {home}
                </span>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'center', minWidth: '64px' }}>
                <div style={{
                  fontFamily: 'var(--font-disp)', fontSize: '32px', fontWeight: 900,
                  color: 'var(--red)', lineHeight: 1, letterSpacing: '2px',
                  textShadow: '0 0 20px rgba(255,61,61,0.4)',
                }}>
                  {hScore}<span style={{ color: 'rgba(255,61,61,0.4)', margin: '0 2px', fontSize: '22px' }}>–</span>{aScore}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,61,61,0.6)', fontWeight: 700, letterSpacing: '0.06em', marginTop: '2px' }}>
                  IN PLAY
                </div>
              </div>

              {/* Away */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                {awayCrest
                  ? <img src={awayCrest} alt={away} style={{ width: '32px', height: '32px', objectFit: 'contain' }} onError={e => e.target.style.display='none'} />
                  : <span style={{ fontSize: '22px' }}>🏴</span>
                }
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                  {away}
                </span>
              </div>
            </div>

            {/* Watch Live */}
            <a
              href={WATCH_LINK} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '12px', padding: '8px',
                background: 'var(--red)', borderRadius: '8px',
                color: '#fff', fontWeight: 800, fontSize: '11px', letterSpacing: '0.07em',
                textDecoration: 'none', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <LiveDot /> WATCH LIVE
            </a>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState('standings')
  const [liveMatches, setLiveMatches] = useState([])

  // Always-on live match poller for the hero widget
  useEffect(() => {
    async function fetchLive() {
      try {
        const json = await fetchMatches('IN_PLAY,PAUSED')
        setLiveMatches(json.matches || [])
      } catch {}
    }
    fetchLive()
    const t = setInterval(fetchLive, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <header style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(170deg, rgba(5,18,31,0.97) 0%, rgba(7,14,26,0.96) 60%, rgba(5,8,15,0.92) 100%)',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0',
      }}>
        {/* Pitch lines decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(105deg, transparent, transparent 60px, rgba(0,200,83,0.03) 60px, rgba(0,200,83,0.03) 61px)`,
        }} />
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,83,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,171,0,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 0' }}>

          {/* ── Two-column layout: left = title/stats, right = live widget ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: liveMatches.length > 0 ? '1fr 320px' : '1fr',
            gap: '36px',
            alignItems: 'center',
            marginBottom: '32px',
          }}>

            {/* Left column */}
            <div>
              <div style={{
                fontFamily: 'var(--font-disp)',
                fontSize: '13px', letterSpacing: '4px', fontWeight: 700,
                color: 'var(--green)', marginBottom: '10px', textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(0,200,83,0.5)',
              }}>
                ⚽ &nbsp; USA · Canada · Mexico &nbsp; ⚽
              </div>

              <h1 style={{
                fontFamily: 'var(--font-disp)',
                fontSize: 'clamp(40px, 7vw, 80px)',
                fontWeight: 900, lineHeight: 0.95,
                letterSpacing: '-1px', color: '#fff',
                marginBottom: '16px',
                textShadow: '0 0 80px rgba(0,200,83,0.12)',
              }}>
                FIFA<br />
                <span style={{
                  background: 'linear-gradient(90deg, var(--green) 0%, #69f0ae 50%, #00e676 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 18px rgba(0,200,83,0.45))',
                }}>WORLD CUP</span><br />
                <span style={{ color: 'var(--amber)', textShadow: '0 0 40px rgba(255,171,0,0.4), 0 0 80px rgba(255,171,0,0.15)' }}>
                  2026
                </span>
              </h1>

              <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '24px', letterSpacing: '0.02em' }}>
                June 11 – July 19 &nbsp;·&nbsp; 48 Teams &nbsp;·&nbsp; 12 Groups &nbsp;·&nbsp; 104 Matches
              </p>

              {/* Stats strip */}
              <div style={{
                display: 'flex', gap: '0',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '14px', overflow: 'hidden',
                maxWidth: '440px',
                boxShadow: '0 0 40px rgba(0,200,83,0.06)',
              }}>
                {[['48','Teams'],['12','Groups'],['104','Matches'],['3','Hosts']].map(([n,l], i, arr) => (
                  <div key={l} style={{
                    flex: 1, textAlign: 'center', padding: '14px 0',
                    borderRight: i < arr.length-1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-disp)', fontSize: '26px', fontWeight: 900,
                      color: 'var(--amber)', lineHeight: 1,
                      textShadow: '0 0 18px rgba(255,171,0,0.35)',
                    }}>{n}</div>
                    <div style={{ fontSize: '10px', color: 'var(--faint)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '3px' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column — live widget (only renders when matches are live) */}
            {liveMatches.length > 0 && (
              <div>
                <LiveHeroWidget liveMatches={liveMatches} />
              </div>
            )}
          </div>

          {/* Tabs — full width */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
            {[['standings','📊  Standings'],['matches','⚽  Matches']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                fontFamily: 'var(--font-disp)',
                fontSize: '17px', fontWeight: 700, letterSpacing: '0.03em',
                padding: '12px 28px', border: 'none', background: 'transparent', cursor: 'pointer',
                color: tab === id ? 'var(--green)' : 'var(--muted)',
                borderBottom: tab === id ? '3px solid var(--green)' : '3px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s, border-color 0.15s',
                textShadow: tab === id ? '0 0 20px rgba(0,200,83,0.5)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px 80px' }}>
        {tab === 'standings' && <Standings />}
        {tab === 'matches'   && <Matches />}
      </main>

      <footer style={{ textAlign: 'center', padding: '0 0 28px', color: 'var(--faint)', fontSize: '11px', letterSpacing: '0.05em' }}>
        Created by Ismail Opu
      </footer>
    </div>
  )
}
