import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { Aurora } from "./components/Aurora";
import { Footer } from "./components/Footer";
import { NavBar } from "./components/NavBar";
import { Particles } from "./components/Particles";
import { RequireAuth } from "./components/RequireAuth";
import { About } from "./pages/About";
import { Detect } from "./pages/Detect";
import { History } from "./pages/History";
import { Home } from "./pages/Home";
import { HowItWorks } from "./pages/HowItWorks";
import { Login } from "./pages/Login";
import { Pricing } from "./pages/Pricing";

/**
 * Portal page transition: on every navigation the outgoing page collapses
 * toward a glowing dot, and the incoming page emerges from it.
 */
function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!location.hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname, location.hash]);

  // Detect page keeps the aurora quieter — focus on the scan.
  const intensity = location.pathname === "/detect" ? 0.45 : 1;

  return (
    <>
      <Aurora intensity={intensity} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.35, ease: [0.3, 0.6, 0.3, 1] }}
        >
          {/* the portal dot — contracts away as each page arrives */}
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none fixed left-1/2 top-1/2 z-40 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(160,255,235,0.9), rgba(45,212,191,0.45) 45%, transparent 70%)",
                boxShadow: "0 0 80px 40px rgba(45,212,191,0.25)",
              }}
              initial={{ scale: 26, opacity: 1 }}
              animate={{ scale: 0, opacity: 0 }}
              exit={{ scale: 26, opacity: 1 }}
              transition={{ duration: 0.45, ease: [0.6, 0.05, 0.4, 1] }}
            />
          )}
          <main className="relative flex min-h-screen flex-col pt-20">
            <div className="flex-1">
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/detect" element={<Detect />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/about" element={<About />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/history"
                  element={
                    <RequireAuth>
                      <History />
                    </RequireAuth>
                  }
                />
                <Route path="*" element={<Home />} />
              </Routes>
            </div>
            <Footer />
          </main>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Particles />
      <NavBar />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
