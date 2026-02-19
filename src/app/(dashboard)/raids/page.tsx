"use client";

import { Swords, Target, TrendingUp, Award } from "lucide-react";
import { GlitchText } from "@/components/shared/glitch-text";
import { StatCard } from "@/components/shared/stat-card";

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

      {/* Placeholder Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Raids" value="—" icon={Swords} accent="green" />
        <StatCard label="Success Rate" value="—" icon={Target} accent="gold" />
        <StatCard label="Rewards" value="—" icon={TrendingUp} accent="purple" />
        <StatCard label="Best Raid" value="—" icon={Award} accent="rust" />
      </div>

      {/* Coming Soon */}
      <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center mx-auto mb-4">
          <Swords size={20} className="text-neon-green" />
        </div>
        <h3 className="text-sm font-bold text-text-primary mb-2">
          Raid Tracking Coming Soon
        </h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Raid statistics will be available once on-chain raid data can be accessed.
          Your Prep Points directly influence raid success — keep staking!
        </p>
      </div>
    </div>
  );
}
