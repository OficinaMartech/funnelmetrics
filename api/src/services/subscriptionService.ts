// ~/funnelmetrics/api/src/services/subscriptionService.ts
import Subscription, { PlanType } from '../models/Subscription';
import User from '../models/User';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import emailService from './emailService';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Versão mais recente da API (atualizar conforme necessário)
});

// Mapear planos para IDs de produtos/preços do Stripe
const STRIPE_PRICE_IDS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional',
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
};

// Criar ou atualizar customer no Stripe
const getOrCreateStripeCustomer = async (user: User): Promise<string> => {
  try {
    // Buscar assinatura existente para verificar se já há um customerId
    const subscription = await Subscription.findOne({ where: { userId: user.id } });
    
    if (subscription?.stripeCustomerId) {
      // Atualizar cliente existente
      await stripe.customers.update(subscription.stripeCustomerId, {
        email: user.email,
        name: user.name,
        metadata: {
          userId: String(user.id),
        },
      });
      
      return subscription.stripeCustomerId;
    }
    
    // Criar novo cliente
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: String(user.id),
      },
    });
    
    return customer.id;
  } catch (error) {
    console.error('Erro ao criar/atualizar cliente no Stripe:', error);
    throw new Error('Erro ao processar cliente no Stripe');
  }
};

// Criar uma nova assinatura
export const createSubscription = async (userId: number, planType: PlanType): Promise<Subscription> => {
  try {
    // Verificar se o usuário já tem uma assinatura
    const existingSubscription = await Subscription.findOne({ where: { userId } });
    
    if (existingSubscription) {
      throw new Error('Usuário já possui uma assinatura');
    }
    
    // Buscar usuário
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Para plano gratuito, não precisamos de integração com Stripe
    if (planType === 'free') {
      return await Subscription.create({
        userId,
        planType,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        cancelAtPeriodEnd: false,
      });
    }
    
    // Para planos pagos, integramos com Stripe
    const stripeCustomerId = await getOrCreateStripeCustomer(user);
    
    // Criar assinatura com status 'pending'
    const subscription = await Subscription.create({
      userId,
      planType,
      status: 'pending',
      stripeCustomerId,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      cancelAtPeriodEnd: false,
    });
    
    return subscription;
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw error;
  }
};

// Atualizar uma assinatura existente
export const updateSubscription = async (userId: number, planType: PlanType): Promise<Subscription> => {
  try {
    // Buscar assinatura existente
    const subscription = await Subscription.findOne({ where: { userId } });
    
    if (!subscription) {
      throw new Error('Assinatura não encontrada');
    }
    
    // Atualizar plano
    subscription.planType = planType;
    
    // Se mudar para plano gratuito, cancelar no Stripe
    if (planType === 'free' && subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      subscription.status = 'active';
      subscription.stripeSubscriptionId = null;
      subscription.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 ano
    }
    
    await subscription.save();
    
    return subscription;
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
};

// Cancelar uma assinatura
export const cancelSubscription = async (userId: number, cancelImmediately: boolean = false): Promise<Subscription> => {
  try {
    // Buscar assinatura existente
    const subscription = await Subscription.findOne({ where: { userId } });
    
    if (!subscription) {
      throw new Error('Assinatura não encontrada');
    }
    
    // Se tem ID de assinatura no Stripe, cancelar lá também
    if (subscription.stripeSubscriptionId) {
      if (cancelImmediately) {
        // Cancelamento imediato
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
        
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
      } else {
        // Cancelamento ao final do período
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        
        subscription.cancelAtPeriodEnd = true;
      }
    } else {
      // Assinatura sem integração com Stripe (provavelmente plano gratuito)
      if (cancelImmediately) {
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
      } else {
        subscription.cancelAtPeriodEnd = true;
      }
    }
    
    await subscription.save();
    
    return subscription;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
};

// Processar webhook do Stripe
export const processStripeWebhook = async (event: Stripe.Event): Promise<void> => {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        
        // Buscar assinatura pelo customerId
        const dbSubscription = await Subscription.findOne({
          where: { stripeCustomerId },
          include: [{ model: User, as: 'user' }]
        });
        
        if (!dbSubscription) {
          console.error('Assinatura não encontrada para o customer:', stripeCustomerId);
          return;
        }
        
        // Atualizar detalhes da assinatura
        dbSubscription.stripeSubscriptionId = subscription.id;
        dbSubscription.status = subscription.status === 'active' ? 'active' : 'pending';
        dbSubscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
        dbSubscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        dbSubscription.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        
        if (subscription.canceled_at) {
          dbSubscription.canceledAt = new Date(subscription.canceled_at * 1000);
        }
        
        await dbSubscription.save();
        
        // Se a assinatura foi ativada, enviar email de confirmação
        if (
          event.type === 'customer.subscription.updated' && 
          subscription.status === 'active' &&
          dbSubscription.user
        ) {
          await emailService.sendSubscriptionConfirmationEmail({
            name: dbSubscription.user.name,
            email: dbSubscription.user.email,
          });
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const stripeCustomerId = subscription.customer as string;
        
        // Buscar assinatura pelo customerId
        const dbSubscription = await Subscription.findOne({
          where: { stripeCustomerId },
        });
        
        if (!dbSubscription) {
          console.error('Assinatura não encontrada para o customer:', stripeCustomerId);
          return;
        }
        
        // Atualizar para status cancelado
        dbSubscription.status = 'canceled';
        dbSubscription.canceledAt = new Date();
        
        await dbSubscription.save();
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Lógica para processar pagamento bem-sucedido
        // Por exemplo, atualizar histórico de pagamentos
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeCustomerId = invoice.customer as string;
        
        // Buscar assinatura pelo customerId
        const dbSubscription = await Subscription.findOne({
          where: { stripeCustomerId },
          include: [{ model: User, as: 'user' }]
        });
        
        if (!dbSubscription || !dbSubscription.user) {
          console.error('Assinatura/usuário não encontrado para o customer:', stripeCustomerId);
          return;
        }
        
        // Enviar email sobre falha no pagamento
        await emailService.sendPaymentFailedEmail({
          name: dbSubscription.user.name,
          email: dbSubscription.user.email,
        });
        
        break;
      }
    }
  } catch (error) {
    console.error('Erro ao processar webhook do Stripe:', error);
    throw error;
  }
};

// Obter informações da assinatura de um usuário
export const getSubscriptionByUserId = async (userId: number): Promise<Subscription | null> => {
  try {
    return await Subscription.findOne({ where: { userId } });
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    throw error;
  }
};

// Criar sessão de checkout do Stripe
export const createCheckoutSession = async (userId: number, planType: PlanType): Promise<string> => {
  try {
    if (planType === 'free') {
      throw new Error('Não é possível criar sessão de checkout para plano gratuito');
    }
    
    // Verificar se o plano existe
    if (!STRIPE_PRICE_IDS[planType]) {
      throw new Error(`ID de preço não configurado para o plano ${planType}`);
    }
    
    // Buscar usuário
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Criar ou obter customer
    const stripeCustomerId = await getOrCreateStripeCustomer(user);
    
    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_IDS[planType],
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?subscription=canceled`,
      metadata: {
        userId: String(userId),
        planType,
      },
    });
    
    return session.url;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
};

export default {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  processStripeWebhook,
  getSubscriptionByUserId,
  createCheckoutSession,
};