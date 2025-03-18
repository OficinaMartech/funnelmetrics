// ~/funnelmetrics/api/src/controllers/authController.ts
// Atualizar a função de login para registrar histórico

import loginHistoryService from '../services/loginHistoryService';

// Atualização na função de login
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Buscar usuário pelo email
    const user = await User.findOne({ where: { email } });
    
    // Se não encontrar o usuário, registrar falha sem revelar que o email não existe
    if (!user) {
      // Registramos a tentativa de login com um usuário fictício para não revelar quais emails existem
      await loginHistoryService.recordLoginAttempt({
        userId: 0, // ID fictício
        ipAddress,
        userAgent,
        status: 'failed',
        details: 'User not found',
      });
      
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(password);
    
    // Se a senha for inválida, registrar falha
    if (!isPasswordValid) {
      await loginHistoryService.recordLoginAttempt({
        userId: user.id,
        ipAddress,
        userAgent,
        status: 'failed',
        details: 'Invalid password',
      });
      
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar atividade suspeita
    const suspiciousCheck = await loginHistoryService.checkSuspiciousActivity(user.id, ipAddress);
    
    // Se for login suspeito, ainda permitimos o login, mas registramos isso
    let loginDetails = undefined;
    if (suspiciousCheck.suspicious) {
      loginDetails = `Suspicious login: ${suspiciousCheck.reason}`;
      
      // Opcional: Enviar email de alerta para o usuário
      try {
        await emailService.sendLoginAlertEmail({
          name: user.name,
          email: user.email,
          ipAddress,
          location: geoip.lookup(ipAddress)?.city || 'Unknown location',
          time: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error('Error sending login alert email:', emailError);
        // Não interrompemos o fluxo se o email falhar
      }
    }

    // Registrar login bem-sucedido
    await loginHistoryService.recordLoginAttempt({
      userId: user.id,
      ipAddress,
      userAgent,
      status: 'success',
      details: loginDetails,
    });

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
      newLocation: suspiciousCheck.suspicious && suspiciousCheck.reason === 'login_from_new_location',
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ message: 'Erro ao fazer login' });
  }
};

// Nova rota para obter histórico de login
export const getLoginHistory = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const limit = Number(req.query.limit) || 10;
    
    const history = await loginHistoryService.getLoginHistoryByUserId(userId, limit);
    
    return res.status(200).json({ history });
  } catch (error) {
    console.error('Erro ao buscar histórico de login:', error);
    return res.status(500).json({ message: 'Erro ao buscar histórico de login' });
  }
};