export type Priority = "high" | "medium" | "low";

export type ColumnId = "todo" | "in-progress" | "done";

export interface Column {
  id: ColumnId;
  title: string;
}

export interface Task {
  id: string;
  columnId: ColumnId;
  title: string;
  description: string;
  priority: Priority;
  assignee: string | null;
}

/** Task shape returned by the AI before it is placed on the board. */
export type ExtractedTask = Omit<Task, "id" | "columnId">;
