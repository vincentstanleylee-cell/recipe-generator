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

process.stdout.write(`\nRESULT: ${passed} passed, ${failed} failed\n`);
if (failed) process.exitCode = 1;
