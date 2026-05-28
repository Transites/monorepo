// useState: guarda se o admin está autenticado
// useCallback: evita recriar funções desnecessariamente
import { useState, useCallback } from 'react';

// A senha temporária fica aqui hardcoded.
// Quando implementar autenticação de verdade, apaga esse arquivo
// e substitui por JWT/session. Por isso isolamos numa constante separada.
const TEMP_ADMIN_PASSWORD = 'transitos2024';

export function useAdminAuth() {
  // isAuthenticated: true = admin desbloqueou a edição nessa sessão
  // Começa false — admin precisa digitar a senha toda vez que abre a página
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função que verifica a senha.
  // Retorna true se correta, false se errada.
  const login = useCallback((password: string): boolean => {
    if (password === TEMP_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  // Logout: sai do modo de edição
  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, logout };
}