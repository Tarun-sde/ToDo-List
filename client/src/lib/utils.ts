import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function isOverdue(date: string | Date | undefined): boolean {
  if (!date) return false;
  return new Date(date) < new Date();
}

export function isPastOrToday(date: string | Date | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d <= today;
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
