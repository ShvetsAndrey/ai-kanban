import { z } from "zod";
import type { ExtractedTask, Priority } from "./types";

const PRIORITY_ALIASES: Record<string, Priority> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const NULLISH_ASSIGNEES = new Set(["", "null", "none", "n/a", "unknown", "unassigned", "tbd"]);

const extractedTaskSchema = z.object({
  title: z.string().trim().min(1),
  description: z
    .string()
    .nullish()
    .transform((v) => (v ?? "").trim()),
  priority: z
    .string()
    .nullish()
    .transform((v): Priority => PRIORITY_ALIASES[(v ?? "").trim().toLowerCase()] ?? "medium"),
  assignee: z
    .string()
    .nullish()
    .transform((v) => {
      const trimmed = (v ?? "").trim();
      return NULLISH_ASSIGNEES.has(trimmed.toLowerCase()) ? null : trimmed;
    }),
});

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  return (fenced ? fenced[1] : text).trim();
}

/** Finds the outermost JSON array (or object) in free-form model output. */
function extractJsonCandidate(text: string): string {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd > objStart) return text.slice(objStart, objEnd + 1);
  return text;
}

export class TaskParseError extends Error {}

/**
 * Parses raw LLM output into validated tasks. Tolerates code fences, surrounding
 * prose, a `{ "tasks": [...] }` wrapper, and individual malformed items (dropped).
 */
export function parseTasks(raw: string): ExtractedTask[] {
  const candidate = extractJsonCandidate(stripCodeFences(raw));

  let data: unknown;
  try {
    data = JSON.parse(candidate);
  } catch {
    throw new TaskParseError("The model returned invalid JSON");
  }

  if (data && !Array.isArray(data) && typeof data === "object" && "tasks" in data) {
    data = (data as { tasks: unknown }).tasks;
  }
  if (!Array.isArray(data)) {
    throw new TaskParseError("Expected a JSON array of tasks");
  }

  return data.flatMap((item) => {
    const result = extractedTaskSchema.safeParse(item);
    return result.success ? [result.data] : [];
  });
}
