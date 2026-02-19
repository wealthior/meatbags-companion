import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-void text-text-primary">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-rust">404</p>
        <p className="text-sm text-text-muted uppercase tracking-wider">
          Lost in the wasteland, survivor.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-md text-xs font-medium uppercase tracking-wider bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 transition-colors"
        >
          Return to Base
        </Link>
      </div>
    </div>
  );
}
