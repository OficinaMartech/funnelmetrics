import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    
    // Verificar se existe token no header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      // Verificar se existe token nos cookies
      token = req.cookies.token;
    }
    
    // Verificar se token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado, token não encontrado'
      });
    }
    
    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret') as any;
      
      // Obter usuário do token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Não autorizado, usuário não encontrado'
        });
      }
      
      // Adicionar usuário à requisição
      req.user = user;
      next();
      
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado, token inválido'
      });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Não autorizado, faça login primeiro'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acesso negado para usuários com perfil ${req.user.role}`
      });
    }
    
    next();
  };
};