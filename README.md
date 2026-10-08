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
- All displayed quantities in grams
- Tool-specific, ingredient-aware cooking steps
- Time-limit checks and warnings
- Offline budget estimates in CAD, HKD, USD, EUR, GBP, or AUD
- Finished-dish presentation photos and private local photo preview
- Visual step-by-step cooking mode
- Favorites, 1–5 ratings, notes, and saved recipes using browser local storage
- Basic dietary/allergy conflict warnings
- Health Canada cooking-temperature guidance
- Responsive light/dark interface

## Languages

Every piece of text is a Cantonese + English pair. Cantonese is the main text; English follows it in a lighter style. Recipes saved before the English version existed still open, in Cantonese only.

- Page text is in `dist/index.html`; messages used by the app are in the `ui` section of `dist/recipe-data.js`; generated recipe text (steps, warnings, budget tips) is in `dist/recipe-engine.js`.
- Ingredient and seasoning names are shown exactly as typed. A built-in glossary of about 130 common foods (`glossary` in `dist/recipe-data.js`) adds the other language beside them and is used inside the English and Cantonese sentences. A food that is not in the glossary is shown as typed, never guessed. To add a food, add a row `[Cantonese, English, ...other spellings]`; matching is exact.
- The tests fail if a message is missing its English or Cantonese half.

## Data and privacy

The application runs entirely in the browser. It makes no API or network requests. Saved recipes remain in that browser's `localStorage`. A photo selected through “換成實拍相” is previewed in memory only and is not uploaded or saved.

Deleting browser site data will delete saved recipes. Different browsers and devices do not share recipes.

## Important limitations

- This is a deterministic rules-based MVP, not a chef or AI model. It generates a practical starting point rather than guaranteeing culinary perfection.
- Inferred gram amounts are estimates. Explicit gram amounts entered by the user are preserved.
- Budget numbers are rough offline estimates—not live store prices or current exchange rates.
- Cuisine photos are presentation examples selected by broad region; they are not a generated photo of every exact recipe.
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
  app.js                  Browser UI and local recipe storage
  assets/                 Bundled finished-dish photographs
tests/
  run-tests.js            Dependency-free unit and contract tests
START.bat                 One-click Windows launcher
package.json              Test command and project metadata
```

## Image asset note

The four bundled food photographs were generated specifically for this project using OpenAI's built-in image-generation workflow. They contain no logos, text, or external hotlinks.
