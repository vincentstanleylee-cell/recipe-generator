(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  else root.RecipeLibrary = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const cuisineZh = {
    Cantonese: '廣東菜',
    'Asian fusion': '亞洲融合',
    'Global fusion': '世界融合',
    'Western fusion': '西式融合',
    'Italian-inspired': '意大利靈感',
    'Asian curry fusion': '亞洲咖喱融合',
    'Global wrap fusion': '世界卷餅融合',
    'Global sandwich fusion': '世界三文治融合',
    'Breakfast fusion': '早餐融合',
    'Asian vegetarian fusion': '亞洲素食融合',
    'Vegetarian side': '素菜配菜',
    Breakfast: '早餐',
    Dessert: '甜品',
    'Savory snack fusion': '鹹香小食融合'
  };
  const stepIcons = ['🔪', '🥣', '🔥', '🥘', '✓'];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function scopeOf(record) {
    return record && record._codex_import ? record._codex_import.scope : 'synthetic_demo';
  }

  function isVisibleByDefault(record) {
    return Boolean(record && record._codex_import && record._codex_import.production_visible);
  }

  function statusFor(record) {
    const scope = scopeOf(record);
    if (scope === 'cantonese_editorial') {
      return {
        short: ['編輯食譜・未經試煮', 'Editorial recipe · not cook-tested'],
        long: [
          '編輯整理・未經實際試煮。材料、份量及時間來自所提供資料，煮食前請自行檢查。',
          'Editorially prepared — not independently cook-tested. Ingredients, amounts and timing come from the supplied data; review them before cooking.'
        ]
      };
    }
    if (scope === 'legacy_demo') {
      return {
        short: ['舊版示範・預設隱藏', 'Legacy demo · hidden by default'],
        long: [
          '未核實舊版示範資料・預設隱藏。呢份記錄唔係來源參考食譜，亦未經實際試煮。',
          'Unverified legacy demo — hidden by default. This is not a source-reference recipe and has not been independently cook-tested.'
        ]
      };
    }
    return {
      short: ['合成示範・預設隱藏', 'Synthetic demo · hidden by default'],
      long: [
        '合成示範資料・預設隱藏。只供探索口味組合，未經實際試煮，唔應當成已驗證食譜。',
        'Synthetic demo data — hidden by default. It is for exploring flavor combinations, is not independently cook-tested and must not be treated as a verified recipe.'
      ]
    };
  }

  function recordSearchText(record) {
    const ingredientText = (record.ingredients || []).flatMap((item) => [item.name, item.name_zh_hant, item.name_en]);
    return normalize([
      record.id,
      record.title_zh_hant,
      record.title_en,
      record.cuisine,
      record.method,
      record.flavor_name_zh_hant,
      record.flavor_name_en,
      ...(record.main_ingredients || []),
      ...(record.seasonings || []),
      ...ingredientText
    ].join(' '));
  }

  function search(records, options) {
    const settings = options || {};
    const query = normalize(settings.query);
    const cuisine = settings.cuisine || 'all';
    const includeDemos = Boolean(settings.includeDemos);
    return (records || [])
      .filter((record) => includeDemos || isVisibleByDefault(record))
      .filter((record) => cuisine === 'all' || record.cuisine === cuisine)
      .filter((record) => !query || recordSearchText(record).includes(query))
      .slice()
      .sort((left, right) => {
        const rank = { cantonese_editorial: 0, legacy_demo: 1, synthetic_demo: 2 };
        return (rank[scopeOf(left)] || 0) - (rank[scopeOf(right)] || 0) || left.id.localeCompare(right.id);
      });
  }

  function cuisineOptions(records) {
    return [...new Set((records || []).map((record) => record.cuisine).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right));
  }

  function scaleQuantity(quantity, originalServings, targetServings) {
    if (quantity == null) return null;
    const base = Math.max(1, Number(originalServings) || 1);
    const target = Math.max(1, Number(targetServings) || base);
    const scaled = Number(quantity) * target / base;
    return Math.round(scaled * 10) / 10;
  }

  function mappedIngredient(item, record, servings) {
    return {
      name: item.name_zh_hant || item.name || item.name_en,
      nameZh: item.name_zh_hant || item.name || '',
      nameEn: item.name_en || '',
      quantity: scaleQuantity(item.quantity, record.servings, servings),
      unit: item.unit || '',
      sourceAmountExact: item.source_amount_exact || '',
      role: item.role || 'ingredient',
      inferred: false,
      suggested: false
    };
  }

  function flavorIcon(scores) {
    const values = scores || {};
    if (Number(values.spicy) >= 3) return '🌶️';
    if (Number(values.sweet) >= 3) return '🍯';
    if (Number(values.sour) >= 3) return '🍋';
    return '🥢';
  }

  function toAppRecipe(record, targetServings, options) {
    if (!record || !record.id) throw new Error('A library record is required.');
    const servings = Math.max(1, Math.min(30, Math.round(Number(targetServings) || Number(record.servings) || 1)));
    const status = statusFor(record);
    const ingredients = (record.ingredients || []).map((item) => mappedIngredient(item, record, servings));
    const main = ingredients.filter((item) => item.role !== 'seasoning');
    const seasonings = ingredients.filter((item) => item.role === 'seasoning');
    const zhSteps = Array.isArray(record.steps_zh_hant) ? record.steps_zh_hant : [];
    const enSteps = Array.isArray(record.steps_en) ? record.steps_en : [];
    const stepCount = Math.max(zhSteps.length, enSteps.length);
    const steps = Array.from({ length: stepCount }, (_unused, index) => ({
      number: index + 1,
      icon: stepIcons[index % stepIcons.length],
      title: `步驟 ${index + 1}`,
      titleEn: `Step ${index + 1}`,
      text: zhSteps[index] || '',
      textEn: enSteps[index] || '',
      minutes: null
    }));
    const equipment = Array.isArray(record.equipment) && record.equipment.length ? record.equipment.join('、') : record.method;
    const totalMinutes = Number(record.total_minutes) || Number(record.prep_minutes || 0) + Number(record.cook_minutes || 0);
    const createdAt = options && options.createdAt ? options.createdAt : new Date().toISOString();
    const cuisineEn = String(record.cuisine || 'Recipe');

    return {
      id: `library-${record.id}-${servings}`,
      createdAt,
      title: record.title_zh_hant,
      titleEn: record.title_en,
      description: status.long[0],
      descriptionEn: status.long[1],
      cuisine: { id: normalize(cuisineEn).replace(/[^a-z0-9]+/g, '-'), label: cuisineZh[cuisineEn] || cuisineEn, labelEn: cuisineEn },
      flavor: {
        id: normalize(record.flavor_name_en).replace(/[^a-z0-9]+/g, '-'),
        label: record.flavor_name_zh_hant || '',
        labelEn: record.flavor_name_en || '',
        icon: flavorIcon(record.flavor_scores)
      },
      tool: { id: 'source-method', icon: '🍳', short: equipment || '做法', shortEn: record.method || 'Method' },
      selectedTools: [],
      servings,
      timeLimit: totalMinutes,
      estimatedMinutes: totalMinutes,
      timeWarning: '',
      timeWarningEn: '',
      dietaryNeeds: '',
      ingredients: main,
      seasonings,
      steps,
      safety: {
        temperatures: record.food_safety ? [record.food_safety] : [],
        temperaturesEn: record.food_safety_en ? [record.food_safety_en] : [],
        warnings: [status.long[0], '致敏原標示只係按材料名稱推測；請檢查產品標籤同交叉污染風險。'],
        warningsEn: [status.long[1], record.allergen_disclaimer || 'Allergen flags are heuristic; check product labels and cross-contact risks.']
      },
      budget: null,
      budgetEnabled: false,
      visualEnabled: true,
      image: 'assets/recipe-placeholder.svg',
      imageAlt: '未有授權成品相片；顯示食譜圖片預留位置',
      imageAltEn: 'No licensed finished-dish photo; recipe image placeholder shown',
      favorite: false,
      rating: 0,
      notes: '',
      sourceInput: {
        ingredients: main.map((item) => item.nameZh || item.name).join('、'),
        seasonings: seasonings.map((item) => item.nameZh || item.name).join('、'),
        cuisine: cuisineEn === 'Cantonese' ? 'cantonese' : 'world',
        flavor: 'ginger-scallion',
        tools: ['pot']
      },
      importedMeta: {
        sourceId: record.id,
        scope: scopeOf(record),
        status: status.short,
        notice: status.long,
        sourceFile: record._codex_import && record._codex_import.source_file,
        sourceSha256: record._codex_import && record._codex_import.source_sha256,
        testKitchenValidated: false,
        readyToCook: false,
        incompleteEnglishMethod: enSteps.length < zhSteps.length,
        imagePromptEn: record.image_prompt_en || '',
        allergenFlags: record.allergen_flags_unverified || []
      }
    };
  }

  return {
    normalize,
    scopeOf,
    isVisibleByDefault,
    statusFor,
    search,
    cuisineOptions,
    scaleQuantity,
    toAppRecipe
  };
});
