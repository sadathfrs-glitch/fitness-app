import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, Apple, CalendarDays, ChartNoAxesCombined, Dumbbell, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/workouts', label: 'Workouts', icon: Dumbbell },
  { path: '/exercises', label: 'Exercises', icon: Activity },
  { path: '/progress', label: 'Progress', icon: ChartNoAxesCombined },
  { path: '/plans', label: 'Plans', icon: CalendarDays },
  { path: '/nutrition', label: 'Nutrition', icon: Apple },
];

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="site-nav fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-slate-100">
          <span className="site-brand-mark"><Dumbbell className="h-5 w-5" /></span>
          <span>FitTrack<span className="text-lime-300">.</span></span>
        </Link>

        {!loading && user && (
          <div className="hidden items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.025] p-1 lg:flex">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `site-nav-link flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all duration-200 ${
                    isActive ? 'bg-lime-300/[0.12] text-lime-200' : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />{item.label}
                </NavLink>
              );
            })}
          </div>
        )}

        <div className="hidden items-center gap-3 md:flex">
          {!loading && (user ? (
            <>
              <span className="max-w-[150px] truncate text-xs text-slate-400">{profile?.displayName || user.email}</span>
              <Button variant="ghost" size="sm" aria-label="Sign out" onClick={signOut} className="!text-slate-300 hover:!text-lime-200">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="ghost" size="sm" className="!text-slate-300 hover:!text-white">Sign in</Button></Link>
              <Link to="/signup"><Button size="sm" className="!rounded-full !bg-lime-300 !px-5 !font-semibold !text-slate-950 hover:!bg-lime-200">Get started</Button></Link>
            </>
          ))}
        </div>

        <button
          className="rounded-xl border border-white/10 p-2 text-slate-300 transition-colors hover:border-lime-300/30 hover:text-lime-200 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="animate-slide-down border-t border-white/[0.08] bg-[#0b1017]/95 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-2xl flex-col gap-1">
            {!loading && user && navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${isActive ? 'bg-lime-300/10 text-lime-200' : 'text-slate-300 hover:bg-white/5'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />{item.label}
                </NavLink>
              );
            })}
            {!loading && (user ? (
              <div className="mt-3 flex items-center justify-between border-t border-white/10 px-3 pt-4">
                <span className="max-w-[65%] truncate text-xs text-slate-400">{profile?.displayName || user.email}</span>
                <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileMenuOpen(false); }}><LogOut className="h-4 w-4" /> Sign out</Button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}><Button variant="outline" className="w-full justify-center">Sign in</Button></Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)}><Button className="w-full justify-center !bg-lime-300 !text-slate-950">Get started</Button></Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
