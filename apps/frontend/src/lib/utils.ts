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

export function isValidDate(date: Date | undefined): boolean {
  if (!date) {
    return false
  }
  return !isNaN(date.getTime())
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