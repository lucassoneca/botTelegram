require('dotenv').config();

const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  affiliateTag: process.env.MERCADO_LIVRE_AFFILIATE_TAG || '',
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES, 10) || 30,
  minDiscountPercent: parseInt(process.env.MIN_DISCOUNT_PERCENT, 10) || 15,
  maxPostsPerRun: parseInt(process.env.MAX_POSTS_PER_RUN, 10) || 2,
};

function validateConfig() {
  const missing = [];
  if (!config.telegramBotToken) missing.push('TELEGRAM_BOT_TOKEN');

  if (missing.length > 0) {
    throw new Error(`Configurações obrigatórias ausentes no .env: ${missing.join(', ')}`);
  }
}

module.exports = {
  config,
  validateConfig,
};
