import React from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import { BarChart3, ExternalLink, LayoutDashboard, Library, Link2, LogOut, UploadCloud, UserCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-surface-600">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-64 md:min-h-screen md:fixed bg-surface-50 border-b md:border-b-0 md:border-r border-surface-300/30 flex flex-col">
        <Link to="/" className="flex items-center gap-2 px-6 py-5">
          <Logo markClassName="h-8 w-8" wordClassName="text-xl" />
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-white/50 mt-1">Studio</span>
        </Link>
        <nav className="flex md:flex-col gap-1 px-3 overflow-x-auto pb-3 md:pb-0">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
                  isActive ? 'bg-primary-600/20 text-primary-300' : 'text-surface-700 hover:bg-surface-200 hover:text-white'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="md:hidden flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-surface-700 hover:bg-surface-200"
          >
            <LogOut size={18} /> Sign out
          </button>
        </nav>
        <div className="hidden md:block mt-auto px-6 py-5 border-t border-surface-300/30 space-y-3">
          {profile && (
            <Link to={`/c/${profile.handle}`} className="flex items-center gap-2 text-sm text-surface-700 hover:text-white">
              <ExternalLink size={16} /> View my page
            </Link>
          )}
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-surface-700 hover:text-white">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64 px-4 sm:px-8 py-8 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
