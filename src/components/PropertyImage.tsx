import { useState } from 'react'

/** Shared stand-in photos, used until a real file is uploaded under public/images/auctions. */
const POOL = [
  '/images/properties/modern-villa-pool.jpg',
  '/images/properties/aerial-villa.jpg',
  '/images/properties/modern-home-dusk.jpg',
  '/images/properties/house-landscape.jpg',
  '/images/properties/valley-mountains.jpg',
]
const pick = (src: string) => {
  let h = 0
  for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) >>> 0
  return POOL[h % POOL.length]
}

/** Photo that falls back to a shared stand-in photo, then a gradient, when the real file is missing. */
export function PropertyImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [step, setStep] = useState(0)
  if (step >= 2) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`bg-gradient-to-br from-brand-200 via-brand-400 to-brand-700 ${className}`}
      />
    )
  }
  return (
    <img
      src={step === 0 ? src : pick(src)}
      alt={alt}
      loading="lazy"
      onError={() => setStep((s) => s + 1)}
      className={`object-cover ${className}`}
    />
  )
}
