import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Package, FilePlus, User, Settings, Sun, Moon, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: 'crm' | 'inventory' | 'quotes' | 'dashboard') => void;
  user: UserInfo | null;
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  setSettingsOpen: (open: boolean) => void;
  onLogout: () => Promise<void>;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

const TABS: { id: 'dashboard' | 'crm' | 'inventory' | 'quotes'; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'crm', label: 'CRM Sheets', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'quotes', label: 'Create Quote', icon: FilePlus },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  profileOpen,
  setProfileOpen,
  toggleTheme,
  isDarkMode,
  setSettingsOpen,
  onLogout,
  dropdownRef,
}: NavbarProps) {
  return (
    <nav className="glass-panel border-b border-slate-800/80 sticky top-0 z-40" role="navigation">
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

          <div className="flex items-center gap-4">
            <div className="flex space-x-1" role="tablist" aria-label="Main navigation">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`${tab.id}-panel`}
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

            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
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
                    role="menu"
                    className="absolute right-0 mt-2 w-64 glass-panel rounded-2xl shadow-2xl py-2.5 border border-slate-800/80 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-slate-800/60 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-brand-400 font-bold border border-slate-700/60">
                        <User size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <button
                        onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all text-left cursor-pointer"
                      >
                        <Settings size={16} />
                        <span>Account Settings</span>
                      </button>

                      <button
                        onClick={toggleTheme}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all text-left cursor-pointer"
                      >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>

                      <div className="border-t border-slate-800/60 my-1.5" />

                      <button
                        onClick={onLogout}
                        role="menuitem"
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
  );
}
