const axios = require('axios');
const cheerio = require('cheerio');
const { config } = require('./config');

const USER_AGENT = 'WhatsApp/2.21.12.21 A';

/**
 * Anexa o parâmetro de afiliado ao link do produto
 */
function attachAffiliateTag(url) {
  if (!config.affiliateTag) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  // Se a tag já possui chave=valor (ex: matt_tool=12345 ou tracking_id=xxx), anexa diretamente
  if (config.affiliateTag.includes('=')) {
    return `${url}${separator}${config.affiliateTag}`;
  }
  // Para códigos do programa de Criadores/Afiliados (ex: BELU20240426143437)
  return `${url}${separator}tracking_id=${encodeURIComponent(config.affiliateTag)}`;
}

/**
 * Extrai o ID do produto a partir da URL
 */
function extractProductId(url) {
  const match = url.match(/MLB-?(\d+)/i);
  if (match) return `MLB${match[1]}`;
  return url.split('?')[0];
}

// Categorias permitidas: Hardware, Roupas, Calçados e Suplementos
const ALLOWED_CATEGORIES = {
  hardware: [
    'placa de video', 'placa de vídeo', 'gpu', 'processador', 'ryzen', 'intel core',
    'ssd', 'nvme', 'memoria ram', 'memória ram', 'placa mae', 'placa mãe', 'placa-mãe',
    'fonte atx', 'gabinete gamer', 'teclado mecanico', 'teclado mecânico', 'mouse gamer',
    'headset gamer', 'headset', 'notebook', 'pc gamer', 'computador', 'monitor gamer',
    'monitor', 'rtx', 'gtx', 'radeon', 'rx 6', 'rx 7', 'water cooler', 'air cooler',
    'cooler fan', 'switch gigabit', 'roteador', 'webcam', 'geforce', 'memória ddr',
    'memoria ddr', 'hub usb', 'placa de som'
  ],
  roupas: [
    'camiseta', 'camisa', 'calça', 'calca', 'bermuda', 'jaqueta', 'moletom', 'cueca',
    'boxer', 'meia', 'meias', 'shorts', 'vestido', 'saia', 'casaco', 'regata', 'blusa',
    'gola polo', 'polo', 'agasalho', 'calção', 'calcao', 'dry fit', 'dry-fit', 'jeans',
    'sutiã', 'lingerie', 'top fitness', 'legging', 'biquíni', 'maiô'
  ],
  calcados: [
    'tênis', 'tenis', 'sapato', 'bota', 'coturno', 'sandália', 'sandalia', 'chinelo',
    'chuteira', 'sapatilha', 'mocassim', 'sneaker', 'papete', 'crocs', 'botina', 'chinela'
  ],
  suplementos: [
    'creatina', 'whey', 'proteína', 'proteina', 'bcaa', 'hipercalórico', 'hipercalorico',
    'pré-treino', 'pre-treino', 'pre treino', 'glutamina', 'multivitamínico', 'multivitaminico',
    'ômega 3', 'omega 3', 'cafeína', 'cafeina', 'colágeno', 'colageno', 'albumina',
    'termogênico', 'termogenico', 'feno grego', 'tribulus', 'coenzima q10', 'vitamina',
    'dark lab', 'growth supplements', 'max titanium', 'soldiers nutrition', 'integralmedica',
    'nutricandies', 'pasta de amendoim', 'whey protein', 'isolado', 'concentrado'
  ]
};

/**
 * Verifica se o título do produto pertence a uma das categorias permitidas
 */
function matchesAllowedCategory(title) {
  if (!title) return { match: false, category: null };
  const lower = title.toLowerCase();

  for (const [category, keywords] of Object.entries(ALLOWED_CATEGORIES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { match: true, category };
      }
    }
  }

  return { match: false, category: null };
}

/**
 * Busca ofertas em destaque na página de promoções do Mercado Livre (suporta múltiplas páginas)
 */
async function fetchDeals(minDiscount = 15, maxPages = config.maxPagesToScrape || 5) {
  const deals = [];
  const seenIds = new Set();

  for (let page = 1; page <= maxPages; page++) {
    try {
      const pageUrl = page === 1 
        ? 'https://www.mercadolivre.com.br/ofertas' 
        : `https://www.mercadolivre.com.br/ofertas?page=${page}`;

      const response = await axios.get(pageUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);
      let pageDealsCount = 0;

      $('.poly-card, .promotion-item').each((_, element) => {
        const card = $(element);
        
        const rawTitle = card.find('.poly-component__title, .promotion-item__title, a[title]').text().trim() ||
                         card.find('a').attr('title') || '';
        
        // Filtro estrito: apenas Hardware, Roupas, Calçados e Suplementos
        const categoryCheck = matchesAllowedCategory(rawTitle);
        if (!categoryCheck.match) {
          return; // Pula itens fora das categorias solicitadas
        }

        let link = card.find('a').attr('href') || '';
        if (!link || !link.startsWith('http') || link.includes('click1.mercadolivre')) {
          return; // Pula anúncios patrocinados e links sem destino
        }

        // Limpa parâmetros de rastreamento nativos da página
        if (link.includes('?')) {
          link = link.split('?')[0];
        }

        const id = extractProductId(link);
        if (seenIds.has(id)) return;
        seenIds.add(id);

        const currentPriceStr = card.find('.poly-price__current .andes-money-amount__fraction, .promotion-item__price span').first().text().trim();
        const currentPriceCents = card.find('.poly-price__current .andes-money-amount__cents').first().text().trim();
        const originalPriceStr = card.find('.andes-money-amount--previous .andes-money-amount__fraction, .promotion-item__old-price').first().text().trim();
        const discountText = card.find('.andes-money-amount__discount, .promotion-item__discount').text().trim();

        // Cálculo ou extração do percentual de desconto
        let discountPercent = 0;
        const discountMatch = discountText.match(/(\d+)%/);
        if (discountMatch) {
          discountPercent = parseInt(discountMatch[1], 10);
        } else if (originalPriceStr && currentPriceStr) {
          const orig = parseFloat(originalPriceStr.replace(/\./g, '').replace(',', '.'));
          const curr = parseFloat(currentPriceStr.replace(/\./g, '').replace(',', '.'));
          if (orig > curr) {
            discountPercent = Math.round(((orig - curr) / orig) * 100);
          }
        }

        // Filtra pelo desconto mínimo configurado
        if (discountPercent < minDiscount) {
          return;
        }

        const image = card.find('img').attr('data-src') || card.find('img').attr('src') || '';
        const installments = card.find('.poly-price__installments, .promotion-item__installments').text().trim();

        const finalPrice = currentPriceCents ? `${currentPriceStr},${currentPriceCents}` : currentPriceStr;

        deals.push({
          id,
          title: rawTitle,
          category: categoryCheck.category,
          link: attachAffiliateTag(link),
          originalUrl: link,
          currentPrice: finalPrice,
          originalPrice: originalPriceStr || null,
          discountPercent,
          installments: installments || null,
          image,
        });
        pageDealsCount++;
      });

      if (pageDealsCount === 0 && page > 1) {
        break;
      }
    } catch (pageError) {
      console.warn(`[Scraper] Aviso: Erro ao ler página ${page} de ofertas (${pageError.message})`);
    }
  }

  return deals;
}

/**
 * Busca detalhes de um produto a partir de um link individual (para envio manual)
 */
async function fetchProductDetails(url) {
  try {
    const cleanUrl = url.split('?')[0];
    const response = await axios.get(cleanUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    const title = $('h1.ui-pdp-title, h1').first().text().trim();
    const currentPriceStr = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim() ||
                            $('.andes-money-amount__fraction').first().text().trim();
    const currentPriceCents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim();
    const originalPriceStr = $('.andes-money-amount--previous .andes-money-amount__fraction').first().text().trim();
    const discountText = $('.ui-pdp-price__second-line .andes-money-amount__discount, .andes-money-amount__discount').first().text().trim();

    let discountPercent = 0;
    const discountMatch = discountText.match(/(\d+)%/);
    if (discountMatch) {
      discountPercent = parseInt(discountMatch[1], 10);
    } else if (originalPriceStr && currentPriceStr) {
      const orig = parseFloat(originalPriceStr.replace(/\./g, '').replace(',', '.'));
      const curr = parseFloat(currentPriceStr.replace(/\./g, '').replace(',', '.'));
      if (orig > curr) {
        discountPercent = Math.round(((orig - curr) / orig) * 100);
      }
    }

    const image = $('figure.ui-pdp-gallery__figure img, meta[property="og:image"]').first().attr('src') ||
                  $('meta[property="og:image"]').attr('content') || '';

    const installments = $('.ui-pdp-media__title, .ui-pdp-price__subtitles').first().text().trim();
    const finalPrice = currentPriceCents ? `${currentPriceStr},${currentPriceCents}` : currentPriceStr;

    return {
      id: extractProductId(cleanUrl),
      title: title || 'Produto no Mercado Livre',
      link: attachAffiliateTag(cleanUrl),
      originalUrl: cleanUrl,
      currentPrice: finalPrice,
      originalPrice: originalPriceStr || null,
      discountPercent,
      installments: installments || null,
      image,
    };
  } catch (error) {
    console.error(`[Scraper] Erro ao buscar produto individual (${url}):`, error.message);
    return null;
  }
}

module.exports = {
  fetchDeals,
  fetchProductDetails,
  attachAffiliateTag,
  matchesAllowedCategory,
  ALLOWED_CATEGORIES,
};
