import React, { useEffect, useRef } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, BarChart3, LayoutDashboard, Library, Link2, LogOut, UploadCloud, UserCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import Logo, { LogoMark } from '../../components/common/Logo';
import { isDemoMode } from '../../lib/supabase';

const nav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/publish', label: 'Upload & Publish', icon: UploadCloud },
  { to: '/dashboard/library', label: 'Library', icon: Library },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/dashboard/connections', label: 'Connections', icon: Link2 },
  { to: '/dashboard/profile', label: 'Profile', icon: UserCircle },
];

const DashboardLayout: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);

  // On phones the nav is a horizontal strip; keep the current page's tab in view.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: active.offsetLeft - 12 });
  }, [pathname, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <LogoMark className="h-10 w-10 animate-pulse" />
        <p className="eyebrow text-white/50">Opening the studio…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-64 md:h-screen md:fixed md:inset-y-0 md:overflow-y-auto bg-ink border-b md:border-b-0 md:border-r border-white/10 flex flex-col z-30">
        <div className="hazard h-1.5 shrink-0" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-4 md:py-6">
          <Link to="/" className="flex items-center gap-2.5 min-w-0" aria-label="Unsigned home">
            <Logo markClassName="h-8 w-8" wordClassName="text-xl" />
          </Link>
          <span className="tag-yellow shrink-0">Studio</span>
        </div>

        {profile && (
          <div className="hidden md:block mx-6 mb-6 border-y border-white/10 py-4">
            <p className="eyebrow text-white/40">Signed in as</p>
            <p className="mt-1 font-semibold truncate">{profile.display_name}</p>
            <p className="font-mono text-xs text-white/50 truncate">/c/{profile.handle}</p>
          </div>
        )}

        <nav ref={navRef} className="relative flex md:flex-col gap-1 px-3 md:px-3 overflow-x-auto pb-3 md:pb-0" aria-label="Studio">
          {nav.map(({ to, label, icon: Icon, end }, i) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 text-sm whitespace-nowrap border transition-colors',
                  isActive
                    ? 'bg-signal text-ink border-signal font-semibold'
                    : 'border-transparent text-white/65 hover:text-white hover:border-white/15'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'hidden md:inline font-mono text-[10px] tracking-[0.1em]',
                      isActive ? 'text-ink/60' : 'text-white/30 group-hover:text-signal'
                    )}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon size={17} strokeWidth={isActive ? 2.25 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
          {profile && (
            <Link
              to={`/c/${profile.handle}`}
              className="md:hidden flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap text-white/65 border border-transparent hover:text-white"
            >
              <ArrowUpRight size={17} /> My page
            </Link>
          )}
          <button
            onClick={signOut}
            className="md:hidden flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap text-white/65 border border-transparent hover:text-white"
          >
            <LogOut size={17} /> Sign out
          </button>
        </nav>

        {/* In demo mode the floating demo badge sits bottom-left, so leave room for it. */}
        <div className={cn('hidden md:block mt-auto p-4 space-y-3', isDemoMode && 'pb-14')}>
          {profile && (
            <Link
              to={`/c/${profile.handle}`}
              className="paper group flex items-center justify-between gap-3 px-4 py-3 text-ink"
            >
              <span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink/60">Your fan page</span>
                <span className="block font-semibold">View my page</span>
              </span>
              <ArrowUpRight size={20} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 hover:text-signal transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 md:ml-64">
        <div className="max-w-5xl px-4 sm:px-8 lg:px-10 py-8 sm:py-12 pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
