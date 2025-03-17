// ~/funnelmetrics/frontend/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import * as authService from '../services/authService';

// Criar o contexto de autenticação
const AuthContext = createContext({});

// Prover o contexto de autenticação para a aplicação
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há um usuário atual ao carregar a página
    const checkUser = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          // Atualizar o estado com os dados do usuário
          setUser(currentUser);
          
          // Opcionalmente, podemos buscar dados atualizados do perfil
          try {
            const profile = await authService.getProfile();
            setUser(profile);
            localStorage.setItem('user', JSON.stringify(profile));
          } catch (error) {
            // Se não conseguir obter o perfil atualizado, usa os dados do localStorage
            console.error('Erro ao obter perfil atualizado:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Função de login
  const login = async (email, password) => {
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (error) {
      throw error;
    }
  };

  // Função de registro
  const register = async (name, email, password) => {
    try {
      const newUser = await authService.register(name, email, password);
      setUser(newUser);
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para recuperação de senha
  const forgotPassword = async (email) => {
    try {
      return await authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  // Função para redefinição de senha
  const resetPassword = async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      if (response.user) {
        setUser(response.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};