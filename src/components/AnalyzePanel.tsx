"use client";

import { useState } from "react";
import type { ExtractedTask } from "@/lib/types";
import { useBoardStore } from "@/store/board";

const SAMPLE = `Hi everyone, thanks for joining!
Anna, please prepare the client presentation by Friday.
Igor: we need to fix the payment bug in the mobile app, it's urgent and critical.
We should also update the API documentation by the end of the month.
Maria, collect user feedback on the new onboarding flow.`;

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string } | { kind: "success"; count: number; provider: string };

export function AnalyzePanel() {
  const addTasks = useBoardStore((s) => s.addTasks);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const loading = status.kind === "loading";

  async function analyze() {
    if (!text.trim() || loading) return;
    setStatus({ kind: "loading" });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json().catch(() => ({}))) as { tasks?: ExtractedTask[]; provider?: string; error?: string };
      if (!res.ok || !data.tasks) {
        throw new Error(data.error ?? `Server error (${res.status})`);
      }
      addTasks(data.tasks);
      setStatus({ kind: "success", count: data.tasks.length, provider: data.provider ?? "ai" });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label htmlFor="transcript" className="text-sm font-semibold text-slate-800">
          Meeting transcript or notes
        </label>
        <button
          type="button"
          onClick={() => setText(SAMPLE)}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          Insert sample
        </button>
      </div>
      <textarea
        id="transcript"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
        }}
        placeholder="Paste a Zoom call transcript, a chat thread or your notes here…"
        rows={6}
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={analyze}
          disabled={loading || !text.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Analyzing…
            </>
          ) : (
            <>✨ Analyze &amp; Generate</>
          )}
        </button>
        <span className="text-xs text-slate-400">Ctrl/⌘ + Enter</span>
        <div className="ml-auto text-sm" aria-live="polite">
          {status.kind === "error" && (
            <span role="alert" className="rounded-lg bg-red-50 px-3 py-1.5 text-red-700 ring-1 ring-red-200">
              {status.message}
            </span>
          )}
          {status.kind === "success" && (
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
              {status.count > 0 ? `Tasks added: ${status.count}` : "No tasks found"}
              {status.provider === "mock" && " (mock)"}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
