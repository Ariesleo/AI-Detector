import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="relative mt-28 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-center font-display text-lg tracking-wide text-ink/90">
          Truth still exists.{" "}
          <span className="text-teal-200">We help you find it.</span>
        </p>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 text-sm text-faint sm:flex-row">
          <span className="font-display tracking-[0.24em]">VERITAS</span>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/detect" className="hover:text-mist">Detect</Link>
            <Link to="/how-it-works" className="hover:text-mist">How it works</Link>
            <Link to="/about" className="hover:text-mist">About</Link>
            <Link to="/pricing" className="hover:text-mist">Pricing</Link>
          </div>
          <span>© {new Date().getFullYear()} Veritas</span>
        </div>
      </div>
    </footer>
  );
}
