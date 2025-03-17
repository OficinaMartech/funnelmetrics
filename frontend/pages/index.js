import Head from 'next/head';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Head>
        <title>FunnelMetrics</title>
        <meta name="description" content="Plataforma de gerenciamento de funis de marketing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
        <h1 className="text-4xl font-bold text-indigo-600">
          Bem-vindo ao <span>FunnelMetrics</span>
        </h1>

        <p className="mt-3 text-xl">
          Sua plataforma para criação e análise de funis de marketing
        </p>

        <div className="mt-8 flex justify-center">
          <a href="/login" className="rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700">
            Acessar
          </a>
        </div>
      </main>

      <footer className="flex w-full items-center justify-center border-t py-4">
        <p>© 2025 FunnelMetrics. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
