#!/bin/bash

# Carregar variáveis de ambiente
set -a
source .env
set +a

# Iniciar os containers
docker-compose up -d

echo "FunnelMetrics está rodando em: https://funnels.oficinamartech.com"
