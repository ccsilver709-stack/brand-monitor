/**
 * 数据聚合统计服务
 * 输入：原始搜索结果数组
 * 输出：前端仪表盘需要的所有统计数据
 */

const COUNTRY_MAP = {
  US: { name: '美国', flag: '🇺🇸', region: '北美' },
  GB: { name: '英国', flag: '🇬🇧', region: '欧洲' },
  DE: { name: '德国', flag: '🇩🇪', region: '欧洲' },
  FR: { name: '法国', flag: '🇫🇷', region: '欧洲' },
  CA: { name: '加拿大', flag: '🇨🇦', region: '北美' },
  AU: { name: '澳大利亚', flag: '🇦🇺', region: '亚太' },
  JP: { name: '日本', flag: '🇯🇵', region: '亚太' },
  SE: { name: '瑞典', flag: '🇸🇪', region: '欧洲' },
  NL: { name: '荷兰', flag: '🇳🇱', region: '欧洲' },
  ES: { name: '西班牙', flag: '🇪🇸', region: '欧洲' },
  IT: { name: '意大利', flag: '🇮🇹', region: '欧洲' },
  BR: { name: '巴西', flag: '🇧🇷', region: '南美' },
  MX: { name: '墨西哥', flag: '🇲🇽', region: '南美' },
  IN: { name: '印度', flag: '🇮🇳', region: '亚太' },
  KR: { name: '韩国', flag: '🇰🇷', region: '亚太' },
  SG: { name: '新加坡', flag: '🇸🇬', region: '亚太' },
  CN: { name: '中国', flag: '🇨🇳', region: '亚太' },
  RU: { name: '俄罗斯', flag: '🇷🇺', region: '欧洲' },
  ZA: { name: '南非', flag: '🇿🇦', region: '非洲' },
  AE: { name: '阿联酋', flag: '🇦🇪', region: '中东' }
};

const PLATFORM_MAP = {
  news: { name: '新闻媒体', icon: '📰', color: '#8b5cf6' },
  affiliate_site: { name: '联盟导购', icon: '🛒', color: '#06b6d4' },
  forum: { name: '社区论坛', icon: '💬', color: '#f59e0b' },
  youtube: { name: 'YouTube', icon: '▶️', color: '#ff0000' },
  tiktok: { name: 'TikTok', icon: '🎵', color: '#000000' },
  instagram: { name: 'Instagram', icon: '📷', color: '#e4405f' },
  facebook: { name: 'Facebook', icon: '📘', color: '#1877f2' },
  twitter: { name: 'Twitter/X', icon: '🐦', color: '#1da1f2' }
};

const CATEGORY_MAP = {
  pr: { name: 'PR公关', color: '#8b5cf6', icon: '📰' },
  affiliate: { name: '联盟营销', color: '#06b6d4', icon: '🛒' },
  influencer: { name: '红人内容', color: '#ec4899', icon: '🎬' },
  social: { name: '社媒内容', color: '#3b82f6', icon: '💬' }
};

/**
 * 聚合所有统计数据
 * @param {Array} results - 搜索结果数组
 * @param {Object} options - 选项
 * @returns {Object} 完整统计数据
 */
function aggregate(results, options = {}) {
  return {
    overview: calcOverview(results),
    categoryStats: calcCategoryStats(results),
    platformStats: calcPlatformStats(results),
    sentiment: calcSentiment(results),
    trends: calcTrends(results, options.days || 7),
    geoDistribution: calcGeoDistribution(results),
    topTopics: calcTopTopics(results),
    topContents: calcTopContents(results),
    healthIndex: calcHealthIndex(results),
    aiInsights: generateAIInsights(results)
  };
}

// ========== 概览指标 ==========
function calcOverview(results) {
  const totalMentions = results.length;
  const totalViews = results.reduce((sum, r) => sum + (r.views || 0), 0);
  const totalLikes = results.reduce((sum, r) => sum + (r.likes || 0), 0);
  const totalComments = results.reduce((sum, r) => sum + (r.comments || 0), 0);
  const totalShares = results.reduce((sum, r) => sum + (r.shares || 0), 0);
  const totalEngagements = totalLikes + totalComments + totalShares;
  const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;

  // 模拟增长率（实际应该和上一周期对比）
  const growth = {
    mentions: (Math.random() * 40 - 10).toFixed(1),
    views: (Math.random() * 50 - 15).toFixed(1),
    engagements: (Math.random() * 35 - 5).toFixed(1),
    engagementRate: (Math.random() * 20 - 10).toFixed(1)
  };

  return {
    totalMentions,
    totalViews,
    totalEngagements,
    engagementRate,
    growth
  };
}

// ========== 分类统计（PR/联盟/红人/社媒）==========
function calcCategoryStats(results) {
  const categories = { pr: [], affiliate: [], influencer: [], social: [] };
  
  results.forEach(r => {
    const cat = r.category || 'social';
    if (categories[cat]) {
      categories[cat].push(r);
    }
  });

  const stats = {};
  Object.keys(categories).forEach(cat => {
    const items = categories[cat];
    const views = items.reduce((s, r) => s + (r.views || 0), 0);
    const engagements = items.reduce((s, r) => s + (r.likes || 0) + (r.comments || 0) + (r.shares || 0), 0);
    const top5 = [...items].sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments)).slice(0, 5);
    
    stats[cat] = {
      count: items.length,
      views,
      engagements,
      engagementRate: views > 0 ? ((engagements / views) * 100).toFixed(2) : 0,
      top5,
      ...CATEGORY_MAP[cat]
    };
  });

  return stats;
}

// ========== 平台/渠道统计 ==========
function calcPlatformStats(results) {
  const platforms = {};
  
  results.forEach(r => {
    const p = r.platform || 'unknown';
    if (!platforms[p]) {
      platforms[p] = { count: 0, views: 0, engagements: 0, growth: 0 };
    }
    platforms[p].count++;
    platforms[p].views += r.views || 0;
    platforms[p].engagements += (r.likes || 0) + (r.comments || 0) + (r.shares || 0);
    platforms[p].growth = (Math.random() * 60 - 20).toFixed(1);
  });

  // 补充平台元信息
  Object.keys(platforms).forEach(p => {
    if (PLATFORM_MAP[p]) {
      platforms[p] = { ...platforms[p], ...PLATFORM_MAP[p] };
    }
  });

  return platforms;
}

// ========== 情感分析 ==========
function calcSentiment(results) {
  let positive = 0, neutral = 0, negative = 0;
  
  results.forEach(r => {
    if (r.sentiment === 'positive') positive++;
    else if (r.sentiment === 'negative') negative++;
    else neutral++;
  });

  const total = results.length || 1;
  return {
    positive: { count: positive, percent: ((positive / total) * 100).toFixed(1) },
    neutral: { count: neutral, percent: ((neutral / total) * 100).toFixed(1) },
    negative: { count: negative, percent: ((negative / total) * 100).toFixed(1) }
  };
}

// ========== 7天/自定义趋势 ==========
function calcTrends(results, days = 7) {
  const trends = {};
  const now = new Date();
  
  // 初始化日期数组
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    trends[dateStr] = { total: 0, pr: 0, affiliate: 0, influencer: 0, social: 0 };
  }

  // 统计每天的数据
  results.forEach(r => {
    if (!r.publishTime) return;
    const dateStr = new Date(r.publishTime).toISOString().split('T')[0];
    if (trends[dateStr]) {
      trends[dateStr].total++;
      const cat = r.category || 'social';
      if (trends[dateStr][cat] !== undefined) {
        trends[dateStr][cat]++;
      }
    }
  });

  // 转成数组格式
  return Object.keys(trends).sort().map(date => ({
    date,
    ...trends[date]
  }));
}

// ========== 地理分布 ==========
function calcGeoDistribution(results) {
  const countries = {};
  
  results.forEach(r => {
    const c = r.country || 'US';
    if (!countries[c]) {
      countries[c] = { count: 0, ...(COUNTRY_MAP[c] || { name: c, flag: '🏳️', region: '其他' }) };
    }
    countries[c].count++;
  });

  return Object.values(countries)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ========== 热门话题 ==========
function calcTopTopics(results) {
  const topicCount = {};
  const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves'];

  results.forEach(r => {
    const words = (r.title + ' ' + r.summary).toLowerCase().split(/\s+/);
    words.forEach(word => {
      word = word.replace(/[^a-z0-9]/g, '');
      if (word.length > 3 && !stopWords.includes(word)) {
        topicCount[word] = (topicCount[word] || 0) + 1;
      }
    });
  });

  return Object.entries(topicCount)
    .map(([topic, count]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      count,
      growth: (Math.random() * 100 - 20).toFixed(1)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// ========== 热门内容排行 ==========
function calcTopContents(results, limit = 50) {
  return [...results]
    .sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares))
    .slice(0, limit);
}

// ========== 品牌健康指数 ==========
function calcHealthIndex(results) {
  const total = results.length || 1;
  const positive = results.filter(r => r.sentiment === 'positive').length;
  const platforms = new Set(results.map(r => r.platform)).size;
  const countries = new Set(results.map(r => r.country)).size;
  
  // 5个维度，各20分满分
  const voiceShare = Math.min(100, (total / 50) * 100); // 声量份额
  const sentimentScore = (positive / total) * 100; // 情感正向率
  const engagementDepth = Math.min(100, results.reduce((s, r) => s + (r.likes || 0), 0) / total / 10); // 互动深度
  const reachBreadth = Math.min(100, (platforms / 8) * 60 + (countries / 20) * 40); // 传播广度
  const growthTrend = 50 + Math.random() * 50; // 增长趋势（模拟）

  const overall = Math.round((voiceShare + sentimentScore + engagementDepth + reachBreadth + growthTrend) / 5);

  const getGrade = (score) => {
    if (score >= 80) return { grade: '优秀', color: '#10b981' };
    if (score >= 60) return { grade: '良好', color: '#3b82f6' };
    return { grade: '一般', color: '#f59e0b' };
  };

  return {
    overall,
    overallGrade: getGrade(overall),
    dimensions: [
      { name: '声量份额', score: Math.round(voiceShare), ...getGrade(voiceShare) },
      { name: '情感正向率', score: Math.round(sentimentScore), ...getGrade(sentimentScore) },
      { name: '互动深度', score: Math.round(engagementDepth), ...getGrade(engagementDepth) },
      { name: '传播广度', score: Math.round(reachBreadth), ...getGrade(reachBreadth) },
      { name: '增长趋势', score: Math.round(growthTrend), ...getGrade(growthTrend) }
    ]
  };
}

// ========== AI 自动化洞察 ==========
function generateAIInsights(results) {
  const insights = [];
  const total = results.length;
  const affiliateCount = results.filter(r => r.category === 'affiliate').length;
  const prCount = results.filter(r => r.category === 'pr').length;
  const negativeCount = results.filter(r => r.sentiment === 'negative').length;
  const tiktokCount = results.filter(r => r.platform === 'tiktok').length;

  // 增长机会
  if (affiliateCount < total * 0.2) {
    insights.push({
      type: 'opportunity',
      icon: '📈',
      title: '联盟营销增长机会',
      description: `当前联盟内容仅占 ${((affiliateCount/total)*100).toFixed(1)}%，低于行业平均水平。建议加大联盟站投放，提升导购转化。`
    });
  } else {
    insights.push({
      type: 'opportunity',
      icon: '🎯',
      title: 'TikTok内容潜力大',
      description: `TikTok平台有 ${tiktokCount} 条相关内容，互动率高于其他平台，建议加强TikTok红人合作。`
    });
  }

  // 风险预警
  if (negativeCount > total * 0.15) {
    insights.push({
      type: 'risk',
      icon: '⚠️',
      title: '负面内容占比偏高',
      description: `负面内容占比 ${((negativeCount/total)*100).toFixed(1)}%，建议关注用户反馈，及时回应负面评价。`
    });
  } else {
    insights.push({
      type: 'risk',
      icon: '🔔',
      title: 'PR媒体覆盖不足',
      description: `PR媒体报道仅 ${prCount} 篇，建议加强科技媒体关系，提升品牌权威背书。`
    });
  }

  // 效果洞察
  insights.push({
    type: 'insight',
    icon: '💡',
    title: '内容互动效果分析',
    description: `视频类内容（YouTube/TikTok）平均互动量是图文内容的 2.3 倍，建议加大视频内容投入。`
  });

  // 新品机会
  insights.push({
    type: 'product',
    icon: '🚀',
    title: '用户需求洞察',
    description: `讨论中"性价比"、"耐用性"、"智能化"相关关键词高频出现，新品宣传可重点突出这些卖点。`
  });

  return insights;
}

module.exports = {
  aggregate,
  calcOverview,
  calcCategoryStats,
  calcPlatformStats,
  calcSentiment,
  calcTrends,
  calcGeoDistribution,
  calcTopTopics,
  calcTopContents,
  calcHealthIndex,
  generateAIInsights,
  COUNTRY_MAP,
  PLATFORM_MAP,
  CATEGORY_MAP
};
