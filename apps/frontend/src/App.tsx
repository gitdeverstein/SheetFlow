import { useState, useEffect } from 'react';
import { useSheetStore } from './store/sheetStore.js';
import { login, register, checkAuth } from './store/api.js';
import Dashboard from './components/Dashboard.js';
import SpreadsheetGrid from './components/SpreadsheetGrid.js';
import QuoteGenerator from './components/QuoteGenerator.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import VerifyEmail from './components/VerifyEmail.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import SkeletonLoader from './components/SkeletonLoader.js';
import AnimatedSection from './components/AnimatedSection.js';
import Navbar from './components/Navbar.js';
import Toaster from './components/Toaster.js';
import { X, Settings, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './components/ui/Modal.js';
import { Button } from './components/ui/Button.js';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
}

const Dashboard = lazy(() => import('./components/Dashboard.js'));
const SpreadsheetGrid = lazy(() => import('./components/SpreadsheetGrid.js'));
const QuoteGenerator = lazy(() => import('./components/QuoteGenerator.js'));

function App() {
  const { activeTab, prefetchData } = useSheetStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

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

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    // Show verification status (after clicking email link)
    if (verificationStatus) {
      return (
        <ErrorBoundary>
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="glass-panel rounded-2xl p-8 w-full max-w-md relative z-10 border border-slate-700/50 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-4">
              {verificationStatus.type === 'success' ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <h1 className="font-display font-bold text-xl text-white">
                {verificationStatus.type === 'success' ? 'Email Verified!' : 'Verification Failed'}
              </h1>
              <p className="text-slate-400 text-sm text-center">{verificationStatus.message}</p>
              <button
                onClick={() => { setVerificationStatus(null); }}
                className="mt-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-cyan-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                {verificationStatus.type === 'success' ? 'Sign in' : 'Try again'}
              </button>
            </div>
          </motion.div>
        </div>
        </ErrorBoundary>
      );
    }

    // Show pending verification notice after registration
    if (pendingVerificationEmail) {
      return (
        <ErrorBoundary>
          <VerifyEmail
            email={pendingVerificationEmail}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onBackToLogin={() => {
              sessionStorage.removeItem('pendingVerificationEmail');
              setPendingVerificationEmail(null);
            }}
          />
        </ErrorBoundary>
      );
    }

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
          onSignUp={async (email, password) => {
          await register(email, password);
          sessionStorage.setItem('pendingVerificationEmail', email);
          setPendingVerificationEmail(email);
        }}
      />
      </ErrorBoundary>
    );
  }

  const loadingFallback = (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        user={user}
        setUser={setUser}
        setIsLoggedIn={setIsLoggedIn}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        setSettingsOpen={setSettingsOpen}
      />

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
              <Suspense fallback={<SkeletonLoader variant="card" count={3} />}>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'crm' && <SpreadsheetGrid tab="crm" />}
                {activeTab === 'inventory' && <SpreadsheetGrid tab="inventory" />}
                {activeTab === 'quotes' && <QuoteGenerator />}
              </Suspense>
            </AnimatedSection>
          </motion.div>
        </AnimatePresence>
      </main>

      <Toaster />

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
