import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  createUser: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthErrorMessage: (error: AuthError) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  /* actions */

  /**
   * check if the current user is an admin
   **/
  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (err) {
      setIsAdmin(false);
      console.error("Error checking admin status:", err);
    }
  };
    
  /**
   * creates a new user with the given email and password
   * @param email - new user email
   * @param password - new user password 
   */
  const createUser = async (email: string, password: string) => {
    if (user) throw new Error("Already logged in.");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };
  
  /**
   * login the user with the given email 
   * @param email - the user email
   * @param password  - the user password
   */
  const login = async (email: string, password: string) => {
    if (user) throw new Error("You are already logged in.");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  /**
   * logout the user 
   */
  const logout = async () => {
    if (!user) throw new Error("No active session found.");
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  /* helpers */ 

  /**
   * convert a given auth error to a exibition error message
   * @param error 
   * @returns 
   */
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
  
    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
                await checkAdminStatus(); 
            }
            setLoading(false);
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setLoading(true); 
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
                await checkAdminStatus();
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

  return (
    <AuthContext.Provider value={{
      user, session, isAdmin, loading, isAuthenticated: !!user, createUser, login, logout, getAuthErrorMessage
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};