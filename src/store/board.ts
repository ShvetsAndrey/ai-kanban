import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Column, ColumnId, ExtractedTask, Task } from "@/lib/types";

export const COLUMNS: Column[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

interface BoardState {
  board: {
    columns: Column[];
    tasks: Task[];
  };
  addTask: (task: ExtractedTask, columnId?: ColumnId) => void;
  addTasks: (tasks: ExtractedTask[]) => void;
  moveTask: (taskId: string, newColumnId: ColumnId) => void;
  updateTask: (taskId: string, patch: Partial<Omit<Task, "id">>) => void;
  deleteTask: (taskId: string) => void;
  clearBoard: () => void;
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      board: { columns: COLUMNS, tasks: [] },

      addTask: (task, columnId = "todo") =>
        set(({ board }) => ({
          board: { ...board, tasks: [...board.tasks, { ...task, id: newId(), columnId }] },
        })),

      addTasks: (tasks) =>
        set(({ board }) => ({
          board: {
            ...board,
            tasks: [...tasks.map((t) => ({ ...t, id: newId(), columnId: "todo" as const })), ...board.tasks],
          },
        })),

      moveTask: (taskId, newColumnId) =>
        set(({ board }) => {
          const task = board.tasks.find((t) => t.id === taskId);
          if (!task || task.columnId === newColumnId) return {};
          // Moved task goes to the end of its new column.
          const rest = board.tasks.filter((t) => t.id !== taskId);
          return { board: { ...board, tasks: [...rest, { ...task, columnId: newColumnId }] } };
        }),

      updateTask: (taskId, patch) =>
        set(({ board }) => ({
          board: {
            ...board,
            tasks: board.tasks.map((t) => (t.id === taskId ? { ...t, ...patch, id: t.id } : t)),
          },
        })),

      deleteTask: (taskId) =>
        set(({ board }) => ({
          board: { ...board, tasks: board.tasks.filter((t) => t.id !== taskId) },
        })),

      clearBoard: () => set(({ board }) => ({ board: { ...board, tasks: [] } })),
    }),
    {
      name: "ai-kanban-board",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ board: state.board }),
      // Rehydrated manually on the client to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
);

export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useBoardStore.persist.onFinishHydration(onChange),
    () => useBoardStore.persist.hasHydrated(),
    () => false,
  );
}
