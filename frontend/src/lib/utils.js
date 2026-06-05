import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a human-readable "time ago" string from an ISO timestamp.
 * Handles both UTC (with/without Z) and local timestamps from the backend.
 */
export function timeAgo(iso) {
  if (!iso) return "—";

  // Ensure the string is parsed as UTC if it has no timezone info
  let str = iso.trim();
  if (!str.endsWith("Z") && !str.includes("+") && !str.match(/[+-]\d{2}:\d{2}$/)) {
    str += "Z";
  }

  const date = new Date(str);
  if (isNaN(date.getTime())) return "—";

  const diff = Date.now() - date.getTime();

  // If diff is negative (clock skew / future timestamp), show "just now"
  if (diff < 0) return "just now";

  const s = Math.floor(diff / 1000);
  if (s < 5)  return "just now";
  if (s < 60) return `${s}s ago`;

  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;

  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;

  // Older than a week — show actual date
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Format a timestamp as a short readable string.
 */
export function formatTs(iso) {
  if (!iso) return "—";
  let str = iso.trim();
  if (!str.endsWith("Z") && !str.includes("+") && !str.match(/[+-]\d{2}:\d{2}$/)) {
    str += "Z";
  }
  const date = new Date(str);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
