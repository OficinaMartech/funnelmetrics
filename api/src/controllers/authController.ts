import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { loginHistory } from '../services/loginHistoryService';
import emailService from '../services/emailService';
import geoip from 'geoip-lite';
import authConfig from '../config/auth';

// Função para login de usuários
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    // Validar email e senha
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor, forneça email e senha' });
    }

    // Verificar se o usuário existe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Verificar se a senha está correta
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Registrar tentativa de login falha
      await loginHistory.addFailedAttempt(email, ip);
      
      return res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    sendTokenResponse(user, 200, res, ip);
    
  } catch (error) {
    console.error('Erro de login:', error);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Registrar novo usuário
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar se o usuário já existe
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Este email já está registrado' });
    }
    
    // Criar usuário
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Enviar email de boas-vindas
    await emailService.sendWelcomeEmail({ name, email });
    
    // Obter informações geográficas
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const geo = geoip.lookup(ip);
    
    // Registrar login bem-sucedido
    await loginHistory.addSuccessfulLogin(user._id, ip, geo);
    
    // Enviar resposta com token
    sendTokenResponse(user, 201, res, ip);
    
  } catch (error) {
    console.error('Erro de registro:', error);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Recuperar informações do usuário atual
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const includeSubscription = req.query.includeSubscription === 'true';
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    if (includeSubscription) {
      // Lógica para incluir dados de assinatura
      return res.status(200).json({ success: true, data: user });
    }
    
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Erro ao recuperar usuário:', error);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Função para enviar tokens com resposta
const sendTokenResponse = (user: any, statusCode: number, res: Response, ip: string) => {
  // Criar token
  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);
  
  // Opções para cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: authConfig.refreshTokenExpiration * 1000
  });
  
  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// Gerar token JWT
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// Gerar refresh token
const generateRefreshToken = (user: any) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET || 'refreshsecret',
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d' }
  );
};

// Logout
export const logout = async (req: Request, res: Response) => {
  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
};

// Renovar token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Não autorizado' });
    }
    
    // Verificar token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refreshsecret') as any;
    
    // Obter usuário
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    // Gerar novo token
    const newToken = generateToken(user);
    
    return res.status(200).json({
      success: true,
      token: newToken
    });
    
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return res.status(401).json({ success: false, message: 'Não autorizado' });
  }
};

// Solicitar redefinição de senha
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    // Gerar token de redefinição
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token e definir data de expiração
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
      
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    await user.save({ validateBeforeSave: false });
    
    // Criar URL de redefinição
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
    
    // Enviar email
    await emailService.sendPasswordResetEmail({ 
      name: user.name,
      email: user.email,
      resetURL: resetUrl
    });
    
    return res.status(200).json({
      success: true,
      message: 'Email enviado'
    });
    
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    
    // Redefinir campos de token
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
    
    return res.status(500).json({ success: false, message: 'Erro ao enviar email de redefinição' });
  }
};

// Redefinir senha
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    // Hash o token recebido
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Encontrar usuário com token válido
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
    }
    
    // Definir nova senha
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Atualizar perfil
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: req.body.name, email: req.body.email },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};

// Alterar senha
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Obter usuário com senha
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }
    
    // Verificar senha atual
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Senha atual incorreta' });
    }
    
    // Definir nova senha
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ success: false, message: 'Erro no servidor' });
  }
};