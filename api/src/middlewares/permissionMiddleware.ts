// ~/funnelmetrics/api/src/middlewares/permissionMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Project from '../models/Project';
import Funnel from '../models/Funnel';

// Middleware para verificar se o usuário tem uma assinatura ativa
export const requireActiveSubscription = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    
    // Buscar assinatura do usuário
    const subscription = await Subscription.findOne({ where: { userId } });
    
    // Verificar se a assinatura existe e está ativa
    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        status: 'error',
        message: 'Esta funcionalidade requer uma assinatura ativa.'
      });
    }
    
    // Adicionar a assinatura ao objeto request para uso nos próximos middlewares
    req.subscription = subscription;
    
    next();
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar assinatura'
    });
  }
};

// Middleware para verificar se o usuário tem permissão para determinada feature
export const requireFeature = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Se a assinatura não foi carregada, buscá-la
      if (!req.subscription) {
        const userId = req.user.id;
        const subscription = await Subscription.findOne({ where: { userId } });
        
        if (!subscription || !subscription.isActive()) {
          return res.status(403).json({
            status: 'error',
            message: 'Esta funcionalidade requer uma assinatura ativa.'
          });
        }
        
        req.subscription = subscription;
      }
      
      // Verificar se o usuário tem acesso à feature
      if (!req.subscription.hasFeature(feature)) {
        return res.status(403).json({
          status: 'error',
          message: `Esta funcionalidade requer um plano que inclua "${feature}".`
        });
      }
      
      next();
    } catch (error) {
      console.error('Erro ao verificar permissão de feature:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao verificar permissão'
      });
    }
  };
};

// Middleware para verificar se o usuário pode criar um novo projeto
export const canCreateProject = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    
    // Buscar assinatura do usuário
    const subscription = await Subscription.findOne({ where: { userId } });
    
    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        status: 'error',
        message: 'É necessário ter uma assinatura ativa para criar projetos.'
      });
    }
    
    // Contar quantos projetos o usuário já tem
    const projectCount = await Project.count({ where: { userId } });
    
    // Verificar se o usuário pode criar mais projetos
    if (!subscription.canCreateProjects(projectCount)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você atingiu o limite de projetos para o seu plano atual.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de criação de projeto:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar permissão'
    });
  }
};

// Middleware para verificar se o usuário pode criar um novo funil
export const canCreateFunnel = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user.id;
    
    // Buscar assinatura do usuário
    const subscription = await Subscription.findOne({ where: { userId } });
    
    if (!subscription || !subscription.isActive()) {
      return res.status(403).json({
        status: 'error',
        message: 'É necessário ter uma assinatura ativa para criar funis.'
      });
    }
    
    // Contar quantos funis o usuário já tem
    const funnelCount = await Funnel.count({ 
      include: [{
        model: Project,
        where: { userId },
        attributes: []
      }]
    });
    
    // Verificar se o usuário pode criar mais funis
    if (!subscription.canCreateFunnels(funnelCount)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você atingiu o limite de funis para o seu plano atual.'
      });
    }
    
    next();
  } catch (error) {
    console.error('Erro ao verificar permissão de criação de funil:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar permissão'
    });
  }
};

// Middleware para verificar se o usuário tem acesso a um recurso específico (projeto ou funil)
export const hasResourceAccess = (resourceType: 'project' | 'funnel') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const userId = req.user.id;
      const resourceId = Number(req.params.id);
      
      if (!resourceId) {
        return res.status(400).json({
          status: 'error',
          message: 'ID do recurso não fornecido'
        });
      }
      
      // Verificar acesso com base no tipo de recurso
      if (resourceType === 'project') {
        // Verificar se o projeto pertence ao usuário
        const project = await Project.findOne({ 
          where: { 
            id: resourceId,
            userId
          }
        });
        
        if (!project) {
          return res.status(404).json({
            status: 'error',
            message: 'Projeto não encontrado ou sem permissão de acesso'
          });
        }
        
        // Adicionar o projeto ao request para uso posterior
        req.project = project;
      } else if (resourceType === 'funnel') {
        // Verificar se o funil pertence a um projeto do usuário
        const funnel = await Funnel.findOne({
          where: { id: resourceId },
          include: [{
            model: Project,
            where: { userId },
            attributes: ['id', 'name']
          }]
        });
        
        if (!funnel) {
          return res.status(404).json({
            status: 'error',
            message: 'Funil não encontrado ou sem permissão de acesso'
          });
        }
        
        // Adicionar o funil ao request para uso posterior
        req.funnel = funnel;
      }
      
      next();
    } catch (error) {
      console.error(`Erro ao verificar acesso ao ${resourceType}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Erro ao verificar permissão de acesso'
      });
    }
  };
};