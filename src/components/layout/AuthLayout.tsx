import { Link } from 'react-router-dom';
import { Activity, Dumbbell, Sparkles } from 'lucide-react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <section className="auth-showcase" aria-label="FitTrack introduction">
        <Link to="/" className="auth-brand">
          <span className="site-brand-mark"><Dumbbell className="h-5 w-5" /></span>
          FitTrack
        </Link>

        <div className="auth-copy">
          <span className="auth-kicker"><Sparkles className="h-3.5 w-3.5" /> Training, refined</span>
          <h1 className="auth-headline">Build your<br /><span>next level.</span></h1>
          <p className="auth-description">
            A focused space for your training, progress, and nutrition. Make every session count and see your momentum grow.
          </p>
          <div className="auth-metrics" aria-label="FitTrack features">
            <div className="auth-metric"><strong>Train</strong><span>Log every session</span></div>
            <div className="auth-metric"><strong>Measure</strong><span>See real progress</span></div>
            <div className="auth-metric"><strong>Repeat</strong><span>Build consistency</span></div>
          </div>
        </div>

        <div className="auth-showcase-foot"><span /> Your training, in focus <Activity className="ml-1 h-4 w-4 text-slate-500" /></div>
      </section>

      <main className="auth-main">
        <div className="auth-form-column">
          <Link to="/" className="auth-brand auth-mobile-brand">
            <span className="site-brand-mark"><Dumbbell className="h-5 w-5" /></span>
            FitTrack
          </Link>
          {children}
          <p className="mt-6 text-center text-xs text-slate-500">A little better, every session.</p>
        </div>
      </main>
    </div>
  );
}
