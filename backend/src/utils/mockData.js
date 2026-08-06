/**
 * Mock 测试数据
 * 覆盖8大渠道、3大分类、20+国家
 * 用于开发测试和演示
 */

const generateMockData = () => {
  const now = new Date();
  const data = [];
  let id = 1;

  // ========== PR媒体类（新闻媒体渠道）==========
  
  // 科技媒体评测
  data.push({
    id: `mock-${id++}`,
    platform: 'news',
    title: 'Mammotion LUBA 2 Review: The Best Robot Lawn Mower of 2026?',
    summary: 'We tested the Mammotion LUBA 2 for over 3 months. Here is our complete review of its cutting performance, navigation accuracy, battery life, and smart features. Is it worth the premium price tag?',
    author: 'TechReview Team',
    url: 'https://www.techradar.com/reviews/mammotion-luba-2-review',
    publishTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 45200,
    likes: 1200,
    comments: 186,
    shares: 340,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 95
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'news',
    title: 'Mammotion Announces New YUKA Robot Lawn Mower with AI Vision',
    summary: 'Mammotion today announced the launch of YUKA, its latest robot lawn mower featuring AI-powered computer vision, advanced obstacle avoidance, and a new cutting system. The product will be available in Q4 2026.',
    author: 'Sarah Chen',
    url: 'https://www.prnewswire.com/news-releases/mammotion-announces-yuka-301894567.html',
    publishTime: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    views: 28900,
    likes: 560,
    comments: 42,
    shares: 890,
    country: 'US',
    productLine: 'YUKA',
    sentiment: 'positive',
    relevance: 98
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'news',
    title: 'Mammotion LUBA AWD im Test: Der beste Mähroboter für große Gärten?',
    summary: 'Wir haben den Mammotion LUBA AWD ausführlich getestet. Wie schneidet er bei der Navigation, der Schnittleistung und der App-Steuerung ab? Unser ausführlicher Testbericht.',
    author: 'Max Mustermann',
    url: 'https://www.chip.de/test/mammotion-luba-awd-test_184956.html',
    publishTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 32100,
    likes: 890,
    comments: 124,
    shares: 210,
    country: 'DE',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 92
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'news',
    title: 'CES 2026: Mammotion Wins Best Innovation Award for SPINO',
    summary: 'Mammotion took home the Best of Innovation Award at CES 2026 for its SPINO robot, which combines lawn mowing with leaf blowing and snow plowing capabilities.',
    author: 'James Wilson',
    url: 'https://www.engadget.com/ces-2026-mammotion-spino-award-12345.html',
    publishTime: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    views: 67800,
    likes: 2100,
    comments: 312,
    shares: 1500,
    country: 'US',
    productLine: 'SPINO',
    sentiment: 'positive',
    relevance: 90
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'news',
    title: 'Test du Mammotion LUBA 2 : le robot tondeuse qui change la donne',
    summary: 'Le Mammotion LUBA 2 est-il le meilleur robot tondeuse du marché ? Nous avons testé ce modèle pendant 2 mois. Voici nos impressions sur sa navigation, sa coupe et son application.',
    author: 'Pierre Dubois',
    url: 'https://www.lesnumeriques.com/robot-tondeuse/mammotion-luba-2-test.html',
    publishTime: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    views: 19800,
    likes: 450,
    comments: 78,
    shares: 120,
    country: 'FR',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 88
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'news',
    title: 'Mammotion Raises $50M Series B to Expand Global Robot Lawn Mower Market',
    summary: 'Mammotion, the Shenzhen-based robotics company, has raised $50 million in Series B funding to accelerate international expansion and R&D of its AI-powered outdoor robots.',
    author: 'Reuters Staff',
    url: 'https://www.reuters.com/technology/mammotion-raises-50m-series-b-2026-08-01/',
    publishTime: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    views: 89200,
    likes: 1800,
    comments: 95,
    shares: 2300,
    country: 'US',
    productLine: 'Other',
    sentiment: 'positive',
    relevance: 85
  });

  // ========== 联盟营销类（联盟导购渠道）==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'affiliate_site',
    title: 'Best Robot Lawn Mowers 2026: Top 10 Picks for Every Budget',
    summary: 'Looking for the best robot lawn mower? We tested 15 models and ranked the top 10. From budget options to premium models like the Mammotion LUBA 2, find the perfect one for your yard. Use our exclusive discount code for 15% off.',
    author: 'Garden Tools Guide',
    url: 'https://www.gardentoolsguide.com/best-robot-lawn-mowers/?tag=mammotion-aff',
    publishTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    views: 56700,
    likes: 340,
    comments: 67,
    shares: 180,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 87
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'affiliate_site',
    title: 'Mammotion LUBA 2 Deal: Save $300 with Coupon Code LUBA2026',
    summary: 'Hurry! Get the Mammotion LUBA 2 Robot Lawn Mower for $300 off with our exclusive coupon code. This deal ends soon. Click here to claim your discount and buy now on Amazon.',
    author: 'Deal Hunter',
    url: 'https://slickdeals.net/f/1894567-mammotion-luba-2-300-off-coupon',
    publishTime: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    views: 23400,
    likes: 890,
    comments: 234,
    shares: 560,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 93
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'affiliate_site',
    title: 'Die besten Mähroboter 2026: Vergleich und Empfehlungen',
    summary: 'Wir haben 20 Mähroboter verglichen. Die besten Modelle für jeden Garten und jedes Budget. Mit exklusivem Rabattcode für Mammotion LUBA 2. Jetzt sparen!',
    author: 'Garten Ratgeber',
    url: 'https://www.garten-ratgeber.de/beste-maehroboter/?ref=mammotion',
    publishTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 18900,
    likes: 210,
    comments: 45,
    shares: 90,
    country: 'DE',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 85
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'affiliate_site',
    title: 'Mammotion LUBA 2 vs Husqvarna Automower: Which Should You Buy?',
    summary: 'Comparing the Mammotion LUBA 2 and Husqvarna Automower? We break down the differences in performance, features, price, and value. See which one comes out on top and get the best deal.',
    author: 'Robot Mower Lab',
    url: 'https://www.robotmowerlab.com/luba-2-vs-husqvarna/?aff=12345',
    publishTime: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    views: 34500,
    likes: 560,
    comments: 128,
    shares: 230,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'neutral',
    relevance: 91
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'affiliate_site',
    title: 'Mammotion Gutschein: 20% Rabatt auf alle Modelle im August 2026',
    summary: 'Sichern Sie sich jetzt 20% Rabatt auf alle Mammotion Mähroboter mit unserem exklusiven Gutscheincode. Nur diesen August. Jetzt zugreifen und sparen!',
    author: 'Gutschein Profi',
    url: 'https://www.gutschein-profi.de/mammotion-gutschein/',
    publishTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 12300,
    likes: 180,
    comments: 32,
    shares: 75,
    country: 'DE',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 89
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'affiliate_site',
    title: 'Meilleur robot tondeuse 2026 : comparatif et bons plans',
    summary: 'Découvrez notre comparatif des meilleurs robots tondeuses de 2026. Tests, avis et codes promo exclusifs. Économisez sur votre achat Mammotion LUBA 2.',
    author: 'Jardin Expert',
    url: 'https://www.jardin-expert.fr/meilleur-robot-tondeuse/?partner=mammotion',
    publishTime: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    views: 15600,
    likes: 290,
    comments: 56,
    shares: 110,
    country: 'FR',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 86
  });

  // ========== 社区论坛类 ==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'forum',
    title: 'Mammotion LUBA 2 owners thread - share your experience',
    summary: 'Got a LUBA 2? Share your experience here. How is the navigation? Any issues with the boundary wire setup? What about battery life on large yards?',
    author: 'LawnEnthusiast42',
    url: 'https://www.reddit.com/r/robotlawnmowers/comments/mammotion_luba_2_owners/',
    publishTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    views: 8900,
    likes: 156,
    comments: 342,
    shares: 28,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'neutral',
    relevance: 82
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'forum',
    title: 'LUBA 2 keeps getting stuck on slope - anyone else?',
    summary: 'My LUBA 2 keeps getting stuck on the 25-degree slope in my backyard. The wheels spin and it errors out. I thought the AWD was supposed to handle slopes up to 45%. Any solutions?',
    author: 'FrustratedGardener',
    url: 'https://www.reddit.com/r/Mammotion/comments/luba_2_slope_issue/',
    publishTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 4500,
    likes: 45,
    comments: 89,
    shares: 12,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'negative',
    relevance: 78
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'forum',
    title: 'Erfahrungen mit Mammotion LUBA AWD nach 6 Monaten',
    summary: 'Hallo zusammen, nach 6 Monaten mit dem LUBA AWD wollte ich mal meine Erfahrungen teilen. Positiv: Navigation, App, Schnittleistung. Negativ: Regensensor, Kundenservice.',
    author: 'GartenFreund',
    url: 'https://www.reddit.com/r/maehroboter/comments/luba_awd_erfahrungen/',
    publishTime: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    views: 6700,
    likes: 89,
    comments: 156,
    shares: 18,
    country: 'DE',
    productLine: 'LUBA',
    sentiment: 'neutral',
    relevance: 80
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'forum',
    title: 'Just got my YUKA - first impressions',
    summary: 'My YUKA arrived yesterday. Set up was surprisingly easy - no boundary wire needed. The AI vision is pretty impressive. It avoided my garden hose and flower beds no problem. More updates to come.',
    author: 'TechEarlyAdopter',
    url: 'https://www.reddit.com/r/Mammotion/comments/yuka_first_impressions/',
    publishTime: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    views: 3200,
    likes: 234,
    comments: 67,
    shares: 45,
    country: 'US',
    productLine: 'YUKA',
    sentiment: 'positive',
    relevance: 90
  });

  // ========== YouTube ==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'youtube',
    title: 'Mammotion LUBA 2 Review - 6 Months Later!',
    summary: 'I have been using the Mammotion LUBA 2 for 6 months now. In this video I share my long-term review including pros, cons, and whether I still recommend it. Is it worth the money?',
    author: 'Ryan\'s Lawn Reviews',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    publishTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 125000,
    likes: 4500,
    comments: 678,
    shares: 890,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 94
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'youtube',
    title: 'LUBA 2 vs Husqvarna vs Worx - Best Robot Lawn Mower 2026?',
    summary: 'I tested the top 3 robot lawn mowers side by side: Mammotion LUBA 2, Husqvarna Automower 430X, and Worx Landroid. Which one is the best value? Watch to find out!',
    author: 'Tools & Tech',
    url: 'https://www.youtube.com/watch?v=abc123def456',
    publishTime: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    views: 234000,
    likes: 8900,
    comments: 1234,
    shares: 2100,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'neutral',
    relevance: 91
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'youtube',
    title: 'Mammotion LUBA AWD Test auf 30% Steigung - Unglaublich!',
    summary: 'Wir haben den Mammotion LUBA AWD auf einer 30% Steigung getestet. Das Ergebnis hat uns wirklich überrascht. Hier das komplette Testvideo mit allen Details.',
    author: 'Garten Technik DE',
    url: 'https://www.youtube.com/watch?v=xyz789',
    publishTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 67000,
    likes: 2300,
    comments: 345,
    shares: 560,
    country: 'DE',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 88
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'youtube',
    title: 'NEW Mammotion YUKA - AI Vision Robot Mower First Look',
    summary: 'First look at the brand new Mammotion YUKA with AI computer vision! No boundary wire needed. I got an early unit and show you everything. This changes everything.',
    author: 'Smart Home Tech',
    url: 'https://www.youtube.com/watch?v=yuka2026',
    publishTime: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    views: 189000,
    likes: 12000,
    comments: 1890,
    shares: 3400,
    country: 'US',
    productLine: 'YUKA',
    sentiment: 'positive',
    relevance: 96
  });

  // ========== TikTok ==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'tiktok',
    title: 'This robot mower changed my life 😱 #lawncare #mammotion',
    summary: 'POV: you never have to mow your lawn again. The Mammotion LUBA 2 does it all while you relax. Link in bio for 15% off! #robotmower #smarthome',
    author: '@homeinspo',
    url: 'https://www.tiktok.com/@homeinspo/video/7234567890',
    publishTime: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    views: 456000,
    likes: 45000,
    comments: 890,
    shares: 12000,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 75
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'tiktok',
    title: 'Robot mower fail compilation 😂 #mammotion #fails',
    summary: 'When your robot mower tries to eat a garden hose. Mammotion LUBA 2 vs my garden. It won. #funny #lawncarefail',
    author: '@lawnfails',
    url: 'https://www.tiktok.com/@lawnfails/video/7234567891',
    publishTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 890000,
    likes: 120000,
    comments: 3400,
    shares: 45000,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'negative',
    relevance: 70
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'tiktok',
    title: 'Mammotion YUKA unboxing 📦 AI vision is INSANE',
    summary: 'Just got the new Mammotion YUKA. The AI vision is next level. No boundary wire! This is the future of lawn care. #yuka #mammotion #ai',
    author: '@techunboxed',
    url: 'https://www.tiktok.com/@techunboxed/video/7234567892',
    publishTime: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    views: 234000,
    likes: 34000,
    comments: 567,
    shares: 8900,
    country: 'US',
    productLine: 'YUKA',
    sentiment: 'positive',
    relevance: 85
  });

  // ========== Instagram ==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'instagram',
    title: 'My backyard transformation with Mammotion LUBA 2 ✨',
    summary: '3 months ago my lawn was a mess. Now it looks perfect thanks to my Mammotion LUBA 2 robot mower. Best purchase ever! Link in bio for discount code. #lawncare #mammotion #robotmower #perfectlawn',
    author: '@perfectlawn_dreams',
    url: 'https://www.instagram.com/p/C_mammotion_luba/',
    publishTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 45000,
    likes: 8900,
    comments: 234,
    shares: 560,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 80
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'instagram',
    title: 'New toy for the garden 🤖 #mammotion #spino',
    summary: 'Just got the Mammotion SPINO. It mows, blows leaves, and even plows snow! Is there anything it cant do? #smartgarden #robotics #outdoortech',
    author: '@garden_tech_guy',
    url: 'https://www.instagram.com/p/C_mammotion_spino/',
    publishTime: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    views: 28000,
    likes: 5600,
    comments: 145,
    shares: 320,
    country: 'GB',
    productLine: 'SPINO',
    sentiment: 'positive',
    relevance: 78
  });

  // ========== Facebook ==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'facebook',
    title: 'Mammotion LUBA 2 Owners Group',
    summary: 'Welcome to the official Mammotion LUBA 2 owners group. Share tips, ask questions, and connect with other LUBA owners. Please read the rules before posting.',
    author: 'Group Admin',
    url: 'https://www.facebook.com/groups/mammotion.luba.owners',
    publishTime: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    views: 15000,
    likes: 2300,
    comments: 456,
    shares: 180,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'neutral',
    relevance: 72
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'facebook',
    title: 'Mammotion Summer Sale - 25% off all models!',
    summary: '🚨 Summer Sale Alert! Get 25% off all Mammotion robot lawn mowers this week only. Use code SUMMER25 at checkout. Limited stock available. Shop now →',
    author: 'Mammotion Official',
    url: 'https://www.facebook.com/mammotion/posts/summer-sale-2026',
    publishTime: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    views: 89000,
    likes: 5600,
    comments: 890,
    shares: 3400,
    country: 'US',
    productLine: 'LUBA',
    sentiment: 'positive',
    relevance: 95
  });

  // ========== Twitter/X ==========
  
  data.push({
    id: `mock-${id++}`,
    platform: 'twitter',
    title: 'Just got the Mammotion YUKA. AI vision is no joke. It avoided my dog. 10/10.',
    summary: 'Just got the Mammotion YUKA. AI vision is no joke. It avoided my dog. 10/10. @MammotionTech',
    author: '@smarthome_ryan',
    url: 'https://twitter.com/smarthome_ryan/status/1234567890',
    publishTime: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
    views: 23000,
    likes: 567,
    comments: 89,
    shares: 123,
    country: 'US',
    productLine: 'YUKA',
    sentiment: 'positive',
    relevance: 82
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'twitter',
    title: 'Mammotion customer service is terrible. Been waiting 3 weeks for a replacement part. Would not recommend.',
    summary: 'Mammotion customer service is terrible. Been waiting 3 weeks for a replacement part. Would not recommend. #mammotion #customerservicefail',
    author: '@frustrated_user',
    url: 'https://twitter.com/frustrated_user/status/1234567891',
    publishTime: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    views: 45000,
    likes: 234,
    comments: 156,
    shares: 78,
    country: 'GB',
    productLine: 'LUBA',
    sentiment: 'negative',
    relevance: 76
  });

  data.push({
    id: `mock-${id++}`,
    platform: 'twitter',
    title: 'Mammotion announces SPINO - the 3-in-1 outdoor robot. Mow, blow leaves, plow snow. Wild.',
    summary: 'Mammotion announces SPINO - the 3-in-1 outdoor robot. Mow, blow leaves, plow snow. Wild. $2999, shipping Q4. #ces2026 #robotics',
    author: '@techreporter',
    url: 'https://twitter.com/techreporter/status/1234567892',
    publishTime: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
    views: 125000,
    likes: 3400,
    comments: 567,
    shares: 2100,
    country: 'US',
    productLine: 'SPINO',
    sentiment: 'positive',
    relevance: 88
  });

  // ========== 更多数据填充 ==========
  // 再补充一些，让总数到40+
  
  const additionalData = [
    // 更多PR
    { platform: 'news', title: 'Mammotion expands to UK market with LUBA 2 launch', summary: 'Mammotion officially launches in the UK with its flagship LUBA 2 robot lawn mower, partnering with major retailers.', author: 'UK Tech News', url: 'https://www.uktechnews.com/mammotion-uk-launch', country: 'GB', productLine: 'LUBA', sentiment: 'positive' },
    { platform: 'news', title: 'Mammotion LUBA 2 - Test: Der smarte Mähroboter ohne Begrenzungsdraht', summary: 'Der Mammotion LUBA 2 kommt ohne Begrenzungsdraht aus. Wir haben getestet, ob das wirklich funktioniert.', author: 'Smart Home Welt', url: 'https://www.smarthome-welt.de/mammotion-luba-test', country: 'DE', productLine: 'LUBA', sentiment: 'positive' },
    
    // 更多联盟
    { platform: 'affiliate_site', title: 'Mammotion Discount Code August 2026 - Verified Coupons', summary: 'All the latest Mammotion discount codes and deals for August 2026. Save up to 30% with our verified coupon codes.', author: 'CouponCabin', url: 'https://www.couponcabin.com/coupons/mammotion/', country: 'US', productLine: 'LUBA', sentiment: 'positive' },
    { platform: 'affiliate_site', title: 'Mammotion vs Husqvarna vs Worx - Welcher Mähroboter ist der beste?', summary: 'Vergleich der drei beliebtesten Mähroboter. Welcher lohnt sich am meisten? Mit exklusivem Rabatt.', author: 'Vergleichsportal', url: 'https://www.vergleichsportal.de/maehroboter-vergleich/', country: 'DE', productLine: 'LUBA', sentiment: 'neutral' },
    
    // 更多论坛
    { platform: 'forum', title: 'YUKA release date confirmed for September', summary: 'Mammotion confirmed YUKA will start shipping in September. Who is getting one?', author: 'RobotFan', url: 'https://www.reddit.com/r/Mammotion/comments/yuka_release_date/', country: 'US', productLine: 'YUKA', sentiment: 'positive' },
    
    // 更多YouTube
    { platform: 'youtube', title: 'Mammotion LUBA 2 Setup Guide - Step by Step', summary: 'Complete setup guide for the Mammotion LUBA 2. From unboxing to first mow. Everything you need to know.', author: 'DIY Home Tech', url: 'https://www.youtube.com/watch?v=luba_setup', country: 'US', productLine: 'LUBA', sentiment: 'positive' },
    { platform: 'youtube', title: 'Worx Landroid vs Mammotion LUBA 2 - Budget Showdown', summary: 'Comparing the Worx Landroid and Mammotion LUBA 2. Which one gives you the best value for money?', author: 'Budget Tech Reviews', url: 'https://www.youtube.com/watch?v=worx_vs_luba', country: 'US', productLine: 'LUBA', sentiment: 'neutral' },
    
    // 更多TikTok
    { platform: 'tiktok', title: 'Day in the life with a robot mower 🤖 #mammotion', summary: 'My LUBA 2 mows while I nap. Best purchase ever. #lawncare #robotmower #lifehacks', author: '@lazygardener', url: 'https://www.tiktok.com/@lazygardener/video/72345', country: 'US', productLine: 'LUBA', sentiment: 'positive' },
    
    // 更多Instagram
    { platform: 'instagram', title: 'Garden goals achieved ✅ #mammotion #luba2', summary: 'Perfect lawn every single week thanks to my Mammotion LUBA 2. Worth every penny.', author: '@suburban_dreams', url: 'https://www.instagram.com/p/C_luba_goals/', country: 'AU', productLine: 'LUBA', sentiment: 'positive' },
    
    // 更多Twitter
    { platform: 'twitter', title: 'Mammotion LUBA 2 firmware update adds multi-zone support 🔥', summary: 'New firmware update for LUBA 2 adds multi-zone support, schedule improvements, and better rain detection. Nice.', author: '@robotmowernews', url: 'https://twitter.com/robotmowernews/status/987654321', country: 'US', productLine: 'LUBA', sentiment: 'positive' },
    { platform: 'twitter', title: 'Is Mammotion worth the premium price? Thread 🧵', summary: '1/ After 3 months with LUBA 2, here is my honest take on whether Mammotion is worth the premium price vs competitors.', author: '@honest_reviews', url: 'https://twitter.com/honest_reviews/status/987654322', country: 'CA', productLine: 'LUBA', sentiment: 'neutral' },
  ];

  additionalData.forEach((item, index) => {
    const randomDays = Math.floor(Math.random() * 14);
    const randomHours = Math.floor(Math.random() * 24);
    data.push({
      id: `mock-${id++}`,
      ...item,
      summary: item.summary,
      author: item.author,
      url: item.url,
      publishTime: new Date(now - (randomDays * 24 + randomHours) * 60 * 60 * 1000).toISOString(),
      views: Math.floor(Math.random() * 100000) + 5000,
      likes: Math.floor(Math.random() * 5000) + 100,
      comments: Math.floor(Math.random() * 500) + 10,
      shares: Math.floor(Math.random() * 1000) + 20,
      relevance: Math.floor(Math.random() * 20) + 70
    });
  });

  return data;
};

module.exports = { generateMockData };
