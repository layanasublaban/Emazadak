import { useEffect, useSyncExternalStore } from 'react'
import { api } from '@/lib/api'
import { auctionsVersion, normalizeAuction, setAuctions, subscribeAuctions, type Auction } from '@/data/auctions'

let started = false
export async function reloadAuctions() {
  try {
    const rows = await api<(Partial<Auction> & { id: string })[]>('/auctions', { auth: false })
    if (Array.isArray(rows) && rows.length) setAuctions(rows.map(normalizeAuction))
  } catch {
    /* offline: keep what we have (generated demo data on first load) */
  }
}

/** Loads auctions from the API and polls for changes (bids, admin edits). Call once near the root. */
export function useAuctionsSync(intervalMs = 6000) {
  useEffect(() => {
    if (started) return
    started = true
    void reloadAuctions()
    const t = setInterval(() => { if (!document.hidden) void reloadAuctions() }, intervalMs)
    return () => { clearInterval(t); started = false }
  }, [intervalMs])
  return useSyncExternalStore(subscribeAuctions, auctionsVersion)
}
