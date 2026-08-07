const express = require('express');
const cors = require('cors');
const path = require('path');

// 加载环境变量（从项目根目录的 .env 文件）
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const searchRouter = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== API 路由 =====
app.use('/api/search', searchRouter);

// ===== 静态文件（前端）=====
// 如果前端放在 frontend 目录，可以直接托管
const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// ===== 根路径 =====
app.get('/', (req, res) => {
  res.json({
    name: 'Brand Monitor API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      search: 'GET /api/search',
      health: 'GET /api/search/health'
    }
  });
});

// ===== 启动服务 =====
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   🚀 Brand Monitor API Server                ║
╠══════════════════════════════════════════════╣
║   端口: ${PORT}                                 ║
║   环境: ${process.env.NODE_ENV || 'development'}                            ║
║   地址: http://localhost:${PORT}              ║
╠══════════════════════════════════════════════╣
║   API 接口:                                   ║
║   GET /api/search        搜索+统计            ║
║   GET /api/search/health 健康检查             ║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
