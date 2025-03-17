// ~/funnelmetrics/frontend/pages/auth/reset-password/[token].js
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Check } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { token } = router.query;
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validar se as senhas coincidem
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }
    
    try {
      await resetPassword(token, password);
      setSuccess(true);
      
      // Redirecionar para o dashboard após alguns segundos
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Erro ao redefinir senha. O token pode ser inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // Se o token não estiver disponível ainda, mostrar carregamento
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Redefinir Senha | FunnelMetrics</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">FunnelMetrics</h1>
                <p className="text-gray-600 mt-2">Redefinição de senha</p>
              </div>

              {success ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4 text-green-500">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Check size={24} />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-800 mb-2">Senha redefinida com sucesso!</p>
                  <p className="text-gray-600 mb-6">Você será redirecionado para o dashboard.</p>
                  <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 font-medium">
                    Ir para o dashboard agora
                  </Link>
                </div>
              ) : (
                <>
                  <p className="mb-6 text-gray-600 text-sm">
                    Digite sua nova senha abaixo para redefinir o acesso à sua conta.
                  </p>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
                        Nova senha
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Lock size={16} />
                        </div>
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="confirm-password">
                        Confirmar nova senha
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={showPassword ? "text" : "password"}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Lock size={16} />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        loading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processando...
                        </span>
                      ) : 'Redefinir senha'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      href="/auth/login"
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Voltar para o login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              &copy; 2025 FunnelMetrics. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;