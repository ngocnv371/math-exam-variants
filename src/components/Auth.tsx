import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // If email confirmation is required, we might want to show a message, 
        // but for simplicity we'll let the session state handle success.
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] dark:bg-[#121212] p-6 transition-colors duration-200">
      <div className="bg-white dark:bg-[#1E1E1E] p-8 rounded-3xl max-w-md w-full shadow-xl border border-[#1A1A1A]/5 dark:border-white/5">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white font-bold italic text-xl">K</div>
          <h1 className="text-2xl font-semibold tracking-tight dark:text-white">KindMath</h1>
        </div>

        <h2 className="text-xl font-serif italic text-center mb-6 dark:text-white">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#1A1A1A]/50 dark:text-white/50 uppercase mb-1 block">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 dark:text-white/40" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5F5F0] dark:bg-[#2A2A2A] border-none rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all dark:text-white"
                placeholder="teacher@school.edu"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#1A1A1A]/50 dark:text-white/50 uppercase mb-1 block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 dark:text-white/40" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F5F5F0] dark:bg-[#2A2A2A] border-none rounded-xl pl-11 pr-4 py-3 focus:ring-2 focus:ring-[#5A5A40] outline-none transition-all dark:text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-[#1A1A1A] dark:bg-white text-white dark:text-[#1A1A1A] rounded-xl font-medium hover:bg-black dark:hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-sm text-[#5A5A40] dark:text-[#8A8A60] hover:underline font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
