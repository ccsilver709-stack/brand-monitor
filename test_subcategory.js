/**
 * 测试脚本：验证PR媒体二级菜单的分类和筛选
 */

const { classifyBatch } = require('./backend/src/services/classifier');

// 模拟各种PR内容
const testData = [
  // 新闻通稿
  {
    id: '1',
    platform: 'news',
    title: 'Mammotion Announces New LUBA 2 Robot Lawn Mower with AI Navigation',
    summary: 'Mammotion today announced the launch of its new LUBA 2 robotic lawn mower.',
    url: 'https://www.prnewswire.com/news-releases/mammotion-announces-luba-2.html',
    publishTime: new Date().toISOString(),
    country: 'US',
    sentiment: 'neutral'
  },
  // 评测文章
  {
    id: '2',
    platform: 'news',
    title: 'Mammotion LUBA 2 Review: The Best Robot Mower We Tested',
    summary: 'We hands-on tested the new Mammotion LUBA 2 for 2 weeks. Here is our review.',
    url: 'https://www.tomshardware.com/reviews/mammotion-luba-2-review',
    publishTime: new Date().toISOString(),
    country: 'US',
    sentiment: 'positive'
  },
  // 科技媒体
  {
    id: '3',
    platform: 'news',
    title: 'Mammotion LUBA 2: A Smarter Way to Mow Your Lawn',
    summary: 'The latest robot mower from Mammotion brings impressive tech to your backyard.',
    url: 'https://www.theverge.com/2026/mammotion-luba-2',
    publishTime: new Date().toISOString(),
    country: 'US',
    sentiment: 'neutral'
  },
  // 行业垂直媒体
  {
    id: '4',
    platform: 'news',
    title: 'Mammotion Expands European Distribution Network',
    summary: 'The robotics company partners with leading European garden equipment retailers.',
    url: 'https://www.gardenindustrynews.com/mammotion-expansion',
    publishTime: new Date().toISOString(),
    country: 'DE',
    sentiment: 'neutral'
  },
  // Reddit帖子
  {
    id: '5',
    platform: 'reddit',
    title: 'Mammotion LUBA 2 vs Husqvarna - Which one should I buy?',
    summary: 'Trying to decide between these two robot mowers.',
    url: 'https://www.reddit.com/r/robotmowers/comments/abc123',
    publishTime: new Date().toISOString(),
    country: 'US',
    sentiment: 'neutral'
  },
  // YouTube视频
  {
    id: '6',
    platform: 'youtube',
    title: 'Mammotion LUBA 2 Full Review',
    summary: 'Complete review of the Mammotion LUBA 2 robot mower.',
    url: 'https://www.youtube.com/watch?v=abc123',
    publishTime: new Date().toISOString(),
    country: 'US',
    sentiment: 'neutral'
  },
];

console.log('=== 测试分类引擎的subCategory ===\n');

const classified = classifyBatch(testData);

classified.forEach(item => {
  console.log(`[${item.platform}] ${item.title.substring(0, 50)}...`);
  console.log(`  category: ${item.category}`);
  console.log(`  subCategory: ${item.subCategory}`);
  console.log(`  reasons: ${item.classificationReasons.join(', ')}`);
  console.log('');
});

console.log('=== 测试二级菜单筛选 ===\n');

// 测试PR媒体的四个二级菜单
const prItems = classified.filter(item => item.category === 'pr');
console.log(`PR类内容总数: ${prItems.length}\n`);

const subCategories = ['tech', 'vertical', 'review', 'press'];
const subLabels = {
  tech: '科技媒体',
  vertical: '行业垂直',
  review: '评测文章',
  press: '新闻通稿'
};

subCategories.forEach(sub => {
  const filtered = prItems.filter(item => item.subCategory === sub);
  console.log(`【${subLabels[sub]}】(${sub}): ${filtered.length}条`);
  filtered.forEach(item => {
    console.log(`  - ${item.title.substring(0, 60)}...`);
  });
  console.log('');
});

// 测试社交舆情的Reddit筛选
console.log('=== 测试社交舆情Reddit筛选 ===\n');
const socialItems = classified.filter(item => item.category === 'social');
const redditItems = socialItems.filter(item => item.subCategory === 'reddit');
console.log(`社交类内容总数: ${socialItems.length}`);
console.log(`Reddit内容数: ${redditItems.length}`);
redditItems.forEach(item => {
  console.log(`  - ${item.title.substring(0, 60)}...`);
});

console.log('\n=== 结论 ===');
console.log('如果每个二级菜单都能正确筛选出对应的内容，说明分类和筛选逻辑正常。');
