import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold " +
  "tracking-wide transition-all duration-300 select-none";

const variants = {
  primary:
    "bg-teal-300/90 text-abyss px-7 py-3.5 text-base hover:bg-teal-200 " +
    "shadow-[0_0_28px_rgba(45,212,191,0.35)] hover:shadow-[0_0_44px_rgba(45,212,191,0.55)] " +
    "hover:scale-[1.02] active:scale-[0.99]",
  ghost:
    "border border-white/15 text-ink px-6 py-3 text-sm hover:border-teal-300/50 " +
    "hover:shadow-[0_0_24px_rgba(45,212,191,0.2)]",
};

interface CommonProps {
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
}

export function GlowLink({
  to,
  variant = "primary",
  className = "",
  children,
}: CommonProps & { to: string }) {
  return (
    <Link to={to} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function GlowButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`${base} ${variants[variant]} ${className} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100`}
    >
      {children}
    </button>
  );
}
