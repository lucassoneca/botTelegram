# 🤖 Bot de Ofertas do Mercado Livre para Telegram

Bot automatizado para o Telegram que monitora as melhores ofertas do **Mercado Livre** e publica automaticamente em canais ou grupos com o seu **link de afiliado**, com formatação profissional (fotos, preços, descontos, parcelamento e botões interativos).

---

## ✨ Funcionalidades

- 🔄 **Robô de Ofertas 100% Automático:** Varre periodicamente a página de ofertas do Mercado Livre e seleciona as melhores promoções.
- 🎯 **Filtro de Desconto Mínimo:** Posta apenas ofertas reais com desconto significativo (ex: acima de 15% ou 20%).
- 🛡️ **Anti-Duplicação Inteligente:** Registra ofertas postadas em cache local (`data/posted_deals.json`) para nunca enviar o mesmo produto repetido.
- 🎨 **Layout Atraente:** Mensagens com imagem em alta resolução, preço original riscado, preço promocional em destaque, % de desconto e botão interativo *"COMPRAR NO MERCADO LIVRE"*.
- 🔗 **Suporte a Link de Afiliado:** Anexa automaticamente suas tags ou parâmetros de rastreamento de afiliado.
- ⚡ **Modo Manual:** Envie qualquer link de produto do Mercado Livre no privado do bot para visualizar a prévia e postar com 1 clique no canal.

---

## 📁 Estrutura do Projeto

```text
botTelegram/
├── .env                  # Suas credenciais (NUNCA envie para o GitHub)
├── .env.example          # Modelo de configuração para repositório público
├── .gitignore            # Arquivos ignorados pelo Git (protege seu token)
├── package.json          # Dependências e scripts
├── README.md             # Instruções de uso
└── src/
    ├── config.js         # Validação de variáveis de ambiente
    ├── formatter.js      # Formatação estética dos posts em HTML
    ├── index.js          # Inicialização do Bot, comandos e agendador cron
    ├── scraper.js        # Extrator de ofertas do Mercado Livre
    └── storage.js        # Histórico de produtos postados (anti-duplicidade)
```

---

## 🚀 Instalação e Execução

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior instalada.

### 2. Instalação das dependências
Abra o terminal na pasta do projeto e execute:
```bash
npm install
```

### 3. Configuração do `.env`
Copie o modelo de exemplo para criar seu `.env` se ainda não tiver feito:
```bash
cp .env.example .env
```

Abra o arquivo `.env` e configure suas variáveis:
```env
# Token gerado no @BotFather
TELEGRAM_BOT_TOKEN=8769520506:AAGw2zpnKDep9s8vOturjkBprA4SpPqryno

# Canal onde as mensagens serão postadas (ex: @seucanal ou ID numérico)
TELEGRAM_CHAT_ID=@sonecapromocao

# Tag de afiliado do Mercado Livre (opcional)
MERCADO_LIVRE_AFFILIATE_TAG=

# Intervalo em minutos para checar novas ofertas (padrão: 30)
CHECK_INTERVAL_MINUTES=30

# Desconto mínimo (%) para uma oferta ser aceita (padrão: 15)
MIN_DISCOUNT_PERCENT=15

# Quantidade máxima de ofertas postadas a cada ciclo (padrão: 2)
MAX_POSTS_PER_RUN=2
```

---

## 📢 Como ativar a permissão do Bot no seu Canal

Para que o bot consiga postar no canal **SONECA DA PROMOÇÃO**, siga estes passos:

1. Abra o **Telegram** e entre no seu canal.
2. Clique no **nome do canal** no topo da tela para abrir as informações.
3. Clique no ícone de lápis / **Editar** e vá em **Administradores**.
4. Clique em **Adicionar Administrador**.
5. Busque pelo `@username` do seu bot.
6. Deixe marcada a permissão **"Postar mensagens"** (Post messages) e confirme.

### ❓ Como descobrir o ID ou Username do Canal (`TELEGRAM_CHAT_ID`)
- **Se o seu canal for público:**  
  Basta colocar o `@` do canal no `.env` (exemplo: `TELEGRAM_CHAT_ID=@nomedocanal`).
- **Se o seu canal for privado:**  
  1. Adicione o bot como administrador no canal.
  2. Envie qualquer mensagem no canal. O bot imprimirá no console do terminal o ID numérico (ex: `-1001987654321`).
  3. Cole esse ID no campo `TELEGRAM_CHAT_ID` no seu `.env`.

---

## ▶️ Iniciando o Bot

Para iniciar o bot em modo padrão:
```bash
npm start
```

Para rodar em modo de desenvolvimento (reinicia automaticamente ao alterar arquivos):
```bash
npm run dev
```

---

## 💬 Comandos no Telegram

Você pode conversar com o bot diretamente no privado:
- `/start` - Apresenta o bot e os comandos disponíveis.
- `/status` - Exibe as configurações atuais (canal, intervalo, desconto mínimo).
- `/testar` - Busca e envia uma oferta de exemplo na hora para o seu chat privado.
- `/postar <link>` - Extrai os dados do link e posta imediatamente no canal configurado.
- **Envio direto de link:** Cole qualquer link do Mercado Livre no privado do bot. Ele montará a mensagem e fornecerá um botão para você postar no canal oficial se desejar.

---

## 🔒 Segurança para o GitHub

Este projeto já está configurado com o `.gitignore` adequado:
- O arquivo `.env` **nunca será adicionado ao GitHub**, mantendo seu token seguro.
- Para subir seu projeto com segurança, utilize:
```bash
git add .
git commit -m "feat: bot de ofertas do mercado livre"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```
