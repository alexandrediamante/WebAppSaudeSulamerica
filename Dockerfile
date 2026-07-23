# =============================================================================
# Dockerfile - WebApp Saude Sulamerica
# Multi-stage build para otimização de imagem
# =============================================================================

# =============================================================================
# STAGE 1: Build
# =============================================================================
FROM node:20-alpine AS builder

# =============================================================================
# Build arguments - variáveis de ambiente para o Vite
# Devem ser passadas via docker-compose build.args ou --build-arg
# =============================================================================
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_APP_ID

# Converte ARG para ENV para que o Vite substitua import.meta.env.*
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID \
    VITE_APP_ID=$VITE_APP_ID

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração de dependências primeiro
# (aproveita o cache do Docker se não houver mudanças)
COPY package*.json ./

# Instala TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Copia o restante dos arquivos do projeto
COPY . .

# Executa o build de produção
RUN npm run build

# =============================================================================
# STAGE 2: Produção
# =============================================================================
FROM nginx:alpine

# Define labels da imagem
LABEL maintainer="WebApp Saude Sulamerica"
LABEL description="SPA React com Vite para rateio de plano de saúde"

# Instala curl para healthchecks
RUN apk add --no-cache curl

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia a configuração customizada do Nginx (específica para Docker)
COPY nginx.docker.conf /etc/nginx/conf.d/webapp.conf

# Copia os arquivos buildados do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# NOTA: NÃO copiar .env para o diretório público do Nginx - isso exporia credenciais
# Em uma SPA Vite, as variáveis de ambiente já são injetadas no build via import.meta.env
# As variáveis devem estar disponíveis durante o build (stage 1), não em runtime

# Configura permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expondo a porta 80
EXPOSE 80

# Healthcheck para verificar se o Nginx está respondendo
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando para iniciar o Nginx em foreground
CMD ["nginx", "-g", "daemon off;"]
