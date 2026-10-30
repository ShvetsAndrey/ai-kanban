import type { Priority } from "@/lib/types";

export const PRIORITY_META: Record<Priority, { label: string; badge: string; dot: string; bar: string }> = {
  high: {
    label: "High",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
    bar: "bg-red-500",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-50 text-amber-800 ring-amber-600/25",
    dot: "bg-amber-400",
    bar: "bg-amber-400",
  },
  low: {
    label: "Low",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
  },
};

export const PRIORITY_ORDER: Priority[] = ["high", "medium", "low"];
