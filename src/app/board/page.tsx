import { AppHeader } from "@/components/AppHeader";
import { BoardView } from "./BoardView";

export default function BoardPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] p-4">
        <BoardView />
      </main>
    </div>
  );
}
