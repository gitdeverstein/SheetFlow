import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useSheetStore } from './store/sheetStore.js';
import { login, register, logout as apiLogout, checkAuth } from './store/api.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import VerifyEmail from './components/VerifyEmail.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import SkeletonLoader from './components/SkeletonLoader.js';
import AnimatedSection from './components/AnimatedSection.js';
import Navbar from './components/Navbar.js';
import Toaster from './components/Toaster.js';
import SettingsModal from './components/SettingsModal.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from './components/ui/Modal.js';
import { Button } from './components/ui/Button.js';

// Lazy load tab components
const Dashboard = lazy(() => import('./components/Dashboard.js'));
const SpreadsheetGrid = lazy(() => import('./components/SpreadsheetGrid.js'));
const QuoteGenerator = lazy(() => import('./components/QuoteGenerator.js'));

interface UserInfo {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
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

  // Email verification flow — stores registered email after sign-up
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(
    () => sessionStorage.getItem('pendingVerificationEmail')
  );

  // Verification result shown after user clicks the email link
  const [verificationStatus, setVerificationStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dropdownRef = useOutsideClick<HTMLDivElement>(() => setProfileOpen(false), profileOpen);

  // Handle incoming verification token or oauth errors from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const oauthError = params.get('error');

    if (oauthError) {
      window.history.replaceState({}, '', window.location.pathname);
      useSheetStore.getState().addToast('Google Sign-In was cancelled or failed.', 'error');
    }

    if (token) {
      // Clear the token from the URL without a page reload
      window.history.replaceState({}, '', window.location.pathname);
      verifyEmail(token).then((result) => {
        setVerificationStatus({ type: 'success', message: result.message });
        // Clear pending verification if this was the user
        sessionStorage.removeItem('pendingVerificationEmail');
        setPendingVerificationEmail(null);
      }).catch((err: unknown) => {
        setVerificationStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'Verification failed',
        });
      });
    }
  }, []);

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

  const handleLogout = async () => {
    await apiLogout();
    setIsLoggedIn(false);
    setUser(null);
    setProfileOpen(false);
    useSheetStore.getState().addToast('Successfully logged out!', 'info');
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
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          setSettingsOpen={setSettingsOpen}
          onLogout={handleLogout}
          dropdownRef={dropdownRef}
        />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                id={`${activeTab}-panel`}
                role="tabpanel"
                aria-labelledby={activeTab}
              >
                <AnimatedSection key={`content-${activeTab}`}>
                  {activeTab === 'dashboard' && <Dashboard />}
                  {activeTab === 'crm' && <SpreadsheetGrid tab="crm" />}
                  {activeTab === 'inventory' && <SpreadsheetGrid tab="inventory" />}
                  {activeTab === 'quotes' && <QuoteGenerator />}
                </AnimatedSection>
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>

        <Toaster toasts={toasts} removeToast={removeToast} />

        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
