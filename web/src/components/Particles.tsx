import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

interface P {
  x: number;
  y: number;
  z: number; // depth 0.3..1 — drives size, alpha, parallax
  vx: number;
  vy: number;
  tw: number; // twinkle phase
}

/**
 * Sparse dust-in-a-light-beam particle field. Drifts slowly, reacts gently
 * to the mouse. Static under prefers-reduced-motion.
 */
export function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let parts: P[] = [];
    const mouse = { x: 0, y: 0 }; // -0.5..0.5 from center
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(80, Math.round((w * h) / 26000));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -0.04 - Math.random() * 0.1,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX / w - 0.5;
      mouse.y = e.clientY / h - 0.5;
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (!reduce) {
          p.x += p.vx * p.z;
          p.y += p.vy * p.z;
          if (p.y < -4) (p.y = h + 4), (p.x = Math.random() * w);
          if (p.x < -4) p.x = w + 4;
          if (p.x > w + 4) p.x = -4;
        }
        const px = p.x - mouse.x * 26 * p.z;
        const py = p.y - mouse.y * 26 * p.z;
        const twinkle = 0.6 + 0.4 * Math.sin(t / 1400 + p.tw);
        ctx.beginPath();
        ctx.arc(px, py, 0.7 + p.z * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(190, 215, 230, ${0.06 + 0.16 * p.z * twinkle})`;
        ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
