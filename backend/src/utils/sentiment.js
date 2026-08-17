/**
 * 真实 API 数据常无 sentiment 字段，用标题/摘要关键词做轻量推断
 */
const POSITIVE = [
  'best', 'great', 'love', 'amazing', 'excellent', 'good', 'awesome', 'perfect',
  'recommend', 'win', 'award', 'save', 'deal', 'launch', 'upgrade', 'improve',
  '推荐', '好评', '优秀', '满意', '获奖', '发布', '升级',
];
const NEGATIVE = [
  'bad', 'worst', 'issue', 'problem', 'fail', 'broken', 'bug', 'complaint',
  'disappoint', 'not working', 'terrible', 'avoid', 'recall', 'delay',
  '差', '故障', '投诉', '问题', '失望', '无法', '不好',
];

function inferSentiment(item) {
  const preset = item && item.sentiment;
  if (preset && preset !== 'neutral') return preset;

  const text = `${item?.title || ''} ${item?.summary || ''}`.toLowerCase();
  if (!text.trim()) return preset || 'neutral';

  let score = 0;
  POSITIVE.forEach((w) => { if (text.includes(w)) score += 1; });
  NEGATIVE.forEach((w) => { if (text.includes(w)) score -= 1; });

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function enrichResultsSentiment(items) {
  if (!items || !items.length) return items;
  return items.map((item) => ({
    ...item,
    sentiment: inferSentiment(item),
  }));
}

module.exports = { inferSentiment, enrichResultsSentiment };
