/**
 * 品牌智能监测平台 - 前端主逻辑
 * 对接后端 /api/search 接口
 */

// 全局状态
const state = {
  keywords: 'Mammotion',
  platforms: [], // 空数组 = 全部
  category: 'all',
  timeRange: '30',
  sentiment: 'all',
  results: [],
  stats: null
};

// 平台元信息
const PLATFORM_INFO = {
  news: { name: '新闻媒体', icon: '📰', color: '#8b5cf6' },
  affiliate_site: { name: '联盟导购', icon: '🛒', color: '#06b6d4' },
  forum: { name: '社区论坛', icon: '💬', color: '#f59e0b' },
  youtube: { name: 'YouTube', icon: '▶️', color: '#ff0000' },
  tiktok: { name: 'TikTok', icon: '🎵', color: '#000000' },
  instagram: { name: 'Instagram', icon: '📷', color: '#e4405f' },
  facebook: { name: 'Facebook', icon: '📘', color: '#1877f2' },
  twitter: { name: 'Twitter/X', icon: '🐦', color: '#1da1f2' }
};

const CATEGORY_INFO = {
  pr: { name: 'PR公关', color: '#8b5cf6' },
  affiliate: { name: '联盟营销', color: '#06b6d4' },
  social: { name: '社媒内容', color: '#3b82f6' }
};

// 图表实例
let charts = {};

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  bindEvents();
  executeSearch();
});

// ========== 事件绑定 ==========
function bindEvents() {
  // 搜索按钮
  document.getElementById('searchBtn').addEventListener('click', () => {
    state.keywords = document.getElementById('keywordInput').value.trim();
    executeSearch();
  });

  // 回车搜索
  document.getElementById('keywordInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      state.keywords = e.target.value.trim();
      executeSearch();
    }
  });

  // 渠道chip
  document.querySelectorAll('.platform-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const platform = chip.dataset.platform;
      
      if (platform === 'all') {
        state.platforms = [];
        document.querySelectorAll('.platform-chips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      } else {
        // 取消全选
        document.querySelector('.chip[data-platform="all"]').classList.remove('active');
        
        if (chip.classList.contains('active')) {
          chip.classList.remove('active');
          state.platforms = state.platforms.filter(p => p !== platform);
        } else {
          chip.classList.add('active');
          state.platforms.push(platform);
        }
        
        // 如果都取消了，自动选全部
        if (state.platforms.length === 0) {
          document.querySelector('.chip[data-platform="all"]').classList.add('active');
        }
      }
      
      executeSearch();
    });
  });

  // 时间范围
  document.getElementById('timeRange').addEventListener('change', (e) => {
    state.timeRange = e.target.value;
    executeSearch();
  });

  // 分类筛选
  document.getElementById('categoryFilter').addEventListener('change', (e) => {
    state.category = e.target.value;
    executeSearch();
  });

  // 表格搜索
  document.getElementById('tableSearch').addEventListener('input', (e) => {
    renderContentTable(state.results, e.target.value);
  });

  // 表格排序
  document.getElementById('tableSort').addEventListener('change', () => {
    renderContentTable(state.results);
  });
}

// ========== 执行搜索 ==========
async function executeSearch() {
  showLoading();

  try {
    const params = new URLSearchParams({
      keywords: state.keywords,
      timeRange: state.timeRange,
      category: state.category,
      sentiment: state.sentiment
    });

    if (state.platforms.length > 0) {
      params.append('platforms', state.platforms.join(','));
    }

    const response = await fetch(`/api/search?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      state.results = data.data.results;
      state.stats = data.data.stats;
      renderAll();
    } else {
      console.error('Search error:', data.error);
    }
  } catch (error) {
    console.error('Fetch error:', error);
    // 如果后端没启动，显示提示
    showBackendError();
  }
}

// ========== 渲染所有数据 ==========
function renderAll() {
  if (!state.stats) return;

  renderOverview();
  renderTrendChart();
  renderPlatformChart();
  renderSentimentChart();
  renderCategoryChart();
  renderCategoryModules();
  renderContentTable(state.results);
}

// ========== 概览指标 ==========
function renderOverview() {
  const { overview } = state.stats;
  
  animateNumber('totalMentions', overview.totalMentions);
  animateNumber('totalViews', formatNumber(overview.totalViews));
  animateNumber('totalEngagements', formatNumber(overview.totalEngagements));
  animateNumber('engagementRate', overview.engagementRate + '%');
}

function animateNumber(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  // 简单的数字动画
  const isPercent = String(targetValue).includes('%');
  const isFormatted = String(targetValue).includes('K') || String(targetValue).includes('M');
  
  if (isPercent || isFormatted) {
    el.textContent = targetValue;
    return;
  }
  
  const num = parseFloat(targetValue);
  if (isNaN(num)) {
    el.textContent = targetValue;
    return;
  }
  
  let current = 0;
  const increment = num / 30;
  const timer = setInterval(() => {
    current += increment;
    if (current >= num) {
      current = num;
      clearInterval(timer);
    }
    el.textContent = Math.round(current).toLocaleString();
  }, 20);
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// ========== 图表初始化 ==========
function initCharts() {
  charts.trend = echarts.init(document.getElementById('trendChart'));
  charts.platform = echarts.init(document.getElementById('platformChart'));
  charts.sentiment = echarts.init(document.getElementById('sentimentChart'));
  charts.category = echarts.init(document.getElementById('categoryChart'));

  // 响应式
  window.addEventListener('resize', () => {
    Object.values(charts).forEach(chart => chart.resize());
  });
}

// ========== 趋势图 ==========
function renderTrendChart() {
  const { trends } = state.stats;
  
  const dates = trends.map(t => t.date.slice(5)); // MM-DD
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' }
    },
    legend: {
      data: ['PR', '联盟', '社媒'],
      textStyle: { color: '#64748b', fontSize: 12 },
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '40px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    series: [
      {
        name: 'PR',
        type: 'line',
        smooth: true,
        data: trends.map(t => t.pr),
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.02)' }
          ])
        }
      },
      {
        name: '联盟',
        type: 'line',
        smooth: true,
        data: trends.map(t => t.affiliate),
        itemStyle: { color: '#06b6d4' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
            { offset: 1, color: 'rgba(6, 182, 212, 0.02)' }
          ])
        }
      },
      {
        name: '社媒',
        type: 'line',
        smooth: true,
        data: trends.map(t => t.social),
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
          ])
        }
      }
    ]
  };

  charts.trend.setOption(option);
}

// ========== 渠道分布饼图 ==========
function renderPlatformChart() {
  const { platformStats } = state.stats;
  
  const data = Object.entries(platformStats).map(([key, val]) => ({
    name: PLATFORM_INFO[key]?.name || key,
    value: val.count,
    itemStyle: { color: PLATFORM_INFO[key]?.color || '#94a3b8' }
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' },
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#64748b', fontSize: 11 }
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: { show: false },
        data
      }
    ]
  };

  charts.platform.setOption(option);
}

// ========== 情感分析仪表盘 ==========
function renderSentimentChart() {
  const { sentiment } = state.stats;
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' }
    },
    series: [
      {
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        pointer: { show: false },
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: {
            borderRadius: 10
          }
        },
        axisLine: {
          lineStyle: {
            width: 18,
            color: [[1, '#f1f5f9']]
          }
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [
          {
            value: parseFloat(sentiment.positive.percent),
            name: '正面',
            title: { offsetCenter: ['0%', '-20%'], fontSize: 12, color: '#64748b' },
            detail: {
              offsetCenter: ['0%', '0%'],
              fontSize: 28,
              fontWeight: 'bold',
              color: '#10b981',
              formatter: '{value}%'
            },
            itemStyle: { color: '#10b981' }
          }
        ]
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        bottom: 20,
        style: {
          text: `正面 ${sentiment.positive.count} · 中性 ${sentiment.neutral.count} · 负面 ${sentiment.negative.count}`,
          fontSize: 11,
          fill: '#94a3b8'
        }
      }
    ]
  };

  charts.sentiment.setOption(option);
}

// ========== 分类构成条形图 ==========
function renderCategoryChart() {
  const { categoryStats } = state.stats;
  
  const categories = ['pr', 'affiliate', 'social'];
  const data = categories.map(c => categoryStats[c]?.count || 0);
  const colors = ['#8b5cf6', '#06b6d4', '#3b82f6'];
  const names = ['PR公关', '联盟营销', '社媒内容'];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1e293b' }
    },
    grid: {
      left: '3%',
      right: '10%',
      bottom: '3%',
      top: '10px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#64748b', fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: data.map((val, i) => ({
          value: val,
          itemStyle: {
            color: colors[i],
            borderRadius: [0, 6, 6, 0]
          }
        })),
        barWidth: 20,
        label: {
          show: true,
          position: 'right',
          color: '#64748b',
          fontSize: 12,
          fontWeight: 600
        }
      }
    ]
  };

  charts.category.setOption(option);
}

// ========== 三大分类模块 ==========
function renderCategoryModules() {
  const { categoryStats } = state.stats;

  // PR
  const pr = categoryStats.pr;
  document.getElementById('prCount').textContent = `${pr.count} 条`;
  document.getElementById('prViews').textContent = formatNumber(pr.views);
  document.getElementById('prEngagements').textContent = formatNumber(pr.engagements);
  renderTopList('prTopList', pr.top5 || []);

  // 联盟
  const aff = categoryStats.affiliate;
  document.getElementById('affiliateCount').textContent = `${aff.count} 条`;
  document.getElementById('affiliateViews').textContent = formatNumber(aff.views);
  document.getElementById('affiliateEngagements').textContent = formatNumber(aff.engagements);
  renderTopList('affiliateTopList', aff.top5 || []);

  // 社媒
  const soc = categoryStats.social;
  document.getElementById('socialCount').textContent = `${soc.count} 条`;
  document.getElementById('socialViews').textContent = formatNumber(soc.views);
  document.getElementById('socialEngagements').textContent = formatNumber(soc.engagements);
  renderTopList('socialTopList', soc.top5 || []);
}

function renderTopList(elementId, items) {
  const container = document.getElementById(elementId);
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-tip">暂无数据</div>';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="top-item">
      <div class="top-item-title">${item.title}</div>
      <div class="top-item-meta">
        <span class="top-item-author">${item.author}</span>
        <span>👁 ${formatNumber(item.views)}</span>
        <span>💬 ${formatNumber(item.likes + item.comments)}</span>
      </div>
    </div>
  `).join('');
}

// ========== 内容表格 ==========
function renderContentTable(results, searchQuery = '') {
  const tbody = document.getElementById('contentTableBody');
  const sortBy = document.getElementById('tableSort')?.value || 'engagements';

  let filtered = [...results];
  
  // 搜索过滤
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => 
      r.title.toLowerCase().includes(q) ||
      r.author.toLowerCase().includes(q) ||
      (r.summary && r.summary.toLowerCase().includes(q))
    );
  }

  // 排序
  filtered.sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'time') return new Date(b.publishTime) - new Date(a.publishTime);
    return (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="loading">暂无数据</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.slice(0, 50).map((item, index) => {
    const platform = PLATFORM_INFO[item.platform] || { name: item.platform, icon: '📄' };
    const totalEng = item.likes + item.comments + item.shares;
    
    return `
      <tr>
        <td><span class="rank-num ${index < 3 ? 'top3' : ''}">${index + 1}</span></td>
        <td><span class="platform-badge">${platform.icon} ${platform.name}</span></td>
        <td style="max-width: 300px;">
          <div style="font-weight: 500; margin-bottom: 4px;">${item.title}</div>
          <div style="font-size: 11px; color: #94a3b8;">${item.author}</div>
        </td>
        <td><span class="category-tag ${item.category}">${CATEGORY_INFO[item.category]?.name || item.category}</span></td>
        <td><span class="country-flag">${getCountryFlag(item.country)}</span></td>
        <td><span class="sentiment-tag ${item.sentiment}">${getSentimentText(item.sentiment)}</span></td>
        <td class="num">${formatNumber(item.views)}</td>
        <td class="num">${formatNumber(totalEng)}</td>
        <td style="color: #94a3b8; font-size: 12px;">${formatTime(item.publishTime)}</td>
      </tr>
    `;
  }).join('');
}

// ========== 工具函数 ==========
function getCountryFlag(countryCode) {
  const flags = {
    US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷',
    CA: '🇨🇦', AU: '🇦🇺', JP: '🇯🇵', SE: '🇸🇪',
    NL: '🇳🇱', ES: '🇪🇸', IT: '🇮🇹', BR: '🇧🇷',
    MX: '🇲🇽', IN: '🇮🇳', KR: '🇰🇷', SG: '🇸🇬',
    CN: '🇨🇳', RU: '🇷🇺', ZA: '🇿🇦', AE: '🇦🇪'
  };
  return flags[countryCode] || '🏳️';
}

function getSentimentText(sentiment) {
  const map = { positive: '正面', neutral: '中性', negative: '负面' };
  return map[sentiment] || sentiment;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffDays > 30) return date.toLocaleDateString('zh-CN');
  if (diffDays > 0) return `${diffDays}天前`;
  if (diffHours > 0) return `${diffHours}小时前`;
  return '刚刚';
}

function showLoading() {
  document.getElementById('contentTableBody').innerHTML = 
    '<tr><td colspan="9" class="loading">⏳ 正在搜索...</td></tr>';
}

function showBackendError() {
  document.getElementById('contentTableBody').innerHTML = 
    '<tr><td colspan="9" class="loading" style="color: #ef4444;">⚠️ 无法连接后端服务，请先启动后端服务 (npm start)</td></tr>';
  
  // 指标卡显示--
  document.getElementById('totalMentions').textContent = '--';
  document.getElementById('totalViews').textContent = '--';
  document.getElementById('totalEngagements').textContent = '--';
  document.getElementById('engagementRate').textContent = '--';
}
