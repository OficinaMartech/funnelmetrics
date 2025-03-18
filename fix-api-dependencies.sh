#!/bin/bash

cd api

# Instalar dependências faltantes
npm install --save cookie-parser express-rate-limit joi nodemailer geoip-lite
npm install --save-dev @types/cookie-parser @types/nodemailer @types/geoip-lite

# Garantir que as versões do TypeScript e dependências de runtime estejam atualizadas
npm install --save-dev typescript @types/express @types/node

# Atualizar o arquivo tsconfig.json para aceitar propriedades personalizadas em Request
echo '{
  "compilerOptions": {
    "target": "es6",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}' > tsconfig.json

# Criar o diretório de tipos personalizados
mkdir -p src/types

# Criar arquivo de declaração de tipos personalizados
echo 'import { Request } from "express";

// Extensão do tipo Request do Express
declare global {
  namespace Express {
    interface Request {
      user?: any;
      subscription?: any;
      project?: any;
      funnel?: any;
    }
  }
}' > src/types/express.d.ts

echo "Dependências corrigidas e arquivos de tipo criados."