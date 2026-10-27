import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse<T = unknown>(input: unknown): T | null {
  if (typeof input !== 'string') return input as T | null;
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}
