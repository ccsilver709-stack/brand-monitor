/**
 * SerpAPI 服务模块
 * 封装 Google 搜索、新闻搜索等接口，统一格式化结果
 * 文档：https://serpapi.com/search-api
 */

const https = require('https');

// 内存缓存（key: 缓存键, value: { data, timestamp }）
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存

/**
 * 调用 SerpAPI
 * @param {Object} params - SerpAPI 参数
 * @returns {Promise<Object>} 原始返回结果
 */
function callSerpAPI(params) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      return reject(new Error('SERPAPI_KEY not configured'));
    }

    const queryParams = new URLSearchParams({
      ...params,
      api_key: apiKey,
      no_cache: 'false',
    });

    const options = {
      hostname: 'serpapi.com',
      path: `/search?${queryParams.toString()}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`SerpAPI error: ${json.error}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse SerpAPI response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`SerpAPI request failed: ${e.message}`));
    });

    req.end();
  });
}

/**
 * 生成缓存键
 */
function getCacheKey(type, keywords, options) {
  return `${type}:${keywords}:${JSON.stringify(options)}`;
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
  // 限制缓存大小，最多存100条
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * 格式化 SerpAPI 有机搜索结果为统一格式
 * @param {Array} organicResults - SerpAPI organic_results
 * @param {string} platform - 平台标识
 * @returns {Array} 格式化后的结果
 */
function formatOrganicResults(organicResults, platform = 'web') {
  if (!organicResults || !Array.isArray(organicResults)) return [];

  return organicResults.map((item, index) => ({
    id: `serp-${platform}-${item.position || index}-${Date.now()}`,
    platform: platform,
    title: item.title || '',
    summary: item.snippet || item.description || '',
    author: item.source || '',
    url: item.link || '',
    displayUrl: item.displayed_link || '',
    publishTime: item.date || new Date().toISOString(),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    country: 'US',
    productLine: '',
    sentiment: 'neutral',
    relevance: 100 - (item.position || index) * 5,
    thumbnail: item.thumbnail || '',
    // 原始数据，方便分类引擎使用
    raw: {
      position: item.position,
      source: item.source,
      snippet: item.snippet,
    },
  }));
}

/**
 * 格式化 SerpAPI 新闻结果为统一格式
 * @param {Array} newsResults - SerpAPI news_results
 * @returns {Array} 格式化后的结果
 */
function formatNewsResults(newsResults) {
  if (!newsResults || !Array.isArray(newsResults)) return [];

  return newsResults.map((item, index) => ({
    id: `serp-news-${index}-${Date.now()}`,
    platform: 'news',
    title: item.title || '',
    summary: item.snippet || '',
    author: item.source || '',
    url: item.link || '',
    displayUrl: '',
    publishTime: item.date || new Date().toISOString(),
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    country: 'US',
    productLine: '',
    sentiment: 'neutral',
    relevance: 100 - index * 5,
    thumbnail: item.thumbnail || '',
    raw: {
      source: item.source,
      snippet: item.snippet,
    },
  }));
}

/**
 * Google 网页搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.country - 国家代码 (US, DE, UK, FR, etc.)
 * @param {string} options.language - 语言 (en, de, fr, etc.)
 * @param {number} options.num - 结果数量 (max 100)
 * @param {string} options.timeRange - 时间范围 (h/d/w/m/y)
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchWeb(keywords, options = {}) {
  const cacheKey = getCacheKey('web', keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const params = {
    engine: 'google',
    q: keywords,
    gl: options.country || 'us',
    hl: options.language || 'en',
    num: Math.min(options.num || 20, 100),
  };

  // 时间范围
  if (options.timeRange) {
    params.tbs = `qdr:${options.timeRange}`;
  }

  try {
    const result = await callSerpAPI(params);
    const formatted = formatOrganicResults(result.organic_results, 'web');
    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('SerpAPI web search failed:', e.message);
    throw e;
  }
}

/**
 * Google 新闻搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.country - 国家代码
 * @param {string} options.language - 语言
 * @param {number} options.num - 结果数量
 * @param {string} options.timeRange - 时间范围
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchNews(keywords, options = {}) {
  const cacheKey = getCacheKey('news', keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const params = {
    engine: 'google_news',
    q: keywords,
    gl: options.country || 'us',
    hl: options.language || 'en',
  };

  // 时间范围
  if (options.timeRange) {
    params.tbs = `qdr:${options.timeRange}`;
  }

  try {
    const result = await callSerpAPI(params);
    const formatted = formatNewsResults(result.news_results);
    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('SerpAPI news search failed:', e.message);
    throw e;
  }
}

/**
 * Google 视频搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchVideos(keywords, options = {}) {
  const cacheKey = getCacheKey('videos', keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const params = {
    engine: 'google_videos',
    q: keywords,
    gl: options.country || 'us',
    hl: options.language || 'en',
    num: Math.min(options.num || 20, 100),
  };

  if (options.timeRange) {
    params.tbs = `qdr:${options.timeRange}`;
  }

  try {
    const result = await callSerpAPI(params);
    const formatted = formatOrganicResults(result.video_results || result.organic_results, 'video');
    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('SerpAPI video search failed:', e.message);
    throw e;
  }
}

/**
 * 多关键词批量搜索
 * @param {Array<string>} keywords - 关键词数组
 * @param {Function} searchFn - 搜索函数 (searchWeb/searchNews/searchVideos)
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 合并去重后的结果
 */
async function batchSearch(keywords, searchFn, options = {}) {
  if (!keywords || keywords.length === 0) return [];

  const results = [];
  const seenUrls = new Set();

  // 串行搜索，避免触发限流
  for (const kw of keywords) {
    try {
      const kwResults = await searchFn(kw, options);
      for (const item of kwResults) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          results.push(item);
        }
      }
    } catch (e) {
      console.error(`Search failed for keyword "${kw}":`, e.message);
    }
  }

  return results;
}

/**
 * 检查 SerpAPI 是否可用（是否配置了API Key）
 */
function isAvailable() {
  return !!process.env.SERPAPI_KEY;
}

/**
 * 获取缓存状态
 */
function getCacheStats() {
  return {
    size: cache.size,
    maxSize: 100,
    ttl: CACHE_TTL / 1000 / 60, // 分钟
  };
}

module.exports = {
  searchWeb,
  searchNews,
  searchVideos,
  batchSearch,
  isAvailable,
  getCacheStats,
};
