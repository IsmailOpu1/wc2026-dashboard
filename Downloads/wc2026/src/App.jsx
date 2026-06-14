import { useState } from 'react'
import Standings from './Standings.jsx'
import Matches from './Matches.jsx'

// Pre-computed particle positions — never use Math.random() in render
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

      {/* ── Large floating color orbs ── */}
      {/* Green orb — top-left */}
      <div style={{
        position: 'absolute', top: '-180px', left: '-180px',
        width: '800px', height: '800px', borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(0,200,83,0.1) 0%, rgba(0,200,83,0.03) 45%, transparent 70%)',
        animation: 'orbFloat1 24s ease-in-out infinite',
        filter: 'blur(60px)',
        willChange: 'transform',
      }} />
      {/* Amber orb — right */}
      <div style={{
        position: 'absolute', top: '10%', right: '-200px',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(255,171,0,0.08) 0%, rgba(255,171,0,0.02) 45%, transparent 70%)',
        animation: 'orbFloat2 30s ease-in-out infinite',
        filter: 'blur(55px)',
        willChange: 'transform',
      }} />
      {/* Cyan orb — bottom-center */}
      <div style={{
        position: 'absolute', bottom: '-100px', left: '28%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle at center, rgba(56,189,248,0.07) 0%, rgba(56,189,248,0.02) 45%, transparent 70%)',
        animation: 'orbFloat3 20s ease-in-out infinite',
        filter: 'blur(50px)',
        willChange: 'transform',
      }} />

      {/* ── Subtle dot grid ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(circle, rgba(0,200,83,0.15) 1px, transparent 1px)
        `,
        backgroundSize: '44px 44px',
        opacity: 0.35,
      }} />

      {/* ── Stadium center-circle decorative rings ── */}
      {[720, 470, 230].map((size, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          border: `1px solid rgba(0,200,83,${0.045 - i * 0.012})`,
        }} />
      ))}

      {/* ── Rising particles ── */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p.left,
          top: p.top,
          width: `${p.size}px`,
          height: `${p.size}px`,
          borderRadius: '50%',
          background: p.c,
          boxShadow: `0 0 ${p.size * 4}px ${p.c}`,
          animation: `particleRise ${p.dur} ease-in-out infinite ${p.delay}`,
          willChange: 'transform, opacity',
        }} />
      ))}
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState('standings')

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AnimatedBackground />

      {/* ── HERO HEADER ─────────────────────────────────── */}
      <header style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(170deg, rgba(5,18,31,0.97) 0%, rgba(7,14,26,0.96) 60%, rgba(5,8,15,0.92) 100%)',
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
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,83,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Amber glow top-right */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '350px', height: '350px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,171,0,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 0' }}>

          {/* Eyebrow */}
          <div style={{
            fontFamily: 'var(--font-disp)',
            fontSize: '13px', letterSpacing: '4px', fontWeight: 700,
            color: 'var(--green)', marginBottom: '10px', textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(0,200,83,0.5)',
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
            textShadow: '0 0 80px rgba(0,200,83,0.12)',
          }}>
            FIFA<br />
            <span style={{
              background: 'linear-gradient(90deg, var(--green) 0%, #69f0ae 50%, #00e676 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 18px rgba(0,200,83,0.45))',
            }}>
              WORLD CUP
            </span><br />
            <span style={{
              color: 'var(--amber)',
              textShadow: '0 0 40px rgba(255,171,0,0.4), 0 0 80px rgba(255,171,0,0.15)',
            }}>2026</span>
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
            boxShadow: '0 0 40px rgba(0,200,83,0.06)',
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
                  textShadow: '0 0 18px rgba(255,171,0,0.35)',
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
                transition: 'color 0.15s, border-color 0.15s, text-shadow 0.15s',
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
