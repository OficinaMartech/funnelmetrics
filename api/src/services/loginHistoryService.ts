// ~/funnelmetrics/api/src/services/loginHistoryService.ts
import LoginHistory from '../models/LoginHistory';
import geoip from 'geoip-lite';

interface LoginAttemptData {
  userId: number;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed';
  details?: string;
}

// Registrar uma tentativa de login (bem-sucedida ou falha)
export const recordLoginAttempt = async (data: LoginAttemptData): Promise<LoginHistory> => {
  try {
    // Tentar obter localização pelo IP
    let location = '';
    const geo = geoip.lookup(data.ipAddress);
    
    if (geo) {
      location = `${geo.city || ''}, ${geo.region || ''}, ${geo.country || ''}`.replace(/^, |, $/, '');
    }
    
    // Criar registro no histórico
    const loginHistory = await LoginHistory.create({
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location,
      status: data.status,
      details: data.details,
    });
    
    return loginHistory;
  } catch (error) {
    console.error('Erro ao registrar tentativa de login:', error);
    throw new Error('Erro ao registrar tentativa de login');
  }
};

// Obter histórico de login de um usuário
export const getLoginHistoryByUserId = async (userId: number, limit: number = 10): Promise<LoginHistory[]> => {
  try {
    const history = await LoginHistory.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
    });
    
    return history;
  } catch (error) {
    console.error('Erro ao buscar histórico de login:', error);
    throw new Error('Erro ao buscar histórico de login');
  }
};

// Verificar atividade suspeita nos logins de um usuário
export const checkSuspiciousActivity = async (userId: number, ipAddress: string): Promise<{ suspicious: boolean; reason?: string }> => {
  try {
    // Buscar histórico recente de logins do usuário
    const recentHistory = await LoginHistory.findAll({
      where: { 
        userId,
        status: 'success',
      },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    
    // Se não houver histórico, é o primeiro login (não é suspeito)
    if (recentHistory.length === 0) {
      return { suspicious: false };
    }
    
    // Verificar se o IP atual é diferente dos IPs anteriores
    const knownIPs = recentHistory.map(h => h.ipAddress);
    if (!knownIPs.includes(ipAddress)) {
      return { 
        suspicious: true,
        reason: 'login_from_new_location'
      };
    }
    
    // Outras verificações de segurança podem ser adicionadas aqui
    
    return { suspicious: false };
  } catch (error) {
    console.error('Erro ao verificar atividade suspeita:', error);
    // Em caso de erro, não bloquear o login
    return { suspicious: false };
  }
};

export default {
  recordLoginAttempt,
  getLoginHistoryByUserId,
  checkSuspiciousActivity,
};