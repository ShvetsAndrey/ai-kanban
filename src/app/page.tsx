import { AnalyzePanel } from "@/components/AnalyzePanel";
import { Board } from "@/components/Board";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-lg text-white shadow-md shadow-indigo-500/30">
          ✦
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">AI Kanban</h1>
          <p className="text-sm text-slate-500">Paste a meeting transcript — AI extracts the tasks and lays them out on the board</p>
        </div>
      </header>
      <AnalyzePanel />
      <Board />
    </main>
  );
}
