"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@/lib/types";
import { PRIORITY_META } from "./priority";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  overlay?: boolean;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskCardView({ task, onEdit, onDelete, overlay }: TaskCardProps) {
  const meta = PRIORITY_META[task.priority];
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 pl-4 shadow-sm transition ${
        overlay ? "rotate-2 cursor-grabbing shadow-xl ring-2 ring-indigo-300" : "cursor-grab hover:border-slate-300 hover:shadow-md"
      } ${task.columnId === "done" ? "opacity-75" : ""}`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold leading-snug text-slate-800 ${task.columnId === "done" ? "line-through decoration-slate-400" : ""}`}>
          {task.title}
        </h3>
        {!overlay && (
          <div className="-mr-1 -mt-1 flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Edit"
              onClick={() => onEdit?.(task)}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path d="M13.6 3.3a2 2 0 0 1 2.8 2.8l-8.5 8.5-3.6.8.8-3.6 8.5-8.5Z" /></svg>
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              aria-label="Delete"
              onClick={() => onDelete?.(task)}
              className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8 2a1 1 0 0 0-.9.6L6.6 4H4a1 1 0 0 0 0 2h.1l.8 10.1A2 2 0 0 0 6.9 18h6.2a2 2 0 0 0 2-1.9L15.9 6h.1a1 1 0 1 0 0-2h-2.6l-.5-1.4A1 1 0 0 0 12 2H8Zm0 6a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8Zm3-1a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Z" clipRule="evenodd" /></svg>
            </button>
          </div>
        )}
      </div>
      {task.description && <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-slate-500">{task.description}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${meta.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        {task.assignee ? (
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-semibold text-white">
              {initials(task.assignee)}
            </span>
            {task.assignee}
          </span>
        ) : (
          <span className="text-xs italic text-slate-400">Unassigned</span>
        )}
      </div>
    </div>
  );
}

export function TaskCard(props: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: props.task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? "opacity-30" : ""}
      data-testid="task-card"
      {...attributes}
      {...listeners}
    >
      <TaskCardView {...props} />
    </div>
  );
}
