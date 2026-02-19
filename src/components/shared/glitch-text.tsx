"use client";

import { cn } from "@/lib/utils/cn";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "span" | "p";
}

export function GlitchText({ text, className, as: Tag = "h2" }: GlitchTextProps) {
  return (
    <Tag
      className={cn("glitch font-bold uppercase tracking-wider", className)}
      data-text={text}
    >
      {text}
    </Tag>
  );
}
