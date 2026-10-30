import { z } from "zod";
import { AiConfigError, extractTasks } from "@/lib/ai";
import { TaskParseError } from "@/lib/parse-tasks";

const MAX_INPUT_CHARS = 100_000;

const bodySchema = z.object({
  text: z.string().trim().min(1, "Text is empty").max(MAX_INPUT_CHARS, "Text is too long"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  try {
    const { provider, tasks } = await extractTasks(parsed.data.text);
    return Response.json({ provider, tasks });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    if (error instanceof TaskParseError) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    console.error("[analyze] AI request failed", error);
    return Response.json({ error: "AI request failed. Please try again." }, { status: 502 });
  }
}
