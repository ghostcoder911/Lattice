import Link from "next/link";

export function AppHeader() {
  return (
    <header className="flex h-14 items-center border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/board" className="font-semibold text-zinc-100">
          Lattice
        </Link>
        <nav className="hidden gap-4 text-sm text-zinc-400 sm:flex">
          <Link href="/board" className="hover:text-zinc-200">
            Board
          </Link>
          <Link href="/time-clock" className="hover:text-zinc-200">
            Time clock
          </Link>
        </nav>
      </div>
    </header>
  );
}
