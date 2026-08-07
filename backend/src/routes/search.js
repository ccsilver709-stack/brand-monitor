const express = require('express');
const router = express.Router();
const { classifyBatch } = require('../services/classifier');
const { aggregate } = require('../services/aggregator');
const { generateMockData } = require('../utils/mockData');
const googleNewsRSS = require('../services/googleNewsRSS');
const youtube = require('../services/youtube');
const reddit = require('../services/reddit');
const googleCustomSearch = require('../services/googleCustomSearch');

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
  if (!days) return { googleNews: null, youtube: null, reddit: 'month', gcs: null };
  
  const d = parseInt(days);
  if (isNaN(d)) return { googleNews: null, youtube: null, reddit: 'month', gcs: null };

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
  const allResults = [];
  const kwList = keywords.split(',').map(k => k.trim()).filter(Boolean);
  const pList = platforms ? platforms.split(',').map(p => p.trim()).filter(Boolean) : [];
  const cList = countries ? countries.split(',').map(c => c.trim()).filter(Boolean) : ['US'];

  const country = cList[0] || 'US';
  const timeParams = getTimeParams(timeRange);

  // ===== 1. Google News RSS（PR媒体）=====
  // 不需要 API Key，永远可用
  if (pList.length === 0 || pList.includes('news')) {
    try {
      console.log('[Google News RSS] Searching...');
      const results = await googleNewsRSS.batchSearch(kwList, {
        country,
        language: 'en',
        timeRange: timeParams.googleNews,
      });
      console.log(`[Google News RSS] Got ${results.length} results`);
      allResults.push(...results);
    } catch (e) {
      console.error('[Google News RSS] Failed:', e.message);
    }
  }

  // ===== 2. YouTube Data API（红人内容）=====
  if (youtube.isAvailable() && (pList.length === 0 || pList.includes('youtube'))) {
    try {
      console.log('[YouTube API] Searching...');
      const results = await youtube.batchSearch(kwList, {
        country,
        language: 'en',
        maxResults: 20,
        order: 'relevance',
        publishedAfter: timeParams.youtubePublishedAfter,
      });
      console.log(`[YouTube API] Got ${results.length} results`);
      allResults.push(...results);
    } catch (e) {
      console.error('[YouTube API] Failed:', e.message);
    }
  }

  // ===== 3. Reddit API（社区/社媒）=====
  if (reddit.isAvailable() && (pList.length === 0 || pList.includes('reddit') || pList.includes('forum'))) {
    try {
      console.log('[Reddit API] Searching...');
      const results = await reddit.batchSearch(kwList, {
        sort: 'relevance',
        time: timeParams.reddit,
        limit: 25,
      });
      console.log(`[Reddit API] Got ${results.length} results`);
      allResults.push(...results);
    } catch (e) {
      console.error('[Reddit API] Failed:', e.message);
    }
  }

  // ===== 4. Google Custom Search（Web类 + 社交站点搜索）=====
  if (googleCustomSearch.isAvailable()) {
    const gcsOptions = {
      country,
      num: 10,
      dateRestrict: timeParams.gcs,
    };

    // 4a. 联盟营销 / 论坛 / 普通Web搜索
    const needWebSearch = pList.length === 0 || 
      pList.includes('affiliate_site') || 
      pList.includes('forum') || 
      pList.includes('web') ||
      pList.includes('blog');

    if (needWebSearch) {
      try {
        console.log('[Google Custom Search] Web search...');
        const results = await googleCustomSearch.batchSearch(kwList, {
          ...gcsOptions,
          platform: 'web',
        });
        console.log(`[Google Custom Search] Got ${results.length} web results`);
        allResults.push(...results);
      } catch (e) {
        console.error('[Google Custom Search] Web search failed:', e.message);
      }
    }

    // 4b. 社交平台站点搜索（TikTok/Instagram/Facebook/Twitter）
    const socialSitesToSearch = SOCIAL_SITES.filter(s => 
      pList.length === 0 || pList.includes(s.platform)
    );

    if (socialSitesToSearch.length > 0) {
      try {
        console.log(`[Google Custom Search] Site search: ${socialSitesToSearch.map(s => s.platform).join(', ')}`);
        const results = await googleCustomSearch.batchSearchSites(
          kwList,
          socialSitesToSearch,
          gcsOptions
        );
        console.log(`[Google Custom Search] Got ${results.length} social site results`);
        allResults.push(...results);
      } catch (e) {
        console.error('[Google Custom Search] Site search failed:', e.message);
      }
    }
  }

  // 如果没有任何结果，返回空数组（前端会显示无数据）
  if (allResults.length === 0) {
    return [];
  }

  // 自动分类
  const classified = classifyBatch(allResults);

  return classified;
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
      try {
        results = await fetchRealData(keywords, platforms, countries, timeRange);
        // 如果真实数据为空，fallback到Mock
        if (results.length === 0) {
          console.log('[Search] No real data, falling back to mock');
          results = getMockData();
        }
      } catch (e) {
        console.error('[Search] Real data failed, falling back to mock:', e.message);
        results = getMockData();
      }
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
        results = results.filter(r => pList.includes(r.platform));
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
        const publishTime = new Date(r.publishTime);
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
    },
    cache: {
      googleNewsRSS: googleNewsRSS.getCacheStats(),
      youtube: youtube.getCacheStats(),
      reddit: reddit.getCacheStats(),
      googleCustomSearch: googleCustomSearch.getCacheStats(),
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
