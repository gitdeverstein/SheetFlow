import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, ArrowLeft, CheckCircle, Sun, Moon } from 'lucide-react';
import { resendVerification } from '../store/api.js';

interface VerifyEmailProps {
  email: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBackToLogin: () => void;
}

const floatingOrb = (x: number, y: number, delay: number) => ({
  initial: { x, y, scale: 1, opacity: 0.15 },
  animate: {
    x: [x, x + 40, x - 20, x],
    y: [y, y - 30, y + 20, y],
    scale: [1, 1.1, 0.95, 1],
    opacity: [0.15, 0.25, 0.1, 0.15],
  },
  transition: { duration: 12 + delay, repeat: Infinity, ease: 'easeInOut', delay },
});

export default function VerifyEmail({ email, isDarkMode, onToggleTheme, onBackToLogin }: VerifyEmailProps) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    setResending(true);
    setResendError('');
    try {
      await resendVerification(email);
      setResent(true);
    } catch (err: unknown) {
      setResendError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div className="absolute w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" {...floatingOrb(-80, -60, 0)} />
      <motion.div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" {...floatingOrb(120, 80, 2)} />
      <motion.div className="absolute w-64 h-64 rounded-full bg-purple-500/10 blur-3xl" {...floatingOrb(60, -100, 4)} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-panel rounded-2xl p-8 w-full max-w-md relative z-10 border border-slate-700/50 shadow-2xl"
      >
        {/* Theme Toggle */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all cursor-pointer"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Icon */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Mail size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-white">
            Check your inbox
          </h1>
          <p className="text-slate-400 text-sm text-center leading-relaxed">
            We sent a verification email to<br />
            <span className="text-slate-200 font-semibold">{email}</span>
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <Mail size={16} className="text-brand-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </p>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400">
              Once verified, you can log in with your email and password.
            </p>
          </div>
        </div>

        {/* Resend Button */}
        {resent ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 mb-4">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300 font-medium">
              Verification email resent! Check your inbox.
            </p>
          </div>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4 cursor-pointer"
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
        )}

        {resendError && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-rose-400 font-medium mb-4 text-center"
          >
            {resendError}
          </motion.p>
        )}

        {/* Back to Login */}
        <button
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </button>
      </motion.div>
    </div>
  );
}
