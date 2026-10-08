const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'posted_deals.json');
const RETENTION_DAYS = 7;

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2), 'utf-8');
  }
}

function loadDeals() {
  ensureDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) || {};
  } catch (err) {
    console.error('[Storage] Erro ao ler base de ofertas postadas:', err.message);
    return {};
  }
}

function saveDeals(deals) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(deals, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Storage] Erro ao salvar base de ofertas postadas:', err.message);
  }
}

function isPosted(dealId) {
  if (!dealId) return false;
  const deals = loadDeals();
  return Boolean(deals[dealId]);
}

function markAsPosted(dealId, title = '') {
  if (!dealId) return;
  const deals = loadDeals();
  deals[dealId] = {
    title,
    postedAt: new Date().toISOString(),
  };

  // Limpeza de itens antigos (> 7 dias)
  const now = Date.now();
  const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  for (const [id, info] of Object.entries(deals)) {
    if (info.postedAt && (now - new Date(info.postedAt).getTime() > maxAgeMs)) {
      delete deals[id];
    }
  }

  saveDeals(deals);
}

module.exports = {
  isPosted,
  markAsPosted,
};
