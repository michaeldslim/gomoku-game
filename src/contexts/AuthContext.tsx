import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_URI = 'gomoku-game://auth/callback';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseRedirect(url: string): { accessToken: string; refreshToken: string } | null {
  const atm = url.match(/[#&]access_token=([^&#]+)/);
  const rtm = url.match(/[#&]refresh_token=([^&#]+)/);
  if (atm && rtm) {
    return {
      accessToken: decodeURIComponent(atm[1]),
      refreshToken: decodeURIComponent(rtm[1]),
    };
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const exchangedRef = useRef(false);

  const exchangeCode = async (url: string) => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;
    WebBrowser.dismissBrowser();
    const parsed = parseRedirect(url);
    if (!parsed) return;
    await supabase.auth.setSession({
      access_token: parsed.accessToken,
      refresh_token: parsed.refreshToken,
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      if (url.startsWith('gomoku-game://')) {
        exchangeCode(url);
      }
    });

    return () => {
      subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  const signInWithGoogle = async () => {
    exchangedRef.current = false;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: REDIRECT_URI,
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (error || !data.url) return;

    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URI);
    if (result.type === 'success') {
      await exchangeCode(result.url);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
