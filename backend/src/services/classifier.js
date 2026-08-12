/**
 * 自动分类引擎
 * 输入：内容数据（标题、摘要、URL、平台等）
 * 输出：分类结果 { category, subCategory, confidence, reasons }
 * 
 * 四大分类：
 * - pr: PR公关 / 新闻媒体
 * - affiliate: 联盟营销 / 导购
 * - influencer: 红人内容 / 视频图片创作者（YouTube/TikTok/Instagram）
 * - social: 社交舆情 / 用户讨论（Facebook/Twitter/Reddit/论坛）
 */

// ========== 规则库 ==========

// 联盟追踪域名（命中即高度疑似联盟内容）
const AFFILIATE_DOMAINS = [
  'amzn.to', 'amazon.com', 'amazon.de', 'amazon.co.uk', 'amazon.fr',
  'shareasale.com', 'shrsl.com', 'cj.com', 'clickbank.net',
  'rakuten.com', 'linksynergy.com', 'awin1.com', 'awin.com',
  'impactradius.com', 'ironsrc.com', 'flexoffers.com',
  'dealabs.com', 'dealmoon.com', 'slickdeals.net', 'dealdoktor.de',
  'dealab.de', 'mydealz.de', 'hotukdeals.com',
  'coupert.com', 'retailmenot.com', 'coupons.com',
  'groupon.com', 'livingocial.com'
];

// 联盟关键词
const AFFILIATE_KEYWORDS = [
  'coupon', 'discount code', 'promo code', 'deal', 'sale',
  'save ', 'saving', 'best price', 'cheapest', 'affordable',
  'affiliate', 'sponsored', 'partner link', 'ad ', '#ad',
  'review', 'buying guide', 'best ', 'top ', 'vs ',
  'compared', 'comparison', 'where to buy', 'get it now',
  'rabatt', 'gutschein', 'deal', 'preisvergleich',  // 德语
  'code promo', 'réduction', 'bon plan', 'promotion'  // 法语
];

// PR媒体域名（命中即高度疑似PR内容）
const PR_DOMAINS = [
  'techcrunch.com', 'theverge.com', 'wired.com', 'cnet.com',
  'zdnet.com', 'engadget.com', 'mashable.com', 'gizmodo.com',
  'forbes.com', 'businessinsider.com', 'bloomberg.com',
  'reuters.com', 'apnews.com', 'bbc.com', 'cnn.com',
  'prnewswire.com', 'businesswire.com', 'globenewswire.com',
  'prweb.com', 'marketwatch.com', 'barrons.com',
  'tomshardware.com', 'pcmag.com', 'digitaltrends.com',
  'androidauthority.com', 'macrumors.com', '9to5mac.com',
  'heise.de', 'golem.de', 'computerbase.de', 'chip.de',  // 德语科技媒体
  'lesnumeriques.com', '01net.com', 'clubic.com'  // 法语科技媒体
];

// PR关键词
const PR_KEYWORDS = [
  'press release', 'announces', 'announced', 'today announced',
  'launches', 'unveils', 'introduces', 'debuts',
  'award', 'awarded', 'recognizes', 'named best',
  'partnership', 'collaboration', 'strategic',
  'funding', 'raises', 'series a', 'series b',
  'ceo said', 'spokesperson', 'according to',
  'official statement', 'company announced',
  'presseinformation', 'pressemitteilung', 'kündigt an',  // 德语
  'communiqué de presse', 'annonce', 'lance'  // 法语
];

// 红人平台域名（视频/图片创作者平台）
const INFLUENCER_DOMAINS = [
  'youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com',
  'tiktokv.com', 'ig.me'
];

// 社交舆情平台域名（用户讨论/社区）
const SOCIAL_DOMAINS = [
  'facebook.com', 'fb.com', 'twitter.com', 'x.com',
  'reddit.com', 'redd.it', 'quora.com', 'pinterest.com',
  'discord.com', 'telegram.org', 't.me',
  'fb.watch'
];

// 社区论坛关键词
const FORUM_KEYWORDS = [
  'forum', 'community', 'discussion', 'thread', 'subreddit',
  'what do you think', 'anyone else', 'experience with',
  'question about', 'help with', 'does anyone know',
  'opinion', 'thoughts on', 'review request'
];

// ========== 主分类函数 ==========

/**
 * 对单条内容进行分类
 * @param {Object} item - 内容对象
 * @param {string} item.title - 标题
 * @param {string} item.summary - 摘要/内容
 * @param {string} item.url - 链接
 * @param {string} item.platform - 平台/渠道
 * @param {string} item.author - 作者
 * @returns {Object} 分类结果
 */
function classify(item) {
  const title = (item.title || '').toLowerCase();
  const summary = (item.summary || '').toLowerCase();
  const url = (item.url || '').toLowerCase();
  const platform = (item.platform || '').toLowerCase();
  const text = title + ' ' + summary;

  const scores = {
    pr: 0,
    affiliate: 0,
    influencer: 0,
    social: 0
  };

  const reasons = [];

  // ===== 1. 域名匹配（权重最高）=====
  const domain = extractDomain(url);
  
  if (AFFILIATE_DOMAINS.some(d => domain.includes(d) || url.includes(d))) {
    scores.affiliate += 50;
    reasons.push('联盟追踪域名');
  }

  if (PR_DOMAINS.some(d => domain.includes(d) || url.includes(d))) {
    scores.pr += 50;
    reasons.push('新闻媒体域名');
  }

  if (INFLUENCER_DOMAINS.some(d => domain.includes(d) || url.includes(d))) {
    scores.influencer += 50;
    reasons.push('红人内容平台域名');
  }

  if (SOCIAL_DOMAINS.some(d => domain.includes(d) || url.includes(d))) {
    scores.social += 40;
    reasons.push('社交/社区平台域名');
  }

  // ===== 2. 平台匹配 =====
  if (platform === 'news' || platform === 'pr') {
    scores.pr += 30;
    reasons.push('PR媒体渠道');
  }
  if (platform === 'affiliate_site' || platform === 'deal') {
    scores.affiliate += 30;
    reasons.push('联盟导购渠道');
  }
  if (['youtube', 'tiktok', 'instagram'].includes(platform)) {
    scores.influencer += 40;
    reasons.push('红人内容渠道');
  }
  if (['facebook', 'twitter', 'forum', 'reddit'].includes(platform)) {
    scores.social += 30;
    reasons.push('社交/社区渠道');
  }

  // ===== 3. 关键词匹配 =====
  let affiliateHits = 0;
  let prHits = 0;
  let forumHits = 0;

  AFFILIATE_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      affiliateHits++;
    }
  });

  PR_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      prHits++;
    }
  });

  FORUM_KEYWORDS.forEach(kw => {
    if (text.includes(kw.toLowerCase())) {
      forumHits++;
    }
  });

  scores.affiliate += affiliateHits * 8;
  scores.pr += prHits * 8;
  scores.social += forumHits * 5;

  if (affiliateHits > 0) reasons.push(`联盟关键词×${affiliateHits}`);
  if (prHits > 0) reasons.push(`PR关键词×${prHits}`);
  if (forumHits > 0) reasons.push(`论坛关键词×${forumHits}`);

  // ===== 4. 特殊规则 =====
  
  // 有明确折扣码格式（如 "Use code XXX for 20% off"）
  if (/use\s+code\s+\w+/i.test(text) || /code[:：]\s*\w+/i.test(text)) {
    scores.affiliate += 25;
    reasons.push('折扣码格式');
  }

  // 有联盟链接参数（?tag=、?aff=、?ref=等）
  if (/[?&](tag|aff|ref|sourceid|trackingid|partner)=/i.test(url)) {
    scores.affiliate += 20;
    reasons.push('联盟追踪参数');
  }

  // 新闻稿格式（开头有日期和通讯社名）
  if (/^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i.test(title)) {
    scores.pr += 15;
    reasons.push('新闻稿日期格式');
  }

  // ===== 5. 确定最终分类 =====
  const maxScore = Math.max(scores.pr, scores.affiliate, scores.influencer, scores.social);
  const totalScore = scores.pr + scores.affiliate + scores.influencer + scores.social;
  
  let category = 'social'; // 默认社媒
  if (scores.influencer === maxScore && maxScore >= 20) {
    category = 'influencer';
  } else if (scores.affiliate === maxScore && maxScore >= 20) {
    category = 'affiliate';
  } else if (scores.pr === maxScore && maxScore >= 20) {
    category = 'pr';
  }

  const confidence = totalScore > 0 ? Math.round((maxScore / totalScore) * 100) : 30;

  // ===== 6. 确定细分类型 =====
  const subCategory = determineSubCategory(item, category, domain);

  return {
    category,
    subCategory,
    confidence,
    scores,
    reasons
  };
}

// ========== 细分类型判断 ==========

function determineSubCategory(item, category, domain) {
  const platform = (item.platform || '').toLowerCase();
  const text = ((item.title || '') + ' ' + (item.summary || '')).toLowerCase();

  if (category === 'pr') {
    // 新闻通稿：包含 press release、announces、launches 等
    if (text.includes('press release') || text.includes('announce') || text.includes('launches') || text.includes('unveils') || text.includes('introduces')) return 'press';
    // 评测文章：包含 review、hands-on、tested 等
    if (text.includes('review') || text.includes('hands-on') || text.includes('tested') || text.includes('hands on')) return 'review';
    // 科技媒体：域名包含 tech、gizmodo、verge、cnet、engadget、wired 等
    if (domain.includes('tech') || domain.includes('gizmodo') || domain.includes('verge') || domain.includes('cnet') || domain.includes('engadget') || domain.includes('wired') || domain.includes('pcmag') || domain.includes('tomshardware')) return 'tech';
    // 行业垂直媒体：其他PR媒体
    return 'vertical';
  }

  if (category === 'affiliate') {
    if (domain.includes('deal') || text.includes('deal') || text.includes('saving')) return 'deal';
    if (text.includes('coupon') || text.includes('promo code') || text.includes('discount')) return 'coupon';
    if (text.includes('best ') || text.includes('top ') || text.includes('review')) return 'review';
    if (domain.includes('rebate') || domain.includes('cashback') || domain.includes('rakuten')) return 'cashback';
    if (text.includes('compare') || text.includes('vs ') || text.includes('price')) return 'price_compare';
    return 'review';
  }

  // influencer / social 按平台细分
  if (platform === 'youtube') return 'youtube';
  if (platform === 'tiktok') return 'tiktok';
  if (platform === 'instagram') return 'instagram';
  if (platform === 'facebook') return 'facebook';
  if (platform === 'twitter') return 'twitter';
  if (platform === 'reddit') return 'reddit';
  if (platform === 'forum') return 'forum';
  return platform || 'social';
}

// ========== 工具函数 ==========

function extractDomain(url) {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * 批量分类
 * @param {Array} items - 内容数组
 * @returns {Array} 带分类结果的内容数组
 */
function classifyBatch(items) {
  return items.map(item => {
    const classification = classify(item);
    return {
      ...item,
      category: classification.category,
      subCategory: classification.subCategory,
      classificationConfidence: classification.confidence,
      classificationReasons: classification.reasons
    };
  });
}

module.exports = {
  classify,
  classifyBatch,
  extractDomain
};
