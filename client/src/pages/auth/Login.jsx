import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../config/navigation';
import AuthBackdrop from '../../components/AuthBackdrop';
import {
  Leaf, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight,
  ChevronDown, Sparkles, ShieldCheck, AlertCircle,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Sys Admin', email: 'admin@newleaf.com' },
  { label: 'Admin', email: 'hospital.admin@newleaf.com' },
  { label: 'IT Supervisor', email: 'john.it@newleaf.com' },
  { label: 'IT Tech', email: 'mike.tech@newleaf.com' },
  { label: 'Maint. Sup.', email: 'ahmed.maint@newleaf.com' },
  { label: 'Maint. Tech', email: 'ali.maint@newleaf.com' },
  { label: 'Nurse', email: 'fatima.nurse@newleaf.com' },
  { label: 'Doctor', email: 'omar.doctor@newleaf.com' },
];

const DEMO_PASSWORD = 'password123';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoUser, setDemoUser] = useState('');

  // The landing page is the app home: a signed-in visitor goes straight to
  // their workspace instead of seeing the form again.
  useEffect(() => {
    if (user) navigate(ROLE_HOME[user.role_name] || '/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome back');
      navigate(ROLE_HOME[data.user.role_name] || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (account) => {
    setEmail(account.email);
    setPassword(DEMO_PASSWORD);
    setDemoUser(account.email);
    setError('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-12">
      <AuthBackdrop />

      <main className="relative w-full max-w-md">
        {/* ── Brand ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center animate-fade-in-up">
          <div className="relative">
            <span className="absolute inset-0 rounded-2xl bg-primary-500/40 blur-xl animate-pulse" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-xl shadow-primary-900/60 animate-float">
              <Leaf className="w-7 h-7" />
            </div>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">New Leaf Complex</h1>
          <p className="text-sm text-primary-200/70">Operations System</p>
          <p className="mt-3 max-w-[22rem] text-center text-[13px] leading-relaxed text-primary-100/55">
            One place for hospital requests, maintenance and improvement ideas.
          </p>
        </div>

        {/* ── Sign-in card ──────────────────────────────────────────────── */}
        <div
          className="mt-8 rounded-2xl bg-white p-7 sm:p-8 shadow-2xl shadow-primary-950/60 ring-1 ring-white/10 animate-fade-in-up"
          style={{ animationDelay: '120ms' }}
        >
          <h2 className="text-lg font-semibold text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-gray-500">Use your hospital account.</p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 animate-fade-in-down">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@newleaf.com"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-11 text-sm text-gray-900 placeholder-gray-400 transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 py-2.5 font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:from-primary-700 hover:to-primary-600 hover:shadow-xl focus:ring-2 focus:ring-primary-500/60 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* ── Demo accounts (collapsed) ────────────────────────────────── */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              aria-expanded={showDemo}
              className="flex w-full items-center justify-between text-sm font-medium text-gray-600 transition-colors hover:text-primary-700"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Demo accounts
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDemo ? 'rotate-180' : ''}`} />
            </button>

            {showDemo && (
              <div className="mt-3 grid grid-cols-2 gap-1.5 animate-fade-in-up">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemoAccount(acc)}
                    className={`truncate rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                      demoUser === acc.email
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                        : 'border border-gray-200 bg-white text-gray-600 hover:-translate-y-0.5 hover:border-primary-400 hover:text-primary-700'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            )}

            <p className="mt-2 text-xs text-gray-400">
              Shared password: <span className="font-medium text-gray-600">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </div>

        <p
          className="mt-6 flex items-center justify-center gap-1.5 text-xs text-primary-200/50 animate-fade-in"
          style={{ animationDelay: '320ms' }}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Secure hospital access
        </p>
      </main>
    </div>
  );
}
