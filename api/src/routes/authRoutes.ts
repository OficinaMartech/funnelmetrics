// ~/funnelmetrics/api/src/routes/authRoutes.ts
import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest, authValidation } from '../middlewares/validationMiddleware';
import { rateLimiter } from '../middlewares/rateLimiterMiddleware';

const router = Router();

// Rotas públicas com validação e rate limiting
router.post(
  '/register',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), // Limitar a 5 registros por hora por IP
  validateRequest(authValidation.register),
  authController.register
);

router.post(
  '/login',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // Limitar a 10 tentativas de login por 15 minutos por IP
  validateRequest(authValidation.login),
  authController.login
);

router.post('/logout', authController.logout);

router.post('/refresh-token', authController.refreshToken);

router.post(
  '/forgot-password',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // Limitar a 3 solicitações de recuperação por hora por IP
  validateRequest(authValidation.forgotPassword),
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // Limitar a 3 redefinições de senha por hora por IP
  validateRequest(authValidation.resetPassword),
  authController.resetPassword
);

// Rotas protegidas
router.get('/me', authenticate, authController.getMe);

// Rota para atualizar perfil
router.put(
  '/profile',
  authenticate,
  validateRequest(userValidation.updateProfile),
  authController.updateProfile
);

// Rota para alterar senha
router.post(
  '/change-password',
  authenticate,
  validateRequest(userValidation.changePassword),
  authController.changePassword
);

// Exportar router
export default router;