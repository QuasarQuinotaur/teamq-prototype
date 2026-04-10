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

export function handleKeyChange<T extends object, K extends keyof T>(
    setObject: React.Dispatch<React.SetStateAction<T>>,
    key: K,
    value: T[K]
) {
  setObject((prev) => ({ ...prev, [key]: value }))
}