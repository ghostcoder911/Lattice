import { AppHeader } from "@/components/AppHeader";
import { TimeClockView } from "./TimeClockView";

export default function TimeClockPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppHeader />
      <main className="mx-auto max-w-[960px] p-4">
        <TimeClockView />
      </main>
    </div>
  );
}
