import nodemailer from 'nodemailer';

interface EmailData {
  name: string;
  email: string;
  resetURL?: string;
  subscriptionDetails?: any;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  // Enviar email de redefinição de senha
  async sendPasswordResetEmail({ name, email, resetURL }: EmailData): Promise<any> {
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Redefinição de Senha',
      html: `
        <p>Olá ${name},</p>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetURL}" target="_blank">Redefinir Senha</a>
        <p>Este link é válido por 10 minutos.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe Funnel Metrics</p>
      `
    };

    return this.transporter.sendMail(message);
  }

  // Enviar email de boas-vindas
  async sendWelcomeEmail({ name, email }: EmailData): Promise<any> {
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Bem-vindo ao Funnel Metrics',
      html: `
        <p>Olá ${name},</p>
        <p>Bem-vindo ao Funnel Metrics!</p>
        <p>Estamos muito felizes em ter você como parte da nossa comunidade.</p>
        <p>Para começar, acesse seu painel e configure seu primeiro funil:</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" target="_blank">Acessar Painel</a>
        <p>Se precisar de ajuda, estamos à disposição.</p>
        <p>Atenciosamente,<br>Equipe Funnel Metrics</p>
      `
    };

    return this.transporter.sendMail(message);
  }

  // Enviar email de confirmação de assinatura
  async sendSubscriptionConfirmationEmail({ name, email, subscriptionDetails }: EmailData): Promise<any> {
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Confirmação de Assinatura',
      html: `
        <p>Olá ${name},</p>
        <p>Sua assinatura foi confirmada com sucesso!</p>
        <p>Detalhes da assinatura:</p>
        <ul>
          <li>Plano: ${subscriptionDetails?.plan || 'Padrão'}</li>
          <li>Valor: ${subscriptionDetails?.amount || '0.00'}</li>
          <li>Data de início: ${subscriptionDetails?.startDate || 'hoje'}</li>
        </ul>
        <p>Agradecemos pela confiança!</p>
        <p>Atenciosamente,<br>Equipe Funnel Metrics</p>
      `
    };

    return this.transporter.sendMail(message);
  }

  // Enviar email de falha de pagamento
  async sendPaymentFailedEmail({ name, email, subscriptionDetails }: EmailData): Promise<any> {
    const message = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: 'Falha no Pagamento da Assinatura',
      html: `
        <p>Olá ${name},</p>
        <p>Identificamos uma falha no processamento do pagamento da sua assinatura.</p>
        <p>Detalhes:</p>
        <ul>
          <li>Plano: ${subscriptionDetails?.plan || 'Padrão'}</li>
          <li>Data da tentativa: ${new Date().toLocaleDateString()}</li>
        </ul>
        <p>Por favor, verifique seus dados de pagamento no painel:</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/billing" target="_blank">Atualizar Dados de Pagamento</a>
        <p>Se precisar de ajuda, entre em contato com nosso suporte.</p>
        <p>Atenciosamente,<br>Equipe Funnel Metrics</p>
      `
    };

    return this.transporter.sendMail(message);
  }
}

export default new EmailService();