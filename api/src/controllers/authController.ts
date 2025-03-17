// ~/funnelmetrics/api/src/controllers/authController.ts
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import authConfig from '../config/auth';
import emailService from '../services/emailService';

// Gerar token JWT
const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn,
  });
};

// Gerar refresh token
const generateRefreshToken = (userId: number): string => {
  return jwt.sign({ id: userId }, authConfig.jwtSecret, {
    expiresIn: authConfig.refreshTokenExpiresIn,
  });
};

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, password } = req.body;

    // Verificar se o email já está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Este email já está em uso' });
    }

    // Criar novo usuário
    const user = await User.create({
      name,
      email,
      password,
    });

    // Gerar token JWT
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Definir cookie com refresh token
    res.cookie('refreshToken', refreshToken, authConfig.cookieOptions);

    // Enviar email de boas-vindas
    try {
      await emailService.sendWelcomeEmail({
        name: user.name,
        email: user.email,
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de boas-vindas:', emailError);
      // Não interrompemos o fluxo se o email falhar
    }

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
};

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Buscar usuário pelo email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Definir cookie com refresh token
    res.cookie('refreshToken', refreshToken, authConfig.cookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

export const logout = async (req: Request, res: Response): Promise<Response> => {
  // Limpar o cookie de refresh token
  res.clearCookie('refreshToken');
  
  return res.status(200).json({ message: 'Logout realizado com sucesso' });
};

export const refreshToken = async (req: Request, res: Response): Promise<Response> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token não fornecido' });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, authConfig.jwtSecret) as { id: number };
    
    // Buscar usuário pelo ID
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // Gerar novo token JWT
    const token = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    // Definir cookie com novo refresh token
    res.cookie('refreshToken', newRefreshToken, authConfig.cookieOptions);

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Erro ao atualizar token:', error);
    return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email } = req.body;

    // Buscar usuário pelo email
    const user = await User.findOne({ where: { email } });
    
    // Se não encontramos o usuário, ainda retornamos 200 por segurança
    // Não queremos dar pistas sobre quais emails estão registrados
    if (!user) {
      return res.status(200).json({ message: 'Se um usuário com esse email existir, enviaremos instruções para recuperação de senha.' });
    }

    // Gerar token de recuperação de senha
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Salvar token no banco com data de expiração (1 hora)
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora
    await user.save();

    // Criar URL de reset
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;

    // Enviar email com link de recuperação
    try {
      await emailService.sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetURL,
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de recuperação:', emailError);
      return res.status(500).json({ message: 'Erro ao enviar email de recuperação. Por favor, tente novamente.' });
    }

    // Para fins de desenvolvimento/teste, retornar o URL no response
    if (process.env.NODE_ENV !== 'production') {
      return res.status(200).json({
        message: 'Link para redefinição de senha enviado para o email informado.',
        resetURL: resetURL,
      });
    }

    return res.status(200).json({ message: 'Link para redefinição de senha enviado para o email informado.' });
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    return res.status(500).json({ message: 'Erro ao processar recuperação de senha' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash o token para comparar com o que está armazenado
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Buscar usuário pelo token
    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { [sequelize.Sequelize.Op.gt]: Date.now() }, // Verifica se o token ainda é válido
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    // Gerar token JWT
    const jwtToken = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Definir cookie com refresh token
    res.cookie('refreshToken', refreshToken, authConfig.cookieOptions);

    return res.status(200).json({
      message: 'Senha redefinida com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ message: 'Erro ao redefinir senha' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    // O middleware de autenticação já verificou o token e adicionou o ID do usuário ao request
    const userId = req.user.id;

    // Buscar o usuário pelo ID
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
  }
};