// Utility helper functions

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | undefined): string {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export function formatDateWithTime(date: Date | undefined): string {
  if (!date) {
    return ""
  }

  return date.toLocaleDateString("en-US", {
    second: "2-digit",
    minute: "2-digit",
    hour: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZoneName: "short"
  })
}

export function isValidDate(date: Date | undefined): boolean {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
}

export function isSupabasePath(link: string) {
  return !link.startsWith("http://") && !link.startsWith("https://");
}

// For a state object T, sets a key to value using its setter (T[key] = value)
export function handleKeyChange<T extends object, K extends keyof T>(
    setObject: React.Dispatch<React.SetStateAction<T>>,
    key: K,
    value: T[K]
) {
  setObject((prev) => ({ ...prev, [key]: value }))
}

// For a state object T, sets a key to value using its setter, or deletes if value is undefined/null
export function handleKeyChangeOrDelete<T extends object, K extends keyof T>(
    object: T,
    setObject: React.Dispatch<React.SetStateAction<T>>,
    key: K,
    value: T[K] | undefined | null
) {
  if (value === undefined || value === null) {
    const { [key]: _, ...withoutKey } = object;
    setObject(withoutKey as T);
    return;
  }
  handleKeyChange(setObject, key, value);
}