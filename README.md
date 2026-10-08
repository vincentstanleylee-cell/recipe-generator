# 今晚食乜？Recipe Generator

A simple, offline-capable recipe generator in **Cantonese and English** (Cantonese first, English beneath or beside it). It turns the ingredients and seasonings you enter into a practical gram-based recipe using local rules—no account, API key, package installation, or internet connection is required.

Live site: https://tonight-recipe-generator.onrender.com

## Start the app

On Windows, double-click:

```text
START.bat
```

Or open `dist/index.html` in a modern browser.

## What works

- Cantonese + English throughout: every label, recipe, step, warning, budget tip and message shows both languages
- Ingredient and seasoning input in either language, including optional explicit amounts such as `雞肉 300g` or `chicken 300g`
- More than 30 cuisine choices across major world regions
- 12 flavor profiles
- Wok, rice cooker, steamer, pot, oven, and air-fryer methods
- Serving adjustment for 1–6 people or a custom 1–30 people
- Generated-recipe quantities in grams; imported source recipes preserve grams or millilitres
- Tool-specific, ingredient-aware cooking steps
- Time-limit checks and warnings
- Offline budget estimates in CAD, HKD, USD, EUR, GBP, or AUD
- Finished-dish presentation photos and private local photo preview
- Visual step-by-step cooking mode
- Favorites, 1–5 ratings, notes, and saved recipes using browser local storage
- Searchable imported library with 1,000 unique bilingual records
- 100 Cantonese editorial recipes visible by default; 900 unverified demo records require an explicit opt-in
- Imported recipes scale from 1–6 people or a custom 1–30 people while preserving g/mL units
- Library-first matching on the main form: the closest library recipe opens with its supplied instructions, the page lists what you did not enter and what the recipe does not use, and an "Other options" list switches to other close matches or the generic recipe
- An "Everything listed" switch that only accepts recipes where every ingredient and seasoning was entered
- Basic dietary/allergy conflict warnings
- Health Canada cooking-temperature guidance
- Responsive light/dark interface

## Languages

Every piece of text is a Cantonese + English pair. Cantonese is the main text; English follows it in a lighter style. Recipes saved before the English version existed still open, in Cantonese only.

- Page text is in `dist/index.html`; messages used by the app are in the `ui` section of `dist/recipe-data.js`; generated recipe text (steps, warnings, budget tips) is in `dist/recipe-engine.js`.
- Ingredient and seasoning names are shown exactly as typed. A built-in glossary of about 145 common foods (`glossary` in `dist/recipe-data.js`) adds the other language beside them and is used inside the English and Cantonese sentences. A food that is not in the glossary is shown as typed, never guessed. To add a food, add a row `[Cantonese, English, ...other spellings]`; matching is exact.
- The tests fail if a message is missing its English or Cantonese half.

## Data and privacy

The application runs entirely in the browser. It makes no API or network requests. Saved recipes remain in that browser's `localStorage`. A photo selected through “換成實拍相” is previewed in memory only and is not uploaded or saved.

Deleting browser site data will delete saved recipes. Different browsers and devices do not share recipes.

## Imported recipe library

Open **食譜庫 · Recipe library** in the header to search by recipe ID, title, cuisine, flavor, ingredient or seasoning. The 100 Cantonese editorial records (RC-0101–RC-0200) are shown first. They are clearly labeled as editorial and not independently cook-tested.

The main form uses this library before generating a new rules-based recipe:

1. **Understanding what you typed.** Typed foods and recipe ingredients are both reduced to food families (`foodConcepts` in `dist/recipe-library.js`). So `雞腿肉` or `chicken thigh` satisfies a recipe that asks for `嫩雞肉`, `豉油` covers `生抽`, `米酒` covers `紹興酒`, and plain `油` or `oil` covers peanut or canola oil but never oyster sauce. A different cut (`雞胸肉` for `雞腿肉`) or a look-alike (`雞蛋`, `牛油果`) is never accepted. Amounts, counts and bracketed notes are ignored, and a recipe item written as a choice (`大蔥/紅蔥頭`, `lard or butter`) accepts either option. A food the table does not know is compared by its wording only.
2. **Filtering.** Cuisine, kitchen tools and obvious dietary conflicts must fit. Hidden demo records are never used.
3. **Ranking.** A recipe needs at least half of its main ingredients. Among those, recipes that use more of the ingredients you typed rank higher, then seasoning coverage, chosen flavor and cooking time.
4. **Showing it.** The best match opens with its supplied instructions unchanged (only serving-size scaling applies). The page names what you did not enter, which of your items the recipe does not use, and lists up to three other close matches plus the generic rules-based recipe under **Other options**.
5. **Fallback.** If nothing fits, the original rules-based generator is used and the page says why, for example that a match exists if you also pick the steamer, or choose Cantonese cuisine.
6. **Everything listed.** When this switch is on, only recipes where every ingredient and seasoning was entered (even water, oil and salt) are used.

To teach the matcher a new food, add a row to `foodConcepts`; the tests fail if any ingredient in a visible recipe is not understood, or if a name resolves to the wrong food.

The supplied corrected 200-record bundle was not present in this workspace. To avoid pretending that unverified data is production-ready, the other 900 records are hidden until the user deliberately enables the demo checkbox. This includes 100 legacy master records and 800 synthetic flavor variations. Imported records have no licensed photos, so the app displays an honest placeholder and still allows a private local photo preview.

The generated browser artifact is deterministic and ID-keyed. If both source files are present at the project root, rebuild it with:

```powershell
npm run import:recipes
```

See `reports/recipe_import_report.md` for source hashes, record counts, collision handling and remaining review work.

## Important limitations

- This is a deterministic rules-based MVP, not a chef or AI model. It generates a practical starting point rather than guaranteeing culinary perfection.
- Inferred gram amounts are estimates. Explicit gram amounts entered by the user are preserved.
- Budget numbers are rough offline estimates—not live store prices or current exchange rates.
- Cuisine photos are presentation examples selected by broad region; they are not a generated photo of every exact recipe.
- Imported recipes are seed/editorial data, not independently cook-tested. Their timing, quantities and heuristic allergen flags still need human review.
- The dietary checker catches obvious conflicts only. It cannot certify that food is allergen-free or free of cross-contact.
- Follow product labels and local food-safety guidance. Use a food thermometer for meat, poultry, seafood, eggs, and leftovers.

Official safety reference: [Health Canada safe internal cooking temperatures](https://www.canada.ca/en/health-canada/services/general-food-safety-tips/safe-internal-cooking-temperatures.html).

## Test

Node.js 18 or newer is needed only to run the tests:

```powershell
node tests/run-tests.js
```

There are no runtime dependencies and no installation step.

## Project layout

```text
dist/
  index.html              Browser application
  styles.css              Responsive visual design
  recipe-data.js          Cuisines, flavors, tools, measurement rules, food glossary, interface messages
  recipe-engine.js        Recipe, budget, safety, and step generation
  recipe-library-data.js  Deterministic 1,000-record imported library artifact
  recipe-library.js       Search, visibility rules, unit-safe scaling, and app mapping
  app.js                  Browser UI and local recipe storage
  assets/                 Bundled finished-dish photographs
reports/
  recipe_import_report.md Import counts, provenance, limitations, and rollback notes
tests/
  run-tests.js            Dependency-free unit and contract tests
tools/
  import-recipe-library.js  Validated, idempotent NDJSON import command
START.bat                 One-click Windows launcher
package.json              Test command and project metadata
```

## Image asset note

The four bundled food photographs were generated specifically for this project using OpenAI's built-in image-generation workflow. They contain no logos, text, or external hotlinks.
