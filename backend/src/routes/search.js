const express = require('express');
const router = express.Router();
const { classifyBatch } = require('../services/classifier');
const { aggregate } = require('../services/aggregator');
const { generateMockData } = require('../utils/mockData');
const serpapi = require('../services/serpapi');

// Mock数据缓存
let mockDataCache = null;

function getMockData() {
  if (!mockDataCache) {
    mockDataCache = classifyBatch(generateMockData());
  }
  return mockDataCache;
}

/**
 * 将时间范围天数转换为 SerpAPI 的 qdr 参数
 * 7天 → w, 30天 → m, 90天 → m3
 */
function getTimeRangeParam(days) {
  if (!days) return null;
  const d = parseInt(days);
  if (isNaN(d)) return null;
  if (d <= 1) return 'd';
  if (d <= 7) return 'w';
  if (d <= 30) return 'm';
  if (d <= 90) return 'm3';
  if (d <= 180) return 'm6';
  return 'y';
}

/**
 * 从真实API获取数据
 */
async function fetchRealData(keywords, platforms, countries, timeRange) {
  const allResults = [];
  const kwList = keywords.split(',').map(k => k.trim()).filter(Boolean);
  const pList = platforms ? platforms.split(',').map(p => p.trim()).filter(Boolean) : ['news', 'web'];
  const cList = countries ? countries.split(',').map(c => c.trim()).filter(Boolean) : ['US'];

  const timeRangeParam = getTimeRangeParam(timeRange);
  const country = cList[0]?.toLowerCase() || 'us';

  // 根据平台选择搜索类型
  const searchTasks = [];

  // 新闻搜索
  if (pList.includes('news')) {
    searchTasks.push({
      type: 'news',
      fn: serpapi.searchNews,
    });
  }

  // 网页搜索（覆盖联盟、论坛、博客等）
  if (pList.includes('affiliate_site') || pList.includes('forum') || pList.includes('web')) {
    searchTasks.push({
      type: 'web',
      fn: serpapi.searchWeb,
    });
  }

  // 视频搜索（覆盖YouTube等）
  if (pList.includes('youtube') || pList.includes('video')) {
    searchTasks.push({
      type: 'video',
      fn: serpapi.searchVideos,
    });
  }

  // 如果没有指定平台，默认搜新闻+网页
  if (searchTasks.length === 0) {
    searchTasks.push({ type: 'news', fn: serpapi.searchNews });
    searchTasks.push({ type: 'web', fn: serpapi.searchWeb });
  }

  // 执行搜索（串行，避免触发限流）
  for (const task of searchTasks) {
    try {
      const results = await serpapi.batchSearch(kwList, task.fn, {
        country,
        num: 20,
        timeRange: timeRangeParam,
      });

      // 给结果加上正确的platform标识
      results.forEach(item => {
        if (task.type === 'news') {
          item.platform = 'news';
        } else if (task.type === 'video') {
          item.platform = 'youtube';
        } else {
          // web类的交给分类引擎去判断
          item.platform = 'web';
        }
      });

      allResults.push(...results);
    } catch (e) {
      console.error(`Search task ${task.type} failed:`, e.message);
    }
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
    const useRealData = serpapi.isAvailable() && useMock !== 'true';

    if (useRealData && keywords) {
      console.log(`[SerpAPI] Searching for: ${keywords}`);
      try {
        results = await fetchRealData(keywords, platforms, countries, timeRange);
        console.log(`[SerpAPI] Got ${results.length} results`);
      } catch (e) {
        console.error('[SerpAPI] Failed, falling back to mock:', e.message);
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
    res.json({
      success: true,
      data: {
        results: paginatedResults,
        total: results.length,
        page: pageNum,
        pageSize: pageSizeNum,
        stats,
        dataSource: useRealData ? 'serpapi' : 'mock',
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
    serpapi: serpapi.isAvailable() ? 'configured' : 'not_configured',
    cache: serpapi.getCacheStats(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
