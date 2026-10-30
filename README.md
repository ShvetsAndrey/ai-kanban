# AI Kanban

Paste an unstructured text (e.g. a Zoom call transcript) and AI extracts actionable tasks with priority and assignee, then places them in the **To Do** column of a Kanban board.

Stack: Next.js (App Router, TypeScript) · Zustand (persisted to `localStorage`) · dnd-kit · Tailwind CSS · Claude via `@anthropic-ai/sdk` (OpenAI fallback) · zod.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in a key
npm run dev                  # http://localhost:3000
```

Environment variables (`.env.local`):

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Primary provider (Claude). Model override: `ANTHROPIC_MODEL` (default `claude-sonnet-5-5`). |
| `OPENAI_API_KEY` | Fallback, used only if no Anthropic key. Model override: `OPENAI_MODEL` (default `gpt-5.5`). |
| `AI_MOCK=1` | Skip AI entirely and return heuristic mock tasks (for demos/tests without a key). |

Production: `npm run build && npm start`. Lint: `npm run lint`.

## How it works

- `src/app/api/analyze/route.ts` — `POST { text }` → `{ provider, tasks }`. Keys stay server-side.
- `src/lib/ai.ts` — system prompt, provider selection (mock → Anthropic → OpenAI), calls.
- `src/lib/parse-tasks.ts` — robust parsing: strips code fences / surrounding prose, accepts `{ "tasks": [...] }`, validates each item with zod, normalizes priority (`high|medium|low`, falls back to `medium`) and `null`-ish assignees, drops invalid items.
- `src/store/board.ts` — Zustand store: `board.columns`, `board.tasks`, and `moveTask`, `addTask`, `addTasks`, `updateTask`, `deleteTask`, `clearBoard`.
- `src/components/` — analyze panel, board/columns (dnd-kit droppables), cards (draggables), add/edit dialog.
