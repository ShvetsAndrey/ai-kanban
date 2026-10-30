import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { parseTasks } from "./parse-tasks";
import type { ExtractedTask } from "./types";

export const SYSTEM_PROMPT =
  'You are a Project Manager. Analyze the text and extract actionable tasks. Return a JSON array: [{"title": "...", "description": "...", "priority": "high|medium|low", "assignee": "name or null"}]. Ignore filler and greetings.';

const OUTPUT_HINT = "Respond with the JSON array only, no explanations and no markdown.";

export type Provider = "anthropic" | "openai" | "mock";

export class AiConfigError extends Error {}

export function resolveProvider(): Provider {
  if (process.env.AI_MOCK === "1" || process.env.AI_MOCK === "true") return "mock";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  throw new AiConfigError(
    "No AI provider configured: set ANTHROPIC_API_KEY or OPENAI_API_KEY (or AI_MOCK=1 for a demo).",
  );
}

async function callAnthropic(text: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 4096,
    system: `${SYSTEM_PROMPT}\n${OUTPUT_HINT}`,
    messages: [{ role: "user", content: text }],
  });
  return message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");
}

async function callOpenAI(text: string): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-5.5",
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n${OUTPUT_HINT}` },
      { role: "user", content: text },
    ],
  });
  return completion.choices[0]?.message.content ?? "";
}

/** Deterministic fake response, wrapped in a code fence to exercise the parser. */
async function callMock(text: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 800));
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !/^(hi|hello|hey|good (morning|afternoon)|thanks)/i.test(s))
    .slice(0, 5);

  const priorities = ["medium", "high", "low"] as const;
  const tasks = (sentences.length ? sentences : ["Review the meeting notes"]).map((s, i) => {
    const nameMatch = s.match(/^([A-Z][a-z]+)[,:]/);
    const title = s
      .replace(/^([A-Z][a-z]+)[,:]\s*/, "")
      .replace(/^(please,?|we need to|need to|can you|could you)\s+/i, "")
      .replace(/[.!]+$/, "")
      .slice(0, 70);
    return {
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: `From the transcript: "${s}"`,
      priority: /urgent|asap|today|critical|blocker/i.test(s) ? "high" : priorities[i % 3],
      assignee: nameMatch ? nameMatch[1] : null,
    };
  });
  return "```json\n" + JSON.stringify(tasks, null, 2) + "\n```";
}

export async function extractTasks(text: string): Promise<{ provider: Provider; tasks: ExtractedTask[] }> {
  const provider = resolveProvider();
  const raw =
    provider === "anthropic"
      ? await callAnthropic(text)
      : provider === "openai"
        ? await callOpenAI(text)
        : await callMock(text);
  return { provider, tasks: parseTasks(raw) };
}
