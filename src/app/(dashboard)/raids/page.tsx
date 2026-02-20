"use client";

import { GlitchText } from "@/components/shared/glitch-text";
import { WipBanner } from "@/components/shared/wip-banner";

export default function RaidsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <GlitchText text="Raids" className="text-lg text-text-primary" />
        <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">
          Raid statistics & performance
        </p>
      </div>

      {/* WIP */}
      <WipBanner
        title="Raids Coming Soon"
        subtitle="This combat zone is being prepared. Raid tracking will be available once on-chain raid data can be accessed. Keep stacking Prep Points, survivor."
      />
    </div>
  );
}
