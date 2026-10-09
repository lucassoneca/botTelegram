require('dotenv').config();

const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  affiliateTag: process.env.MERCADO_LIVRE_AFFILIATE_TAG || '',
  checkIntervalSeconds: parseInt(process.env.CHECK_INTERVAL_SECONDS, 10) || 60,
  minDiscountPercent: parseInt(process.env.MIN_DISCOUNT_PERCENT, 10) || 10,
  maxPostsPerRun: parseInt(process.env.MAX_POSTS_PER_RUN, 10) || 3,
  maxPagesToScrape: parseInt(process.env.MAX_PAGES_TO_SCRAPE, 10) || 5,
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
