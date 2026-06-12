import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

interface OrbProps {
  size?: number;
  /** mini = brand anchor: glow + glass only, no morphing shapes */
  mini?: boolean;
  className?: string;
}

/**
 * The Veritas orb — a glass lens breathing with the aurora. Inside it a
 * face, a waveform, and a document slowly morph into each other:
 * content goes in, truth comes out. Canvas implementation (no three.js)
 * so it stays light and degrades to a static frame under reduced motion.
 */
export function Orb({ size = 320, mini = false, className }: OrbProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const c = size / 2;
      const breath = 1 + 0.022 * Math.sin(t * 0.45); // slow breathing pulse
      const R = c * 0.78 * breath;
      const hue = 185 + 38 * Math.sin(t * 0.07); // teal <-> violet drift

      ctx.clearRect(0, 0, size, size);

      // ambient halo refracting the aurora
      let g = ctx.createRadialGradient(c, c, R * 0.3, c, c, c);
      g.addColorStop(0, `hsla(${hue}, 85%, 62%, 0.16)`);
      g.addColorStop(0.6, `hsla(${hue + 70}, 70%, 50%, 0.08)`);
      g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      // glass body
      g = ctx.createRadialGradient(c - R * 0.35, c - R * 0.4, R * 0.08, c, c, R);
      g.addColorStop(0, "rgba(255,255,255,0.10)");
      g.addColorStop(0.35, `hsla(${hue}, 55%, 42%, 0.10)`);
      g.addColorStop(0.82, "rgba(8,12,26,0.55)");
      g.addColorStop(1, `hsla(${hue + 50}, 75%, 58%, 0.22)`);
      ctx.beginPath();
      ctx.arc(c, c, R, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      // luminous rim
      const rim = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
      rim.addColorStop(0, `hsla(${hue}, 90%, 75%, 0.65)`);
      rim.addColorStop(0.5, "rgba(255,255,255,0.10)");
      rim.addColorStop(1, `hsla(${hue + 70}, 90%, 70%, 0.45)`);
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = rim;
      ctx.stroke();

      // top-left highlight (lens feel)
      ctx.beginPath();
      ctx.ellipse(c - R * 0.32, c - R * 0.46, R * 0.42, R * 0.17, -0.6, 0, Math.PI * 2);
      const hl = ctx.createRadialGradient(
        c - R * 0.32, c - R * 0.46, 0,
        c - R * 0.32, c - R * 0.46, R * 0.45,
      );
      hl.addColorStop(0, "rgba(255,255,255,0.14)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hl;
      ctx.fill();

      if (!mini) {
        // morph cycle: face -> waveform -> document, ~21s full loop
        const seg = 7;
        const phase = (t % (seg * 3)) / seg; // 0..3
        const weight = (i: number) => {
          let d = Math.abs(phase - (i + 0.5));
          d = Math.min(d, 3 - d);
          return Math.max(0, Math.min(1, 1.35 - d * 1.7));
        };
        ctx.save();
        ctx.beginPath();
        ctx.arc(c, c, R * 0.94, 0, Math.PI * 2);
        ctx.clip();
        drawFace(ctx, c, R, t, weight(0), hue);
        drawWave(ctx, c, R, t, weight(1), hue);
        drawDoc(ctx, c, R, t, weight(2), hue);
        ctx.restore();
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size, mini, reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

function stroke(ctx: CanvasRenderingContext2D, hue: number, a: number, lw = 1.6) {
  ctx.strokeStyle = `hsla(${hue}, 80%, 82%, ${a})`;
  ctx.lineWidth = lw;
  ctx.shadowColor = `hsla(${hue}, 90%, 65%, ${a * 0.9})`;
  ctx.shadowBlur = 12;
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  c: number, R: number, t: number, w: number, hue: number,
) {
  if (w <= 0.01) return;
  const a = w * 0.55;
  const y = c + Math.sin(t * 0.6) * R * 0.02;
  ctx.save();
  stroke(ctx, hue, a);
  // head
  ctx.beginPath();
  ctx.ellipse(c, y, R * 0.3, R * 0.38, 0, 0, Math.PI * 2);
  ctx.stroke();
  // eyes
  ctx.beginPath();
  ctx.arc(c - R * 0.11, y - R * 0.08, R * 0.045, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c + R * 0.11, y - R * 0.08, R * 0.045, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // mouth
  ctx.beginPath();
  ctx.arc(c, y + R * 0.1, R * 0.1, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  c: number, R: number, t: number, w: number, hue: number,
) {
  if (w <= 0.01) return;
  const a = w * 0.6;
  ctx.save();
  stroke(ctx, hue, a, 1.8);
  ctx.beginPath();
  const span = R * 1.1;
  for (let i = 0; i <= 60; i++) {
    const x = c - span / 2 + (span * i) / 60;
    const u = (i / 60) * 2 - 1; // -1..1
    const env = Math.exp(-u * u * 3.2); // gaussian envelope
    const yy =
      c +
      Math.sin(u * 9 + t * 1.7) * env * R * 0.2 * (0.75 + 0.25 * Math.sin(t * 0.9));
    if (i === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawDoc(
  ctx: CanvasRenderingContext2D,
  c: number, R: number, t: number, w: number, hue: number,
) {
  if (w <= 0.01) return;
  const a = w * 0.55;
  const dw = R * 0.52;
  const dh = R * 0.68;
  const x = c - dw / 2;
  const y = c - dh / 2 + Math.sin(t * 0.7) * R * 0.02;
  ctx.save();
  stroke(ctx, hue, a);
  ctx.beginPath();
  ctx.roundRect(x, y, dw, dh, R * 0.05);
  ctx.stroke();
  ctx.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    const ly = y + dh * 0.24 + i * dh * 0.16;
    const lw = dw * (i === 3 ? 0.45 : 0.7);
    ctx.beginPath();
    ctx.moveTo(x + dw * 0.15, ly);
    ctx.lineTo(x + dw * 0.15 + lw, ly);
    ctx.stroke();
  }
  ctx.restore();
}
