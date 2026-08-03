import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  adminLoading: boolean; 
  isAuthenticated: boolean;
  createUser: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthErrorMessage: (error: AuthError) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true); 

  const applySession = useCallback((session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
  }, []);

  const checkAdminStatus = useCallback(async () => {
    setAdminLoading(true); 
    try {
      const [adminRes, superAdminRes] = await Promise.all([
        supabase.rpc('is_admin'),
        supabase.rpc('is_superadmin')
      ]);
      
      if (adminRes.error) throw adminRes.error;
      if (superAdminRes.error) throw superAdminRes.error;

      setIsAdmin(Boolean(adminRes.data));
      setIsSuperAdmin(Boolean(superAdminRes.data)); 
    } catch (err) {
      console.error('Error checking admin/superadmin status:', err);
      setIsAdmin(false);
      setIsSuperAdmin(false); // ✨ ADDED
    } finally {
      setAdminLoading(false); 
    }
  }, []);
  
  const createUser = async (email: string, password: string) => {
    if (user) throw new Error('Already logged in.');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
  };

  const login = async (email: string, password: string) => {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      throw error;
    }

    applySession(data.session);
    setLoading(false);

    if (data.session?.user) {
      void checkAdminStatus();
    } else {
      setAdminLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoading(false);
      throw error;
    }

    applySession(null);
    setIsAdmin(false);
    setAdminLoading(false); // Reseta o loading de admin ao deslogar
    setLoading(false);
  };

  const getAuthErrorMessage = (error: AuthError): string => {
    switch (error.message) {
      case 'invalid_credentials':
        return 'E-mail ou senha incorretos.';
      case 'email_not_confirmed':
        return 'Por favor, confirme seu e-mail antes de fazer login.';
      case 'user_not_found':
        return 'Usuário não encontrado.';
      case 'email_exists':
        return 'Este e-mail já está em uso.';
      case 'weak_password':
        return 'A senha fornecida é muito fraca.';
      case 'over_request_rate_limit':
        return 'Muitas tentativas seguidas. Por favor, tente novamente mais tarde.';
      default:
        return 'Erro na autenticação. Verifique os dados.';
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(error);
          applySession(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminLoading(false);
          return;
        }

        applySession(session);
        setLoading(false); // O loading principal (do app todo) termina aqui

        // Se tem usuário, checa se é admin (isso altera o adminLoading internamente)
        // Se não tem usuário, já marcamos o adminLoading como falso
        if (session?.user) {
          void checkAdminStatus();
        } else {
          setAdminLoading(false);
        }

      } catch (err) {
        console.error(err);

        if (!mounted) return;

        applySession(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setAdminLoading(false);
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
          applySession(session);
          if (session?.user) {
            void checkAdminStatus();
          } else {
            setAdminLoading(false);
          }
          break;

        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          applySession(session);
          break;

        case 'SIGNED_OUT':
        case 'USER_DELETED':
          applySession(null);
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setAdminLoading(false); // Limpa o estado ao sair
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession, checkAdminStatus]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isSuperAdmin,
        loading,
        adminLoading, // NOVO
        isAuthenticated: !!user,
        createUser,
        login,
        logout,
        getAuthErrorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};