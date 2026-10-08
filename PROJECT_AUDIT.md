# Recipe Generator Project Audit

> Historical baseline: this audit records the state before implementation began. The working offline MVP was added afterward; see `README.md` for current startup instructions and features.

Audit date: 2026-10-07 (America/Vancouver)

## Executive summary

The configured project directory, `D:\Tech\Recipe Generator`, contained no files or subdirectories when this audit began. There was therefore no conventional application repository, package manifest, README, backend, test suite, or asset directory to inspect in that location.

The only recoverable Recipe Generator implementation was a prior chat-workspace artifact named `recipe-generator-mockup.html`. It is a 52,173-byte, 931-line, single-file browser prototype. That source has been preserved byte-for-byte in the review ZIP as `src/recipe-generator-mockup.html`; no functional source changes were made.

The prototype provides a polished Cantonese/Traditional Chinese user interface and several working client-side interactions. It is not yet a real recipe-generation application: entered ingredients, cuisine, flavor, budget, time, and dietary needs do not drive a generated recipe. The displayed recipe, ingredient quantities, costs, and cooking guidance are primarily hard-coded demonstrations.

## Audit scope and provenance

| Item | Finding |
|---|---|
| Configured project root | `D:\Tech\Recipe Generator` |
| Initial project-root inventory | 0 files and 0 subdirectories |
| Recovered source | `recipe-generator-mockup.html` from the prior chat workspace |
| Packaged source path | `src/recipe-generator-mockup.html` |
| Source size | 52,173 bytes |
| Source length | 931 lines |
| Source SHA-256 | `60F75ACD4C8A9F2FD17584B51B6099EA1B226732E25F483C024ABD7264BA09EC` |
| Functional changes made during audit | None |
| Documentation/config additions | This audit and a placeholder-only `.env.example` |

## Current architecture

The current implementation is a single-file, client-only UI prototype.

| Layer | Current implementation |
|---|---|
| Presentation | HTML fragment rooted at `#recipe-generator-preview` with inline CSS |
| Interaction | Inline vanilla JavaScript and DOM event listeners |
| Recipe/domain data | Hard-coded JavaScript objects for flavor copy, tool steps, tool visuals, and currency estimates |
| State | In-memory variables, plus optional `window.openai.widgetState` / `window.openai.setWidgetState` integration when hosted by a compatible OpenAI surface |
| Persistence | None in a normal standalone browser; no database and no `localStorage` fallback |
| Backend/API | None |
| Network access | None; no `fetch`, XMLHttpRequest, WebSocket, or external URL appears in the source |
| Build system | None |
| Dependency manager | None |
| External dependencies | None |
| Assets | No asset files; the mockup uses CSS, Unicode emoji, and an optional user-selected local image read with `FileReader` |

### Runtime flow

1. The browser renders the HTML fragment and inline styles.
2. JavaScript binds controls to the elements inside `#recipe-generator-preview`.
3. User actions update text, selected states, serving-scaled hard-coded quantities, budget messages, and a three-step visual guide.
4. When available, the OpenAI widget-state bridge stores a small UI-state snapshot. Otherwise all state is lost when the page reloads.

## Original project inventory

| Category | Status |
|---|---|
| Application source | One recovered HTML prototype outside the initially empty project root |
| `package.json` / lockfile | Not present |
| Framework configuration | Not present |
| TypeScript/build configuration | Not present |
| README | Not present |
| Backend/server source | Not present |
| Database schema/migrations | Not present |
| Automated tests | Not present |
| Test configuration | Not present |
| Image/static asset directory | Not present |
| `.env` | Not present |
| API integration configuration | Not present |

## Feature status

Status meanings:

- **Working prototype**: the visible client-side interaction operates in the source as written.
- **Partial/demo**: UI exists, but important behavior is hard-coded or not connected to real data.
- **Missing**: no implementation was found.

| Requirement / feature | Status | Evidence and limitations |
|---|---|---|
| Cantonese/Traditional Chinese interface | Working prototype | Labels, guidance, sample recipe, and status text are localized in colloquial Cantonese/Traditional Chinese. |
| Ingredient entry | Partial/demo | Comma-separated input is validated and echoed into the result, but it is not parsed into a recipe or quantities. Only the first ingredient changes the title. |
| Seasoning entry | Partial/demo | Input is echoed in the “used” summary; it does not alter ingredient quantities, instructions, or taste balance. |
| Flavor selection | Partial/demo | Twelve broad flavor buttons change descriptive copy and an emoji, but not the actual recipe. This is not an exhaustive catalog of world flavors. |
| World cuisine selection | Partial/demo | A free-form field and suggestion list are present. Cuisine changes the title/status only, not the method or ingredients. |
| Kitchen tools | Partial/demo | Six tools can be selected. The first selected tool chooses one hard-coded instruction list and three visual steps; additional selected tools only appear in the summary. |
| Serving adjustment: 1–6 and custom | Working prototype for sample values | The UI supports 1–6 and custom 1–30 servings and scales the displayed hard-coded sample ingredient amounts. |
| Gram measurement | Working prototype for displayed ingredients | All sample ingredient rows use `克` and scale arithmetically. User-entered quantities are not parsed or converted to grams. |
| Budget cooking | Partial/demo | Toggle, currency, limit, strategy, and status UI exist. Cost is a fixed per-person amount per currency, not calculated from ingredients, location, store, or pantry stock. |
| Visual cooking | Partial/demo | A previous/next stepper displays three tool-specific emoji cards. There are no generated step images, video, timers, or doneness sensing. |
| Finished-dish image | Partial/demo | Default “dish” is a CSS/emoji illustration. A local photo can be previewed for the current session. No AI image is generated. |
| My Recipes | Missing beyond navigation mock | The button scrolls to the personalization panel and displays a hard-coded count; there is no recipe list or collection model. |
| Favorite recipe | Partial/demo | The toggle works and can use OpenAI widget state, but there is no durable standalone storage. |
| Recipe rating | Partial/demo | A 1–5 rating control works and can use widget state, but there is no durable standalone storage or per-recipe data model. |
| “Next time” notes | Partial/demo | Notes can be marked saved to widget state; normal browser sessions lose them after reload. |
| Dietary/allergy handling | Missing | A dietary input is visible, but its value is not read by the script and no allergen or cross-contact validation occurs. |
| Maximum cooking time | Missing | A time selector is visible, but its value is not read by the script. |
| Ingredient substitution | Missing | A “swap ingredient” control is rendered but has no event handler. |
| Real recipe generation | Missing | No rules engine, model call, recipe database, or API exists. The Generate button updates the title and re-renders fixed content. |
| Recipe safety validation | Missing | No reliable food-safety, allergy, dietary, or nutrition engine exists. A sample temperature line is static text, not validation. |
| Accounts/sync/export | Missing | No authentication, cloud sync, import, export, or sharing implementation exists. |

## API and integration audit

- No API client, provider SDK, endpoint, server route, or network request was found.
- No API keys, tokens, credentials, email addresses, local filesystem paths, or IP addresses were embedded in the recovered HTML.
- The only host integration is the guarded `window.openai` widget-state bridge. It does not generate recipes or images.
- `.env.example` contains clearly labeled, unused placeholder names only. Real secrets must remain server-side when an API/backend is added.

## Known bugs and risks

### Functional blockers

1. **No runnable project structure.** There is no package manifest, application shell, server, or build/start script.
2. **Generate does not generate.** It requires at least one ingredient, then changes the title and “used” text while retaining a fixed Cantonese sample recipe.
3. **Inputs are disconnected.** Seasonings, diet/allergy needs, maximum time, and most budget choices do not influence recipe output.
4. **No persistent recipe model.** Favorites, ratings, notes, and uploaded images are not associated with distinct saved recipes in durable storage.
5. **No real image generation.** The finished-dish visual is an emoji/CSS placeholder unless the user uploads a local image.

### Behavior defects and misleading states

1. The “My Recipes” count is hard-coded (`3/4`) rather than derived from saved data.
2. The ingredient-substitution button has no click handler.
3. If several tools are selected, only the first selected tool determines instructions and visual steps.
4. Currency amounts are independent fixed estimates, not converted values or ingredient-derived prices.
5. The “saved” confirmation can appear in a standalone browser even though no durable save occurs.
6. An uploaded image is held as an in-memory data URL and disappears on reload; file size is not limited or validated beyond `accept="image/*"`.
7. The source is an HTML fragment without `<!doctype>`, `<html>`, `<head>`, or `<body>`. Browsers generally infer a document shell, but this is not a complete production document.

### Compatibility, accessibility, and quality risks

1. The CSS uses modern `light-dark()` and `color-mix()` features, so older browsers may render differently.
2. On viewports at or below 760 px, the result panel is ordered before the input panel, which may confuse first-time users.
3. The script assumes every expected DOM element exists and has no recovery path if markup changes.
4. Labels and several ARIA attributes are present, but no keyboard, screen-reader, contrast, responsive-browser, or assistive-technology test suite exists.
5. There is no sanitization issue in the current ingredient/title path because values are assigned through `textContent`; however, hard-coded tool steps are inserted with `innerHTML`, which would require sanitization if those steps ever become external data.

## Startup commands

There are no install, build, or server commands because the prototype has no dependencies or build system.

After extracting the ZIP in PowerShell, open the prototype directly:

```powershell
Expand-Archive -LiteralPath '.\Recipe-Generator-Source.zip' -DestinationPath '.\Recipe-Generator-Source'
Start-Process -FilePath '.\Recipe-Generator-Source\src\recipe-generator-mockup.html'
```

Expected standalone behavior:

- The interface and local interactions should render in a modern browser.
- No external service or API is contacted.
- OpenAI-host widget-state persistence is unavailable outside a compatible host, so favorites, ratings, and notes do not survive reloads.
- There is no command-line server, development hot reload, production build, or automated test command.

## Test and inspection results

| Check | Result | Details |
|---|---|---|
| Initial configured-root inventory | PASS | Root contained 0 items; this confirms the missing-project condition rather than a hidden conventional repository. |
| Source readability/completeness | PASS | All 931 lines were read and reviewed. |
| Source hash | PASS | SHA-256 recorded above for byte-for-byte verification. |
| Inline JavaScript syntax | PASS | Extracted 1 script block and compiled it with Node.js v24.19.0 using `new Function(...)`. |
| Literal DOM ID references | PASS | 46 literal ID references checked against 52 defined IDs; 0 missing. |
| Gram-unit contract | PASS | The only `data-unit` value is `克`. |
| External URL/network primitive scan | PASS | 0 external URLs and 0 `fetch`/XMLHttpRequest/WebSocket references. |
| Obvious credential-pattern scan | PASS | 0 matches for common OpenAI, Google, GitHub, AWS, bearer-token, or private-key patterns. |
| Private-data pattern scan | PASS | 0 email addresses, embedded Windows paths, or IPv4 addresses in the source. |
| Automated unit/integration/end-to-end tests | NOT AVAILABLE | No tests or test runner exist in the recovered project. |
| Browser visual/interaction regression suite | NOT RUN | No standalone harness or browser automation suite exists. Static review does not prove pixel-perfect or assistive-technology behavior. |
| Live API tests | NOT APPLICABLE | No API integration exists. |

## Recommended next steps

No implementation work was performed during this audit. A future implementation pass should preserve the current interaction and visual concepts while adding functionality in this order:

1. **Establish a real application shell.** Choose and document the target (for example, a small web app), add a package manifest, source layout, README, linting, tests, and repeatable development/production commands.
2. **Define a typed recipe schema.** Model ingredients in grams, seasonings, servings, cuisine, flavor goals, tools, time, dietary restrictions, allergens, substitutions, steps, safety temperatures, costs, and image metadata.
3. **Implement validated recipe generation.** Add a server-side generation endpoint or deterministic recipe engine. Validate structured output and never expose provider keys in browser code.
4. **Make every form input functional.** Ensure ingredients, seasoning, cuisine, flavor, tools, serving count, time, dietary/allergy needs, and budget constraints all affect the result.
5. **Add food-safety guardrails.** Treat allergy requests as high-risk constraints, identify cross-contact limitations, and validate cooking temperatures and ingredient suitability against authoritative data.
6. **Add durable “My Recipes” storage.** Store distinct recipes with favorite state, rating, notes, dates, and optional photos. Provide a local-storage fallback if accounts are not yet implemented.
7. **Replace simulated budget math.** Define price-source geography/currency, pantry assumptions, uncertainty, substitutions, and a transparent calculation model.
8. **Add image and visual-cooking support.** Generate or source a finished-dish image and step visuals with clear loading, failure, safety, attribution, and caching behavior.
9. **Build automated coverage.** Add schema/unit tests, API contract tests, UI interaction tests, accessibility checks, responsive visual tests, and secret-scanning in CI.
10. **Run user acceptance testing.** Verify Cantonese wording, gram scaling, global cuisine quality, budget usefulness, tool constraints, and save/reload behavior with real recipes.

## Review ZIP contents and exclusions

The review ZIP is intentionally minimal because the configured root contained no original repository files.

Included:

```text
Recipe-Generator-Source.zip
├── .env.example
├── PROJECT_AUDIT.md
└── src/
    └── recipe-generator-mockup.html
```

Excluded:

- `.git` and other version-control internals
- `node_modules` and dependency caches
- build/dist outputs and caches
- Python/other virtual environments
- `.env` files
- API keys, tokens, credentials, and private user data

None of the excluded categories existed in the source artifact; the exclusion policy is also enforced when creating and verifying the ZIP.
