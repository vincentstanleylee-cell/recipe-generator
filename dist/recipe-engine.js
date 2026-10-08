(function (root, factory) {
  const data = typeof module === 'object' && module.exports
    ? require('./recipe-data.js')
    : root.RecipeData;
  const engine = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = engine;
  else root.RecipeEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data) {
  'use strict';

  if (!data) throw new Error('RecipeData must load before RecipeEngine.');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normalize(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function splitList(value) {
    return String(value || '')
      .split(/[\n,，、;；]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function parseExplicitAmount(value) {
    const item = String(value || '').trim();
    let match = item.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(g|克)$/i);
    if (match) return { name: match[1].trim(), grams: Number(match[2]) };
    match = item.match(/^(\d+(?:\.\d+)?)\s*(g|克)\s+(.+)$/i);
    if (match) return { name: match[3].trim(), grams: Number(match[1]) };
    return { name: item, grams: null };
  }

  function containsAny(value, keywords) {
    const normalized = normalize(value);
    return keywords.some((keyword) => normalized.includes(normalize(keyword)));
  }

  function categoryFor(name) {
    return data.categoryRules.find((rule) => rule.keywords.length && containsAny(name, rule.keywords))
      || data.categoryRules[data.categoryRules.length - 1];
  }

  function seasoningAmount(name) {
    const match = data.seasoningGrams.find((rule) => containsAny(name, rule.keywords));
    return match ? match.grams : 3;
  }

  function roundGrams(value) {
    if (value < 2) return Math.max(0.5, Math.round(value * 2) / 2);
    if (value < 10) return Math.max(1, Math.round(value));
    return Math.max(1, Math.round(value / 5) * 5);
  }

  function buildMeasuredItems(rawValue, servings, type) {
    return splitList(rawValue).map((raw) => {
      const parsed = parseExplicitAmount(raw);
      const category = type === 'seasoning'
        ? { id: 'seasoning', label: '調味', costPerGram: 0.02 }
        : categoryFor(parsed.name);
      const inferred = type === 'seasoning'
        ? seasoningAmount(parsed.name) * servings
        : category.grams * servings;
      return {
        name: parsed.name,
        grams: roundGrams(parsed.grams === null ? inferred : parsed.grams),
        category: category.id,
        categoryLabel: category.label,
        costPerGram: category.costPerGram,
        inferred: parsed.grams === null,
        suggested: false
      };
    });
  }

  function mergeFlavorAdditions(seasonings, flavor, servings) {
    const merged = seasonings.map((item) => ({ ...item }));
    flavor.additions.forEach(([name, perServing]) => {
      const existing = merged.find((item) => normalize(item.name) === normalize(name));
      if (existing) return;
      merged.push({
        name,
        grams: roundGrams(perServing * servings),
        category: 'seasoning',
        categoryLabel: '建議調味',
        costPerGram: 0.02,
        inferred: true,
        suggested: true
      });
    });
    return merged;
  }

  function pickTool(toolIds, timeLimit) {
    const selected = toolIds
      .map((id) => data.tools.find((tool) => tool.id === id))
      .filter(Boolean);
    if (!selected.length) selected.push(data.tools.find((tool) => tool.id === 'pot'));
    const withinLimit = selected.filter((tool) => tool.minutes <= timeLimit);
    return (withinLimit.length ? withinLimit : selected).slice().sort((a, b) => a.minutes - b.minutes)[0];
  }

  function buildSteps(tool, context) {
    const hero = context.ingredients.slice(0, 3).map((item) => item.name).join('、');
    const seasoning = context.seasonings.slice(0, 4).map((item) => item.name).join('、');
    const hasStarchyCarb = context.ingredients.some((item) => item.category === 'carb');
    const preCookCarb = hasStarchyCarb
      ? '如使用生米、意粉或麵，請先按包裝煮熟並瀝乾；已熟飯或麵可直接使用。'
      : '';
    const safetyFinish = context.safetyTemperatures.length
      ? `用溫度計確認：${context.safetyTemperatures.join('；')}。`
      : '試味後才作最後調整，避免一次落太多鹽。';
    const genericPrep = `洗淨並切好 ${hero}。將調味料（${seasoning}）預先拌勻；生熟食材使用不同砧板。`;

    const stepsByTool = {
      wok: [
        ['🔪', '切配與調味', genericPrep, 7],
        ['🔥', '燒熱隻鑊', '中大火燒熱鑊，加入少量油；先炒香薑、蒜或其他香料。', 3],
        ['🥘', '先煮較耐熟食材', `加入 ${hero}，分散鋪開，炒至表面轉色並接近熟透。`, 7],
        ['🥬', '回鑊收汁', '加入較快熟蔬菜及已拌好的調味汁，快速翻炒至汁薄薄掛在食材上。', 5],
        ['✨', '檢查與上碟', `${safetyFinish} 熄火後靜置 1 分鐘，再上碟。`, 2]
      ],
      'rice-cooker': [
        ['🔪', '洗切與分層', genericPrep, 7],
        ['🍚', '放入電飯煲', '主食放底層，加適量水；耐煮食材放中層，較快熟蔬菜留待最後加入。', 5],
        ['♨️', '啟動煮飯模式', '加入一半調味汁並使用正常煮飯模式。避免超過內膽最高刻度。', 22],
        ['🥬', '拌勻完成', `${safetyFinish} 加入餘下調味汁及快熟蔬菜，拌勻後焗 3 分鐘。`, 4]
      ],
      steamer: [
        ['🔪', '切配與醃味', genericPrep, 8],
        ['♨️', '煲滾蒸水', '水滾後才放入蒸碟；將較厚食材鋪在中央，蔬菜放四周。', 4],
        ['🥢', '加蓋蒸熟', '保持足夠蒸氣，中途不要頻繁開蓋；如水量不足，只加入熱水。', 12],
        ['🌿', '淋汁完成', `${safetyFinish} 小心蒸氣，取出後淋上餘下調味汁。`, 4]
      ],
      pot: [
        ['🔪', '切配與調味', genericPrep, 7],
        ['🧄', '爆香底味', '鍋中加入少量油，以中火炒香薑、蒜、洋蔥或乾香料。', 4],
        ['🍲', '加入主材料', `加入 ${hero} 翻炒 2 分鐘，再加入剛好蓋過鍋底的水或湯。`, 5],
        ['⏳', '加蓋煮至入味', '轉中小火，加蓋煮至食材熟透；最後 5 分鐘加入快熟蔬菜。', 14],
        ['✨', '收汁與檢查', `${safetyFinish} 開蓋收汁，逐少調整味道。`, 4]
      ],
      oven: [
        ['🔥', '預熱焗爐', '預熱至 200°C；焗盤鋪烘焙紙，避免食材重疊太多。', 8],
        ['🥣', '拌勻材料', `${genericPrep} 將食材與調味汁拌勻後鋪平。`, 7],
        ['♨️', '焗至金黃', '放入焗爐中層，中途翻動一次；較快熟蔬菜可後加。', 22],
        ['🍋', '檢查與上碟', `${safetyFinish} 取出後靜置 3 分鐘，加入新鮮香草或柑橘汁。`, 5]
      ],
      'air-fryer': [
        ['🔥', '預熱氣炸鍋', '以 190°C 預熱約 3 分鐘；不要在空籃放容易吹起的烘焙紙。', 4],
        ['🥣', '薄薄拌油', `${genericPrep} ${preCookCarb} 食材薄薄拌油，分批排成單層。`.replace(/\s+/g, ' ').trim(), 7],
        ['💨', '氣炸與翻面', '以 190°C 氣炸，中途拉出炸籃翻面；不同大小食材要分批。', 15],
        ['✨', '檢查與調味', `${safetyFinish} 完成後才拌入易焦的糖、蜜糖或新鮮香草。`, 4]
      ]
    };

    return (stepsByTool[tool.id] || stepsByTool.pot).map(([icon, title, text, minutes], index) => ({
      number: index + 1,
      icon,
      title,
      text,
      minutes
    }));
  }

  function buildSafety(ingredients, dietaryNeeds) {
    const joined = ingredients.map((item) => item.name).join(' ');
    const temperatures = [];
    if (containsAny(joined, ['chicken', 'turkey', 'duck', 'poultry', '雞', '火雞', '鴨', '禽'])) temperatures.push('禽肉最厚位置 74°C');
    if (containsAny(joined, ['ground beef', 'ground pork', 'minced meat', 'mince', '肉碎', '免治'])) temperatures.push('免治肉 71°C（免治禽肉 74°C）');
    if (containsAny(joined, ['pork', '豬'])) temperatures.push('豬肉 71°C');
    if (containsAny(joined, ['fish', 'salmon', 'tuna', '魚', '三文魚', '吞拿魚'])) temperatures.push('魚 70°C');
    if (containsAny(joined, ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', '蝦', '蟹', '龍蝦', '貝'])) temperatures.push('甲殼或貝類 74°C');
    if (containsAny(joined, ['egg', '蛋'])) temperatures.push('蛋類菜式 74°C');

    const warnings = [];
    const needs = normalize(dietaryNeeds);
    const animalKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'egg', 'milk', 'cheese', '雞', '牛', '豬', '羊', '魚', '蝦', '蛋', '奶', '芝士'];
    const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', '雞', '牛', '豬', '羊', '魚', '蝦'];
    if (containsAny(needs, ['vegan', '純素', '全素']) && containsAny(joined, animalKeywords)) {
      warnings.push('你選擇了純素需要，但食材似乎包含動物性食品。請先更換食材。');
    } else if (containsAny(needs, ['vegetarian', '素食']) && containsAny(joined, meatKeywords)) {
      warnings.push('你選擇了素食需要，但食材似乎包含肉類或海鮮。請先更換食材。');
    }
    if (containsAny(needs, ['gluten-free', 'gluten free', '無麩', '麩質']) && containsAny(joined, ['noodle', 'pasta', 'bread', 'soy sauce', '麵', '意粉', '麵包', '豉油'])) {
      warnings.push('食材可能含麩質；請使用有無麩質標示的替代品並檢查包裝。');
    }

    const allergenChecks = [
      { need: ['peanut', '花生'], food: ['peanut', '花生'], label: '花生' },
      { need: ['sesame', '芝麻'], food: ['sesame', 'tahini', '芝麻', '麻醬'], label: '芝麻' },
      { need: ['shellfish', '海鮮', '甲殼'], food: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', '蝦', '蟹', '龍蝦', '貝'], label: '甲殼或貝類' },
      { need: ['egg allergy', '蛋敏感', '蛋過敏'], food: ['egg', '蛋'], label: '蛋' },
      { need: ['milk allergy', 'dairy-free', '奶敏感', '奶類過敏'], food: ['milk', 'cream', 'cheese', 'butter', '奶', '忌廉', '芝士', '牛油'], label: '奶類' },
      { need: ['soy allergy', '大豆過敏', '黃豆過敏'], food: ['soy', 'tofu', 'tempeh', '豉油', '醬油', '豆腐', '黃豆'], label: '大豆' },
      { need: ['nut allergy', 'tree nut', '果仁過敏'], food: ['almond', 'cashew', 'walnut', 'pecan', '杏仁', '腰果', '合桃', '果仁'], label: '果仁' }
    ];
    allergenChecks.forEach((check) => {
      if (containsAny(needs, check.need) && containsAny(joined, check.food)) {
        warnings.push(`食材似乎包含你註明要避免的${check.label}。不要使用這份配方，直至完成替換及標籤檢查。`);
      }
    });

    warnings.push('本工具不能保證無致敏原或無交叉污染；有嚴重敏感請檢查每個包裝標籤及向合資格專業人士確認。');
    return { temperatures: [...new Set(temperatures)], warnings: [...new Set(warnings)] };
  }

  function buildBudget(ingredients, seasonings, servings, currencyCode, budgetLimit) {
    const currency = data.currencies[currencyCode] || data.currencies.CAD;
    const cadCost = [...ingredients, ...seasonings].reduce((total, item) => total + item.grams * item.costPerGram, 0);
    const converted = cadCost * currency.rate;
    const limit = Math.max(0, Number(budgetLimit) || 0);
    const over = limit > 0 && converted > limit;
    const substitutions = [];
    if (over) {
      if (ingredients.some((item) => item.category === 'protein')) substitutions.push('用豆腐、雞蛋或豆類取代一半肉類。');
      if (ingredients.some((item) => item.category === 'vegetable')) substitutions.push('選用當造或急凍蔬菜，通常較穩定實惠。');
      substitutions.push('先用家中已有的油、鹽和乾香料，再購買欠缺材料。');
    }
    return {
      currency: Object.prototype.hasOwnProperty.call(data.currencies, currencyCode) ? currencyCode : 'CAD',
      symbol: currency.symbol,
      total: Math.round(converted * 100) / 100,
      perPerson: Math.round((converted / servings) * 100) / 100,
      limit,
      over,
      substitutions,
      disclaimer: '離線粗略估算；不是即時店舖價格或匯率。'
    };
  }

  function generateRecipe(config) {
    const servings = clamp(Math.round(Number(config.servings) || 2), 1, 30);
    const ingredients = buildMeasuredItems(config.ingredients, servings, 'ingredient');
    if (!ingredients.length) throw new Error('請最少輸入一種食材。');

    const cuisine = data.cuisines.find((item) => item.id === config.cuisine) || data.cuisines[0];
    const flavor = data.flavors.find((item) => item.id === config.flavor)
      || data.flavors.find((item) => item.id === cuisine.defaultFlavor)
      || data.flavors[0];
    const timeLimit = clamp(Number(config.timeLimit) || 40, 10, 180);
    const selectedToolIds = Array.isArray(config.tools) ? config.tools : [];
    const tool = pickTool(selectedToolIds, timeLimit);
    const rawSeasonings = buildMeasuredItems(config.seasonings, servings, 'seasoning');
    const seasonings = mergeFlavorAdditions(rawSeasonings, flavor, servings);
    const safety = buildSafety([...ingredients, ...seasonings], config.dietaryNeeds || '');
    const steps = buildSteps(tool, {
      ingredients,
      seasonings,
      safetyTemperatures: safety.temperatures
    });
    const budget = buildBudget(ingredients, seasonings, servings, config.currency || 'CAD', config.budgetLimit);
    const selectedTools = selectedToolIds
      .map((id) => data.tools.find((item) => item.id === id))
      .filter(Boolean);
    const timeWarning = tool.minutes > timeLimit
      ? `你選擇的最快工具約需 ${tool.minutes} 分鐘，超過 ${timeLimit} 分鐘上限；請預留多一點時間或改用較快熟食材。`
      : '';
    const hero = ingredients[0].name;
    const now = new Date();

    return {
      id: `recipe-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now.toISOString(),
      title: `${cuisine.short}${flavor.label} ${hero}`,
      description: `${cuisine.note}。以${tool.short}完成，味道走向係${flavor.description}。`,
      cuisine,
      flavor,
      tool,
      selectedTools,
      servings,
      timeLimit,
      estimatedMinutes: tool.minutes,
      timeWarning,
      dietaryNeeds: String(config.dietaryNeeds || '').trim(),
      ingredients,
      seasonings,
      steps,
      safety,
      budget,
      budgetEnabled: Boolean(config.budgetEnabled),
      visualEnabled: config.visualEnabled !== false,
      image: `assets/dish-${cuisine.region}.png`,
      imageAlt: `${cuisine.short}風味成品擺盤示意相片`,
      favorite: false,
      rating: 0,
      notes: '',
      sourceInput: {
        ingredients: String(config.ingredients || ''),
        seasonings: String(config.seasonings || ''),
        cuisine: cuisine.id,
        flavor: flavor.id,
        tools: selectedToolIds.length ? selectedToolIds : [tool.id]
      }
    };
  }

  function formatGrams(value) {
    const number = Number(value) || 0;
    return `${Number.isInteger(number) ? number : number.toFixed(1)} 克`;
  }

  function formatMoney(budget, value) {
    return `${budget.symbol}${Number(value).toFixed(2)}`;
  }

  return {
    clamp,
    normalize,
    splitList,
    parseExplicitAmount,
    categoryFor,
    generateRecipe,
    formatGrams,
    formatMoney
  };
});
