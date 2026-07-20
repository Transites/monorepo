import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';

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

  /* Actions */

  /**
   * creates a new user with the given email and password
   * @param email - new user email
   * @param password - new user password 
   */
  const createUser = async (email: string, password: string) => {
    if (user) throw new Error("Already logged in. Logout to create a new account.");
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password,
    });

    if (error) throw error;
  };
  
  /**
   * login the user with the given email 
   * @param email - the user email
   * @param password  - the user password
   */
  const login = async (email: string, password: string) => {
    if (user) throw new Error("You are already logged in.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: password,
    });

    if (error) throw error;
  };

  const logout = async () => {
    if (!user) throw new Error("No active session found.");
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /* Helpers */ 

  const getAuthErrorMessage = (error: AuthError): string => {
    switch (error.message) {
      case 'invalid_credentials':
        return "E-mail ou senha incorretos.";
      case 'email_not_confirmed':
        return "Por favor, confirme seu e-mail antes de fazer login.";
      case 'user_not_found':
        return "Usuário não encontrado.";
      case 'email_exists':
        return "Este e-mail já está em uso.";
      case 'weak_password':
        return "A senha fornecida é muito fraca.";
      case 'over_request_rate_limit':
        return "Muitas tentativas seguidas. Por favor, tente novamente mais tarde.";
      default:
        return "Erro na autenticação. Verifique os dados.";
    }
  };

  return {
    user,
    session,
    isAuthenticated: !!user,
    loading,
    createUser,
    login,
    logout,
    getAuthErrorMessage
  };
};