// ~/funnelmetrics/frontend/pages/auth/forgot-password.js
import React, { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o email. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recuperar Senha | FunnelMetrics</title>
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">FunnelMetrics</h1>
                <p className="text-gray-600 mt-2">Recuperação de senha</p>
              </div>

              {submitted ? (
                <div className="text-center">
                  <div className="bg-green-50 border border-green-200 text-green-600 p-4 rounded-md mb-6">
                    <p>Se o email fornecido estiver cadastrado em nossa base de dados, enviaremos instruções para recuperação de senha.</p>
                  </div>
                  <p className="mb-4">Por favor, verifique sua caixa de entrada e pasta de spam.</p>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Voltar para o login
                  </Link>
                </div>
              ) : (
                <>
                  <p className="mb-6 text-gray-600 text-sm">
                    Digite o endereço de email associado à sua conta e enviaremos um link para redefinir sua senha.
                  </p>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="email">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Mail size={16} />
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
                          Enviando...
                        </span>
                      ) : 'Enviar instruções'}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
                    >
                      <ArrowLeft size={16} className="mr-1" />
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

export default ForgotPasswordPage;