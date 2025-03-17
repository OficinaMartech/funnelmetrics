// ~/funnelmetrics/frontend/pages/dashboard/index.js
import React from 'react';
import Head from 'next/head';
import { Home, FolderClosed, CreditCard, User, LogOut, BarChart2, TrendingUp, ArrowRight, PlusCircle, Share2 } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  
  // Dados simulados de projetos
  const projects = [
    { 
      id: 1, 
      name: 'E-commerce', 
      description: 'Projeto para otimização de conversão da loja online',
      createdAt: '2025-02-15',
      funnels: [
        { id: 101, name: 'Checkout Principal', status: 'active', conversions: 234, conversionRate: 3.2 },
        { id: 102, name: 'Landing Page Promocional', status: 'active', conversions: 156, conversionRate: 2.7 }
      ] 
    },
    { 
      id: 2, 
      name: 'Blog de Conteúdo', 
      description: 'Estratégia de captação via conteúdo',
      createdAt: '2025-01-28',
      funnels: [
        { id: 201, name: 'Newsletter Signup', status: 'active', conversions: 89, conversionRate: 1.8 }
      ] 
    }
  ];
  
  // Calcular estatísticas
  const totalFunnels = projects.reduce((sum, project) => sum + project.funnels.length, 0);
  const totalConversions = projects.reduce((sum, project) => (
    sum + project.funnels.reduce((fSum, funnel) => fSum + funnel.conversions, 0)
  ), 0);
  
  // Encontrar o funil com a maior taxa de conversão
  const bestFunnel = projects
    .flatMap(project => project.funnels.map(funnel => ({ ...funnel, projectName: project.name })))
    .reduce((best, current) => (current.conversionRate > (best?.conversionRate || 0) ? current : best), null);
  
  return (
    <ProtectedRoute>
      <Head>
        <title>Dashboard | FunnelMetrics</title>
      </Head>
      
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <div className="flex flex-col h-full">
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-800">FunnelMetrics</h1>
            </div>
            
            <nav className="flex-1 px-4 mt-6">
              <ul className="space-y-2">
                <li>
                  <button 
                    className="w-full flex items-center px-4 py-3 rounded-md bg-indigo-50 text-indigo-600"
                  >
                    <Home size={18} className="text-indigo-600" />
                    <span className="ml-3 font-medium">Home</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="w-full flex items-center px-4 py-3 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    <FolderClosed size={18} className="text-gray-500" />
                    <span className="ml-3 font-medium">Projetos</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="w-full flex items-center px-4 py-3 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    <CreditCard size={18} className="text-gray-500" />
                    <span className="ml-3 font-medium">Pagamentos</span>
                  </button>
                </li>
                <li>
                  <button 
                    className="w-full flex items-center px-4 py-3 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    <User size={18} className="text-gray-500" />
                    <span className="ml-3 font-medium">Perfil</span>
                  </button>
                </li>
              </ul>
            </nav>
            
            <div className="p-4 mt-auto border-t">
              <button 
                onClick={logout}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <LogOut size={18} className="text-gray-500" />
                <span className="ml-3 font-medium">Sair</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
              <div className="text-sm text-gray-500">Bem-vindo, {user?.name || 'Usuário'}</div>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-500">
                    <FolderClosed size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Projetos Ativos</h3>
                    <div className="flex items-end">
                      <span className="text-2xl font-bold text-gray-800">{projects.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-500">
                    <BarChart2 size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Funis Totais</h3>
                    <div className="flex items-end">
                      <span className="text-2xl font-bold text-gray-800">{totalFunnels}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-500">
                    <TrendingUp size={24} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Conversões</h3>
                    <div className="flex items-end">
                      <span className="text-2xl font-bold text-gray-800">{totalConversions}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Top performing funnel */}
            {bestFunnel && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Melhor Desempenho</h2>
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="font-medium text-gray-800">{bestFunnel.name}</span>
                      <span className="ml-2 text-sm text-gray-500">({bestFunnel.projectName})</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      Taxa de conversão: <span className="font-medium text-green-600">{bestFunnel.conversionRate}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${Math.min(bestFunnel.conversionRate * 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <button className="flex items-center text-indigo-600 hover:text-indigo-800 ml-4">
                    <span className="mr-1">Ver detalhes</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Recent funnels */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">Funis Recentes</h2>
              </div>
              <div className="divide-y">
                {projects.flatMap(project => 
                  project.funnels.map(funnel => ({
                    ...funnel,
                    projectName: project.name
                  }))
                ).slice(0, 5).map(funnel => (
                  <div key={funnel.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-800">{funnel.name}</div>
                        <div className="text-sm text-gray-500">{funnel.projectName}</div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right mr-6">
                          <div className="text-sm text-gray-500">Conversões</div>
                          <div className="font-medium">{funnel.conversions}</div>
                        </div>
                        <div className="text-right mr-6">
                          <div className="text-sm text-gray-500">Taxa</div>
                          <div className="font-medium text-green-600">{funnel.conversionRate}%</div>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Dashboard;