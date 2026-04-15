#!/bin/bash
# =============================================================================
# Script de Deploy - WebApp Saude Sulamerica
# Debian 13 (Trixie) - Produção
# =============================================================================
# Uso: sudo ./deploy.sh
# =============================================================================

# Encerra o script em caso de erro
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Funções de utilidade
# =============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCESSO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# =============================================================================
# Verificação de privilégios root
# =============================================================================
if [[ $EUID -ne 0 ]]; then
   log_error "Este script deve ser executado como root ou com sudo"
   exit 1
fi

log_info "Iniciando deploy do WebApp Saude Sulamerica..."

# =============================================================================
# Variáveis de configuração
# =============================================================================
DEPLOY_DIR="/var/www/webapp-saude-sulamerica"
NGINX_CONF="/etc/nginx/sites-available/webapp-saude-sulamerica"
NGINX_ENABLED="/etc/nginx/sites-enabled/webapp-saude-sulamerica"
DOMAIN="your_domain.com"

# =============================================================================
# Atualização do sistema
# =============================================================================
log_info "Atualizando repositórios do sistema..."
apt-get update -qq
log_success "Repositórios atualizados"

# =============================================================================
# Instalação do Node.js 20.x (NodeSource)
# =============================================================================
log_info "Instalando Node.js 20.x..."

# Instala dependências necessárias
apt-get install -y -qq curl ca-certificates gnupg

# Adiciona repositório NodeSource para Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Instala Node.js
apt-get install -y -qq nodejs

# Verifica instalação
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js ${NODE_VERSION} instalado"
log_success "npm ${NPM_VERSION} instalado"

# =============================================================================
# Instalação do Nginx
# =============================================================================
log_info "Instalando Nginx..."
apt-get install -y -qq nginx

# Inicia e habilita o Nginx
systemctl start nginx
systemctl enable nginx
log_success "Nginx instalado e iniciado"

# =============================================================================
# Criação do diretório de deploy
# =============================================================================
log_info "Criando diretório de deploy: ${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}"

# =============================================================================
# Copia dos arquivos do projeto
# =============================================================================
log_info "Copiando arquivos do projeto..."

# Diretório atual (onde o script está sendo executado)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Copia todos os arquivos necessários
rsync -av --exclude='node_modules' --exclude='dist' --exclude='.git' \
    "${SCRIPT_DIR}/" "${DEPLOY_DIR}/"

log_success "Arquivos copiados para ${DEPLOY_DIR}"

# =============================================================================
# Instalação das dependências Node
# =============================================================================
log_info "Instalando dependências do projeto..."
cd "${DEPLOY_DIR}"
npm ci --production=false
log_success "Dependências instaladas"

# =============================================================================
# Build de produção
# =============================================================================
log_info "Executando build de produção..."
npm run build
log_success "Build concluído"

# =============================================================================
# Configuração do arquivo .env
# =============================================================================
log_warn "Verificando arquivo de ambiente (.env)..."
if [[ ! -f "${DEPLOY_DIR}/.env" ]]; then
    log_warn "Arquivo .env não encontrado!"
    log_info "Copiando .env.example para .env..."
    if [[ -f "${DEPLOY_DIR}/.env.example" ]]; then
        cp "${DEPLOY_DIR}/.env.example" "${DEPLOY_DIR}/.env"
        log_warn "Por favor, edite o arquivo ${DEPLOY_DIR}/.env com suas credenciais reais"
    else
        log_error "Arquivo .env.example também não encontrado!"
        exit 1
    fi
fi

# =============================================================================
# Configuração do Nginx
# =============================================================================
log_info "Configurando Nginx..."

# Copia a configuração do Nginx
cp "${DEPLOY_DIR}/nginx.conf" "${NGINX_CONF}"

# Cria link simbólico para habilitar o site
if [[ -L "${NGINX_ENABLED}" ]]; then
    rm "${NGINX_ENABLED}"
fi
ln -s "${NGINX_CONF}" "${NGINX_ENABLED}"

# Remove o site default se existir
if [[ -L "/etc/nginx/sites-enabled/default" ]]; then
    rm "/etc/nginx/sites-enabled/default"
fi

# Cria diretórios de log
mkdir -p /var/log/nginx

# Testa a configuração do Nginx
nginx -t
log_success "Configuração do Nginx validada"

# =============================================================================
# Configuração de permissões
# =============================================================================
log_info "Configurando permissões..."
chown -R www-data:www-data "${DEPLOY_DIR}"
chmod -R 755 "${DEPLOY_DIR}/dist"
log_success "Permissões configuradas"

# =============================================================================
# Reinicialização do Nginx
# =============================================================================
log_info "Reiniciando Nginx..."
systemctl restart nginx
log_success "Nginx reiniciado"

# =============================================================================
# Configuração do Firewall (UFW)
# =============================================================================
log_info "Configurando firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full' || true
    ufw allow OpenSSH || true
    log_success "Firewall configurado"
else
    log_warn "UFW não instalado, pulando configuração do firewall"
fi

# =============================================================================
# Mensagem de sucesso
# =============================================================================
echo ""
echo "============================================================================="
echo -e "${GREEN}DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "============================================================================="
echo ""
echo "Aplicação disponível em:"
echo "  - HTTP:  http://${DOMAIN}"
echo "  - Local: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "Arquivos do projeto: ${DEPLOY_DIR}"
echo "Logs do Nginx:       /var/log/nginx/"
echo ""
echo "Comandos úteis:"
echo "  - Verificar status do Nginx:  systemctl status nginx"
echo "  - Reiniciar Nginx:            systemctl restart nginx"
echo "  - Ver logs de erro:           tail -f /var/log/nginx/webapp-saude-sulamerica-error.log"
echo "  - Ver logs de acesso:         tail -f /var/log/nginx/webapp-saude-sulamerica-access.log"
echo ""

# =============================================================================
# INSTRUÇÕES PARA CONFIGURAR SSL COM LET'S ENCRYPT
# =============================================================================
echo -e "${YELLOW}=============================================================================${NC}"
echo -e "${YELLOW}CONFIGURAÇÃO SSL (HTTPS) - INSTRUÇÕES${NC}"
echo -e "${YELLOW}=============================================================================${NC}"
echo ""
echo "Para configurar SSL com Let's Encrypt, execute os seguintes comandos:"
echo ""
echo "1. Instale o Certbot:"
echo "   apt-get install -y certbot python3-certbot-nginx"
echo ""
echo "2. Obtenha o certificado SSL:"
echo "   certbot --nginx -d ${DOMAIN}"
echo ""
echo "3. O Certbot irá:"
echo "   - Verificar a propriedade do domínio"
echo "   - Gerar os certificados SSL"
echo "   - Configurar automaticamente o Nginx para HTTPS"
echo "   - Configurar o redirecionamento HTTP -> HTTPS"
echo ""
echo "4. Teste a renovação automática:"
echo "   certbot renew --dry-run"
echo ""
echo "============================================================================="
