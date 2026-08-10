// 测试脚本：排查多平台数据问题
require('dotenv').config();

const { fetchRealData } = require('./backend/src/routes/search');

async function test() {
  console.log('=== Test 1: news only ===');
  const result1 = await fetchRealData('mammotion', 'news', '', '30');
  console.log('Total:', result1.length);
  const platforms1 = {};
  result1.forEach(r => {
    platforms1[r.platform] = (platforms1[r.platform] || 0) + 1;
  });
  console.log('Platforms:', platforms1);

  console.log('\n=== Test 2: reddit only ===');
  const result2 = await fetchRealData('mammotion', 'reddit', '', '30');
  console.log('Total:', result2.length);
  const platforms2 = {};
  result2.forEach(r => {
    platforms2[r.platform] = (platforms2[r.platform] || 0) + 1;
  });
  console.log('Platforms:', platforms2);

  console.log('\n=== Test 3: news + reddit ===');
  const result3 = await fetchRealData('mammotion', 'news,reddit', '', '30');
  console.log('Total:', result3.length);
  const platforms3 = {};
  result3.forEach(r => {
    platforms3[r.platform] = (platforms3[r.platform] || 0) + 1;
  });
  console.log('Platforms:', platforms3);
}

test().catch(console.error);
