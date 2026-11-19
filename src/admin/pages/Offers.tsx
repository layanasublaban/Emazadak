import { useMemo } from 'react'
import { jod } from '../data'
import { useAdmin } from '../store'
import { Button, DataTable, PageHeader } from '../ui'

export default function Offers() {
  const { t, offers, decideOffer, notify, query } = useAdmin()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return offers.filter((o) => !q || o.auctionId.toLowerCase().includes(q) || o.email.toLowerCase().includes(q))
  }, [offers, query])
  return (
    <>
      <PageHeader title={t('offers')} sub={t('offersSub')} />
      <DataTable
        rows={rows}
        cols={[
          { header: t('auction'), width: 'w-28', cell: (o) => <span className="font-medium text-brand">#{o.auctionId}</span> },
          { header: t('user'), cell: (o) => <span dir="ltr">{o.email}</span> },
          { header: t('amount'), width: 'w-40', cell: (o) => jod(o.amount) },
          { header: t('date'), width: 'w-32', cell: (o) => o.date },
          {
            header: t('actions'),
            width: 'w-60',
            cell: (o) => o.status !== 'Pending' ? <span className="text-xs text-street">{o.status}</span> : (
              <div className="flex gap-2">
                <Button onClick={async () => { await decideOffer(o.id, 'Accepted'); notify(t('accept')) }}>{t('accept')}</Button>
                <Button kind="danger" onClick={async () => { await decideOffer(o.id, 'Rejected'); notify(t('reject')) }}>{t('reject')}</Button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
