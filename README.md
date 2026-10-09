# 🤖 Bot de Ofertas do Mercado Livre para Telegram

Bot inteligente para o Telegram que monitora automaticamente promoções do **Mercado Livre**, filtra produtos de alto engajamento (**Hardware, Roupas, Calçados e Suplementos**) e publica em canais ou grupos com o seu **link oficial de afiliado**, com formatação profissional (fotos, preços De/Por, descontos e botões interativos).

---

## ✨ Funcionalidades

- 🔄 **Monitoramento Automático:** Varre continuamente as páginas de ofertas do Mercado Livre.
- 🎯 **Filtro de Nichos Específicos:** Publica apenas produtos selecionados (Hardware, Moda, Calçados e Suplementos), descartando itens aleatórios.
- 🔗 **Afiliação Oficial:** Anexa parâmetros completos de rastreamento de criador/afiliado (`matt_tool`, `matt_word`, `forceInApp`) para maximizar comissões e abrir diretamente no app.
- 🛡️ **Anti-Duplicação Inteligente:** Registra ofertas postadas em cache local (`data/posted_deals.json`) para nunca reenviar o mesmo produto repetido.
- ⚡ **Modo Manual e Interativo:** Envie qualquer link de produto no privado do bot para gerar prévias imediatas e publicar com 1 clique.
- 🎨 **Cards Visuais com Alta Conversão:** Fotos em alta definição, preços formatados, badges de categoria e botão interativo *"COMPRAR NO MERCADO LIVRE"*.

---

## 📖 Guia Completo de Comandos do Bot

Estes comandos podem ser enviados diretamente no bate-papo privado com o seu bot:

| Comando | Descrição | Exemplo de Uso |
| :--- | :--- | :--- |
| **`/start`** | Inicia o bot, exibe mensagem de boas-vindas e a lista de comandos. | `/start` |
| **`/status`** | Consulta o status das configurações ativas (canal, intervalo, categorias, etc.). | `/status` |
| **`/id`** | Identifica o ID numérico do chat atual (essencial para configurar canais e grupos). | `/id` |
| **`/testar`** | Busca uma oferta real no Mercado Livre e envia uma prévia no seu chat privado. | `/testar` |
| **`/postar <link>`** | Extrai os dados de um produto específico e publica imediatamente no canal oficial. | `/postar https://produto.mercadolivre.com.br/...` |
| **Envio Direto de Link** | Cole qualquer link do Mercado Livre no privado para gerar prévia com botão de envio rápido. | *Basta colar o link no chat* |

---

### 🔍 Detalhamento dos Comandos

#### 1. `/start`
* **O que faz:** Apresenta o bot, exibe as categorias monitoradas e fornece o menu de comandos disponíveis.
* **Quando usar:** Na primeira interação com o bot no privado.

#### 2. `/status`
* **O que faz:** Retorna o resumo do status operacional:
  * 📢 **Canal de Destino:** Chat ID ou `@` configurado.
  * 🎯 **Categorias Ativas:** Confirmação dos nichos (Hardware, Roupas, Calçados e Suplementos).
  * ⏱️ **Intervalo de Busca:** Frequência de varredura (ex: a cada 60s).
  * 📦 **Máximo por Ciclo:** Limite de ofertas postadas por rodada.
  * 📄 **Páginas Monitoradas:** Quantidade de páginas varridas por busca.
  * 🏷️ **Desconto Mínimo:** Percentual mínimo de desconto aceito.
  * 🔗 **Tag Afiliado:** Estrutura de rastreamento configurada.

#### 3. `/id`
* **O que faz:** Retorna o ID numérico do chat onde a mensagem foi enviada.
* **Como usar para Grupos e Canais:**
  1. Adicione o bot como administrador no seu grupo ou canal.
  2. Envie `/id` (ou qualquer mensagem no canal).
  3. O bot exibirá o ID numérico (ex: `-1001234567890`).
  4. Insira esse valor na variável `TELEGRAM_CHAT_ID` do seu `.env`.

#### 4. `/testar`
* **O que faz:** Realiza uma busca imediata no Mercado Livre respeitando os filtros e envia o card completo de um produto de teste no seu **chat privado**.
* **Objetivo:** Permite validar a formatação do anúncio, foto, preço e botão de afiliado sem enviar nada para o canal público dos seus clientes.

#### 5. `/postar <link>`
* **O que faz:** Permite postar manualmente qualquer produto específico diretamente no canal oficial.
* **Exemplo de uso:**
  ```text
  /postar https://produto.mercadolivre.com.br/MLB-123456789-exemplo-de-produto
  ```
* **Como funciona:** O bot extrai título, fotos, valores promocionais, parcelamento, anexa sua tag de afiliado e dispara a publicação imediatamente.

#### 6. ⚡ Envio Direto de Links (Modo Interativo)
* **Como usar:** Cole qualquer link de produto do Mercado Livre no chat privado com o bot (sem precisar digitar comandos).
* **Fluxo:**
  1. O bot extrai automaticamente as informações do produto.
  2. Envia para você a prévia visual formatada.
  3. Adiciona um botão interativo: **"📢 Publicar no Canal"**.
  4. Ao clicar no botão, a oferta é publicada instantaneamente no canal oficial.

---

## 🎯 Categorias Monitoradas

O bot conta com um filtro estrito de palavras-chave para focar exclusivamente em nichos de alta conversão:

- 💻 **Hardware & Periféricos:** Placas de vídeo, processadores, SSDs, memória RAM, placas-mãe, monitores gamers, notebooks, mouses, teclados mecânicos, headsets, etc.
- 👕 **Moda & Roupas:** Camisetas, camisas polo, calças jeans, bermudas, jaquetas, moletons, cuecas boxer, meias, etc.
- 👟 **Calçados:** Tênis esportivos (corrida/academia) e casuais, sapatos, botas, chuteiras, sandálias, etc.
- 💊 **Suplementos & Saúde:** Creatina, Whey Protein, pré-treino, hipercalóricos, BCAA, ômega 3, vitaminas, etc.

> 🚫 *Produtos fora desses nichos (como móveis, panelas, ferramentas pesadas, brinquedos ou itens residenciais) são descartados automaticamente pelo filtro.*

---

## 🛡️ Sistema Anti-Duplicação

Para evitar sobrecarregar o canal com ofertas repetidas, o bot mantém um registro local em `data/posted_deals.json`:
* Ofertas já publicadas recentemente são ignoradas em novas buscas.
* Quando o terminal indica que não há novas ofertas para postar no ciclo atual, significa que todos os produtos com desconto nas páginas monitoradas já foram divulgados.
* Assim que novos produtos entrarem em promoção ou a vitrine do Mercado Livre for atualizada, o bot postará as novidades automaticamente.

---

## 📁 Estrutura do Projeto

```text
├── .env                  # Configurações locais e tokens (ignorado no git)
├── .env.example          # Modelo de configuração para repositório público
├── .gitignore            # Proteção de credenciais e dependências
├── package.json          # Dependências e scripts do Node.js
├── README.md             # Documentação do projeto
└── src/
    ├── config.js         # Validação e leitura de variáveis de ambiente
    ├── formatter.js      # Formatação estética das mensagens em HTML
    ├── index.js          # Inicialização do bot, comandos e rotina de busca
    ├── scraper.js        # Extrator e filtro de categorias do Mercado Livre
    └── storage.js        # Armazenamento e controle de duplicidade de ofertas
```

---

## 🚀 Instalação e Configuração

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para criar o seu `.env`:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com as suas credenciais:
```env
# Token gerado pelo @BotFather no Telegram
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui

# Canal ou grupo de destino (@username ou ID numérico)
TELEGRAM_CHAT_ID=@seu_canal_de_ofertas

# Parâmetros de rastreamento de afiliado do Mercado Livre
MERCADO_LIVRE_AFFILIATE_TAG=matt_tool=12345678&matt_tool_id=12345678&matt_word=seu_usuario&source=affiliate-profile&forceInApp=true

# Intervalo em segundos entre as checagens (ex: 60 para 1 minuto)
CHECK_INTERVAL_SECONDS=60

# Desconto mínimo (%) para aceitar uma promoção
MIN_DISCOUNT_PERCENT=10

# Quantidade máxima de ofertas postadas por ciclo
MAX_POSTS_PER_RUN=5

# Quantidade de páginas a varrer no Mercado Livre a cada ciclo
MAX_PAGES_TO_SCRAPE=8
```

---

## ▶️ Executando o Bot

Para iniciar em modo produção:
```bash
npm start
```

Para iniciar em modo desenvolvimento (com reinicialização automática via `--watch`):
```bash
npm run dev
```

---

## 🔒 Segurança e Boas Práticas

* O arquivo `.env` está configurado no `.gitignore` e **nunca deve ser enviado para o GitHub**.
* Nenhuma chave privada, token de bot ou ID de canal sensível deve ser colocado no código-fonte.
* Todas as configurações são injetadas estritamente por variáveis de ambiente.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
