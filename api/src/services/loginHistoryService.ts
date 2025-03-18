import mongoose, { Schema, Document } from 'mongoose';
import geoip from 'geoip-lite';

interface ILoginHistory extends Document {
  user: mongoose.Types.ObjectId | null;
  email: string;
  ip: string;
  successful: boolean;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  userAgent?: string;
  createdAt: Date;
}

const LoginHistorySchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  email: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  successful: {
    type: Boolean,
    required: true
  },
  location: {
    country: String,
    city: String,
    timezone: String
  },
  userAgent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const LoginHistory = mongoose.model<ILoginHistory>('LoginHistory', LoginHistorySchema);

class LoginHistoryService {
  // Adicionar registro de login bem-sucedido
  async addSuccessfulLogin(userId: string, ip: string, geo: any = null, userAgent?: string): Promise<void> {
    try {
      const user = await mongoose.model('User').findById(userId);
      
      if (!user) {
        console.error('Usuário não encontrado ao registrar login bem-sucedido');
        return;
      }
      
      await LoginHistory.create({
        user: userId,
        email: user.email,
        ip,
        successful: true,
        location: geo ? {
          country: geo.country,
          city: geo.city,
          timezone: geo.timezone
        } : undefined,
        userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar login bem-sucedido:', error);
    }
  }
  
  // Adicionar registro de tentativa de login falha
  async addFailedAttempt(email: string, ip: string, userAgent?: string): Promise<void> {
    try {
      const geo = geoip.lookup(ip);
      
      await LoginHistory.create({
        user: null,
        email,
        ip,
        successful: false,
        location: geo ? {
          country: geo.country,
          city: geo.city,
          timezone: geo.timezone
        } : undefined,
        userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar tentativa de login falha:', error);
    }
  }
  
  // Obter histórico de login de um usuário
  async getUserLoginHistory(userId: string, limit = 10): Promise<any[]> {
    try {
      return await LoginHistory.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Erro ao obter histórico de login:', error);
      return [];
    }
  }
  
  // Verificar se há muitas tentativas falhas recentes do mesmo IP
  async checkSuspiciousActivity(ip: string, timeWindowMinutes = 10, maxAttempts = 5): Promise<boolean> {
    try {
      const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
      
      const attempts = await LoginHistory.countDocuments({
        ip,
        successful: false,
        createdAt: { $gt: timeWindow }
      });
      
      return attempts >= maxAttempts;
    } catch (error) {
      console.error('Erro ao verificar atividade suspeita:', error);
      return false;
    }
  }
}

export const loginHistory = new LoginHistoryService();