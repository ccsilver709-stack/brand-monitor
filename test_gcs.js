// 测试 Google Custom Search API
const https = require('https');

const API_KEY = 'AIzaSyDjQB6XuGD-U7_PoS38I5PtP7i_eMaxVLE';
const CX = '219e35dfbda684bb6';

const query = 'Mammotion';

const params = new URLSearchParams({
  key: API_KEY,
  cx: CX,
  q: query,
  num: 5,
});

const options = {
  hostname: 'www.googleapis.com',
  path: `/customsearch/v1?${params.toString()}`,
  method: 'GET',
};

console.log('Testing Google Custom Search API...');
console.log(`Query: ${query}`);
console.log('---');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.error) {
        console.error('❌ API Error:', json.error.message);
        console.error('Code:', json.error.code);
      } else {
        console.log(`✅ Success! Got ${json.items?.length || 0} results`);
        console.log('---');
        if (json.items && json.items.length > 0) {
          json.items.slice(0, 3).forEach((item, i) => {
            console.log(`${i + 1}. ${item.title}`);
            console.log(`   ${item.displayLink}`);
            console.log(`   ${item.snippet?.substring(0, 100)}...`);
            console.log();
          });
        }
      }
    } catch (e) {
      console.error('❌ Parse error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();
