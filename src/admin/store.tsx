import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { adminToken, api, ApiError } from '@/lib/api'
import { dictionaries, type Key, type Lang } from './i18n'
import type { AdminAuction, AdminUser, Bi, Submission, Tx } from './data'

export interface Settings {
  platformName: string
  supportEmail: string
  minDeposit: string
  extension: string
  currency: string
}

export interface AdminBid { id: string; auctionId: string; email: string; amount: number; cancelled: boolean; date: string }
export interface AdminOffer { id: string; auctionId: string; email: string; amount: number; status: string; date: string }
export interface AdminEvent { id: number; kind: string; ref: string; at: number; detail: Record<string, unknown> }
export interface Summary { counts: Record<string, number>; events: AdminEvent[] }

interface Store {
  lang: Lang
  dir: 'ltr' | 'rtl'
  toggleLang: () => void
  t: (k: Key) => string
  loc: (b: Bi) => string
  loggedIn: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  query: string
  setQuery: (q: string) => void
  toast: string | null
  loading: boolean
  refresh: () => Promise<void>
  auctions: AdminAuction[]
  saveAuction: (a: AdminAuction) => Promise<boolean>
  deleteAuction: (id: string) => Promise<void>
  submissions: Submission[]
  decideSubmission: (id: string, status: 'Approved' | 'Rejected', reason?: string) => Promise<void>
  users: AdminUser[]
  toggleSuspend: (id: string) => Promise<void>
  setVerified: (id: string, verified: boolean) => Promise<void>
  transactions: Tx[]
  setTxStatus: (id: string, status: Tx['status']) => Promise<void>
  bids: AdminBid[]
  cancelBid: (id: string) => Promise<void>
  offers: AdminOffer[]
  decideOffer: (id: string, status: 'Accepted' | 'Rejected') => Promise<void>
  summary: Summary
  settings: Settings
  saveSettings: (s: Settings) => Promise<void>
  notify: (msg: string) => void
}

const Ctx = createContext<Store | null>(null)

const LANG_KEY = 'emazadak-admin-lang'

function readLS(k: string): string | null {
  try { return window.localStorage.getItem(k) } catch { return null }
}
function writeLS(k: string, v: string | null) {
  try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v) } catch { /* ignore */ }
}

/* ---------- API <-> admin model adapters ---------- */
type Raw = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10)
const ymdhm = (ms: number) => new Date(ms).toISOString().slice(0, 16).replace('T', ' ')
const endsIn = (ms: number) => {
  const d = ms - Date.now()
  if (d <= 0) return '—'
  const h = Math.floor(d / 3_600_000)
  return h >= 24 ? `${Math.floor(h / 24)}d ${String(h % 24).padStart(2, '0')}h` : `${h}h ${String(Math.floor((d % 3_600_000) / 60_000)).padStart(2, '0')}m`
}
const toAdminStatus = (s: string): AdminAuction['status'] => (s === 'coming-soon' ? 'Upcoming' : s === 'finished' ? 'Ended' : 'Active')
const fromAdminStatus = (s: AdminAuction['status']) => (s === 'Upcoming' ? 'coming-soon' : s === 'Ended' ? 'finished' : 'live')
const parseDate = (s: string, fallback: number) => { const t = Date.parse(s.trim().replace(' ', 'T')); return Number.isNaN(t) ? fallback : t }

const toAdminAuction = (r: Raw): AdminAuction => ({
  id: r.id,
  title: { en: r.title ?? '', ar: r.titleAr ?? r.title ?? '' },
  type: r.type ?? '',
  status: toAdminStatus(r.status),
  highestBid: Number(r.currentBid ?? r.startingPrice ?? 0),
  startingPrice: Number(r.startingPrice ?? 0),
  minIncrement: Number(r.minBidIncrement ?? 0),
  endsIn: endsIn(Number(r.endsAt ?? 0)),
  startDate: ymdhm(Number(r.startsAt ?? Date.now())),
  endDate: ymdhm(Number(r.endsAt ?? Date.now())),
  location: { en: r.location ?? '', ar: r.locationAr ?? r.location ?? '' },
  landSize: Number(r.landSize ?? 0),
  description: r.description ?? '',
})
const fromAdminAuction = (a: AdminAuction, isNew: boolean) => {
  const endsAt = parseDate(a.endDate, Date.now() + 7 * 86_400_000)
  return {
    ...(isNew ? {} : { id: a.id }),
    title: a.title.en, titleAr: a.title.ar, type: a.type, status: fromAdminStatus(a.status),
    startingPrice: a.startingPrice, minBidIncrement: a.minIncrement, baseBid: a.startingPrice,
    ...(isNew ? { currentBid: a.startingPrice } : {}),
    startsAt: parseDate(a.startDate, Date.now()), endsAt,
    location: a.location.en, locationAr: a.location.ar, landSize: a.landSize, description: a.description,
    marketPrice: a.startingPrice,
  }
}
const toAdminUser = (u: Raw): AdminUser => ({
  id: u.id, name: { en: u.fullName ?? u.email, ar: u.fullName ?? u.email }, email: u.email, phone: u.phone ?? '',
  verified: u.verification === 'verified', suspended: !!u.suspended, bids: Number(u.bids ?? 0), won: 0, deposit: Number(u.deposit ?? 0),
})
const toTx = (x: Raw): Tx => ({ id: String(x.id), userId: x.userId, type: x.type, amount: Number(x.amount), status: x.status, date: ymd(x.at) })
const toSubmission = (s: Raw): Submission => ({
  id: s.id, title: { en: s.title ?? '', ar: s.title ?? '' }, type: s.type ?? '',
  location: { en: [s.area, s.city].filter(Boolean).join(', '), ar: [s.area, s.city].filter(Boolean).join(', ') },
  area: Number(s.landSize ?? 0), expectedPrice: Number(s.startingPrice ?? 0),
  owner: { en: s.ownerName ?? s.email ?? '', ar: s.ownerName ?? s.email ?? '' },
  docs: (Array.isArray(s.photos) ? s.photos.length : 0) + (s.deed ? 1 : 0), submitted: ymd(s.at), status: s.status, reason: s.reason ?? undefined,
})

const emptySummary: Summary = { counts: {}, events: [] }
const defaultSettings: Settings = { platformName: 'Emazadak', supportEmail: 'support@emazadak.com', minDeposit: '1000', extension: '5', currency: 'JOD' }

export function AdminProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (readLS(LANG_KEY) === 'ar' ? 'ar' : 'en'))
  const [loggedIn, setLoggedIn] = useState(() => !!adminToken.get())
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [auctions, setAuctions] = useState<AdminAuction[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [bids, setBids] = useState<AdminBid[]>([])
  const [offers, setOffers] = useState<AdminOffer[]>([])
  const [summary, setSummary] = useState<Summary>(emptySummary)
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const notify = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const fail = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) { adminToken.set(null); setLoggedIn(false) }
    notify(e instanceof ApiError ? e.message : 'Something went wrong')
  }, [notify])

  const refresh = useCallback(async () => {
    if (!adminToken.get()) return
    setLoading(true)
    try {
      const [a, s, u, tx, b, o, sum, st] = await Promise.all([
        api<Raw[]>('/admin/auctions', { admin: true }), api<Raw[]>('/admin/submissions', { admin: true }), api<Raw[]>('/admin/users', { admin: true }),
        api<Raw[]>('/admin/transactions', { admin: true }), api<Raw[]>('/admin/bids', { admin: true }), api<Raw[]>('/admin/offers', { admin: true }),
        api<Summary>('/admin/summary', { admin: true }), api<Raw>('/admin/settings', { admin: true }),
      ])
      setAuctions(a.map(toAdminAuction)); setSubmissions(s.map(toSubmission)); setUsers(u.map(toAdminUser)); setTransactions(tx.map(toTx))
      setBids(b.map((x) => ({ id: String(x.id), auctionId: x.auctionId, email: x.email, amount: x.amount, cancelled: x.cancelled, date: ymdhm(x.at) })))
      setOffers(o.map((x) => ({ id: String(x.id), auctionId: x.auctionId, email: x.email, amount: x.amount, status: x.status, date: ymd(x.at) })))
      setSummary(sum); setSettings({ ...defaultSettings, ...Object.fromEntries(Object.entries(st).map(([k, v]) => [k, String(v)])) })
    } catch (e) { fail(e) } finally { setLoading(false) }
  }, [fail])

  // Load on sign-in and keep fresh (new bids, users, submissions appear without reloading)
  useEffect(() => {
    if (!loggedIn) return
    void refresh()
    const t = window.setInterval(() => { if (!document.hidden) void refresh() }, 8000)
    return () => window.clearInterval(t)
  }, [loggedIn, refresh])

  const act = useCallback(async (fn: () => Promise<unknown>) => { try { await fn(); await refresh(); return true } catch (e) { fail(e); return false } }, [refresh, fail])

  const value = useMemo<Store>(() => {
    const dict = dictionaries[lang]
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      toggleLang: () => { const next: Lang = lang === 'en' ? 'ar' : 'en'; setLang(next); writeLS(LANG_KEY, next) },
      t: (k) => dict[k],
      loc: (b) => b[lang],
      loggedIn,
      login: async (email, password) => {
        try {
          const r = await api<{ token: string }>('/admin/login', { body: { email: email.trim(), password }, auth: false })
          adminToken.set(r.token, true); setLoggedIn(true); return true
        } catch { return false }
      },
      logout: () => { adminToken.set(null); setLoggedIn(false) },
      query, setQuery, toast, loading, refresh,
      auctions,
      saveAuction: (a) => {
        const isNew = !auctions.some((x) => x.id === a.id)
        return act(() => (isNew ? api('/admin/auctions', { admin: true, body: fromAdminAuction(a, true) }) : api(`/admin/auctions/${a.id}`, { admin: true, method: 'PUT', body: fromAdminAuction(a, false) })))
      },
      deleteAuction: async (id) => { await act(() => api(`/admin/auctions/${id}`, { admin: true, method: 'DELETE' })) },
      submissions,
      decideSubmission: async (id, status, reason) => { await act(() => api(`/admin/submissions/${id}`, { admin: true, method: 'PATCH', body: { status, reason } })) },
      users,
      toggleSuspend: async (id) => { const u = users.find((x) => x.id === id); if (u) await act(() => api(`/admin/users/${id}`, { admin: true, method: 'PATCH', body: { suspended: !u.suspended } })) },
      setVerified: async (id, verified) => { await act(() => api(`/admin/users/${id}`, { admin: true, method: 'PATCH', body: { verification: verified ? 'verified' : 'unverified' } })) },
      transactions,
      setTxStatus: async (id, status) => { await act(() => api(`/admin/transactions/${id}`, { admin: true, method: 'PATCH', body: { status } })) },
      bids,
      cancelBid: async (id) => { await act(() => api(`/admin/bids/${id}`, { admin: true, method: 'DELETE' })) },
      offers,
      decideOffer: async (id, status) => { await act(() => api(`/admin/offers/${id}`, { admin: true, method: 'PATCH', body: { status } })) },
      summary,
      settings,
      saveSettings: async (s) => { if (await act(() => api('/admin/settings', { admin: true, method: 'PUT', body: s }))) setSettings(s) },
      notify,
    }
  }, [lang, loggedIn, query, toast, loading, refresh, auctions, submissions, users, transactions, bids, offers, summary, settings, notify, act])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdmin(): Store {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAdmin must be used inside <AdminProvider>')
  return v
}
