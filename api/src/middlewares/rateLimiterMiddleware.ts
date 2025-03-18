// ~/funnelmetrics/api/src/middlewares/rateLimiterMiddleware.ts
import rateLimit from 'express-rate-limit';

interface RateLimitOptions {
  windowMs: number; // Tempo em milissegundos
  max: number; // Número máximo de requisições nesse período
  message?: string; // Mensagem de erro personalizada
}

export const rateLimiter = (options: RateLimitOptions) => {
  const defaultMessage = 'Muitas requisições deste IP, por favor tente novamente mais tarde.';
  
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true, // Adiciona cabeçalhos padrão de rate-limit
    legacyHeaders: false, // Desabilita cabeçalhos antigos para compatibilidade
    message: {
      status: 'error',
      message: options.message || defaultMessage
    },
    skipSuccessfulRequests: false, // Não pular requisições bem-sucedidas
  });
};

// Rate limiter para rotas de API gerais
export const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por 15 minutos
  message: 'Limite de requisições excedido. Por favor, tente novamente em 15 minutos.'
});

// Rate limiter específico para rotas críticas (como autenticação)
export const authLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limite de 10 requisições por hora
  message: 'Muitas tentativas de autenticação. Tente novamente em 1 hora.'
});