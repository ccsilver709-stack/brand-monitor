/**
 * Google News RSS 服务模块
 * 完全免费，不需要 API Key
 * 通过 Google News RSS 接口获取新闻数据
 */

const https = require('https');
const { XMLParser } = require('fast-xml-parser');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存

// 初始化 XML 解析器
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/**
 * 生成缓存键
 */
function getCacheKey(keywords, options) {
  return `gnews:${keywords}:${JSON.stringify(options)}`;
}

/**
 * 从缓存获取
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

/**
 * 写入缓存
 */
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * 请求 RSS 内容
 */
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'news.google.com',
      path: url,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`RSS request failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`RSS request error: ${e.message}`));
    });

    req.end();
  });
}

/**
 * 格式化 RSS item 为统一格式
 */
function formatRSSItem(item, index) {
  // Google News 的 item 结构
  const title = item.title || '';
  const link = item.link || '';
  const pubDate = item.pubDate || new Date().toISOString();
  const description = item.description || '';
  const source = item.source?.['#text'] || item.source || '';

  // 从 description 中提取摘要（去掉HTML标签）
  let summary = description.replace(/<[^>]*>/g, '').trim();
  if (summary.length > 300) {
    summary = summary.substring(0, 300) + '...';
  }

  return {
    id: `gnews-${index}-${Date.now()}`,
    platform: 'news',
    title,
    summary,
    author: source,
    url: link,
    displayUrl: '',
    publishTime: new Date(pubDate).toISOString(),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    country: 'US',
    productLine: '',
    sentiment: 'neutral',
    relevance: 100 - index * 5,
    thumbnail: '',
    raw: {
      source,
      pubDate,
    },
  };
}

/**
 * Google News 搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.country - 国家代码 (US, DE, UK, FR, etc.)
 * @param {string} options.language - 语言 (en, de, fr, etc.)
 * @param {string} options.timeRange - 时间范围 (h/d/w/m/y)
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchNews(keywords, options = {}) {
  const cacheKey = getCacheKey(keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const country = options.country || 'US';
  const language = options.language || 'en';

  // 构建 Google News RSS URL
  // 参考：https://news.google.com/rss/search?q=关键词&hl=语言&gl=国家&ceid=国家:语言
  const query = encodeURIComponent(keywords);
  const hl = language;
  const gl = country;
  const ceid = `${country}:${language}`;

  // 时间范围参数（Google News RSS 支持 when 参数）
  let whenParam = '';
  if (options.timeRange) {
    whenParam = `+when:${options.timeRange}`;
  }

  const rssPath = `/rss/search?q=${query}${whenParam}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

  try {
    const xmlData = await fetchRSS(rssPath);
    const parsed = parser.parse(xmlData);

    const items = parsed?.rss?.channel?.item || [];
    const itemArray = Array.isArray(items) ? items : [items];
    const results = itemArray.map((item, index) => formatRSSItem(item, index));

    setCache(cacheKey, results);
    return results;
  } catch (e) {
    console.error('Google News RSS search failed:', e.message);
    throw e;
  }
}

/**
 * 多关键词批量搜索
 */
async function batchSearch(keywords, options = {}) {
  if (!keywords || keywords.length === 0) return [];

  const results = [];
  const seenUrls = new Set();

  for (const kw of keywords) {
    try {
      const kwResults = await searchNews(kw, options);
      for (const item of kwResults) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          results.push(item);
        }
      }
    } catch (e) {
      console.error(`Google News search failed for "${kw}":`, e.message);
    }
  }

  return results;
}

/**
 * 获取缓存状态
 */
function getCacheStats() {
  return {
    size: cache.size,
    maxSize: 100,
    ttl: CACHE_TTL / 1000 / 60,
  };
}

module.exports = {
  searchNews,
  batchSearch,
  getCacheStats,
};
