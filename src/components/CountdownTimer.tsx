import { Fragment } from 'react'
import { useCountdown } from '@/lib/useCountdown'
import { useT } from '@/lib/i18n'

const pad = (n: number) => String(n).padStart(2, '0')

interface Props {
  endsAt: number
  /** "sm" for cards, "lg" for the auction details sidebar */
  size?: 'sm' | 'lg'
}

export function CountdownTimer({ endsAt, size = 'sm' }: Props) {
  const t = useCountdown(endsAt)
  const tr = useT()
  const lg = size === 'lg'
  const parts = [
    { v: t.days, label: 'Days' },
    { v: t.hours, label: 'Hours' },
    { v: t.minutes, label: 'Minutes' },
    { v: t.seconds, label: 'Seconds' },
  ]

  return (
    <div role="timer" aria-label={tr('Time remaining')} dir="ltr" className={`flex w-full items-start justify-between ${lg ? 'px-1 sm:px-4' : 'px-1'}`}>
      {parts.map((p, i) => (
        <Fragment key={p.label}>
          <div className="flex flex-col items-center">
            <span
              className={`flex items-center justify-center rounded-md bg-sand font-semibold text-brand tabular-nums ${
                lg ? 'h-11 min-w-12 px-1.5 text-[22px] sm:h-12 sm:min-w-14 sm:text-[26px]' : 'h-6 min-w-6 px-1 text-xs'
              }`}
            >
              {pad(p.v)}
            </span>
            <span className={`mt-1 text-ink ${lg ? 'text-[13px] font-medium' : 'text-[10px]'}`}>{tr(p.label)}</span>
          </div>
          {i < parts.length - 1 && <span className={`font-bold text-ink ${lg ? 'mt-1.5 text-2xl' : 'text-sm leading-6'}`}>:</span>}
        </Fragment>
      ))}
    </div>
  )
}
