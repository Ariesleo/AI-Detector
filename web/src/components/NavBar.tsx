import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { authEnabled, supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { CloseIcon, MenuIcon } from "./icons";

const LINKS = [
  { to: "/detect", label: "Detect" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/pricing", label: "Pricing" },
];

/** The small orb that anchors the brand in the nav. */
function OrbMark() {
  return (
    <span
      aria-hidden
      className="block h-6 w-6 rounded-full"
      style={{
        background:
          "radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9), rgba(94,234,212,0.65) 38%, rgba(26,10,46,0.92) 76%)",
        boxShadow: "0 0 16px rgba(45,212,191,0.5)",
      }}
    />
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[13px] uppercase tracking-[0.18em] transition-colors ${
    isActive ? "text-teal-200" : "text-mist hover:text-ink"
  }`;

/** Signed-in avatar with a dropdown: email, History, sign out. */
function AccountMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email.trim()[0] || "?").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold text-abyss transition-transform hover:scale-105"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #d7fff5, #5eead4 55%, #2dd4bf)",
          boxShadow: "0 0 16px rgba(45,212,191,0.45)",
        }}
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-3 w-60 overflow-hidden rounded-2xl border border-white/10 bg-midnight/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="border-b border-white/5 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-faint">Signed in as</p>
              <p className="mt-0.5 truncate text-sm text-ink">{email}</p>
            </div>
            <Link
              to="/history"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-mist transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              Scan history
            </Link>
            <button
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="block w-full px-4 py-3 text-left text-sm text-mist transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const email = session?.user.email ?? "";

  const signOut = async () => {
    await supabase?.auth.signOut();
    navigate("/");
  };

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 backdrop-blur-md bg-midnight/30 md:bg-transparent">
        <Link to="/" className="flex items-center gap-3" aria-label="Veritas home">
          <OrbMark />
          <span className="font-display text-lg font-semibold tracking-[0.34em] text-ink">
            VERITAS
          </span>
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}

          {session ? (
            <AccountMenu email={email} onSignOut={signOut} />
          ) : (
            <>
              {authEnabled && (
                <NavLink to="/login" className={linkClass}>
                  Sign in
                </NavLink>
              )}
              <Link
                to="/detect"
                className="rounded-full bg-teal-300/90 px-5 py-2 text-[13px] font-semibold tracking-wide text-abyss shadow-[0_0_22px_rgba(45,212,191,0.4)] transition-all hover:scale-[1.03] hover:bg-teal-200"
              >
                Try free
              </Link>
            </>
          )}
        </div>

        <button
          className="-mr-2 flex h-10 w-10 items-center justify-center text-ink md:hidden"
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
            <div className="flex items-center justify-between px-6 py-5">
              <span className="font-display text-lg font-semibold tracking-[0.34em]">
                VERITAS
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="-mr-2 flex h-10 w-10 items-center justify-center"
              >
                <CloseIcon size={26} />
              </button>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center gap-8">
              {[...LINKS, ...(session ? [{ to: "/history", label: "History" }] : [])].map(
                (l, i) => (
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
                ),
              )}
              {authEnabled && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-center"
                >
                  {session ? (
                    <>
                      <p className="mb-3 text-sm text-faint">{email}</p>
                      <button onClick={signOut} className="text-lg text-mist">
                        Sign out
                      </button>
                    </>
                  ) : (
                    <NavLink to="/login" className="text-lg text-teal-200">
                      Sign in
                    </NavLink>
                  )}
                </motion.div>
              )}
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
