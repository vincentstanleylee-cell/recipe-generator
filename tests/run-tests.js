'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../dist/recipe-data.js');
const engine = require('../dist/recipe-engine.js');
const libraryData = require('../dist/recipe-library-data.js');
const library = require('../dist/recipe-library.js');

const root = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, run) {
  try {
    run();
    passed += 1;
    process.stdout.write(`PASS  ${name}\n`);
  } catch (error) {
    failed += 1;
    process.stderr.write(`FAIL  ${name}\n${error.stack || error}\n`);
  }
}

function recipe(overrides = {}) {
  return engine.generateRecipe({
    ingredients: '雞腿肉、白飯、菜心',
    seasonings: '豉油、薑、蔥',
    cuisine: 'cantonese',
    flavor: 'ginger-scallion',
    tools: ['wok', 'rice-cooker'],
    servings: 2,
    timeLimit: 40,
    dietaryNeeds: '',
    budgetEnabled: true,
    visualEnabled: true,
    currency: 'CAD',
    budgetLimit: 15,
    ...overrides
  });
}

function matchConfig(overrides = {}) {
  return {
    ingredients: '廣東菜心 350g',
    seasonings: '蒜蓉 25g、鹽 4g、白糖 2g、花生油 20ml、清水 20ml',
    cuisine: 'cantonese',
    flavor: 'garlic-herb',
    tools: ['wok'],
    servings: 2,
    timeLimit: 20,
    dietaryNeeds: '',
    budgetEnabled: true,
    visualEnabled: true,
    currency: 'CAD',
    budgetLimit: 15,
    ...overrides
  };
}

test('generates a complete Cantonese recipe', () => {
  const result = recipe();
  assert.match(result.title, /廣東/);
  assert.equal(result.servings, 2);
  assert.equal(result.tool.id, 'wok');
  assert.equal(result.steps.length, 5);
  assert.ok(result.ingredients.length >= 3);
  assert.ok(result.seasonings.length >= 3);
  assert.equal(result.image, 'assets/dish-east-asian.png');
});

test('scales inferred ingredient grams by serving count', () => {
  const two = recipe({ ingredients: '雞腿肉', servings: 2 });
  const four = recipe({ ingredients: '雞腿肉', servings: 4 });
  assert.equal(four.ingredients[0].grams, two.ingredients[0].grams * 2);
});

test('preserves an explicit gram amount', () => {
  const result = recipe({ ingredients: '雞腿肉 315g', servings: 6 });
  assert.equal(result.ingredients[0].grams, 315);
  assert.equal(result.ingredients[0].inferred, false);
});

test('supports amount-first gram syntax', () => {
  assert.deepEqual(engine.parseExplicitAmount('250g tofu'), { name: 'tofu', grams: 250 });
  assert.deepEqual(engine.parseExplicitAmount('300 克 雞肉'), { name: '雞肉', grams: 300 });
});

test('splits English and Chinese separators', () => {
  assert.deepEqual(engine.splitList('雞肉, rice，菜心、薑;蒜；蔥\n蛋'), ['雞肉', 'rice', '菜心', '薑', '蒜', '蔥', '蛋']);
});

test('does not duplicate exact flavor seasonings', () => {
  const result = recipe({ seasonings: '豉油、薑、蔥' });
  assert.equal(result.seasonings.filter((item) => item.name === '薑').length, 1);
  assert.equal(result.seasonings.filter((item) => item.name === '蔥').length, 1);
});

test('uses the fastest selected tool when the time limit is tight', () => {
  const result = recipe({ tools: ['rice-cooker', 'wok'], timeLimit: 20 });
  assert.equal(result.tool.id, 'wok');
  assert.match(result.timeWarning, /超過 20 分鐘/);
});

test('selects a tool that fits the time limit when available', () => {
  const result = recipe({ tools: ['rice-cooker', 'wok'], timeLimit: 40 });
  assert.equal(result.tool.id, 'wok');
  assert.equal(result.timeWarning, '');
});

test('adds pre-cooking guidance for grains used with an air fryer', () => {
  const result = recipe({ ingredients: 'black beans, rice', tools: ['air-fryer'] });
  assert.ok(result.steps.some((step) => step.text.includes('先按包裝煮熟')));
});

test('shows substitutions when the rough budget is exceeded', () => {
  const result = recipe({ budgetLimit: 1 });
  assert.equal(result.budget.over, true);
  assert.ok(result.budget.substitutions.length >= 2);
});

test('converts rough budget display currency', () => {
  const cad = recipe({ currency: 'CAD' });
  const hkd = recipe({ currency: 'HKD' });
  assert.ok(hkd.budget.total > cad.budget.total);
  assert.equal(hkd.budget.symbol, 'HK$');
});

test('flags a vegan and meat conflict', () => {
  const result = recipe({ dietaryNeeds: '純素' });
  assert.ok(result.safety.warnings.some((warning) => warning.includes('動物性')));
});

test('checks allergens in seasonings as well as ingredients', () => {
  const result = recipe({ ingredients: '菜心', seasonings: '芝麻油', dietaryNeeds: '芝麻過敏' });
  assert.ok(result.safety.warnings.some((warning) => warning.includes('芝麻')));
});

test('includes Health Canada poultry guidance', () => {
  const result = recipe({ ingredients: 'chicken, broccoli' });
  assert.ok(result.safety.temperatures.some((item) => item.includes('74°C')));
  assert.match(data.healthCanadaUrl, /^https:\/\/www\.canada\.ca\//);
});

test('rejects an empty ingredient list', () => {
  assert.throws(() => recipe({ ingredients: '  ' }), /最少輸入一種食材/);
});

test('every cuisine maps to a bundled image group', () => {
  const allowed = new Set(['east-asian', 'south-asian', 'mediterranean', 'latin']);
  data.cuisines.forEach((cuisine) => assert.ok(allowed.has(cuisine.region), cuisine.id));
});

test('all core datasets have unique IDs', () => {
  [data.cuisines, data.flavors, data.tools].forEach((items) => {
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
  });
});

test('imported library contains 1,000 unique records with safe default visibility', () => {
  assert.equal(libraryData.recipes.length, 1000);
  assert.equal(new Set(libraryData.recipes.map((record) => record.id)).size, 1000);
  assert.deepEqual(libraryData.counts, {
    total: 1000,
    visibleByDefault: 100,
    cantoneseEditorial: 100,
    legacyDemo: 100,
    syntheticDemo: 800
  });
  assert.ok(libraryData.recipes.every((record) => record.test_kitchen_validated === false));
  assert.ok(libraryData.recipes.every((record) => record.ready_to_cook === false));
  assert.ok(libraryData.recipes.every((record) => record.image_url === null));
});

test('Cantonese editorial source overrides matching master IDs without duplicates', () => {
  const record = libraryData.recipes.find((item) => item.id === 'RC-0101');
  assert.equal(record.title_en, 'Crispy roast pork belly');
  assert.equal(record._codex_import.scope, 'cantonese_editorial');
  assert.equal(record._codex_import.source_file, 'gemini cantonese_100_recipes.txt');
  assert.equal(record._codex_import.production_visible, true);
  assert.equal(record.steps_zh_hant.length, 5);
  assert.equal(record.steps_en.length, 4);
});

test('legacy and synthetic demo recipes stay hidden until explicitly included', () => {
  const normal = library.search(libraryData.recipes, { query: '', cuisine: 'all', includeDemos: false });
  const all = library.search(libraryData.recipes, { query: '', cuisine: 'all', includeDemos: true });
  assert.equal(normal.length, 100);
  assert.equal(all.length, 1000);
  assert.ok(normal.every((record) => record._codex_import.scope === 'cantonese_editorial'));
  assert.equal(all.find((record) => record.id === 'RC-0001')._codex_import.scope, 'legacy_demo');
  assert.equal(all.find((record) => record.id === 'RC-0201')._codex_import.scope, 'synthetic_demo');
});

test('library search matches supplied Cantonese and English content', () => {
  assert.ok(library.search(libraryData.recipes, { query: '豉油雞' }).some((record) => record.id === 'RC-0103'));
  assert.ok(library.search(libraryData.recipes, { query: 'soy sauce chicken' }).some((record) => record.id === 'RC-0103'));
  assert.equal(library.search(libraryData.recipes, { query: 'RC-0001' }).length, 0);
  assert.equal(library.search(libraryData.recipes, { query: 'RC-0001', includeDemos: true }).length, 1);
});

test('main-form matching selects a compatible source recipe from all supplied inputs', () => {
  const config = matchConfig();
  const match = library.matchRecipe(libraryData.recipes, config);
  assert.ok(match);
  assert.equal(match.record.id, 'RC-0179');
  assert.equal(match.mainCoverage, 1);
  assert.equal(match.seasoningCoverage, 1);
  assert.deepEqual(match.missing, []);

  const opened = library.toAppRecipe(match.record, 4, { config: { ...config, servings: 4 }, match });
  assert.equal(opened.importedMeta.sourceId, 'RC-0179');
  assert.equal(opened.steps[0].text, match.record.steps_zh_hant[0]);
  assert.equal(opened.ingredients[0].quantity, match.record.ingredients[0].quantity * 2);
  assert.match(opened.importedMeta.matchNotice[1], /every required item was listed/i);
  assert.equal(opened.sourceInput.ingredients, config.ingredients);
  assert.deepEqual(opened.selectedTools, ['wok']);
});

test('a partial library match clearly reports every unlisted requirement', () => {
  const config = matchConfig({ ingredients: '菜心', seasonings: '' });
  const match = library.matchRecipe(libraryData.recipes, config);
  assert.ok(match);
  assert.equal(match.record.id, 'RC-0179');
  assert.equal(match.missingMain.length, 0);
  assert.equal(match.missingSeasonings.length, 5);

  const opened = library.toAppRecipe(match.record, 2, { config, match });
  assert.match(opened.importedMeta.matchNotice[0], /蒜蓉/);
  assert.match(opened.importedMeta.matchNotice[1], /minced garlic/);
});

test('main-form matching respects cuisine, tools and obvious dietary conflicts', () => {
  assert.equal(library.matchRecipe(libraryData.recipes, matchConfig({ cuisine: 'japanese' })), null);
  assert.equal(library.matchRecipe(libraryData.recipes, matchConfig({ tools: ['oven'] })), null);
  const porkConfig = matchConfig({
    ingredients: '梅頭豬肉',
    seasonings: '海鮮醬、生抽、老抽、玫瑰露酒、蜜糖',
    tools: ['oven'],
    timeLimit: 300,
    dietaryNeeds: '素食 vegetarian'
  });
  assert.equal(library.matchRecipe(libraryData.recipes, porkConfig), null);
});

test('main-form matching never promotes hidden demo recipes', () => {
  const match = library.matchRecipe(libraryData.recipes, matchConfig());
  assert.ok(match);
  assert.equal(match.record._codex_import.production_visible, true);
  assert.equal(match.record._codex_import.scope, 'cantonese_editorial');
});

test('opening an imported recipe scales g and ml without inventing missing data', () => {
  const source = libraryData.recipes.find((record) => record.id === 'RC-0101');
  const opened = library.toAppRecipe(source, 2, { createdAt: '2026-10-08T00:00:00.000Z' });
  assert.equal(opened.servings, 2);
  assert.equal(opened.ingredients[0].quantity, 400);
  assert.equal(opened.ingredients[0].unit, 'g');
  assert.equal(opened.seasonings.find((item) => item.nameEn === 'rose wine').quantity, 7.5);
  assert.equal(opened.budget, null);
  assert.equal(opened.image, 'assets/recipe-placeholder.svg');
  assert.equal(opened.importedMeta.testKitchenValidated, false);
  assert.equal(opened.importedMeta.readyToCook, false);
  assert.equal(opened.importedMeta.incompleteEnglishMethod, true);
  assert.equal(opened.steps[4].textEn, '');
});

test('browser document is a complete HTML page', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html\s+lang="zh-Hant-HK">/i);
  assert.match(html, /<script src="recipe-data\.js"><\/script>/);
  assert.match(html, /<script src="recipe-engine\.js"><\/script>/);
  assert.match(html, /<script src="recipe-library-data\.js"><\/script>/);
  assert.match(html, /<script src="recipe-library\.js"><\/script>/);
  assert.match(html, /<script src="app\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8'), /library\.rankRecipes\(libraryData\.recipes, config\)/);
});

test('HTML IDs are unique and app selectors exist', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate HTML id');
  const selectors = [...app.matchAll(/\$\('#([^']+)'\)/g)].map((match) => match[1]);
  selectors.forEach((id) => assert.ok(ids.includes(id), `missing #${id}`));
});

test('every local static reference exists', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const references = [...html.matchAll(/(?:src|href)="((?!https?:|#)[^"]+)"/g)].map((match) => match[1]);
  references.forEach((reference) => {
    assert.ok(fs.existsSync(path.join(root, 'dist', reference)), reference);
  });
  ['east-asian', 'south-asian', 'mediterranean', 'latin'].forEach((region) => {
    assert.ok(fs.existsSync(path.join(root, 'dist', 'assets', `dish-${region}.png`)));
  });
});

test('browser scripts have valid JavaScript syntax', () => {
  ['recipe-data.js', 'recipe-engine.js', 'recipe-library-data.js', 'recipe-library.js', 'app.js'].forEach((file) => {
    const source = fs.readFileSync(path.join(root, 'dist', file), 'utf8');
    assert.doesNotThrow(() => new Function(source), file);
  });
});

// Cantonese + English -----------------------------------------------------------------------------

const CJK = /[㐀-鿿]/;

test('every cuisine, flavor and tool has English text and no stray Chinese in it', () => {
  data.cuisines.forEach((cuisine) => {
    assert.ok(cuisine.shortEn && cuisine.noteEn, cuisine.id);
    assert.doesNotMatch(cuisine.shortEn + cuisine.noteEn, CJK, cuisine.id);
  });
  data.flavors.forEach((flavor) => {
    assert.ok(flavor.labelEn && flavor.descriptionEn, flavor.id);
    assert.doesNotMatch(flavor.labelEn + flavor.descriptionEn, CJK, flavor.id);
    flavor.additions.forEach(([zh, grams, en]) => {
      assert.ok(en && grams > 0, `${flavor.id}: ${zh}`);
      assert.doesNotMatch(en, CJK, `${flavor.id}: ${zh}`);
    });
  });
  data.tools.forEach((tool) => {
    assert.ok(tool.shortEn && tool.phraseEn, tool.id);
    assert.doesNotMatch(tool.shortEn + tool.phraseEn, CJK, tool.id);
  });
});

test('glossary entries are complete and no spelling belongs to two foods', () => {
  assert.ok(data.glossary.length >= 100);
  const owners = new Map();
  data.glossary.forEach((entry) => {
    assert.match(entry.zh, CJK, entry.en);
    assert.ok(entry.en, entry.zh);
    assert.doesNotMatch(entry.en, CJK, entry.zh);
    [entry.zh, entry.en, ...entry.aliases].forEach((spelling) => {
      const key = engine.normalize(spelling);
      if (owners.has(key)) assert.equal(owners.get(key), entry, `"${spelling}" is used by two glossary entries`);
      owners.set(key, entry);
    });
  });
});

test('glossary translates known foods in both directions and never guesses', () => {
  assert.equal(engine.nameVariants('雞腿肉').en, 'chicken thigh');
  assert.equal(engine.nameVariants('Chicken Thighs').zh, '雞腿肉');
  assert.equal(engine.nameVariants('Chicken Thighs').en, 'Chicken Thighs');
  assert.equal(engine.nameVariants('牛油果').en, 'avocado');
  assert.equal(engine.nameVariants('dragon fruit').zh, '');
  assert.equal(engine.nameVariants('龍珠果').en, '');
  assert.equal(engine.nameVariants('pepper').zh, '', 'bare "pepper" is ambiguous');
});

test('English-typed foods get Cantonese names and Cantonese-typed foods get English names', () => {
  const english = recipe({ ingredients: 'chicken thigh, rice, choy sum', seasonings: 'soy sauce, ginger, scallions' });
  assert.deepEqual(english.ingredients.map((item) => item.nameZh), ['雞腿肉', '白飯', '菜心']);
  assert.match(english.title, /雞腿肉/);
  assert.match(english.titleEn, /Chicken Thigh/);
  assert.match(english.steps[0].text, /雞腿肉、白飯、菜心/);
  const cantonese = recipe();
  assert.deepEqual(cantonese.ingredients.map((item) => item.nameEn), ['chicken thigh', 'steamed rice', 'choy sum']);
  assert.match(cantonese.steps[0].textEn, /chicken thigh, steamed rice and choy sum/);
});

test('the same seasoning typed in English is not suggested a second time', () => {
  const result = recipe({ seasonings: 'soy sauce, ginger, scallions' });
  assert.equal(result.seasonings.length, 3);
  assert.ok(result.seasonings.every((item) => !item.suggested));
});

test('suggested seasonings read naturally in English sentences', () => {
  const result = recipe({ seasonings: 'soy sauce, ginger, scallions', flavor: 'garlic-herb' });
  assert.match(result.steps[0].textEn, /scallions and garlic\)/);
  assert.equal(result.seasonings.find((item) => item.suggested).nameEn, 'Garlic');
});

test('every recipe has English beside every Cantonese text, for every tool', () => {
  ['wok', 'rice-cooker', 'steamer', 'pot', 'oven', 'air-fryer'].forEach((tool) => {
    const result = recipe({ tools: [tool], timeLimit: 10, budgetLimit: 1, dietaryNeeds: 'vegan, gluten-free' });
    const english = [
      result.titleEn, result.descriptionEn, result.imageAltEn, result.timeWarningEn,
      ...result.safety.temperaturesEn, ...result.safety.warningsEn,
      ...result.budget.substitutionsEn, result.budget.disclaimerEn
    ];
    english.forEach((text) => {
      assert.ok(text, `${tool}: empty English text`);
      assert.doesNotMatch(text, CJK, `${tool}: ${text}`);
      assert.doesNotMatch(text, /undefined|\$\{|\[object/, `${tool}: ${text}`);
    });
    result.steps.forEach((step) => {
      assert.ok(step.titleEn && step.textEn, `${tool} step ${step.number}`);
      assert.doesNotMatch(step.titleEn + step.textEn, CJK, `${tool} step ${step.number}`);
      assert.doesNotMatch(step.titleEn + step.textEn, /undefined|\$\{|\[object/, `${tool} step ${step.number}`);
    });
    assert.equal(result.safety.warningsEn.length, result.safety.warnings.length);
    assert.equal(result.safety.temperaturesEn.length, result.safety.temperatures.length);
    assert.equal(result.budget.substitutionsEn.length, result.budget.substitutions.length);
    assert.ok(result.safety.warnings.length >= 3, 'vegan + gluten-free + general warning');
  });
});

test('unknown foods are shown as typed instead of being mistranslated', () => {
  const result = recipe({ ingredients: '龍珠果, dragon fruit' });
  assert.equal(result.ingredients[0].nameEn, '');
  assert.equal(result.ingredients[1].nameZh, '');
  assert.match(result.steps[0].textEn, /龍珠果 and dragon fruit/);
});

test('the empty-input error and the gram labels are bilingual', () => {
  assert.throws(
    () => recipe({ ingredients: '  ' }),
    (error) => /最少輸入一種食材/.test(error.message) && error.messageEn === 'Please enter at least one ingredient.'
  );
  assert.equal(engine.formatGrams(260), '260 克');
  assert.equal(engine.formatGramsEn(260), '260 g');
  assert.equal(engine.formatGramsEn(1.5), '1.5 g');
});

test('every interface message is a complete Cantonese + English pair', () => {
  const keys = Object.keys(data.ui);
  assert.ok(keys.length >= 30);
  keys.forEach((key) => {
    const value = data.ui[key];
    const pair = typeof value === 'function' ? value(2, 'x', 'y') : value;
    assert.ok(Array.isArray(pair) && pair.length === 2 && pair[0] && pair[1], key);
    assert.match(pair[0], CJK, key);
    assert.doesNotMatch(pair[1], CJK, key);
  });
  assert.deepEqual(data.ui.servings(1), ['1 人份', '1 serving']);
  assert.deepEqual(data.ui.servings(3), ['3 人份', '3 servings']);
});

test('app.js only uses interface messages that exist', () => {
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  const used = new Set([...app.matchAll(/\bui\.([A-Za-z]+)/g)].map((match) => match[1]));
  assert.ok(used.size >= 20);
  used.forEach((key) => assert.ok(key in data.ui, `ui.${key} is missing from recipe-data.js`));
});

test('page text is bilingual: each English span follows a Cantonese span and is marked lang="en"', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const english = [...html.matchAll(/<span class="en[^"]*"/g)].length;
  const pairs = [...html.matchAll(/<span class="zh">[^<]*<\/span>\s*<span class="en(?: inline)?" lang="en">[^<]+<\/span>/g)].length;
  assert.ok(english >= 60, `only ${english} English spans`);
  assert.equal(pairs, english, 'every English span must directly follow a Cantonese span and carry lang="en"');
  [...html.matchAll(/<span class="en(?: inline)?" lang="en">([^<]+)<\/span>/g)].forEach((match) => {
    assert.doesNotMatch(match[1], CJK, match[1]);
  });
  assert.match(html, /<title>[^<]*What's for dinner\?/);
  assert.match(html, /name="description" content="[^"]*Enter your ingredients/);
});

// Understanding what the user typed ----------------------------------------------------------------

function requirement(zh, en, role = 'ingredient') {
  return { name: zh, name_zh_hant: zh, name_en: en, role };
}

function pantryConfig(overrides = {}) {
  return {
    ingredients: '',
    seasonings: '',
    cuisine: 'cantonese',
    flavor: 'ginger-scallion',
    tools: ['wok', 'rice-cooker'],
    servings: 2,
    timeLimit: 40,
    dietaryNeeds: '',
    ...overrides
  };
}

function ranked(overrides) {
  return library.rankRecipes(libraryData.recipes, pantryConfig(overrides));
}

const visibleRecords = libraryData.recipes.filter((record) => record._codex_import.production_visible);

test('a specific cut satisfies a generic request, but a different cut does not', () => {
  const generic = requirement('嫩雞肉', 'tender chicken pieces');
  assert.equal(library.pantryItemMatches('雞腿肉', generic), true);
  assert.equal(library.pantryItemMatches('chicken thigh', generic), true);
  assert.equal(library.pantryItemMatches('雞', requirement('無骨雞腿肉', 'boneless chicken thigh')), true);
  assert.equal(library.pantryItemMatches('雞胸肉', requirement('無骨雞腿肉', 'boneless chicken thigh')), false);
  assert.equal(library.pantryItemMatches('雞腿肉', requirement('全雞', 'whole chicken')), false);
  assert.equal(library.pantryItemMatches('雞', requirement('雞爪', 'chicken feet')), false, 'plain chicken is not chicken feet');
});

test('look-alike words are never confused', () => {
  assert.equal(library.pantryItemMatches('雞蛋', requirement('嫩雞肉', 'tender chicken pieces')), false);
  assert.equal(library.pantryItemMatches('牛油果', requirement('牛肉片', 'beef slices')), false);
  assert.equal(library.pantryItemMatches('油', requirement('蠔油', 'oyster sauce', 'seasoning')), false);
  assert.equal(library.pantryItemMatches('oil', requirement('生抽', 'light soy sauce', 'seasoning')), false);
  assert.equal(library.pantryItemMatches('sesame oil', requirement('花生油', 'peanut oil', 'seasoning')), false);
  assert.equal(library.pantryItemMatches('蝦', requirement('大澳蝦醬', 'Tai O shrimp paste', 'seasoning')), false);
  assert.equal(library.pantryItemMatches('魚', requirement('魚露', 'fish sauce', 'seasoning')), false);
  assert.equal(library.pantryItemMatches('皮蛋', requirement('雞蛋', 'egg')), false);
  assert.equal(library.pantryItemMatches('生抽', requirement('老抽', 'dark soy sauce', 'seasoning')), false);
});

test('everyday words in either language reach the library wording', () => {
  assert.equal(library.pantryItemMatches('oil', requirement('花生油', 'peanut oil', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('油', requirement('菜籽油', 'canola oil', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('豉油', requirement('生抽', 'light soy sauce', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('soy sauce', requirement('蒸魚豉油', 'seasoned soy sauce', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('米酒', requirement('紹興酒', 'Shaoxing wine', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('tofu', requirement('板豆腐', 'firm tofu')), true);
  assert.equal(library.pantryItemMatches('green onions', requirement('蔥花', 'chopped scallions', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('蔥', requirement('大蔥/紅蔥頭', 'scallions and shallots', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('冬菇', requirement('鮮香菇片', 'fresh shiitake sliced')), true);
  assert.equal(library.pantryItemMatches('mushrooms', requirement('鮮草菇/白蘑菇', 'fresh mushrooms sliced')), true);
  assert.equal(library.pantryItemMatches('rice', requirement('熟冷白飯', 'cold cooked rice')), true);
  assert.equal(library.pantryItemMatches('noodles', requirement('全蛋幼生麵', 'thin egg noodles')), true);
  assert.equal(library.pantryItemMatches('糖', requirement('冰糖', 'rock sugar', 'seasoning')), true);
  assert.equal(library.pantryItemMatches('choy sum', requirement('鮮菜心/豆苗', 'choy sum or pea shoots')), true);
});

test('typed amounts, counts and notes are ignored when matching', () => {
  assert.deepEqual(library.splitInput('雞腿肉 300g, 2 eggs、蒜(切片)、  3 cloves garlic ; 100 ml water'), ['雞腿肉', 'eggs', '蒜', 'garlic', 'water']);
});

test('every ingredient name in the visible recipes is understood by the food table', () => {
  visibleRecords.forEach((record) => record.ingredients.forEach((item) => {
    const concepts = new Set();
    [item.name_zh_hant, item.name_en].forEach((text) => String(text).split(/\s*[/／]\s*|\s+or\s+|或/i).forEach((part) => {
      library.conceptsOf(part, 'requirement').forEach((id) => concepts.add(id));
    }));
    assert.ok(concepts.size, `${record.id}: ${item.name_zh_hant} | ${item.name_en}`);
  }));
});

test('every food-table name resolves to its own concept and names a known parent', () => {
  const ids = new Set(library.foodConcepts.map((row) => row.id));
  assert.equal(ids.size, library.foodConcepts.length, 'duplicate concept id');
  library.foodConcepts.forEach((row) => {
    if (row.parent) assert.ok(ids.has(row.parent), `${row.id} has unknown parent ${row.parent}`);
    [...row.zh, ...row.en].forEach((name) => {
      const pantryOnly = name.startsWith('~');
      const clean = name.replace(/^[=~]+/, '');
      assert.ok(library.conceptsOf(clean, pantryOnly ? 'pantry' : 'requirement').has(row.id), `${row.id}: "${name}"`);
    });
  });
});

test('the default Cantonese example finds a complete library recipe that uses everything typed', () => {
  const [best] = ranked({ ingredients: '牛肉、菜心', seasonings: '蒜蓉、生抽、蠔油、紹興酒、生粉、花生油', flavor: 'soy-savory' });
  assert.equal(best.record.id, 'RC-0158');
  assert.deepEqual(best.missing, []);
  assert.deepEqual(best.unusedInputs, []);
  assert.equal(best.inputUse, 1);
});

test('typed ingredients steer the choice: chicken input finds a chicken dish, not a lone vegetable', () => {
  const english = ranked({ ingredients: 'chicken thigh, rice, choy sum', seasonings: 'soy sauce, ginger, scallion' });
  assert.equal(english[0].record.id, 'RC-0139');
  assert.deepEqual(english[0].unusedMain, ['rice', 'choy sum']);
  assert.equal(ranked({ ingredients: '雞腿肉、白飯、菜心', seasonings: '豉油、薑、蔥' })[0].record.id, 'RC-0139');
  assert.equal(ranked({ ingredients: '雞腿肉 300g, choy sum 200g, 白飯', seasonings: 'soy sauce 10ml、ginger' })[0].record.id, 'RC-0139');
});

test('other realistic pantries find the matching classic dish', () => {
  assert.equal(ranked({ ingredients: '蝦、雞蛋、蔥', seasonings: '鹽、油' })[0].record.id, 'RC-0114');
  assert.equal(ranked({ ingredients: '豆腐、豬肉碎、冬菇', seasonings: '生抽、蠔油、生粉、油' })[0].record.id, 'RC-0184');
  assert.equal(ranked({ ingredients: '五花腩', seasonings: '鹽、糖、白醋', tools: ['oven'], timeLimit: 300 })[0].record.id, 'RC-0101');
});

test('a recipe that uses more of the typed ingredients outranks one that ignores them', () => {
  const results = ranked({ ingredients: '蝦、雞蛋、蔥', seasonings: '鹽、油' });
  const first = results[0];
  assert.equal(first.record.id, 'RC-0114');
  results.slice(1).forEach((other) => assert.ok(other.score < first.score, other.record.id));
  const vegetableOnly = results.find((candidate) => candidate.record.id === 'RC-0179');
  assert.ok(!vegetableOnly || vegetableOnly.unusedMain.length > first.unusedMain.length);
});

test('every flavor choice in the form contributes to ranking where the recipe text allows it', () => {
  const record = visibleRecords.find((item) => item.id === 'RC-0158');
  assert.ok(library.flavorScore(record, 'soy-savory') > 0, 'soy-savory is the form id');
  const curry = visibleRecords.find((item) => /咖喱|curry/i.test(`${item.title_zh_hant} ${item.title_en} ${item.flavor_name_en}`));
  if (curry) assert.ok(library.flavorScore(curry, 'curry-spiced') > 0, 'curry-spiced is the form id');
  data.flavors.forEach((flavor) => assert.equal(typeof library.flavorScore(record, flavor.id), 'number'));
});

test('"everything listed" mode keeps only recipes with nothing missing', () => {
  const loose = ranked({ ingredients: '蝦、雞蛋、蔥', seasonings: '鹽、油' });
  const strict = ranked({ ingredients: '蝦、雞蛋、蔥', seasonings: '鹽、油', strictPantry: true });
  assert.ok(loose.some((candidate) => candidate.missing.length > 0));
  assert.ok(strict.length >= 1);
  strict.forEach((candidate) => assert.equal(candidate.missing.length, 0, candidate.record.id));
  assert.equal(strict[0].record.id, 'RC-0114');
  assert.deepEqual(ranked({ ingredients: '雞腿肉、白飯、菜心', seasonings: '豉油、薑、蔥', strictPantry: true }), []);
});

test('when nothing matches, the page can say what to change', () => {
  const hint = (overrides) => library.explainNoMatch(libraryData.recipes, pantryConfig(overrides));
  const tools = hint({ ingredients: 'broccoli' });
  assert.match(tools[0][0], /蒸鍋/);
  assert.match(tools[0][1], /steamer/);
  assert.match(hint({ ingredients: '牛肉、菜心', cuisine: 'japanese' })[0][1], /Cantonese/);
  assert.match(hint({ ingredients: '蝦、雞蛋', dietaryNeeds: 'vegan' })[0][1], /dietary/i);
  assert.match(hint({ ingredients: 'xyzzy' })[0][1], /enough of the main ingredients/);
  const strict = hint({ ingredients: '雞腿肉、白飯、菜心', seasonings: '豉油、薑、蔥', strictPantry: true });
  assert.match(strict[0][1], /Ginger and scallion chicken claypot/);
  assert.ok(strict.length <= 2);
  hint({ ingredients: 'xyzzy' }).forEach(([zh, en]) => {
    assert.match(zh, CJK);
    assert.doesNotMatch(en, CJK);
  });
});

test('the notice for a matched recipe names unused items and keeps the source steps untouched', () => {
  const config = pantryConfig({ ingredients: 'chicken thigh, rice, choy sum', seasonings: 'soy sauce, ginger, scallion' });
  const [best] = library.rankRecipes(libraryData.recipes, config);
  const opened = library.toAppRecipe(best.record, 3, { config, match: best });
  assert.match(opened.importedMeta.matchNotice[0], /冇用到：rice、choy sum/);
  assert.match(opened.importedMeta.matchNotice[1], /Not used by this recipe: rice, choy sum/);
  assert.deepEqual(opened.importedMeta.inputMatch.unusedInputs, ['rice', 'choy sum']);
  opened.steps.forEach((step, index) => {
    assert.equal(step.text, best.record.steps_zh_hant[index]);
    assert.equal(step.textEn, best.record.steps_en[index] || '');
  });
  assert.equal(opened.sourceInput.strictPantry, false);
});

test('the source food-safety step is labeled as a safety check and nothing else is renamed', () => {
  const record = visibleRecords.find((item) => item.id === 'RC-0179');
  const opened = library.toAppRecipe(record, 2);
  assert.equal(opened.steps[4].title, '安全檢查');
  assert.equal(opened.steps[4].titleEn, 'Safety check');
  assert.equal(opened.steps[4].icon, '✓');
  assert.equal(opened.steps[0].title, '步驟 1');
  assert.equal(opened.steps[0].titleEn, 'Step 1');
});

test('the page offers the strict switch and the other-options list that app.js drives', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  ['strict-pantry', 'match-options', 'match-option-list'].forEach((id) => {
    assert.match(html, new RegExp(`id="${id}"`), id);
    assert.match(app, new RegExp(`'#${id}'`), id);
  });
  assert.match(html, /<input id="strict-pantry" type="checkbox">/, 'strict mode starts switched off');
  ['optionSwitched', 'optionShowing', 'optionGenericTitle', 'optionGenericNote', 'optionUses', 'optionMissing', 'fallbackNotice', 'genericChosenNotice']
    .forEach((key) => assert.ok(key in data.ui, key));
  assert.deepEqual(data.ui.optionUses(2, 3), ['用到你 2/3 樣主要食材', 'uses 2 of your 3 main ingredients']);
  assert.deepEqual(data.ui.optionMissing(0), ['材料齊全', 'nothing missing']);
  assert.deepEqual(data.ui.optionMissing(1), ['仲欠 1 樣', '1 item missing']);
});

test('the example in the page really is a complete match', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  const ingredients = html.match(/<textarea id="ingredients"[^>]*>([^<]*)<\/textarea>/)[1];
  const seasonings = html.match(/<input id="seasonings"[^>]*value="([^"]*)"/)[1];
  assert.ok(app.includes(`elements.ingredients.value = '${ingredients}'`), 'Load example matches the page default');
  assert.ok(app.includes(`elements.seasonings.value = '${seasonings}'`), 'Load example matches the page default');
  const [best] = ranked({ ingredients, seasonings, flavor: 'soy-savory' });
  assert.deepEqual(best.missing, []);
  assert.deepEqual(best.unusedInputs, []);
});

process.stdout.write(`\nRESULT: ${passed} passed, ${failed} failed\n`);
if (failed) process.exitCode = 1;
