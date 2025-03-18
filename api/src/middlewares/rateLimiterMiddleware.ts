import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições deste IP, por favor tente novamente após 15 minutos'
  }
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // limite de 10 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas de login deste IP, por favor tente novamente após 1 hora'
  }
});