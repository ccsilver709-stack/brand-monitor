/**
 * 国家归因：域名 TLD / 语言 / 来源名
 * 用于大模型失败或写死 US 时的兜底。
 */

const TLD_MAP = {
  'de': 'DE',
  'fr': 'FR',
  'uk': 'GB',
  'co.uk': 'GB',
  'jp': 'JP',
  'co.jp': 'JP',
  'ca': 'CA',
  'au': 'AU',
  'com.au': 'AU',
  'se': 'SE',
  'nl': 'NL',
  'it': 'IT',
  'es': 'ES',
  'kr': 'KR',
  'co.kr': 'KR',
  'cn': 'CN',
  'in': 'IN',
  'br': 'BR',
  'mx': 'MX',
  'ch': 'CH',
  'at': 'AT',
  'pl': 'PL',
  'ie': 'IE',
  'nz': 'NZ',
  'sg': 'SG',
  'hk': 'HK',
  'tw': 'TW',
};

const SOURCE_HINTS = [
  { re: /bbc|guardian|telegraph|independent|sky news/i, code: 'GB' },
  { re: /spiegel|süddeutsche|sueddeutsche|faz|bild|heise/i, code: 'DE' },
  { re: /le monde|le figaro|le parisien|franceinfo|les echos/i, code: 'FR' },
  { re: /asahi|nikkei|nhk|yahoo japan/i, code: 'JP' },
  { re: /cbc|globe and mail|toronto star/i, code: 'CA' },
  { re: /sydney morning|the age|news\.com\.au/i, code: 'AU' },
  { re: /svt|aftonbladet|expressen/i, code: 'SE' },
];

const HOST_HINTS = [
  { re: /\.bbc\.co\.uk$|\.bbc\.com$/i, code: 'GB' },
  { re: /\.theguardian\.com$|\.independent\.co\.uk$|\.telegraph\.co\.uk$/i, code: 'GB' },
  { re: /\.spiegel\.de$|\.faz\.net$|\.sueddeutsche\.de$|\.t-online\.de$/i, code: 'DE' },
  { re: /\.lemonde\.fr$|\.lefigaro\.fr$|\.leparisien\.fr$/i, code: 'FR' },
  { re: /\.asahi\.com$|\.nikkei\.com$|\.yahoo\.co\.jp$/i, code: 'JP' },
  { re: /\.cbc\.ca$|\.theglobeandmail\.com$/i, code: 'CA' },
  { re: /\.abc\.net\.au$|\.smh\.com\.au$/i, code: 'AU' },
  { re: /\.svt\.se$|\.aftonbladet\.se$/i, code: 'SE' },
  { re: /\.nytimes\.com$|\.wsj\.com$|\.cnn\.com$|\.washingtonpost\.com$/i, code: 'US' },
];

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function inferFromHost(host) {
  if (!host) return null;
  for (const h of HOST_HINTS) {
    if (h.re.test(host)) return h.code;
  }
  const parts = host.split('.');
  for (let i = 1; i < parts.length; i++) {
    const tld = parts.slice(i).join('.');
    if (TLD_MAP[tld]) return TLD_MAP[tld];
  }
  return null;
}

function inferFromText(text) {
  const t = String(text || '');
  for (const h of SOURCE_HINTS) {
    if (h.re.test(t)) return h.code;
  }
  if (/[ぁ-んァ-ン一-龯]/.test(t) && /[ぁ-んァ-ン]/.test(t)) return 'JP';
  if (/[가-힣]/.test(t)) return 'KR';
  if (/[äöüßÄÖÜ]/.test(t) || /\b(der|die|das|und|für|nicht)\b/i.test(t)) return 'DE';
  if (/[éèêëàâùûçœ]/i.test(t) && /\b(le|la|les|des|une|pour)\b/i.test(t)) return 'FR';
  if (/\b(the uk|britain|british|london)\b/i.test(t)) return 'GB';
  if (/\b(australia|australian|sydney|melbourne)\b/i.test(t)) return 'AU';
  if (/\b(canada|canadian|toronto|vancouver)\b/i.test(t)) return 'CA';
  if (/\b(sweden|swedish|stockholm)\b/i.test(t)) return 'SE';
  return null;
}

/**
 * @returns {string|null} ISO 国家代码
 */
function inferCountry(item) {
  const host = hostnameOf(item?.url || item?.displayUrl || '');
  const fromHost = inferFromHost(host);
  if (fromHost) return fromHost;

  const fromText = inferFromText(`${item?.title || ''} ${item?.summary || ''} ${item?.author || ''}`);
  if (fromText) return fromText;

  return null;
}

function resolveCountry(item, llmCountry) {
  const inferred = inferCountry(item);
  const llm = llmCountry && /^[A-Z]{2}$/.test(llmCountry) ? llmCountry : null;

  if (inferred && inferred !== 'US') return inferred;
  if (llm && llm !== 'US') return llm;
  if (inferred) return inferred;
  if (llm) return llm;
  if (item?.country && item.country !== 'US') return item.country;
  return item?.country || 'US';
}

module.exports = { inferCountry, resolveCountry };
