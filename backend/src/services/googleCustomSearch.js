/**
 * Google Custom Search JSON API 服务模块
 * 免费额度：每天100次查询
 * 一个API搞定所有Web类内容：联盟站、论坛、博客、TikTok/IG/FB/Twitter站点搜索等
 * 
 * 文档：https://developers.google.com/custom-search/v1/overview
 * 
 * 需要两个配置：
 * - GOOGLE_API_KEY: Google Cloud API Key
 * - GOOGLE_CX: Programmable Search Engine ID (搜索引擎ID)
 */

const https = require('https');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存

/**
 * 生成缓存键
 */
function getCacheKey(keywords, options) {
  return `gcs:${keywords}:${JSON.stringify(options)}`;
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
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * 调用 Google Custom Search API
 */
function callGoogleSearch(params) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;

    if (!apiKey || !cx) {
      return reject(new Error('GOOGLE_API_KEY or GOOGLE_CX not configured'));
    }

    const queryParams = new URLSearchParams({
      ...params,
      key: apiKey,
      cx: cx,
    });

    const options = {
      hostname: 'www.googleapis.com',
      path: `/customsearch/v1?${queryParams.toString()}`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[GCS Debug] HTTP ${res.statusCode}, response length: ${data.length}`);
        console.log(`[GCS Debug] Response preview: ${data.substring(0, 500)}`);
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Google Custom Search error: ${json.error.message} (HTTP ${res.statusCode})`));
          } else {
            console.log(`[GCS Debug] items count: ${json.items?.length || 0}, totalResults: ${json.searchInformation?.totalResults || 'N/A'}`);
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse Google Custom Search response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Google Custom Search request failed: ${e.message}`));
    });

    req.end();
  });
}

/**
 * 格式化搜索结果为统一格式
 */
function formatResults(items, platform = 'web') {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item, index) => ({
    id: `gcs-${platform}-${index}-${Date.now()}`,
    platform: platform,
    title: item.title || '',
    summary: item.snippet || '',
    author: '',
    url: item.link || '',
    displayUrl: item.displayLink || '',
    publishTime: '', // Google搜索结果没有明确的发布时间
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    country: 'US',
    productLine: '',
    sentiment: 'neutral',
    relevance: 100 - index * 5,
    thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || '',
    raw: {
      displayLink: item.displayLink,
      snippet: item.snippet,
      htmlTitle: item.htmlTitle,
    },
  }));
}

/**
 * 通用搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.country - 国家代码 (US, DE, UK, FR, etc.)
 * @param {string} options.language - 语言 (en, de, fr, etc.)
 * @param {number} options.num - 结果数量 (max 10)
 * @param {string} options.dateRestrict - 时间范围 (d7, m1, m3, y1等)
 * @param {string} options.siteSearch - 限定搜索站点
 * @param {string} options.platform - 平台标识（用于结果分类）
 * @returns {Promise<Array>} 格式化后的结果
 */
async function search(keywords, options = {}) {
  const cacheKey = getCacheKey(keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const params = {
    q: keywords,
    num: Math.min(options.num || 10, 10),
  };

  // 国家/语言
  if (options.country) {
    params.gl = options.country.toLowerCase();
  }
  if (options.language) {
    params.hl = options.language;
  }

  // 时间范围
  if (options.dateRestrict) {
    params.dateRestrict = options.dateRestrict;
  }

  // 站点限定
  if (options.siteSearch) {
    params.siteSearch = options.siteSearch;
    params.siteSearchFilter = 'i'; // i=包含, e=排除
  }

  try {
    const result = await callGoogleSearch(params);
    const platform = options.platform || 'web';
    const formatted = formatResults(result.items || [], platform);
    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('Google Custom Search failed:', e.message);
    throw e;
  }
}

/**
 * 站点搜索（搜索特定网站的内容）
 * @param {string} keywords - 关键词
 * @param {string} site - 站点域名（如 tiktok.com, instagram.com）
 * @param {string} platform - 平台标识
 * @param {Object} options - 其他选项
 */
async function searchSite(keywords, site, platform, options = {}) {
  return search(keywords, {
    ...options,
    siteSearch: site,
    platform: platform || site,
  });
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
      const kwResults = await search(kw, options);
      for (const item of kwResults) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          results.push(item);
        }
      }
    } catch (e) {
      console.error(`Google Custom Search failed for "${kw}":`, e.message);
    }
  }

  return results;
}

/**
 * 多站点批量搜索（同时搜多个平台）
 * @param {Array<string>} keywords - 关键词数组
 * @param {Array<{site: string, platform: string}>} sites - 站点列表
 * @param {Object} options - 其他选项
 */
async function batchSearchSites(keywords, sites, options = {}) {
  if (!keywords || keywords.length === 0 || !sites || sites.length === 0) return [];

  const results = [];
  const seenUrls = new Set();

  for (const siteConfig of sites) {
    for (const kw of keywords) {
      try {
        const siteResults = await searchSite(kw, siteConfig.site, siteConfig.platform, options);
        for (const item of siteResults) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            results.push(item);
          }
        }
      } catch (e) {
        console.error(`Site search failed for ${siteConfig.site}:`, e.message);
      }
    }
  }

  return results;
}

/**
 * 检查是否可用
 */
function isAvailable() {
  return !!process.env.GOOGLE_API_KEY && !!process.env.GOOGLE_CX;
}

/**
 * 获取缓存状态
 */
function getCacheStats() {
  return {
    size: cache.size,
    maxSize: 200,
    ttl: CACHE_TTL / 1000 / 60,
  };
}

module.exports = {
  search,
  searchSite,
  batchSearch,
  batchSearchSites,
  isAvailable,
  getCacheStats,
};
