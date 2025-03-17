// ~/funnelmetrics/frontend/pages/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Por enquanto, sempre redireciona para o login
    // No futuro, verificaremos se o usuário está autenticado
    // e redirecionaremos para o dashboard caso esteja
    router.push('/auth/login');
  }, [router]);

  return null; // Não renderiza nada, apenas redireciona
}