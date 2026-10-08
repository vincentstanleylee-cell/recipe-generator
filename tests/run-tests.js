'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../dist/recipe-data.js');
const engine = require('../dist/recipe-engine.js');

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

test('browser document is a complete HTML page', () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html\s+lang="zh-Hant-HK">/i);
  assert.match(html, /<script src="recipe-data\.js"><\/script>/);
  assert.match(html, /<script src="recipe-engine\.js"><\/script>/);
  assert.match(html, /<script src="app\.js"><\/script>/);
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
  ['recipe-data.js', 'recipe-engine.js', 'app.js'].forEach((file) => {
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

process.stdout.write(`\nRESULT: ${passed} passed, ${failed} failed\n`);
if (failed) process.exitCode = 1;
