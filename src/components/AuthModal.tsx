import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, CheckCircle2, Database, AlertCircle } from 'lucide-react';
import { apiClient, saveSession } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; dbName?: string; engine?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setRegistrationSuccess(null);
      apiClient.getHealth()
        .then(res => {
          setDbStatus({
            connected: res.success && res.database === 'connected',
            dbName: res.databaseName,
            engine: res.engine
          });
        })
        .catch(() => {
          setDbStatus({ connected: false });
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRegistrationSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        // 1. Call real backend login API
        const loginRes = await apiClient.login({ email, password });
        // 2. Save JWT token in session
        saveSession(loginRes.token, loginRes.user);
        // 3. Verify session with backend /api/auth/me to ensure MongoDB validity
        const meRes = await apiClient.getMe();
        if (meRes.success && meRes.user) {
          onAuthSuccess(meRes.user);
          onClose();
        } else {
          throw new Error('Failed to verify authenticated session from MongoDB.');
        }
      } else {
        // 1. Call real backend registration API
        const regRes = await apiClient.register({ name, email, password });
        setRegistrationSuccess(`✓ User "${regRes.user.name}" created in MongoDB (database: cinesphere, collection: users)!`);
        
        // 2. Save JWT token and verify with /api/auth/me
        saveSession(regRes.token, regRes.user);
        const meRes = await apiClient.getMe();
        
        setTimeout(() => {
          if (meRes.success && meRes.user) {
            onAuthSuccess(meRes.user);
          }
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div
        className="relative w-full max-w-md bg-[#111622] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-2xl font-black text-white">
            {mode === 'login' ? 'Welcome Back' : 'Join CineSphere'}
          </h2>
          <p className="text-xs text-gray-400">
            {mode === 'login' ? 'Sign in to access your watch history and recommendations' : 'Start your cinema streaming journey today'}
          </p>
        </div>

        {/* Real MongoDB Database Status Badge */}
        <div className="mb-4 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold text-blue-300">
              MongoDB Database: <span className="text-white font-mono font-bold">cinesphere</span>
            </span>
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            dbStatus?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {dbStatus?.connected ? (dbStatus.engine === 'Atlas' ? 'Atlas Connected' : 'MongoDB Connected') : 'Connecting...'}
          </span>
        </div>

        {registrationSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{registrationSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-bold animate-fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Your Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full bg-[#182032] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#182032] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
                className="w-full bg-[#182032] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Free Account'}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="text-center mt-6 pt-4 border-t border-white/10 text-xs text-gray-400">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-white font-bold hover:underline"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-white font-bold hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
