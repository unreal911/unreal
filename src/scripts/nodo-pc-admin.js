import { createClient } from '@supabase/supabase-js';

const loginView = document.getElementById('login-view');
const deniedView = document.getElementById('denied-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const editDialog = document.getElementById('edit-dialog');
const editForm = document.getElementById('edit-form');
const editMessage = document.getElementById('edit-message');
const productsBody = document.getElementById('products-body');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const statusFilter = document.getElementById('status-filter');
const pageSize = 40;
const categories = {
  cpu: 'Procesadores', board: 'Placas madre', ram: 'Memoria', ssd: 'Almacenamiento', gpu: 'Gráficas',
  case: 'Cases', power: 'Fuentes', cooling: 'Refrigeración', keyboard: 'Teclados', mouse: 'Mouse',
  headset: 'Audífonos', speaker: 'Parlantes',
};
const money = (value) => value == null ? '—' : `S/ ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const normalize = (value) => String(value ?? '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const config = {
  url: import.meta.env.PUBLIC_SUPABASE_URL,
  key: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
};
let supabase;
let products = [];
let filteredProducts = [];
let currentPage = 1;
let editingProduct = null;
let toastTimer;

function showView(view) {
  loginView.hidden = view !== 'login';
  deniedView.hidden = view !== 'denied';
  adminView.hidden = view !== 'admin';
}

function setLoginMessage(message, error = true) {
  loginMessage.textContent = message;
  loginMessage.classList.toggle('is-success', !error);
}

function notify(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

function formatError(error) {
  const message = error?.message || 'Ocurrió un error inesperado.';
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(message)) return 'Confirma el correo de esta cuenta antes de iniciar sesión.';
  if (/row-level security|permission denied|not allowed/i.test(message)) return 'Supabase rechazó el cambio. Confirma que esta cuenta tenga permisos de administrador.';
  return message;
}

async function enterPanel(session) {
  if (!session) {
    showView('login');
    return;
  }
  const role = session.user?.app_metadata?.role;
  if (role !== 'admin') {
    showView('denied');
    return;
  }
  showView('admin');
  const email = session.user.email || 'Administrador';
  document.getElementById('account-email').textContent = email;
  document.getElementById('account-avatar').textContent = email.slice(0, 1).toUpperCase();
  await loadProducts();
}

async function loadProducts() {
  productsBody.innerHTML = '<tr><td colspan="6" class="table-loading"><span class="loader"></span> Cargando catálogo…</td></tr>';
  document.getElementById('last-updated').textContent = 'Sincronizando con Supabase…';
  try {
    const all = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from('nodo_pc_products').select('*').order('sort_order').order('name').range(offset, offset + 999);
      if (error) throw error;
      all.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    products = all;
    document.getElementById('last-updated').textContent = `Actualizado ${new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
    renderStats();
    renderProducts();
  } catch (error) {
    productsBody.innerHTML = `<tr><td colspan="6" class="empty-row">${escapeHtml(formatError(error))}</td></tr>`;
    document.getElementById('last-updated').textContent = 'No se pudo sincronizar';
    notify(formatError(error));
  }
}

function renderStats() {
  document.getElementById('stat-total').textContent = products.length.toLocaleString('es-PE');
  document.getElementById('stat-published').textContent = products.filter((product) => product.published).length.toLocaleString('es-PE');
  document.getElementById('stat-review').textContent = products.filter((product) => product.price_needs_review || product.price_pen == null).length.toLocaleString('es-PE');
  document.getElementById('stat-empty').textContent = products.filter((product) => product.stock_quantity === 0 || String(product.stock_text).trim() === '0').length.toLocaleString('es-PE');
  document.getElementById('sidebar-count').textContent = products.length.toLocaleString('es-PE');
}

function getFilteredProducts() {
  const query = normalize(searchInput.value.trim());
  const category = categoryFilter.value;
  const status = statusFilter.value;
  return products.filter((product) => {
    const matchesQuery = !query || normalize([product.name, product.brand, product.source_sku, product.id].join(' ')).includes(query);
    const matchesCategory = category === 'all' || product.category === category;
    const matchesStatus = status === 'all'
      || (status === 'published' && product.published)
      || (status === 'draft' && !product.published)
      || (status === 'review' && (product.price_needs_review || product.price_pen == null));
    return matchesQuery && matchesCategory && matchesStatus;
  });
}

function renderProducts() {
  filteredProducts = getFilteredProducts();
  const pages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  currentPage = Math.min(currentPage, pages);
  const start = (currentPage - 1) * pageSize;
  const visible = filteredProducts.slice(start, start + pageSize);
  document.getElementById('result-count').textContent = `${filteredProducts.length.toLocaleString('es-PE')} ${filteredProducts.length === 1 ? 'producto' : 'productos'}`;
  document.getElementById('page-summary').textContent = filteredProducts.length ? `Mostrando ${start + 1}–${Math.min(start + pageSize, filteredProducts.length)} de ${filteredProducts.length}` : 'Sin resultados';
  document.getElementById('page-current').textContent = `${currentPage} / ${pages}`;
  document.getElementById('prev-page').disabled = currentPage <= 1;
  document.getElementById('next-page').disabled = currentPage >= pages;
  if (!visible.length) {
    productsBody.innerHTML = '<tr><td colspan="6" class="empty-row">No encontramos productos con esos filtros.</td></tr>';
    return;
  }
  productsBody.innerHTML = visible.map((product) => {
    const needsReview = product.price_needs_review || product.price_pen == null;
    const state = needsReview
      ? '<span class="state-badge state-review"><i></i> Revisar precio</span>'
      : product.published
        ? '<span class="state-badge state-published"><i></i> Publicado</span>'
        : '<span class="state-badge state-draft"><i></i> Borrador</span>';
    const initials = escapeHtml((product.brand || product.name || 'N').slice(0, 2).toUpperCase());
    const stock = product.stock_text || (product.stock_quantity == null ? '—' : String(product.stock_quantity));
    return `<tr>
      <td><div class="product-cell"><span class="product-thumb">${initials}</span><span class="product-copy"><strong class="product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</strong><small class="product-meta">${escapeHtml(product.brand || 'Sin marca')} · ${escapeHtml(product.source_sku || product.id)}</small></span></div></td>
      <td><span class="category-tag">${escapeHtml(categories[product.category] || product.category)}</span></td>
      <td class="price-cell">${money(product.price_pen)}</td>
      <td class="stock-cell">${escapeHtml(stock)}</td>
      <td>${state}</td>
      <td><button class="edit-row" type="button" data-edit-id="${escapeHtml(product.id)}">Editar</button></td>
    </tr>`;
  }).join('');
}

function openEditor(product) {
  editingProduct = product;
  editMessage.textContent = '';
  document.getElementById('edit-product-id').textContent = product.source_sku ? `SKU ${product.source_sku}` : product.id;
  const set = (name, value) => { editForm.elements.namedItem(name).value = value ?? ''; };
  set('name', product.name);
  set('brand', product.brand);
  set('category', product.category);
  set('type', product.type);
  set('price_pen', product.price_pen);
  set('stock_text', product.stock_text);
  set('stock_quantity', product.stock_quantity);
  set('label', product.label);
  set('detail', product.detail);
  set('description', product.description);
  set('official_url', product.official_url);
  set('official_image_url', product.official_image_url);
  set('tag', product.tag);
  editForm.elements.namedItem('published').checked = Boolean(product.published);
  editForm.elements.namedItem('price_needs_review').checked = Boolean(product.price_needs_review);
  editDialog.showModal();
}

function readOptionalNumber(value) {
  const normalized = String(value).trim();
  return normalized === '' ? null : Number(normalized);
}

async function saveProduct(event) {
  event.preventDefault();
  if (!editingProduct) return;
  const form = new FormData(editForm);
  const price = readOptionalNumber(form.get('price_pen'));
  const stockQuantity = readOptionalNumber(form.get('stock_quantity'));
  if ((price !== null && (!Number.isFinite(price) || price < 0)) || (stockQuantity !== null && (!Number.isInteger(stockQuantity) || stockQuantity < 0))) {
    editMessage.textContent = 'Revisa el precio y las unidades ingresadas.';
    return;
  }
  const patch = {
    name: String(form.get('name')).trim(),
    brand: String(form.get('brand') || '').trim() || null,
    category: form.get('category'),
    type: String(form.get('type') || '').trim(),
    price_pen: price,
    stock_text: String(form.get('stock_text') || '').trim() || null,
    stock_quantity: stockQuantity,
    label: String(form.get('label') || '').trim() || null,
    detail: String(form.get('detail') || '').trim() || null,
    description: String(form.get('description') || '').trim() || null,
    official_url: String(form.get('official_url') || '').trim() || null,
    official_image_url: String(form.get('official_image_url') || '').trim() || null,
    tag: String(form.get('tag') || '').trim() || null,
    published: editForm.elements.namedItem('published').checked,
    price_needs_review: editForm.elements.namedItem('price_needs_review').checked,
    updated_at: new Date().toISOString(),
  };
  const saveButton = document.getElementById('save-button');
  saveButton.disabled = true;
  saveButton.textContent = 'Guardando…';
  editMessage.textContent = '';
  try {
    const { data, error } = await supabase.from('nodo_pc_products').update(patch).eq('id', editingProduct.id).select('*').single();
    if (error) throw error;
    products = products.map((product) => product.id === data.id ? data : product);
    renderStats();
    renderProducts();
    editDialog.close();
    notify('Ficha actualizada correctamente.');
  } catch (error) {
    editMessage.textContent = formatError(error);
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = 'Guardar cambios <span>↗</span>';
  }
}

if (!config.url || !config.key) {
  showView('login');
  loginMessage.textContent = 'Falta configurar PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY.';
} else {
  supabase = createClient(config.url, config.key);
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      setLoginMessage(formatError(error));
      showView('login');
    } else enterPanel(data.session);
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) showView('login');
  });
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) return;
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.querySelector('span').textContent = 'Verificando…';
  setLoginMessage('');
  try {
    const email = loginForm.elements.namedItem('email').value.trim();
    const password = loginForm.elements.namedItem('password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await enterPanel(data.session);
  } catch (error) {
    setLoginMessage(formatError(error));
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = 'Entrar al panel';
  }
});

async function signOut() {
  await supabase?.auth.signOut();
  showView('login');
  loginForm.reset();
  setLoginMessage('');
}

document.getElementById('signout-button').addEventListener('click', signOut);
document.getElementById('denied-signout').addEventListener('click', signOut);
document.getElementById('refresh-button').addEventListener('click', loadProducts);
searchInput.addEventListener('input', () => { currentPage = 1; renderProducts(); });
categoryFilter.addEventListener('change', () => { currentPage = 1; renderProducts(); });
statusFilter.addEventListener('change', () => { currentPage = 1; renderProducts(); });
document.getElementById('prev-page').addEventListener('click', () => { currentPage -= 1; renderProducts(); });
document.getElementById('next-page').addEventListener('click', () => { currentPage += 1; renderProducts(); });
productsBody.addEventListener('click', (event) => {
  const button = event.target.closest('[data-edit-id]');
  if (button) {
    const product = products.find((item) => item.id === button.dataset.editId);
    if (product) openEditor(product);
  }
});
editForm.addEventListener('submit', saveProduct);
document.getElementById('close-dialog').addEventListener('click', () => editDialog.close());
document.getElementById('cancel-edit').addEventListener('click', () => editDialog.close());
editDialog.addEventListener('click', (event) => { if (event.target === editDialog) editDialog.close(); });
document.getElementById('today-label').textContent = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium' }).format(new Date());
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !adminView.hidden) {
    event.preventDefault();
    searchInput.focus();
  }
});
