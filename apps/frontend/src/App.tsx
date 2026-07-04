import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSheetStore } from './store/sheetStore.js';
import { login, register, logout as apiLogout, checkAuth } from './store/api.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import SkeletonLoader from './components/SkeletonLoader.js';
import AnimatedSection from './components/AnimatedSection.js';
import { LayoutDashboard, Users, Package, FilePlus, X, User, Settings, Sun, Moon, LogOut, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

const Dashboard = lazy(() => import('./components/Dashboard.js'));
const SpreadsheetGrid = lazy(() => import('./components/SpreadsheetGrid.js'));
const QuoteGenerator = lazy(() => import('./components/QuoteGenerator.js'));

function App() {
  const { activeTab, setActiveTab, prefetchData, toasts, removeToast } = useSheetStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth().then(async (authed) => {
      if (authed) {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          }
        } catch { /* ignore */ }
        setIsLoggedIn(true);
        prefetchData();
      }
      setAuthChecked(true);
    });
  }, [prefetchData]);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.add('light');
        localStorage.setItem('theme', 'light');
      }
      return next;
    });
  };

  useEffect(() => {
    if (!profileOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [profileOpen]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <ErrorBoundary>
        <WelcomeScreen
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onSignIn={async (email, password) => {
          const result = await login(email, password);
          setUser(result.user);
          setIsLoggedIn(true);
          prefetchData();
        }}
          onSignUp={async (name, email, password) => {
          const result = await register(name, email, password);
          setUser(result.user);
          setIsLoggedIn(true);
          prefetchData();
        }}
      />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center font-display font-extrabold text-white text-lg tracking-wider shadow-md shadow-brand-500/20">
                SF
              </div>
              <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                SheetFlow
              </span>
            </div>
            
            {/* Nav Tabs & Profile Actions */}
            <div className="flex items-center gap-4">
              {/* Nav Tabs */}
              <div className="flex space-x-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'crm', label: 'CRM Sheets', icon: Users },
                  { id: 'inventory', label: 'Inventory', icon: Package },
                  { id: 'quotes', label: 'Create Quote', icon: FilePlus },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'crm' | 'inventory' | 'quotes' | 'dashboard')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group
                        ${isActive 
                          ? 'text-brand-400' 
                          : 'text-slate-400 hover:text-slate-200'}
                      `}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-brand-500/10 border border-brand-500/25 shadow-inner rounded-xl"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <Icon size={16} className="relative z-10" />
                      <span className="hidden sm:inline relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-brand-500/20 relative border border-slate-800/80 cursor-pointer focus:outline-none text-white-keep"
                >
                  {user ? user.name.charAt(0).toUpperCase() + (user.name.split(' ')[1]?.[0] || '') : '?'}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                </motion.button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-2xl py-2.5 border border-slate-800/80 z-50 overflow-hidden"
                    >
                      {/* User Info Header */}
                      <div className="px-4 py-2.5 border-b border-slate-800/60 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-brand-400 font-bold border border-slate-700/60">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                          <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                        </div>
                      </div>

                      {/* Dropdown Items */}
                      <div className="p-1.5 space-y-0.5">
                        <button
                          onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all text-left cursor-pointer"
                        >
                          <Settings size={16} />
                          <span>Account Settings</span>
                        </button>

                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all text-left cursor-pointer"
                        >
                          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                          <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        <div className="border-t border-slate-800/60 my-1.5" />

                        <button
                          onClick={async () => {
                            await apiLogout();
                            setIsLoggedIn(false);
                            setUser(null);
                            setProfileOpen(false);
                            useSheetStore.getState().addToast('Successfully logged out!', 'info');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 rounded-xl transition-all text-left cursor-pointer font-semibold"
                        >
                          <LogOut size={16} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatedSection key={`content-${activeTab}`}>
              <Suspense fallback={
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                    <span className="text-slate-400 font-medium">Loading component...</span>
                  </div>
                  <SkeletonLoader variant="card" count={3} />
                </div>
              }>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'crm' && <SpreadsheetGrid tab="crm" />}
                {activeTab === 'inventory' && <SpreadsheetGrid tab="inventory" />}
                {activeTab === 'quotes' && <QuoteGenerator />}
              </Suspense>
            </AnimatedSection>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Slide-in Micro-Notifications (Toaster) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`glass-panel p-4 rounded-xl flex items-start gap-3 shadow-2xl border-l-4
                ${toast.type === 'success' ? 'border-l-emerald-500' : ''}
                ${toast.type === 'error' ? 'border-l-rose-500' : ''}
                ${toast.type === 'info' ? 'border-l-brand-500' : ''}
              `}
            >
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-400 capitalize">
                  {toast.type === 'success' ? 'Success' : toast.type}
                </p>
                <p className="text-sm text-slate-200 mt-0.5">{toast.text}</p>
                {toast.undoAction && (
                  <button
                    onClick={() => { toast.undoAction!(); removeToast(toast.id); }}
                    className="mt-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    ↩ Undo
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 relative border border-slate-800/80 z-10"
            >
              <button
                onClick={() => setSettingsOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2 mb-4">
                <Settings className="text-brand-500" size={22} />
                <h2 className="text-xl font-display font-semibold text-white">Application Settings</h2>
              </div>
              
              {/* Settings Form */}
              <div className="space-y-4 text-sm text-slate-300">
                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Theme</p>
                    <p className="text-xs text-slate-400">Switch between light and dark appearance.</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-200 transition-colors cursor-pointer"
                  >
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                </div>

                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Compact Mode</p>
                    <p className="text-xs text-slate-400">Reduce padding in tables and grids.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded" />
                </div>

                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Auto-Save Sheets</p>
                    <p className="text-xs text-slate-400">Automatically persist modifications.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-500 rounded" />
                </div>

                <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800/60 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">Developer Mode</p>
                    <p className="text-xs text-slate-400">Show database queries in browser console.</p>
                  </div>
                  <input type="checkbox" className="w-4 h-4 accent-brand-500 rounded" />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

export default App;
