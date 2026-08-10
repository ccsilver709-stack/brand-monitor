const express = require('express');
const router = express.Router();
const { classifyBatch } = require('../services/classifier');
const { aggregate } = require('../services/aggregator');
const { generateMockData } = require('../utils/mockData');
const googleNewsRSS = require('../services/googleNewsRSS');
const youtube = require('../services/youtube');
const reddit = require('../services/reddit');
const googleCustomSearch = require('../services/googleCustomSearch');
const redditdate = require('../services/redditdate');

// Mock数据缓存
let mockDataCache = null;

function getMockData() {
  if (!mockDataCache) {
    mockDataCache = classifyBatch(generateMockData());
  }
  return mockDataCache;
}

/**
 * 将时间范围天数转换为各API的时间参数
 */
function getTimeParams(days) {
  if (!days) return { googleNews: null, youtubePublishedAfter: null, reddit: 'month', gcs: null };

  const d = parseInt(days);
  if (isNaN(d)) return { googleNews: null, youtubePublishedAfter: null, reddit: 'month', gcs: null };

  // Google News RSS: h(小时) d(天) w(周) m(月) y(年)
  let googleNews = 'm';
  if (d <= 1) googleNews = 'h';
  else if (d <= 7) googleNews = 'w';
  else if (d <= 30) googleNews = 'm';
  else if (d <= 90) googleNews = 'm3';
  else googleNews = 'y';

  // YouTube: publishedAfter (ISO 8601)
  const now = new Date();
  const pastDate = new Date(now - d * 24 * 60 * 60 * 1000);
  const youtubePublishedAfter = pastDate.toISOString();

  // Reddit: hour/day/week/month/year/all
  let reddit = 'month';
  if (d <= 1) reddit = 'hour';
  else if (d <= 7) reddit = 'day';
  else if (d <= 30) reddit = 'month';
  else if (d <= 365) reddit = 'year';
  else reddit = 'all';

  // Google Custom Search: dateRestrict (d[number], w[number], m[number], y[number])
  let gcs = null;
  if (d <= 1) gcs = 'd1';
  else if (d <= 7) gcs = 'w1';
  else if (d <= 30) gcs = 'm1';
  else if (d <= 90) gcs = 'm3';
  else if (d <= 180) gcs = 'm6';
  else if (d <= 365) gcs = 'y1';

  return { googleNews, youtubePublishedAfter, reddit, gcs };
}

/**
 * 站点搜索配置（用Google Custom Search搜特定社交平台）
 */
const SOCIAL_SITES = [
  { site: 'tiktok.com', platform: 'tiktok' },
  { site: 'instagram.com', platform: 'instagram' },
  { site: 'facebook.com', platform: 'facebook' },
  { site: 'twitter.com', platform: 'twitter' },
];

/**
 * 从真实API获取数据（多源合并）
 */
async function fetchRealData(keywords, platforms, countries, timeRange) {
  const kwList = keywords.split(',').map(k => k.trim()).filter(Boolean);
  const pList = platforms ? platforms.split(',').map(p => p.trim()).filter(Boolean) : [];
  const cList = countries ? countries.split(',').map(c => c.trim()).filter(Boolean) : ['US'];

  const dataSourceDebug = {};

  console.log('[Debug] === fetchRealData start (parallel mode) ===');
  console.log('[Debug] pList:', JSON.stringify(pList));
  console.log('[Debug] kwList:', JSON.stringify(kwList));

  const country = cList[0] || 'US';
  const timeParams = getTimeParams(timeRange);

  // 构建并行任务列表
  const tasks = [];

  // 1. Google News RSS（PR媒体）
  if (pList.length === 0 || pList.includes('news')) {
    tasks.push({
      name: 'google_news_rss',
      fn: async () => {
        const results = await googleNewsRSS.batchSearch(kwList, {
          country,
          language: 'en',
          timeRange: timeParams.googleNews,
        });
        return results;
      }
    });
  } else {
    dataSourceDebug.google_news_rss = { status: 'skipped', reason: 'not in platform list' };
  }

  // 2. YouTube Data API v3（视频）
  if (youtube.isAvailable() && (pList.length === 0 || pList.includes('youtube'))) {
    tasks.push({
      name: 'youtube_api',
      fn: async () => {
        const results = await youtube.batchSearch(kwList, {
          country,
          language: 'en',
          maxResults: 20,
          order: 'relevance',
          publishedAfter: timeParams.youtubePublishedAfter,
        });
        return results;
      }
    });
  } else {
    dataSourceDebug.youtube_api = {
      status: 'skipped',
      reason: youtube.isAvailable() ? 'not in platform list' : 'API key not configured'
    };
  }

  // 3. Reddit API（社区/社媒）
  if (reddit.isAvailable() && (pList.length === 0 || pList.includes('reddit') || pList.includes('forum'))) {
    tasks.push({
      name: 'reddit_api',
      fn: async () => {
        const results = await reddit.batchSearch(kwList, {
          sort: 'relevance',
          time: timeParams.reddit,
          limit: 25,
        });
        return results;
      }
    });
  } else {
    dataSourceDebug.reddit_api = {
      status: 'skipped',
      reason: reddit.isAvailable() ? 'not in platform list' : 'not available'
    };
  }

  // 4. Google Custom Search - Web搜索
  if (googleCustomSearch.isAvailable()) {
    const gcsOptions = {
      country,
      num: 10,
      dateRestrict: timeParams.gcs,
    };

    const needWebSearch = pList.length === 0 ||
      pList.includes('affiliate_site') ||
      pList.includes('forum') ||
      pList.includes('web') ||
      pList.includes('blog');

    if (needWebSearch) {
      tasks.push({
        name: 'gcs_web',
        fn: async () => {
          const results = await googleCustomSearch.batchSearch(kwList, {
            ...gcsOptions,
            platform: 'web',
          });
          return results;
        }
      });
    } else {
      dataSourceDebug.gcs_web = { status: 'skipped', reason: 'not in platform list' };
    }

    // 4b. 社交平台站点搜索（TikTok/Instagram/Facebook/Twitter）
    const socialSitesToSearch = SOCIAL_SITES.filter(s =>
      pList.length === 0 || pList.includes(s.platform)
    );

    if (socialSitesToSearch.length > 0) {
      tasks.push({
        name: 'gcs_social_sites',
        fn: async () => {
          const results = await googleCustomSearch.batchSearchSites(
            kwList,
            socialSitesToSearch,
            gcsOptions
          );
          return results;
        },
        meta: { sites: socialSitesToSearch.map(s => s.platform) }
      });
    } else {
      dataSourceDebug.gcs_social_sites = { status: 'skipped', reason: 'no social sites in platform list' };
    }
  } else {
    dataSourceDebug.google_custom_search = { status: 'skipped', reason: 'API key not configured' };
  }

  console.log(`[Debug] Running ${tasks.length} parallel tasks: ${tasks.map(t => t.name).join(', ')}`);

  // 并行执行所有任务
  const results = await Promise.all(
    tasks.map(async (task) => {
      try {
        console.log(`[Debug] Starting task: ${task.name}`);
        const data = await task.fn();
        console.log(`[Debug] Task ${task.name} completed with ${data.length} results`);
        dataSourceDebug[task.name] = { status: 'success', count: data.length, ...(task.meta || {}) };
        return data;
      } catch (e) {
        console.error(`[Debug] Task ${task.name} failed:`, e.message);
        dataSourceDebug[task.name] = { status: 'error', error: e.message, ...(task.meta || {}) };
        return [];
      }
    })
  );

  // 合并所有结果
  const allResults = results.flat();

  console.log('[Debug] === fetchRealData end ===');
  console.log('[Debug] final allResults length:', allResults.length);
  console.log('[Debug] platform distribution:', JSON.stringify(allResults.reduce((acc, r) => {
    acc[r.platform] = (acc[r.platform] || 0) + 1;
    return acc;
  }, {})));
  console.log('[Debug] dataSourceDebug:', JSON.stringify(dataSourceDebug));

  // 如果没有任何结果，返回空数组（前端会显示无数据）
  if (allResults.length === 0) {
    return { results: [], dataSourceDebug };
  }

  // 自动分类
  const classified = classifyBatch(allResults);

  return { results: classified, dataSourceDebug };
}

/**
 * GET /api/search
 * 搜索接口 - 根据关键词和筛选条件返回搜索结果+统计数据
 * 
 * 参数:
 * - keywords: 关键词数组（逗号分隔）
 * - platforms: 平台数组（逗号分隔）
 * - countries: 国家代码数组（逗号分隔）
 * - category: 分类（pr/affiliate/social）
 * - subCategory: 细分类型
 * - timeRange: 时间范围（7/30/90天，或自定义startDate/endDate）
 * - startDate: 开始日期（YYYY-MM-DD）
 * - endDate: 结束日期（YYYY-MM-DD）
 * - sentiment: 情感（positive/neutral/negative）
 * - page: 页码
 * - pageSize: 每页数量
 * - useMock: 强制使用Mock数据（调试用）
 */
router.get('/', async (req, res) => {
  try {
    const {
      keywords = '',
      platforms = '',
      countries = '',
      category = '',
      subCategory = '',
      timeRange = '30',
      startDate = '',
      endDate = '',
      sentiment = '',
      page = 1,
      pageSize = 50,
      useMock = '',
    } = req.query;

    // ===== 1. 获取原始数据 =====
    let results;
    const hasRealDataSources = 
      youtube.isAvailable() || 
      reddit.isAvailable() || 
      googleCustomSearch.isAvailable();
    
    // Google News RSS 永远可用，但内容有限，主要还是看其他API
    const useRealData = hasRealDataSources && useMock !== 'true' && keywords;

    if (useRealData) {
      console.log(`[Search] Using real data sources for: ${keywords}`);
      let dataSourceDebug = {};
      try {
        const fetchResult = await fetchRealData(keywords, platforms, countries, timeRange);
        results = fetchResult.results;
        dataSourceDebug = fetchResult.dataSourceDebug || {};
        // 如果真实数据为空，fallback到Mock
        if (results.length === 0) {
          console.log('[Search] No real data, falling back to mock');
          results = getMockData();
        }
      } catch (e) {
        console.error('[Search] Real data failed, falling back to mock:', e.message);
        results = getMockData();
      }
      // 把dataSourceDebug挂到results上，后面用
      results._dataSourceDebug = dataSourceDebug;
    } else {
      results = getMockData();
    }

    // ===== 2. 关键词筛选 =====
    if (keywords) {
      const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (kwList.length > 0) {
        results = results.filter(r => {
          const text = (r.title + ' ' + r.summary).toLowerCase();
          return kwList.some(kw => text.includes(kw));
        });
      }
    }

    // ===== 3. 平台/渠道筛选 =====
    if (platforms) {
      const pList = platforms.split(',').map(p => p.trim()).filter(Boolean);
      if (pList.length > 0) {
        // 平台别名映射：前端用的分类名 -> 实际数据源返回的platform值
        const platformAliases = {
          'forum': ['forum', 'reddit'],
          'news': ['news'],
          'affiliate_site': ['affiliate_site'],
          'youtube': ['youtube'],
          'tiktok': ['tiktok'],
          'instagram': ['instagram'],
          'facebook': ['facebook'],
          'twitter': ['twitter'],
        };
        
        // 展开所有匹配的平台值
        const matchedPlatforms = new Set();
        pList.forEach(p => {
          const aliases = platformAliases[p] || [p];
          aliases.forEach(a => matchedPlatforms.add(a));
        });
        
        results = results.filter(r => matchedPlatforms.has(r.platform));
      }
    }

    // ===== 4. 国家筛选 =====
    if (countries) {
      const cList = countries.split(',').map(c => c.trim()).filter(Boolean);
      if (cList.length > 0) {
        results = results.filter(r => cList.includes(r.country));
      }
    }

    // ===== 5. 分类筛选 =====
    if (category && category !== 'all') {
      results = results.filter(r => r.category === category);
    }

    // ===== 6. 细分类型筛选 =====
    if (subCategory && subCategory !== 'all') {
      results = results.filter(r => r.subCategory === subCategory);
    }

    // ===== 7. 情感筛选 =====
    if (sentiment && sentiment !== 'all') {
      results = results.filter(r => r.sentiment === sentiment);
    }

    // ===== 8. 时间范围筛选 =====
    const now = new Date();
    let startTime = null;
    let endTime = now;

    if (startDate && endDate) {
      startTime = new Date(startDate);
      endTime = new Date(endDate);
      endTime.setHours(23, 59, 59, 999);
    } else if (timeRange) {
      const days = parseInt(timeRange);
      if (!isNaN(days)) {
        startTime = new Date(now - days * 24 * 60 * 60 * 1000);
      }
    }

    if (startTime) {
      results = results.filter(r => {
        // 无 publishTime 或无效日期的结果予以保留，避免误删（如 Google Custom Search 结果）
        if (!r.publishTime) return true;
        const publishTime = new Date(r.publishTime);
        if (isNaN(publishTime.getTime())) return true;
        return publishTime >= startTime && publishTime <= endTime;
      });
    }

    // ===== 9. 计算统计数据 =====
    const days = startTime ? Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000)) : 7;
    const stats = aggregate(results, { days });

    // ===== 10. 分页 =====
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 50;
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedResults = results.slice(startIndex, startIndex + pageSizeNum);

    // ===== 11. 返回结果 =====
    // 数据源说明
    const dataSources = [];
    dataSources.push('google_news_rss'); // Google News RSS 永远可用
    if (youtube.isAvailable()) dataSources.push('youtube_api');
    if (reddit.isAvailable()) dataSources.push('reddit_api');
    if (googleCustomSearch.isAvailable()) dataSources.push('google_custom_search');

    res.json({
      success: true,
      data: {
        results: paginatedResults,
        total: results.length,
        page: pageNum,
        pageSize: pageSizeNum,
        stats,
        dataSource: useRealData ? 'real' : 'mock',
        dataSources: dataSources,
        debug: {
          totalBeforeFilter: results.length,
          platformCounts: results.reduce((acc, r) => {
            acc[r.platform] = (acc[r.platform] || 0) + 1;
            return acc;
          }, {}),
          dataSourceDebug: results._dataSourceDebug || {},
          filters: {
            keywords,
            platforms,
            countries,
            category,
          }
        },
        filters: {
          keywords: keywords ? keywords.split(',') : [],
          platforms: platforms ? platforms.split(',') : [],
          countries: countries ? countries.split(',') : [],
          category,
          subCategory,
          timeRange,
          startDate: startTime ? startTime.toISOString().split('T')[0] : null,
          endDate: endTime.toISOString().split('T')[0],
          sentiment,
        },
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/search/health
 * 健康检查
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    dataSources: {
      googleNewsRSS: 'available', // 永远可用
      youtube: youtube.isAvailable() ? 'configured' : 'not_configured',
      reddit: reddit.isAvailable() ? 'configured' : 'not_configured',
      googleCustomSearch: googleCustomSearch.isAvailable() ? 'configured' : 'not_configured',
      redditdate: redditdate.isAvailable() ? 'configured' : 'not_configured',
    },
    cache: {
      googleNewsRSS: googleNewsRSS.getCacheStats(),
      youtube: youtube.getCacheStats(),
      reddit: reddit.getCacheStats(),
      googleCustomSearch: googleCustomSearch.getCacheStats(),
      redditdate: redditdate.getCacheStats(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/search/reddit/comments
 * 获取 Reddit 帖子评论（使用 RedditDate 第三方 API）
 * 
 * 参数：
 * - post_id: Reddit 帖子 ID（必填）
 * - limit: 评论数量上限（默认20，最大50）
 * - sort: 排序方式（默认top，可选 confidence/top/new/controversial/old）
 * - max_depth: 最大深度（默认3，最大5）
 */
router.get('/reddit/comments', async (req, res) => {
  try {
    const { post_id, limit, sort, max_depth } = req.query;

    if (!post_id) {
      return res.status(400).json({
        success: false,
        error: 'post_id is required',
      });
    }

    if (!redditdate.isAvailable()) {
      return res.status(400).json({
        success: false,
        error: 'RedditDate API not configured',
      });
    }

    const comments = await redditdate.getPostComments(post_id, {
      limit: limit ? parseInt(limit) : 20,
      sort: sort || 'top',
      maxDepth: max_depth ? parseInt(max_depth) : 3,
    });

    res.json({
      success: true,
      data: {
        post_id,
        comments,
        count: comments.length,
      },
    });
  } catch (e) {
    console.error('Reddit comments API error:', e.message);
    res.status(500).json({
      success: false,
      error: e.message,
    });
  }
});

module.exports = router;
