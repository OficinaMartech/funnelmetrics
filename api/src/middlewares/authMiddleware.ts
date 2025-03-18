// ~/funnelmetrics/api/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import authConfig from '../config/auth';
import User from '../models/User';

// Estendendo a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    // Obter token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // O formato deve ser 'Bearer TOKEN'
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2) {
      return res.status(401).json({ message: 'Erro no formato do token' });
    }

    const [scheme, token] = parts;
    
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ message: 'Token malformatado' });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, authConfig.jwtSecret) as { id: number };
      
      // Buscar usuário pelo ID
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
      });
      
      if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }

      // Adicionar usuário ao objeto request
      req.user = user;
      
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};