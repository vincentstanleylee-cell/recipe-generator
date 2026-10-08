(function () {
  'use strict';

  const data = window.RecipeData;
  const engine = window.RecipeEngine;
  if (!data || !engine) throw new Error('Recipe data and engine failed to load.');

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
    formError: $('#form-error'),
    loadExample: $('#load-example'),
    result: $('#recipe-result'),
    photo: $('#dish-photo'),
    photoUpload: $('#photo-upload'),
    resultEyebrow: $('#result-eyebrow'),
    title: $('#recipe-title'),
    description: $('#recipe-description'),
    metaRow: $('#meta-row'),
    timeWarning: $('#time-warning'),
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
    openSaved: $('#open-saved'),
    savedCount: $('#saved-count'),
    savedDialog: $('#saved-dialog'),
    closeSaved: $('#close-saved'),
    savedList: $('#saved-list'),
    toast: $('#toast')
  };

  let selectedFlavor = 'ginger-scallion';
  let selectedTools = new Set(['wok', 'rice-cooker']);
  let currentRecipe = null;
  let currentStep = 0;
  let uploadedPhotoUrl = '';
  let toastTimer = null;

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
      showToast('未能儲存。瀏覽器可能封鎖咗本機儲存。');
      return false;
    }
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('show'), 2400);
  }

  function createButton(className, text, attributes) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    Object.entries(attributes || {}).forEach(([name, value]) => button.setAttribute(name, value));
    return button;
  }

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
        'aria-label': `${flavor.label}：${flavor.description}`
      });
      const icon = document.createElement('span');
      icon.className = 'choice-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = flavor.icon;
      const label = document.createElement('span');
      label.textContent = flavor.label;
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
      label.textContent = tool.label;
      button.append(icon, label);
      elements.toolGrid.append(button);
    });

    for (let rating = 1; rating <= 5; rating += 1) {
      const button = createButton('rating-button', '★', {
        'data-rating': String(rating),
        'aria-label': `${rating} 星`,
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
    elements.budgetResult.hidden = !elements.budgetMode.checked;
    elements.visualCook.hidden = !elements.visualMode.checked;
  }

  function renderMeta(recipe) {
    elements.metaRow.replaceChildren();
    const chips = [
      `${recipe.flavor.icon} ${recipe.flavor.label}`,
      `${recipe.tool.icon} ${recipe.tool.short}`,
      `⏱ 約 ${recipe.estimatedMinutes} 分鐘`,
      `⚖ 全部用克`
    ];
    chips.forEach((text) => {
      const chip = document.createElement('span');
      chip.className = 'meta-chip';
      chip.textContent = text;
      elements.metaRow.append(chip);
    });
  }

  function renderMeasuredList(target, items) {
    target.replaceChildren();
    items.forEach((item) => {
      const row = document.createElement('li');
      const copy = document.createElement('span');
      copy.textContent = item.name;
      if (item.inferred || item.suggested) {
        const note = document.createElement('small');
        note.className = 'item-note';
        note.textContent = item.suggested ? '配合口味嘅建議' : '按份量估算';
        copy.append(note);
      }
      const amount = document.createElement('strong');
      amount.textContent = engine.formatGrams(item.grams);
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
      title.textContent = `${step.icon} ${step.title}`;
      const text = document.createElement('p');
      text.textContent = step.text;
      copy.append(title, text);
      const time = document.createElement('span');
      time.className = 'method-time';
      time.textContent = `${step.minutes} 分鐘`;
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
    elements.stepTime.textContent = `約 ${step.minutes} 分鐘`;
    elements.stepTitle.textContent = step.title;
    elements.stepText.textContent = step.text;
    elements.stepPrev.disabled = currentStep === 0;
    elements.stepNext.disabled = currentStep === total - 1;
  }

  function renderBudget(recipe) {
    const budget = recipe.budget;
    elements.budgetTotal.textContent = engine.formatMoney(budget, budget.total);
    elements.budgetCopy.textContent = `${recipe.servings} 人份，約每人 ${engine.formatMoney(budget, budget.perPerson)}。${budget.limit ? `你嘅上限係 ${engine.formatMoney(budget, budget.limit)}。` : ''}`;
    elements.budgetResult.style.setProperty('border-left', budget.over ? '4px solid #b54637' : '4px solid #3b9b6b');
    elements.budgetTips.replaceChildren();
    if (budget.over) {
      const lead = document.createElement('li');
      lead.textContent = '估算超出預算，可以試下：';
      elements.budgetTips.append(lead);
      budget.substitutions.forEach((tip) => {
        const item = document.createElement('li');
        item.textContent = tip;
        elements.budgetTips.append(item);
      });
    } else {
      const item = document.createElement('li');
      item.textContent = budget.limit ? '估算在預算內。' : '輸入預算上限就可以比較。';
      elements.budgetTips.append(item);
    }
    elements.budgetDisclaimer.textContent = budget.disclaimer;
  }

  function renderSafety(recipe) {
    elements.safetyList.replaceChildren();
    const items = [
      ...recipe.safety.temperatures.map((text) => `用數碼溫度計量最厚位置：${text}。`),
      ...recipe.safety.warnings
    ];
    if (!recipe.safety.temperatures.length) {
      items.unshift('徹底煮熟食材；生熟食物、砧板同用具要分開。');
    }
    items.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      elements.safetyList.append(item);
    });
    elements.safetySource.href = data.healthCanadaUrl;
  }

  function renderPersonal(recipe) {
    elements.favoriteButton.setAttribute('aria-pressed', String(Boolean(recipe.favorite)));
    elements.favoriteButton.innerHTML = `<span aria-hidden="true">${recipe.favorite ? '♥' : '♡'}</span> ${recipe.favorite ? '已收藏' : '收藏'}`;
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
    elements.photo.alt = recipe.imageAlt;
    elements.resultEyebrow.textContent = `${recipe.cuisine.label} · ${recipe.servings} 人份`;
    elements.title.textContent = recipe.title;
    elements.description.textContent = recipe.description;
    elements.servingBadge.textContent = `${recipe.servings} 人份`;
    elements.methodBadge.textContent = `${recipe.tool.short} · 約 ${recipe.estimatedMinutes} 分鐘`;
    renderMeta(recipe);
    renderMeasuredList(elements.ingredientList, recipe.ingredients);
    renderMeasuredList(elements.seasoningList, recipe.seasonings);
    renderMethods(recipe);
    elements.timeWarning.hidden = !recipe.timeWarning;
    elements.timeWarning.querySelector('p').textContent = recipe.timeWarning;
    renderVisualStep();
    renderBudget(recipe);
    renderSafety(recipe);
    renderPersonal(recipe);
    syncModes();
  }

  function generate(options) {
    const shouldScroll = Boolean(options && options.scroll);
    try {
      const recipe = engine.generateRecipe(getFormConfig());
      elements.formError.hidden = true;
      saveDraft();
      renderRecipe(recipe);
      if (shouldScroll && window.matchMedia('(max-width: 1120px)').matches) {
        elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return recipe;
    } catch (error) {
      elements.formError.textContent = error instanceof Error ? error.message : '未能生成食譜，請檢查輸入。';
      elements.formError.hidden = false;
      elements.ingredients.focus();
      return null;
    }
  }

  function upsertCurrentRecipe(message) {
    if (!currentRecipe) return false;
    currentRecipe.notes = elements.notes.value.trim();
    const recipes = readSavedRecipes();
    const index = recipes.findIndex((recipe) => recipe.id === currentRecipe.id);
    if (index >= 0) recipes.splice(index, 1);
    recipes.unshift(currentRecipe);
    if (!writeSavedRecipes(recipes)) return false;
    elements.saveStatus.textContent = '已儲存';
    window.setTimeout(() => { elements.saveStatus.textContent = ''; }, 1800);
    showToast(message || '食譜已儲存到「我的食譜」。');
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
    if (Number.isNaN(date.getTime())) return '日期不詳';
    return new Intl.DateTimeFormat('zh-HK', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
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
      text.textContent = '未有已儲存食譜。生成一份食譜，再撳「儲存到我的食譜」。';
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
      title.textContent = `${recipe.favorite ? '♥ ' : ''}${recipe.title || '未命名食譜'}`;
      const meta = document.createElement('p');
      meta.textContent = `${recipe.servings || '?'} 人 · ${recipe.rating ? `${recipe.rating} 星 · ` : ''}${formatSavedDate(recipe.createdAt)}`;
      copy.append(title, meta);
      const actions = document.createElement('div');
      actions.className = 'saved-card-actions';
      const load = createButton('', '打開', { 'data-action': 'load', 'data-id': recipe.id });
      const remove = createButton('delete-button', '刪除', { 'data-action': 'delete', 'data-id': recipe.id });
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
        showToast('最少要保留一樣廚具。');
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
    upsertCurrentRecipe(currentRecipe.favorite ? '已收藏呢份食譜。' : '已取消收藏，食譜仍然保留。');
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
      renderRecipe(recipe);
      closeSavedDialog();
      elements.result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('已打開已儲存食譜。');
      return;
    }
    if (button.dataset.action === 'delete' && window.confirm(`確定刪除「${recipe.title}」？`)) {
      writeSavedRecipes(recipes.filter((item) => item.id !== recipe.id));
      renderSavedRecipes();
      showToast('食譜已刪除。');
    }
  });

  elements.photoUpload.addEventListener('change', () => {
    const file = elements.photoUpload.files && elements.photoUpload.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('請選擇圖片檔案。');
      elements.photoUpload.value = '';
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      showToast('圖片太大，請選擇 6 MB 以下檔案。');
      elements.photoUpload.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      uploadedPhotoUrl = String(reader.result || '');
      elements.photo.src = uploadedPhotoUrl;
      elements.photo.alt = '你上載的成品實拍相片';
      showToast('實拍相只喺今次頁面預覽，不會上載或儲存。');
    });
    reader.readAsDataURL(file);
  });

  elements.loadExample.addEventListener('click', () => {
    elements.ingredients.value = '雞腿肉、白飯、菜心';
    elements.seasonings.value = '豉油、薑、蔥';
    elements.cuisine.value = 'cantonese';
    elements.timeLimit.value = '40';
    elements.servings.value = '2';
    elements.customServingWrap.hidden = true;
    elements.dietaryNeeds.value = '';
    selectedFlavor = 'ginger-scallion';
    selectedTools = new Set(['wok', 'rice-cooker']);
    elements.budgetMode.checked = true;
    elements.visualMode.checked = true;
    elements.currency.value = 'CAD';
    elements.budgetLimit.value = '15';
    syncChoiceButtons();
    syncModes();
    generate({ scroll: false });
    showToast('已載入廣東菜示例。');
  });

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) updateSavedCount();
  });

  populateControls();
  restoreDraft();
  updateSavedCount();
  generate({ scroll: false });
})();
