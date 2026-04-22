const STORAGE_KEY = "hanover:data-theme";
const TEXT_SIZE_STORAGE_KEY = "hanover:text-size";
const ICON_SIZE_STORAGE_KEY = "hanover:icon-size";
const VIEW_STORAGE_KEY = "hanover:view";

export const THEME_IDS = [
  "hanover blue",
  "times",
  "dark",
  "quasar",
  "retro",
  "tritanomoly",
  "kylie",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "hanover blue";

export const SIZE_VALUES = ["Small", "Medium", "Large"] as const;
export type SizeValue = (typeof SIZE_VALUES)[number];

export const DEFAULT_SIZE: SizeValue = "Medium";

function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

function isSizeValue(value: string): value is SizeValue {
  return (SIZE_VALUES as readonly string[]).includes(value);
}

export function getStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isThemeId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function getStoredTextSize(): SizeValue {
  try {
    const raw = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (raw && isSizeValue(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_SIZE;
}

export function applyTextSize(size: SizeValue): void {
  document.documentElement.setAttribute("data-text-size", size);
  try {
    localStorage.setItem(TEXT_SIZE_STORAGE_KEY, size);
  } catch {
    /* ignore */
  }
}

export function getStoredIconSize(): SizeValue {
  try {
    const raw = localStorage.getItem(ICON_SIZE_STORAGE_KEY);
    if (raw && isSizeValue(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_SIZE;
}

export function applyIconSize(size: SizeValue): void {
  document.documentElement.setAttribute("data-icon-size", size);
  try {
    localStorage.setItem(ICON_SIZE_STORAGE_KEY, size);
  } catch {
    /* ignore */
  }
}

export type ViewPreference = "List" | "Grid";

export function getStoredView(): ViewPreference {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY);
    if (raw === "List" || raw === "Grid") return raw;
  } catch {
    /* ignore */
  }
  return "Grid";
}

export function storeView(view: ViewPreference): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    /* ignore */
  }
}
