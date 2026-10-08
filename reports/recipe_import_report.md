# Recipe import report

## Outcome

- Generated app data: `dist/recipe-library-data.js`
- Records inserted into the static library build: **1,000**
- Existing generated-recipe rules overwritten: **0**
- Duplicate IDs: **0**
- Records marked test-kitchen validated: **0**
- Records marked ready to cook: **0**
- Visible by default: **100** Cantonese editorial records (RC-0101–RC-0200)
- Hidden behind explicit demo opt-in: **900** records

## Source selection and collision handling

The prepared 200-record file named in `recipe/200 CODEX_README_IMPORT_RECIPES.md` was not present in the workspace. The importer therefore used the two available user-provided UTF-8 NDJSON files:

- `Recipe_Creator_1000_Recipes_UTF8.txt` — 1,000 records, SHA-256 `bcfbb87438adf3011ad93b8ba34b6d870418ee1f92b4da5d83b4a4d0e3c7593b`
- `gemini cantonese_100_recipes.txt` — 100 records, SHA-256 `3d992bebed8f5776bf6eb6efb25f0acb2b3fdcfa358142608b42b23295c63ae5`

The 100 Cantonese records override matching master IDs RC-0101–RC-0200. IDs RC-0001–RC-0100 cannot be promoted to publisher-linked source references because the corrected source/reference bundle and its URLs are absent; they remain hidden `legacy_demo` records. IDs RC-0201–RC-1000 remain hidden `synthetic_demo` records. This keeps every supplied ID without representing unverified material as production-ready.

## Counts by import scope

- synthetic_demo: 800
- cantonese_editorial: 100
- legacy_demo: 100

## Counts by cuisine

- Asian fusion: 150
- Global fusion: 150
- Cantonese: 100
- Western fusion: 100
- Asian curry fusion: 50
- Asian vegetarian fusion: 50
- Breakfast: 50
- Breakfast fusion: 50
- Dessert: 50
- Global sandwich fusion: 50
- Global wrap fusion: 50
- Italian-inspired: 50
- Savory snack fusion: 50
- Vegetarian side: 50

## Language completeness

- Bilingual titles and ingredient names: 1,000 / 1,000 records
- Five Cantonese steps: 1000 / 1,000 records
- Five English steps: 0 / 1,000 records
- Records whose English method has fewer steps than Cantonese: 1000
- Food-safety English text remains displayed separately and is not silently inserted as a cooking step.

## UI behavior

- The default library shows only the 100 Cantonese editorial records.
- A deliberate checkbox reveals the 900 demo records with a visible warning.
- Search covers IDs, titles, cuisines, flavors, ingredients and seasonings in both supplied languages.
- Portion scaling preserves the supplied unit (g or ml); null quantities would show `source_amount_exact` rather than 0.
- Imported recipes show a no-photo placeholder because every supplied `image_url` is null.
- Favorites, ratings and personal notes continue to use browser-local storage.

## Verification

- `npm run import:recipes`: PASS; repeated output SHA-256 was identical.
- `npm test`: PASS; 38 passed, 0 failed.
- Browser interaction QA: PASS for opening the library, bilingual search, explicit demo opt-in, 1–6 serving scaling, g/mL display, placeholder image, warnings, visual steps and saving to My Recipes.
- Browser console: 0 warnings and 0 errors during the QA flow.

## Reversibility

The import is additive: it does not modify `dist/recipe-data.js` or the rule-based generator. Remove the library scripts/UI and regenerate without `dist/recipe-library-data.js` to roll back. Re-running this command rewrites the same ID-keyed static artifact and cannot create duplicate records.

## Remaining manual review

- Supply the missing corrected `prepared/recipe_import_0200_source_only_bilingual.jsonl` bundle to add the 100 publisher-linked source-reference cards safely.
- Culinary review and test-kitchen validation remain outstanding for every record.
- Allergen flags are heuristic and require ingredient/package-label review.
- Licensed or user-owned finished-dish photos remain outstanding.
