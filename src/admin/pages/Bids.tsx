import { useMemo } from 'react'
import { jod } from '../data'
import { useAdmin } from '../store'
import { Button, DataTable, PageHeader } from '../ui'

export default function Bids() {
  const { t, bids, cancelBid, notify, query } = useAdmin()
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bids.filter((b) => !q || b.auctionId.toLowerCase().includes(q) || b.email.toLowerCase().includes(q))
  }, [bids, query])
  return (
    <>
      <PageHeader title={t('bids')} sub={t('bidsSub')} />
      <DataTable
        rows={rows}
        cols={[
          { header: t('auction'), width: 'w-28', cell: (b) => <span className="font-medium text-brand">#{b.auctionId}</span> },
          { header: t('user'), cell: (b) => <span dir="ltr">{b.email}</span> },
          { header: t('amount'), width: 'w-40', cell: (b) => jod(b.amount) },
          { header: t('date'), width: 'w-44', cell: (b) => <span dir="ltr">{b.date}</span> },
          {
            header: t('actions'),
            width: 'w-40',
            cell: (b) => b.cancelled ? <span className="text-xs text-street">{t('cancelled')}</span> : (
              <Button kind="danger" onClick={async () => { await cancelBid(b.id); notify(t('cancelled')) }}>{t('cancelBid')}</Button>
            ),
          },
        ]}
      />
    </>
  )
}
