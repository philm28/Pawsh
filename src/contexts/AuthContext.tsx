import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileError: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (params: { email: string; password: string; fullName: string; phone?: string; role: 'client' | 'walker' }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  // The handle_new_user DB trigger creates the profile row, and it can
  // occasionally lag a beat (or, rarely, silently fail). A single unretried
  // read here used to mean: no row yet -> profile stays null -> the app
  // treats a fully authenticated user as logged out and bounces them to
  // the public landing page with no explanation. Retry a few times before
  // giving up, and surface a real error state instead of a silent bounce.
  async function fetchProfile(userId: string): Promise<boolean> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (data) {
        setProfile(data as Profile);
        setProfileError(false);
        return true;
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 600));
    }
    setProfileError(true);
    return false;
  }

  async function refreshProfile() {
    if (user) await fetchProfile(user.id);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setProfileError(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) await fetchProfile(data.user.id);
    return { error };
  }

  async function signUp(params: { email: string; password: string; fullName: string; phone?: string; role: 'client' | 'walker' }) {
    const { email, password, fullName, phone, role } = params;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) return { error };

    // Log for admin visibility. Account is already active — this is a
    // review flag, not a gate. Non-fatal if it fails.
    supabase.from('access_requests').insert({
      full_name: fullName,
      email,
      phone: phone || null,
      requested_role: role,
      status: 'auto_approved',
    }).then(() => {});

    // Notify admin + applicant by email. Non-fatal if it fails.
    supabase.functions.invoke('send-access-request-email', {
      body: { full_name: fullName, email, phone: phone || null, requested_role: role },
    }).then(() => {});

    if (data.user) {
      setUser(data.user);
      // The handle_new_user DB trigger creates the profile row; it can lag
      // by a beat behind signUp() returning, so poll briefly.
      for (let i = 0; i < 5; i++) {
        await fetchProfile(data.user.id);
        await new Promise(r => setTimeout(r, 400));
        const { data: check } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        if (check) { setProfile(check as Profile); break; }
      }
    }

    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setProfileError(false);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
