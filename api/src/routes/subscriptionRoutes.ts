// ~/funnelmetrics/api/src/routes/subscriptionRoutes.ts
import { Router } from 'express';
import * as subscriptionController from '../controllers/subscriptionController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import Joi from 'joi';

const router = Router();

// Esquemas de validação para assinaturas
const subscriptionValidation = {
  createCheckout: Joi.object({
    planType: Joi.string().valid('basic', 'professional', 'enterprise').required()
      .messages({
        'any.required': 'O tipo de plano é obrigatório',
        'any.only': 'O tipo de plano deve ser "basic", "professional" ou "enterprise"'
      }),
  }),
  
  cancelSubscription: Joi.object({
    cancelImmediately: Joi.boolean().default(false)
      .messages({
        'boolean.base': 'O campo cancelImmediately deve ser um booleano'
      }),
  }),
};

// Rotas protegidas por autenticação
router.get(
  '/current',
  authenticate,
  subscriptionController.getSubscription
);

router.post(
  '/checkout',
  authenticate,
  validateRequest(subscriptionValidation.createCheckout),
  subscriptionController.createCheckoutSession
);

router.post(
  '/cancel',
  authenticate,
  validateRequest(subscriptionValidation.cancelSubscription),
  subscriptionController.cancelSubscription
);

router.post(
  '/free',
  authenticate,
  subscriptionController.switchToFreePlan
);

// Rota pública para webhooks do Stripe
// Aqui não verificamos CSRF pois é uma chamada de servidor para servidor
router.post(
  '/webhook',
  // A validação de assinatura é feita dentro do controlador
  // express.raw({ type: 'application/json' }), // Middleware para manter o body raw para verificação de assinatura
  subscriptionController.stripeWebhook
);

export default router;