'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Timer, X, Minus, Plus, Hash, Radar, RefreshCw, Layers, ArrowUp, ArrowDown, Scale } from 'lucide-react'
import { CocoPageShell } from '@/components/coco/coco-page-shell'
import { AuthGuard } from '@/components/auth-guard'
import { PairFlags } from '@/components/pair-flags'
import {
  AnalyzingStage,
  BrokerBar,
  DirTag,
  MarketSections,
  PrimaryButton,
  SearchBox,
  SegTabs,
  formatTime,
  useBroker,
  useMarketFilter,
  type Direction,
} from '@/components/signal-kit'
import { otcMarkets, realMarkets, marketLabel, type Market, type MarketType } from '@/lib/markets'
import type { Broker } from '@/lib/brokers'
import { useGatedAction } from '@/hooks/use-gated-action'

type Phase = 'build' | 'analyzing' | 'result'

type Signal = {
  market: Market
  entry: Date
  direction: Direction
}

const ANALYZING_MS = 10_000
const LINES = [
  'Booting neural core',
  'Syncing candle streams',
  'Calibrating volatility model',
  'Mapping support & resistance',
  'Optimizing entry windows',
]
const PRESETS = [5, 10, 15, 20]
const MIN = 5
const MAX = 20

export function FutureSignalsView() {
  return (
    <AuthGuard>
      {() => (
        <CocoPageShell testid="future-signals-page" width="max-w-3xl">
          <FutureStudio />
        </CocoPageShell>
      )}
    </AuthGuard>
  )
}

function FutureStudio() {
  const { preflight, handleServerGate } = useGatedAction('future-signals')
  const [broker, setBroker] = useBroker()
  const [phase, setPhase] = useState<Phase>('build')
  const [tab, setTab] = useState<MarketType>('otc')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, Market>>({})
  const [count, setCount] = useState(5)
  const [signals, setSignals] = useState<Signal[]>([])
  const [busy, setBusy] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const topRef = useRef<HTMLDivElement | null>(null)

  const selectedList = useMemo(() => Object.values(selected), [selected])
  const lockedType = selectedList[0]?.type ?? null
  const filtered = useMarketFilter(tab === 'otc' ? otcMarkets : realMarkets, query)

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function scrollTop() {
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function toggle(m: Market) {
    if (lockedType && lockedType !== m.type) return
    setSelected((prev) => {
      const next = { ...prev }
      if (next[m.id]) delete next[m.id]
      else next[m.id] = m
      return next
    })
  }

  function clearAll() {
    setSelected({})
  }

  function reset() {
    setSignals([])
    setPhase('build')
    scrollTop()
  }

  async function generate() {
    if (selectedList.length === 0 || busy) return
    setBusy(true)
    try {
      const gate = await preflight(count)
      if (!gate.allowed) return

      const res = await fetch('/api/signals/future', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${gate.token}` },
        body: JSON.stringify({ count }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        handleServerGate(res.status, body)
        return
      }
      const data = (await res.json()) as { picks: { direction: Direction; offsetMin: number }[] }

      const base = Date.now()
      let cumulative = 0
      const queue: Signal[] = data.picks.map((pick, i) => {
        cumulative += pick.offsetMin
        return {
          market: selectedList[i % selectedList.length],
          entry: new Date(base + cumulative * 60_000),
          direction: pick.direction,
        }
      })

      setPhase('analyzing')
      scrollTop()
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setSignals(queue)
        setPhase('result')
      }, ANALYZING_MS)
    } catch {
      /* network failure: stay on build */
    } finally {
      setBusy(false)
    }
  }

  const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n))

  return (
    <div ref={topRef} className="inj flex flex-1 scroll-mt-24 flex-col gap-4 sm:gap-5" data-testid="future-studio">
      <BrokerBar broker={broker} onChange={setBroker} />

      {phase === 'build' && (
        <>
          <section className="inj-panel coco-rise" style={{ '--d': '80ms' } as React.CSSProperties} data-testid="future-build-step">
            <SegTabs tab={tab} onTab={setTab} lockedTo={lockedType} testidPrefix="future" />
            <SearchBox value={query} onChange={setQuery} testid="future-search" />

            {lockedType && lockedType !== tab && (
              <p className="fs-lock" data-testid="future-lock-hint">
                {lockedType === 'otc' ? 'OTC Market' : 'Real Market'} is locked for this queue · clear the selection to switch.
              </p>
            )}

            <MarketSections
              markets={filtered}
              query={query}
              onPick={toggle}
              isSelected={(m) => Boolean(selected[m.id])}
              isDisabled={(m) => Boolean(lockedType && lockedType !== m.type)}
              testidPrefix="future"
              variant="ticket"
            />
          </section>

          {selectedList.length > 0 && (
          <section className="inj-panel fs-setup coco-rise" style={{ '--d': '140ms' } as React.CSSProperties} data-testid="future-setup">
            <div className="fs-setup-grid">
              <div className="fs-setup-col">
                <header className="fs-setup-head">
                  <span className="inj-stat-icon">
                    <Layers className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="fs-setup-title">Selected markets</p>
                    <p className="fs-count-sub">Tap a pair above to add or remove it</p>
                  </div>
                  <span className="fs-setup-badge coco-mono" data-testid="future-selected-count">
                    {selectedList.length}
                  </span>
                </header>
                <SelectedRow list={selectedList} onRemove={toggle} onClear={clearAll} />
              </div>

              <div className="fs-setup-col" data-testid="future-count">
                <header className="fs-setup-head">
                  <span className="inj-stat-icon">
                    <Hash className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="fs-setup-title">How many signals?</p>
                    <p className="fs-count-sub">Tap the number to edit · min {MIN} · max {MAX}</p>
                  </div>
                </header>
                <div className="fs-count-controls">
                  <div className="fs-presets">
                    {PRESETS.map((p) => (
                      <button key={p} type="button" onClick={() => setCount(p)} className="fs-preset" data-on={count === p} data-testid={`future-preset-${p}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="fs-stepper">
                    <button type="button" onClick={() => setCount(clamp(count - 1))} disabled={count <= MIN} aria-label="Decrease signal count" data-testid="future-count-minus">
                      <Minus className="h-4 w-4" />
                    </button>
                    <CountField value={count} onCommit={(v) => setCount(clamp(v))} />
                    <button type="button" onClick={() => setCount(clamp(count + 1))} disabled={count >= MAX} aria-label="Increase signal count" data-testid="future-count-plus">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
          )}

          <div className="fs-dock" data-testid="future-dock">
            <div className="fs-dock-sum">
              {selectedList.length > 0 ? (
                <>
                  <span className="fs-flag-stack" aria-hidden="true">
                    {selectedList.slice(0, 3).map((m) => (
                      <PairFlags key={m.id} base={m.base} quote={m.quote} size={18} />
                    ))}
                    {selectedList.length > 3 && <span className="fs-flag-more">+{selectedList.length - 3}</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="fs-dock-title" data-testid="future-dock-summary">
                      {selectedList.length} pair{selectedList.length > 1 ? 's' : ''} · {count} signal{count > 1 ? 's' : ''}
                    </span>
                    <span className="fs-dock-sub">{lockedType === 'otc' ? 'OTC Market' : 'Real Market'} · {broker.name}</span>
                  </span>
                </>
              ) : (
                <span className="min-w-0">
                  <span className="fs-dock-title" data-testid="future-dock-summary">
                    No markets yet
                  </span>
                  <span className="fs-dock-sub">Pick at least one pair to build a queue</span>
                </span>
              )}
            </div>
            <PrimaryButton onClick={generate} disabled={selectedList.length === 0 || busy} icon={Radar} testid="future-generate-button">
              {busy ? 'Preparing…' : `Generate ${count} Signal${count > 1 ? 's' : ''}`}
            </PrimaryButton>
          </div>
          <div className="h-16 md:hidden" aria-hidden="true" />
        </>
      )}

      {phase === 'analyzing' && (
        <section className="inj-panel coco-rise" style={{ '--d': '40ms' } as React.CSSProperties}>
          <QueueHeader list={selectedList} count={count} />
          <div className="inj-divider" />
          <AnalyzingStage lines={LINES} durationMs={ANALYZING_MS} testid="future-analyzing" />
        </section>
      )}

      {phase === 'result' && <FutureResults signals={signals} broker={broker} markets={selectedList} onReset={reset} />}
    </div>
  )
}

function CountField({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  function commit() {
    if (draft !== null) {
      const v = Number.parseInt(draft, 10)
      if (!Number.isNaN(v)) onCommit(v)
    }
    setDraft(null)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft ?? String(value)}
      onFocus={(e) => {
        setDraft(String(value))
        e.currentTarget.select()
      }}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur()
      }}
      aria-label="Signal count"
      data-testid="future-count-input"
    />
  )
}

function QueueHeader({ list, count }: { list: Market[]; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inj-stat-icon">
        <Layers className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="coco-sub text-[17px] leading-tight text-white sm:text-lg">
          {count} signal{count > 1 ? 's' : ''} · {list.length} market{list.length > 1 ? 's' : ''}
        </p>
        <p className="inj-kicker">{list[0]?.type === 'otc' ? 'OTC Market' : 'Real Market'} · Future queue</p>
      </div>
      <div className="fs-flag-stack" aria-hidden="true">
        {list.slice(0, 4).map((m) => (
          <PairFlags key={m.id} base={m.base} quote={m.quote} size={18} />
        ))}
        {list.length > 4 && <span className="fs-flag-more">+{list.length - 4}</span>}
      </div>
    </div>
  )
}

function SelectedRow({ list, onRemove, onClear }: { list: Market[]; onRemove: (m: Market) => void; onClear: () => void }) {
  if (list.length === 0) {
    return (
      <p className="fs-selected-empty" data-testid="future-selected-empty">
        No pairs selected yet — your queue will appear here.
      </p>
    )
  }
  return (
    <div className="fs-selected" data-testid="future-selected">
      <div className="fs-chips">
        {list.map((m) => (
          <span key={m.id} className="fs-chip" data-testid={`future-chip-${m.base}${m.quote}`}>
            <PairFlags base={m.base} quote={m.quote} size={14} />
            <span className="truncate">{marketLabel(m)}</span>
            <button type="button" onClick={() => onRemove(m)} aria-label={`Remove ${marketLabel(m)}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <button type="button" onClick={onClear} className="fs-clear" data-testid="future-clear-selected">
        <X className="h-3 w-3" />
        Clear all
      </button>
    </div>
  )
}

function FutureResults({ signals, broker, markets, onReset }: { signals: Signal[]; broker: Broker; markets: Market[]; onReset: () => void }) {
  const ups = signals.filter((s) => s.direction === 'UP').length
  return (
    <div className="flex flex-col gap-4" data-testid="future-result">
      <section className="inj-panel coco-rise" style={{ '--d': '40ms' } as React.CSSProperties}>
        <QueueHeader list={markets} count={signals.length} />
        <div className="fsx-brokerrow">
          <span className="fs-mix" data-testid="future-mix">
            <i data-tone="up">
              <ArrowUp className="h-3 w-3" strokeWidth={3} />
              {ups}
            </i>
            <i data-tone="down">
              <ArrowDown className="h-3 w-3" strokeWidth={3} />
              {signals.length - ups}
            </i>
          </span>
        </div>
        <div className="inj-divider" />

        <ol className="fs-list">
          {signals.map((s, i) => (
            <li
              key={`${s.market.id}-${i}`}
              className="fsx"
              data-tone={s.direction === 'UP' ? 'up' : 'down'}
              style={{ '--d': `${80 + i * 60}ms` } as React.CSSProperties}
              data-testid={`future-signal-${i}`}
            >
              <div className="fsx-top">
                <span className="fsx-idx coco-mono">{String(i + 1).padStart(2, '0')}</span>
                <PairFlags base={s.market.base} quote={s.market.quote} size={24} />
                <div className="fsx-id">
                  <p className="fsx-pair">{marketLabel(s.market)}</p>
                  <p className="fsx-broker">{broker.name}</p>
                </div>
                <DirTag direction={s.direction} testid={`future-signal-${i}-direction`} size="sm" />
              </div>
              <div className="fsx-meta">
                <span className="fsx-cell" data-testid={`future-signal-${i}-entry`}>
                  <Clock className="h-3.5 w-3.5" />
                  <b>{formatTime(s.entry)}</b>
                  <em>entry</em>
                </span>
                <span className="fsx-cell">
                  <Timer className="h-3.5 w-3.5" />
                  <b>1 Min</b>
                  <em>expiry</em>
                </span>
                <span className="fsx-cell">
                  <Scale className="h-3.5 w-3.5" />
                  <b>1 Step</b>
                  <em>MTG</em>
                </span>
              </div>
              <span className="fsx-bar" aria-hidden="true">
                <i />
              </span>
            </li>
          ))}
        </ol>
      </section>

      <PrimaryButton onClick={onReset} icon={RefreshCw} testid="future-reset-button" delay="140ms">
        Build New Queue
      </PrimaryButton>
    </div>
  )
}
