/**
 * 全球 Deal 站 RSS 抓取服务
 * 覆盖美国、加拿大、德国、英国、法国、意大利、西班牙、墨西哥、波兰、巴西、澳大利亚
 * 完全免费，不需要 API Key，和 Reddit RSS 同架构
 */

const https = require('https');
const http = require('http');
const { XMLParser } = require('fast-xml-parser');
const { URL } = require('url');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存
const REQUEST_TIMEOUT = 8000; // 单个请求超时8秒

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

// ========== 全球 Deal 站配置 ==========
// 每个站点：domain（域名）、country（国家代码）、rss（RSS URL，可配多个候选）
const DEAL_SITES = [
  // ===== 美国 US =====
  { domain: 'dealnews.com', country: 'US', rss: ['https://www.dealnews.com/rss.xml'] },
  { domain: 'slickdeals.net', country: 'US', rss: ['https://slickdeals.net/rss/'] },
  { domain: 'techbargains.com', country: 'US', rss: ['https://www.techbargains.com/rss.xml'] },
  { domain: 'bensbargains.com', country: 'US', rss: ['https://bensbargains.com/feed/', 'https://www.bensbargains.com/rss/'] },
  { domain: 'freestufffinder.com', country: 'US', rss: ['https://www.freestufffinder.com/feed/'] },
  { domain: 'edealinfo.com', country: 'US', rss: ['https://www.edealinfo.com/rss.xml'] },
  { domain: 'fabulesslyfrugal.com', country: 'US', rss: ['https://www.fabulesslyfrugal.com/feed/'] },
  { domain: 'dansdeals.com', country: 'US', rss: ['https://www.dansdeals.com/feed/'] },
  { domain: 'dealsplus.com', country: 'US', rss: ['https://www.dealsplus.com/rss'] },
  { domain: 'struggleville.net', country: 'US', rss: ['https://www.struggleville.net/feed/'] },
  { domain: 'moneysavingmom.com', country: 'US', rss: ['https://www.moneysavingmom.com/feed/'] },
  { domain: 'hip2save.com', country: 'US', rss: ['https://hip2save.com/feed/'] },
  { domain: 'dealseek.com', country: 'US', rss: ['https://www.dealseek.com/rss', 'https://www.dealseek.com/feed/'] },
  { domain: 'myvipon.com', country: 'US', rss: ['https://www.myvipon.com/rss', 'https://www.myvipon.com/feed/'] },
  { domain: 'dealsofamerica.com', country: 'US', rss: ['https://www.dealsofamerica.com/rss', 'https://www.dealsofamerica.com/feed/'] },
  { domain: '1sale.com', country: 'US', rss: ['https://www.1sale.com/rss', 'https://www.1sale.com/feed/'] },
  { domain: 'dealwiki.com', country: 'US', rss: ['https://www.dealwiki.com/rss', 'https://www.dealwiki.com/feed/'] },
  { domain: '21usdeal.com', country: 'US', rss: ['https://www.21usdeal.com/rss', 'https://www.21usdeal.com/feed/'] },
  { domain: 'ihotoffers.com', country: 'US', rss: ['https://www.ihotoffers.com/rss', 'https://www.ihotoffers.com/feed/'] },
  { domain: 'swaggrabber.com', country: 'US', rss: ['https://www.swaggrabber.com/rss', 'https://www.swaggrabber.com/feed/'] },
  { domain: 'shopsale.com', country: 'US', rss: ['https://www.shopsale.com/rss', 'https://www.shopsale.com/feed/'] },
  { domain: 'dealam.com', country: 'US', rss: ['https://www.dealam.com/rss', 'https://www.dealam.com/feed/'] },
  { domain: 'simplexdeals.com', country: 'US', rss: ['https://www.simplexdeals.com/rss', 'https://www.simplexdeals.com/feed/'] },
  { domain: 'koupon.ai', country: 'US', rss: ['https://www.koupon.ai/rss', 'https://www.koupon.ai/feed/'] },

  // ===== 加拿大 CA =====
  { domain: 'savealoonie.com', country: 'CA', rss: ['https://www.savealoonie.com/feed/'] },
  { domain: 'redflagdeals.com', country: 'CA', rss: ['https://www.redflagdeals.com/rss/', 'https://forums.redflagdeals.com/rss/'] },

  // ===== 德国 DE =====
  { domain: 'mydealz.de', country: 'DE', rss: ['https://www.mydealz.de/rss'] },
  { domain: 'dealgott.de', country: 'DE', rss: ['https://www.dealgott.de/rss', 'https://www.dealgott.de/feed/'] },
  { domain: 'mein-deal.com', country: 'DE', rss: ['https://www.mein-deal.com/rss', 'https://www.mein-deal.com/feed/'] },
  { domain: 'dealdoktor.de', country: 'DE', rss: ['https://www.dealdoktor.de/feed/', 'https://www.dealdoktor.de/rss'] },
  { domain: 'dealbunny.de', country: 'DE', rss: ['https://www.dealbunny.de/rss', 'https://www.dealbunny.de/feed/'] },
  { domain: 'snipz.de', country: 'DE', rss: ['https://www.snipz.de/rss', 'https://www.snipz.de/feed/'] },
  { domain: 'monsterdealz.de', country: 'DE', rss: ['https://www.monsterdealz.de/rss', 'https://www.monsterdealz.de/feed/'] },
  { domain: 'mytopdeals.net', country: 'DE', rss: ['https://www.mytopdeals.net/rss', 'https://www.mytopdeals.net/feed/'] },
  { domain: 'sparbote.de', country: 'DE', rss: ['https://www.sparbote.de/rss', 'https://www.sparbote.de/feed/'] },
  { domain: 'dealonkel.de', country: 'DE', rss: ['https://www.dealonkel.de/rss', 'https://www.dealonkel.de/feed/'] },

  // ===== 英国 UK =====
  { domain: 'hotukdeals.com', country: 'GB', rss: ['https://www.hotukdeals.com/rss'] },
  { domain: 'latestdeals.co.uk', country: 'GB', rss: ['https://www.latestdeals.co.uk/feed', 'https://www.latestdeals.co.uk/rss'] },

  // ===== 法国 FR =====
  { domain: 'dealabs.com', country: 'FR', rss: ['https://www.dealabs.com/rss'] },
  { domain: 'serialdealer.fr', country: 'FR', rss: ['https://www.serialdealer.fr/rss', 'https://www.serialdealer.fr/feed/'] },
  { domain: 'bons-plans-malins.com', country: 'FR', rss: ['https://www.bons-plans-malins.com/feed/', 'https://www.bons-plans-malins.com/rss'] },

  // ===== 意大利 IT =====
  { domain: 'scontify.net', country: 'IT', rss: ['https://www.scontify.net/rss', 'https://www.scontify.net/feed/'] },
  { domain: 'bestdiscount.it', country: 'IT', rss: ['https://www.bestdiscount.it/rss', 'https://www.bestdiscount.it/feed/'] },
  { domain: 'wikideal.it', country: 'IT', rss: ['https://www.wikideal.it/rss', 'https://www.wikideal.it/feed/'] },
  { domain: 'tuttotek.it', country: 'IT', rss: ['https://www.tuttotek.it/rss', 'https://www.tuttotek.it/feed/'] },

  // ===== 西班牙 ES =====
  { domain: 'chollometro.com', country: 'ES', rss: ['https://www.chollometro.com/rss'] },
  { domain: 'super-chollos.com', country: 'ES', rss: ['https://www.super-chollos.com/rss', 'https://www.super-chollos.com/feed/'] },
  { domain: 'cholloterapia.com', country: 'ES', rss: ['https://www.cholloterapia.com/rss', 'https://www.cholloterapia.com/feed/'] },
  { domain: 'soydechollos.com', country: 'ES', rss: ['https://www.soydechollos.com/rss', 'https://www.soydechollos.com/feed/'] },
  { domain: 'michollo.com', country: 'ES', rss: ['https://www.michollo.com/rss', 'https://www.michollo.com/feed/'] },
  { domain: 'cholloschina.com', country: 'ES', rss: ['https://www.cholloschina.com/rss', 'https://www.cholloschina.com/feed/'] },
  { domain: 'mepicaelchollo.com', country: 'ES', rss: ['https://www.mepicaelchollo.com/rss', 'https://www.mepicaelchollo.com/feed/'] },
  { domain: 'nolodejesescapar.com', country: 'ES', rss: ['https://www.nolodejesescapar.com/rss', 'https://www.nolodejesescapar.com/feed/'] },

  // ===== 墨西哥 MX =====
  { domain: 'promodescuentos.com', country: 'MX', rss: ['https://www.promodescuentos.com/rss'] },
  { domain: 'megadescuentos.com', country: 'MX', rss: ['https://www.megadescuentos.com/rss', 'https://www.megadescuentos.com/feed/'] },

  // ===== 波兰 PL =====
  { domain: 'pepper.pl', country: 'PL', rss: ['https://www.pepper.pl/rss'] },
  { domain: 'hotshops.pl', country: 'PL', rss: ['https://www.hotshops.pl/rss', 'https://www.hotshops.pl/feed/'] },

  // ===== 巴西 BR =====
  { domain: 'pelando.com.br', country: 'BR', rss: ['https://www.pelando.com.br/rss'] },
  { domain: 'gatry.com', country: 'BR', rss: ['https://www.gatry.com/rss', 'https://www.gatry.com/feed/'] },
  { domain: 'promobit.com.br', country: 'BR', rss: ['https://www.promobit.com.br/rss', 'https://www.promobit.com.br/feed/'] },

  // ===== 澳大利亚 AU =====
  { domain: 'ozbargain.com.au', country: 'AU', rss: ['https://www.ozbargain.com.au/rss', 'https://www.ozbargain.com.au/feed'] },
];

// ========== 工具函数 ==========

function getCacheKey(keywords, countries) {
  return `deal:${keywords}:${countries.join(',')}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * 带超时的 HTTP/HTTPS 请求
 */
function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 3) {
      return reject(new Error('Too many redirects'));
    }

    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return reject(new Error(`Invalid URL: ${url}`));
    }

    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    };

    const req = lib.request(options, (res) => {
      // 处理重定向
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        res.resume();
        return fetchUrl(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(REQUEST_TIMEOUT, () => {
      req.destroy(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * 尝试站点的多个 RSS URL 候选
 */
async function fetchSiteRSS(site) {
  for (const rssUrl of site.rss) {
    try {
      const xmlData = await fetchUrl(rssUrl);
      return { site, xmlData, rssUrl };
    } catch (e) {
      // 继续尝试下一个候选 URL
      console.log(`[DealSites] ${site.domain} ${rssUrl} failed: ${e.message}`);
    }
  }
  return null; // 所有候选都失败
}

/**
 * 解析 RSS XML，返回 item 列表
 */
function parseRSS(xmlData) {
  try {
    const parsed = parser.parse(xmlData);
    let items = parsed?.rss?.channel?.item
      || parsed?.feed?.entry
      || parsed?.rdf?.item
      || [];
    if (!Array.isArray(items)) {
      items = items ? [items] : [];
    }
    return items;
  } catch (e) {
    console.error('[DealSites] XML parse error:', e.message);
    return [];
  }
}

/**
 * 格式化单条 RSS item 为统一结构
 */
function formatItem(item, site, index) {
  // 兼容 RSS 2.0 和 Atom 格式
  const title = item.title || item['title']?.['#text'] || '';
  const link = item.link || item['link']?.['@_href'] || item['link']?.['#text'] || '';
  const pubDate = item.pubDate || item.published || item.updated || item.date || new Date().toISOString();
  const description = item.description || item.summary || item['content']?.['#text'] || item.content || '';

  // 去掉 HTML 标签
  let summary = String(description).replace(/<[^>]*>/g, '').trim();
  if (summary.length > 300) {
    summary = summary.substring(0, 300) + '...';
  }

  // 处理标题中的 CDATA
  const cleanTitle = String(title).replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();

  return {
    id: `deal-${site.domain}-${index}-${Date.now()}`,
    platform: 'affiliate_site',
    title: cleanTitle,
    summary,
    author: site.domain,
    url: typeof link === 'string' ? link : (link['@_href'] || ''),
    displayUrl: site.domain,
    publishTime: new Date(pubDate).toISOString(),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    country: site.country,
    productLine: '',
    sentiment: 'neutral',
    relevance: 100 - index * 2,
    thumbnail: '',
    raw: {
      source: site.domain,
      pubDate,
    },
  };
}

/**
 * 检查内容是否匹配关键词
 */
function matchesKeywords(item, keywords) {
  if (!keywords || keywords.length === 0) return true;
  const text = `${item.title} ${item.summary}`.toLowerCase();
  return keywords.some(kw => text.includes(kw.toLowerCase()));
}

/**
 * 检查时间是否在范围内
 */
function withinTimeRange(item, days) {
  if (!days) return true;
  const pubTime = new Date(item.publishTime).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return pubTime >= cutoff;
}

// ========== 主函数 ==========

/**
 * 搜索全球 Deal 站
 * @param {Array<string>} keywords - 关键词列表
 * @param {Object} options - 选项
 * @param {Array<string>} options.countries - 国家代码筛选，空数组=全部
 * @param {number} options.timeRange - 时间范围（天）
 * @param {number} options.maxPerSite - 每个站点最多返回条数
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchDeals(keywords, options = {}) {
  const { countries = [], timeRange = 30, maxPerSite = 10 } = options;

  const cacheKey = getCacheKey(keywords.join(','), countries);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // 按国家筛选站点
  const sites = countries.length > 0
    ? DEAL_SITES.filter(s => countries.includes(s.country))
    : DEAL_SITES;

  console.log(`[DealSites] Searching ${sites.length} deal sites for keywords: ${keywords.join(', ')}`);

  // 并行抓取所有站点
  const fetchResults = await Promise.all(
    sites.map(site => fetchSiteRSS(site))
  );

  const allItems = [];
  let successCount = 0;

  for (const result of fetchResults) {
    if (!result) continue;
    successCount++;
    const { site, xmlData } = result;
    const items = parseRSS(xmlData);
    const formatted = items
      .map((item, idx) => formatItem(item, site, idx))
      .filter(item => matchesKeywords(item, keywords))
      .filter(item => withinTimeRange(item, timeRange))
      .slice(0, maxPerSite);
    allItems.push(...formatted);
  }

  console.log(`[DealSites] ${successCount}/${sites.length} sites responded, ${allItems.length} matching items`);

  // 按发布时间倒序
  allItems.sort((a, b) => new Date(b.publishTime) - new Date(a.publishTime));

  setCache(cacheKey, allItems);
  return allItems;
}

/**
 * 多关键词批量搜索（去重）
 */
async function batchSearch(keywords, options = {}) {
  if (!keywords || keywords.length === 0) return [];

  const allResults = await searchDeals(keywords, options);
  // URL 去重
  const seenUrls = new Set();
  const unique = [];
  for (const item of allResults) {
    if (item.url && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      unique.push(item);
    }
  }
  return unique;
}

/**
 * 服务是否可用（永远可用，零配置）
 */
function isAvailable() {
  return true;
}

/**
 * 获取缓存状态
 */
function getCacheStats() {
  return {
    size: cache.size,
    maxSize: 100,
    ttlMinutes: CACHE_TTL / 1000 / 60,
    totalSites: DEAL_SITES.length,
  };
}

/**
 * 获取站点配置列表
 */
function getSiteList() {
  return DEAL_SITES.map(s => ({ domain: s.domain, country: s.country }));
}

module.exports = {
  searchDeals,
  batchSearch,
  isAvailable,
  getCacheStats,
  getSiteList,
};
