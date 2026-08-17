/**
 * 大模型归类服务（客户需求：地区 + PR/联盟/红人/社区舆情）
 * 兼容 OpenAI Chat Completions 接口；Key/费用由客户自备。
 * 未配置或调用失败时返回 null，由调用方回退规则引擎。
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const VALID_CATEGORIES = ['pr', 'affiliate', 'influencer', 'social'];
const CATEGORY_LABELS = {
  pr: 'PR公关',
  affiliate: '联盟营销',
  influencer: '红人内容',
  social: '社区舆情',
};

function isAvailable() {
  return !!(process.env.LLM_API_KEY && process.env.LLM_API_KEY !== 'your_llm_api_key_here');
}

function getConfig() {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
    timeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || '30000', 10),
  };
}

function httpRequestJson(urlString, options, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const transport = url.protocol === 'https:' ? https : http;
    const req = transport.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'POST',
        headers: options.headers || {},
        timeout: options.timeout || 30000,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data || '{}');
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json);
            } else {
              reject(new Error(`LLM HTTP ${res.statusCode}: ${json.error?.message || data.slice(0, 200)}`));
            }
          } catch (e) {
            reject(new Error(`LLM parse error: ${e.message}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('LLM request timeout'));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function chatCompletion(messages) {
  const cfg = getConfig();
  if (!cfg.apiKey) throw new Error('LLM_API_KEY not configured');

  const body = JSON.stringify({
    model: cfg.model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages,
  });

  const json = await httpRequestJson(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    timeout: cfg.timeoutMs,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM empty response');
  return JSON.parse(content);
}

function buildBatchPrompt(items) {
  const payload = items.map((item, idx) => ({
    i: idx,
    title: (item.title || '').slice(0, 200),
    summary: (item.summary || '').slice(0, 300),
    url: (item.url || '').slice(0, 200),
    platform: item.platform || '',
    countryHint: item.country || '',
  }));

  return `你是品牌站外内容归类助手。对每条内容判断：
1) category：只能是 pr / affiliate / influencer / social 之一
   - pr：PR公关、新闻媒体报道
   - affiliate：联盟营销、导购折扣
   - influencer：红人内容（YouTube/TikTok/Instagram 等创作者内容）
   - social：社区舆情（Reddit/论坛/Facebook/Twitter 等讨论舆情）
2) country：ISO 国家代码（如 US/DE/GB/FR/JP），根据语言、域名、内容推断；不确定用 US

只返回 JSON：{"items":[{"i":0,"category":"pr","country":"US"}, ...]}

待分类数据：
${JSON.stringify(payload)}`;
}

function normalizeCategory(cat) {
  const c = String(cat || '').toLowerCase().trim();
  if (VALID_CATEGORIES.includes(c)) return c;
  if (c.includes('pr') || c.includes('新闻') || c.includes('公关')) return 'pr';
  if (c.includes('affil') || c.includes('联盟') || c.includes('导购')) return 'affiliate';
  if (c.includes('influ') || c.includes('红人') || c.includes('kol')) return 'influencer';
  if (c.includes('social') || c.includes('community') || c.includes('社区') || c.includes('舆情') || c.includes('论坛')) return 'social';
  return null;
}

function normalizeCountry(code) {
  const c = String(code || '').toUpperCase().trim();
  if (/^[A-Z]{2}$/.test(c)) return c;
  return null;
}

/**
 * 批量大模型归类（类别 + 地区）
 * @returns {Array|null} 与 items 等长的 {category, country}；失败返回 null
 */
async function classifyBatchWithLLM(items) {
  if (!isAvailable() || !items || items.length === 0) return null;

  const batchSize = Math.min(parseInt(process.env.LLM_BATCH_SIZE || '8', 10), 20);
  // 总预算：避免刷新/搜索被多批豆包请求卡死（剩余条回退规则）
  const totalBudgetMs = parseInt(process.env.LLM_TOTAL_TIMEOUT_MS || '25000', 10);
  const startedAt = Date.now();
  const results = new Array(items.length).fill(null);

  for (let start = 0; start < items.length; start += batchSize) {
    if (Date.now() - startedAt >= totalBudgetMs) {
      console.warn(`[LLM] total budget ${totalBudgetMs}ms reached, remaining use rules`);
      break;
    }
    const slice = items.slice(start, start + batchSize);
    try {
      const parsed = await chatCompletion([
        { role: 'system', content: '你只输出合法 JSON，不要解释。' },
        { role: 'user', content: buildBatchPrompt(slice) },
      ]);
      const list = Array.isArray(parsed.items) ? parsed.items : [];
      list.forEach((row) => {
        const localIdx = typeof row.i === 'number' ? row.i : -1;
        if (localIdx < 0 || localIdx >= slice.length) return;
        const category = normalizeCategory(row.category);
        const country = normalizeCountry(row.country);
        if (category) {
          results[start + localIdx] = { category, country, source: 'llm' };
        }
      });
    } catch (e) {
      console.error(`[LLM] batch ${start}-${start + slice.length} failed:`, e.message);
      // 本批失败：保持 null，外层回退规则
    }
  }

  return results;
}

module.exports = {
  isAvailable,
  classifyBatchWithLLM,
  VALID_CATEGORIES,
  CATEGORY_LABELS,
};
