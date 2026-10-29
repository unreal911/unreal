import { createClient } from '@supabase/supabase-js';
import { products, presets, builderGroups, categories, caletaCategoryMap } from '../data/nodoPc';
const whatsappBase = document.body.dataset.whatsappBase;
const studioName = document.body.dataset.studioName;
let productById = Object.assign(Object.create(null), Object.fromEntries(products.map((product) => [product.id, product])));
const catalogHref = '/demos/nodo-pc/componentes/';
const builderHref = '/demos/nodo-pc/armar/';
const query = new URLSearchParams(window.location.search);
      const cart = new Map();
      const cartDialog = document.getElementById('cart-dialog');
      const cartItems = document.getElementById('cart-items');
      const cartTotal = document.getElementById('cart-total');
      const sendOrder = document.getElementById('send-order');
      const noteInput = document.getElementById('order-note');
      const assemblyFee = 180;
      const storageKey = 'nodo-pc-quote-v2';
      const noteStorageKey = 'nodo-pc-quote-note-v2';
      const maxQuantity = 999;
      const selects = [...document.querySelectorAll('[data-build-select]')];
      const assemblyToggle = document.getElementById('assembly-option');
      const builderForm = document.getElementById('builder-form');
      const catalogSearch = document.getElementById('catalog-search');
      const draftKey = 'nodo-pc-builder-draft-v1';
      const catalogPageSize = 24;
      let catalogProducts = products;
      let fallbackInventory = [];
      let visibleCatalogCount = catalogPageSize;
      let requestedPartApplied = false;
      const catalogCardTemplate = document.querySelector('[data-product-card]')?.cloneNode(true);
      const detailRoot = document.querySelector('[data-detail-id]');
      let toastTimer;
      let activeCategory = categories.some((category) => category.id === query.get('categoria')) ? query.get('categoria') : 'all';
      let selectedPreset = 'gaming';
      let editingBuildId = null;
      let currentStep = 1;
      const formatMoney = (amount) => `S/ ${amount.toLocaleString('es-PE')}`;
      const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const safeHttpsUrl = (value) => {
        try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
      };
      const mappedCategory = (row) => categories.some((item) => item.id === row.category)
        ? row.category : caletaCategoryMap[row.source_category];
      const fromCatalogRow = (row) => {
        if (!row || row.published === false) return null;
        const category = mappedCategory(row);
        const price = row.price_pen == null ? null : Number(row.price_pen);
        if (!category || !row.id || !row.name || (price !== null && (!Number.isFinite(price) || price < 0))) return null;
        return {
          id: String(row.id), name: String(row.name), brand: String(row.brand || ''),
          type: String(row.type || categories.find((item) => item.id === category)?.label || 'Componente'),
          category, detail: String(row.detail || ''), description: String(row.description || ''),
          price, tag: String(row.tag || ''), label: String(row.label || row.brand || category).slice(0, 20),
          sourceUrl: safeHttpsUrl(row.source_url), officialUrl: safeHttpsUrl(row.official_url),
          officialImageUrl: safeHttpsUrl(row.official_image_url),
          specs: row.specs && typeof row.specs === 'object' ? row.specs : {},
          priceNeedsReview: row.price_needs_review === true || price === null || price === 0,
          stockText: String(row.stock_text || ''), stockQuantity: row.stock_quantity,
          capturedAt: row.captured_at || null,
          sortOrder: Number(row.sort_order) || 0,
        };
      };
      const showToast = (message) => {
        const toast = document.getElementById('shop-toast');
        document.getElementById('shop-toast-message').textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4200);
      };
      const openCart = () => { if (!cartDialog.open) cartDialog.showModal(); };
      const goToSection = (id) => {
        const section = document.getElementById(id);
        if (!section) { window.location.assign(id === 'catalogo' ? catalogHref : builderHref); return; }
        if (cartDialog.open) cartDialog.close();
        window.requestAnimationFrame(() => {
          const control = section.querySelector('input, button, select, a');
          if (control) control.focus({ preventScroll: true });
          section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
      };
      const makeProductItem = (product) => product.priceNeedsReview || !Number.isFinite(product.price)
        ? null : ({ id: product.id, name: product.name, price: product.price, detail: product.detail || `${product.brand} · ${product.type}`, category: product.category });
      const makeBuildItem = (ids, assembly) => {
        if (ids.length !== builderGroups.length || ids.some((id) => typeof id !== 'string' || !Object.hasOwn(productById, id))) return null;
        const chosen = ids.map((id) => productById[id]);
        if (chosen.some((part) => !part || part.priceNeedsReview || !Number.isFinite(part.price)) || chosen.length !== builderGroups.length || builderGroups.some((group, index) => chosen[index].category !== group.category)) return null;
        const matchingPreset = presets.find((preset) => preset.ids.every((id, index) => id === ids[index]));
        return { id: `build-${ids.join('_')}-${assembly ? 'assembled' : 'parts'}`, name: `PC ${matchingPreset ? matchingPreset.name : 'personalizada'}`, price: chosen.reduce((sum, part) => sum + part.price, 0) + (assembly ? assemblyFee : 0), detail: `${chosen.map((part) => part.name).join(' · ')}\n${assembly ? 'Con servicio de armado simulado (+ S/ 180)' : 'Solo componentes / sin servicio de armado'}`, category: 'build', selections: ids, assembly };
      };
      const saveCart = () => {
        try { localStorage.setItem(storageKey, JSON.stringify([...cart.values()].map((item) => ({ id: item.id, quantity: item.quantity, selections: item.selections, assembly: item.assembly })))); } catch { /* La lista funciona si el almacenamiento está deshabilitado. */ }
      };
      const updateOrderLink = () => {
        if (!cart.size) { sendOrder.href = '#'; return; }
        const items = [...cart.values()];
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const orderLines = items.map((item) => `• ${item.quantity} × ${item.name} — ${formatMoney(item.price * item.quantity)}\n  ${item.detail}`).join('\n\n');
        const note = noteInput.value.trim();
        const message = `Hola, ${studioName}. Estoy probando la demo conceptual de Nodo PC. Esta es mi selección de muestra:\n\n${orderLines}\n\nTotal referencial: ${formatMoney(total)}.${note ? `\n\nSobre mi proyecto: ${note}` : ''}\n\nMe gustaría conversar sobre una web con este catálogo y configurador. Entiendo que Nodo PC es una demo, no una tienda real.`;
        const url = new URL(whatsappBase); url.searchParams.set('text', message); sendOrder.href = url.toString();
      };
      const renderCart = (persist = true) => {
        const items = [...cart.values()];
        const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        document.querySelectorAll('[data-cart-count]').forEach((badge) => { badge.textContent = quantity; });
        document.querySelector('[data-cart-preview]').textContent = quantity ? `${formatMoney(total)} referenciales` : 'Empieza tu lista';
        document.querySelectorAll('[data-product-quantity]').forEach((badge) => { const amount = cart.get(badge.dataset.productQuantity)?.quantity || 0; badge.hidden = !amount; badge.textContent = `${amount} en tu lista`; });
        cartTotal.textContent = formatMoney(total);
        sendOrder.setAttribute('aria-disabled', String(!items.length)); sendOrder.classList.toggle('is-disabled', !items.length); noteInput.disabled = !items.length;
        cartDialog.classList.toggle('is-empty', !items.length);
        cartItems.replaceChildren();
        if (!items.length) {
          cartItems.scrollTop = 0;
          const empty = document.createElement('div'); empty.className = 'cart-empty';
          empty.innerHTML = '<span>＋</span><h3>Una buena PC<br />empieza con una pieza.</h3><p>Explora el catálogo o configura un equipo completo para crear tu selección de muestra.</p><button type="button" id="empty-cart-browse">Explorar componentes <span>↗</span></button><button type="button" id="empty-cart-build">Configurar mi PC <span>↗</span></button>';
          cartItems.append(empty);
        }
        items.forEach((item) => {
          const row = document.createElement('article'); row.className = 'cart-line';
          const visual = document.createElement('span'); visual.className = 'cart-line-visual'; visual.setAttribute('aria-hidden', 'true'); visual.textContent = item.category === 'build' ? 'PC' : item.category.toUpperCase();
          const info = document.createElement('div'); info.className = 'cart-line-info';
          const name = document.createElement('strong'); name.textContent = item.name;
          const detail = document.createElement('small'); detail.textContent = item.detail;
          const sum = document.createElement('b'); sum.textContent = formatMoney(item.price * item.quantity);
          info.append(name, detail, sum);
          const actions = document.createElement('div'); actions.className = 'cart-line-actions';
          const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.cartAction = 'remove'; remove.dataset.itemId = item.id; remove.textContent = 'Quitar'; remove.setAttribute('aria-label', `Quitar ${item.name} de la selección`);
          const stepper = document.createElement('div'); stepper.className = 'cart-stepper';
          const minus = document.createElement('button'); minus.type = 'button'; minus.dataset.cartAction = 'decrease'; minus.dataset.itemId = item.id; minus.setAttribute('aria-label', `Restar una unidad de ${item.name}`); minus.textContent = '−';
          const count = document.createElement('span'); count.textContent = item.quantity; count.setAttribute('aria-label', `${item.quantity} unidades`);
          const plus = document.createElement('button'); plus.type = 'button'; plus.dataset.cartAction = 'increase'; plus.dataset.itemId = item.id; plus.setAttribute('aria-label', `Sumar una unidad de ${item.name}`); plus.textContent = '+';
          stepper.append(minus, count, plus); actions.append(stepper);
          if (item.category === 'build') {
            const edit = document.createElement('button'); edit.type = 'button'; edit.dataset.cartAction = 'edit'; edit.dataset.itemId = item.id; edit.textContent = 'Editar armado'; edit.setAttribute('aria-label', `Editar ${item.name}`); actions.append(edit);
          }
          actions.append(remove); row.append(visual, info, actions); cartItems.append(row);
        });
        updateOrderLink(); if (persist) saveCart();
      };
      const addItem = (item) => {
        if (!item) return;
        const existing = cart.get(item.id);
        if (existing && existing.quantity >= maxQuantity) { showToast('Esta pieza ya alcanzó el límite de 999 unidades.'); return; }
        if (existing) existing.quantity += 1; else cart.set(item.id, { ...item, quantity: 1 });
        renderCart(); showToast(`${item.name} en tu selección.`);
      };
      const restoreCart = () => {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const restored = new Map();
          if (Array.isArray(saved)) saved.forEach((record) => {
            if (!record || !Number.isInteger(record.quantity) || record.quantity < 1 || record.quantity > maxQuantity) return;
            const item = Array.isArray(record.selections) ? makeBuildItem(record.selections, record.assembly === true) : typeof record.id === 'string' && Object.hasOwn(productById, record.id) ? makeProductItem(productById[record.id]) : null;
            if (item) restored.set(item.id, { ...item, quantity: record.quantity });
          });
          cart.clear();
          restored.forEach((item, id) => cart.set(id, item));
          noteInput.value = (localStorage.getItem(noteStorageKey) || '').slice(0, 500);
        } catch { /* Se conserva el estado en memoria si el almacenamiento falla. */ }
      };
      restoreCart();

      const makeElement = (tag, className, value) => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (value != null) element.textContent = value;
        return element;
      };
      const specLabels = {
        gpu: ['Memoria', 'Diseño'], cpu: ['Núcleos / hilos', 'Plataforma'],
        ram: ['Kit', 'Velocidad'], ssd: ['Interfaz', 'Formato'],
        board: ['Socket', 'Memoria', 'Formato', 'Conexión'],
        power: ['Certificación', 'Formato'], case: ['Tamaño', 'Placa', 'Frontal'],
        cooling: ['Diseño', 'Plataforma'],
      };
      const specName = (name) => String(name).replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
      const productSpecs = (product) => {
        if (Array.isArray(product.specs)) {
          return product.specs.slice(0, 4).map((spec, index) => ({
            label: String(spec?.label || `Detalle ${index + 1}`), value: String(spec?.value || ''),
          })).filter((spec) => spec.value);
        }
        if (product.specs && Object.keys(product.specs).length) {
          return Object.entries(product.specs).slice(0, 4).map(([label, value]) => ({
            label: specName(label), value: Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? Object.values(value || {}).join(', ') : String(value ?? ''),
          })).filter((spec) => spec.value);
        }
        const details = product.detail.split(' · ').filter(Boolean).slice(0, 4).map((value, index) => ({
          label: specLabels[product.category]?.[index] || 'Detalle', value,
        }));
        return details.length ? details : [
          { label: 'Marca', value: product.brand || 'Por confirmar' },
          { label: 'Tipo', value: product.type },
        ];
      };
      const renderDetail = (product, inventory) => {
        if (!detailRoot || !product) return;
        const within = (selector) => detailRoot.querySelector(selector);
        const categoryLabel = categories.find((category) => category.id === product.category)?.label || product.type;
        const captured = new Date(product.capturedAt);
        const captureDate = Number.isNaN(captured.getTime()) ? 'fecha por confirmar' : new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima' }).format(captured);
        within('[data-detail-kicker]').textContent = `[ ${categoryLabel.toUpperCase()} / ${product.id.toUpperCase()} ]`;
        within('[data-detail-name]').textContent = product.name;
        within('[data-detail-brand]').textContent = product.brand || 'Marca por confirmar';
        within('[data-detail-type]').textContent = product.type;
        within('[data-detail-description]').textContent = product.description || 'Caleta no publica más detalles de este modelo en su ficha.';
        within('[data-detail-price]').textContent = product.priceNeedsReview ? 'Por confirmar' : formatMoney(product.price);
        within('[data-detail-stock]').textContent = product.stockText ? `Stock reportado: ${product.stockText}` : 'Stock por confirmar en Caleta';
        within('[data-detail-captured]').textContent = `Capturado el ${captureDate}`;
        within('[data-detail-date]').textContent = `Datos de Caleta capturados el ${captureDate}. Pueden cambiar en la tienda de origen.`;
        within('[data-detail-brand-basic]').textContent = product.brand || 'Por confirmar';
        within('[data-detail-category]').textContent = categoryLabel;
        within('[data-detail-sku]').textContent = product.id.replace('caleta-', '');
        within('[data-detail-code]').textContent = product.id.replace('caleta-', '#');
        within('[data-detail-pixel-code]').textContent = ({ board: 'MB', power: 'PSU', cooling: 'FAN', keyboard: 'KEY', mouse: 'MSE', headset: 'AUD', speaker: 'SPK' })[product.category] || product.category.toUpperCase();
        const visual = within('[data-detail-visual]');
        visual.className = `pc-detail-visual pc-detail-visual--${product.category}`;
        const image = within('[data-detail-image]');
        const caption = within('[data-detail-image-caption]');
        const imageUrl = product.officialUrl && product.officialImageUrl && !new URL(product.officialImageUrl).hostname.endsWith('caleta.pe') ? product.officialImageUrl : null;
        visual.classList.remove('is-image-loaded');
        if (imageUrl) {
          image.hidden = false;
          image.alt = `Imagen oficial de ${product.name}`;
          image.onload = () => { visual.classList.add('is-image-loaded'); caption.textContent = 'IMAGEN OFICIAL DE LA MARCA'; };
          image.onerror = () => { image.hidden = true; visual.classList.remove('is-image-loaded'); caption.textContent = 'SIN IMAGEN OFICIAL DISPONIBLE'; };
          if (image.src !== imageUrl) image.src = imageUrl;
          else if (image.complete) (image.naturalWidth > 0 ? image.onload : image.onerror)();
        } else {
          image.hidden = true;
          image.removeAttribute('src');
          caption.textContent = 'SIN IMAGEN OFICIAL DISPONIBLE';
        }
        const specs = within('[data-detail-specs]');
        specs.replaceChildren();
        if (product.officialUrl && (Object.keys(product.specs).length || product.detail)) {
          const list = makeElement('dl', 'pc-detail-specs');
          productSpecs(product).forEach(({ label, value }) => {
            const row = makeElement('div');
            row.append(makeElement('dt', '', label), makeElement('dd', '', value));
            list.append(row);
          });
          specs.append(list);
        } else specs.append(makeElement('p', 'pc-detail-pending', 'La ficha de Caleta no aporta más especificaciones para este modelo.'));
        const official = within('[data-detail-official]');
        official.hidden = !product.officialUrl;
        if (product.officialUrl) official.href = product.officialUrl;
        else official.removeAttribute('href');
        const add = within('[data-add-product]');
        add.dataset.addProduct = product.id;
        add.disabled = product.priceNeedsReview;
        add.setAttribute('aria-label', product.priceNeedsReview ? `Precio de ${product.name} por confirmar` : `Añadir ${product.name} a mi selección`);
        within('[data-detail-add-label]').textContent = product.priceNeedsReview ? 'Precio por revisar' : 'Añadir a mi selección';
        const builder = within('[data-detail-builder]');
        builder.hidden = !builderGroups.some((group) => group.category === product.category) || product.priceNeedsReview;
        if (!builder.hidden) builder.href = `${builderHref}?pieza=${encodeURIComponent(product.id)}`;
        within('[data-detail-quantity]').dataset.productQuantity = product.id;
        detailRoot.querySelectorAll('[data-related-id]').forEach((link) => {
          const related = inventory.find((item) => item.id === link.dataset.relatedId);
          link.hidden = !related;
          if (!related) return;
          link.querySelector('[data-related-type]').textContent = related.type;
          link.querySelector('[data-related-name]').textContent = related.name;
          link.querySelector('[data-related-price]').textContent = related.priceNeedsReview ? 'Por confirmar' : formatMoney(related.price);
        });
        document.title = `${product.name} — Nodo PC / Demo`;
      };
      const createCatalogCard = (product, index, featured) => {
        const card = catalogCardTemplate.cloneNode(true);
        card.querySelectorAll('.product-official-image, .product-description, .product-stock, .product-source-links').forEach((node) => node.remove());
        card.className = `product-card${featured ? ' product-card-featured' : ''}`;
        card.dataset.category = product.category;
        card.dataset.productId = product.id;
        card.dataset.index = String(index);
        const art = card.querySelector('.product-art');
        art.className = `product-art product-art--${product.category}${product.id === 'case-white' ? ' product-art--white' : ''}${product.id === 'cooler-liquid' ? ' product-art--liquid' : ''}`;
        art.classList.remove('has-official-image');
        art.querySelector('.product-art-code').textContent = `ND / ${String(index + 1).padStart(3, '0')}`;
        art.querySelector('.product-art-word').textContent = ({ board: 'MB', power: 'PSU', cooling: 'FAN', keyboard: 'KEY', mouse: 'MSE', headset: 'AUD', speaker: 'SPK' })[product.category] || product.category.toUpperCase();
        art.querySelector('.product-object > b').textContent = product.label || product.brand || product.category.toUpperCase();
        art.querySelector('.product-art-brand').textContent = product.brand;
        const tag = art.querySelector('.product-art-tag');
        if (product.tag) tag.textContent = product.tag; else tag.remove();
        if (product.officialImageUrl && !new URL(product.officialImageUrl).hostname.endsWith('caleta.pe')) {
          const picture = makeElement('img', 'product-official-image');
          picture.src = product.officialImageUrl;
          picture.alt = '';
          picture.loading = 'lazy';
          picture.decoding = 'async';
          picture.referrerPolicy = 'no-referrer';
          picture.addEventListener('error', () => { picture.remove(); art.classList.remove('has-official-image'); }, { once: true });
          art.classList.add('has-official-image');
          art.append(picture);
        }
        const info = card.querySelector('.product-info');
        info.querySelector('.product-type').textContent = product.type;
        const quantity = info.querySelector('[data-product-quantity]');
        quantity.dataset.productQuantity = product.id;
        quantity.hidden = !cart.get(product.id)?.quantity;
        quantity.textContent = cart.get(product.id)?.quantity ? `${cart.get(product.id).quantity} en tu lista` : '';
        const detailHref = `/demos/nodo-pc/producto/${encodeURIComponent(product.id)}/`;
        const titleLink = info.querySelector('h3 a');
        titleLink.textContent = product.name;
        titleLink.href = detailHref;
        const detailLink = info.querySelector('.product-detail-link');
        detailLink.href = detailHref;
        detailLink.setAttribute('aria-label', `Ver detalles de ${product.name}`);
        const specs = info.querySelector('.pc-catalog-specs');
        specs.replaceChildren();
        productSpecs(product).forEach(({ label, value }) => {
          const row = makeElement('div');
          row.append(makeElement('dt', '', label), makeElement('dd', '', value));
          specs.append(row);
        });
        if (product.description) {
          const description = makeElement('p', 'product-description', product.description);
          specs.after(description);
        }
        if (product.stockText) {
          const stock = makeElement('p', 'product-stock', `Stock reportado: ${product.stockText}`);
          specs.after(stock);
        }
        const buy = info.querySelector('.product-buy');
        buy.querySelector('small').textContent = product.sourceUrl ? 'Precio referencial en Caleta' : 'Precio de muestra / unidad';
        buy.querySelector('strong').textContent = product.priceNeedsReview ? 'Por confirmar' : formatMoney(product.price);
        const add = buy.querySelector('[data-add-product]');
        add.dataset.addProduct = product.id;
        add.disabled = product.priceNeedsReview;
        add.setAttribute('aria-label', product.priceNeedsReview ? `Precio de ${product.name} por confirmar` : `Añadir ${product.name} a mi selección`);
        add.querySelector('.add-label').textContent = product.priceNeedsReview ? 'Precio por revisar' : 'Añadir a selección';
        const action = info.querySelector('.pc-catalog-use-part');
        if (builderGroups.some((group) => group.category === product.category) && !product.priceNeedsReview) {
          action.href = `${builderHref}?pieza=${encodeURIComponent(product.id)}`;
          action.textContent = 'Ver en configurador ↗';
          action.setAttribute('aria-label', `Probar ${product.name} en el configurador`);
        } else action.remove();
        if (product.officialUrl || product.capturedAt) {
          const links = makeElement('div', 'product-source-links');
          if (product.officialUrl) {
            const official = makeElement('a', '', 'Ficha oficial ↗');
            official.href = product.officialUrl; official.target = '_blank'; official.rel = 'noopener noreferrer';
            links.append(official);
          }
          if (product.capturedAt) {
            const date = new Date(product.capturedAt);
            if (!Number.isNaN(date.getTime())) links.append(makeElement('span', 'product-captured-at', `Precio capturado: ${new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima' }).format(date)}`));
          }
          buy.before(links);
        }
        return card;
      };
      let filterCatalog = () => {};
      if (catalogSearch && catalogCardTemplate) {
        filterCatalog = () => {
          const term = normalize(catalogSearch.value.trim());
          const sort = document.getElementById('catalog-sort').value;
          const matches = catalogProducts.filter((product) =>
            (activeCategory === 'all' || product.category === activeCategory)
            && normalize(`${product.name} ${product.brand} ${product.type} ${product.detail} ${product.description}`).includes(term));
          if (sort === 'price-asc') matches.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
          if (sort === 'price-desc') matches.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
          if (sort === 'name') matches.sort((a, b) => a.name.localeCompare(b.name, 'es'));
          const shown = matches.slice(0, visibleCatalogCount);
          document.getElementById('product-grid').replaceChildren(...shown.map((product, index) =>
            createCatalogCard(product, index, activeCategory === 'all' && !term && sort === 'featured' && index === 0)));
          document.getElementById('catalog-count').textContent = `${matches.length} ${matches.length === 1 ? 'componente encontrado' : 'componentes encontrados'}${shown.length < matches.length ? ` · ${shown.length} visibles` : ''}`;
          document.getElementById('catalog-empty').hidden = matches.length > 0;
          const more = document.getElementById('catalog-more');
          if (more) { more.hidden = shown.length >= matches.length; more.textContent = `Cargar más piezas (${matches.length - shown.length} restantes) ↓`; }
          document.querySelectorAll('[data-filter]').forEach((button) => {
            const count = button.dataset.filter === 'all' ? catalogProducts.length : catalogProducts.filter((product) => product.category === button.dataset.filter).length;
            button.querySelector('span').textContent = String(count).padStart(2, '0');
          });
        };
        document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
          activeCategory = button.dataset.filter;
          visibleCatalogCount = catalogPageSize;
          document.querySelectorAll('[data-filter]').forEach((filter) => { const active = filter === button; filter.classList.toggle('is-active', active); filter.setAttribute('aria-pressed', String(active)); });
          filterCatalog();
        }));
        catalogSearch.addEventListener('input', () => { visibleCatalogCount = catalogPageSize; filterCatalog(); });
        document.getElementById('catalog-sort').addEventListener('change', () => { visibleCatalogCount = catalogPageSize; filterCatalog(); });
        document.getElementById('catalog-more')?.addEventListener('click', () => { visibleCatalogCount += catalogPageSize; filterCatalog(); });
        document.getElementById('reset-catalog').addEventListener('click', () => { catalogSearch.value = ''; document.getElementById('catalog-sort').value = 'featured'; document.querySelector('[data-filter="all"]').click(); catalogSearch.focus(); });
        const initialFilter = document.querySelector(`[data-filter="${activeCategory}"]`);
        if (initialFilter) initialFilter.click(); else filterCatalog();
      }

      const createBuilderOption = (product) => {
        const button = makeElement('button', 'pc-part-option');
        button.type = 'button';
        button.dataset.buildOption = product.id;
        button.dataset.buildCategory = product.category;
        button.dataset.importedOption = 'true';
        button.setAttribute('aria-pressed', 'false');
        button.innerHTML = '<span class="pc-option-top"><span class="pc-option-brand"></span><span class="pc-option-check" aria-hidden="true">✓</span></span><strong class="pc-option-name"></strong><span class="pc-option-detail"></span><span class="pc-option-bottom"><strong class="pc-option-price"></strong><span class="pc-option-state"><span class="pc-option-state-selected">Seleccionado</span><span class="pc-option-state-available">Elegir <span aria-hidden="true">＋</span></span></span></span>';
        button.querySelector('.pc-option-brand').textContent = product.brand;
        button.querySelector('.pc-option-name').textContent = product.name;
        button.querySelector('.pc-option-detail').textContent = product.detail || `${product.brand || product.name} · ${product.type}`;
        button.querySelector('.pc-option-price').textContent = formatMoney(product.price);
        return button;
      };
      const refreshBuilderInventory = (inventory) => {
        if (!builderForm) return;
        selects.forEach((select) => {
          const category = select.dataset.category;
          const previousId = select.value;
          const container = select.closest('.pc-part-card').querySelector('.pc-part-options');
          select.querySelectorAll('[data-imported-option]').forEach((option) => option.remove());
          container.querySelectorAll('[data-imported-option]').forEach((button) => button.remove());
          const choices = inventory.filter((product) => product.category === category && !product.priceNeedsReview);
          choices.forEach((product, index) => {
            if ([...select.options].some((option) => option.value === product.id)) return;
            const option = new Option(`${product.name} · ${formatMoney(product.price)}`, product.id);
            option.dataset.importedOption = 'true';
            select.append(option);
            if (index < 4) container.append(createBuilderOption(product));
          });
          if ([...select.options].some((option) => option.value === previousId)) select.value = previousId;
          if (choices.length) {
            let picker = select.closest('.pc-part-catalog-picker');
            if (!picker) {
              picker = makeElement('label', 'pc-part-catalog-picker', 'Explorar todos los modelos');
              select.before(picker);
              picker.append(select);
            }
            picker.hidden = false;
            select.hidden = false;
            select.tabIndex = 0;
            select.removeAttribute('aria-hidden');
          }
        });
      };
      if (builderForm) {
      const panels = [...document.querySelectorAll('[data-builder-panel]')];
      const optionButtons = () => [...document.querySelectorAll('[data-build-option]')];
      const updateOptionButtons = () => {
        document.querySelectorAll('.pc-part-option-extra').forEach((button) => button.remove());
        selects.forEach((select) => {
          const selected = productById[select.value];
          const container = select.closest('.pc-part-card').querySelector('.pc-part-options');
          if (selected?.sourceUrl && ![...container.querySelectorAll('[data-build-option]')].some((button) => button.dataset.buildOption === select.value)) {
            const extra = createBuilderOption(selected);
            extra.classList.add('pc-part-option-extra');
            container.prepend(extra);
          }
        });
        optionButtons().forEach((button) => {
          const select = selects.find((item) => item.dataset.category === button.dataset.buildCategory);
          const active = select?.value === button.dataset.buildOption;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
      };
      const saveDraft = () => {
        try { localStorage.setItem(draftKey, JSON.stringify({ ids: selects.map((select) => select.value), assembly: assemblyToggle.checked, step: currentStep, editingBuildId: editingBuildId && cart.has(editingBuildId) ? editingBuildId : null })); } catch { /* El configurador sigue funcionando sin almacenamiento. */ }
      };
      const showStep = (step, focus = false) => {
        currentStep = Math.max(1, Math.min(4, step));
        document.getElementById('armado').dataset.currentStep = String(currentStep);
        panels.forEach((panel) => { panel.hidden = Number(panel.dataset.builderPanel) !== currentStep; });
        document.querySelectorAll('[data-builder-step]').forEach((control) => {
          const active = Number(control.dataset.builderStep) === currentStep;
          control.classList.toggle('is-active', active);
          if (active) control.setAttribute('aria-current', 'step'); else control.removeAttribute('aria-current');
        });
        const progress = document.getElementById('builder-progress-text');
        if (progress) progress.textContent = `Paso ${currentStep} de 4`;
        saveDraft();
        if (focus) {
          const panel = panels.find((item) => Number(item.dataset.builderPanel) === currentStep);
          const heading = panel?.querySelector('h2, h3');
          if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
          (panel || document.getElementById('armado')).scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
        }
      };
      const calculateBuild = () => {
        updateOptionButtons();
        const chosen = selects.map((select) => productById[select.value]);
        const partsTotal = chosen.reduce((sum, product) => sum + product.price, 0);
        const total = partsTotal + (assemblyToggle.checked ? assemblyFee : 0);
        document.getElementById('build-total').textContent = formatMoney(total);
        document.getElementById('build-parts-total').textContent = formatMoney(partsTotal);
        document.getElementById('build-assembly-total').textContent = assemblyToggle.checked ? formatMoney(assemblyFee) : 'No incluido';
        document.querySelectorAll('[data-mobile-build-total]').forEach((element) => { element.textContent = formatMoney(total); });
        const preset = presets.find((item) => item.id === selectedPreset); document.getElementById('build-name').textContent = `${preset ? preset.name : 'a tu medida'}.`;
        const lists = [document.getElementById('build-summary-specs'), ...document.querySelectorAll('[data-build-review-specs]')];
        lists.forEach((list) => list.replaceChildren());
        chosen.forEach((product, index) => {
          document.querySelector(`[data-part-price="${product.category}"]`).textContent = formatMoney(product.price);
          document.querySelector(`[data-part-detail="${product.category}"]`).textContent = product.detail || `${product.brand || product.name} · ${product.type}`;
          lists.forEach((list) => { const entry = document.createElement('div'); const term = document.createElement('dt'); term.textContent = builderGroups[index].type; const value = document.createElement('dd'); value.textContent = product.name; entry.append(term, value); list.append(entry); });
        });
        document.querySelectorAll('[data-build-review-assembly]').forEach((element) => { element.textContent = assemblyToggle.checked ? formatMoney(assemblyFee) : 'No incluido'; });
        const needsPower = chosen.some((part) => part.id === 'caleta-8190') && chosen.some((part) => part.id === 'caleta-10398');
        const notice = document.getElementById('build-compatibility'); notice.classList.toggle('needs-review', needsPower);
        const importedPart = chosen.some((part) => Boolean(part.sourceUrl));
        const compatibilityMessage = needsPower ? 'La RTX 5070 con fuente de 650 W requiere revisión técnica. Puedes comparar la opción de 850 W del catálogo antes de decidir.'
          : importedPart ? 'La compatibilidad de esta selección no está verificada. Comprueba socket, memoria, potencia, conectores y medidas antes de comprar.'
            : 'Esta configuración de muestra usa plataforma AM5 y memoria DDR5. BIOS, conectores y medidas requieren una revisión técnica.';
        notice.replaceChildren(); const arrow = document.createElement('span'); arrow.textContent = '↳'; notice.append(arrow, document.createTextNode(compatibilityMessage));
        document.querySelectorAll('[data-build-review-compatibility]').forEach((element) => { element.textContent = compatibilityMessage; element.classList.toggle('needs-review', needsPower); });
        document.querySelectorAll('[data-recommend-psu]').forEach((button) => { button.hidden = !needsPower; });
        saveDraft();
        return { total, chosen };
      };
      const setPreset = (id) => {
        const preset = presets.find((item) => item.id === id); if (!preset) return;
        selectedPreset = id; selects.forEach((select, index) => { select.value = preset.ids[index]; });
        document.querySelectorAll('.build-preset').forEach((button) => { const active = button.dataset.selectPreset === id; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
        calculateBuild();
      };
      const syncPresetFromChoices = () => {
        const matchingPreset = presets.find((preset) => preset.ids.every((id, index) => id === selects[index].value)); selectedPreset = matchingPreset?.id || '';
        document.querySelectorAll('.build-preset').forEach((button) => { const active = button.dataset.selectPreset === selectedPreset; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
        calculateBuild();
      };
      const endBuildEdit = () => {
        editingBuildId = null;
        document.querySelector('.builder-add').firstChild.textContent = 'Añadir PC a mi selección ';
        document.getElementById('cancel-edit-build').hidden = true;
        saveDraft();
      };
      document.querySelectorAll('[data-select-preset]').forEach((button) => button.addEventListener('click', () => { setPreset(button.dataset.selectPreset); if (button.hasAttribute('data-jump-builder')) showStep(2, true); }));
      selects.forEach((select) => select.addEventListener('change', syncPresetFromChoices));
      document.querySelector('.pc-builder-parts').addEventListener('click', (event) => {
        const button = event.target.closest('[data-build-option]');
        if (!button) return;
        const select = selects.find((item) => item.dataset.category === button.dataset.buildCategory);
        if (select && select.value !== button.dataset.buildOption) { select.value = button.dataset.buildOption; syncPresetFromChoices(); }
      });
      assemblyToggle.addEventListener('change', calculateBuild);
      document.getElementById('cancel-edit-build').addEventListener('click', endBuildEdit);
      document.querySelectorAll('[data-builder-next]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.builderNext) || currentStep + 1, true)));
      document.querySelectorAll('[data-builder-back]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.builderBack) || currentStep - 1, true)));
      document.querySelectorAll('[data-builder-step]').forEach((button) => button.addEventListener('click', () => showStep(Number(button.dataset.builderStep), true)));
      document.querySelectorAll('[data-builder-reset]').forEach((button) => button.addEventListener('click', () => { endBuildEdit(); assemblyToggle.checked = false; setPreset('gaming'); showStep(1, true); }));
      document.querySelectorAll('[data-recommend-psu]').forEach((button) => button.addEventListener('click', () => {
        const power = document.getElementById('build-power'); power.value = 'caleta-9742'; syncPresetFromChoices(); showStep(2, true);
        window.requestAnimationFrame(() => power.focus({ preventScroll: true }));
      }));
      builderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (currentStep !== 4) { showStep(4, true); return; }
        const built = makeBuildItem(selects.map((select) => select.value), assemblyToggle.checked);
        if (!built) return;
        if (editingBuildId && cart.has(editingBuildId)) {
          const quantity = cart.get(editingBuildId).quantity;
          cart.delete(editingBuildId);
          const existing = cart.get(built.id);
          if (existing) existing.quantity = Math.min(maxQuantity, existing.quantity + quantity);
          else cart.set(built.id, { ...built, quantity });
          renderCart(); showToast('Armado actualizado en tu selección.'); endBuildEdit();
        } else { addItem(built); endBuildEdit(); }
        openCart();
      });
      let savedDraft = null;
      try { savedDraft = JSON.parse(localStorage.getItem(draftKey) || 'null'); } catch { /* Se ignora un borrador inválido. */ }
      if (savedDraft && Array.isArray(savedDraft.ids) && makeBuildItem(savedDraft.ids, false)) {
        selects.forEach((select, index) => { select.value = savedDraft.ids[index]; });
        assemblyToggle.checked = savedDraft.assembly === true;
        editingBuildId = typeof savedDraft.editingBuildId === 'string' && cart.has(savedDraft.editingBuildId) ? savedDraft.editingBuildId : null;
        syncPresetFromChoices();
        currentStep = Number.isInteger(savedDraft.step) ? savedDraft.step : 1;
      } else calculateBuild();
      const editId = query.get('edit');
      const editedItem = editId ? cart.get(editId) : null;
      if (editedItem?.category === 'build') {
        editingBuildId = editedItem.id;
        selects.forEach((select, index) => { select.value = editedItem.selections[index]; });
        assemblyToggle.checked = editedItem.assembly;
        syncPresetFromChoices();
        currentStep = 2;
      } else if (presets.some((preset) => preset.id === query.get('perfil'))) {
        endBuildEdit(); setPreset(query.get('perfil')); currentStep = 2;
      } else if (typeof query.get('pieza') === 'string' && Object.hasOwn(productById, query.get('pieza'))) {
        const product = productById[query.get('pieza')];
        const select = selects.find((item) => item.dataset.category === product.category);
        if (select) { endBuildEdit(); select.value = product.id; syncPresetFromChoices(); currentStep = 2; }
      }
      if (editingBuildId) {
        document.querySelector('.builder-add').firstChild.textContent = 'Actualizar PC en mi selección ';
        document.getElementById('cancel-edit-build').hidden = false;
      }
      showStep(currentStep);
      if (query.has('edit') || query.has('perfil') || query.has('pieza')) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      }
      if (!builderForm) document.querySelectorAll('[data-select-preset]').forEach((button) => button.addEventListener('click', () => { window.location.assign(`${builderHref}?perfil=${encodeURIComponent(button.dataset.selectPreset)}`); }));
      document.addEventListener('click', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const addButton = target?.closest('[data-add-product]');
        if (addButton) { const product = productById[addButton.dataset.addProduct]; if (product) { addItem(makeProductItem(product)); addButton.classList.add('is-added'); window.setTimeout(() => addButton.classList.remove('is-added'), 1400); } }
        const actionButton = target?.closest('[data-cart-action]');
        if (actionButton) {
          const item = cart.get(actionButton.dataset.itemId); if (!item) return;
          const action = actionButton.dataset.cartAction, itemId = item.id;
          if (action === 'edit' && item.category === 'build') {
            window.location.assign(`${builderHref}?edit=${encodeURIComponent(item.id)}`);
            return;
          }
          const rowIndex = [...cartItems.querySelectorAll('.cart-line')].indexOf(actionButton.closest('.cart-line'));
          if (action === 'remove' || (action === 'decrease' && item.quantity === 1)) cart.delete(item.id);
          else if (action === 'decrease') item.quantity -= 1;
          else if (item.quantity < maxQuantity) item.quantity += 1;
          renderCart();
          const replacement = [...cartItems.querySelectorAll('[data-cart-action]')].find((button) => button.dataset.itemId === itemId && button.dataset.cartAction === action);
          const nearbyRow = [...cartItems.querySelectorAll('.cart-line')][Math.min(rowIndex, cartItems.querySelectorAll('.cart-line').length - 1)];
          (replacement || nearbyRow?.querySelector('button') || cartItems.querySelector('button') || document.querySelector('.cart-close')).focus();
        }
        const emptyBrowse = target?.closest('#empty-cart-browse'), emptyBuild = target?.closest('#empty-cart-build');
        if (emptyBrowse || emptyBuild) goToSection(emptyBuild ? 'armado' : 'catalogo');
      });
      ['open-cart', 'banner-open-cart', 'toast-open-cart'].forEach((id) => document.getElementById(id)?.addEventListener('click', openCart));
      cartDialog.addEventListener('click', (event) => { const bounds = cartDialog.getBoundingClientRect(); if (event.target === cartDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) cartDialog.close(); });
      cartDialog.addEventListener('close', () => document.body.classList.remove('cart-is-open'));
      const cartObserver = new MutationObserver(() => document.body.classList.toggle('cart-is-open', cartDialog.open)); cartObserver.observe(cartDialog, { attributes: true, attributeFilter: ['open'] });
      noteInput.addEventListener('input', () => { updateOrderLink(); try { localStorage.setItem(noteStorageKey, noteInput.value); } catch { /* La nota se conserva durante esta visita. */ } });
      sendOrder.addEventListener('click', (event) => { if (!cart.size) { event.preventDefault(); showToast('Añade una pieza o una PC para comenzar.'); } });
      renderCart(false);
      window.addEventListener('pageshow', (event) => { if (event.persisted) { restoreCart(); renderCart(false); } });
      window.addEventListener('storage', (event) => { if (event.key === storageKey || event.key === noteStorageKey || event.key === null) { restoreCart(); renderCart(false); } });

      const applyInventory = (rows, source) => {
        if (!Array.isArray(rows)) return;
        const inventory = rows.map(fromCatalogRow).filter(Boolean)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'es'));
        if (!inventory.length) return;
        document.documentElement.dataset.nodoCatalogSource = source;
        if (source === 'local') fallbackInventory = inventory;
        catalogProducts = inventory;
        productById = Object.assign(Object.create(null), Object.fromEntries(
          [...products, ...fallbackInventory, ...inventory].map((product) => [product.id, product])));
        renderDetail(productById[detailRoot?.dataset.detailId], inventory);
        visibleCatalogCount = catalogPageSize;
        document.querySelectorAll('[data-catalog-total], [data-catalog-home-count]').forEach((element) => {
          element.textContent = String(inventory.length);
        });
        document.querySelectorAll('[data-catalog-origin]').forEach((element) => { element.textContent = 'Inventario referencial de Caleta'; });
        document.querySelectorAll('[data-catalog-price-caption]').forEach((element) => { element.textContent = 'PRECIOS CAPTURADOS EN CALETA / PEN'; });
        document.querySelectorAll('[data-home-product-price]').forEach((element) => {
          const product = productById[element.dataset.homeProductPrice];
          if (product) element.textContent = product.priceNeedsReview ? 'Por confirmar' : formatMoney(product.price);
        });
        document.querySelectorAll('[data-home-preset-total]').forEach((element) => {
          const preset = presets.find((item) => item.id === element.dataset.homePresetTotal);
          if (!preset) return;
          const total = preset.ids.reduce((sum, id) => sum + (Number(productById[id]?.price) || 0), 0);
          element.textContent = formatMoney(total);
        });
        const note = document.querySelector('[data-catalog-note]');
        if (note) {
          const marker = makeElement('span', '', 'i');
          const timestamps = inventory.map((product) => Date.parse(product.capturedAt)).filter(Number.isFinite);
          const capturedAt = timestamps.length ? new Date(Math.max(...timestamps)) : new Date();
          const captureDate = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima' }).format(capturedAt);
          note.replaceChildren(marker, document.createTextNode(` Precios y stock referenciales capturados de Caleta el ${captureDate}, sujetos a cambio. Las descripciones se basan en las fichas de Caleta y las fotografías disponibles vienen de páginas oficiales de las marcas. Nodo PC es una demo de portafolio: aquí no se procesan compras ni pagos.`));
        }
        filterCatalog();
        refreshBuilderInventory(inventory);
        if (builderForm) {
          const requested = requestedPartApplied ? null : query.get('pieza');
          const product = requested && productById[requested];
          const select = product && !product.priceNeedsReview && selects.find((item) => item.dataset.category === product.category);
          if (select && [...select.options].some((option) => option.value === requested)) {
            select.value = requested;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            document.querySelector('[data-builder-step="2"]')?.click();
            requestedPartApplied = true;
          } else selects[0]?.dispatchEvent(new Event('change', { bubbles: true }));
        }
        restoreCart();
        renderCart(false);
      };
      const loadCatalog = async () => {
        const localLoader = Object.values(import.meta.glob('../data/nodoPcCatalog.json'))[0];
        let localRows = [];
        if (localLoader) {
          try {
            const file = await localLoader();
            localRows = Array.isArray(file.default) ? file.default : [];
            applyInventory(localRows, 'local');
          } catch (error) { console.warn('No se pudo abrir el inventario local de Nodo PC.', error); }
        }
        const url = import.meta.env.PUBLIC_SUPABASE_URL;
        const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        try {
          const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
          const rows = [];
          const pageSize = 1000;
          for (let from = 0; ; from += pageSize) {
            const { data, error } = await supabase.from('nodo_pc_products').select('*')
              .eq('published', true).order('sort_order', { ascending: true })
              .order('name', { ascending: true }).range(from, from + pageSize - 1);
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < pageSize) break;
          }
          // The checked Caleta snapshot owns product copy and image provenance.
          // Remote inventory may update price/availability, but cannot replace
          // those fields with older brand copy or unverified image URLs.
          const localById = new Map(localRows.map((row) => [row.id, row]));
          const verifiedRows = rows.flatMap((remote) => {
            const local = localById.get(remote.id);
            if (!local) return [];
            return [{ ...local,
              price_pen: remote.price_pen ?? local.price_pen,
              stock_text: remote.stock_text ?? local.stock_text,
              stock_quantity: remote.stock_quantity ?? local.stock_quantity,
              published: remote.published !== false && local.published !== false,
              captured_at: remote.captured_at || local.captured_at,
            }];
          });
          if (verifiedRows.length) applyInventory(verifiedRows, 'supabase');
        } catch (error) { console.warn('No se pudo cargar Nodo PC desde Supabase; sigue disponible el inventario local.', error); }
      };
      loadCatalog();
