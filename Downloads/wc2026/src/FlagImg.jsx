export function FlagImg({ name, size = 28 }) {
  const url = getFlagUrl(name, 40)
  if (!url) return <span style={{ fontSize: size * 0.8 + 'px' }}>🏳️</span>
  return (
    <img
      src={url}
      alt={name}
      width={size * 1.5}
      height={size}
      style={{ objectFit: 'cover', borderRadius: '3px', display: 'block', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

import { COUNTRY_CODE } from './utils.js'
function getFlagUrl(name, size = 32) {
  if (!name) return null
  let code = COUNTRY_CODE[name]
  if (!code) {
    const lower = name.toLowerCase()
    for (const [k, v] of Object.entries(COUNTRY_CODE)) {
      if (lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower)) {
        code = v; break
      }
    }
  }
  if (!code) return null
  return `https://flagcdn.com/h${size}/${code}.png`
}
