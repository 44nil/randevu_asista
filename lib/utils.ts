import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount)
}

/**
 * Ensures a date string is interpreted as UTC.
 * If the string lacks timezone info, appends 'Z'.
 * Useful for Supabase timestamps that might be truncated or misinterpreted by browsers.
 */
export function parseUTCTime(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();

  try {
    // Check if it already has timezone info (Z or +HH:MM / -HH:MM or just +HH / -HH)
    // Matches: Z, +03, -05:00, +0000, etc. at the end
    const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}(:?\d{2})?$/.test(dateStr);

    let date: Date;
    if (!hasTimezone) {
      // Try appending Z for local->UTC interpretation
      date = new Date(dateStr + 'Z');
    } else {
      date = new Date(dateStr);
    }

    // Check if valid
    if (isNaN(date.getTime())) {
      console.warn('parseUTCTime produced invalid date, falling back to original:', dateStr);
      return new Date(dateStr);
    }

    return date;
  } catch (e) {
    console.error('Error in parseUTCTime:', e);
    return new Date(dateStr);
  }
}

export function pluralizeTurkish(word: string): string {
  if (!word) return "";
  const lastVowel = word.match(/[aıoueiöü]/gi)?.pop()?.toLowerCase();
  const suffix = ['a', 'ı', 'o', 'u'].includes(lastVowel || '') ? 'lar' : 'ler';
  return `${word}${suffix}`;
}
