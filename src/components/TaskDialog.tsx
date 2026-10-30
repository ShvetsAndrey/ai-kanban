"use client";

import { useEffect, useRef, useState } from "react";
import type { ExtractedTask, Priority } from "@/lib/types";
import { PRIORITY_META, PRIORITY_ORDER } from "./priority";

interface TaskDialogProps {
  title: string;
  initial?: ExtractedTask;
  onSave: (task: ExtractedTask) => void;
  onClose: () => void;
}

export function TaskDialog({ title, initial, onSave, onClose }: TaskDialogProps) {
  const [form, setForm] = useState<ExtractedTask>(
    initial ?? { title: "", description: "", priority: "medium", assignee: null },
  );
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      assignee: form.assignee?.trim() || null,
    });
  }

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        <div className="space-y-1.5">
          <label htmlFor="task-title" className="text-xs font-medium text-slate-600">Title</label>
          <input
            id="task-title"
            ref={titleRef}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputCls}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="task-description" className="text-xs font-medium text-slate-600">Description</label>
          <textarea
            id="task-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="task-assignee" className="text-xs font-medium text-slate-600">Assignee</label>
            <input
              id="task-assignee"
              value={form.assignee ?? ""}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              placeholder="Unassigned"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-600">Priority</span>
            <div className="flex gap-1.5">
              {PRIORITY_ORDER.map((p: Priority) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={form.priority === p}
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium ring-1 ring-inset transition ${
                    form.priority === p ? PRIORITY_META[p].badge + " ring-2" : "text-slate-500 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!form.title.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
