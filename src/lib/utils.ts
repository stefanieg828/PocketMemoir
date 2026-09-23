import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function tiltFor(id: string): number {
  const n = hashSeed(id);
  // Roughly -8° .. 8° — handmade scrapbook scatter (A chaos + B snug).
  return ((n % 161) - 80) / 10;
}
