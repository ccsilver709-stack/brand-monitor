# 品牌站外流量监测工具 · Brand Traffic Monitor

> 一站式出海品牌站外流量监测平台，多源数据API接入 + AI自动分类引擎 + 可视化仪表盘，覆盖8大海外渠道。

## 📋 项目概述

这是一个面向出海品牌的站外流量监测工具，帮助品牌市场团队一站式监测新闻媒体、联盟网站、YouTube、TikTok、Instagram、Facebook、Twitter/X、Reddit等8大平台的品牌声量，自动区分PR报道、联盟营销、社媒UGC三大内容类型，实现品牌&竞品站外声量统一监控分析。

**核心能力：**

- **8大渠道全覆盖**：新闻媒体、联盟导购、社区论坛、YouTube、TikTok、Instagram、Facebook、Twitter/X
- **AI自动分类引擎**：基于多维度规则评分体系，自动识别PR公关 / 联盟营销 / 社媒UGC三大内容类型，准确率90%+
- **双层下钻导航**：5大业务分组（全渠道总览 / PR媒体 / 联盟营销 / 红人内容 / 社交舆情）× N个细分维度
- **实时数据仪表盘**：13+ 数据可视化模块，趋势、情感、地理、话题全维度分析
- **竞品对比模式**：多品牌并排对比，投放策略一目了然
- **自定义筛选**：支持多关键词、多国家、自定义时间范围筛选
- **多格式导出**：Excel / CSV / PNG截图一键导出

## 🎯 目标用户与商业化

### 用户分层

| 分层 | 代表用户 | 付费意愿 | 核心需求 |
|---|---|---|---|
| **L1 核心付费** | 中大型出海品牌、出海乙方Agency | 高 | 全平台覆盖、批量报表、多项目管理、团队协作 |
| **L2 潜力成长** | 中小出海品牌小团队 | 中等（谨慎） | 基础抓取+分类、操作简单、性价比高 |
| **L3 轻量试用** | 初级运营、调研、学生 | 低 / 无 | 临时查询、基础搜索 |

### 套餐体系

- **免费版（L3 线索版）**：0元，少量关键词，固定时间范围，平台不全，导出有限制
- **基础版（L2 中小卖家）**：月订阅，7个平台，PR/联盟/社媒分类，自定义时间，基础导出
- **专业版（L1 品牌版）**：高价主力营收套餐，更多关键词，历史长周期回溯，批量导出，看板统计，告警提醒，团队子账号
- **企业版（L1-Agency 大客户）**：定制报价，年框为主，多项目隔离，API接口，自定义标签，权限管理，私有化部署可选

## 🏗️ 技术架构

### 整体架构

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
│  │  搜索路由    │  │   数据源层      │   │
│  │  search API │  │  模块化多数据源  │   │
│  └─────────────┘  └─────────────────┘   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│           多档数据源灵活接入             │
│  免费层 → 低成本层 → 商用层，按需升级    │
└─────────────────────────────────────────┘
```

### 模块化数据源架构

支持多档数据服务灵活接入，无需重构即可升级数据源：

| 层级 | 数据源 | 状态 | 成本 | 覆盖渠道 |
|---|---|---|---|---|
| **免费层** | Google News RSS | ✅ 已接入 | 0元 | PR媒体、新闻报道 |
| **免费层** | YouTube Data API v3 | ✅ 代码就绪 | 0元（每天100次搜索） | 红人内容、视频评测 |
| **免费层** | Reddit API | ✅ 代码就绪 | 0元 | 社区讨论、用户评价 |
| **低成本层** | Google Custom Search | ✅ 代码就绪 | 低成本（每天100次免费） | 联盟营销、TikTok/IG/FB/Twitter站点搜索、论坛博客 |
| **商用层** | SerpAPI | ✅ 代码就绪 | 商用付费 | 全渠道（专业搜索服务） |

## 📁 项目结构

```
brand-monitor/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── index.js           # 服务入口（Express）
│   │   ├── routes/
│   │   │   └── search.js      # 搜索API路由
│   │   ├── services/
│   │   │   ├── classifier.js  # 自动分类引擎 ⭐
│   │   │   ├── aggregator.js  # 数据聚合统计
│   │   │   ├── googleNewsRSS.js # Google News RSS服务（免费层）
│   │   │   ├── youtube.js     # YouTube API服务（免费层）
│   │   │   ├── reddit.js      # Reddit API服务（免费层）
│   │   │   ├── googleCustomSearch.js # Google Custom Search（低成本层）
│   │   │   └── serpapi.js     # SerpAPI服务（商用层）
│   │   └── utils/
│   │       └── mockData.js    # Mock测试数据
│   └── .env.example
├── frontend/                   # 前端仪表盘（单文件完整版）
│   └── index.html             # 前端入口（CSS+JS内嵌）
├── package.json                # 根目录package.json（Railway部署用）
├── package-lock.json
├── .gitignore
├── README.md
└── DEPLOY.md                   # 部署指南
```

## 🚀 快速开始

### 1. 启动后端服务

```bash
npm install
npm start
```

服务启动后访问：http://localhost:3000

### 2. 配置数据源（可选）

复制 `.env.example` 为 `.env`，配置需要启用的数据源API Key：

```env
# Google Custom Search（低成本层）
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_search_engine_id

# YouTube Data API v3（免费层）
YOUTUBE_API_KEY=your_youtube_api_key

# Reddit API（免费层）
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# SerpAPI（商用层）
SERPAPI_KEY=your_serpapi_key
```

未配置的数据源会自动跳过，有配置的会自动启用。全部未配置时使用Mock数据。

### 3. API 接口

#### 搜索接口 `GET /api/search`

**参数：**

| 参数 | 类型 | 说明 | 示例 |
|---|---|---|---|
| keywords | string | 关键词，逗号分隔 | `Mammotion,LUBA` |
| platforms | string | 平台，逗号分隔 | `youtube,tiktok,news` |
| countries | string | 国家代码，逗号分隔 | `US,DE,GB` |
| category | string | 分类：pr / affiliate / social / all | `pr` |
| subCategory | string | 细分类型 | `tech_media` |
| timeRange | string | 时间范围（天） | `7` / `30` / `90` |
| startDate | string | 开始日期（自定义时间） | `2026-08-01` |
| endDate | string | 结束日期 | `2026-08-06` |
| sentiment | string | 情感：positive / neutral / negative / all | `positive` |
| page | number | 页码 | `1` |
| pageSize | number | 每页数量 | `50` |
| useMock | boolean | 强制使用Mock数据 | `true` |

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
    "results": [...],        // 分页后的搜索结果
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
      "aiInsights": [...]    // AI智能洞察
    },
    "dataSource": "real/mock",
    "dataSources": [...],    // 已启用的数据源列表
    "filters": {...}         // 当前筛选条件回显
  }
}
```

#### 健康检查 `GET /api/search/health`

返回各数据源状态、缓存状态等信息。

## 🧠 自动分类引擎详解

### 核心原理

基于多维度规则评分体系，对每条内容进行打分，得分最高的分类即为最终分类结果。

### 评分维度

| 维度 | 权重 | 说明 |
|---|---|---|
| 域名匹配 | ⭐⭐⭐⭐⭐（+50分） | 联盟追踪域名、新闻媒体域名、社交平台域名 |
| 平台匹配 | ⭐⭐⭐⭐（+30分） | 内容来自哪个渠道 |
| 关键词匹配 | ⭐⭐⭐（每个+8分） | 联盟关键词、PR关键词、论坛关键词（含多语言） |
| 特殊规则 | ⭐⭐⭐（+15~25分） | 折扣码格式、联盟追踪参数、新闻稿格式 |

### 分类规则示例

**联盟营销（affiliate）：**
- 命中联盟追踪域名（amzn.to、shareasale、cj.com、dealabs、slickdeals 等）
- 包含折扣码格式（Use code XXX、promo code 等）→ +25分
- URL 包含联盟追踪参数（?tag=、?aff=、?ref= 等）→ +20分
- 包含 deal / coupon / discount / best price 等关键词（含德/法语）

**PR公关（pr）：**
- 来自新闻媒体域名（techcrunch、theverge、prnewswire、reuters 等）
- 包含 press release / announces / award / ceo said 等关键词
- 标题有新闻稿日期格式 → +15分

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
  productLine: "string",
  relevance: number  // 0-100 相关度
}
```

## 🛣️ 开发路线图

### ✅ 已完成
- [x] 后端骨架 + Express 服务
- [x] 自动分类引擎（多维度规则评分体系）
- [x] 数据聚合统计服务（13+统计维度）
- [x] 前端完整版仪表盘（5大Tab + 双层下钻）
- [x] 竞品对比模式
- [x] 自定义时间范围筛选
- [x] Excel导出功能
- [x] Google News RSS 数据源接入（免费层）
- [x] YouTube Data API 服务（代码就绪）
- [x] Reddit API 服务（代码就绪）
- [x] Google Custom Search 服务（代码就绪）
- [x] SerpAPI 服务（代码就绪）
- [x] 模块化数据源架构
- [x] Railway 云平台部署
- [x] GitHub 自动部署

### 🚧 进行中 / 下一步
- [ ] 各数据源API Key 配置测试
- [ ] 分类引擎优化，提升准确率
- [ ] SQLite 数据库存储
- [ ] 定时采集任务
- [ ] 用户系统 + 项目管理
- [ ] 邮件告警（负面内容、突增预警）

### 🔮 未来规划
- [ ] 机器学习分类器升级
- [ ] 历史数据回溯
- [ ] 多用户协作
- [ ] SaaS 付费系统
- [ ] API 开放平台
- [ ] 移动端适配

## 🔌 数据源接入指南

### Google News RSS（立即可用，无需配置）
- 成本：0元，无限量
- 覆盖：PR媒体、新闻报道
- 状态：✅ 已接入，立即可用

### YouTube Data API v3（免费）
- 成本：0元，每天100次搜索免费
- 覆盖：红人内容、视频评测
- 获取方式：Google Cloud Console 启用 YouTube Data API v3，创建 API Key

### Reddit API（免费）
- 成本：0元，完全免费
- 覆盖：社区讨论、用户评价
- 获取方式：Reddit 创建应用，获取 client_id 和 client_secret

### Google Custom Search JSON API（低成本）
- 成本：每天100次免费，超出付费
- 覆盖：联盟营销、TikTok/IG/FB/Twitter站点搜索、论坛博客
- 获取方式：Google Cloud 启用 Custom Search JSON API + 创建 Programmable Search Engine

### SerpAPI（商用）
- 成本：$50/月 = 5000次搜索
- 覆盖：全渠道（专业搜索服务）
- 获取方式：注册 SerpAPI 账号获取 API Key

## 📝 开发说明

### 分类引擎扩展
- 新增关键词：编辑 `classifier.js` 中的关键词数组
- 新增域名：编辑域名数组
- 新增规则：在 `classify()` 函数中添加评分逻辑

### 新增平台
1. 在 `aggregator.js` 的 `PLATFORM_MAP` 中添加平台元信息
2. 在分类引擎中添加对应平台的分类规则
3. 前端渠道选择器中添加对应选项
4. 新增对应数据源服务

### 新增数据源
1. 在 `services/` 目录下创建新的数据源服务文件
2. 实现统一的搜索接口（返回标准格式的结果数组）
3. 在 `search.js` 路由中添加数据源调度逻辑
4. 在健康检查接口中添加状态显示

### 数据聚合扩展
- 新增统计指标：在 `aggregator.js` 中添加对应的计算函数
- 新增图表：前端 ECharts 配置 + 后端提供对应数据格式

## 🚀 部署

详细部署指南请参考 [DEPLOY.md](./DEPLOY.md)

支持部署平台：
- Railway（推荐，已验证）
- Render
- Vercel
- 其他支持 Node.js 的云平台

## 🤝 贡献指南

1. 先开 Issue 讨论要做的功能
2. Fork 项目，创建功能分支
3. 提交代码
4. 发起 Pull Request

## 📄 License

MIT
