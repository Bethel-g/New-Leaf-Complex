import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation, NavLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Bell, User, LogOut, Menu, X, ChevronDown,
  Search, MonitorPlay, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';
import { getNavGroups, NAV_ICONS } from '../config/navigation';
import { ticketKind } from './TicketTable';

export default function Layout() {
  const { user, logout } = useAuth();
  const { publicSettings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [signageOffline, setSignageOffline] = useState(null);

  const hospitalName = publicSettings.hospital_name || 'New Leaf Complex';
  const showSignage = ['it_staff', 'it_supervisor', 'admin', 'sys_admin'].includes(user?.role_name);

  useEffect(() => {
    const loadUnread = () => {
      api.get('/notifications/unread-count').then((res) => setUnreadCount(res.data.count)).catch(() => {});
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    window.addEventListener('focus', loadUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', loadUnread);
    };
  }, []);

  // Signage health is fetched once per app load (the endpoint has side effects,
  // so it is intentionally not polled) and only for roles that can see it.
  useEffect(() => {
    if (!showSignage) return;
    api.get('/multimedia/dashboard')
      .then((res) => setSignageOffline(res.data?.totals?.offline ?? 0))
      .catch(() => setSignageOffline(null));
  }, [showSignage]);

  const runSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    try {
      const [ticketRes, suggestionRes] = await Promise.all([
        api.get('/tickets', { params: { search: q, limit: 5 } }),
        api.get('/suggestions', { params: { search: q, limit: 5 } }),
      ]);
      const ticket = ticketRes.data?.tickets?.[0];
      if (ticket) {
        setQuery('');
        navigate(ticketKind(ticket) === 'maintenance' ? `/maintenance/tickets/${ticket.id}` : `/it/tickets/${ticket.id}`);
        return;
      }
      const suggestion = suggestionRes.data?.suggestions?.[0];
      if (suggestion) {
        setQuery('');
        navigate(`/suggestions/${suggestion.id}`);
        return;
      }
      toast.error(`No requests or suggestions match “${q}”`);
    } catch {
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const navGroups = getNavGroups(user?.role_name);

  const renderNav = (landmarkLabel) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div
          className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-900/40 ring-1 ring-white/20"
          aria-hidden="true"
        >
          NL
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">New Leaf Complex</div>
          <div className="text-primary-200/70 text-xs">Operations System</div>
        </div>
      </div>
      <nav aria-label={landmarkLabel} className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-primary-200/50 mb-2">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item) => {
                const ItemIcon = NAV_ICONS[item.icon] || LayoutDashboard;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-900/40'
                          : 'text-primary-100/70 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <ItemIcon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/10">
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-primary-100/70 hover:bg-white/10 hover:text-white transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-primary-50/60">
      {/* Desktop sidebar */}
      <aside
        aria-label="Sidebar"
        className="hidden lg:block print:hidden fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-900 via-primary-950 to-slate-950 z-30 border-r border-white/5"
      >
        {renderNav('Main navigation')}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden print:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            aria-label="Sidebar"
            className="absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-900 via-primary-950 to-slate-950 animate-fade-in-left"
          >
            <button aria-label="Close navigation menu" className="absolute top-4 right-4 text-primary-200/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            {renderNav('Mobile navigation')}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64 print:pl-0">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/70 sticky top-0 z-20 shadow-sm shadow-slate-900/5 print:hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button aria-label="Open navigation menu" aria-expanded={sidebarOpen} className="lg:hidden text-gray-600 p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </button>
              <div className="hidden sm:block text-sm text-gray-500">
                <h1 className="text-lg font-semibold text-gray-800 leading-tight">{hospitalName}</h1>
                <p className="text-xs text-gray-400">Operations System</p>
              </div>
              <h1 className="sm:hidden text-lg font-semibold text-gray-800">{hospitalName}</h1>
            </div>

            {/* Global search — jumps to the first matching request or suggestion */}
            <form onSubmit={runSearch} role="search" className="hidden md:flex flex-1 max-w-md mx-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search requests, suggestions, ticket #..."
                aria-label="Global search"
                className="w-full pl-10 pr-9 py-2 rounded-full border border-transparent bg-gray-100/80 text-sm transition-all focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-500/25 outline-none"
              />
              {searching && <Loader2 className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-primary-500 animate-spin" />}
            </form>

            <div className="flex items-center gap-1 sm:gap-2">
              {showSignage && (
                <Link
                  to="/multimedia"
                  aria-label={`Digital signage${signageOffline ? ` (${signageOffline} offline)` : ''}`}
                  title={signageOffline ? `${signageOffline} signage device(s) offline` : 'Digital signage is healthy'}
                  className="relative p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors"
                >
                  <MonitorPlay className="w-5 h-5" />
                  {signageOffline > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                      {signageOffline > 99 ? '99+' : signageOffline}
                    </span>
                  )}
                </Link>
              )}
              <Link to="/notifications" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`} className="relative p-2 text-gray-500 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  onClick={() => setNavOpen(!navOpen)}
                  aria-label="User menu"
                  aria-haspopup="menu"
                  aria-expanded={navOpen}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-sm font-semibold ring-2 ring-primary-500/20">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{user?.role_name?.replace(/_/g, ' ')}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 hidden sm:block transition-transform ${navOpen ? 'rotate-180' : ''}`} />
                </button>
                {navOpen && (
                  <div
                    role="menu"
                    aria-label="User menu"
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl shadow-slate-900/10 py-1.5 z-50 origin-top-right animate-scale-in"
                  >
                    <Link to="/profile" role="menuitem" onClick={() => setNavOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button
                      role="menuitem"
                      onClick={async () => {
                        setNavOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-7xl mx-auto print:p-0 print:max-w-none">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
