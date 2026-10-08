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

  const CJK = /[㐀-鿿]/;
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

  // Bilingual food names ------------------------------------------------------------------------

  const glossaryIndex = new Map();
  data.glossary.forEach((entry) => {
    [entry.zh, entry.en, ...entry.aliases].forEach((spelling) => {
      const key = normalize(spelling);
      if (!glossaryIndex.has(key)) glossaryIndex.set(key, entry);
    });
  });

  // Exact match only (plus a simple English plural), so look-alike words never get a wrong translation.
  function findGlossary(name) {
    const key = normalize(name);
    if (!key) return null;
    if (glossaryIndex.has(key)) return glossaryIndex.get(key);
    if (!CJK.test(key)) {
      if (key.endsWith('es') && glossaryIndex.has(key.slice(0, -2))) return glossaryIndex.get(key.slice(0, -2));
      if (key.endsWith('s') && glossaryIndex.has(key.slice(0, -1))) return glossaryIndex.get(key.slice(0, -1));
    }
    return null;
  }

  // The name exactly as typed stays in its own language; the other language comes from the glossary
  // when the food is known, and is empty otherwise.
  function nameVariants(name) {
    const typed = String(name || '').trim();
    const entry = findGlossary(typed);
    if (CJK.test(typed)) return { zh: typed, en: entry ? entry.en : '' };
    return { zh: entry ? entry.zh : '', en: typed };
  }

  // Same food in either language gets the same key, so "ginger" and "薑" are not both added.
  function canonicalKey(name) {
    const entry = findGlossary(name);
    return entry ? entry.zh : normalize(name);
  }

  const zhName = (item) => item.nameZh || item.name;
  const enName = (item) => item.nameEn || item.name;
  // Suggested seasonings are stored capitalised for list display ("Garlic"); mid-sentence they are lower case.
  const enSentenceName = (item) => (item.suggested && item.nameEn ? item.nameEn.toLowerCase() : enName(item));

  function joinEn(list) {
    if (list.length <= 1) return list.join('');
    return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  }

  function titleCase(value) {
    return String(value).replace(/\b([a-z])([a-z']*)/g, (_match, first, rest) => first.toUpperCase() + rest);
  }

  // Ingredients and seasonings -------------------------------------------------------------------

  function buildMeasuredItems(rawValue, servings, type) {
    return splitList(rawValue).map((raw) => {
      const parsed = parseExplicitAmount(raw);
      const names = nameVariants(parsed.name);
      const category = type === 'seasoning'
        ? { id: 'seasoning', label: '調味', costPerGram: 0.02 }
        : categoryFor(parsed.name);
      const inferred = type === 'seasoning'
        ? seasoningAmount(parsed.name) * servings
        : category.grams * servings;
      return {
        name: parsed.name,
        nameZh: names.zh,
        nameEn: names.en,
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
    flavor.additions.forEach(([name, perServing, nameEn]) => {
      const key = canonicalKey(name);
      if (merged.some((item) => canonicalKey(item.name) === key)) return;
      merged.push({
        name,
        nameZh: name,
        nameEn: nameEn || '',
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

  // Steps ----------------------------------------------------------------------------------------

  function buildSteps(tool, context) {
    const heroItems = context.ingredients.slice(0, 3);
    const seasoningItems = context.seasonings.slice(0, 4);
    const hero = heroItems.map(zhName).join('、');
    const heroEn = joinEn(heroItems.map(enSentenceName));
    const seasoning = seasoningItems.map(zhName).join('、');
    const seasoningEn = joinEn(seasoningItems.map(enSentenceName));
    const hasStarchyCarb = context.ingredients.some((item) => item.category === 'carb');
    const preCookCarb = hasStarchyCarb
      ? '如使用生米、意粉或麵，請先按包裝煮熟並瀝乾；已熟飯或麵可直接使用。'
      : '';
    const preCookCarbEn = hasStarchyCarb
      ? 'If you are using raw rice, pasta or noodles, cook and drain them according to the package first; cooked rice or noodles can go straight in.'
      : '';
    const safetyFinish = context.safetyTemperatures.length
      ? `用溫度計確認：${context.safetyTemperatures.join('；')}。`
      : '試味後才作最後調整，避免一次落太多鹽。';
    const safetyFinishEn = context.safetyTemperaturesEn.length
      ? `Confirm with a thermometer: ${context.safetyTemperaturesEn.join('; ')}.`
      : 'Taste before making the final adjustments so you do not add too much salt at once.';
    const genericPrep = `洗淨並切好 ${hero}。將調味料（${seasoning}）預先拌勻；生熟食材使用不同砧板。`;
    const genericPrepEn = `Wash and cut ${heroEn}. Mix the seasonings (${seasoningEn}) together ahead of time; use separate cutting boards for raw and cooked foods.`;
    const tidy = (text) => text.replace(/\s+/g, ' ').trim();
    const step = (icon, title, titleEn, text, textEn, minutes) => ({ icon, title, titleEn, text, textEn, minutes });

    const stepsByTool = {
      wok: [
        step('🔪', '切配與調味', 'Prep and season', genericPrep, genericPrepEn, 7),
        step('🔥', '燒熱隻鑊', 'Heat the wok', '中大火燒熱鑊，加入少量油；先炒香薑、蒜或其他香料。', 'Heat the wok over medium-high heat and add a little oil; fry the ginger, garlic or other aromatics until fragrant first.', 3),
        step('🥘', '先煮較耐熟食材', 'Cook the slower ingredients first', `加入 ${hero}，分散鋪開，炒至表面轉色並接近熟透。`, `Add ${heroEn}, spread it out and stir-fry until the surface changes color and it is nearly cooked through.`, 7),
        step('🥬', '回鑊收汁', 'Return to the wok and reduce the sauce', '加入較快熟蔬菜及已拌好的調味汁，快速翻炒至汁薄薄掛在食材上。', 'Add the quick-cooking vegetables and the mixed sauce, and toss quickly until the sauce lightly coats the ingredients.', 5),
        step('✨', '檢查與上碟', 'Check and serve', `${safetyFinish} 熄火後靜置 1 分鐘，再上碟。`, `${safetyFinishEn} Turn off the heat, rest for 1 minute, then serve.`, 2)
      ],
      'rice-cooker': [
        step('🔪', '洗切與分層', 'Wash, cut and layer', genericPrep, genericPrepEn, 7),
        step('🍚', '放入電飯煲', 'Load the rice cooker', '主食放底層，加適量水；耐煮食材放中層，較快熟蔬菜留待最後加入。', 'Put the staple on the bottom and add enough water; put slower-cooking ingredients in the middle and keep quick-cooking vegetables for the end.', 5),
        step('♨️', '啟動煮飯模式', 'Start the cook cycle', '加入一半調味汁並使用正常煮飯模式。避免超過內膽最高刻度。', 'Add half of the sauce and use the normal rice mode. Do not go above the maximum fill line of the inner pot.', 22),
        step('🥬', '拌勻完成', 'Mix and finish', `${safetyFinish} 加入餘下調味汁及快熟蔬菜，拌勻後焗 3 分鐘。`, `${safetyFinishEn} Add the remaining sauce and the quick-cooking vegetables, mix well, then let it sit covered for 3 minutes.`, 4)
      ],
      steamer: [
        step('🔪', '切配與醃味', 'Prep and marinate', genericPrep, genericPrepEn, 8),
        step('♨️', '煲滾蒸水', 'Bring the steaming water to a boil', '水滾後才放入蒸碟；將較厚食材鋪在中央，蔬菜放四周。', 'Only place the plate in once the water is boiling; put the thicker ingredients in the center and the vegetables around the edge.', 4),
        step('🥢', '加蓋蒸熟', 'Cover and steam', '保持足夠蒸氣，中途不要頻繁開蓋；如水量不足，只加入熱水。', 'Keep plenty of steam going and avoid lifting the lid often; if the water runs low, add only hot water.', 12),
        step('🌿', '淋汁完成', 'Pour over the sauce', `${safetyFinish} 小心蒸氣，取出後淋上餘下調味汁。`, `${safetyFinishEn} Beware of the steam; after taking the plate out, pour over the remaining sauce.`, 4)
      ],
      pot: [
        step('🔪', '切配與調味', 'Prep and season', genericPrep, genericPrepEn, 7),
        step('🧄', '爆香底味', 'Build the flavor base', '鍋中加入少量油，以中火炒香薑、蒜、洋蔥或乾香料。', 'Add a little oil to the pot and fry the ginger, garlic, onion or dried spices over medium heat until fragrant.', 4),
        step('🍲', '加入主材料', 'Add the main ingredients', `加入 ${hero} 翻炒 2 分鐘，再加入剛好蓋過鍋底的水或湯。`, `Add ${heroEn} and stir-fry for 2 minutes, then add just enough water or stock to cover the bottom of the pot.`, 5),
        step('⏳', '加蓋煮至入味', 'Cover and simmer until flavorful', '轉中小火，加蓋煮至食材熟透；最後 5 分鐘加入快熟蔬菜。', 'Lower to medium-low heat, cover and cook until the ingredients are done; add the quick-cooking vegetables for the last 5 minutes.', 14),
        step('✨', '收汁與檢查', 'Reduce and check', `${safetyFinish} 開蓋收汁，逐少調整味道。`, `${safetyFinishEn} Uncover to reduce the sauce and adjust the seasoning a little at a time.`, 4)
      ],
      oven: [
        step('🔥', '預熱焗爐', 'Preheat the oven', '預熱至 200°C；焗盤鋪烘焙紙，避免食材重疊太多。', 'Preheat to 200°C; line the tray with baking paper and avoid overlapping the ingredients too much.', 8),
        step('🥣', '拌勻材料', 'Mix the ingredients', `${genericPrep} 將食材與調味汁拌勻後鋪平。`, `${genericPrepEn} Toss the ingredients with the sauce and spread them out flat.`, 7),
        step('♨️', '焗至金黃', 'Bake until golden', '放入焗爐中層，中途翻動一次；較快熟蔬菜可後加。', 'Place on the middle rack and turn once halfway through; quick-cooking vegetables can be added later.', 22),
        step('🍋', '檢查與上碟', 'Check and serve', `${safetyFinish} 取出後靜置 3 分鐘，加入新鮮香草或柑橘汁。`, `${safetyFinishEn} After taking it out, rest for 3 minutes and add fresh herbs or citrus juice.`, 5)
      ],
      'air-fryer': [
        step('🔥', '預熱氣炸鍋', 'Preheat the air fryer', '以 190°C 預熱約 3 分鐘；不要在空籃放容易吹起的烘焙紙。', 'Preheat at 190°C for about 3 minutes; do not put loose baking paper in an empty basket, as it can blow around.', 4),
        step('🥣', '薄薄拌油', 'Lightly coat with oil', tidy(`${genericPrep} ${preCookCarb} 食材薄薄拌油，分批排成單層。`), tidy(`${genericPrepEn} ${preCookCarbEn} Lightly coat the ingredients with oil and arrange them in a single layer, in batches.`), 7),
        step('💨', '氣炸與翻面', 'Air-fry and flip', '以 190°C 氣炸，中途拉出炸籃翻面；不同大小食材要分批。', 'Air-fry at 190°C, pulling out the basket to flip the ingredients halfway; cook pieces of different sizes in separate batches.', 15),
        step('✨', '檢查與調味', 'Check and season', `${safetyFinish} 完成後才拌入易焦的糖、蜜糖或新鮮香草。`, `${safetyFinishEn} Only toss in sugar, honey or fresh herbs, which burn easily, after cooking.`, 4)
      ]
    };

    return (stepsByTool[tool.id] || stepsByTool.pot).map((item, index) => ({ number: index + 1, ...item }));
  }

  // Safety ---------------------------------------------------------------------------------------

  // Keeps the first pair for each Cantonese text, then splits the pairs into two parallel lists.
  function splitPairs(pairs) {
    const seen = new Set();
    const unique = pairs.filter(([zh]) => !seen.has(zh) && seen.add(zh));
    return { zh: unique.map((pair) => pair[0]), en: unique.map((pair) => pair[1]) };
  }

  function buildSafety(ingredients, dietaryNeeds) {
    const joined = ingredients.map((item) => item.name).join(' ');
    const temperatures = [];
    if (containsAny(joined, ['chicken', 'turkey', 'duck', 'poultry', '雞', '火雞', '鴨', '禽'])) temperatures.push(['禽肉最厚位置 74°C', 'poultry 74°C']);
    if (containsAny(joined, ['ground beef', 'ground pork', 'minced meat', 'mince', '肉碎', '免治'])) temperatures.push(['免治肉 71°C（免治禽肉 74°C）', 'ground meat 71°C (ground poultry 74°C)']);
    if (containsAny(joined, ['pork', '豬'])) temperatures.push(['豬肉 71°C', 'pork 71°C']);
    if (containsAny(joined, ['fish', 'salmon', 'tuna', '魚', '三文魚', '吞拿魚'])) temperatures.push(['魚 70°C', 'fish 70°C']);
    if (containsAny(joined, ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', '蝦', '蟹', '龍蝦', '貝'])) temperatures.push(['甲殼或貝類 74°C', 'shellfish 74°C']);
    if (containsAny(joined, ['egg', '蛋'])) temperatures.push(['蛋類菜式 74°C', 'egg dishes 74°C']);

    const warnings = [];
    const needs = normalize(dietaryNeeds);
    const animalKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', 'egg', 'milk', 'cheese', '雞', '牛', '豬', '羊', '魚', '蝦', '蛋', '奶', '芝士'];
    const meatKeywords = ['chicken', 'beef', 'pork', 'lamb', 'fish', 'shrimp', '雞', '牛', '豬', '羊', '魚', '蝦'];
    if (containsAny(needs, ['vegan', '純素', '全素']) && containsAny(joined, animalKeywords)) {
      warnings.push(['你選擇了純素需要，但食材似乎包含動物性食品。請先更換食材。', 'You selected a vegan diet, but the ingredients seem to include animal products. Please replace the ingredients first.']);
    } else if (containsAny(needs, ['vegetarian', '素食']) && containsAny(joined, meatKeywords)) {
      warnings.push(['你選擇了素食需要，但食材似乎包含肉類或海鮮。請先更換食材。', 'You selected a vegetarian diet, but the ingredients seem to include meat or seafood. Please replace the ingredients first.']);
    }
    if (containsAny(needs, ['gluten-free', 'gluten free', '無麩', '麩質']) && containsAny(joined, ['noodle', 'pasta', 'bread', 'soy sauce', '麵', '意粉', '麵包', '豉油'])) {
      warnings.push(['食材可能含麩質；請使用有無麩質標示的替代品並檢查包裝。', 'The ingredients may contain gluten; use substitutes labeled gluten-free and check the packaging.']);
    }

    const allergenChecks = [
      { need: ['peanut', '花生'], food: ['peanut', '花生'], label: '花生', labelEn: 'peanuts' },
      { need: ['sesame', '芝麻'], food: ['sesame', 'tahini', '芝麻', '麻醬'], label: '芝麻', labelEn: 'sesame' },
      { need: ['shellfish', '海鮮', '甲殼'], food: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', '蝦', '蟹', '龍蝦', '貝'], label: '甲殼或貝類', labelEn: 'shellfish' },
      { need: ['egg allergy', '蛋敏感', '蛋過敏'], food: ['egg', '蛋'], label: '蛋', labelEn: 'eggs' },
      { need: ['milk allergy', 'dairy-free', '奶敏感', '奶類過敏'], food: ['milk', 'cream', 'cheese', 'butter', '奶', '忌廉', '芝士', '牛油'], label: '奶類', labelEn: 'dairy' },
      { need: ['soy allergy', '大豆過敏', '黃豆過敏'], food: ['soy', 'tofu', 'tempeh', '豉油', '醬油', '豆腐', '黃豆'], label: '大豆', labelEn: 'soy' },
      { need: ['nut allergy', 'tree nut', '果仁過敏'], food: ['almond', 'cashew', 'walnut', 'pecan', '杏仁', '腰果', '合桃', '果仁'], label: '果仁', labelEn: 'tree nuts' }
    ];
    allergenChecks.forEach((check) => {
      if (containsAny(needs, check.need) && containsAny(joined, check.food)) {
        warnings.push([
          `食材似乎包含你註明要避免的${check.label}。不要使用這份配方，直至完成替換及標籤檢查。`,
          `The ingredients seem to contain ${check.labelEn}, which you asked to avoid. Do not use this recipe until the ingredient has been replaced and the labels checked.`
        ]);
      }
    });

    warnings.push([
      '本工具不能保證無致敏原或無交叉污染；有嚴重敏感請檢查每個包裝標籤及向合資格專業人士確認。',
      'This tool cannot guarantee that a recipe is free of allergens or cross-contact; if you have a serious allergy, check every package label and confirm with a qualified professional.'
    ]);

    const temps = splitPairs(temperatures);
    const warns = splitPairs(warnings);
    return { temperatures: temps.zh, temperaturesEn: temps.en, warnings: warns.zh, warningsEn: warns.en };
  }

  // Budget ---------------------------------------------------------------------------------------

  function buildBudget(ingredients, seasonings, servings, currencyCode, budgetLimit) {
    const currency = data.currencies[currencyCode] || data.currencies.CAD;
    const cadCost = [...ingredients, ...seasonings].reduce((total, item) => total + item.grams * item.costPerGram, 0);
    const converted = cadCost * currency.rate;
    const limit = Math.max(0, Number(budgetLimit) || 0);
    const over = limit > 0 && converted > limit;
    const substitutions = [];
    if (over) {
      if (ingredients.some((item) => item.category === 'protein')) substitutions.push(['用豆腐、雞蛋或豆類取代一半肉類。', 'Replace half of the meat with tofu, eggs or legumes.']);
      if (ingredients.some((item) => item.category === 'vegetable')) substitutions.push(['選用當造或急凍蔬菜，通常較穩定實惠。', 'Choose in-season or frozen vegetables, which are usually cheaper and steadier in price.']);
      substitutions.push(['先用家中已有的油、鹽和乾香料，再購買欠缺材料。', 'Use the oil, salt and dried spices you already have at home first, then buy only what is missing.']);
    }
    return {
      currency: Object.prototype.hasOwnProperty.call(data.currencies, currencyCode) ? currencyCode : 'CAD',
      symbol: currency.symbol,
      total: Math.round(converted * 100) / 100,
      perPerson: Math.round((converted / servings) * 100) / 100,
      limit,
      over,
      substitutions: substitutions.map((pair) => pair[0]),
      substitutionsEn: substitutions.map((pair) => pair[1]),
      disclaimer: '離線粗略估算；不是即時店舖價格或匯率。',
      disclaimerEn: 'Offline rough estimate; not live store prices or exchange rates.'
    };
  }

  // Recipe ---------------------------------------------------------------------------------------

  function generateRecipe(config) {
    const servings = clamp(Math.round(Number(config.servings) || 2), 1, 30);
    const ingredients = buildMeasuredItems(config.ingredients, servings, 'ingredient');
    if (!ingredients.length) {
      const error = new Error('請最少輸入一種食材。');
      error.messageEn = 'Please enter at least one ingredient.';
      throw error;
    }

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
      safetyTemperatures: safety.temperatures,
      safetyTemperaturesEn: safety.temperaturesEn
    });
    const budget = buildBudget(ingredients, seasonings, servings, config.currency || 'CAD', config.budgetLimit);
    const selectedTools = selectedToolIds
      .map((id) => data.tools.find((item) => item.id === id))
      .filter(Boolean);
    const slow = tool.minutes > timeLimit;
    const timeWarning = slow
      ? `你選擇的最快工具約需 ${tool.minutes} 分鐘，超過 ${timeLimit} 分鐘上限；請預留多一點時間或改用較快熟食材。`
      : '';
    const timeWarningEn = slow
      ? `The fastest tool you selected takes about ${tool.minutes} minutes, which is over your ${timeLimit}-minute limit; allow extra time or switch to quicker-cooking ingredients.`
      : '';
    const hero = zhName(ingredients[0]);
    const heroEn = enName(ingredients[0]);
    const now = new Date();

    return {
      id: `recipe-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now.toISOString(),
      title: `${cuisine.short}${flavor.label} ${hero}`,
      titleEn: titleCase(`${cuisine.shortEn} ${flavor.labelEn} ${heroEn}`),
      description: `${cuisine.note}。以${tool.short}完成，味道走向係${flavor.description}。`,
      descriptionEn: `${cuisine.noteEn}. Cooked ${tool.phraseEn}; flavor profile: ${flavor.descriptionEn}.`,
      cuisine,
      flavor,
      tool,
      selectedTools,
      servings,
      timeLimit,
      estimatedMinutes: tool.minutes,
      timeWarning,
      timeWarningEn,
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
      imageAltEn: `${cuisine.shortEn}-style finished dish presentation photo`,
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

  function formatGramsEn(value) {
    const number = Number(value) || 0;
    return `${Number.isInteger(number) ? number : number.toFixed(1)} g`;
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
    findGlossary,
    nameVariants,
    generateRecipe,
    formatGrams,
    formatGramsEn,
    formatMoney
  };
});
