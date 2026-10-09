/**
 * Escapa caracteres especiais para o modo HTML do Telegram
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formata os dados do produto em uma mensagem bonita para o Telegram (HTML)
 */
function formatDealMessage(deal) {
  const title = escapeHtml(deal.title);
  const currentPrice = deal.currentPrice ? `R$ ${escapeHtml(deal.currentPrice)}` : '';
  const originalPrice = deal.originalPrice ? `R$ ${escapeHtml(deal.originalPrice)}` : '';
  const discount = deal.discountPercent > 0 ? `${deal.discountPercent}% OFF` : '';
  const installments = deal.installments ? escapeHtml(deal.installments) : '';

  let message = `🔥 <b>OFERTA IMPERDÍVEL NO MERCADO LIVRE!</b>\n\n`;
  message += `📦 <b>${title}</b>\n\n`;

  const categoryBadges = {
    hardware: '💻 Hardware & Periféricos',
    roupas: '👕 Moda & Roupas',
    calcados: '👟 Calçados & Tênis',
    suplementos: '💊 Suplementos & Saúde',
  };

  if (deal.category && categoryBadges[deal.category]) {
    message += `🏷️ <b>Categoria:</b> ${categoryBadges[deal.category]}\n`;
  }

  if (originalPrice && deal.discountPercent > 0) {
    message += `❌ <s>De: ${originalPrice}</s>\n`;
  }

  if (currentPrice) {
    message += `✅ <b>Por apenas: ${currentPrice}</b>\n`;
  }

  if (discount) {
    message += `💥 <b>Economia: ${discount}</b>\n`;
  }

  if (installments) {
    message += `💳 <i>${installments}</i>\n`;
  }

  message += `\n⚡ <i>Preços sujeitos a alteração sem aviso prévio pelo anunciante.</i>\n`;
  message += `\n👇 <b>Clique no botão abaixo para garantir o seu:</b>`;

  return {
    caption: message,
    buttonText: '🛒 COMPRAR NO MERCADO LIVRE',
    url: deal.link,
  };
}

module.exports = {
  formatDealMessage,
  escapeHtml,
};
