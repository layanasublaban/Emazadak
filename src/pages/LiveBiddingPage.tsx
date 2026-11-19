import { useEffect, useRef, useState } from 'react'
import { auctions, formatMoney, type Auction } from '@/data/auctions'
import { CountdownTimer } from '@/components/CountdownTimer'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { PropertyImage } from '@/components/PropertyImage'
import { LiveDot } from '@/components/LiveDot'
import { useI18n } from '@/lib/i18n'
import { Link, navigate } from '@/lib/router'
import { useAuth } from '@/lib/auth'
import { fetchBids, placeBid as bidNow } from '@/lib/actions'

interface Activity {
  id: number
  auctionId: string
  amount: number
  bidder: string
  at: number
  mine?: boolean
}

/** Live bidding room backed by the server: bids, counts and the activity feed come from the API (polled). */
export default function LiveBiddingPage({ route }: { route: string }) {
  const { loggedIn, user, refresh } = useAuth()
  const { t, auction } = useI18n()
  const liveOnes = auctions.filter((a) => a.status === 'live' || a.status === 'ending-soon').slice(0, 12)
  const [feed, setFeed] = useState<Activity[]>([])
  const [flash, setFlash] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'ending'>('all')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const seen = useRef<Record<string, number>>({})
  const ids = liveOnes.slice(0, 6).map((a) => a.id).join(',')
  const sig = liveOnes.map((a) => `${a.id}:${a.currentBid}`).join(',')

  // Flash a card when its price changes on the server
  useEffect(() => {
    for (const a of liveOnes) {
      const prev = seen.current[a.id]
      if (prev !== undefined && prev !== a.currentBid) {
        setFlash(a.id)
        setTimeout(() => setFlash((x) => (x === a.id ? null : x)), 1200)
      }
      seen.current[a.id] = a.currentBid
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  // Activity feed: latest bids across the top live auctions
  useEffect(() => {
    let stop = false
    const load = async () => {
      const all = await Promise.all(ids.split(',').filter(Boolean).map(async (id) => (await fetchBids(id)).slice(0, 5).map((b) => ({ id: b.id, auctionId: id, amount: b.amount, bidder: b.bidder, at: b.at, mine: !!user && b.userId === user.id }))))
      if (!stop) setFeed(all.flat().sort((x, y) => y.at - x.at).slice(0, 12))
    }
    void load()
    const t = setInterval(() => { if (!document.hidden) void load() }, 8000)
    return () => { stop = true; clearInterval(t) }
  }, [ids, user])

  const placeBid = async (a: Auction) => {
    if (!loggedIn) return navigate(`/signin?next=${encodeURIComponent(route)}`)
    setBusy(a.id)
    const amount = a.currentBid + a.minBidIncrement
    const r = await bidNow(a.id, amount)
    setNotice(r.ok ? t('Your bid of {amount} JOD was placed on {title}.', { amount: formatMoney(amount), title: auction(a).title })
      : r.code === 'deposit_required' ? t('Deposit is required to bid')
      : r.code === 'not_verified' ? t('Your account must be verified before you can bid.')
      : r.error)
    await refresh()
    setBusy(null)
  }

  const list = liveOnes.filter((a) => filter === 'all' || a.status === 'ending-soon')

  return (
    <div className="min-h-screen bg-page">
      <Navbar active={route} />
      <PageHeader title="Live Bidding" subtitle="Auctions running right now. Bids update in real time – place yours before the countdown ends.">
        <div role="tablist" className="flex gap-2">
          {([['all', 'All live auctions'], ['ending', 'Ending soon']] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} type="button" onClick={() => setFilter(k)}
              className={`rounded-md border px-3 py-2 text-sm sm:px-4 ${filter === k ? 'border-brand bg-brand font-semibold text-white' : 'border-brand-400 text-brand-600 hover:bg-brand-50'}`}>
              {t(l)}
            </button>
          ))}
        </div>
      </PageHeader>

      <main className="mx-auto mt-6 grid max-w-[1356px] gap-5 px-4 sm:mt-8 sm:gap-6 sm:px-[41px] lg:grid-cols-[1fr_340px]">
        <section aria-live="polite">
          {notice && <p role="status" className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand">{notice}</p>}
          <div className="grid gap-5 md:grid-cols-2">
            {list.map((a) => {
              const l = auction(a)
              return (
              <article key={a.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow ${flash === a.id ? 'border-gold shadow-[0_0_0_3px_rgba(212,160,65,0.35)]' : 'border-black/5'}`}>
                <div className="relative">
                  <PropertyImage src={a.image} alt={l.title} className="h-[170px] w-full" />
                  <span className="live-glow absolute top-3 start-3 flex items-center gap-1.5 rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">
                    <LiveDot className="text-white" size={6} /> {t('LIVE')}
                  </span>
                  <span className="absolute top-3 end-3 rounded bg-white/90 px-2 py-1 text-[10px] font-medium text-brand">{t('{n} bids', { n: a.bids })}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-ink">{l.title}</h3>
                  <p className="mt-1 text-xs text-muted">{l.type} · <bdi>{a.landSize} m²</bdi></p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-muted">{t('Current Bid')}</p>
                      <p className={`text-[22px] font-semibold text-brand transition-transform ${flash === a.id ? 'scale-105' : ''}`}>
                        {formatMoney(a.currentBid)} <span className="text-xs font-light text-icon">JOD</span>
                      </p>
                    </div>
                    <CountdownTimer endsAt={a.endsAt} />
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                    <button type="button" disabled={busy === a.id} onClick={() => placeBid(a)} className="btn-shine rounded-lg bg-brand py-2.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700">
                      {t('Bid')} <bdi>+{formatMoney(a.minBidIncrement)} JOD</bdi>
                    </button>
                    <Link to={`/auctions/${a.id}`} className="rounded-lg border border-brand px-4 py-2.5 text-xs font-semibold text-brand hover:bg-brand-50">{t('Details')}</Link>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-black/5 bg-white p-5 shadow-sm lg:sticky lg:top-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><LiveDot size={8} /> {t('Live activity')}</h2>
          {feed.length === 0 ? (
            <p className="mt-4 text-sm text-muted">{t('Waiting for the next bid…')}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {feed.map((f) => (
                <li key={f.id} className={`animate-pop-in rounded-lg px-3 py-2.5 text-xs ${f.mine ? 'bg-gold-50' : 'bg-brand-50'}`}>
                  <p className="font-semibold text-ink">{f.mine ? t('You') : f.bidder} · <bdi>{formatMoney(f.amount)} JOD</bdi></p>
                  <p className="mt-0.5 truncate text-muted">{auction(auctions.find((x) => x.id === f.auctionId) ?? auctions[0]).title}</p>
                </li>
              ))}
            </ul>
          )}
          {!loggedIn && (
            <p className="mt-5 rounded-lg bg-brand-50 p-3 text-xs text-brand">
              <Link to="/signin?next=/live-bidding" className="font-semibold underline">{t('Sign In')}</Link> · <Link to="/signup" className="font-semibold underline">{t('Create account')}</Link> – {t('to place bids.')}
            </p>
          )}
        </aside>
      </main>
      <Footer />
    </div>
  )
}
