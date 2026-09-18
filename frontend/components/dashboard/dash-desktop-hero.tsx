'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ArrowRight, BadgeCheck, Check, Copy, KeyRound, LayoutGrid, Mail } from 'lucide-react'
import { useAuth, type UserProfile } from '@/components/auth-provider'
import { CocoHeroBg } from '@/components/coco/coco-hero-bg'
import { GlyphTier, GlyphClockRing } from '@/components/dashboard/dash-glyphs'
import { FEATURES, TIER_LABEL } from '@/lib/tiers'

export function DashDesktopHero({
  profile,
  onOpenTools,
  onProfile,
}: {
  profile: UserProfile
  onOpenTools: () => void
  onProfile: () => void
}) {
  const { tier, hasAccess, isUnlimited, limit, usage } = useAuth()
  const [copied, setCopied] = useState(false)
  const usedToday = FEATURES.reduce((s, f) => s + (usage[f] || 0), 0)
  const verified = tier !== 'free'

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {}
  }

  return (
    <section className="dsh-hero hidden md:block" data-testid="dash-desktop-hero">
      <div className="dsh-hero-banner">
        <CocoHeroBg />
        <span className="dsh-hero-ring" aria-hidden="true" />
        <Image
          src="/dash/mascot.webp"
          alt="Coco AI mascot"
          width={525}
          height={900}
          className="dsh-hero-mascot"
          priority
          sizes="300px"
        />
        <div className="dsh-hero-copy">
          <span className="coco-eyebrow">
            <GlyphTier className="h-3 w-3" />
            Operator console
          </span>
          <h1 className="coco-display coco-title-gradient mt-4 text-[2.1rem] leading-[1.05] lg:text-[2.6rem]">
            Welcome back,
            <br />
            {profile.name.split(' ')[0] || 'Trader'}.
          </h1>
          <p className="mt-3 max-w-[44ch] text-[13.5px] leading-relaxed text-white/60">
            Your engine is synced and reading OTC and real market charts. Open a desk and let Coco call it.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={onOpenTools} className="coco-btn coco-btn-primary" data-testid="desktop-open-tools-btn">
              <LayoutGrid className="h-4 w-4" />
              Open tools
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="https://t.me/Ayan_Dead" target="_blank" rel="noopener noreferrer" className="coco-btn coco-btn-ghost" data-testid="desktop-upgrade-link">
              <KeyRound className="h-4 w-4" />
              {hasAccess ? 'Upgrade licence' : 'Unlock access'}
            </a>
          </div>
        </div>
      </div>

      <div className="dsh-hero-strip">
        <button type="button" onClick={onProfile} className="dsh-hero-avatar" aria-label="Open profile card" data-testid="desktop-avatar-btn">
          <Image src="/coco-profile.png" alt={profile.name} width={112} height={112} className="h-full w-full rounded-[22px] object-cover" />
        </button>

        <div className="dsh-hero-ident">
          <p className="flex items-center gap-2 text-[19px] font-semibold leading-tight text-white" data-testid="desktop-hero-name">
            <span className="truncate">{profile.name}</span>
            {verified && <BadgeCheck className="h-[18px] w-[18px] flex-none text-[#b48cff]" data-testid="desktop-verified-icon" />}
            <span className="dsh-tier-chip" data-testid="desktop-hero-tier">{TIER_LABEL[tier]}</span>
          </p>
          <button type="button" onClick={copyEmail} className="dsh-hero-email" data-testid="desktop-copy-email">
            <Mail className="h-3.5 w-3.5 text-[#c4a6ff]" />
            <span className="truncate">{profile.email}</span>
            {copied ? <Check className="h-3.5 w-3.5 text-[#8ef0c4]" /> : <Copy className="h-3.5 w-3.5 text-white/45" />}
          </button>
        </div>

        <dl className="dsh-hero-stats">
          <Stat label="Plan" value={TIER_LABEL[tier]} />
          <Stat label="Daily limit" value={!hasAccess ? 'Locked' : isUnlimited ? '∞' : `${limit} / tool`} />
          <Stat label="Used today" value={hasAccess ? String(usedToday) : '0'} />
          <Stat label="Resets" value="6:00 AM" icon={<GlyphClockRing className="h-3.5 w-3.5 text-[#c4a6ff]" />} />
        </dl>
      </div>
    </section>
  )
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="dsh-hero-stat">
      <dt className="coco-mono text-[9px] uppercase tracking-[0.16em] text-white/40">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-[17px] font-semibold text-white">
        {icon}
        {value}
      </dd>
    </div>
  )
}
