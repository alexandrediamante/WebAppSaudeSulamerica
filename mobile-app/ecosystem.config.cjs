/**
 * =============================================================================
 * Configuração PM2 para WebApp Saude Sulamerica
 * Alternativa ao Nginx para servir a SPA em produção
 * =============================================================================
 *
 * Uso:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 *
 * Para usar Nginx em vez de PM2, desative este arquivo e configure o nginx.conf
 */

module.exports = {
  apps: [
    {
      // Nome da aplicação no PM2
      name: "webapp-saude-sulamerica",

      // Comando para executar (serve via npx)
      script: "npx",

      // Argumentos: serve o diretório dist em modo SPA na porta 3000
      args: "serve dist -s -l 3000",

      // Diretório de trabalho
      cwd: "/var/www/webapp-saude-sulamerica",

      // Variáveis de ambiente
      env: {
        NODE_ENV: "production",
      },

      // Número de instâncias (1 para SPA, pode aumentar para load balancing)
      instances: 1,

      // Reiniciar automaticamente em caso de falha
      autorestart: true,

      // Não observar mudanças nos arquivos (produção)
      watch: false,

      // Reiniciar se uso de memória exceder 256MB
      max_memory_restart: "256M",

      // Configurações de log
      log_file: "/var/log/pm2/webapp-saude-sulamerica.log",
      out_file: "/var/log/pm2/webapp-saude-sulamerica-out.log",
      error_file: "/var/log/pm2/webapp-saude-sulamerica-error.log",

      // Formato de data nos logs
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Merge dos logs (stdout e stderr no mesmo arquivo)
      merge_logs: true,

      // Modo de execução (fork para aplicações simples, cluster para múltiplas instâncias)
      exec_mode: "fork",
    },
  ],
};
