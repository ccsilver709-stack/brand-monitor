# 品牌智能监测平台 · Brand Monitor

> 一站式多平台品牌关键词监测仪表盘，支持 PR / 联盟 / 社媒 自动分类，覆盖 8 大海外渠道。

## 📋 项目概述

这是一个面向出海品牌的站外声量监测工具，核心能力：

- **8 大渠道全覆盖**：新闻媒体、联盟导购、社区论坛、YouTube、TikTok、Instagram、Facebook、Twitter/X
- **自动分类引擎**：AI 规则引擎自动识别 PR 公关 / 联盟营销 / 社媒 UGC 三大内容类型
- **双层下钻导航**：4 大业务分组（PR媒体 / 联盟营销 / 红人内容 / 社交舆情）× N 个细分维度
- **实时数据仪表盘**：13+ 数据可视化模块，趋势、情感、地理、话题全维度分析
- **竞品对比模式**：双品牌同屏对比，差值一目了然
- **多格式导出**：Excel / CSV / PNG 截图一键导出

## 🏗️ 技术架构

```
┌─────────────────────────────────────────┐
│         前端仪表盘 (HTML+CSS+JS)        │
│         ECharts 5 数据可视化            │
└────────────────┬────────────────────────┘
                 │ REST API
┌────────────────▼────────────────────────┐
│         后端服务 (Node.js + Express)    │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  分类引擎    │  │  数据聚合统计   │   │
│  │ classifier  │  │   aggregator    │   │
│  └─────────────┘  └─────────────────┘   │
│  ┌─────────────┐  ┌─────────────────┐   │
│  │  搜索服务    │  │   数据采集层    │   │
│  │  search API │  │  SerpAPI/各平台  │   │
│  └─────────────┘  └─────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│           数据库 (SQLite/PostgreSQL)     │
│    内容数据 / 项目配置 / 历史趋势        │
└─────────────────────────────────────────┘
```

## 📁 项目结构

```
brand-monitor/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── index.js           # 服务入口
│   │   ├── routes/
│   │   │   └── search.js      # 搜索API路由
│   │   ├── services/
│   │   │   ├── classifier.js  # 自动分类引擎 ⭐
│   │   │   ├── aggregator.js  # 数据聚合统计
│   │   │   └── serpapi.js     # SerpAPI对接（待实现）
│   │   └── utils/
│   │       └── mockData.js    # Mock测试数据
│   ├── package.json
│   └── .env.example
├── frontend/                   # 前端仪表盘
│   └── (前端代码)
└── README.md
```

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd backend
npm install
npm start
```

服务启动后访问：http://localhost:3000

### 2. API 接口

#### 搜索接口 `GET /api/search`

**参数：**

| 参数 | 类型 | 说明 | 示例 |
|---|---|---|---|
| keywords | string | 关键词，逗号分隔 | `Mammotion,LUBA` |
| platforms | string | 平台，逗号分隔 | `youtube,tiktok,news` |
| countries | string | 国家代码，逗号分隔 | `US,DE,GB` |
| category | string | 分类：pr / affiliate / social | `pr` |
| subCategory | string | 细分类型 | `tech_media` |
| timeRange | string | 时间范围（天） | `7` / `30` / `90` |
| startDate | string | 开始日期（自定义时间） | `2026-08-01` |
| endDate | string | 结束日期 | `2026-08-06` |
| sentiment | string | 情感：positive / neutral / negative | `positive` |
| page | number | 页码 | `1` |
| pageSize | number | 每页数量 | `50` |

**示例：**

```bash
# 搜索 Mammotion 关键词，近30天数据
curl "http://localhost:3000/api/search?keywords=Mammotion&timeRange=30"

# 只看PR媒体分类，美国地区
curl "http://localhost:3000/api/search?keywords=Mammotion&category=pr&countries=US"

# 自定义时间范围
curl "http://localhost:3000/api/search?keywords=LUBA&startDate=2026-07-01&endDate=2026-08-06"
```

**返回格式：**

```json
{
  "success": true,
  "data": {
    "results": [...],        // 搜索结果列表
    "total": 39,             // 总条数
    "page": 1,
    "pageSize": 50,
    "stats": {               // 统计数据（前端仪表盘用）
      "overview": {...},     // 概览指标
      "categoryStats": {...}, // 分类统计
      "platformStats": {...}, // 平台统计
      "sentiment": {...},    // 情感分析
      "trends": [...],       // 趋势数据
      "geoDistribution": [...], // 地理分布
      "topTopics": [...],    // 热门话题
      "topContents": [...],  // 热门内容
      "healthIndex": {...},  // 品牌健康指数
      "aiInsights": [...]    // AI洞察
    },
    "filters": {...}         // 当前筛选条件
  }
}
```

#### 健康检查 `GET /api/search/health`

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-08-06T07:47:29.976Z"
}
```

## 🧠 自动分类引擎详解

### 核心原理

基于多维度规则评分体系，对每条内容进行打分，得分最高的分类即为最终结果。

### 评分维度

| 维度 | 权重 | 说明 |
|---|---|---|
| 域名匹配 | ⭐⭐⭐⭐⭐ | 联盟追踪域名、新闻媒体域名、社交平台域名 |
| 平台匹配 | ⭐⭐⭐⭐ | 内容来自哪个渠道 |
| 关键词匹配 | ⭐⭐⭐ | 联盟关键词、PR关键词、论坛关键词 |
| 特殊规则 | ⭐⭐⭐ | 折扣码格式、联盟追踪参数、新闻稿格式 |

### 分类规则示例

**联盟营销（affiliate）：**
- 命中联盟追踪域名（amzn.to、shareasale、cj.com 等）
- 包含折扣码格式（Use code XXX、promo code 等）
- URL 包含联盟追踪参数（?tag=、?aff=、?ref= 等）
- 包含 deal / coupon / discount / best price 等关键词

**PR公关（pr）：**
- 来自新闻媒体域名（techcrunch、theverge、prnewswire 等）
- 包含 press release / announces / award 等关键词
- 标题有新闻稿日期格式

**社媒内容（social）：**
- 来自社交平台（YouTube、TikTok、Instagram 等）
- 来自社区论坛（Reddit 等）
- 包含论坛讨论关键词

### 置信度

每条内容都有分类置信度分数（0-100），分数越高分类越准确。后续可基于置信度做人工审核队列。

## 📊 数据结构

### 搜索结果条目

```javascript
{
  id: "string",
  platform: "news|affiliate_site|forum|youtube|tiktok|instagram|facebook|twitter",
  category: "pr|affiliate|social",        // 自动分类结果
  subCategory: "string",                   // 细分类型
  classificationConfidence: 85,            // 分类置信度
  sentiment: "positive|neutral|negative",
  title: "string",
  summary: "string",
  author: "string",
  publishTime: "ISO date string",
  url: "string",
  views: number,
  likes: number,
  comments: number,
  shares: number,
  country: "US|DE|GB|...",
  productLine: "LUBA|YUKA|SPINO|Other",
  relevance: number  // 0-100 相关度
}
```

## 🛣️ 开发路线图

### ✅ 已完成
- [x] 后端骨架 + Express 服务
- [x] 自动分类引擎（规则引擎）
- [x] 数据聚合统计服务
- [x] Mock 数据 + 搜索 API
- [x] 前端仪表盘（演示版）

### 🚧 进行中 / 下一步
- [ ] 接 SerpAPI（Google 搜索结果）
- [ ] 接 YouTube Data API
- [ ] 接 Twitter/X API v2
- [ ] 接 Reddit API
- [ ] SQLite 数据库存储
- [ ] 定时采集任务
- [ ] 用户系统 + 项目管理

### 🔮 未来规划
- [ ] TikTok / Instagram / Facebook 第三方数据对接
- [ ] 机器学习分类器升级
- [ ] 邮件告警（负面内容、突增预警）
- [ ] 数据导出（Excel / PDF / CSV）
- [ ] 历史数据回溯
- [ ] 多用户协作
- [ ] SaaS 付费系统

## 🔌 接入真实数据 API

### SerpAPI（推荐先接这个，最快跑通）
1. 注册 https://serpapi.com/ 获取 API Key
2. 在 `.env` 中配置 `SERPAPI_KEY`
3. 实现 `services/serpapi.js` 服务
4. 在搜索路由中调用 SerpAPI，替换 Mock 数据

### YouTube Data API
1. Google Cloud Console 启用 YouTube Data API v3
2. 获取 API Key
3. 实现 `services/youtube.js`

### Twitter/X API v2
1. Twitter Developer Portal 创建项目
2. 获取 Bearer Token
3. 实现 `services/twitter.js`

### Reddit API
1. Reddit 创建应用
2. 获取 client_id 和 client_secret
3. 实现 `services/reddit.js`

## 📝 开发说明

### 分类引擎扩展
- 新增关键词：编辑 `classifier.js` 中的关键词数组
- 新增域名：编辑域名数组
- 新增规则：在 `classify()` 函数中添加评分逻辑

### 新增平台
1. 在 `aggregator.js` 的 `PLATFORM_MAP` 中添加平台元信息
2. 在 Mock 数据中添加对应平台的数据
3. 前端渠道选择器中添加对应选项

### 数据聚合扩展
- 新增统计指标：在 `aggregator.js` 中添加对应的计算函数
- 新增图表：前端 ECharts 配置 + 后端提供对应数据格式

## 🤝 贡献指南

1. 先开 Issue 讨论要做的功能
2. Fork 项目，创建功能分支
3. 提交代码
4. 发起 Pull Request

## 📄 License

MIT
