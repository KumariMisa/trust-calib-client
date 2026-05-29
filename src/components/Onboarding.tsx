'use client';

import React, { useState } from 'react';
import { ArrowRight, User, AtSign, Lock } from 'lucide-react';
import { authAPI } from '@/utils/api';

interface OnboardingProps {
  onComplete: (name: string, handle: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all whitespace
    value = value.replace(/\s+/g, '');
    
    // Auto prefix with @ if not empty and doesn't have it
    if (value && !value.startsWith('@')) {
      value = '@' + value;
    }
    
    // If it's just '@', let the user backspace to empty
    if (value === '@') {
      value = '';
    }

    setHandle(value.toLowerCase());
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanUsername = handle.replace(/^@/, '').trim();

    if (!cleanUsername) {
      setError('Please enter a username.');
      return;
    }

    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!isLoginMode && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLoginMode) {
        // Login flow
        const user = await authAPI.login(cleanUsername, password);
        onComplete(user.name, `@${user.username}`);
      } else {
        // Register flow
        const user = await authAPI.register(name.trim(), cleanUsername, password);
        // Automatically log in after registration
        const loggedInUser = await authAPI.login(cleanUsername, password);
        onComplete(loggedInUser.name, `@${loggedInUser.username}`);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground transition-all duration-300 relative overflow-hidden">
      {/* Background radial soft light */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl z-10">
        
        {/* Claude signature logo (Orange Star) */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 animate-pulse">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12,2L14.39,8.26L21,9L16,13.14L17.47,19.56L12,16L6.53,19.56L8,13.14L3,9L9.61,8.26L12,2M12,5.27L10.53,9.14L6.4,9.6L9.5,12.16L8.56,16.14L12,14L15.44,16.14L14.5,12.16L17.6,9.6L13.47,9.14L12,5.27Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-center">
            {isLoginMode ? 'Sign In to Claude' : 'Welcome to Claude'}
          </h1>
          <p className="text-sm text-foreground/60 text-center mt-2">
            {isLoginMode ? 'Access your workspace and chats.' : "Let's customize your chat experience."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name input (only for Sign Up) */}
          {!isLoginMode && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Elizabeth Bennet"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-foreground text-sm font-sans"
                maxLength={40}
                required={!isLoginMode}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Username handle input */}
          <div className="space-y-2">
            <label htmlFor="handle" className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <AtSign className="w-4 h-4 text-accent" />
              Username Handle
            </label>
            <input
              id="handle"
              type="text"
              placeholder="@username"
              value={handle}
              onChange={handleUsernameChange}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-foreground text-sm font-sans tracking-wide"
              maxLength={25}
              required
              disabled={isLoading}
            />
            {!isLoginMode && (
              <p className="text-xs text-foreground/50">
                No spaces or capital letters. (e.g. @liz_bennet)
              </p>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground/80 flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent" />
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all text-foreground text-sm font-sans"
              minLength={8}
              required
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg font-sans">
              {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : isLoginMode ? 'Sign In' : 'Create Profile'}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Toggle Mode Button */}
        <div className="mt-6 text-center text-sm">
          <button
            onClick={toggleMode}
            disabled={isLoading}
            className="text-accent hover:text-accent-hover font-semibold transition-colors focus:outline-none"
          >
            {isLoginMode ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>

      {/* Footer text */}
      <div className="mt-8 text-xs text-foreground/40 text-center font-sans">
        Claude is built with privacy and utility in mind.
      </div>
    </div>
  );
}
