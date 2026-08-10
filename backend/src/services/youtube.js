/**
 * YouTube Data API v3 服务模块
 * 免费额度：每天 10,000 配额（搜索一次消耗100配额 = 每天100次搜索）
 * 文档：https://developers.google.com/youtube/v3/docs/search/list
 */

const https = require('https');

// 内存缓存
const cache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30分钟缓存

/**
 * 生成缓存键
 */
function getCacheKey(keywords, options) {
  return `youtube:${keywords}:${JSON.stringify(options)}`;
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
 * 调用 YouTube Data API
 */
function callYouTubeAPI(endpoint, params) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return reject(new Error('YOUTUBE_API_KEY not configured'));
    }

    const queryParams = new URLSearchParams({
      ...params,
      key: apiKey,
    });

    const options = {
      hostname: 'www.googleapis.com',
      path: `/youtube/v3/${endpoint}?${queryParams.toString()}`,
      method: 'GET',
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(`YouTube API error: ${json.error.message}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse YouTube response: ${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`YouTube API request failed: ${e.message}`));
    });

    req.end();
  });
}

/**
 * 格式化 YouTube 搜索结果为统一格式
 */
function formatSearchResults(items) {
  if (!items || !Array.isArray(items)) return [];

  return items.map((item, index) => {
    const id = item.id?.videoId || item.id?.channelId || `yt-${index}`;
    const snippet = item.snippet || {};

    return {
      id: `youtube-${id}`,
      platform: 'youtube',
      title: snippet.title || '',
      summary: snippet.description || '',
      author: snippet.channelTitle || '',
      url: `https://www.youtube.com/watch?v=${item.id?.videoId || ''}`,
      displayUrl: '',
      publishTime: snippet.publishedAt || new Date().toISOString(),
      views: 0, // 搜索结果不含播放量，需要单独查
      likes: 0,
      comments: 0,
      shares: 0,
      country: 'US',
      productLine: '',
      sentiment: 'neutral',
      relevance: 100 - index * 5,
      thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      raw: {
        videoId: item.id?.videoId,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle,
        liveBroadcastContent: snippet.liveBroadcastContent,
      },
    };
  });
}

/**
 * YouTube 搜索
 * @param {string} keywords - 关键词
 * @param {Object} options - 选项
 * @param {string} options.country - 国家代码 (US, DE, UK, FR, etc.)
 * @param {string} options.language - 语言 (en, de, fr, etc.)
 * @param {number} options.maxResults - 结果数量 (max 50)
 * @param {string} options.order - 排序方式 (date/relevance/viewCount/rating)
 * @param {string} options.publishedAfter - 发布时间之后 (ISO 8601)
 * @param {string} options.publishedBefore - 发布时间之前 (ISO 8601)
 * @returns {Promise<Array>} 格式化后的结果
 */
async function searchVideos(keywords, options = {}) {
  const cacheKey = getCacheKey(keywords, options);
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const params = {
    part: 'snippet',
    q: keywords,
    maxResults: Math.min(options.maxResults || 20, 50),
    order: options.order || 'relevance',
    type: 'video',
  };

  // 国家/语言
  if (options.country) {
    params.regionCode = options.country;
  }
  if (options.language) {
    params.relevanceLanguage = options.language;
  }

  // 时间范围
  if (options.publishedAfter) {
    params.publishedAfter = options.publishedAfter;
  }
  if (options.publishedBefore) {
    params.publishedBefore = options.publishedBefore;
  }

  try {
    const result = await callYouTubeAPI('search', params);
    const items = result.items || [];
    const formatted = formatSearchResults(items);

    // 批量获取视频统计数据（播放量、点赞数、评论数）
    const videoIds = items
      .map(item => item.id?.videoId)
      .filter(id => id);
    
    if (videoIds.length > 0) {
      try {
        const statsResult = await callYouTubeAPI('videos', {
          part: 'statistics',
          id: videoIds.join(','),
          maxResults: 50,
        });

        const statsMap = {};
        (statsResult.items || []).forEach(item => {
          statsMap[item.id] = item.statistics || {};
        });

        // 填充统计数据
        formatted.forEach(item => {
          const videoId = item.raw?.videoId;
          if (videoId && statsMap[videoId]) {
            const stats = statsMap[videoId];
            item.views = parseInt(stats.viewCount) || 0;
            item.likes = parseInt(stats.likeCount) || 0;
            item.comments = parseInt(stats.commentCount) || 0;
          }
        });
      } catch (statsErr) {
        console.warn('YouTube video stats fetch failed:', statsErr.message);
        // 统计数据获取失败不影响主流程，保持0值
      }
    }

    setCache(cacheKey, formatted);
    return formatted;
  } catch (e) {
    console.error('YouTube search failed:', e.message);
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
      const kwResults = await searchVideos(kw, options);
      for (const item of kwResults) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          results.push(item);
        }
      }
    } catch (e) {
      console.error(`YouTube search failed for "${kw}":`, e.message);
    }
  }

  return results;
}

/**
 * 检查 YouTube API 是否可用
 */
function isAvailable() {
  return !!process.env.YOUTUBE_API_KEY;
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
  searchVideos,
  batchSearch,
  isAvailable,
  getCacheStats,
};
