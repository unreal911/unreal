import { products, getUnitPrice, formatPrice, type TramaProduct } from '../data/trama';
import { MIN_ORDER_QUANTITY, MAX_LINE_QUANTITY, validateOrder, addOrderSelection, summarizeOrder, buildOrderText, buildOrderWhatsAppUrl, type OrderLine } from '../lib/trama-order';
import { tramaSupabaseConfigured } from '../lib/trama-supabase';
import { loadTramaCatalog } from '../lib/trama-catalog';
import { tramaColorHex } from '../lib/trama-colors';

const STORAGE_KEY = 'trama-mayorista-order-v1';
const THEME_STORAGE_KEY = 'trama-theme-v1';
function readSavedOrder(): unknown {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && saved.length <= 100_000 ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function createCatalogCard(template: HTMLTemplateElement, product: TramaProduct, index: number) {
  const card = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  card.dataset.product = product.id;
  card.dataset.categoryValue = product.category;
  card.querySelectorAll<HTMLButtonElement>('[data-select-product]').forEach((button) => {
    button.dataset.selectProduct = product.id;
  });
  card.querySelector('.product-image')!.setAttribute('aria-label', `Elegir tallas y colores de ${product.name}`);
  const image = card.querySelector('img')!;
  image.src = product.image;
  image.alt = `${product.name}, imagen de referencia de la colección`;
  const tag = card.querySelector('.product-tag')!;
  tag.classList.toggle('tag-green', index === 0);
  tag.textContent = index === 0 ? 'EL BÁSICO PERFECTO' : index === 3 ? 'NUEVA SILUETA' : 'EVERYDAY COLLECTION';
  card.querySelector('.product-index')!.textContent = `T / ${String(index + 1).padStart(2, '0')}`;
  card.querySelector('[data-card-label]')!.textContent = product.label;
  card.querySelector('[data-card-colors]')!.textContent = `${product.colors.length} ${product.colors.length === 1 ? 'COLOR' : 'COLORES'}`;
  card.querySelector('.product-title-button')!.textContent = product.name;
  card.querySelector('[data-card-price]')!.textContent = `S/ ${product.price.toFixed(2)}`;
  card.querySelector('.product-material')!.textContent = product.material;
  card.querySelector('.product-variant-note')!.textContent = `Tallas ${product.sizes.join(' · ')} · Cantidades a tu elección`;
  return card;
}

function initializeTrama() {
  const root = document.body;
  if (root.dataset.tramaInitialized === 'true') return;
  root.dataset.tramaInitialized = 'true';
  const initialProducts = tramaSupabaseConfigured ? [] : products;
  const productById = new Map(initialProducts.map((product) => [product.id, product]));

  const themeRoot = document.documentElement;
  const themeButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-trama-theme-toggle]')];
  const applyTheme = (theme: 'light' | 'dark', persist = false) => {
    const isDark = theme === 'dark';
    themeRoot.dataset.tramaTheme = theme;
    themeRoot.style.colorScheme = theme;
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#181513' : '#ffffff');
    themeButtons.forEach((button) => {
      const action = isDark ? 'Activar modo claro' : 'Activar modo oscuro';
      button.setAttribute('aria-label', action);
      button.setAttribute('title', action);
      button.setAttribute('aria-pressed', String(isDark));
      const label = button.querySelector<HTMLElement>('.trama-theme-label');
      if (label) label.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
    });
    if (persist) {
      try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* The selected theme still works for the current page. */ }
    }
  };
  let savedTheme: string | null = null;
  try { savedTheme = localStorage.getItem(THEME_STORAGE_KEY); } catch { /* Use the theme initialized in the head. */ }
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : themeRoot.dataset.tramaTheme;
  applyTheme(initialTheme === 'light' || initialTheme === 'dark' ? initialTheme : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    applyTheme(themeRoot.dataset.tramaTheme === 'dark' ? 'light' : 'dark', true);
  }));

  const grid = document.querySelector<HTMLElement>('#product-grid');
  const results = document.querySelector<HTMLElement>('#result-count');
  const savedOrder = readSavedOrder();
  const needsCatalog = tramaSupabaseConfigured && (Boolean(grid) || (Array.isArray(savedOrder) && savedOrder.length > 0));
  let catalogReady = !needsCatalog;
  let applyCatalog: ((catalog: TramaProduct[]) => void) | undefined;
  if (grid) {
    let cards = [...grid.querySelectorAll<HTMLElement>('[data-product]')];
    const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
    const search = document.querySelector<HTMLInputElement>('#trama-search');
    const sort = document.querySelector<HTMLSelectElement>('#trama-sort');
    const catalogEmpty = document.querySelector<HTMLElement>('#catalog-empty');
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
    const getCardProduct = (card: HTMLElement) => {
      return productById.get(card.dataset.product || '');
    };
    const allowedCategories = new Set(filters.map((button) => button.dataset.category));
    const requestedCategory = new URLSearchParams(window.location.search).get('categoria') || 'all';
    let category = allowedCategories.has(requestedCategory) ? requestedCategory : 'all';

    const updateCatalog = () => {
      if (!catalogReady) return;
      const query = normalize(search?.value || '');
      const ordered = [...cards];
      if (sort?.value === 'price-asc') ordered.sort((a, b) => (getCardProduct(a)?.price || 0) - (getCardProduct(b)?.price || 0));
      if (sort?.value === 'price-desc') ordered.sort((a, b) => (getCardProduct(b)?.price || 0) - (getCardProduct(a)?.price || 0));
      let count = 0;
      ordered.forEach((card) => {
        const product = getCardProduct(card);
        const searchable = normalize([product?.name, product?.material, product?.label, product?.category].filter(Boolean).join(' '));
        const matchesCategory = category === 'all' || (card.dataset.categoryValue || product?.category) === category;
        const matchesSearch = query.split(/\s+/).every((word) => searchable.includes(word));
        card.hidden = !(matchesCategory && matchesSearch);
        if (!card.hidden) count += 1;
        grid.append(card);
      });
      filters.forEach((button) => {
        const selected = button.dataset.category === category;
        button.setAttribute('aria-pressed', String(selected));
        button.classList.toggle('is-active', selected);
      });
      if (results) results.textContent = cards.length ? `${count} ${count === 1 ? 'producto' : 'productos'}` : 'Todavía no hay prendas publicadas.';
      if (catalogEmpty) catalogEmpty.hidden = count !== 0 || cards.length === 0;
    };
    filters.forEach((button) => button.addEventListener('click', () => {
      const selectedCategory = button.dataset.category || 'all';
      category = allowedCategories.has(selectedCategory) ? selectedCategory : 'all';
      updateCatalog();
    }));
    search?.addEventListener('input', updateCatalog);
    sort?.addEventListener('change', updateCatalog);
    updateCatalog();

    const template = document.querySelector<HTMLTemplateElement>('#trama-card-template');
    const total = document.getElementById('trama-catalog-total');
    applyCatalog = (catalog) => {
      if (template) {
        cards = catalog.map((product, index) => createCatalogCard(template, product, index));
        grid.replaceChildren(...cards);
      }
      if (total) total.textContent = String(cards.length).padStart(2, '0');
      updateCatalog();
    };
  }

  const dialog = document.querySelector<HTMLDialogElement>('#order-dialog');
  const items = document.querySelector<HTMLElement>('#order-items');
  const empty = document.querySelector<HTMLElement>('#order-empty');
  const summary = document.querySelector<HTMLElement>('#order-summary');
  const copyButton = document.querySelector<HTMLButtonElement>('#order-copy');
  const whatsappLink = document.querySelector<HTMLAnchorElement>('#order-whatsapp');
  const exportArea = document.querySelector<HTMLTextAreaElement>('#order-export');
  const feedback = document.querySelector<HTMLElement>('#order-feedback');
  const orderCatalogStatus = document.getElementById('order-catalog-status');
  const toast = document.querySelector<HTMLElement>('#trama-toast');
  let order = validateOrder(savedOrder, productById);
  let copyAttempt = 0;
  let toastTimeout: ReturnType<typeof setTimeout>;

  const announce = (message: string) => {
    if (!toast) return;
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('is-visible');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
      toast.hidden = true;
    }, 3500);
  };

  const totals = () => summarizeOrder(order, productById);

  const createElement = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const renderOrder = () => {
    const { quantity, subtotal, total, discount } = totals();
    const countElements = new Set(document.querySelectorAll<HTMLElement>('[data-order-count], #order-count'));
    countElements.forEach((element) => { element.textContent = String(quantity); });
    document.querySelectorAll<HTMLButtonElement>('[data-open-order]').forEach((button) => {
      button.setAttribute('aria-label', `Ver pedido, ${quantity} ${quantity === 1 ? 'prenda' : 'prendas'}`);
    });
    if (empty) empty.hidden = !catalogReady || order.length > 0;
    if (summary) summary.hidden = order.length === 0;
    if (copyButton) copyButton.disabled = quantity < MIN_ORDER_QUANTITY;
    if (whatsappLink) {
      const ready = quantity >= MIN_ORDER_QUANTITY;
      whatsappLink.setAttribute('aria-disabled', String(!ready));
      whatsappLink.tabIndex = ready ? 0 : -1;
      if (ready) whatsappLink.href = buildOrderWhatsAppUrl(order, undefined, productById);
      else whatsappLink.removeAttribute('href');
    }
    const values = { '#order-subtotal': formatPrice(subtotal), '#order-discount': `− ${formatPrice(discount)}`, '#order-total': formatPrice(total) };
    Object.entries(values).forEach(([selector, text]) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) element.textContent = text;
    });
    const tierNote = document.querySelector<HTMLElement>('#order-tier-note');
    if (tierNote) {
      tierNote.textContent = quantity < MIN_ORDER_QUANTITY
        ? `Agrega ${MIN_ORDER_QUANTITY - quantity} ${MIN_ORDER_QUANTITY - quantity === 1 ? 'prenda' : 'prendas'} para completar el mínimo de 6. Puedes combinar modelos, colores y tallas.`
        : quantity >= 48
        ? 'Tienes 15% de descuento en todo tu pedido.'
        : quantity >= 24
          ? `Tienes 10% de descuento. Agrega ${48 - quantity} prendas para obtener 15%.`
          : `Agrega ${24 - quantity} prendas para obtener 10% de descuento.`;
    }
    if (!items) return;
    const fragment = document.createDocumentFragment();
    order.forEach((line, index) => {
      const product = productById.get(line.id)!;
      const item = createElement('article', 'order-item');
      const image = createElement('img', 'order-item-image');
      image.src = product.image;
      image.alt = product.name;
      image.width = 80;
      image.height = 104;
      image.loading = 'lazy';
      const copy = createElement('div', 'order-item-copy');
      const name = createElement('h3', '', product.name);
      const variant = createElement('p', 'order-item-variant', `${line.color} · Talla ${line.size}`);
      const quantityControl = createElement('div', 'order-item-quantity');
      const decrease = createElement('button', '', '−');
      decrease.type = 'button';
      decrease.dataset.orderAction = 'decrease';
      decrease.dataset.orderIndex = String(index);
      decrease.disabled = line.qty <= 1;
      decrease.setAttribute('aria-label', `Quitar una unidad de ${product.name}, ${line.color}, talla ${line.size}`);
      const quantityLabel = createElement('span', '', `${line.qty} und.`);
      const increase = createElement('button', '', '+');
      increase.type = 'button';
      increase.dataset.orderAction = 'increase';
      increase.dataset.orderIndex = String(index);
      increase.disabled = line.qty >= MAX_LINE_QUANTITY;
      increase.setAttribute('aria-label', `Agregar una unidad de ${product.name}, ${line.color}, talla ${line.size}`);
      quantityControl.append(decrease, quantityLabel, increase);
      const remove = createElement('button', 'order-item-remove', 'Quitar');
      remove.type = 'button';
      remove.dataset.orderAction = 'remove';
      remove.dataset.orderIndex = String(index);
      remove.setAttribute('aria-label', `Quitar ${product.name}, ${line.color}, talla ${line.size} del pedido`);
      copy.append(name, variant, quantityControl, remove);
      const price = createElement('div', 'order-item-price');
      price.append(createElement('strong', '', formatPrice(getUnitPrice(product.price, quantity) * line.qty)), createElement('small', '', `${formatPrice(getUnitPrice(product.price, quantity))} / und.`));
      item.append(image, copy, price);
      fragment.append(item);
    });
    items.replaceChildren(fragment);
  };

  const saveAndRender = () => {
    copyAttempt += 1;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch { /* The order remains usable when storage is unavailable. */ }
    if (feedback) feedback.textContent = '';
    if (exportArea) exportArea.hidden = true;
    renderOrder();
  };

  const picker = document.querySelector<HTMLDialogElement>('#product-dialog');
  const pickerColors = document.querySelector<HTMLElement>('#product-picker-colors');
  const pickerSizes = document.querySelector<HTMLElement>('#product-picker-sizes');
  const pickerSelected = document.querySelector<HTMLElement>('#product-picker-selected');
  const pickerAdd = document.querySelector<HTMLButtonElement>('#product-picker-add');
  const pickerClear = document.querySelector<HTMLButtonElement>('#product-picker-clear');
  const pickerFeedback = document.querySelector<HTMLElement>('#product-picker-feedback');
  let selectedProduct: TramaProduct | undefined;
  let selectedColor = '';
  let draft: OrderLine[] = [];
  let pickerTrigger: HTMLButtonElement | null = null;
  const pickerText = (id: string, value: string) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const existingQuantity = (size: string) => order.find((line) => line.id === selectedProduct?.id && line.color === selectedColor && line.size === size)?.qty || 0;
  const draftQuantity = (size: string) => draft.find((line) => line.color === selectedColor && line.size === size)?.qty || 0;

  const updatePicker = () => {
    if (!selectedProduct) return;
    const quantity = draft.reduce((sum, line) => sum + line.qty, 0);
    const combinedQuantity = totals().quantity + quantity;
    const unitPrice = getUnitPrice(selectedProduct.price, combinedQuantity);
    pickerText('product-picker-quantity', String(quantity));
    pickerText('product-picker-unit-price', formatPrice(unitPrice));
    pickerText('product-picker-total', formatPrice(Math.round(unitPrice * 100) * quantity / 100));
    pickerText('product-picker-tier-note', combinedQuantity < MIN_ORDER_QUANTITY
      ? `Con esta selección tendrás ${combinedQuantity} prendas en tu pedido. Faltan ${MIN_ORDER_QUANTITY - combinedQuantity} para el mínimo de 6; puedes añadir otros modelos.`
      : `Con esta selección tendrás ${combinedQuantity} prendas en tu pedido. ${combinedQuantity >= 48 ? '15% de descuento' : combinedQuantity >= 24 ? '10% de descuento' : 'Precio mayorista base'} en todas las prendas.`);
    document.querySelectorAll<HTMLElement>('[data-picker-tier]').forEach((tier) => {
      const threshold = tier.dataset.pickerTier;
      const price = tier.querySelector<HTMLElement>('[data-picker-tier-price]');
      if (price) price.textContent = formatPrice(getUnitPrice(selectedProduct!.price, threshold === '48' ? 48 : threshold === '24' ? 24 : 6));
      const active = combinedQuantity >= 48 ? '48' : combinedQuantity >= 24 ? '24' : 'base';
      tier.classList.toggle('is-active', threshold === active);
    });
    pickerColors?.querySelectorAll<HTMLButtonElement>('[data-picker-color]').forEach((button) => {
      const color = button.dataset.pickerColor!;
      const count = draft.filter((line) => line.color === color).reduce((sum, line) => sum + line.qty, 0);
      button.setAttribute('aria-pressed', String(color === selectedColor));
      button.setAttribute('aria-label', `${color}, ${count} prendas seleccionadas`);
      const badge = button.querySelector<HTMLElement>('.picker-color-count');
      if (badge) { badge.textContent = String(count); badge.hidden = count === 0; }
    });
    pickerSizes?.querySelectorAll<HTMLElement>('[data-picker-size-row]').forEach((row) => {
      const size = row.dataset.pickerSizeRow!;
      const quantity = draftQuantity(size);
      const remaining = MAX_LINE_QUANTITY - existingQuantity(size);
      const input = row.querySelector<HTMLInputElement>('input')!;
      input.max = String(remaining);
      const decrease = row.querySelector<HTMLButtonElement>('[data-picker-step="-1"]')!;
      const increase = row.querySelector<HTMLButtonElement>('[data-picker-step="1"]')!;
      decrease.disabled = quantity <= 0;
      increase.disabled = quantity >= remaining;
      const price = row.querySelector<HTMLElement>('.picker-size-price');
      if (price) price.textContent = formatPrice(unitPrice);
    });
    if (pickerSelected) {
      const lines = draft.map((line) => createElement('p', 'picker-selected-line', `${line.color} · ${line.size} × ${line.qty}`));
      pickerSelected.replaceChildren(...(lines.length ? lines : [createElement('p', 'picker-selected-empty', 'Todavía no elegiste cantidades.')]));
    }
    if (pickerAdd) pickerAdd.disabled = quantity === 0 || Boolean(pickerSizes?.querySelector('input:invalid'));
    if (pickerClear) pickerClear.disabled = quantity === 0 && !pickerSizes?.querySelector('input:invalid');
  };

  const renderPickerSizes = () => {
    if (!selectedProduct || !pickerSizes) return;
    const rows = selectedProduct.sizes.map((size) => {
      const row = createElement('div', 'picker-size-row');
      row.dataset.pickerSizeRow = size;
      const label = createElement('span', 'picker-size-label', size);
      const price = createElement('span', 'picker-size-price');
      const control = createElement('div', 'picker-quantity-control');
      const decrease = createElement('button', '', '−');
      decrease.type = 'button';
      decrease.dataset.pickerStep = '-1';
      decrease.setAttribute('aria-label', `Quitar una unidad, ${selectedColor}, talla ${size}`);
      const input = createElement('input', '');
      input.type = 'number';
      input.inputMode = 'numeric';
      input.min = '0';
      input.step = '1';
      input.value = String(draftQuantity(size));
      input.setAttribute('aria-label', `Cantidad de ${selectedProduct!.name}, ${selectedColor}, talla ${size}`);
      const increase = createElement('button', '', '+');
      increase.type = 'button';
      increase.dataset.pickerStep = '1';
      increase.setAttribute('aria-label', `Agregar una unidad, ${selectedColor}, talla ${size}`);
      control.append(decrease, input, increase);
      row.append(label, control, price);
      return row;
    });
    pickerSizes.replaceChildren(...rows);
    pickerText('product-picker-current-color', selectedColor);
    updatePicker();
  };

  const setDraftQuantity = (size: string, qty: number) => {
    if (!selectedProduct) return;
    const existing = draft.find((line) => line.color === selectedColor && line.size === size);
    if (qty === 0) draft = draft.filter((line) => line !== existing);
    else if (existing) existing.qty = qty;
    else draft.push({ id: selectedProduct.id, color: selectedColor, size, qty });
    if (pickerFeedback) pickerFeedback.textContent = '';
    updatePicker();
  };

  grid?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-select-product]') : null;
    if (!button || !grid.contains(button) || !picker) return;
    selectedProduct = productById.get(button.dataset.selectProduct || '');
    if (!selectedProduct) return;
    pickerTrigger = button;
    selectedColor = selectedProduct.colors[0];
    draft = [];
    pickerText('product-picker-label', selectedProduct.label);
    pickerText('product-picker-title', selectedProduct.name);
    pickerText('product-picker-material', selectedProduct.material);
    if (pickerFeedback) pickerFeedback.textContent = '';
    const image = document.querySelector<HTMLImageElement>('#product-picker-image');
    if (image) { image.src = selectedProduct.image; image.alt = `${selectedProduct.name}, fotografía referencial`; }
    if (pickerColors) {
      pickerColors.replaceChildren(...selectedProduct.colors.map((color) => {
        const option = createElement('button', 'picker-color');
        option.type = 'button';
        option.dataset.pickerColor = color;
        const swatch = createElement('span', 'picker-swatch');
        swatch.style.setProperty('--swatch', tramaColorHex(color, selectedProduct?.color_hexes));
        swatch.setAttribute('aria-hidden', 'true');
        option.append(swatch, createElement('span', '', color), createElement('small', 'picker-color-count', '0'));
        return option;
      }));
    }
    renderPickerSizes();
    picker.showModal();
    picker.scrollTop = 0;
  });

  pickerColors?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-picker-color]') : null;
    if (!button || !selectedProduct?.colors.includes(button.dataset.pickerColor || '')) return;
    const invalid = pickerSizes?.querySelector<HTMLInputElement>('input:invalid');
    if (invalid) { invalid.reportValidity(); invalid.focus(); return; }
    selectedColor = button.dataset.pickerColor!;
    renderPickerSizes();
  });
  pickerSizes?.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const size = input.closest<HTMLElement>('[data-picker-size-row]')?.dataset.pickerSizeRow;
    if (!size) return;
    input.setCustomValidity('');
    const qty = input.value === '' ? 0 : input.valueAsNumber;
    if (input.validity.badInput || !Number.isInteger(qty) || qty < 0 || qty > MAX_LINE_QUANTITY - existingQuantity(size)) {
      input.setCustomValidity(`Usa una cantidad entera entre 0 y ${MAX_LINE_QUANTITY - existingQuantity(size)}.`);
      if (pickerFeedback) pickerFeedback.textContent = input.validationMessage;
      updatePicker();
      return;
    }
    setDraftQuantity(size, qty);
  });
  pickerSizes?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-picker-step]') : null;
    const row = button?.closest<HTMLElement>('[data-picker-size-row]');
    const size = row?.dataset.pickerSizeRow;
    if (!button || !row || !size) return;
    const qty = Math.max(0, Math.min(MAX_LINE_QUANTITY - existingQuantity(size), draftQuantity(size) + Number(button.dataset.pickerStep)));
    const input = row.querySelector<HTMLInputElement>('input')!;
    input.value = String(qty);
    input.setCustomValidity('');
    setDraftQuantity(size, qty);
  });
  pickerClear?.addEventListener('click', () => { draft = []; if (pickerFeedback) pickerFeedback.textContent = ''; renderPickerSizes(); });
  pickerAdd?.addEventListener('click', () => {
    if (!draft.length || pickerSizes?.querySelector('input:invalid')) return;
    try {
      order = addOrderSelection(order, draft, productById);
      const quantity = draft.reduce((sum, line) => sum + line.qty, 0);
      saveAndRender();
      picker?.close();
      announce(`${quantity} ${quantity === 1 ? 'prenda' : 'prendas'} de ${selectedProduct!.name} ${quantity === 1 ? 'añadida' : 'añadidas'}. Revisa las tallas y colores en Mi pedido.`);
    } catch (error) {
      if (pickerFeedback) pickerFeedback.textContent = error instanceof Error ? error.message : 'No se pudo añadir la selección.';
    }
  });
  document.querySelector<HTMLButtonElement>('#close-product')?.addEventListener('click', () => picker?.close());
  picker?.addEventListener('close', () => pickerTrigger?.focus());
  picker?.addEventListener('click', (event) => {
    if (event.target !== picker) return;
    const bounds = picker.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) picker.close();
  });

  items?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-order-action]') : null;
    if (!button || !items.contains(button)) return;
    const index = Number(button.dataset.orderIndex);
    const line = order[index];
    if (!Number.isInteger(index) || !line) return;
    const action = button.dataset.orderAction;
    if (action === 'increase' && line.qty < MAX_LINE_QUANTITY) line.qty += 1;
    else if (action === 'decrease' && line.qty > 1) line.qty -= 1;
    else if (action === 'remove') order.splice(index, 1);
    else return;
    saveAndRender();
    const focusIndex = Math.min(index, order.length - 1);
    const focusAction = action === 'remove' ? 'remove' : action;
    const nextButton = items.querySelector<HTMLButtonElement>(`[data-order-index="${focusIndex}"][data-order-action="${focusAction}"]:not([disabled])`);
    (nextButton || items.querySelector<HTMLButtonElement>(`[data-order-index="${focusIndex}"][data-order-action="remove"]`) || document.querySelector<HTMLButtonElement>('#close-order'))?.focus();
  });

  let previousOverflow = '';
  const openOrder = () => {
    if (!dialog || dialog.open) return;
    if (feedback) feedback.textContent = '';
    if (exportArea) exportArea.hidden = true;
    previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  };
  document.querySelectorAll<HTMLButtonElement>('[data-open-order]').forEach((button) => button.addEventListener('click', openOrder));
  document.querySelector<HTMLButtonElement>('#close-order')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
  dialog?.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  const copyOrder = async (text: string, openingWhatsApp = false) => {
    const attempt = ++copyAttempt;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (attempt !== copyAttempt) return;
      if (feedback) feedback.textContent = openingWhatsApp
        ? 'Pedido copiado. Revisa el mensaje en WhatsApp y pulsa Enviar cuando estés listo.'
        : 'Pedido copiado. Ya puedes pegar tu resumen.';
    } catch {
      if (attempt !== copyAttempt) return;
      if (exportArea) {
        exportArea.value = text;
        exportArea.hidden = false;
        exportArea.focus();
        exportArea.select();
      }
      if (feedback) feedback.textContent = openingWhatsApp
        ? 'WhatsApp incluye el pedido completo aunque no se haya podido copiar. También puedes seleccionar y copiar este resumen manualmente.'
        : 'Selecciona y copia el resumen de tu pedido con Ctrl+C o mantén presionado para copiar.';
    }
  };
  copyButton?.addEventListener('click', () => {
    if (totals().quantity < MIN_ORDER_QUANTITY) return;
    void copyOrder(buildOrderText(order, productById));
  });
  whatsappLink?.addEventListener('click', (event) => {
    if (totals().quantity < MIN_ORDER_QUANTITY || !whatsappLink.hasAttribute('href')) {
      event.preventDefault();
      announce(`Completa un mínimo de ${MIN_ORDER_QUANTITY} prendas para compartir tu pedido.`);
      return;
    }
    // Attribution runs in capture phase. Copy the same draft, including its reference.
    const text = new URL(whatsappLink.href).searchParams.get('text') || buildOrderText(order, productById);
    // Let the native link open immediately; clipboard permissions must not block WhatsApp.
    void copyOrder(text, true);
  });

  const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const navigation = document.querySelector<HTMLElement>('#trama-nav');
  if (menuToggle && navigation) {
    const setMenu = (open: boolean) => {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      navigation.classList.toggle('is-open', open);
    };
    menuToggle.setAttribute('aria-controls', navigation.id);
    setMenu(false);
    menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
    navigation.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuToggle.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (getComputedStyle(menuToggle).display === 'none') setMenu(false);
    }, { passive: true });
  }
  renderOrder();
  if (needsCatalog) {
    if (orderCatalogStatus) {
      orderCatalogStatus.hidden = false;
      orderCatalogStatus.textContent = 'Cargando la colección…';
    }
    void loadTramaCatalog().then((catalog) => {
      catalog.forEach((product) => productById.set(product.id, product));
      catalogReady = true;
      order = validateOrder(readSavedOrder(), productById);
      if (orderCatalogStatus) orderCatalogStatus.hidden = true;
      applyCatalog?.(catalog);
      renderOrder();
    }).catch(() => {
      const message = 'No pudimos cargar la colección. Recarga la página para volver a intentar.';
      if (results) results.textContent = message;
      if (orderCatalogStatus) orderCatalogStatus.textContent = message;
    }).finally(() => grid?.removeAttribute('aria-busy'));
  }
}

initializeTrama();
document.addEventListener('astro:page-load', initializeTrama);
