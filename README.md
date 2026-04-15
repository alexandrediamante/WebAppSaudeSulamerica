# Dashboard Financeiro de Saúde - Família Diamante

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1.0-FFCA28?logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)

Aplicação web para gerenciamento e rateio proporcional de custos de plano de saúde familiar. Calcula automaticamente a divisão de despesas entre beneficiários considerando valores base, coparticipações, multas e juros.

---

## 📋 Visão Geral do Projeto

### O que o aplicativo faz

O Dashboard Financeiro de Saúde permite:

- **Rateio proporcional automático**: Distribui o valor total do boleto entre os beneficiários de forma proporcional aos seus custos base
- **Gerenciamento de beneficiários**: Cadastro com valores base individuais e faixa etária
- **Cálculo de multas/juros**: Aplicação automática de acréscimos proporcionalmente
- **Persistência de dados**: Histórico mensal armazenado no Firebase Firestore
- **Visualização gráfica**: Gráfico de histórico de faturamento
- **Autenticação resiliente**: Sistema de autenticação anônima com fallback

### Funcionalidades principais

| Funcionalidade | Descrição |
|----------------|-----------|
| Dashboard de rateio | Interface intuitiva para visualizar e editar valores |
| Cálculo proporcional | Fórmula matemática garante que a soma dos valores = total do boleto |
| Gerenciamento de beneficiários | Patricia, Rebeca e Arthur Diamante com valores base personalizados |
| Histórico mensal | Salva e recupera dados de meses anteriores |
| Gráfico de evolução | Visualização do histórico de valores |
| Responsivo | Layout adaptável para desktop e mobile |

---

## 🏗️ Arquitetura (Padrão MVC)

O projeto segue uma arquitetura organizada em camadas:

```
src/
├── models/           # Dados e lógica de negócio
│   ├── beneficiarios.js   # Dados iniciais dos beneficiários
│   └── rateio.js          # Algoritmo de cálculo proporcional
├── views/            # Componentes React (UI)
│   ├── components/        # Componentes reutilizáveis
│   │   ├── AuthWarning.jsx
│   │   ├── BeneficiariosTable.jsx
│   │   ├── BoletoInput.jsx
│   │   ├── Header.jsx
│   │   ├── HistoricoChart.jsx
│   │   └── RateioCard.jsx
│   └── Dashboard.jsx      # Página principal
├── controllers/      # Hooks customizados (lógica de estado)
│   ├── useAuth.js         # Autenticação Firebase
│   ├── useDashboard.js    # Estado principal do dashboard
│   └── useFirestore.js    # Operações com Firestore
├── config/           # Configurações
│   └── firebase.js        # Inicialização do Firebase
└── utils/            # Utilitários
    └── formatters.js      # Formatação de moeda/números
```

### Fluxo de dados

```
Usuario -> View (Dashboard) -> Controller (useDashboard) 
                                    |
                                    v
                          Model (rateio.js) -> Firebase (Firestore)
```

---

## 🚀 Tecnologias

- **[React 18](https://react.dev/)** - Biblioteca para construção de interfaces
- **[Vite 6](https://vitejs.dev/)** - Build tool e dev server
- **[Firebase](https://firebase.google.com/)** - Backend as a Service (Auth + Firestore)
- **[Tailwind CSS 3](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Lucide React](https://lucide.dev/)** - Biblioteca de ícones

---

## ⚙️ Pré-requisitos

- **Node.js** 18+ ou 20+ ([Download](https://nodejs.org/))
- **npm** (incluído com Node.js)
- **Conta Firebase** com projeto configurado ([Console Firebase](https://console.firebase.google.com/))

---

## 📦 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd webapp-saude-sulamerica
```

### 2. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_APP_ID=rateio-diamante-app
```

> **Nota**: Obtenha essas credenciais em: Firebase Console > Configurações do projeto > Seus aplicativos > SDK Firebase (npm)

### 3. Instale as dependências

```bash
npm install
```

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

---

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento com hot reload |
| `npm run build` | Gera build de produção na pasta `dist/` |
| `npm run preview` | Preview do build de produção localmente |

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_FIREBASE_API_KEY` | Chave da API do Firebase | Sim |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação | Sim |
| `VITE_FIREBASE_PROJECT_ID` | ID do projeto Firebase | Sim |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket do Cloud Storage | Sim |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID do Cloud Messaging | Sim |
| `VITE_FIREBASE_APP_ID` | ID do aplicativo Firebase | Sim |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID do Google Analytics | Não |
| `VITE_APP_ID` | Identificador interno do app | Não |

> **Importante**: Todas as variáveis devem começar com `VITE_` para serem expostas ao cliente no Vite.

---

## 🧮 Lógica de Cálculo de Rateio

O sistema utiliza uma fórmula proporcional para garantir que a soma dos valores rateados seja exatamente igual ao total do boleto.

### Fórmula

```
Fator = Total_Boleto / Total_Base

Onde:
- Total_Base = Σ (Quantidade × Preço_Base + Coparticipação) de cada beneficiário

Valor_Final_Cada = Subtotal_Base × Fator
```

### Exemplo prático

| Beneficiário | Qtd | Preço Base | Copart | Subtotal Base |
|--------------|-----|------------|--------|---------------|
| Patricia | 1 | R$ 808,01 | R$ 50,00 | R$ 858,01 |
| Rebeca | 1 | R$ 316,52 | R$ 0,00 | R$ 316,52 |
| Arthur | 1 | R$ 316,52 | R$ 0,00 | R$ 316,52 |
| **Total Base** | | | | **R$ 1.491,05** |

Se o boleto for **R$ 1.600,00**:
```
Fator = 1.600 / 1.491,05 = 1,0731

Patricia: 858,01 × 1,0731 = R$ 920,73
Rebeca:   316,52 × 1,0731 = R$ 339,66
Arthur:   316,52 × 1,0731 = R$ 339,66
---------------------------------------
Total:                              R$ 1.600,05 (arredondamento)
```

Isso garante que multas, juros e coparticipações sejam distribuídos proporcionalmente.

---

## 🚀 Deploy em Produção

### Opção 1: Deploy Direto (Debian 13)

1. Copie o projeto para o servidor
2. Execute o script de deploy:

```bash
sudo ./deploy.sh
```

O script irá:
- Instalar Node.js 20.x e Nginx
- Instalar dependências e fazer build
- Configurar o Nginx
- Configurar firewall (UFW)

3. Configure o domínio editando `nginx.conf`:
```nginx
server_name seu-dominio.com;
```

4. Reinicie o Nginx:
```bash
sudo systemctl restart nginx
```

### Opção 2: Docker + Docker Compose

1. Certifique-se de que o arquivo `.env` existe
2. Execute:

```bash
# Primeira execução
docker-compose up -d --build

# Atualizar após mudanças
docker-compose down
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

Acesse: http://localhost

### Configuração SSL (Let's Encrypt)

Após o deploy, configure HTTPS:

```bash
# Instale o Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenha o certificado
sudo certbot --nginx -d seu-dominio.com

# Teste a renovação automática
sudo certbot renew --dry-run
```

---

## 📁 Estrutura de Diretórios

```
webapp-saude-sulamerica/
├── .qoder/                 # Configurações do Qoder IDE
├── dist/                   # Build de produção (gerado)
│   ├── assets/
│   └── index.html
├── src/
│   ├── config/
│   │   └── firebase.js     # Configuração Firebase
│   ├── controllers/
│   │   ├── useAuth.js      # Hook de autenticação
│   │   ├── useDashboard.js # Hook principal do dashboard
│   │   └── useFirestore.js # Hook de operações Firestore
│   ├── models/
│   │   ├── beneficiarios.js # Dados dos beneficiários
│   │   └── rateio.js        # Lógica de cálculo
│   ├── utils/
│   │   └── formatters.js    # Utilitários de formatação
│   ├── views/
│   │   ├── components/      # Componentes da UI
│   │   │   ├── AuthWarning.jsx
│   │   │   ├── BeneficiariosTable.jsx
│   │   │   ├── BoletoInput.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── HistoricoChart.jsx
│   │   │   └── RateioCard.jsx
│   │   └── Dashboard.jsx    # Componente principal
│   ├── App.jsx              # Entry point da aplicação
│   ├── index.css            # Estilos globais
│   └── main.jsx             # Ponto de entrada
├── .dockerignore            # Arquivos ignorados pelo Docker
├── .env                     # Variáveis de ambiente (não commitar)
├── .env.example             # Exemplo de variáveis
├── .gitignore               # Arquivos ignorados pelo Git
├── deploy.sh                # Script de deploy Debian
├── Dockerfile               # Configuração Docker
├── docker-compose.yml       # Orquestração Docker
├── ecosystem.config.cjs     # Configuração PM2
├── index.html               # HTML principal
├── nginx.conf               # Configuração Nginx
├── package.json             # Dependências npm
├── postcss.config.js        # Configuração PostCSS
├── tailwind.config.js       # Configuração Tailwind
└── vite.config.js           # Configuração Vite
```

---

## 🔒 Segurança

- **Credenciais**: Todas as credenciais Firebase são armazenadas em variáveis de ambiente (`.env`)
- **Git**: O arquivo `.env` está incluído no `.gitignore` e nunca deve ser commitado
- **Nginx**: Headers de segurança configurados (X-Frame-Options, X-Content-Type-Options, etc.)
- **Autenticação**: Firebase Authentication com fallback anônimo
- **Firestore**: Regras de segurança devem ser configuradas no Console Firebase

### Regras recomendadas do Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

---

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique se as variáveis de ambiente estão configuradas corretamente
2. Verifique o console do navegador por erros
3. Consulte os logs do Nginx: `/var/log/nginx/`
4. Verifique a autenticação no Console Firebase

---

**Desenvolvido com React, Vite e Firebase** ❤️
