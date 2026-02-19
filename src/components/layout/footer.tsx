"use client";

import { Github } from "lucide-react";
import packageJson from "../../../package.json";

const XIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-surface/40 backdrop-blur-sm px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-[10px] text-text-muted uppercase tracking-wider">
        <span>MeatBags Companion</span>
        <span className="text-neon-green/60">v{packageJson.version}</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[10px] text-text-muted">
          Made by <span className="text-rust">Wealthior</span>
        </span>
        <div className="flex items-center gap-2">
          <a
            href="https://x.com/wealthior"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-neon-green transition-colors"
          >
            <XIcon size={12} />
          </a>
          {/* <a
            href="https://github.com/wealthior"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-neon-green transition-colors"
          >
            <Github size={12} />
          </a> */}
        </div>
      </div>
    </footer>
  );
}
