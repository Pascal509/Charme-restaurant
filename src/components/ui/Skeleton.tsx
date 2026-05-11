import React from "react";

export type SkeletonProps = {
  className?: string;
  height?: string | number;
  width?: string | number;
  as?: keyof JSX.IntrinsicElements;
};

export default function Skeleton({ className, height = "1rem", width = "100%", as: Tag = "div" }: SkeletonProps) {
  const style: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: typeof width === "number" ? `${width}px` : width
  };

  const classes = "skeleton rounded-lg bg-white/6 animate-pulse" + (className ? ` ${className}` : "");
  return <Tag className={classes} style={style} />;
}
