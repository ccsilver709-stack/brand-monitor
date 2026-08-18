/**
 * RedditDate 第三方 API 服务
 * 提供 Reddit 评论数据、历史数据等增强功能
 * 
 * 官网：https://redditdate.top/
 * 认证方式：请求头 X-API-Key: sk_live_xxx
 */

const https = require('https');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1小时缓存（评论不会频繁变动）

const API_BASE = 'https://redditdate.top';

/**
 * 生成缓存键
 */
function getCacheKey(type, id, options) {
  return `redditdate:${type}:${id}:${JSON.stringify(options)}`;
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
 * 调用 RedditDate API
 */
async function callAPI(path, options = {}) {
  const apiKey = process.env.REDDITDATE_API_KEY;
  if (!apiKey) {
    throw new Error('RedditDate API key not configured');
  }

  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams(options.params || {});
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const reqOptions = {
      hostname: 'redditdate.top',
      path: `${path}${queryString}`,
      method: options.method || 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(json);
          } else {
            reject(new Error(`RedditDate API error: ${res.statusCode} - ${json.message || data}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse RedditDate response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`RedditDate API request failed: ${e.message}`));
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('RedditDate API request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * 获取帖子评论
 * @param {string} postId - Reddit 帖子 ID
 * @param {Object} options - 选项
 * @param {number} options.limit - 评论数量上限 (max 50)
 * @param {string} options.sort - 排序方式 (confidence/top/new/controversial/old)
 * @param {number} options.maxDepth - 最大深度 (max 5)
 * @returns {Promise<Array>} 评论列表
 */
async function getPostComments(postId, options = {}) {
  const cacheKey = getCacheKey('comments', postId, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const result = await callAPI(`/v1/posts/${postId}/comments`, {
      params: {
        limit: Math.min(options.limit || 20, 50),
        sort: options.sort || 'top',
        max_depth: Math.min(options.maxDepth || 3, 5),
      },
    });

    const comments = result.data?.comments || [];
    const formatted = formatComments(comments);
    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('RedditDate getPostComments failed:', e.message);
    throw e;
  }
}

/**
 * 格式化评论数据
 */
function formatComments(comments, depth = 0) {
  if (!comments || !Array.isArray(comments)) return [];

  return comments.map((comment) => ({
    id: comment.id,
    author: comment.author || '[deleted]',
    body: comment.body || '',
    score: comment.score || 0,
    depth: comment.depth !== undefined ? comment.depth : depth,
    createdAt: comment.published_at || '',
    replies: comment.replies ? formatComments(comment.replies, depth + 1) : [],
  }));
}

/**
 * 获取子版块最新帖子
 * @param {string} subreddit - 子版块名称
 * @param {Object} options - 选项
 * @param {number} options.limit - 数量 (max 100)
 * @param {string} options.sort - 排序 (new/hot/top)
 * @param {string} options.t - 时间范围 (hour/day/week/month/year/all)
 */
async function getSubredditPosts(subreddit, options = {}) {
  const cacheKey = getCacheKey('subreddit', subreddit, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const result = await callAPI(`/v1/subreddits/${subreddit}/posts`, {
      params: {
        limit: Math.min(options.limit || 25, 100),
        sort: options.sort || 'new',
        t: options.time || 'all',
      },
    });

    const posts = result.data?.items || [];
    const formatted = posts.map((post) => ({
      id: `reddit-${post.id}`,
      platform: 'reddit',
      title: post.title || '',
      summary: '',
      author: post.author || '',
      url: post.reddit_url || '',
      publishTime: post.published_at || '',
      views: 0,
      likes: post.score || 0,
      comments: post.comment_count || 0,
      shares: 0,
      country: '',
      productLine: '',
      sentiment: 'neutral',
      relevance: 100,
      subreddit: post.subreddit || subreddit,
      score: post.score || 0,
    }));

    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('RedditDate getSubredditPosts failed:', e.message);
    throw e;
  }
}

/**
 * 查询账户额度
 */
async function getUsage() {
  try {
    const result = await callAPI('/v1/account/usage');
    return result;
  } catch (e) {
    console.error('RedditDate getUsage failed:', e.message);
    throw e;
  }
}

/**
 * 检查服务是否可用
 */
function isAvailable() {
  const key = process.env.REDDITDATE_API_KEY;
  return !!(key && !key.includes('your_redditdate'));
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
  getPostComments,
  getSubredditPosts,
  getUsage,
  isAvailable,
  getCacheStats,
};
