const express = require('express');
const router = express.Router();
const { classifyBatch } = require('../services/classifier');
const { aggregate } = require('../services/aggregator');
const { generateMockData } = require('../utils/mockData');

// 缓存Mock数据（实际项目中应该从数据库或API获取）
let mockDataCache = null;

function getMockData() {
  if (!mockDataCache) {
    mockDataCache = classifyBatch(generateMockData());
  }
  return mockDataCache;
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
 */
router.get('/', (req, res) => {
  try {
    const {
      keywords = '',
      platforms = '',
      countries = '',
      category = '',
      subCategory = '',
      timeRange = '7',
      startDate = '',
      endDate = '',
      sentiment = '',
      page = 1,
      pageSize = 50
    } = req.query;

    let results = getMockData();

    // ===== 1. 关键词筛选 =====
    if (keywords) {
      const kwList = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
      if (kwList.length > 0) {
        results = results.filter(r => {
          const text = (r.title + ' ' + r.summary).toLowerCase();
          return kwList.some(kw => text.includes(kw));
        });
      }
    }

    // ===== 2. 平台/渠道筛选 =====
    if (platforms) {
      const pList = platforms.split(',').map(p => p.trim()).filter(Boolean);
      if (pList.length > 0) {
        results = results.filter(r => pList.includes(r.platform));
      }
    }

    // ===== 3. 国家筛选 =====
    if (countries) {
      const cList = countries.split(',').map(c => c.trim()).filter(Boolean);
      if (cList.length > 0) {
        results = results.filter(r => cList.includes(r.country));
      }
    }

    // ===== 4. 分类筛选 =====
    if (category && category !== 'all') {
      results = results.filter(r => r.category === category);
    }

    // ===== 5. 细分类型筛选 =====
    if (subCategory && subCategory !== 'all') {
      results = results.filter(r => r.subCategory === subCategory);
    }

    // ===== 6. 情感筛选 =====
    if (sentiment && sentiment !== 'all') {
      results = results.filter(r => r.sentiment === sentiment);
    }

    // ===== 7. 时间范围筛选 =====
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

    // ===== 8. 计算统计数据 =====
    const days = startTime ? Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000)) : 7;
    const stats = aggregate(results, { days });

    // ===== 9. 分页 =====
    const pageNum = parseInt(page) || 1;
    const pageSizeNum = parseInt(pageSize) || 50;
    const startIndex = (pageNum - 1) * pageSizeNum;
    const paginatedResults = results.slice(startIndex, startIndex + pageSizeNum);

    // ===== 10. 返回结果 =====
    res.json({
      success: true,
      data: {
        results: paginatedResults,
        total: results.length,
        page: pageNum,
        pageSize: pageSizeNum,
        stats,
        filters: {
          keywords: keywords ? keywords.split(',') : [],
          platforms: platforms ? platforms.split(',') : [],
          countries: countries ? countries.split(',') : [],
          category,
          subCategory,
          timeRange,
          startDate: startTime ? startTime.toISOString().split('T')[0] : null,
          endDate: endTime.toISOString().split('T')[0],
          sentiment
        }
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
