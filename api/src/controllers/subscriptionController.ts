// ~/funnelmetrics/api/src/controllers/subscriptionController.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import subscriptionService from '../services/subscriptionService';
import { PlanType } from '../models/Subscription';

// Obter informações da assinatura do usuário
export const getSubscription = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    
    const subscription = await subscriptionService.getSubscriptionByUserId(userId);
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        message: 'Assinatura não encontrada',
      });
    }
    
    return res.status(200).json({
      status: 'success',
      data: subscription,
    });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar informações da assinatura',
    });
  }
};

// Criar uma sessão de checkout para assinatura
export const createCheckoutSession = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const { planType } = req.body;
    
    // Validar tipo de plano
    if (!planType || !['basic', 'professional', 'enterprise'].includes(planType)) {
      return res.status(400).json({
        status: 'error',
        message: 'Tipo de plano inválido',
      });
    }
    
    // Criar URL de checkout
    const checkoutUrl = await subscriptionService.createCheckoutSession(
      userId,
      planType as PlanType
    );
    
    return res.status(200).json({
      status: 'success',
      data: { checkoutUrl },
    });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Erro ao criar sessão de checkout',
    });
  }
};

// Cancelar assinatura
export const cancelSubscription = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    const { cancelImmediately } = req.body;
    
    const subscription = await subscriptionService.cancelSubscription(
      userId,
      !!cancelImmediately
    );
    
    return res.status(200).json({
      status: 'success',
      message: cancelImmediately 
        ? 'Assinatura cancelada com sucesso' 
        : 'Assinatura será cancelada ao final do período atual',
      data: subscription,
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Erro ao cancelar assinatura',
    });
  }
};

// Webhook do Stripe
export const stripeWebhook = async (req: Request, res: Response): Promise<Response> => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    return res.status(400).json({
      status: 'error',
      message: 'Assinatura Stripe não fornecida',
    });
  }
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
    });
    
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    await subscriptionService.processStripeWebhook(event);
    
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Erro ao processar webhook',
    });
  }
};

// Mudar para plano gratuito
export const switchToFreePlan = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = req.user.id;
    
    const subscription = await subscriptionService.updateSubscription(userId, 'free');
    
    return res.status(200).json({
      status: 'success',
      message: 'Plano atualizado para gratuito com sucesso',
      data: subscription,
    });
  } catch (error) {
    console.error('Erro ao mudar para plano gratuito:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Erro ao mudar para plano gratuito',
    });
  }
};

export default {
  getSubscription,
  createCheckoutSession,
  cancelSubscription,
  stripeWebhook,
  switchToFreePlan,
};
