const { Telegraf, Markup } = require('telegraf');
const cron = require('node-cron');
const { config, validateConfig } = require('./config');
const { fetchDeals, fetchProductDetails } = require('./scraper');
const { isPosted, markAsPosted } = require('./storage');
const { formatDealMessage } = require('./formatter');

validateConfig();

const bot = new Telegraf(config.telegramBotToken);

/**
 * Publica uma oferta formatada em um chat ou canal do Telegram
 */
async function sendDeal(chatId, deal) {
  const formatted = formatDealMessage(deal);
  const keyboard = Markup.inlineKeyboard([
    Markup.button.url(formatted.buttonText, formatted.url),
  ]);

  try {
    if (deal.image) {
      try {
        await bot.telegram.sendPhoto(chatId, deal.image, {
          caption: formatted.caption,
          parse_mode: 'HTML',
          ...keyboard,
        });
        return true;
      } catch (photoErr) {
        console.warn(`[Telegram] Falha ao enviar foto (${photoErr.message}), tentando enviar apenas texto...`);
      }
    }

    await bot.telegram.sendMessage(chatId, formatted.caption, {
      parse_mode: 'HTML',
      ...keyboard,
    });
    return true;
  } catch (error) {
    console.error(`[Telegram] Erro ao enviar mensagem para ${chatId}:`, error.message);
    return false;
  }
}

// Fila de ofertas aguardando postagem
const dealsQueue = [];
let isScraping = false;

/**
 * Varre as páginas do Mercado Livre e adiciona novos produtos à fila
 */
async function replenishQueue() {
  if (isScraping) return;
  isScraping = true;

  try {
    console.log(`[Fila] [${new Date().toLocaleTimeString()}] Buscando ofertas no Mercado Livre (${config.maxPagesToScrape} páginas)...`);
    const deals = await fetchDeals(config.minDiscountPercent, config.maxPagesToScrape);

    let addedCount = 0;
    for (const deal of deals) {
      const alreadyInQueue = dealsQueue.some(item => item.id === deal.id);
      if (!alreadyInQueue && !isPosted(deal.id)) {
        dealsQueue.push(deal);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      console.log(`[Fila] +${addedCount} nova(s) oferta(s) adicionada(s) à fila! Total na fila aguardando: ${dealsQueue.length}`);
    } else {
      console.log(`[Fila] Nenhuma oferta nova descoberta. Ofertas aguardando na fila: ${dealsQueue.length}`);
    }
  } catch (err) {
    console.error('[Fila] Erro ao buscar ofertas para a fila:', err.message);
  } finally {
    isScraping = false;
  }
}

/**
 * Retira 1 oferta da fila e publica no canal (1 por minuto)
 */
async function dispatchNextDeal() {
  if (!config.telegramChatId) {
    console.log('[Fila] Aviso: TELEGRAM_CHAT_ID não configurado.');
    return;
  }

  // Se a fila estiver vazia ou quase vazia, agenda nova varredura
  if (dealsQueue.length <= 3 && !isScraping) {
    replenishQueue();
  }

  if (dealsQueue.length === 0) {
    console.log(`[Fila] [${new Date().toLocaleTimeString()}] Fila vazia no momento. Aguardando novas ofertas...`);
    return;
  }

  // Pega a próxima oferta da fila
  const deal = dealsQueue.shift();
  console.log(`[Fila] [${new Date().toLocaleTimeString()}] Postando 1 oferta: "${deal.title}" (Desconto: ${deal.discountPercent}%)`);

  const success = await sendDeal(config.telegramChatId, deal);
  if (success) {
    markAsPosted(deal.id, deal.title);
    console.log(`[Fila] ✅ Oferta postada com sucesso! Restam ${dealsQueue.length} ofertas aguardando na fila.`);
  } else {
    // Se falhar, recoloca no início da fila para tentar no próximo minuto
    dealsQueue.unshift(deal);
    console.warn(`[Fila] ⚠️ Falha ao postar. Oferta mantida na fila para a próxima tentativa.`);
  }
}

// ==========================================
// COMANDOS DO TELEGRAM
// ==========================================

// Comando /start
bot.start((ctx) => {
  const welcome = 
`👋 <b>Olá! Eu sou o Bot de Ofertas do Mercado Livre.</b>\n
📌 <b>Comandos disponíveis:</b>
/fila - Ver quantidade de ofertas na fila de espera
/status - Ver status da configuração do bot
/id - Descobrir o ID deste chat ou canal
/testar - Buscar e pré-visualizar uma oferta agora
/postar &lt;link&gt; - Postar um link específico no canal configurado\n
💡 <i>Você também pode me enviar qualquer link de produto do Mercado Livre aqui no privado e eu vou formatá-lo para você!</i>`;

  ctx.reply(welcome, { parse_mode: 'HTML' });
});

// Comando /fila
bot.command('fila', (ctx) => {
  const count = dealsQueue.length;
  let msg = `📦 <b>Fila de Ofertas:</b>\n\n`;
  msg += `Total aguardando postagem: <b>${count} produto(s)</b>\n`;
  msg += `⏱️ Ritmo de envio: <b>1 oferta a cada ${config.postIntervalSeconds} segundo(s)</b>\n\n`;

  if (count > 0) {
    msg += `<b>Próximos da fila:</b>\n`;
    dealsQueue.slice(0, 3).forEach((d, i) => {
      msg += `${i + 1}. ${d.title.substring(0, 40)}... (-${d.discountPercent}%)\n`;
    });
  } else {
    msg += `<i>A fila está vazia no momento. Em breve uma nova busca será realizada!</i>`;
  }

  ctx.reply(msg, { parse_mode: 'HTML' });
});

// Comando /status
bot.command('status', (ctx) => {
  const statusMsg =
`⚙️ <b>Configurações Atuais:</b>\n
📢 <b>Canal de Destino:</b> <code>${config.telegramChatId || 'NÃO CONFIGURADO'}</code>
⏱️ <b>Ritmo de Envio:</b> 1 oferta a cada ${config.postIntervalSeconds} segundo(s)
📦 <b>Fila Atual:</b> ${dealsQueue.length} oferta(s) aguardando
📄 <b>Páginas por Busca:</b> ${config.maxPagesToScrape} páginas
🏷️ <b>Desconto Mínimo:</b> ${config.minDiscountPercent}%
🔗 <b>Tag Afiliado:</b> <code>${config.affiliateTag || 'Nenhuma (link direto)'}</code>`;

  ctx.reply(statusMsg, { parse_mode: 'HTML' });
});

// Comando /id (ótimo para descobrir o Chat ID do canal ou grupo)
bot.command('id', (ctx) => {
  const chat = ctx.chat;
  const idMsg =
`🆔 <b>Informações deste Chat:</b>\n
<b>ID:</b> <code>${chat.id}</code>
<b>Tipo:</b> ${chat.type}
<b>Título/Nome:</b> ${chat.title || chat.first_name || 'Desconhecido'}
${chat.username ? `<b>Username:</b> @${chat.username}` : ''}\n
<i>Cole este ID no seu <code>.env</code> na variável <code>TELEGRAM_CHAT_ID</code>.</i>`;

  ctx.reply(idMsg, { parse_mode: 'HTML' });
});

// Comando /testar (testa o envio de uma oferta diretamente para o chat do usuário)
bot.command('testar', async (ctx) => {
  await ctx.reply('🔎 Buscando uma oferta do Mercado Livre para teste...');
  const deals = await fetchDeals(config.minDiscountPercent);

  if (deals.length === 0) {
    return ctx.reply('Nenhuma oferta encontrada no momento com os filtros atuais.');
  }

  const sample = deals[0];
  await sendDeal(ctx.chat.id, sample);
});

// Comando /postar <link>
bot.command('postar', async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(' ');

  if (parts.length < 2) {
    return ctx.reply('⚠️ Uso correto: <code>/postar https://produto.mercadolivre.com.br/...</code>', { parse_mode: 'HTML' });
  }

  const url = parts[1];
  if (!url.includes('mercadolivre.com')) {
    return ctx.reply('❌ Por favor, envie um link válido do Mercado Livre.');
  }

  await ctx.reply('⏳ Extraindo dados do produto...');
  const product = await fetchProductDetails(url);

  if (!product) {
    return ctx.reply('❌ Não foi possível extrair as informações deste produto. Verifique o link e tente novamente.');
  }

  const targetChat = config.telegramChatId || ctx.chat.id;
  const success = await sendDeal(targetChat, product);

  if (success) {
    ctx.reply(`✅ Oferta postada com sucesso em <code>${targetChat}</code>!`, { parse_mode: 'HTML' });
  } else {
    ctx.reply('❌ Falha ao postar a oferta. Verifique se o bot é administrador do canal com permissão de envio.');
  }
});

// Captura links enviados no privado do bot
bot.on('text', async (ctx) => {
  const text = ctx.message.text;

  // Se for mensagem de canal ou começar com barra (comando), ignora
  if (text.startsWith('/') || ctx.chat.type !== 'private') return;

  const urlMatch = text.match(/https?:\/\/[^\s]+mercadolivre\.com[^\s]*/i);
  if (urlMatch) {
    const url = urlMatch[0];
    await ctx.reply('⏳ Analisando produto enviado...');
    const product = await fetchProductDetails(url);

    if (product) {
      await sendDeal(ctx.chat.id, product);
      if (config.telegramChatId) {
        await ctx.reply(
          `Deseja postar este produto no canal oficial?`,
          Markup.inlineKeyboard([
            Markup.button.callback('📢 Publicar no Canal', `publish_${product.id}`),
          ])
        );
        // Armazena temporariamente para o callback
        bot.context = bot.context || {};
        bot.context[`product_${product.id}`] = product;
      }
    } else {
      ctx.reply('❌ Não consegui obter os dados deste link.');
    }
  }
});

// Ação do botão "Publicar no Canal"
bot.action(/publish_(.+)/, async (ctx) => {
  const productId = ctx.match[1];
  const product = bot.context && bot.context[`product_${productId}`];

  if (!product) {
    return ctx.answerCbQuery('Oferta expirada ou não encontrada na memória.');
  }

  const success = await sendDeal(config.telegramChatId, product);
  if (success) {
    markAsPosted(product.id, product.title);
    await ctx.editMessageText(`✅ Oferta postada com sucesso no canal!`);
  } else {
    await ctx.answerCbQuery('Falha ao enviar mensagem para o canal. Verifique permissões.');
  }
});

// Captura mensagens enviadas em canais para exibir o ID no console (ajuda o usuário a configurar)
bot.on('channel_post', (ctx) => {
  console.log(`[Canal Conectado] Mensagem recebida no canal "${ctx.chat.title}". ID: ${ctx.chat.id}`);
});

// ==========================================
// INICIALIZAÇÃO E AGENDAMENTO
// ==========================================

async function bootstrap() {
  try {
    const me = await bot.telegram.getMe();
    console.log(`\n=================================================`);
    console.log(`🚀 Bot conectado com sucesso: @${me.username}`);
    console.log(`📢 Destino configurado: ${config.telegramChatId || '(Nenhum)'}`);
    console.log(`⏱️ Ritmo de envio: 1 oferta a cada ${config.postIntervalSeconds} segundo(s) (1 por minuto)`);
    console.log(`📄 Páginas monitoradas: ${config.maxPagesToScrape} páginas`);
    console.log(`🏷️ Desconto mínimo: ${config.minDiscountPercent}%`);
    console.log(`=================================================\n`);

    // Inicia escuta de mensagens do Telegram em segundo plano
    bot.launch().catch((err) => {
      console.error('[Bot] Erro na conexão do Telegram:', err.message);
    });

    // 1. Carrega as ofertas na fila imediatamente
    await replenishQueue();

    // 2. Dispara a primeira oferta imediatamente se houver na fila
    if (dealsQueue.length > 0) {
      dispatchNextDeal();
    }

    // 3. Worker de envio contínuo: 1 por minuto (ou conforme POST_INTERVAL_SECONDS)
    setInterval(() => {
      dispatchNextDeal();
    }, config.postIntervalSeconds * 1000);

    // 4. Worker de abastecimento periódico para trazer novas ofertas
    setInterval(() => {
      replenishQueue();
    }, config.scrapeIntervalMinutes * 60 * 1000);

  } catch (err) {
    console.error('Erro fatal ao iniciar bot:', err.message);
  }
}

bootstrap();

// Encerramento limpo
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
