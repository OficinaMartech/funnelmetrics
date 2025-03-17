// ~/funnelmetrics/api/src/services/emailService.ts
import nodemailer from 'nodemailer';

// Configuração do transportador de email
// No ambiente de desenvolvimento, podemos usar o ethereal.email (um serviço falso para teste)
// No ambiente de produção, você deve usar um serviço de email real (como Amazon SES, SendGrid, etc.)
const createTransporter = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Configuração de produção
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Boolean(process.env.EMAIL_SECURE) || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Configuração de desenvolvimento usando ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    return transporter;
  }
};

// Função para enviar email de recuperação de senha
export const sendPasswordResetEmail = async ({ name, email, resetURL }) => {
  try {
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
    
    // Para ambiente de desenvolvimento, retorna o link de visualização do Ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email enviado: %s', nodemailer.getTestMessageUrl(info));
      return { success: true, previewURL: nodemailer.getTestMessageUrl(info) };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de recuperação de senha:', error);
    throw new Error('Erro ao enviar email de recuperação de senha');
  }
};

// Função para enviar email de boas-vindas
export const sendWelcomeEmail = async ({ name, email }) => {
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
    
    // Para ambiente de desenvolvimento, retorna o link de visualização do Ethereal
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email enviado: %s', nodemailer.getTestMessageUrl(info));
      return { success: true, previewURL: nodemailer.getTestMessageUrl(info) };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar email de boas-vindas:', error);
    throw new Error('Erro ao enviar email de boas-vindas');
  }
};

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
};