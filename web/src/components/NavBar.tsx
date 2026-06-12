import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CloseIcon, MenuIcon } from "./icons";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/detect", label: "Detect" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/pricing", label: "Pricing" },
];

/** The small orb that anchors the brand in the nav. */
function OrbMark() {
  return (
    <span
      aria-hidden
      className="block h-5 w-5 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), rgba(94,234,212,0.6) 35%, rgba(26,10,46,0.9) 75%)",
        boxShadow: "0 0 14px rgba(45,212,191,0.55)",
      }}
    />
  );
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 backdrop-blur-md bg-midnight/40 md:bg-transparent">
        <Link to="/" className="flex items-center gap-2.5" aria-label="Veritas home">
          <OrbMark />
          <span className="font-display text-lg font-semibold tracking-[0.28em] text-ink">
            VERITAS
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors ${
                  isActive ? "text-teal-200" : "text-mist hover:text-ink"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/detect"
            className="rounded-full border border-teal-300/40 px-4 py-1.5 text-sm font-medium text-teal-200 shadow-[0_0_18px_rgba(45,212,191,0.25)] transition-shadow hover:shadow-[0_0_28px_rgba(45,212,191,0.45)]"
          >
            Try free
          </Link>
        </div>

        <button
          className="text-ink md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon size={26} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col bg-midnight/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between px-5 py-4">
              <span className="font-display text-lg font-semibold tracking-[0.28em]">
                VERITAS
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close menu">
                <CloseIcon size={26} />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-8">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <NavLink
                    to={l.to}
                    className="font-display text-3xl font-medium tracking-wide text-ink"
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
            </div>
            <p className="pb-10 text-center text-xs text-faint">
              Truth still exists. We help you find it.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
