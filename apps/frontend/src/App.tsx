import { useState, useEffect, lazy, Suspense } from 'react';
import { useSheetStore } from './store/sheetStore.js';
import { login, register, logout as apiLogout, checkAuth } from './store/api.js';
import WelcomeScreen from './components/WelcomeScreen.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import AnimatedSection from './components/AnimatedSection.js';
import Navbar from './components/Navbar.js';
import Toaster from './components/Toaster.js';
import SettingsModal from './components/SettingsModal.js';
import SkeletonLoader from './components/SkeletonLoader.js';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = lazy(() => import('./components/Dashboard.js'));
const SpreadsheetGrid = lazy(() => import('./components/SpreadsheetGrid.js'));
const QuoteGenerator = lazy(() => import('./components/QuoteGenerator.js'));

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

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
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onLogout={async () => {
          await apiLogout();
          setIsLoggedIn(false);
          setUser(null);
          setProfileOpen(false);
          useSheetStore.getState().addToast('Successfully logged out!', 'info');
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
      />

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

      <Toaster toasts={toasts} removeToast={removeToast} />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
    </div>
    </ErrorBoundary>
  );
}

export default App;
