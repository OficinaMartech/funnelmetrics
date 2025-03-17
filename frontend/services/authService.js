// ~/funnelmetrics/frontend/services/authService.js
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Criar instância do axios com withCredentials para permitir cookies
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor para adicionar token JWT aos headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação (401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se o erro for 401 (Unauthorized) e a requisição não for já uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Tentar atualizar o token
        const response = await api.post('/auth/refresh-token');
        const { token } = response.data;
        
        // Salvar o novo token
        localStorage.setItem('token', token);
        
        // Atualizar o header e reenviar a requisição original
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar o refresh, deslogar o usuário
        logout();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Funções de autenticação
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    // Salvar token e usuário no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw new Error(error.response?.data?.message || 'Erro ao fazer login');
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', { name, email, password });
    const { token, user } = response.data;
    
    // Salvar token e usuário no localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Erro ao registrar:', error);
    throw new Error(error.response?.data?.message || 'Erro ao registrar usuário');
  }
};

export const logout = async () => {
  try {
    // Chamar endpoint de logout (para invalidar refresh token no servidor)
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  } finally {
    // Remover token e usuário do localStorage, independente do resultado da API
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    throw new Error(error.response?.data?.message || 'Erro ao processar solicitação');
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    throw new Error(error.response?.data?.message || 'Erro ao redefinir senha');
  }
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    throw new Error(error.response?.data?.message || 'Erro ao obter perfil');
  }
};

export default api;