import { useState } from 'react'
import Standings from './Standings.jsx'
import Matches from './Matches.jsx'

export default function App() {
  const [tab, setTab] = useState('standings')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <header style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(170deg, #05121f 0%, #070e1a 60%, var(--bg) 100%)',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0',
      }}>
        {/* Pitch lines decoration */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            repeating-linear-gradient(
              105deg,
              transparent,
              transparent 60px,
              rgba(0,200,83,0.03) 60px,
              rgba(0,200,83,0.03) 61px
            )`,
        }} />
        {/* Green glow top-left */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,83,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 0' }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily: 'var(--font-disp)',
            fontSize: '13px', letterSpacing: '4px', fontWeight: 700,
            color: 'var(--green)', marginBottom: '10px', textTransform: 'uppercase',
          }}>
            ⚽ &nbsp; USA · Canada · Mexico &nbsp; ⚽
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-disp)',
            fontSize: 'clamp(40px, 7vw, 80px)',
            fontWeight: 900, lineHeight: 0.95,
            letterSpacing: '-1px',
            color: '#fff',
            marginBottom: '16px',
          }}>
            FIFA<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--green) 0%, #69f0ae 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              WORLD CUP
            </span><br />
            <span style={{ color: 'var(--amber)' }}>2026</span>
          </h1>

          {/* Sub */}
          <p style={{ color: 'var(--muted)', fontSize: '15px', marginBottom: '32px', letterSpacing: '0.02em' }}>
            June 11 – July 19 &nbsp;·&nbsp; 48 Teams &nbsp;·&nbsp; 12 Groups &nbsp;·&nbsp; 104 Matches
          </p>

          {/* Stats strip */}
          <div style={{
            display: 'flex', gap: '0', marginBottom: '32px',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '14px', overflow: 'hidden',
            maxWidth: '520px',
          }}>
            {[['48','Teams'],['12','Groups'],['104','Matches'],['3','Hosts']].map(([n,l], i, arr) => (
              <div key={l} style={{
                flex: 1, textAlign: 'center', padding: '16px 0',
                borderRight: i < arr.length-1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  fontFamily: 'var(--font-disp)',
                  fontSize: '28px', fontWeight: 900,
                  color: 'var(--amber)', lineHeight: 1,
                }}>{n}</div>
                <div style={{ fontSize: '11px', color: 'var(--faint)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '3px' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)' }}>
            {[['standings','📊  Standings'],['matches','⚽  Matches']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                fontFamily: 'var(--font-disp)',
                fontSize: '17px', fontWeight: 700, letterSpacing: '0.03em',
                padding: '12px 28px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: tab === id ? 'var(--green)' : 'var(--muted)',
                borderBottom: tab === id ? '3px solid var(--green)' : '3px solid transparent',
                marginBottom: '-1px',
                transition: 'color 0.15s, border-color 0.15s',
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

      <footer style={{ textAlign: 'center', padding: '0 0 28px', color: 'var(--faint)', fontSize: '14px', letterSpacing: '0.05em' }}>
        Created by Ismail Opu
      </footer>
    </div>
  )
}
