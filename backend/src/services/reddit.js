/**
 * Reddit API 服务模块
 * 使用 Reddit 公开 RSS Feed，无需认证、无需 API Key
 * 
 * 说明：
 * - Reddit JSON API 对服务器端 IP 限制较严，容易 403
 * - RSS Feed 接口限制较宽松，可以正常访问
 * - 无需注册、无需创建应用、无需 Key
 * - 限制：每分钟约 60 次请求（IP 级别限流）
 */

const https = require('https');
const { XMLParser } = require('fast-xml-parser');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存

// User-Agent
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// XML 解析器
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

/**
 * 生成缓存键
 */
function getCacheKey(keywords, options) {
  return `reddit:${keywords}:${JSON.stringify(options)}`;
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
 * 请求 Reddit RSS Feed
 */
async function fetchRedditRSS(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams(params);

    const options = {
      hostname: 'www.reddit.com',
      path: `/${endpoint}.rss?${queryParams.toString()}`,
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/rss+xml, application/atom+xml, text/xml',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Reddit RSS request failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Reddit RSS request failed: ${e.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Reddit RSS request timeout'));
    });

    req.end();
  });
}

/**
 * 解析 RSS 内容，提取帖子信息
 */
function parseRSS(xmlContent) {
  try {
    const json = xmlParser.parse(xmlContent);
    const feed = json.feed || json.rss?.channel;
    
    if (!feed) return [];

    // Atom 格式 (feed.entry)
    let entries = feed.entry;
    if (!entries && feed.item) {
      // RSS 格式 (channel.item)
      entries = feed.item;
    }

    if (!entries) return [];
    if (!Array.isArray(entries)) entries = [entries];

    return entries.map((entry, index) => {
      // 提取 ID
      let id = '';
      if (entry.id) {
        const idMatch = entry.id.match(/\/([a-z0-9]+)\/?$/i);
        if (idMatch) id = idMatch[1];
      }
      if (!id && entry.guid) {
        id = entry.guid['#text'] || entry.guid;
      }

      // 提取标题
      const title = entry.title?.['#text'] || entry.title || '';

      // 提取链接
      let url = '';
      if (entry.link) {
        if (Array.isArray(entry.link)) {
          const altLink = entry.link.find(l => l['@_rel'] === 'alternate');
          url = altLink?.['@_href'] || entry.link[0]?.['@_href'] || '';
        } else if (entry.link['@_href']) {
          url = entry.link['@_href'];
        } else {
          url = entry.link;
        }
      }

      // 提取作者
      let author = '';
      if (entry.author) {
        author = entry.author.name || entry.author || '';
        if (author.startsWith('/u/')) author = author.substring(3);
      }
      if (!author && entry['dc:creator']) {
        author = entry['dc:creator'];
      }

      // 提取发布时间
      const publishTime = entry.updated || entry.published || entry.pubDate || new Date().toISOString();

      // 提取内容/摘要
      let summary = '';
      if (entry.summary) {
        summary = entry.summary['#text'] || entry.summary || '';
      }
      if (!summary && entry.description) {
        summary = entry.description['#text'] || entry.description || '';
      }
      if (!summary && entry.content) {
        summary = entry.content['#text'] || entry.content || '';
      }
      // 去掉 HTML 标签
      summary = summary.replace(/<[^>]*>/g, '').substring(0, 300);

      // 提取子版块
      let subreddit = '';
      if (entry.category) {
        if (Array.isArray(entry.category)) {
          const subCat = entry.category.find(c => c['@_label']?.startsWith('r/'));
          if (subCat) subreddit = subCat['@_label'].substring(2);
        } else if (entry.category['@_label']?.startsWith('r/')) {
          subreddit = entry.category['@_label'].substring(2);
        }
      }

      return {
        id: `reddit-${id || index}`,
        platform: 'reddit',
        title,
        summary,
        author,
        url,
        displayUrl: '',
        publishTime: new Date(publishTime).toISOString(),
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        country: 'US',
        productLine: '',
        sentiment: 'neutral',
        relevance: 100 - index * 5,
        thumbnail: '',
        subreddit,
        score: 0,
        raw: {
          subreddit,
          permalink: url,
        },
      };
    });
  } catch (e) {
    console.error('Failed to parse Reddit RSS:', e.message);
    return [];
  }
}

/**
 * Reddit 搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.subreddit - 特定子版块
 * @param {string} options.sort - 排序方式 (relevance/hot/top/new/comments)
 * @param {string} options.time - 时间范围 (hour/day/week/month/year/all)
 * @param {number} options.limit - 结果数量
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchPosts(keywords, options = {}) {
  const cacheKey = getCacheKey(keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const params = {
    q: keywords,
    sort: options.sort || 'relevance',
    t: options.time || 'month',
    limit: Math.min(options.limit || 25, 100),
    restrict_sr: options.subreddit ? 'true' : 'false',
  };

  const endpoint = options.subreddit
    ? `r/${options.subreddit}/search`
    : 'search';

  try {
    const xmlContent = await fetchRedditRSS(endpoint, params);
    const posts = parseRSS(xmlContent);
    setCache(cacheKey, posts);
    return posts;
  } catch (e) {
    console.error('Reddit search failed:', e.message);
    throw e;
  }
}

/**
 * 多关键词批量搜索
 */
async function batchSearch(keywords, options = {}) {
  if (!keywords || keywords.length === 0) return [];

  const results = [];
  const seenIds = new Set();

  for (const kw of keywords) {
    try {
      const kwResults = await searchPosts(kw, options);
      for (const item of kwResults) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      }
    } catch (e) {
      console.error(`Reddit search failed for "${kw}":`, e.message);
    }
  }

  return results;
}

/**
 * 检查 Reddit API 是否可用
 * RSS 接口永远可用，无需配置
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
    ttl: CACHE_TTL / 1000 / 60,
  };
}

module.exports = {
  searchPosts,
  batchSearch,
  isAvailable,
  getCacheStats,
};
