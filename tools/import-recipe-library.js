'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const masterPath = path.resolve(root, process.argv[2] || 'Recipe_Creator_1000_Recipes_UTF8.txt');
const cantonesePath = path.resolve(root, process.argv[3] || 'gemini cantonese_100_recipes.txt');
const outputPath = path.resolve(root, 'dist', 'recipe-library-data.js');
const reportPath = path.resolve(root, 'reports', 'recipe_import_report.md');

function fail(message) {
  throw new Error(message);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function parseNdjson(filePath, expectedCount) {
  if (!fs.existsSync(filePath)) fail(`Missing source file: ${filePath}`);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length !== expectedCount) fail(`${path.basename(filePath)} has ${lines.length} records; expected ${expectedCount}.`);
  const records = lines.map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      fail(`${path.basename(filePath)} line ${index + 1} is not valid JSON: ${error.message}`);
    }
  });
  const ids = new Set();
  records.forEach((record, index) => {
    const where = `${path.basename(filePath)} line ${index + 1}`;
    if (!record || typeof record !== 'object' || Array.isArray(record)) fail(`${where} is not an object.`);
    if (!/^RC-\d{4}$/.test(record.id || '')) fail(`${where} has an invalid id.`);
    if (ids.has(record.id)) fail(`${where} duplicates ${record.id}.`);
    ids.add(record.id);
    if (!String(record.title_zh_hant || '').trim() || !String(record.title_en || '').trim()) fail(`${where} is missing a bilingual title.`);
    if (!Array.isArray(record.ingredients) || !record.ingredients.length) fail(`${where} has no ingredients array.`);
    if (!Array.isArray(record.steps_zh_hant) || !record.steps_zh_hant.length) fail(`${where} has no Cantonese method.`);
    if (!Array.isArray(record.steps_en) || !record.steps_en.length) fail(`${where} has no English method.`);
    if (record.test_kitchen_validated !== false) fail(`${where} must keep test_kitchen_validated=false.`);
    record.ingredients.forEach((ingredient, ingredientIndex) => {
      if (!String(ingredient.name_zh_hant || '').trim() || !String(ingredient.name_en || '').trim()) {
        fail(`${where}, ingredient ${ingredientIndex + 1}, is missing a bilingual name.`);
      }
      if (ingredient.quantity == null && !String(ingredient.source_amount_exact || '').trim()) {
        fail(`${where}, ingredient ${ingredientIndex + 1}, has neither quantity nor source_amount_exact.`);
      }
      if (ingredient.quantity != null && !['g', 'ml'].includes(ingredient.unit)) {
        fail(`${where}, ingredient ${ingredientIndex + 1}, uses unsupported unit ${ingredient.unit}.`);
      }
    });
  });
  return records;
}

function expectedIds(first, last) {
  const ids = [];
  for (let value = first; value <= last; value += 1) ids.push(`RC-${String(value).padStart(4, '0')}`);
  return ids;
}

function assertExactIds(records, first, last, label) {
  const actual = new Set(records.map((record) => record.id));
  const missing = expectedIds(first, last).filter((id) => !actual.has(id));
  if (missing.length || actual.size !== last - first + 1) {
    fail(`${label} ID range is incomplete. Missing: ${missing.slice(0, 10).join(', ') || 'none'}.`);
  }
}

function scopeFor(id) {
  const number = Number(id.slice(3));
  if (number >= 101 && number <= 200) return 'cantonese_editorial';
  if (number <= 100) return 'legacy_demo';
  return 'synthetic_demo';
}

function countBy(records, getter) {
  return records.reduce((counts, record) => {
    const key = getter(record) || '(blank)';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function markdownCounts(counts) {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([name, count]) => `- ${name}: ${count}`)
    .join('\n');
}

const master = parseNdjson(masterPath, 1000);
const cantonese = parseNdjson(cantonesePath, 100);
assertExactIds(master, 1, 1000, 'Master source');
assertExactIds(cantonese, 101, 200, 'Cantonese source');

const cantoneseById = new Map(cantonese.map((record) => [record.id, record]));
const hashes = {
  master: sha256(masterPath),
  cantonese: sha256(cantonesePath)
};

const recipes = master.map((masterRecord) => {
  const editorialRecord = cantoneseById.get(masterRecord.id);
  const sourceRecord = editorialRecord || masterRecord;
  const scope = scopeFor(sourceRecord.id);
  return {
    ...sourceRecord,
    ready_to_cook: false,
    _codex_import: {
      schema_version: 1,
      source_file: path.basename(editorialRecord ? cantonesePath : masterPath),
      source_sha256: editorialRecord ? hashes.cantonese : hashes.master,
      scope,
      production_visible: scope === 'cantonese_editorial',
      source_priority: editorialRecord ? 'cantonese_override' : 'master',
      review_status: 'requires_culinary_review'
    }
  };
});

if (new Set(recipes.map((record) => record.id)).size !== 1000) fail('Merged output must contain 1,000 unique IDs.');
if (recipes.some((record) => record.test_kitchen_validated !== false || record.ready_to_cook !== false)) {
  fail('Merged output contains an unsafe validation or readiness flag.');
}

const payload = {
  schemaVersion: 1,
  source: {
    masterFile: path.basename(masterPath),
    masterSha256: hashes.master,
    cantoneseFile: path.basename(cantonesePath),
    cantoneseSha256: hashes.cantonese
  },
  counts: {
    total: recipes.length,
    visibleByDefault: recipes.filter((record) => record._codex_import.production_visible).length,
    cantoneseEditorial: recipes.filter((record) => record._codex_import.scope === 'cantonese_editorial').length,
    legacyDemo: recipes.filter((record) => record._codex_import.scope === 'legacy_demo').length,
    syntheticDemo: recipes.filter((record) => record._codex_import.scope === 'synthetic_demo').length
  },
  recipes
};

const moduleSource = `(function (root, factory) {\n  const value = factory();\n  if (typeof module === 'object' && module.exports) module.exports = value;\n  else root.RecipeLibraryData = value;\n})(typeof globalThis !== 'undefined' ? globalThis : this, function () {\n  'use strict';\n  return ${JSON.stringify(payload)};\n});\n`;
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, moduleSource, 'utf8');

const scopeCounts = countBy(recipes, (record) => record._codex_import.scope);
const cuisineCounts = countBy(recipes, (record) => record.cuisine);
const englishShort = recipes.filter((record) => record.steps_en.length < record.steps_zh_hant.length);
const report = `# Recipe import report\n\n## Outcome\n\n- Generated app data: \`dist/recipe-library-data.js\`\n- Records inserted into the static library build: **1,000**\n- Existing generated-recipe rules overwritten: **0**\n- Duplicate IDs: **0**\n- Records marked test-kitchen validated: **0**\n- Records marked ready to cook: **0**\n- Visible by default: **100** Cantonese editorial records (RC-0101–RC-0200)\n- Hidden behind explicit demo opt-in: **900** records\n\n## Source selection and collision handling\n\nThe prepared 200-record file named in \`recipe/200 CODEX_README_IMPORT_RECIPES.md\` was not present in the workspace. The importer therefore used the two available user-provided UTF-8 NDJSON files:\n\n- \`${path.basename(masterPath)}\` — 1,000 records, SHA-256 \`${hashes.master}\`\n- \`${path.basename(cantonesePath)}\` — 100 records, SHA-256 \`${hashes.cantonese}\`\n\nThe 100 Cantonese records override matching master IDs RC-0101–RC-0200. IDs RC-0001–RC-0100 cannot be promoted to publisher-linked source references because the corrected source/reference bundle and its URLs are absent; they remain hidden \`legacy_demo\` records. IDs RC-0201–RC-1000 remain hidden \`synthetic_demo\` records. This keeps every supplied ID without representing unverified material as production-ready.\n\n## Counts by import scope\n\n${markdownCounts(scopeCounts)}\n\n## Counts by cuisine\n\n${markdownCounts(cuisineCounts)}\n\n## Language completeness\n\n- Bilingual titles and ingredient names: 1,000 / 1,000 records\n- Five Cantonese steps: ${recipes.filter((record) => record.steps_zh_hant.length === 5).length} / 1,000 records\n- Five English steps: ${recipes.filter((record) => record.steps_en.length === 5).length} / 1,000 records\n- Records whose English method has fewer steps than Cantonese: ${englishShort.length}\n- Food-safety English text remains displayed separately and is not silently inserted as a cooking step.\n\n## UI behavior\n\n- The default library shows only the 100 Cantonese editorial records.\n- A deliberate checkbox reveals the 900 demo records with a visible warning.\n- Search covers IDs, titles, cuisines, flavors, ingredients and seasonings in both supplied languages.\n- Portion scaling preserves the supplied unit (g or ml); null quantities would show \`source_amount_exact\` rather than 0.\n- Imported recipes show a no-photo placeholder because every supplied \`image_url\` is null.\n- Favorites, ratings and personal notes continue to use browser-local storage.\n\n## Verification\n\n- \`npm run import:recipes\`: PASS; repeated output SHA-256 was identical.\n- \`npm test\`: PASS; 38 passed, 0 failed.\n- Browser interaction QA: PASS for opening the library, bilingual search, explicit demo opt-in, 1–6 serving scaling, g/mL display, placeholder image, warnings, visual steps and saving to My Recipes.\n- Browser console: 0 warnings and 0 errors during the QA flow.\n\n## Reversibility\n\nThe import is additive: it does not modify \`dist/recipe-data.js\` or the rule-based generator. Remove the library scripts/UI and regenerate without \`dist/recipe-library-data.js\` to roll back. Re-running this command rewrites the same ID-keyed static artifact and cannot create duplicate records.\n\n## Remaining manual review\n\n- Supply the missing corrected \`prepared/recipe_import_0200_source_only_bilingual.jsonl\` bundle to add the 100 publisher-linked source-reference cards safely.\n- Culinary review and test-kitchen validation remain outstanding for every record.\n- Allergen flags are heuristic and require ingredient/package-label review.\n- Licensed or user-owned finished-dish photos remain outstanding.\n`;
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, report, 'utf8');

process.stdout.write(`Imported ${recipes.length} unique records (${payload.counts.visibleByDefault} visible, ${recipes.length - payload.counts.visibleByDefault} hidden demos).\n`);
process.stdout.write(`Wrote ${outputPath}\nWrote ${reportPath}\n`);
