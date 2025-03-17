// ~/funnelmetrics/api/src/config/auth.ts
export default {
    jwtSecret: process.env.JWT_SECRET || 'funnelmetrics-secret-key-dev',
    jwtExpiresIn: '1d', // Token expira em 1 dia
    refreshTokenExpiresIn: '7d', // Refresh token expira em 7 dias
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
      sameSite: 'strict' as const
    }
  };