import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ROLE_HOME } from '../../config/navigation';
import {
  MonitorCog, Wrench, Lightbulb, Lock, Mail, Leaf,
  Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, Sparkles,
} from 'lucide-react';

const FEATURES = [
  { icon: MonitorCog, title: 'IT Support', desc: 'Log and track technology issues end to end.' },
  { icon: Wrench, title: 'Maintenance', desc: 'Report facility and equipment problems fast.' },
  { icon: Lightbulb, title: 'Improvements', desc: 'Share ideas that make the hospital better.' },
];

const DEMO_ACCOUNTS = [
  { label: 'Sys Admin', email: 'admin@newleaf.com' },
  { label: 'Admin', email: 'hospital.admin@newleaf.com' },
  { label: 'IT Supervisor', email: 'john.it@newleaf.com' },
  { label: 'IT Tech', email: 'mike.tech@newleaf.com' },
  { label: 'Maint. Supervisor', email: 'ahmed.maint@newleaf.com' },
  { label: 'Maint. Tech', email: 'ali.maint@newleaf.com' },
  { label: 'Staff (Nurse)', email: 'fatima.nurse@newleaf.com' },
  { label: 'Staff (Doctor)', email: 'omar.doctor@newleaf.com' },
];

const DEMO_PASSWORD = 'password123';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoUser, setDemoUser] = useState('admin@newleaf.com');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Login successful');
      navigate(ROLE_HOME[data.user.role_name] || '/dashboard');
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
    <div className="relative min-h-screen overflow-hidden bg-primary-950 flex items-center justify-center p-4 sm:p-6">
      {/* Ambient animated background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-[26rem] w-[26rem] rounded-full bg-accent-500/30 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-primary-500/40 blur-3xl animate-blob"
          style={{ animationDelay: '-7s', animationDuration: '26s' }}
        />
        <div
          className="absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary-400/20 blur-3xl animate-blob"
          style={{ animationDelay: '-13s', animationDuration: '32s' }}
        />
        {/* Faint grid overlay for depth */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <div className="relative w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-fade-in-up">
        {/* ── Brand panel ─────────────────────────────────────────────── */}
        <div className="relative hidden lg:flex flex-col justify-between p-10 xl:p-12 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/20 animate-float" />
            <div
              className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/15 animate-float"
              style={{ animationDelay: '-2.5s' }}
            />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent-400/20 blur-2xl" />
          </div>

          <div className="relative flex items-center gap-3 animate-fade-in-left">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/25 animate-float">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-xl leading-tight">New Leaf Complex</div>
              <div className="text-primary-100 text-sm">Operations System</div>
            </div>
          </div>

          <div className="relative">
            <div
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-50 ring-1 ring-white/20 mb-5 animate-fade-in-left"
              style={{ animationDelay: '80ms' }}
            >
              <Sparkles className="w-3.5 h-3.5" /> One place for every request
            </div>
            <h1
              className="text-3xl xl:text-4xl font-bold leading-tight mb-3 animate-fade-in-left"
              style={{ animationDelay: '150ms' }}
            >
              Operations Request &amp; Improvement System
            </h1>
            <p
              className="text-primary-100/90 mb-8 max-w-sm animate-fade-in-left"
              style={{ animationDelay: '220ms' }}
            >
              A single, transparent platform for IT support, maintenance, and staff ideas across the hospital.
            </p>

            <div className="space-y-4">
              {FEATURES.map((feature, i) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 animate-fade-in-left"
                  style={{ animationDelay: `${290 + i * 90}ms` }}
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{feature.title}</div>
                    <div className="text-sm text-primary-100/80">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative flex items-center gap-2 text-sm text-primary-100/80 animate-fade-in"
            style={{ animationDelay: '640ms' }}
          >
            <ShieldCheck className="w-4 h-4" />
            © 2026 New Leaf Complex Operations System
          </div>
        </div>

        {/* ── Form panel ──────────────────────────────────────────────── */}
        <div className="bg-white p-8 sm:p-10 xl:p-12">
          <div
            className="lg:hidden flex items-center gap-3 mb-8 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center text-white shadow-lg shadow-primary-600/25">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-gray-800">New Leaf Complex</div>
              <div className="text-xs text-gray-500">Operations System</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            Welcome back
          </h2>
          <p className="text-gray-500 mt-1 mb-6 animate-fade-in-up" style={{ animationDelay: '170ms' }}>
            Sign in to continue to your workspace
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in-down">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="animate-fade-in-up" style={{ animationDelay: '230ms' }}>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 transition-shadow focus:ring-2 focus:ring-primary-500/70 focus:border-primary-500 outline-none"
                  placeholder="you@newleaf.com"
                />
              </div>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '290ms' }}>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 placeholder-gray-400 transition-shadow focus:ring-2 focus:ring-primary-500/70 focus:border-primary-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
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
              style={{ animationDelay: '350ms' }}
              className="group w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-600/25 hover:from-primary-700 hover:to-primary-600 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 focus:ring-2 focus:ring-primary-500/60 focus:ring-offset-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 animate-fade-in-up"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 animate-fade-in-up" style={{ animationDelay: '430ms' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium tracking-wide">DEMO ACCOUNTS</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3">
              <p className="text-xs text-gray-500 mb-2">
                Tap a role to fill the form · password{' '}
                <span className="font-semibold text-gray-700">{DEMO_PASSWORD}</span>
              </p>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-0.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemoAccount(acc)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      demoUser === acc.email
                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:-translate-y-0.5'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
