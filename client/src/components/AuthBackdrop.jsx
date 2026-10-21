/**
 * Animated backdrop for the landing / sign-in page.
 *
 * It is drawn entirely with layers (no image assets) so it stays crisp on any
 * display, weighs nothing, and re-themes with the configured accent because
 * every colour is taken from the Tailwind theme tokens
 * (`--color-primary-*`, `--color-accent-*`).
 *
 * Layers, back to front:
 *   1. deep base wash
 *   2. four slow-drifting aurora orbs (blurred once, transformed per frame)
 *   3. rotating sheen for depth
 *   4. fine grid that drifts
 *   5. film grain for a photographic finish
 *   6. vignette so the sign-in card stays the focus
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-slate-950" aria-hidden="true">
      {/* 1 — base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_50%_-10%,var(--color-primary-900),transparent_62%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020617_0%,#0b1220_55%,#020617_100%)]" />

      {/* 2 — aurora orbs (static blur, animated transform) */}
      <div className="absolute -top-[22%] -left-[12%] h-[42rem] w-[42rem] animate-aurora-1 will-change-transform">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-primary-500),transparent_66%)] opacity-70 blur-[90px]" />
      </div>
      <div className="absolute -bottom-[26%] -right-[14%] h-[46rem] w-[46rem] animate-aurora-2 will-change-transform">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-accent-500),transparent_66%)] opacity-55 blur-[100px]" />
      </div>
      <div className="absolute top-[18%] right-[6%] h-[34rem] w-[34rem] animate-aurora-3 will-change-transform">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,#8b5cf6,transparent_68%)] opacity-45 blur-[95px]" />
      </div>
      <div className="absolute bottom-[6%] left-[16%] h-[30rem] w-[30rem] animate-aurora-4 will-change-transform">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,#38bdf8,transparent_68%)] opacity-40 blur-[90px]" />
      </div>

      {/* 3 — rotating sheen */}
      <div className="absolute -left-1/4 -top-1/3 h-[150%] w-[150%] animate-sheen opacity-40 mix-blend-soft-light">
        <div
          className="h-full w-full opacity-60"
          style={{
            background:
              'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,.35) 70deg, transparent 140deg, rgba(255,255,255,.18) 220deg, transparent 300deg)',
          }}
        />
      </div>

      {/* 4 — drifting grid */}
      <div
        className="absolute inset-0 opacity-[0.07] animate-drift"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(120% 90% at 50% 25%, #000 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 50% 25%, #000 30%, transparent 78%)',
        }}
      />

      {/* 5 — film grain */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '240px 240px' }}
      />

      {/* 6 — vignette + focus spotlight behind the card */}
      <div className="absolute inset-0 bg-[radial-gradient(75%_55%_at_50%_45%,transparent,rgba(2,6,23,.75))]" />
      <div className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.07),transparent_62%)] blur-2xl" />
    </div>
  );
}
