# 部署指南

本文档介绍如何将品牌智能监测平台部署到云端，让别人也能访问。

## 🚀 推荐方案：Railway（最简单，5分钟搞定）

Railway 是一个 PaaS 平台，支持一键部署 Node.js 项目，免费额度够小流量用。

### 准备工作

1. **GitHub 账号**：用来存代码
2. **Railway 账号**：用来部署，注册地址：https://railway.app/
   - 可以用 GitHub 账号直接登录
   - 新用户有 $5 免费额度，够跑好几个月

---

### 步骤1：把代码推到 GitHub

1. 在 GitHub 上新建一个仓库（比如叫 `brand-monitor`）
2. 把本地代码推上去：

```bash
cd brand-monitor
git init
git add .
git commit -m "init: brand monitor project"
git branch -M main
git remote add origin https://github.com/你的用户名/brand-monitor.git
git push -u origin main
```

---

### 步骤2：在 Railway 上部署

1. 打开 https://railway.app/，登录后点 **"New Project"**
2. 选择 **"Deploy from GitHub repo"**
3. 授权 Railway 访问你的 GitHub 仓库
4. 选择你刚创建的 `brand-monitor` 仓库
5. 点击 **"Deploy Now"**

---

### 步骤3：配置项目（重要！）

因为我们的项目结构是 `backend/` 和 `frontend/` 分开的，需要告诉 Railway 从哪个目录启动。

1. 在 Railway 项目页面，点 **"Settings"** 标签
2. 找到 **"Root Directory"** 设置
3. 改成：`backend`
4. 点保存，Railway 会自动重新部署

---

### 步骤4：配置环境变量（可选）

如果后面接了 SerpAPI 等真实 API，需要配置环境变量：

1. 在 Railway 项目页面，点 **"Variables"** 标签
2. 添加你的 API Key：
   ```
   SERPAPI_KEY=你的key
   YOUTUBE_API_KEY=你的key
   ```
3. 保存后会自动重启

---

### 步骤5：获取访问网址

1. 部署成功后，在 Railway 项目页面点 **"Settings"**
2. 找到 **"Domain"** 部分
3. 点 **"Generate Domain"** 生成一个免费域名
4. 或者绑定你自己的域名

生成的网址大概长这样：`https://brand-monitor-production.up.railway.app`

**把这个网址发给别人，他们就能打开了！**

---

## 🎯 验证部署是否成功

部署完成后，访问你的网址：

1. 打开首页，应该能看到仪表盘
2. 访问 `/api/search/health`，应该返回：
   ```json
   {
     "success": true,
     "status": "ok",
     "timestamp": "..."
   }
   ```
3. 搜索关键词，应该能返回数据

---

## 💰 费用说明

### Railway 免费额度
- 新用户赠送 $5 信用额度
- 每月还有 $5 免费额度（需要绑定信用卡验证）
- 按实际使用量计费，小流量的话一个月几块钱

### 省钱技巧
- 流量小的话，选最小的实例规格（$5/月）
- 不用的时候可以关掉
- 免费额度用完了再考虑升级

---

## 🔄 后续更新代码

改了代码之后，推到 GitHub，Railway 会自动重新部署：

```bash
git add .
git commit -m "update: xxx"
git push
```

等1-2分钟就自动更新好了。

---

## 📌 其他部署方案

### Render（备选，也很简单）
- 官网：https://render.com/
- 免费额度：750小时/月（够一个项目一直跑）
- 部署方式和 Railway 差不多，也是连 GitHub 一键部署

### Vercel（适合纯前端）
- 官网：https://vercel.com/
- 前端完全免费
- 后端如果是 Serverless Functions 也能用，但我们这个是 Express，不太适配

### 阿里云/腾讯云（正式产品用）
- 适合用户多、流量大的时候
- 需要自己装环境、配域名、搞运维
- 比较麻烦，不推荐刚开始用

---

## ❓ 常见问题

### Q: 部署后打开是空白页？
A: 检查 Root Directory 是否设置为 `backend`，前端静态文件路径是否正确。

### Q: API 请求报错？
A: 看 Railway 的日志（Deployments 标签里），排查错误信息。

### Q: 能绑定自己的域名吗？
A: 可以，在 Settings → Domain 里添加自定义域名，然后去域名服务商加 CNAME 解析。

### Q: 数据会丢吗？
A: 现在用的是 Mock 数据，不存在丢数据的问题。后面接数据库后，Railway 也提供 PostgreSQL 数据库服务。

---

## 📞 需要帮助？

如果部署过程中遇到问题，把错误截图或日志发给我，我帮你排查。
