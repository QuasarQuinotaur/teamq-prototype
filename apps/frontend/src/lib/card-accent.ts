/** Background classes for content cards and matching default employee avatars. */
export const CARD_ACCENT_BG_CLASSES = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
] as const

export function stringToAccentBgClass(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CARD_ACCENT_BG_CLASSES[Math.abs(hash) % CARD_ACCENT_BG_CLASSES.length]
}
