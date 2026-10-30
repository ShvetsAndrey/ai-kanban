"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";
import type { Column, ColumnId, Task } from "@/lib/types";
import { useBoardStore, useHasHydrated } from "@/store/board";
import { TaskCard, TaskCardView } from "./TaskCard";
import { TaskDialog } from "./TaskDialog";

const COLUMN_ACCENT: Record<ColumnId, string> = {
  todo: "bg-slate-400",
  "in-progress": "bg-indigo-500",
  done: "bg-emerald-500",
};

type DialogState = { mode: "add"; columnId: ColumnId } | { mode: "edit"; task: Task } | null;

function BoardColumn({
  column,
  tasks,
  onAdd,
  onEdit,
  onDelete,
}: {
  column: Column;
  tasks: Task[];
  onAdd: () => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${column.id}`}
      className={`flex min-h-[420px] flex-col rounded-2xl border p-3 transition ${
        isOver ? "border-indigo-300 bg-indigo-50/70 ring-4 ring-indigo-100" : "border-slate-200/80 bg-slate-100/60"
      }`}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${COLUMN_ACCENT[column.id]}`} />
          <h2 className="text-sm font-semibold text-slate-700">{column.title}</h2>
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          aria-label={`Add task to ${column.title}`}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-indigo-600"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" /></svg>
        </button>
      </header>
      <div className="flex flex-1 flex-col gap-2.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
            Drop a task here
          </div>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="mt-1 rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-500 transition hover:bg-white hover:text-indigo-600"
        >
          + Add task
        </button>
      </div>
    </div>
  );
}

export function Board() {
  const { columns, tasks } = useBoardStore((s) => s.board);
  const { moveTask, addTask, updateTask, deleteTask, clearBoard } = useBoardStore();
  const hydrated = useHasHydrated();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  useEffect(() => {
    useBoardStore.persist.rehydrate();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (over) moveTask(String(active.id), over.id as ColumnId);
  }

  function onDelete(task: Task) {
    if (window.confirm(`Delete task "${task.title}"?`)) deleteTask(task.id);
  }

  if (!hydrated) {
    return <div className="grid gap-4 md:grid-cols-3">{columns.map((c) => <div key={c.id} className="h-[420px] animate-pulse rounded-2xl bg-slate-100" />)}</div>;
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Board</h2>
        {tasks.length > 0 && (
          <button
            type="button"
            onClick={() => window.confirm("Clear the board?") && clearBoard()}
            className="text-xs font-medium text-slate-400 hover:text-red-600"
          >
            Clear board
          </button>
        )}
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveTask(null)}>
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              tasks={tasks.filter((t) => t.columnId === column.id)}
              onAdd={() => setDialog({ mode: "add", columnId: column.id })}
              onEdit={(task) => setDialog({ mode: "edit", task })}
              onDelete={onDelete}
            />
          ))}
        </div>
        <DragOverlay>{activeTask ? <TaskCardView task={activeTask} overlay /> : null}</DragOverlay>
      </DndContext>

      {dialog && (
        <TaskDialog
          title={dialog.mode === "add" ? "New task" : "Edit task"}
          initial={dialog.mode === "edit" ? dialog.task : undefined}
          onClose={closeDialog}
          onSave={(task) => {
            if (dialog.mode === "add") addTask(task, dialog.columnId);
            else updateTask(dialog.task.id, task);
            closeDialog();
          }}
        />
      )}
    </section>
  );
}
