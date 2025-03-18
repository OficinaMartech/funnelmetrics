// ~/funnelmetrics/api/src/services/emailService.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Interface para dados de email
interface EmailData {
  name: string;
  email: string;
  resetURL?: string;
}

// Criar transportador para cada serviço suportado
const createTransporter = async () => {
  // Verificar se estamos em ambiente de produção
  if (process.env.NODE_ENV === 'production') {
    // Verificar qual serviço de email está configurado
    const emailService = process.env.EMAIL_SERVICE?.toLowerCase();

    // SendGrid
    if (emailService === 'sendgrid') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USER,
          pass: process.env.SENDGRID_API_KEY,
        },
      });
    }

    // AWS SES
    if (emailService === 'ses') {
      return nodemailer.createTransport({
        service: 'SES',
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY,
          pass: process.env.AWS_SES_SECRET_KEY,
        },
      });
    }

    // SMTP padrão
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Em desenvolvimento, usar Ethereal para testes
    try {
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.error('Erro ao criar conta de teste Ethereal:', error);
      throw new Error('Não foi possível configurar o serviço de email para testes');
    }
  }
};

// Função para obter o URL de visualização do email (apenas em desenvolvimento)
const getEmailPreviewUrl = (info: any): string | null => {
  if (process.env.NODE_ENV !== 'production' && typeof nodemailer.getTestMessageUrl === 'function') {
    return nodemailer.getTestMessageUrl(info);
  }
  return null;
};

// Função para enviar email de recuperação de senha
export const sendPasswordResetEmail = async ({ name, email, resetURL }: EmailData): Promise<any> => {
  try {
    if (!resetURL) {
      throw new Error('URL de redefinição de senha não fornecida');
    }

    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"FunnelMetrics" <${process.env.EMAIL_FROM || 'noreply@funnelmetrics.com'}>`,
      to: email,
      subject: 'Recuperação de Senha - FunnelMetrics',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Recuperação de Senha</h2>
          <p>Olá ${name},</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no FunnelMetrics.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <div style="margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Redefinir Senha</a>
          </div>
          <p style="margin-bottom: 30px;">Se você não solicitou uma redefinição de senha, por favor ignore este email.</p>
          <p style="color: #666; font-size: 14px;">Este link expirará em 1 hora por motivos de segurança.</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #666; font-size: 12px;">© 2025 FunnelMetrics. Todos os direitos reservados.</p>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    const previewURL = getEmailPreviewUrl(info);
    
    return {
      success: true,
      messageId: info.messageId,
      previewURL,
    };
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    throw new Error('Erro ao enviar email de recuperação de senha');
  }
};

// Função para enviar email de boas-vindas
export const sendWelcomeEmail = async ({ name, email }: EmailData): Promise<any> => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"FunnelMetrics" <${process.env.EMAIL_FROM || 'noreply@funnelmetrics.com'}>`,
      to: email,
      subject: 'Bem-vindo ao FunnelMetrics',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Bem-vindo ao FunnelMetrics!</h2>
          <p>Olá ${name},</p>
          <p>Obrigado por se cadastrar no FunnelMetrics, sua plataforma para criação e análise de funis de marketing.</p>
          <p>Estamos animados para ajudá-lo a otimizar suas conversões e melhorar suas campanhas de marketing.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Acessar minha conta</a>
          </div>
          <p>Precisa de ajuda? Entre em contato com nosso suporte:</p>
          <p><a href="mailto:suporte@funnelmetrics.com" style="color: #4f46e5;">suporte@funnelmetrics.com</a></p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #666; font-size: 12px;">© 2025 FunnelMetrics. Todos os direitos reservados.</p>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    const previewURL = getEmailPreviewUrl(info);
    
    return {
      success: true,
      messageId: info.messageId,
      previewURL,
    };
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw new Error('Erro ao enviar email de boas-vindas');
  }
};

// Função para enviar email de confirmação de assinatura
export const sendSubscriptionConfirmationEmail = async ({ name, email }: EmailData): Promise<any> => {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"FunnelMetrics" <${process.env.EMAIL_FROM || 'noreply@funnelmetrics.com'}>`,
      to: email,
      subject: 'Assinatura Confirmada - FunnelMetrics',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Assinatura Confirmada!</h2>
          <p>Olá ${name},</p>
          <p>Sua assinatura do plano FunnelMetrics foi confirmada com sucesso!</p>
          <p>A partir de agora, você tem acesso a todos os recursos premium da nossa plataforma.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Acessar minha conta</a>
          </div>
          <p>Precisa de ajuda? Entre em contato com nosso suporte:</p>
          <p><a href="mailto:suporte@funnelmetrics.com" style="color: #4f46e5;">suporte@funnelmetrics.com</a></p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #666; font-size: 12px;">© 2025 FunnelMetrics. Todos os direitos reservados.</p>
        </div>
      `,
    };
    
    const info = await transporter.sendMail(mailOptions);
    const previewURL = getEmailPreviewUrl(info);
    
    return {
      success: true,
      messageId: info.messageId,
      previewURL,
    };
  } catch (error) {
    console.error('Erro ao enviar email de confirmação de assinatura:', error);
    throw new Error('Erro ao enviar email de confirmação de assinatura');
  }
};

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendSubscriptionConfirmationEmail,
};