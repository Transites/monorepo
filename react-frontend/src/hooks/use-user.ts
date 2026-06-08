// react-frontend/src/hooks/use-auth.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const createUser = async (email: string, pass: string) => {
    if (user) throw new Error("Already logged in. Logout to create a new account.");
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (error) throw error;
    return data;
  };

  const login = async (email: string, pass: string) => {
    if (user) throw new Error("You are already logged in.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (!user) throw new Error("No active session found.");
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    isAuthenticated: !!user,
    loading,
    createUser,
    login,
    logout
  };
};