FROM node:18-alpine

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar arquivos do projeto
COPY . .

# Construir o aplicativo
RUN npm run build

EXPOSE 3000

# Iniciar o servidor Next.js
CMD ["npm", "start"]
