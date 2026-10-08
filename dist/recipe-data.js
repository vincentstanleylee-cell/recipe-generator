(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.RecipeData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const cuisines = [
    { id: 'cantonese', label: '廣東菜 · Cantonese', short: '廣東', region: 'east-asian', defaultFlavor: 'ginger-scallion', note: '清鮮、快炒、蒸煮，突出食材原味' },
    { id: 'sichuan', label: '四川菜 · Sichuan', short: '四川', region: 'east-asian', defaultFlavor: 'hot-spicy', note: '麻辣、香濃、鑊氣十足' },
    { id: 'taiwanese', label: '台灣菜 · Taiwanese', short: '台灣', region: 'east-asian', defaultFlavor: 'soy-savory', note: '醬香、家常、鹹甜平衡' },
    { id: 'japanese', label: '日本菜 · Japanese', short: '日式', region: 'east-asian', defaultFlavor: 'umami', note: '鮮味、清雅、簡潔' },
    { id: 'korean', label: '韓國菜 · Korean', short: '韓式', region: 'east-asian', defaultFlavor: 'hot-spicy', note: '辛香、蒜香、發酵鮮味' },
    { id: 'thai', label: '泰國菜 · Thai', short: '泰式', region: 'south-asian', defaultFlavor: 'tangy', note: '酸、辣、甜、香草平衡' },
    { id: 'vietnamese', label: '越南菜 · Vietnamese', short: '越式', region: 'east-asian', defaultFlavor: 'citrus', note: '清新香草、魚露鮮味、明亮酸香' },
    { id: 'filipino', label: '菲律賓菜 · Filipino', short: '菲式', region: 'east-asian', defaultFlavor: 'sweet-sour', note: '酸甜、蒜香、醬油風味' },
    { id: 'indonesian', label: '印尼菜 · Indonesian', short: '印尼', region: 'south-asian', defaultFlavor: 'hot-spicy', note: '香料、甜醬油、烘香' },
    { id: 'malaysian', label: '馬來西亞菜 · Malaysian', short: '馬來西亞', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '香料、椰香、辛香層次' },
    { id: 'indian', label: '印度菜 · Indian', short: '印度', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '溫暖香料、濃郁醬汁' },
    { id: 'sri-lankan', label: '斯里蘭卡菜 · Sri Lankan', short: '斯里蘭卡', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '烘香香料、椰香、辣味' },
    { id: 'persian', label: '波斯菜 · Persian', short: '波斯', region: 'mediterranean', defaultFlavor: 'citrus', note: '香草、果香、溫和香料' },
    { id: 'lebanese', label: '黎巴嫩菜 · Lebanese', short: '黎巴嫩', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '香草、檸檬、芝麻香' },
    { id: 'turkish', label: '土耳其菜 · Turkish', short: '土耳其', region: 'mediterranean', defaultFlavor: 'smoky', note: '炭香、香料、乳酪酸香' },
    { id: 'greek', label: '希臘菜 · Greek', short: '希臘', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '檸檬、香草、橄欖油' },
    { id: 'mediterranean', label: '地中海菜 · Mediterranean', short: '地中海', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '香草、檸檬、清爽蔬菜' },
    { id: 'italian', label: '意大利菜 · Italian', short: '意式', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '番茄、香草、蒜香' },
    { id: 'french', label: '法國菜 · French', short: '法式', region: 'mediterranean', defaultFlavor: 'creamy', note: '香草、牛油感、細緻醬汁' },
    { id: 'spanish', label: '西班牙菜 · Spanish', short: '西班牙', region: 'mediterranean', defaultFlavor: 'smoky', note: '煙燻紅椒、橄欖油、蒜香' },
    { id: 'portuguese', label: '葡萄牙菜 · Portuguese', short: '葡式', region: 'mediterranean', defaultFlavor: 'citrus', note: '蒜、檸檬、紅椒與海鮮風味' },
    { id: 'mexican', label: '墨西哥菜 · Mexican', short: '墨西哥', region: 'latin', defaultFlavor: 'smoky', note: '辣椒、青檸、烘香香料' },
    { id: 'peruvian', label: '秘魯菜 · Peruvian', short: '秘魯', region: 'latin', defaultFlavor: 'citrus', note: '青檸、辣椒、香草與鮮味' },
    { id: 'brazilian', label: '巴西菜 · Brazilian', short: '巴西', region: 'latin', defaultFlavor: 'smoky', note: '烤香、豆香、清新酸香' },
    { id: 'caribbean', label: '加勒比菜 · Caribbean', short: '加勒比', region: 'latin', defaultFlavor: 'hot-spicy', note: '果香、辛香、烤香' },
    { id: 'jamaican', label: '牙買加菜 · Jamaican', short: '牙買加', region: 'latin', defaultFlavor: 'peppery', note: '多香果、辣椒、煙燻香' },
    { id: 'west-african', label: '西非菜 · West African', short: '西非', region: 'south-asian', defaultFlavor: 'hot-spicy', note: '番茄、花生、香料與濃郁燉煮' },
    { id: 'ethiopian', label: '埃塞俄比亞菜 · Ethiopian', short: '埃塞俄比亞', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '複合香料、慢煮、微辣' },
    { id: 'moroccan', label: '摩洛哥菜 · Moroccan', short: '摩洛哥', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '暖香料、檸檬、果乾香' },
    { id: 'south-african', label: '南非菜 · South African', short: '南非', region: 'latin', defaultFlavor: 'smoky', note: '烤香、甜辣、香料層次' },
    { id: 'southern-us', label: '美國南方菜 · Southern US', short: '美國南方', region: 'latin', defaultFlavor: 'smoky', note: '煙燻、胡椒、家常濃味' },
    { id: 'cajun', label: '卡真菜 · Cajun', short: '卡真', region: 'latin', defaultFlavor: 'peppery', note: '胡椒、香草、辛香鍋氣' },
    { id: 'nordic', label: '北歐菜 · Nordic', short: '北歐', region: 'mediterranean', defaultFlavor: 'tangy', note: '清爽、香草、酸香' },
    { id: 'eastern-european', label: '東歐菜 · Eastern European', short: '東歐', region: 'mediterranean', defaultFlavor: 'creamy', note: '溫暖燉煮、香草、酸香' },
    { id: 'british', label: '英國菜 · British', short: '英式', region: 'mediterranean', defaultFlavor: 'peppery', note: '烤香、胡椒、家常風味' },
    { id: 'australian', label: '澳洲菜 · Australian', short: '澳式', region: 'mediterranean', defaultFlavor: 'citrus', note: '清新、燒烤、香草風味' },
    { id: 'world-fusion', label: '世界融合 · World Fusion', short: '世界融合', region: 'east-asian', defaultFlavor: 'umami', note: '按現有食材自由配搭' }
  ];

  const flavors = [
    { id: 'ginger-scallion', icon: '🌿', label: '薑蔥清香', description: '薑香、蔥香、鮮味平衡', additions: [['薑', 5], ['蔥', 6], ['豉油', 8]] },
    { id: 'soy-savory', icon: '🥢', label: '醬香鹹鮮', description: '豉油鮮味，微甜收口', additions: [['豉油', 9], ['糖', 2], ['米酒', 5]] },
    { id: 'hot-spicy', icon: '🌶️', label: '香辣', description: '辣香明亮，帶少許蒜香', additions: [['辣椒', 4], ['蒜', 5], ['油', 5]] },
    { id: 'sweet-sour', icon: '🍍', label: '酸甜', description: '果酸、微甜、醒胃', additions: [['醋', 7], ['糖', 5], ['番茄醬', 8]] },
    { id: 'garlic-herb', icon: '🧄', label: '蒜香香草', description: '蒜香突出，香草清新', additions: [['蒜', 6], ['香草', 3], ['油', 6]] },
    { id: 'smoky', icon: '🔥', label: '煙燻烤香', description: '烘烤焦香，微甜辛香', additions: [['煙燻紅椒粉', 2], ['油', 6], ['糖', 1]] },
    { id: 'creamy', icon: '🥛', label: '香滑濃郁', description: '柔和、香滑、包裹感強', additions: [['忌廉或植物奶', 25], ['蒜', 3], ['黑椒', 1]] },
    { id: 'tangy', icon: '✨', label: '醒胃酸香', description: '清爽酸香，味道明亮', additions: [['醋', 7], ['糖', 2], ['香草', 3]] },
    { id: 'umami', icon: '🍄', label: '濃厚鮮味', description: '菇香與醬香增加深度', additions: [['冬菇或蘑菇', 30], ['豉油', 7], ['糖', 1]] },
    { id: 'curry-spiced', icon: '🫚', label: '咖喱香料', description: '暖香料、微辣、濃郁', additions: [['咖喱粉', 4], ['蒜', 4], ['油', 5]] },
    { id: 'citrus', icon: '🍋', label: '柑橘清新', description: '檸檬或青檸帶來清新酸香', additions: [['檸檬或青檸汁', 10], ['香草', 3], ['油', 5]] },
    { id: 'peppery', icon: '🌶', label: '胡椒辛香', description: '胡椒辛香、溫暖有層次', additions: [['黑椒', 2], ['蒜', 4], ['油', 5]] }
  ];

  const tools = [
    { id: 'wok', icon: '🍳', label: '鑊 / Wok', short: '鑊', minutes: 24 },
    { id: 'rice-cooker', icon: '🍚', label: '電飯煲 / Rice cooker', short: '電飯煲', minutes: 38 },
    { id: 'steamer', icon: '♨️', label: '蒸鍋 / Steamer', short: '蒸鍋', minutes: 28 },
    { id: 'pot', icon: '🍲', label: '煮食鍋 / Pot', short: '煮食鍋', minutes: 34 },
    { id: 'oven', icon: '🔥', label: '焗爐 / Oven', short: '焗爐', minutes: 42 },
    { id: 'air-fryer', icon: '💨', label: '氣炸鍋 / Air fryer', short: '氣炸鍋', minutes: 30 }
  ];

  const categoryRules = [
    {
      id: 'protein', label: '蛋白質', grams: 130, costPerGram: 0.014,
      keywords: ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'shrimp', 'prawn', 'tofu', 'tempeh', 'egg', '雞', '牛', '豬', '羊', '火雞', '鴨', '魚', '三文魚', '吞拿魚', '蝦', '豆腐', '蛋']
    },
    {
      id: 'legume', label: '豆類', grams: 110, costPerGram: 0.005,
      keywords: ['bean', 'beans', 'lentil', 'lentils', 'chickpea', 'chickpeas', '豆', '扁豆', '鷹嘴豆']
    },
    {
      id: 'carb', label: '主食', grams: 80, costPerGram: 0.004,
      keywords: ['rice', 'pasta', 'noodle', 'noodles', 'potato', 'potatoes', 'bread', 'quinoa', 'couscous', '米', '飯', '意粉', '麵', '麵條', '薯仔', '馬鈴薯', '麵包', '藜麥']
    },
    {
      id: 'aromatic', label: '香料', grams: 8, costPerGram: 0.018,
      keywords: ['garlic', 'ginger', 'scallion', 'spring onion', 'onion', 'chili', 'chilli', '薑', '蒜', '蔥', '洋蔥', '辣椒']
    },
    {
      id: 'vegetable', label: '蔬菜', grams: 120, costPerGram: 0.006,
      keywords: ['broccoli', 'carrot', 'spinach', 'cabbage', 'tomato', 'pepper', 'zucchini', 'mushroom', 'corn', 'bok choy', 'vegetable', '菜', '西蘭花', '甘筍', '菠菜', '椰菜', '番茄', '椒', '翠玉瓜', '蘑菇', '冬菇', '粟米', '白菜', '菜心']
    },
    { id: 'other', label: '其他', grams: 100, costPerGram: 0.008, keywords: [] }
  ];

  const seasoningGrams = [
    { grams: 1.5, keywords: ['salt', '鹽'] },
    { grams: 0.8, keywords: ['pepper', 'black pepper', '白胡椒', '黑椒', '胡椒'] },
    { grams: 8, keywords: ['soy sauce', '豉油', '醬油'] },
    { grams: 6, keywords: ['oyster sauce', '蠔油'] },
    { grams: 6, keywords: ['oil', 'olive oil', 'sesame oil', '油', '橄欖油', '麻油'] },
    { grams: 5, keywords: ['garlic', '蒜'] },
    { grams: 5, keywords: ['ginger', '薑'] },
    { grams: 3, keywords: ['sugar', 'honey', '糖', '蜜糖'] },
    { grams: 7, keywords: ['vinegar', '醋'] },
    { grams: 4, keywords: ['curry', '咖喱'] },
    { grams: 2, keywords: ['paprika', 'cumin', 'turmeric', '五香粉', '孜然', '薑黃', '紅椒粉'] },
    { grams: 3, keywords: ['herb', 'basil', 'parsley', 'cilantro', 'coriander', '香草', '羅勒', '番茜', '芫荽'] }
  ];

  const currencies = {
    CAD: { symbol: 'CA$', rate: 1, label: 'CAD' },
    HKD: { symbol: 'HK$', rate: 5.7, label: 'HKD' },
    USD: { symbol: 'US$', rate: 0.72, label: 'USD' },
    EUR: { symbol: '€', rate: 0.66, label: 'EUR' },
    GBP: { symbol: '£', rate: 0.56, label: 'GBP' },
    AUD: { symbol: 'A$', rate: 1.07, label: 'AUD' }
  };

  const healthCanadaUrl = 'https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html';

  return {
    cuisines,
    flavors,
    tools,
    categoryRules,
    seasoningGrams,
    currencies,
    healthCanadaUrl
  };
});
