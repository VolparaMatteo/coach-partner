import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import QuickNoteFAB from '@/components/QuickNote/QuickNoteFAB'
import ToastContainer from '@/components/Toast/ToastContainer'
import GlobalSearch from '@/components/Search/GlobalSearch'
import NotificationCenter from '@/components/Notifications/NotificationCenter'
import OfflineIndicator from '@/components/Offline/OfflineIndicator'
import OnboardingTour from '@/components/Onboarding/OnboardingTour'
import KeyboardShortcuts from '@/components/Shortcuts/KeyboardShortcuts'
import { useReminders } from '@/hooks/useReminders'
import {
  Home, Users, Calendar, Trophy, BarChart3,
  Settings, LogOut, Menu, X, Moon, Sun, Search
} from 'lucide-react'
import { useState, useEffect } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/athletes', icon: Users, label: 'Atleti' },
  { to: '/trainings', icon: Calendar, label: 'Allenamenti' },
  { to: '/matches', icon: Trophy, label: 'Gare' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/settings', icon: Settings, label: 'Impostazioni' },
]

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { dark, toggle } = useThemeStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showTour, setShowTour] = useState(() => {
    return !localStorage.getItem('tour_completed')
  })
  useReminders()

  const completeTour = () => {
    localStorage.setItem('tour_completed', 'true')
    setShowTour(false)
  }

  // Cmd+K / Ctrl+K shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-brand-700 dark:text-brand-400">Coach Partner</h1>
            <div className="flex items-center gap-1">
              <NotificationCenter />
              <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title={dark ? 'Modalità chiara' : 'Modalità scura'}>
                {dark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-gray-400" />}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.first_name} {user?.last_name}
          </p>
          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Cerca...</span>
            <kbd className="text-[10px] text-gray-400 border border-gray-200 dark:border-gray-700 rounded px-1">⌘K</kbd>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={20} />
            Esci
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-lg font-bold text-brand-700 dark:text-brand-400">Coach Partner</h1>
          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-400" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)}>
            <div className="w-64 bg-white dark:bg-gray-900 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h1 className="text-xl font-bold text-brand-700 dark:text-brand-400">Coach Partner</h1>
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                      )
                    }
                  >
                    <Icon size={20} />
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 w-full"
                >
                  <LogOut size={20} />
                  Esci
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>

        {/* Quick Note FAB */}
        <QuickNoteFAB />

        {/* Toast Notifications */}
        <ToastContainer />

        {/* Global Search */}
        <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts onSearch={() => setSearchOpen(true)} />

        {/* Onboarding Tour */}
        {showTour && <OnboardingTour onComplete={completeTour} />}

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex items-center justify-around bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center gap-1 px-3 py-1 text-xs',
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
