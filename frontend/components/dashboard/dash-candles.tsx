type Candle = { x: number; open: number; close: number; high: number; low: number }

const W = 1200
const H = 260
const STEP = 34

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function build(): Candle[] {
  const rnd = seeded(7)
  const out: Candle[] = []
  let price = 170
  for (let i = 0; i < W / STEP; i++) {
    const drift = (rnd() - 0.42) * 26
    const open = price
    const close = Math.min(232, Math.max(38, open + drift))
    const high = Math.max(open, close) + rnd() * 12 + 3
    const low = Math.min(open, close) - rnd() * 12 - 3
    out.push({ x: i * STEP + 12, open, close, high, low })
    price = close
  }
  return out
}

const CANDLES = build()
const PATH = CANDLES.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x + 8} ${(c.open + c.close) / 2}`).join(' ')

export function DashCandles() {
  return (
    <svg className="dsh-candles" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="dshLine" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#8b5cff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#c4a6ff" />
          <stop offset="1" stopColor="#8b5cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dshFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.15" />
        </linearGradient>
        <mask id="dshMask">
          <rect width={W} height={H} fill="url(#dshFade)" />
        </mask>
      </defs>
      <g className="dsh-candles-grid" stroke="rgba(196,166,255,0.1)" strokeWidth="1">
        {[52, 104, 156, 208].map((y) => (
          <line key={y} x1="0" x2={W} y1={y} y2={y} strokeDasharray="3 9" />
        ))}
      </g>
      <g mask="url(#dshMask)">
        {CANDLES.map((c) => {
          const up = c.close >= c.open
          const color = up ? '#4ade80' : '#fb7185'
          const top = Math.min(c.open, c.close)
          const h = Math.max(2.5, Math.abs(c.close - c.open))
          return (
            <g key={c.x} stroke={color} fill={up ? color : '#1a0f3d'}>
              <line x1={c.x + 8} x2={c.x + 8} y1={c.high} y2={c.low} strokeWidth="1.4" />
              <rect x={c.x} y={top} width="16" height={h} rx="2.5" strokeWidth="1.4" />
            </g>
          )
        })}
      </g>
      <path d={PATH} fill="none" stroke="url(#dshLine)" strokeWidth="1.6" className="dsh-candles-line" />
    </svg>
  )
}
