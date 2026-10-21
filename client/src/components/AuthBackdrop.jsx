/**
 * Animated backdrop for the landing / sign-in page.
 *
 * Layers, back to front:
 *   0. hospital photograph with a slow Ken Burns drift
 *   1. light grade + edge vignette, so the photo reads clearly while the
 *      white heading and footer text stay readable
 *   2. four drifting aurora orbs, screen-blended over the photo
 *   3. rotating sheen for depth
 *   4. fine grid that drifts
 *   5. film grain for a photographic finish
 *
 * The aurora colours come from the Tailwind theme tokens
 * (`--color-primary-*`, `--color-accent-*`), so the backdrop re-themes with
 * the configured accent.
 *
 * Photograph: "backgound image.png", supplied with the project.
 */
import hospitalBg from '../assets/hospital-bg.jpg';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function AuthBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 isolate overflow-hidden bg-slate-950" aria-hidden="true">
      {/* 0 — hospital photograph */}
      <img
        src={hospitalBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center animate-ken-burns will-change-transform"
        draggable="false"
      />

      {/* 1 — light grade + edge vignette (keeps the photo readable) */}
      <div className="absolute inset-0 bg-slate-950/25" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_95%_at_50%_42%,transparent_40%,rgba(2,6,23,.55)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,.72)_0%,rgba(2,6,23,.45)_18%,rgba(2,6,23,.1)_34%,transparent_48%,rgba(2,6,23,.35)_78%,rgba(2,6,23,.6)_100%)]" />

      {/* 2 — aurora orbs (static blur, animated transform, screen-blended) */}
      <div className="absolute -top-[22%] -left-[12%] h-[42rem] w-[42rem] animate-aurora-1 will-change-transform mix-blend-screen">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-primary-500),transparent_66%)] opacity-30 blur-[90px]" />
      </div>
      <div className="absolute -bottom-[26%] -right-[14%] h-[46rem] w-[46rem] animate-aurora-2 will-change-transform mix-blend-screen">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,var(--color-accent-500),transparent_66%)] opacity-25 blur-[100px]" />
      </div>
      <div className="absolute top-[18%] right-[6%] h-[34rem] w-[34rem] animate-aurora-3 will-change-transform mix-blend-screen">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,#8b5cf6,transparent_68%)] opacity-22 blur-[95px]" />
      </div>
      <div className="absolute bottom-[6%] left-[16%] h-[30rem] w-[30rem] animate-aurora-4 will-change-transform mix-blend-screen">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle_at_center,#38bdf8,transparent_68%)] opacity-20 blur-[90px]" />
      </div>

      {/* 3 — rotating sheen */}
      <div className="absolute -left-1/4 -top-1/3 h-[150%] w-[150%] animate-sheen opacity-30 mix-blend-soft-light">
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
        className="absolute inset-0 opacity-[0.05] animate-drift"
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
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '240px 240px' }}
      />
    </div>
  );
}
