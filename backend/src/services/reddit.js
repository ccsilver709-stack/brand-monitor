/**
 * Reddit API 服务模块
 * 完全免费，需要注册应用获取 client_id 和 client_secret
 * 文档：https://www.reddit.com/dev/api/
 */

const https = require('https');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存

// access_token 缓存
let accessToken = null;
let tokenExpiry = 0;

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
 * 获取 access_token（使用应用凭证）
 */
async function getAccessToken() {
  // 如果 token 还没过期，直接返回
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET not configured');
  }

  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const postData = 'grant_type=client_credentials';

    const options = {
      hostname: 'www.reddit.com',
      path: '/api/v1/access_token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BrandMonitor/1.0 (by /u/your_username)',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.access_token) {
            accessToken = json.access_token;
            tokenExpiry = Date.now() + (json.expires_in - 60) * 1000; // 提前60秒过期
            resolve(accessToken);
          } else {
            reject(new Error(`Reddit auth failed: ${json.error || 'unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse Reddit auth response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Reddit auth request failed: ${e.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * 调用 Reddit API
 */
async function callRedditAPI(endpoint, params = {}) {
  const token = await getAccessToken();

  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams(params);

    const options = {
      hostname: 'oauth.reddit.com',
      path: `/${endpoint}?${queryParams.toString()}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'BrandMonitor/1.0 (by /u/your_username)',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`Reddit API error: ${json.error}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse Reddit response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`Reddit API request failed: ${e.message}`));
    });

    req.end();
  });
}

/**
 * 格式化 Reddit 帖子为统一格式
 */
function formatRedditPosts(posts) {
  if (!posts || !Array.isArray(posts)) return [];

  return posts.map((post, index) => {
    const data = post.data || {};

    return {
      id: `reddit-${data.id}`,
      platform: 'reddit',
      title: data.title || '',
      summary: data.selftext?.substring(0, 300) || '',
      author: data.author || '',
      url: `https://reddit.com${data.permalink || ''}`,
      displayUrl: '',
      publishTime: new Date(data.created_utc * 1000).toISOString(),
      views: data.view_count || 0,
      likes: data.ups || 0,
      comments: data.num_comments || 0,
      shares: 0,
      country: 'US',
      productLine: '',
      sentiment: 'neutral',
      relevance: 100 - index * 5,
      thumbnail: data.thumbnail || '',
      subreddit: data.subreddit || '',
      score: data.score || 0,
      raw: {
        subreddit: data.subreddit,
        score: data.score,
        num_comments: data.num_comments,
        permalink: data.permalink,
      },
    };
  });
}

/**
 * Reddit 搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.subreddit - 特定子版块
 * @param {string} options.sort - 排序方式 (relevance/hot/top/new/comments)
 * @param {string} options.time - 时间范围 (hour/day/week/month/year/all)
 * @param {number} options.limit - 结果数量 (max 100)
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
    const result = await callRedditAPI(endpoint, params);
    const posts = result.data?.children || [];
    const formatted = formatRedditPosts(posts);
    setCache(cacheKey, formatted);
    return formatted;
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
 */
function isAvailable() {
  return !!process.env.REDDIT_CLIENT_ID && !!process.env.REDDIT_CLIENT_SECRET;
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
