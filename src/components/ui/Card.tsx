import React from "react";

export type CardProps = React.PropsWithChildren<{
  className?: string;
  variant?: "glass" | "solid";
}>;

export default function Card({ children, className, variant = "glass" }: CardProps) {
  const base = "overflow-hidden rounded-2xl border p-6 transition";
  const variantClass =
    variant === "glass"
      ? "glass-card border-brand-ink/10 bg-white/5 shadow-soft card-hover"
      : "bg-white text-black shadow-sm";

  const classes = `${base} ${variantClass}` + (className ? ` ${className}` : "");

  return <div className={classes}>{children}</div>;
}
