(function () {
  'use strict';

  const data = window.RecipeData;
  const engine = window.RecipeEngine;
  const libraryData = window.RecipeLibraryData;
  const library = window.RecipeLibrary;
  if (!data || !engine || !libraryData || !library) throw new Error('Recipe data and engine failed to load.');

  const ui = data.ui;
  const CJK = /[㐀-鿿]/;

  const STORAGE_KEY = 'recipe-generator.saved.v1';
  const DRAFT_KEY = 'recipe-generator.draft.v1';
  const MAX_SAVED_RECIPES = 50;

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    form: $('#recipe-form'),
    ingredients: $('#ingredients'),
    seasonings: $('#seasonings'),
    cuisine: $('#cuisine'),
    timeLimit: $('#time-limit'),
    servings: $('#servings'),
    customServingWrap: $('#custom-serving-wrap'),
    customServing: $('#custom-serving'),
    dietaryNeeds: $('#dietary-needs'),
    flavorGrid: $('#flavor-grid'),
    toolGrid: $('#tool-grid'),
    budgetMode: $('#budget-mode'),
    visualMode: $('#visual-mode'),
    budgetControls: $('#budget-controls'),
    currency: $('#currency'),
    budgetLimit: $('#budget-limit'),
    strictPantry: $('#strict-pantry'),
    matchOptions: $('#match-options'),
    matchOptionList: $('#match-option-list'),
    formError: $('#form-error'),
    loadExample: $('#load-example'),
    result: $('#recipe-result'),
    photo: $('#dish-photo'),
    photoLabel: $('#photo-label'),
    photoUpload: $('#photo-upload'),
    resultEyebrow: $('#result-eyebrow'),
    title: $('#recipe-title'),
    description: $('#recipe-description'),
    metaRow: $('#meta-row'),
    sourceNotice: $('#source-notice'),
    timeWarning: $('#time-warning'),
    measurementLabel: $('#measurement-label'),
    servingBadge: $('#serving-badge'),
    methodBadge: $('#method-badge'),
    ingredientList: $('#ingredient-list'),
    seasoningList: $('#seasoning-list'),
    methodList: $('#method-list'),
    visualCook: $('#visual-cook'),
    stepCounter: $('#step-counter'),
    progressTrack: $('.progress-track'),
    stepProgress: $('#step-progress'),
    stepIcon: $('#step-icon'),
    stepTime: $('#step-time'),
    stepTitle: $('#step-title'),
    stepText: $('#step-text'),
    stepPrev: $('#step-prev'),
    stepNext: $('#step-next'),
    budgetResult: $('#budget-result'),
    budgetCopy: $('#budget-copy'),
    budgetTotal: $('#budget-total'),
    budgetTips: $('#budget-tips'),
    budgetDisclaimer: $('#budget-disclaimer'),
    safetyList: $('#safety-list'),
    safetySource: $('#safety-source'),
    favoriteButton: $('#favorite-button'),
    ratingRow: $('#rating-row'),
    notes: $('#recipe-notes'),
    saveRecipe: $('#save-recipe'),
    saveStatus: $('#save-status'),
    openLibrary: $('#open-library'),
    libraryCountBadge: $('#library-count-badge'),
    libraryDialog: $('#library-dialog'),
    closeLibrary: $('#close-library'),
    librarySearch: $('#library-search'),
    libraryCuisine: $('#library-cuisine'),
    libraryServings: $('#library-servings'),
    libraryCustomServingWrap: $('#library-custom-serving-wrap'),
    libraryCustomServing: $('#library-custom-serving'),
    showDemoRecipes: $('#show-demo-recipes'),
    libraryResultCount: $('#library-result-count'),
    libraryGrid: $('#library-grid'),
    libraryLoadMore: $('#library-load-more'),
    openSaved: $('#open-saved'),
    savedCount: $('#saved-count'),
    savedDialog: $('#saved-dialog'),
    closeSaved: $('#close-saved'),
    savedList: $('#saved-list'),
    toast: $('#toast')
  };

  let selectedFlavor = 'soy-savory';
  let selectedTools = new Set(['wok', 'rice-cooker']);
  let currentRecipe = null;
  // The recipes found for the last form submission: the best library matches plus the generic recipe.
  let currentOptions = null;
  let currentStep = 0;
  let uploadedPhotoUrl = '';
  let toastTimer = null;
  let libraryVisibleLimit = 24;

  // Bilingual text -------------------------------------------------------------------------------
  // Cantonese first, English second. A pair is [Cantonese, English]; the English part may be empty
  // (recipes saved before the English version existed), in which case only Cantonese is shown.

  function textSpan(className, text, lang) {
    const span = document.createElement('span');
    span.className = className;
    if (lang) span.lang = lang;
    span.textContent = text;
    return span;
  }

  function bilingualNodes(zh, en, inline) {
    const nodes = [textSpan('zh', zh)];
    if (en) nodes.push(textSpan(inline ? 'en inline' : 'en', en, 'en'));
    return nodes;
  }

  function setBilingual(element, pair, inline) {
    element.replaceChildren(...bilingualNodes(pair[0], pair[1], inline));
  }

  // One line of plain text for attributes and dialogs, where markup is not possible.
  function plain(pair) {
    return pair[1] ? `${pair[0]} · ${pair[1]}` : pair[0];
  }

  function appendListItem(list, pair) {
    const item = document.createElement('li');
    item.append(...bilingualNodes(pair[0], pair[1]));
    list.append(item);
  }

  // Storage --------------------------------------------------------------------------------------

  function safeJsonParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed === null ? fallback : parsed;
    } catch (_error) {
      return fallback;
    }
  }

  function readSavedRecipes() {
    try {
      const recipes = safeJsonParse(localStorage.getItem(STORAGE_KEY), []);
      return Array.isArray(recipes) ? recipes : [];
    } catch (_error) {
      return [];
    }
  }

  function writeSavedRecipes(recipes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes.slice(0, MAX_SAVED_RECIPES)));
      updateSavedCount();
      return true;
    } catch (_error) {
      showToast(ui.saveFailed);
      return false;
    }
  }

  function showToast(pair) {
    setBilingual(elements.toast, pair);
    elements.toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 3000);
  }

  function createButton(className, content, attributes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    if (Array.isArray(content)) button.append(...bilingualNodes(content[0], content[1], true));
    else button.textContent = content;
    Object.entries(attributes || {}).forEach(([name, value]) => button.setAttribute(name, value));
    return button;
  }

  // Form -----------------------------------------------------------------------------------------

  function populateControls() {
    data.cuisines.forEach((cuisine) => {
      const option = document.createElement('option');
      option.value = cuisine.id;
      option.textContent = cuisine.label;
      elements.cuisine.append(option);
    });

    data.flavors.forEach((flavor) => {
      const button = createButton('choice-button', '', {
        'data-flavor': flavor.id,
        'aria-pressed': String(flavor.id === selectedFlavor),
        'aria-label': `${flavor.label} ${flavor.labelEn}：${flavor.description}；${flavor.descriptionEn}`
      });
      const icon = document.createElement('span');
      icon.className = 'choice-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = flavor.icon;
      const label = document.createElement('span');
      label.className = 'choice-label';
      label.append(...bilingualNodes(flavor.label, flavor.labelEn));
      button.append(icon, label);
      elements.flavorGrid.append(button);
    });

    data.tools.forEach((tool) => {
      const button = createButton('choice-button', '', {
        'data-tool': tool.id,
        'aria-pressed': String(selectedTools.has(tool.id)),
        'aria-label': tool.label
      });
      const icon = document.createElement('span');
      icon.className = 'choice-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = tool.icon;
      const label = document.createElement('span');
      label.className = 'choice-label';
      label.append(...bilingualNodes(tool.short, tool.shortEn));
      button.append(icon, label);
      elements.toolGrid.append(button);
    });

    for (let rating = 1; rating <= 5; rating += 1) {
      const button = createButton('rating-button', '★', {
        'data-rating': String(rating),
        'aria-label': plain(ui.stars(rating)),
        'aria-pressed': 'false'
      });
      elements.ratingRow.append(button);
    }
  }

  function getServings() {
    if (elements.servings.value !== 'custom') return Number(elements.servings.value);
    return engine.clamp(Math.round(Number(elements.customServing.value) || 1), 1, 30);
  }

  function getFormConfig() {
    return {
      ingredients: elements.ingredients.value,
      seasonings: elements.seasonings.value,
      cuisine: elements.cuisine.value,
      flavor: selectedFlavor,
      tools: [...selectedTools],
      servings: getServings(),
      timeLimit: Number(elements.timeLimit.value),
      dietaryNeeds: elements.dietaryNeeds.value,
      strictPantry: elements.strictPantry.checked,
      budgetEnabled: elements.budgetMode.checked,
      visualEnabled: elements.visualMode.checked,
      currency: elements.currency.value,
      budgetLimit: Number(elements.budgetLimit.value)
    };
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(getFormConfig()));
    } catch (_error) {
      // The app remains usable when local storage is unavailable.
    }
  }

  function restoreDraft() {
    let draft = null;
    try {
      draft = safeJsonParse(localStorage.getItem(DRAFT_KEY), null);
    } catch (_error) {
      return;
    }
    if (!draft || typeof draft !== 'object') return;
    if (typeof draft.ingredients === 'string') elements.ingredients.value = draft.ingredients;
    if (typeof draft.seasonings === 'string') elements.seasonings.value = draft.seasonings;
    if (data.cuisines.some((item) => item.id === draft.cuisine)) elements.cuisine.value = draft.cuisine;
    if (data.flavors.some((item) => item.id === draft.flavor)) selectedFlavor = draft.flavor;
    if (Array.isArray(draft.tools)) {
      const validTools = draft.tools.filter((id) => data.tools.some((item) => item.id === id));
      if (validTools.length) selectedTools = new Set(validTools);
    }
    const servings = engine.clamp(Math.round(Number(draft.servings) || 2), 1, 30);
    if (servings <= 6) elements.servings.value = String(servings);
    else {
      elements.servings.value = 'custom';
      elements.customServing.value = String(servings);
    }
    elements.customServingWrap.hidden = elements.servings.value !== 'custom';
    if ([20, 40, 60].includes(Number(draft.timeLimit))) elements.timeLimit.value = String(draft.timeLimit);
    if (typeof draft.dietaryNeeds === 'string') elements.dietaryNeeds.value = draft.dietaryNeeds;
    elements.strictPantry.checked = Boolean(draft.strictPantry);
    elements.budgetMode.checked = draft.budgetEnabled !== false;
    elements.visualMode.checked = draft.visualEnabled !== false;
    if (typeof draft.currency === 'string' && Object.prototype.hasOwnProperty.call(data.currencies, draft.currency)) elements.currency.value = draft.currency;
    if (Number(draft.budgetLimit) > 0) elements.budgetLimit.value = String(draft.budgetLimit);
    syncChoiceButtons();
    syncModes();
  }

  function syncChoiceButtons() {
    elements.flavorGrid.querySelectorAll('[data-flavor]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.flavor === selectedFlavor));
    });
    elements.toolGrid.querySelectorAll('[data-tool]').forEach((button) => {
      button.setAttribute('aria-pressed', String(selectedTools.has(button.dataset.tool)));
    });
  }

  function syncModes() {
    elements.budgetControls.hidden = !elements.budgetMode.checked;
    elements.budgetResult.hidden = !elements.budgetMode.checked || !currentRecipe || !currentRecipe.budget;
    elements.visualCook.hidden = !elements.visualMode.checked;
  }

  // Recipe ---------------------------------------------------------------------------------------

  function renderMeta(recipe) {
    elements.metaRow.replaceChildren();
    const minutes = ui.aboutMinutes(recipe.estimatedMinutes);
    const chips = recipe.importedMeta
      ? [
        [`${recipe.flavor.icon} ${recipe.flavor.label}`, recipe.flavor.labelEn],
        [`${recipe.tool.icon} ${recipe.tool.short}`, recipe.tool.shortEn],
        [`⏱ ${minutes[0]}`, minutes[1]],
        ['⚖ 克 / 毫升', 'g / ml'],
        [`ⓘ ${recipe.importedMeta.status[0]}`, recipe.importedMeta.status[1]]
      ]
      : [
        [`${recipe.flavor.icon} ${recipe.flavor.label}`, recipe.flavor.labelEn],
        [`${recipe.tool.icon} ${recipe.tool.short}`, recipe.tool.shortEn],
        [`⏱ ${minutes[0]}`, minutes[1]],
        [`⚖ ${ui.allInGrams[0]}`, ui.allInGrams[1]]
      ];
    chips.forEach(([zh, en]) => {
      const chip = document.createElement('span');
      chip.className = 'meta-chip';
      chip.append(...bilingualNodes(zh, en, true));
      elements.metaRow.append(chip);
    });
  }

  // The name is shown as typed; this is the same food in the other language, when it is known.
  function glossFor(item) {
    const gloss = CJK.test(item.name) ? item.nameEn : item.nameZh;
    if (!gloss) return '';
    return gloss.trim().toLowerCase() === String(item.name).trim().toLowerCase() ? '' : gloss;
  }

  function renderMeasuredList(target, items) {
    target.replaceChildren();
    items.forEach((item) => {
      const row = document.createElement('li');
      const copy = document.createElement('span');
      copy.className = 'item-copy';
      const name = document.createElement('span');
      name.className = 'item-name';
      name.textContent = item.name;
      copy.append(name);
      const gloss = glossFor(item);
      if (gloss) copy.append(textSpan('item-gloss', gloss, CJK.test(gloss) ? 'zh-Hant-HK' : 'en'));
      if (item.inferred || item.suggested) {
        const note = document.createElement('small');
        note.className = 'item-note';
        const pair = item.suggested ? ui.suggestedNote : ui.estimatedNote;
        note.append(...bilingualNodes(pair[0], pair[1], true));
        copy.append(note);
      }
      const amount = document.createElement('strong');
      if (Object.prototype.hasOwnProperty.call(item, 'quantity')) {
        if (item.quantity == null) {
          amount.textContent = item.sourceAmountExact || '—';
        } else {
          const value = Number.isInteger(item.quantity) ? item.quantity : Number(item.quantity).toFixed(1);
          const unitZh = item.unit === 'g' ? '克' : item.unit === 'ml' ? '毫升' : item.unit;
          amount.append(...bilingualNodes(`${value} ${unitZh}`, `${value} ${item.unit}`, true));
        }
      } else {
        amount.append(...bilingualNodes(engine.formatGrams(item.grams), engine.formatGramsEn(item.grams)));
      }
      row.append(copy, amount);
      target.append(row);
    });
  }

  function renderMethods(recipe) {
    elements.methodList.replaceChildren();
    recipe.steps.forEach((step) => {
      const row = document.createElement('li');
      const number = document.createElement('span');
      number.className = 'method-number';
      number.textContent = String(step.number);
      const copy = document.createElement('div');
      copy.className = 'method-copy';
      const title = document.createElement('h4');
      title.append(...bilingualNodes(`${step.icon} ${step.title}`, step.titleEn));
      const text = document.createElement('p');
      text.append(...bilingualNodes(step.text, step.textEn));
      copy.append(title, text);
      const time = document.createElement('span');
      time.className = 'method-time';
      if (Number.isFinite(step.minutes)) time.append(...bilingualNodes(...ui.minutes(step.minutes)));
      else time.hidden = true;
      row.append(number, copy, time);
      elements.methodList.append(row);
    });
  }

  function renderVisualStep() {
    if (!currentRecipe || !currentRecipe.steps.length) return;
    currentStep = engine.clamp(currentStep, 0, currentRecipe.steps.length - 1);
    const step = currentRecipe.steps[currentStep];
    const total = currentRecipe.steps.length;
    elements.stepCounter.textContent = `${currentStep + 1} / ${total}`;
    elements.progressTrack.setAttribute('aria-valuemax', String(total));
    elements.progressTrack.setAttribute('aria-valuenow', String(currentStep + 1));
    elements.stepProgress.style.width = `${((currentStep + 1) / total) * 100}%`;
    elements.stepIcon.textContent = step.icon;
    setBilingual(elements.stepTime, Number.isFinite(step.minutes) ? ui.aboutMinutes(step.minutes) : ['每步時間未提供', 'Per-step time not provided'], true);
    setBilingual(elements.stepTitle, [step.title, step.titleEn]);
    setBilingual(elements.stepText, [step.text, step.textEn]);
    elements.stepPrev.disabled = currentStep === 0;
    elements.stepNext.disabled = currentStep === total - 1;
  }

  function renderBudget(recipe) {
    const budget = recipe.budget;
    if (!budget) {
      elements.budgetResult.hidden = true;
      return;
    }
    const money = (value) => engine.formatMoney(budget, value);
    elements.budgetTotal.textContent = money(budget.total);
    setBilingual(elements.budgetCopy, ui.budgetCopy(recipe.servings, money(budget.perPerson), budget.limit ? money(budget.limit) : ''));
    elements.budgetResult.style.setProperty('border-left', budget.over ? '4px solid #b54637' : '4px solid #3b9b6b');
    elements.budgetTips.replaceChildren();
    if (budget.over) {
      appendListItem(elements.budgetTips, ui.overBudget);
      const english = budget.substitutionsEn || [];
      budget.substitutions.forEach((tip, index) => appendListItem(elements.budgetTips, [tip, english[index]]));
    } else {
      appendListItem(elements.budgetTips, budget.limit ? ui.withinBudget : ui.enterBudgetLimit);
    }
    setBilingual(elements.budgetDisclaimer, [budget.disclaimer, budget.disclaimerEn]);
  }

  function renderSafety(recipe) {
    elements.safetyList.replaceChildren();
    const temperatures = recipe.safety.temperatures || [];
    const temperaturesEn = recipe.safety.temperaturesEn || [];
    const warningsEn = recipe.safety.warningsEn || [];
    const trimTerminalPunctuation = (text) => String(text || '').replace(/[。.!]+$/g, '');
    const items = [
      ...temperatures.map((text, index) => ui.thermometer(trimTerminalPunctuation(text), trimTerminalPunctuation(temperaturesEn[index]))),
      ...recipe.safety.warnings.map((text, index) => [text, warningsEn[index]])
    ];
    if (!temperatures.length) items.unshift(ui.cookThoroughly);
    items.forEach((pair) => appendListItem(elements.safetyList, pair));
    elements.safetySource.href = data.healthCanadaUrl;
  }

  function renderPersonal(recipe) {
    elements.favoriteButton.setAttribute('aria-pressed', String(Boolean(recipe.favorite)));
    const heart = document.createElement('span');
    heart.setAttribute('aria-hidden', 'true');
    heart.textContent = recipe.favorite ? '♥' : '♡';
    const label = recipe.favorite ? ui.favorited : ui.favorite;
    elements.favoriteButton.replaceChildren(heart, ' ', ...bilingualNodes(label[0], label[1], true));
    elements.ratingRow.querySelectorAll('[data-rating]').forEach((button) => {
      const active = Number(button.dataset.rating) <= Number(recipe.rating || 0);
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(Number(button.dataset.rating) === Number(recipe.rating || 0)));
    });
    elements.notes.value = recipe.notes || '';
    elements.saveStatus.textContent = '';
  }

  function renderRecipe(recipe) {
    currentRecipe = recipe;
    currentStep = 0;
    uploadedPhotoUrl = '';
    elements.photo.src = recipe.image;
    elements.photo.alt = plain([recipe.imageAlt, recipe.imageAltEn]);
    if (recipe.importedMeta) {
      setBilingual(elements.photoLabel, ['成品圖片 · 未有授權相片', 'Finished dish · no licensed photo']);
      setBilingual(elements.measurementLabel, ['保留克或毫升', 'Source units: g or ml'], true);
      const incomplete = recipe.importedMeta.incompleteEnglishMethod
        ? [' 英文步驟比廣東話版本少；畫面只顯示來源有提供嘅內容。', ' The English method has fewer steps than the Cantonese version; only supplied content is shown.']
        : ['', ''];
      const matched = recipe.importedMeta.matchNotice
        ? [`${recipe.importedMeta.matchNotice[0]} `, `${recipe.importedMeta.matchNotice[1]} `]
        : ['', ''];
      setBilingual(elements.sourceNotice.querySelector('p'), [
        `${matched[0]}${recipe.importedMeta.notice[0]}${incomplete[0]}`,
        `${matched[1]}${recipe.importedMeta.notice[1]}${incomplete[1]}`
      ]);
      elements.sourceNotice.hidden = false;
    } else {
      setBilingual(elements.photoLabel, ['成品圖片 · 擺盤示意', 'Finished dish · plating example']);
      setBilingual(elements.measurementLabel, [ui.allInGrams[0], ui.allInGrams[1]], true);
      // A generic recipe made for a form submission says why it is generic.
      if (recipe.genericNotice) {
        setBilingual(elements.sourceNotice.querySelector('p'), recipe.genericNotice);
        elements.sourceNotice.hidden = false;
      } else {
        elements.sourceNotice.hidden = true;
      }
    }
    const servings = ui.servings(recipe.servings);
    const minutes = ui.aboutMinutes(recipe.estimatedMinutes);
    elements.resultEyebrow.textContent = `${plain([recipe.cuisine.label, recipe.cuisine.labelEn])} · ${plain(servings)}`;
    setBilingual(elements.title, [recipe.title, recipe.titleEn]);
    setBilingual(elements.description, [recipe.description, recipe.descriptionEn]);
    setBilingual(elements.servingBadge, servings, true);
    setBilingual(
      elements.methodBadge,
      [`${recipe.tool.short} · ${minutes[0]}`, recipe.tool.shortEn ? `${recipe.tool.shortEn} · ${minutes[1]}` : ''],
      true
    );
    renderMeta(recipe);
    renderMeasuredList(elements.ingredientList, recipe.ingredients);
    renderMeasuredList(elements.seasoningList, recipe.seasonings);
    renderMethods(recipe);
    elements.timeWarning.hidden = !recipe.timeWarning;
    setBilingual(elements.timeWarning.querySelector('p'), [recipe.timeWarning, recipe.timeWarningEn]);
    renderVisualStep();
    renderBudget(recipe);
    renderSafety(recipe);
    renderPersonal(recipe);
    syncModes();
  }

  // Matching the form to the library -------------------------------------------------------------

  const MAX_LIBRARY_OPTIONS = 4;

  // Library recipes keep their own supplied steps; the generic recipe is built from every typed item.
  function recipeForOption(config, option) {
    if (option.kind === 'library') {
      return library.toAppRecipe(option.candidate.record, config.servings, { config, match: option.candidate });
    }
    const recipe = engine.generateRecipe(config);
    recipe.genericNotice = ui.genericChosenNotice;
    return recipe;
  }

  // Why the generic recipe is shown, plus what to change to get a library recipe.
  function fallbackNotice(config) {
    const hints = library.explainNoMatch(libraryData.recipes, config);
    return [
      [ui.fallbackNotice[0], ...hints.map((hint) => hint[0])].join(' '),
      [ui.fallbackNotice[1], ...hints.map((hint) => hint[1])].join(' ')
    ];
  }

  function renderOptions() {
    elements.matchOptionList.replaceChildren();
    if (!currentOptions) {
      elements.matchOptions.hidden = true;
      return;
    }
    const mainCount = library.splitInput(currentOptions.config.ingredients).length;
    currentOptions.items.forEach((option, index) => {
      const active = index === currentOptions.active;
      const item = document.createElement('li');
      const button = createButton('match-option', '', {
        'data-option': String(index),
        'aria-pressed': String(active)
      });
      const title = document.createElement('span');
      title.className = 'match-option-title';
      const meta = document.createElement('span');
      meta.className = 'match-option-meta';
      if (option.kind === 'library') {
        const record = option.candidate.record;
        title.append(...bilingualNodes(record.title_zh_hant, record.title_en));
        const uses = ui.optionUses(mainCount - option.candidate.unusedMain.length, mainCount);
        const missing = ui.optionMissing(option.candidate.missing.length);
        meta.append(...bilingualNodes(`${uses[0]} · ${missing[0]}`, `${uses[1]} · ${missing[1]}`));
      } else {
        title.append(...bilingualNodes(ui.optionGenericTitle[0], ui.optionGenericTitle[1]));
        meta.append(...bilingualNodes(ui.optionGenericNote[0], ui.optionGenericNote[1]));
      }
      button.append(title, meta);
      if (active) {
        const flag = document.createElement('span');
        flag.className = 'match-option-flag';
        flag.append(...bilingualNodes(ui.optionShowing[0], ui.optionShowing[1], true));
        button.append(flag);
      }
      item.append(button);
      elements.matchOptionList.append(item);
    });
    elements.matchOptions.hidden = false;
  }

  function showOption(index) {
    if (!currentOptions || index === currentOptions.active || !currentOptions.items[index]) return;
    currentOptions.active = index;
    renderRecipe(recipeForOption(currentOptions.config, currentOptions.items[index]));
    renderOptions();
    elements.result.scrollTop = 0;
    if (window.matchMedia('(max-width: 1120px)').matches) {
      elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    showToast(ui.optionSwitched);
  }

  function generate(options) {
    const shouldScroll = Boolean(options && options.scroll);
    try {
      const config = getFormConfig();
      // Without a main ingredient the generator below reports the bilingual "enter an ingredient" error.
      const ranked = library.splitInput(config.ingredients).length
        ? library.rankRecipes(libraryData.recipes, config)
        : [];
      let recipe;
      if (ranked.length) {
        const items = ranked.slice(0, MAX_LIBRARY_OPTIONS).map((candidate) => ({ kind: 'library', candidate }));
        items.push({ kind: 'generic' });
        currentOptions = { config, items, active: 0 };
        recipe = recipeForOption(config, items[0]);
      } else {
        currentOptions = null;
        recipe = engine.generateRecipe(config);
        recipe.genericNotice = fallbackNotice(config);
      }
      elements.formError.hidden = true;
      saveDraft();
      renderRecipe(recipe);
      renderOptions();
      if (shouldScroll && ranked.length) showToast(ui.libraryRecipeMatched);
      if (shouldScroll && window.matchMedia('(max-width: 1120px)').matches) {
        elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return recipe;
    } catch (error) {
      const known = error instanceof Error && error.messageEn;
      setBilingual(elements.formError, known ? [error.message, error.messageEn] : ui.generateFailed);
      elements.formError.hidden = false;
      elements.ingredients.focus();
      return null;
    }
  }

  // Imported recipe library ---------------------------------------------------------------------

  function getLibraryServings() {
    if (elements.libraryServings.value !== 'custom') return Number(elements.libraryServings.value);
    return engine.clamp(Math.round(Number(elements.libraryCustomServing.value) || 1), 1, 30);
  }

  function populateLibraryControls() {
    library.cuisineOptions(libraryData.recipes).forEach((cuisine) => {
      const option = document.createElement('option');
      option.value = cuisine;
      option.textContent = cuisine === 'Cantonese' ? '廣東菜 · Cantonese' : cuisine;
      elements.libraryCuisine.append(option);
    });
    elements.libraryCountBadge.textContent = String(libraryData.counts.visibleByDefault);
  }

  function librarySearchResults() {
    return library.search(libraryData.recipes, {
      query: elements.librarySearch.value,
      cuisine: elements.libraryCuisine.value,
      includeDemos: elements.showDemoRecipes.checked
    });
  }

  function renderLibraryCard(record) {
    const status = library.statusFor(record);
    const scope = library.scopeOf(record);
    const card = document.createElement('article');
    card.className = `library-card library-card-${scope}`;

    const visual = document.createElement('div');
    visual.className = 'library-card-visual';
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = scope === 'cantonese_editorial' ? '🥢' : '🧪';

    const content = document.createElement('div');
    content.className = 'library-card-content';
    const top = document.createElement('div');
    top.className = 'library-card-top';
    const id = document.createElement('span');
    id.className = 'library-id';
    id.textContent = record.id;
    const badge = document.createElement('span');
    badge.className = `library-status library-status-${scope}`;
    badge.append(...bilingualNodes(status.short[0], status.short[1], true));
    top.append(id, badge);

    const title = document.createElement('h3');
    title.append(...bilingualNodes(record.title_zh_hant, record.title_en));

    const meta = document.createElement('p');
    meta.className = 'library-card-meta';
    const totalMinutes = Number(record.total_minutes) || Number(record.prep_minutes || 0) + Number(record.cook_minutes || 0);
    meta.append(...bilingualNodes(
      `${record.flavor_name_zh_hant || ''} · ${record.servings} 人 · ${totalMinutes} 分鐘`,
      `${record.flavor_name_en || ''} · ${record.servings} servings · ${totalMinutes} min`
    ));

    const mainItems = (record.ingredients || []).filter((item) => item.role !== 'seasoning').slice(0, 4);
    const preview = document.createElement('p');
    preview.className = 'library-card-ingredients';
    preview.append(...bilingualNodes(
      `材料：${mainItems.map((item) => item.name_zh_hant || item.name).join('、')}`,
      `Ingredients: ${mainItems.map((item) => item.name_en || item.name).join(', ')}`
    ));

    const open = createButton('primary-button compact library-open', ['開啟食譜', 'Open recipe'], {
      'data-library-id': record.id
    });
    content.append(top, title, meta, preview, open);
    card.append(visual, content);
    return card;
  }

  function renderLibrary(options) {
    if (options && options.reset) libraryVisibleLimit = 24;
    const results = librarySearchResults();
    const shown = results.slice(0, libraryVisibleLimit);
    elements.libraryGrid.replaceChildren(...shown.map(renderLibraryCard));
    setBilingual(elements.libraryResultCount, [
      `搵到 ${results.length} 款；而家顯示 ${shown.length} 款`,
      `${results.length} found; showing ${shown.length}`
    ], true);
    elements.libraryLoadMore.hidden = shown.length >= results.length;
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state library-empty';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '🔎';
      const copy = document.createElement('p');
      copy.append(...bilingualNodes('未搵到相符食譜，試吓其他名稱或材料。', 'No matching recipe. Try another title or ingredient.'));
      empty.append(icon, copy);
      elements.libraryGrid.append(empty);
    }
  }

  function openLibraryDialog() {
    renderLibrary({ reset: true });
    if (typeof elements.libraryDialog.showModal === 'function') elements.libraryDialog.showModal();
    else elements.libraryDialog.setAttribute('open', '');
    window.setTimeout(() => elements.librarySearch.focus(), 0);
  }

  function closeLibraryDialog() {
    if (typeof elements.libraryDialog.close === 'function') elements.libraryDialog.close();
    else elements.libraryDialog.removeAttribute('open');
  }

  function openLibraryRecipe(id) {
    const record = libraryData.recipes.find((item) => item.id === id);
    if (!record) return;
    const servings = getLibraryServings();
    const recipe = library.toAppRecipe(record, servings);
    if (servings <= 6) elements.servings.value = String(servings);
    else {
      elements.servings.value = 'custom';
      elements.customServing.value = String(servings);
    }
    elements.customServingWrap.hidden = elements.servings.value !== 'custom';
    currentOptions = null;
    renderRecipe(recipe);
    renderOptions();
    closeLibraryDialog();
    elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(['已開啟匯入食譜', 'Imported recipe opened']);
  }

  // Saved recipes --------------------------------------------------------------------------------

  function upsertCurrentRecipe(message) {
    if (!currentRecipe) return false;
    currentRecipe.notes = elements.notes.value.trim();
    const recipes = readSavedRecipes();
    const index = recipes.findIndex((recipe) => recipe.id === currentRecipe.id);
    if (index >= 0) recipes.splice(index, 1);
    recipes.unshift(currentRecipe);
    if (!writeSavedRecipes(recipes)) return false;
    setBilingual(elements.saveStatus, ui.saved, true);
    window.setTimeout(() => { elements.saveStatus.textContent = ''; }, 1800);
    showToast(message || ui.recipeSaved);
    return true;
  }

  function persistIfAlreadySaved() {
    if (!currentRecipe) return;
    const recipes = readSavedRecipes();
    const index = recipes.findIndex((recipe) => recipe.id === currentRecipe.id);
    if (index < 0) return;
    currentRecipe.notes = elements.notes.value.trim();
    recipes[index] = currentRecipe;
    writeSavedRecipes(recipes);
  }

  function updateSavedCount() {
    elements.savedCount.textContent = String(readSavedRecipes().length);
  }

  function formatSavedDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return ui.unknownDate;
    const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return [new Intl.DateTimeFormat('zh-HK', options).format(date), new Intl.DateTimeFormat('en', options).format(date)];
  }

  function renderSavedRecipes() {
    const recipes = readSavedRecipes();
    elements.savedList.replaceChildren();
    if (!recipes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '🍲';
      const text = document.createElement('p');
      text.append(...bilingualNodes(...ui.emptySaved));
      empty.append(icon, text);
      elements.savedList.append(empty);
      return;
    }

    recipes.forEach((recipe) => {
      const card = document.createElement('article');
      card.className = 'saved-card';
      card.dataset.id = recipe.id;
      const image = document.createElement('img');
      image.src = recipe.image || 'assets/dish-east-asian.png';
      image.alt = '';
      const copy = document.createElement('div');
      const title = document.createElement('h3');
      const heart = recipe.favorite ? '♥ ' : '';
      title.append(...bilingualNodes(
        `${heart}${recipe.title || ui.untitled[0]}`,
        recipe.title ? recipe.titleEn : ui.untitled[1]
      ));
      const meta = document.createElement('p');
      const people = recipe.servings || '?';
      const date = formatSavedDate(recipe.createdAt);
      const stars = recipe.rating ? ui.stars(recipe.rating) : null;
      meta.append(...bilingualNodes(
        `${people} 人 · ${stars ? `${stars[0]} · ` : ''}${date[0]}`,
        `${people} ${Number(people) === 1 ? 'person' : 'people'} · ${stars ? `${stars[1]} · ` : ''}${date[1] || date[0]}`
      ));
      copy.append(title, meta);
      const actions = document.createElement('div');
      actions.className = 'saved-card-actions';
      const load = createButton('', ui.open, { 'data-action': 'load', 'data-id': recipe.id });
      const remove = createButton('delete-button', ui.remove, { 'data-action': 'delete', 'data-id': recipe.id });
      actions.append(load, remove);
      card.append(image, copy, actions);
      elements.savedList.append(card);
    });
  }

  function applyRecipeToForm(recipe) {
    const source = recipe.sourceInput || {};
    if (typeof source.ingredients === 'string') elements.ingredients.value = source.ingredients;
    if (typeof source.seasonings === 'string') elements.seasonings.value = source.seasonings;
    if (data.cuisines.some((item) => item.id === source.cuisine)) elements.cuisine.value = source.cuisine;
    if (data.flavors.some((item) => item.id === source.flavor)) selectedFlavor = source.flavor;
    if (Array.isArray(source.tools) && source.tools.length) selectedTools = new Set(source.tools);
    const servings = Number(recipe.servings) || 2;
    if (servings <= 6) elements.servings.value = String(servings);
    else {
      elements.servings.value = 'custom';
      elements.customServing.value = String(servings);
    }
    elements.customServingWrap.hidden = elements.servings.value !== 'custom';
    elements.timeLimit.value = [20, 40, 60].includes(Number(recipe.timeLimit)) ? String(recipe.timeLimit) : '40';
    elements.dietaryNeeds.value = recipe.dietaryNeeds || '';
    elements.strictPantry.checked = Boolean(source.strictPantry);
    elements.budgetMode.checked = recipe.budgetEnabled !== false;
    elements.visualMode.checked = recipe.visualEnabled !== false;
    if (recipe.budget && Object.prototype.hasOwnProperty.call(data.currencies, recipe.budget.currency)) elements.currency.value = recipe.budget.currency;
    if (recipe.budget && recipe.budget.limit) elements.budgetLimit.value = String(recipe.budget.limit);
    syncChoiceButtons();
    syncModes();
  }

  function openSavedDialog() {
    renderSavedRecipes();
    if (typeof elements.savedDialog.showModal === 'function') elements.savedDialog.showModal();
    else elements.savedDialog.setAttribute('open', '');
  }

  function closeSavedDialog() {
    if (typeof elements.savedDialog.close === 'function') elements.savedDialog.close();
    else elements.savedDialog.removeAttribute('open');
  }

  // Events ---------------------------------------------------------------------------------------

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    generate({ scroll: true });
  });

  elements.flavorGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-flavor]');
    if (!button) return;
    selectedFlavor = button.dataset.flavor;
    syncChoiceButtons();
  });

  elements.toolGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tool]');
    if (!button) return;
    const id = button.dataset.tool;
    if (selectedTools.has(id)) {
      if (selectedTools.size === 1) {
        showToast(ui.keepOneTool);
        return;
      }
      selectedTools.delete(id);
    } else selectedTools.add(id);
    syncChoiceButtons();
  });

  elements.servings.addEventListener('change', () => {
    elements.customServingWrap.hidden = elements.servings.value !== 'custom';
    if (elements.servings.value === 'custom') elements.customServing.focus();
  });

  elements.customServing.addEventListener('change', () => {
    elements.customServing.value = String(getServings());
  });

  elements.budgetMode.addEventListener('change', syncModes);
  elements.visualMode.addEventListener('change', syncModes);

  elements.stepPrev.addEventListener('click', () => {
    currentStep -= 1;
    renderVisualStep();
  });

  elements.stepNext.addEventListener('click', () => {
    currentStep += 1;
    renderVisualStep();
  });

  elements.favoriteButton.addEventListener('click', () => {
    if (!currentRecipe) return;
    currentRecipe.favorite = !currentRecipe.favorite;
    renderPersonal(currentRecipe);
    upsertCurrentRecipe(currentRecipe.favorite ? ui.favoriteAdded : ui.favoriteRemoved);
  });

  elements.ratingRow.addEventListener('click', (event) => {
    const button = event.target.closest('[data-rating]');
    if (!button || !currentRecipe) return;
    currentRecipe.rating = Number(button.dataset.rating);
    renderPersonal(currentRecipe);
    persistIfAlreadySaved();
  });

  elements.notes.addEventListener('input', () => {
    if (currentRecipe) currentRecipe.notes = elements.notes.value;
  });

  elements.saveRecipe.addEventListener('click', () => upsertCurrentRecipe());

  elements.matchOptionList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-option]');
    if (button) showOption(Number(button.dataset.option));
  });

  elements.openLibrary.addEventListener('click', openLibraryDialog);
  elements.closeLibrary.addEventListener('click', closeLibraryDialog);
  elements.libraryDialog.addEventListener('click', (event) => {
    if (event.target === elements.libraryDialog) closeLibraryDialog();
  });
  elements.librarySearch.addEventListener('input', () => renderLibrary({ reset: true }));
  elements.libraryCuisine.addEventListener('change', () => renderLibrary({ reset: true }));
  elements.showDemoRecipes.addEventListener('change', () => renderLibrary({ reset: true }));
  elements.libraryServings.addEventListener('change', () => {
    elements.libraryCustomServingWrap.hidden = elements.libraryServings.value !== 'custom';
    if (elements.libraryServings.value === 'custom') elements.libraryCustomServing.focus();
  });
  elements.libraryCustomServing.addEventListener('change', () => {
    elements.libraryCustomServing.value = String(getLibraryServings());
  });
  elements.libraryGrid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-library-id]');
    if (button) openLibraryRecipe(button.dataset.libraryId);
  });
  elements.libraryLoadMore.addEventListener('click', () => {
    libraryVisibleLimit += 24;
    renderLibrary();
  });

  elements.openSaved.addEventListener('click', openSavedDialog);
  elements.closeSaved.addEventListener('click', closeSavedDialog);

  elements.savedDialog.addEventListener('click', (event) => {
    if (event.target === elements.savedDialog) closeSavedDialog();
  });

  elements.savedList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const recipes = readSavedRecipes();
    const recipe = recipes.find((item) => item.id === button.dataset.id);
    if (!recipe) return;
    if (button.dataset.action === 'load') {
      applyRecipeToForm(recipe);
      currentOptions = null;
      renderRecipe(recipe);
      renderOptions();
      closeSavedDialog();
      elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast(ui.savedOpened);
      return;
    }
    if (button.dataset.action === 'delete') {
      const [zh, en] = ui.confirmDelete(recipe.title, recipe.titleEn);
      if (!window.confirm(en ? `${zh}\n${en}` : zh)) return;
      writeSavedRecipes(recipes.filter((item) => item.id !== recipe.id));
      renderSavedRecipes();
      showToast(ui.recipeDeleted);
    }
  });

  elements.photoUpload.addEventListener('change', () => {
    const file = elements.photoUpload.files && elements.photoUpload.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast(ui.chooseImage);
      elements.photoUpload.value = '';
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      showToast(ui.imageTooLarge);
      elements.photoUpload.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      uploadedPhotoUrl = String(reader.result || '');
      elements.photo.src = uploadedPhotoUrl;
      elements.photo.alt = plain(ui.uploadedPhotoAlt);
      showToast(ui.photoPreviewOnly);
    });
    reader.readAsDataURL(file);
  });

  elements.loadExample.addEventListener('click', () => {
    elements.ingredients.value = '牛肉、菜心';
    elements.seasonings.value = '蒜蓉、生抽、蠔油、紹興酒、生粉、花生油';
    elements.cuisine.value = 'cantonese';
    elements.timeLimit.value = '40';
    elements.servings.value = '2';
    elements.customServingWrap.hidden = true;
    elements.dietaryNeeds.value = '';
    elements.strictPantry.checked = false;
    selectedFlavor = 'soy-savory';
    selectedTools = new Set(['wok', 'rice-cooker']);
    elements.budgetMode.checked = true;
    elements.visualMode.checked = true;
    elements.currency.value = 'CAD';
    elements.budgetLimit.value = '15';
    syncChoiceButtons();
    syncModes();
    generate({ scroll: false });
    showToast(ui.exampleLoaded);
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) updateSavedCount();
  });

  populateControls();
  populateLibraryControls();
  restoreDraft();
  updateSavedCount();
  generate({ scroll: false });
})();
