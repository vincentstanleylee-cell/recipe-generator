(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.RecipeData = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Every user-facing string comes in a Cantonese + English pair: Cantonese in the plain field,
  // English in the matching "...En" field (or as the second item of a [zh, en] pair).

  const cuisines = [
    { id: 'cantonese', label: '廣東菜 · Cantonese', short: '廣東', shortEn: 'Cantonese', region: 'east-asian', defaultFlavor: 'ginger-scallion', note: '清鮮、快炒、蒸煮，突出食材原味', noteEn: 'Light and fresh; quick stir-frying and steaming that lets the ingredients shine' },
    { id: 'sichuan', label: '四川菜 · Sichuan', short: '四川', shortEn: 'Sichuan', region: 'east-asian', defaultFlavor: 'hot-spicy', note: '麻辣、香濃、鑊氣十足', noteEn: 'Numbing-spicy and bold, with plenty of wok aroma' },
    { id: 'taiwanese', label: '台灣菜 · Taiwanese', short: '台灣', shortEn: 'Taiwanese', region: 'east-asian', defaultFlavor: 'soy-savory', note: '醬香、家常、鹹甜平衡', noteEn: 'Soy-savory, home-style, balanced between salty and sweet' },
    { id: 'japanese', label: '日本菜 · Japanese', short: '日式', shortEn: 'Japanese', region: 'east-asian', defaultFlavor: 'umami', note: '鮮味、清雅、簡潔', noteEn: 'Umami-rich, clean and simple' },
    { id: 'korean', label: '韓國菜 · Korean', short: '韓式', shortEn: 'Korean', region: 'east-asian', defaultFlavor: 'hot-spicy', note: '辛香、蒜香、發酵鮮味', noteEn: 'Spicy, garlicky, with fermented umami' },
    { id: 'thai', label: '泰國菜 · Thai', short: '泰式', shortEn: 'Thai', region: 'south-asian', defaultFlavor: 'tangy', note: '酸、辣、甜、香草平衡', noteEn: 'A balance of sour, spicy, sweet and fresh herbs' },
    { id: 'vietnamese', label: '越南菜 · Vietnamese', short: '越式', shortEn: 'Vietnamese', region: 'east-asian', defaultFlavor: 'citrus', note: '清新香草、魚露鮮味、明亮酸香', noteEn: 'Fresh herbs, fish-sauce umami and bright acidity' },
    { id: 'filipino', label: '菲律賓菜 · Filipino', short: '菲式', shortEn: 'Filipino', region: 'east-asian', defaultFlavor: 'sweet-sour', note: '酸甜、蒜香、醬油風味', noteEn: 'Sweet-sour, garlicky and soy-sauce forward' },
    { id: 'indonesian', label: '印尼菜 · Indonesian', short: '印尼', shortEn: 'Indonesian', region: 'south-asian', defaultFlavor: 'hot-spicy', note: '香料、甜醬油、烘香', noteEn: 'Spices, sweet soy sauce and toasty aromas' },
    { id: 'malaysian', label: '馬來西亞菜 · Malaysian', short: '馬來西亞', shortEn: 'Malaysian', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '香料、椰香、辛香層次', noteEn: 'Spices, coconut and layers of heat' },
    { id: 'indian', label: '印度菜 · Indian', short: '印度', shortEn: 'Indian', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '溫暖香料、濃郁醬汁', noteEn: 'Warm spices and rich sauces' },
    { id: 'sri-lankan', label: '斯里蘭卡菜 · Sri Lankan', short: '斯里蘭卡', shortEn: 'Sri Lankan', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '烘香香料、椰香、辣味', noteEn: 'Roasted spices, coconut and heat' },
    { id: 'persian', label: '波斯菜 · Persian', short: '波斯', shortEn: 'Persian', region: 'mediterranean', defaultFlavor: 'citrus', note: '香草、果香、溫和香料', noteEn: 'Herbs, fruity notes and gentle spices' },
    { id: 'lebanese', label: '黎巴嫩菜 · Lebanese', short: '黎巴嫩', shortEn: 'Lebanese', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '香草、檸檬、芝麻香', noteEn: 'Herbs, lemon and sesame' },
    { id: 'turkish', label: '土耳其菜 · Turkish', short: '土耳其', shortEn: 'Turkish', region: 'mediterranean', defaultFlavor: 'smoky', note: '炭香、香料、乳酪酸香', noteEn: 'Charred aromas, spices and tangy yogurt' },
    { id: 'greek', label: '希臘菜 · Greek', short: '希臘', shortEn: 'Greek', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '檸檬、香草、橄欖油', noteEn: 'Lemon, herbs and olive oil' },
    { id: 'mediterranean', label: '地中海菜 · Mediterranean', short: '地中海', shortEn: 'Mediterranean', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '香草、檸檬、清爽蔬菜', noteEn: 'Herbs, lemon and fresh vegetables' },
    { id: 'italian', label: '意大利菜 · Italian', short: '意式', shortEn: 'Italian', region: 'mediterranean', defaultFlavor: 'garlic-herb', note: '番茄、香草、蒜香', noteEn: 'Tomato, herbs and garlic' },
    { id: 'french', label: '法國菜 · French', short: '法式', shortEn: 'French', region: 'mediterranean', defaultFlavor: 'creamy', note: '香草、牛油感、細緻醬汁', noteEn: 'Herbs, buttery richness and refined sauces' },
    { id: 'spanish', label: '西班牙菜 · Spanish', short: '西班牙', shortEn: 'Spanish', region: 'mediterranean', defaultFlavor: 'smoky', note: '煙燻紅椒、橄欖油、蒜香', noteEn: 'Smoked paprika, olive oil and garlic' },
    { id: 'portuguese', label: '葡萄牙菜 · Portuguese', short: '葡式', shortEn: 'Portuguese', region: 'mediterranean', defaultFlavor: 'citrus', note: '蒜、檸檬、紅椒與海鮮風味', noteEn: 'Garlic, lemon, paprika and seafood flavors' },
    { id: 'mexican', label: '墨西哥菜 · Mexican', short: '墨西哥', shortEn: 'Mexican', region: 'latin', defaultFlavor: 'smoky', note: '辣椒、青檸、烘香香料', noteEn: 'Chili, lime and toasted spices' },
    { id: 'peruvian', label: '秘魯菜 · Peruvian', short: '秘魯', shortEn: 'Peruvian', region: 'latin', defaultFlavor: 'citrus', note: '青檸、辣椒、香草與鮮味', noteEn: 'Lime, chili, herbs and savory depth' },
    { id: 'brazilian', label: '巴西菜 · Brazilian', short: '巴西', shortEn: 'Brazilian', region: 'latin', defaultFlavor: 'smoky', note: '烤香、豆香、清新酸香', noteEn: 'Grilled flavors, beans and fresh acidity' },
    { id: 'caribbean', label: '加勒比菜 · Caribbean', short: '加勒比', shortEn: 'Caribbean', region: 'latin', defaultFlavor: 'hot-spicy', note: '果香、辛香、烤香', noteEn: 'Fruity, spicy and grilled flavors' },
    { id: 'jamaican', label: '牙買加菜 · Jamaican', short: '牙買加', shortEn: 'Jamaican', region: 'latin', defaultFlavor: 'peppery', note: '多香果、辣椒、煙燻香', noteEn: 'Allspice, hot pepper and smoky notes' },
    { id: 'west-african', label: '西非菜 · West African', short: '西非', shortEn: 'West African', region: 'south-asian', defaultFlavor: 'hot-spicy', note: '番茄、花生、香料與濃郁燉煮', noteEn: 'Tomato, peanut, spices and rich stews' },
    { id: 'ethiopian', label: '埃塞俄比亞菜 · Ethiopian', short: '埃塞俄比亞', shortEn: 'Ethiopian', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '複合香料、慢煮、微辣', noteEn: 'Complex spice blends, slow cooking and gentle heat' },
    { id: 'moroccan', label: '摩洛哥菜 · Moroccan', short: '摩洛哥', shortEn: 'Moroccan', region: 'south-asian', defaultFlavor: 'curry-spiced', note: '暖香料、檸檬、果乾香', noteEn: 'Warm spices, lemon and dried-fruit sweetness' },
    { id: 'south-african', label: '南非菜 · South African', short: '南非', shortEn: 'South African', region: 'latin', defaultFlavor: 'smoky', note: '烤香、甜辣、香料層次', noteEn: 'Grilled flavors, sweet heat and layered spices' },
    { id: 'southern-us', label: '美國南方菜 · Southern US', short: '美國南方', shortEn: 'Southern US', region: 'latin', defaultFlavor: 'smoky', note: '煙燻、胡椒、家常濃味', noteEn: 'Smoky, peppery, hearty home cooking' },
    { id: 'cajun', label: '卡真菜 · Cajun', short: '卡真', shortEn: 'Cajun', region: 'latin', defaultFlavor: 'peppery', note: '胡椒、香草、辛香鍋氣', noteEn: 'Pepper, herbs and spicy, pot-cooked depth' },
    { id: 'nordic', label: '北歐菜 · Nordic', short: '北歐', shortEn: 'Nordic', region: 'mediterranean', defaultFlavor: 'tangy', note: '清爽、香草、酸香', noteEn: 'Clean, herby and tangy' },
    { id: 'eastern-european', label: '東歐菜 · Eastern European', short: '東歐', shortEn: 'Eastern European', region: 'mediterranean', defaultFlavor: 'creamy', note: '溫暖燉煮、香草、酸香', noteEn: 'Warming stews, herbs and tang' },
    { id: 'british', label: '英國菜 · British', short: '英式', shortEn: 'British', region: 'mediterranean', defaultFlavor: 'peppery', note: '烤香、胡椒、家常風味', noteEn: 'Roasted, peppery, home-style flavors' },
    { id: 'australian', label: '澳洲菜 · Australian', short: '澳式', shortEn: 'Australian', region: 'mediterranean', defaultFlavor: 'citrus', note: '清新、燒烤、香草風味', noteEn: 'Fresh, barbecued and herby' },
    { id: 'world-fusion', label: '世界融合 · World Fusion', short: '世界融合', shortEn: 'World fusion', region: 'east-asian', defaultFlavor: 'umami', note: '按現有食材自由配搭', noteEn: 'Mix and match freely with what you have' }
  ];

  // additions: [Cantonese name, grams per serving, English name]
  const flavors = [
    { id: 'ginger-scallion', icon: '🌿', label: '薑蔥清香', labelEn: 'Ginger & scallion', description: '薑香、蔥香、鮮味平衡', descriptionEn: 'ginger and scallion aroma with balanced savoriness', additions: [['薑', 5, 'Ginger'], ['蔥', 6, 'Scallion'], ['豉油', 8, 'Soy sauce']] },
    { id: 'soy-savory', icon: '🥢', label: '醬香鹹鮮', labelEn: 'Savory soy', description: '豉油鮮味，微甜收口', descriptionEn: 'soy-sauce umami with a touch of sweetness at the finish', additions: [['豉油', 9, 'Soy sauce'], ['糖', 2, 'Sugar'], ['米酒', 5, 'Rice wine']] },
    { id: 'hot-spicy', icon: '🌶️', label: '香辣', labelEn: 'Spicy', description: '辣香明亮，帶少許蒜香', descriptionEn: 'bright chili heat with a little garlic', additions: [['辣椒', 4, 'Chili'], ['蒜', 5, 'Garlic'], ['油', 5, 'Oil']] },
    { id: 'sweet-sour', icon: '🍍', label: '酸甜', labelEn: 'Sweet & sour', description: '果酸、微甜、醒胃', descriptionEn: 'fruity acidity, light sweetness and an appetizing tang', additions: [['醋', 7, 'Vinegar'], ['糖', 5, 'Sugar'], ['番茄醬', 8, 'Ketchup']] },
    { id: 'garlic-herb', icon: '🧄', label: '蒜香香草', labelEn: 'Garlic & herb', description: '蒜香突出，香草清新', descriptionEn: 'prominent garlic with fresh herbs', additions: [['蒜', 6, 'Garlic'], ['香草', 3, 'Herbs'], ['油', 6, 'Oil']] },
    { id: 'smoky', icon: '🔥', label: '煙燻烤香', labelEn: 'Smoky & roasted', description: '烘烤焦香，微甜辛香', descriptionEn: 'toasty char with gentle sweetness and spice', additions: [['煙燻紅椒粉', 2, 'Smoked paprika'], ['油', 6, 'Oil'], ['糖', 1, 'Sugar']] },
    { id: 'creamy', icon: '🥛', label: '香滑濃郁', labelEn: 'Rich & creamy', description: '柔和、香滑、包裹感強', descriptionEn: 'soft, silky and clingy', additions: [['忌廉或植物奶', 25, 'Cream or plant milk'], ['蒜', 3, 'Garlic'], ['黑椒', 1, 'Black pepper']] },
    { id: 'tangy', icon: '✨', label: '醒胃酸香', labelEn: 'Tangy', description: '清爽酸香，味道明亮', descriptionEn: 'clean acidity and bright flavor', additions: [['醋', 7, 'Vinegar'], ['糖', 2, 'Sugar'], ['香草', 3, 'Herbs']] },
    { id: 'umami', icon: '🍄', label: '濃厚鮮味', labelEn: 'Deep umami', description: '菇香與醬香增加深度', descriptionEn: 'mushroom and soy depth', additions: [['冬菇或蘑菇', 30, 'Shiitake or button mushrooms'], ['豉油', 7, 'Soy sauce'], ['糖', 1, 'Sugar']] },
    { id: 'curry-spiced', icon: '🫚', label: '咖喱香料', labelEn: 'Curry spice', description: '暖香料、微辣、濃郁', descriptionEn: 'warm spices, mild heat and richness', additions: [['咖喱粉', 4, 'Curry powder'], ['蒜', 4, 'Garlic'], ['油', 5, 'Oil']] },
    { id: 'citrus', icon: '🍋', label: '柑橘清新', labelEn: 'Fresh citrus', description: '檸檬或青檸帶來清新酸香', descriptionEn: 'lemon or lime for a fresh, tart lift', additions: [['檸檬或青檸汁', 10, 'Lemon or lime juice'], ['香草', 3, 'Herbs'], ['油', 5, 'Oil']] },
    { id: 'peppery', icon: '🌶', label: '胡椒辛香', labelEn: 'Peppery', description: '胡椒辛香、溫暖有層次', descriptionEn: 'warm, layered pepper spice', additions: [['黑椒', 2, 'Black pepper'], ['蒜', 4, 'Garlic'], ['油', 5, 'Oil']] }
  ];

  const tools = [
    { id: 'wok', icon: '🍳', label: '鑊 / Wok', short: '鑊', shortEn: 'Wok', phraseEn: 'in a wok', minutes: 24 },
    { id: 'rice-cooker', icon: '🍚', label: '電飯煲 / Rice cooker', short: '電飯煲', shortEn: 'Rice cooker', phraseEn: 'in a rice cooker', minutes: 38 },
    { id: 'steamer', icon: '♨️', label: '蒸鍋 / Steamer', short: '蒸鍋', shortEn: 'Steamer', phraseEn: 'in a steamer', minutes: 28 },
    { id: 'pot', icon: '🍲', label: '煮食鍋 / Pot', short: '煮食鍋', shortEn: 'Pot', phraseEn: 'in a pot', minutes: 34 },
    { id: 'oven', icon: '🔥', label: '焗爐 / Oven', short: '焗爐', shortEn: 'Oven', phraseEn: 'in the oven', minutes: 42 },
    { id: 'air-fryer', icon: '💨', label: '氣炸鍋 / Air fryer', short: '氣炸鍋', shortEn: 'Air fryer', phraseEn: 'in an air fryer', minutes: 30 }
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

  // Common foods in both languages, so typed names can be shown with their other-language
  // counterpart. Row: [Cantonese, English, ...other spellings]. Matching is exact (never "contains"),
  // so a wrong translation cannot appear for look-alike words such as 牛油果 (avocado) vs 牛 (beef).
  const glossaryRows = [
    ['雞肉', 'chicken', 'chicken meat'],
    ['雞腿肉', 'chicken thigh', '雞腿', 'chicken thighs'],
    ['雞胸肉', 'chicken breast', '雞胸', 'chicken breasts'],
    ['雞翼', 'chicken wings', '雞翅', 'chicken wing'],
    ['雞蛋', 'egg', '蛋', 'eggs', '雞春'],
    ['鴨肉', 'duck', '鴨', 'duck meat'],
    ['火雞肉', 'turkey', '火雞', 'turkey meat'],
    ['牛肉', 'beef'],
    ['牛扒', 'steak', 'beef steak', 'steaks'],
    ['免治牛肉', 'ground beef', '牛肉碎', 'minced beef', 'beef mince'],
    ['豬肉', 'pork'],
    ['豬扒', 'pork chop', 'pork chops', '豬排'],
    ['免治豬肉', 'ground pork', '豬肉碎', 'minced pork', 'pork mince'],
    ['五花腩', 'pork belly', '腩肉', '五花肉'],
    ['叉燒', 'char siu', 'bbq pork', 'barbecued pork'],
    ['羊肉', 'lamb'],
    ['火腿', 'ham'],
    ['煙肉', 'bacon', '培根'],
    ['香腸', 'sausage', '腸仔', 'sausages'],
    ['魚', 'fish', '魚肉'],
    ['三文魚', 'salmon'],
    ['吞拿魚', 'tuna', '金槍魚'],
    ['鱈魚', 'cod'],
    ['蝦', 'shrimp', 'prawn', 'shrimps', 'prawns', '蝦仁'],
    ['蟹', 'crab', '螃蟹'],
    ['帶子', 'scallops', 'scallop', '扇貝'],
    ['魷魚', 'squid', 'calamari'],
    ['蜆', 'clams', 'clam'],
    ['青口', 'mussels', 'mussel'],
    ['生蠔', 'oysters', 'oyster', '蠔'],
    ['豆腐', 'tofu', 'bean curd'],
    ['天貝', 'tempeh'],
    ['黑豆', 'black beans', 'black bean'],
    ['紅腰豆', 'kidney beans', 'kidney bean'],
    ['鷹嘴豆', 'chickpeas', 'chickpea', 'garbanzo beans'],
    ['扁豆', 'lentils', 'lentil'],
    ['青豆', 'green peas', 'peas', 'pea', '豌豆'],
    ['毛豆', 'edamame'],
    ['豆', 'beans', 'bean'],
    ['花生', 'peanuts', 'peanut'],
    ['杏仁', 'almonds', 'almond'],
    ['腰果', 'cashews', 'cashew'],
    ['合桃', 'walnuts', 'walnut', '核桃'],
    ['白飯', 'steamed rice', 'rice', 'cooked rice', 'white rice', '飯'],
    ['米', 'uncooked rice', 'raw rice', '大米'],
    ['糙米', 'brown rice'],
    ['意粉', 'pasta', 'spaghetti', '意大利粉', '意麵'],
    ['麵條', 'noodles', '麵', '面', 'noodle'],
    ['米粉', 'rice vermicelli', 'vermicelli'],
    ['河粉', 'flat rice noodles', 'rice noodles', 'ho fun'],
    ['烏冬', 'udon', 'udon noodles'],
    ['薯仔', 'potato', 'potatoes', '馬鈴薯'],
    ['番薯', 'sweet potato', 'sweet potatoes'],
    ['麵包', 'bread'],
    ['藜麥', 'quinoa'],
    ['古斯米', 'couscous'],
    ['粟米', 'corn', 'sweet corn', '玉米'],
    ['菜心', 'choy sum', 'choi sum', 'chinese flowering cabbage'],
    ['白菜', 'bok choy', 'pak choi', 'baby bok choy', '小白菜'],
    ['大白菜', 'napa cabbage', 'chinese cabbage'],
    ['芥蘭', 'gai lan', 'chinese broccoli', 'kai lan'],
    ['西蘭花', 'broccoli'],
    ['椰菜花', 'cauliflower', '花椰菜'],
    ['甘筍', 'carrot', 'carrots', '紅蘿蔔'],
    ['菠菜', 'spinach'],
    ['椰菜', 'cabbage'],
    ['生菜', 'lettuce'],
    ['番茄', 'tomato', 'tomatoes', '蕃茄'],
    ['青瓜', 'cucumber', 'cucumbers'],
    ['翠玉瓜', 'zucchini', 'courgette', 'zucchinis'],
    ['茄子', 'eggplant', 'aubergine'],
    ['甜椒', 'bell pepper', 'bell peppers', 'capsicum', '青椒', '燈籠椒'],
    ['蘑菇', 'mushrooms', 'mushroom', 'button mushrooms'],
    ['冬菇', 'shiitake mushrooms', 'shiitake', '香菇'],
    ['洋蔥', 'onion', 'onions'],
    ['蒜', 'garlic', '蒜頭', 'garlic cloves', '蒜蓉', 'minced garlic'],
    ['薑', 'ginger', '生薑'],
    ['蔥', 'scallion', 'scallions', 'spring onion', 'spring onions', 'green onion', 'green onions', '葱', '青蔥'],
    ['辣椒', 'chili', 'chilli', 'chili pepper', 'chilies', 'chillies', 'red chili'],
    ['芹菜', 'celery'],
    ['韭菜', 'garlic chives', 'chinese chives'],
    ['南瓜', 'pumpkin'],
    ['冬瓜', 'winter melon'],
    ['秋葵', 'okra'],
    ['豆角', 'long beans', 'yardlong beans'],
    ['四季豆', 'green beans', 'string beans'],
    ['豆苗', 'pea shoots'],
    ['豆芽', 'bean sprouts', '芽菜', 'beansprouts'],
    ['牛油果', 'avocado', 'avocados'],
    ['檸檬', 'lemon', 'lemons'],
    ['青檸', 'lime', 'limes'],
    ['鹽', 'salt'],
    ['豉油', 'soy sauce', '醬油', 'soya sauce', 'soy'],
    ['生抽', 'light soy sauce'],
    ['老抽', 'dark soy sauce'],
    ['蠔油', 'oyster sauce'],
    ['魚露', 'fish sauce'],
    ['辣椒醬', 'chili sauce', 'hot sauce', 'chilli sauce', 'sriracha'],
    ['番茄醬', 'ketchup', 'tomato ketchup'],
    ['糖', 'sugar', '白糖'],
    ['蜜糖', 'honey'],
    ['醋', 'vinegar'],
    ['米酒', 'rice wine', '料酒', 'cooking wine'],
    ['麻油', 'sesame oil', '芝麻油', '香油'],
    ['橄欖油', 'olive oil'],
    ['油', 'oil', 'cooking oil', 'vegetable oil', '食用油', '植物油'],
    ['牛油', 'butter'],
    ['忌廉', 'cream', 'whipping cream', 'heavy cream'],
    ['牛奶', 'milk'],
    ['芝士', 'cheese'],
    ['乳酪', 'yogurt', 'yoghurt', '酸奶'],
    ['椰奶', 'coconut milk', '椰漿'],
    ['黑椒', 'black pepper', '黑胡椒'],
    ['白胡椒', 'white pepper'],
    ['胡椒', 'ground pepper', '胡椒粉'],
    ['咖喱粉', 'curry powder', 'curry', '咖喱'],
    ['五香粉', 'five-spice powder', 'five spice', 'five spice powder'],
    ['孜然', 'cumin'],
    ['薑黃', 'turmeric', '薑黃粉'],
    ['紅椒粉', 'paprika'],
    ['煙燻紅椒粉', 'smoked paprika'],
    ['香草', 'herbs', 'mixed herbs', 'fresh herbs'],
    ['羅勒', 'basil'],
    ['番茜', 'parsley'],
    ['芫荽', 'cilantro', 'coriander', '香菜'],
    ['迷迭香', 'rosemary'],
    ['百里香', 'thyme'],
    ['芝麻', 'sesame seeds', 'sesame', '白芝麻'],
    ['粟粉', 'cornstarch', 'corn starch', 'cornflour', '生粉'],
    ['麵粉', 'flour', 'plain flour', 'all-purpose flour'],
    ['水', 'water'],
    ['高湯', 'stock', 'broth']
  ];

  const glossary = glossaryRows.map(([zh, en, ...aliases]) => ({ zh, en, aliases }));

  const currencies = {
    CAD: { symbol: 'CA$', rate: 1, label: 'CAD' },
    HKD: { symbol: 'HK$', rate: 5.7, label: 'HKD' },
    USD: { symbol: 'US$', rate: 0.72, label: 'USD' },
    EUR: { symbol: '€', rate: 0.66, label: 'EUR' },
    GBP: { symbol: '£', rate: 0.56, label: 'GBP' },
    AUD: { symbol: 'A$', rate: 1.07, label: 'AUD' }
  };

  const healthCanadaUrl = 'https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html';

  // Interface messages used by app.js. Each is a [Cantonese, English] pair, or a function returning one.
  const ui = {
    allInGrams: ['全部用克', 'all in grams'],
    estimatedNote: ['按份量估算', 'Estimated from servings'],
    suggestedNote: ['配合口味嘅建議', 'Suggested for the flavor'],
    overBudget: ['估算超出預算，可以試下：', 'The estimate is over budget; you could try:'],
    withinBudget: ['估算在預算內。', 'The estimate is within budget.'],
    enterBudgetLimit: ['輸入預算上限就可以比較。', 'Enter a budget limit to compare.'],
    cookThoroughly: ['徹底煮熟食材；生熟食物、砧板同用具要分開。', 'Cook ingredients thoroughly; keep raw and cooked foods, cutting boards and utensils separate.'],
    favorite: ['收藏', 'Favorite'],
    favorited: ['已收藏', 'Favorited'],
    saved: ['已儲存', 'Saved'],
    saveFailed: ['未能儲存。瀏覽器可能封鎖咗本機儲存。', 'Could not save. Your browser may be blocking local storage.'],
    keepOneTool: ['最少要保留一樣廚具。', 'Keep at least one kitchen tool selected.'],
    favoriteAdded: ['已收藏呢份食譜。', 'Recipe added to your favorites.'],
    favoriteRemoved: ['已取消收藏，食譜仍然保留。', 'Removed from favorites; the recipe is still saved.'],
    recipeSaved: ['食譜已儲存到「我的食譜」。', 'Recipe saved to "My recipes".'],
    savedOpened: ['已打開已儲存食譜。', 'Opened the saved recipe.'],
    recipeDeleted: ['食譜已刪除。', 'Recipe deleted.'],
    chooseImage: ['請選擇圖片檔案。', 'Please choose an image file.'],
    imageTooLarge: ['圖片太大，請選擇 6 MB 以下檔案。', 'That image is too large; please choose a file under 6 MB.'],
    photoPreviewOnly: ['實拍相只喺今次頁面預覽，不會上載或儲存。', 'Your photo is only previewed on this page; it is not uploaded or saved.'],
    exampleLoaded: ['已載入廣東菜示例。', 'Loaded the Cantonese example.'],
    unknownDate: ['日期不詳', 'Date unknown'],
    emptySaved: ['未有已儲存食譜。生成一份食譜，再撳「儲存到我的食譜」。', 'No saved recipes yet. Generate a recipe, then press "Save to My recipes".'],
    untitled: ['未命名食譜', 'Untitled recipe'],
    open: ['打開', 'Open'],
    remove: ['刪除', 'Delete'],
    generateFailed: ['未能生成食譜，請檢查輸入。', 'Could not generate a recipe; please check your input.'],
    uploadedPhotoAlt: ['你上載的成品實拍相片', 'Your uploaded photo of the finished dish'],
    minutes: (n) => [`${n} 分鐘`, `${n} min`],
    aboutMinutes: (n) => [`約 ${n} 分鐘`, `about ${n} min`],
    servings: (n) => [`${n} 人份`, `${n} ${n === 1 ? 'serving' : 'servings'}`],
    stars: (n) => [`${n} 星`, `${n} ${n === 1 ? 'star' : 'stars'}`],
    budgetCopy: (servings, perPerson, limit) => [
      `${servings} 人份，約每人 ${perPerson}。${limit ? `你嘅上限係 ${limit}。` : ''}`,
      `${servings} ${servings === 1 ? 'serving' : 'servings'}, about ${perPerson} per person.${limit ? ` Your limit is ${limit}.` : ''}`
    ],
    thermometer: (zh, en) => [`用數碼溫度計量最厚位置：${zh}。`, en ? `Use a digital thermometer on the thickest part: ${en}.` : ''],
    confirmDelete: (zh, en) => [`確定刪除「${zh}」？`, `Delete "${en || zh}"?`]
  };

  return {
    cuisines,
    flavors,
    tools,
    categoryRules,
    seasoningGrams,
    glossary,
    currencies,
    healthCanadaUrl,
    ui
  };
});
