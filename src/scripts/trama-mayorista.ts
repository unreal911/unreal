import { products, getDiscountRate, getUnitPrice, formatPrice } from '../data/trama';

interface OrderLine {
  id: string;
  size: string;
  color: string;
  qty: number;
}

const STORAGE_KEY = 'trama-mayorista-order-v1';
const THEME_STORAGE_KEY = 'trama-theme-v1';
const PACK_SIZE = 6;
const MAX_LINE_QUANTITY = 600;
const MAX_ORDER_LINES = 100;
const productById = new Map(products.map((product) => [product.id, product]));

function validateOrder(value: unknown): OrderLine[] {
  if (!Array.isArray(value)) return [];
  const valid: OrderLine[] = [];
  for (const item of value.slice(0, MAX_ORDER_LINES)) {
    if (!item || typeof item !== 'object') continue;
    const line = item as Record<string, unknown>;
    if (typeof line.id !== 'string' || typeof line.size !== 'string' || typeof line.color !== 'string') continue;
    const product = productById.get(line.id);
    if (!product || !product.sizes.includes(line.size) || !product.colors.includes(line.color)) continue;
    if (typeof line.qty !== 'number' || !Number.isInteger(line.qty) || line.qty < PACK_SIZE || line.qty > MAX_LINE_QUANTITY || line.qty % PACK_SIZE !== 0) continue;
    const duplicate = valid.find((entry) => entry.id === line.id && entry.size === line.size && entry.color === line.color);
    if (duplicate) duplicate.qty = Math.min(MAX_LINE_QUANTITY, duplicate.qty + line.qty);
    else valid.push({ id: line.id, size: line.size, color: line.color, qty: line.qty });
  }
  return valid;
}

function readOrder(): OrderLine[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && saved.length <= 100_000 ? validateOrder(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
}

function initializeTrama() {
  const root = document.body;
  if (root.dataset.tramaInitialized === 'true') return;
  root.dataset.tramaInitialized = 'true';

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
  if (grid) {
    const cards = [...grid.querySelectorAll<HTMLElement>('[data-product]')];
    const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
    const search = document.querySelector<HTMLInputElement>('#trama-search');
    const sort = document.querySelector<HTMLSelectElement>('#trama-sort');
    const results = document.querySelector<HTMLElement>('#result-count');
    const catalogEmpty = document.querySelector<HTMLElement>('#catalog-empty');
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();
    const getCardProduct = (card: HTMLElement) => {
      const addButton = card.querySelector<HTMLButtonElement>('[data-add]');
      return productById.get(card.dataset.product || '') || productById.get(addButton?.value || addButton?.dataset.id || '');
    };
    const allowedCategories = new Set(['all', ...products.map((product) => product.category)]);
    const requestedCategory = new URLSearchParams(window.location.search).get('categoria') || 'all';
    let category = allowedCategories.has(requestedCategory) ? requestedCategory : 'all';

    const updateCatalog = () => {
      const query = normalize(search?.value || '');
      const ordered = [...cards];
      if (sort?.value === 'price-asc') ordered.sort((a, b) => (getCardProduct(a)?.price || 0) - (getCardProduct(b)?.price || 0));
      if (sort?.value === 'price-desc') ordered.sort((a, b) => (getCardProduct(b)?.price || 0) - (getCardProduct(a)?.price || 0));
      let count = 0;
      ordered.forEach((card) => {
        const product = getCardProduct(card);
        const searchable = normalize([card.dataset.name, product?.name, product?.material, product?.label, product?.category].filter(Boolean).join(' '));
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
      if (results) results.textContent = `${count} ${count === 1 ? 'producto' : 'productos'}`;
      if (catalogEmpty) catalogEmpty.hidden = count !== 0;
    };
    filters.forEach((button) => button.addEventListener('click', () => {
      const selectedCategory = button.dataset.category || 'all';
      category = allowedCategories.has(selectedCategory) ? selectedCategory : 'all';
      updateCatalog();
    }));
    search?.addEventListener('input', updateCatalog);
    sort?.addEventListener('change', updateCatalog);
    updateCatalog();
  }

  const dialog = document.querySelector<HTMLDialogElement>('#order-dialog');
  const items = document.querySelector<HTMLElement>('#order-items');
  const empty = document.querySelector<HTMLElement>('#order-empty');
  const summary = document.querySelector<HTMLElement>('#order-summary');
  const copyButton = document.querySelector<HTMLButtonElement>('#order-copy');
  const exportArea = document.querySelector<HTMLTextAreaElement>('#order-export');
  const feedback = document.querySelector<HTMLElement>('#order-feedback');
  const toast = document.querySelector<HTMLElement>('#trama-toast');
  let order = readOrder();
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

  const totalQuantity = () => order.reduce((sum, line) => sum + line.qty, 0);
  const totals = () => {
    const quantity = totalQuantity();
    const subtotal = order.reduce((sum, line) => sum + productById.get(line.id)!.price * line.qty, 0);
    const total = order.reduce((sum, line) => sum + getUnitPrice(productById.get(line.id)!.price, quantity) * line.qty, 0);
    return { quantity, subtotal, total: Math.round(total * 100) / 100, discount: Math.round((subtotal - total) * 100) / 100 };
  };

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
    if (empty) empty.hidden = order.length > 0;
    if (summary) summary.hidden = order.length === 0;
    if (copyButton) copyButton.disabled = order.length === 0;
    const values = { '#order-subtotal': formatPrice(subtotal), '#order-discount': `− ${formatPrice(discount)}`, '#order-total': formatPrice(total) };
    Object.entries(values).forEach(([selector, text]) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) element.textContent = text;
    });
    const tierNote = document.querySelector<HTMLElement>('#order-tier-note');
    if (tierNote) {
      tierNote.textContent = quantity >= 48
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
      decrease.disabled = line.qty <= PACK_SIZE;
      decrease.setAttribute('aria-label', `Quitar 6 unidades de ${product.name}, ${line.color}, talla ${line.size}`);
      const quantityLabel = createElement('span', '', `${line.qty} und.`);
      const increase = createElement('button', '', '+');
      increase.type = 'button';
      increase.dataset.orderAction = 'increase';
      increase.dataset.orderIndex = String(index);
      increase.disabled = line.qty >= MAX_LINE_QUANTITY;
      increase.setAttribute('aria-label', `Agregar 6 unidades de ${product.name}, ${line.color}, talla ${line.size}`);
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
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch { /* The order remains usable when storage is unavailable. */ }
    if (feedback) feedback.textContent = '';
    if (exportArea) exportArea.hidden = true;
    renderOrder();
  };

  grid?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-add]') : null;
    if (!button || !grid.contains(button)) return;
    const product = productById.get(button.value || button.dataset.id || '');
    const card = button.closest<HTMLElement>('[data-product]');
    if (!product || !card) return;
    const selectedSize = card.querySelector<HTMLSelectElement>('[data-size]')?.value;
    const selectedColor = card.querySelector<HTMLSelectElement>('[data-color]')?.value;
    const size = selectedSize && product.sizes.includes(selectedSize) ? selectedSize : product.sizes[0];
    const color = selectedColor && product.colors.includes(selectedColor) ? selectedColor : product.colors[0];
    const existing = order.find((line) => line.id === product.id && line.size === size && line.color === color);
    if (existing && existing.qty >= MAX_LINE_QUANTITY) {
      announce('Máximo de 600 unidades por combinación de talla y color.');
      return;
    }
    if (existing) existing.qty += PACK_SIZE;
    else if (order.length < MAX_ORDER_LINES) order.push({ id: product.id, size, color, qty: PACK_SIZE });
    else {
      announce('Tu pedido alcanzó el límite de combinaciones. Quita una para agregar otra.');
      return;
    }
    saveAndRender();
    announce(`6 unidades de ${product.name} agregadas a tu pedido.`);
  });

  items?.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-order-action]') : null;
    if (!button || !items.contains(button)) return;
    const index = Number(button.dataset.orderIndex);
    const line = order[index];
    if (!Number.isInteger(index) || !line) return;
    const action = button.dataset.orderAction;
    if (action === 'increase' && line.qty < MAX_LINE_QUANTITY) line.qty += PACK_SIZE;
    else if (action === 'decrease' && line.qty > PACK_SIZE) line.qty -= PACK_SIZE;
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

  copyButton?.addEventListener('click', async () => {
    if (!order.length) return;
    const { quantity, subtotal, total, discount } = totals();
    const lines = order.map((line) => {
      const product = productById.get(line.id)!;
      return `${line.qty} × ${product.name} | ${line.color} | Talla ${line.size} | ${formatPrice(getUnitPrice(product.price, quantity))} c/u | ${formatPrice(getUnitPrice(product.price, quantity) * line.qty)}`;
    });
    const text = [
      'TRAMA MAYORISTA · PEDIDO DE DEMOSTRACIÓN',
      '',
      ...lines,
      '',
      `Cantidad: ${quantity} prendas`,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Descuento (${getDiscountRate(quantity) * 100}%): ${formatPrice(discount)}`,
      `Total referencial: ${formatPrice(total)}`,
      '',
      'Demo de catálogo. Este resumen no confirma una compra ni realiza un pago.',
    ].join('\n');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if (feedback) feedback.textContent = 'Pedido copiado. Ya puedes pegar tu resumen.';
    } catch {
      if (exportArea) {
        exportArea.value = text;
        exportArea.hidden = false;
        exportArea.focus();
        exportArea.select();
      }
      if (feedback) feedback.textContent = 'Selecciona y copia el resumen de tu pedido con Ctrl+C o mantén presionado para copiar.';
    }
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
}

initializeTrama();
document.addEventListener('astro:page-load', initializeTrama);
