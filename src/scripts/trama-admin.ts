import type { Session } from '@supabase/supabase-js';
import { formatPrice, type TramaProduct } from '../data/trama';
import { createTramaClient } from '../lib/trama-supabase';

type CatalogProduct = TramaProduct & { published: boolean };

const photoBucket = 'trama-product-images';
const maxPhotoBytes = 5 * 1024 * 1024;
const photoExtensions = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

const authView = document.querySelector<HTMLElement>('#trama-admin-auth')!;
const authStatus = document.querySelector<HTMLParagraphElement>('#trama-auth-status')!;
const login = document.querySelector<HTMLFormElement>('#trama-admin-login')!;
const loginFields = login.querySelector('fieldset')!;
const signoutButtons = document.querySelectorAll<HTMLButtonElement>('[data-trama-signout]');
const panel = document.querySelector<HTMLElement>('#trama-admin-panel')!;
const panelTitle = document.querySelector<HTMLElement>('#trama-admin-title')!;
const account = document.querySelector<HTMLElement>('#trama-admin-account')!;
const editor = document.querySelector<HTMLFormElement>('#trama-product-form')!;
const editorFields = editor.querySelector('fieldset')!;
const category = editor.querySelector<HTMLSelectElement>('select[name="category"]')!;
const photoFile = editor.querySelector<HTMLInputElement>('input[name="photo"]')!;
const clearPhoto = document.querySelector<HTMLButtonElement>('#trama-photo-clear')!;
const editorTitle = document.querySelector<HTMLElement>('#trama-editor-title')!;
const editorStatus = document.querySelector<HTMLParagraphElement>('#trama-editor-status')!;
const submit = editor.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const cancel = document.querySelector<HTMLButtonElement>('#trama-editor-cancel')!;
const refresh = document.querySelector<HTMLButtonElement>('#trama-inventory-refresh')!;
const inventoryStatus = document.querySelector<HTMLParagraphElement>('#trama-inventory-status')!;
const inventory = document.querySelector<HTMLUListElement>('#trama-inventory-list')!;
const rowTemplate = document.querySelector<HTMLTemplateElement>('#trama-inventory-row')!;

function setStatus(element: HTMLElement, message: string, error = false) {
  element.textContent = message;
  element.classList.toggle('has-error', error);
}

function input(name: string) {
  return editor.elements.namedItem(name) as HTMLInputElement;
}

function variants(value: string) {
  return [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
}

function validImage(value: string) {
  if (/[\s\\]/.test(value)) return false;
  if (value.startsWith('/images/trama/')) return value.length > '/images/trama/'.length;
  try {
    const url = new URL(value);
    return value.startsWith('https://') && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function photoFileError(file: File | undefined) {
  if (!file) return '';
  if (!photoExtensions.has(file.type)) return 'Elige una foto JPG, PNG o WebP.';
  if (file.size === 0 || file.size > maxPhotoBytes) return 'Elige un archivo de hasta 5 MB que contenga una foto.';
  return '';
}

function newId(name: string) {
  const slug = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').slice(0, 70).replace(/^-|-$/g, '');
  const suffix = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0');
  return `${slug || 'producto'}-${suffix}`;
}

function start() {
  const client = createTramaClient();
  if (!client) {
    setStatus(authStatus, 'Conecta el proyecto Supabase de Trama para iniciar sesión.', true);
    return;
  }

  let adminId: string | null = null;
  let sessionVersion = 0;
  let inventoryVersion = 0;
  let editingId: string | null = null;
  let draftId: string | null = null;
  let uploadPath: string | null = null;

  function updatePhotoFile() {
    uploadPath = null;
    const file = photoFile.files?.[0];
    clearPhoto.hidden = !file;
    photoFile.setCustomValidity(photoFileError(file));
  }

  function resetEditor() {
    editingId = null;
    draftId = null;
    editor.reset();
    updatePhotoFile();
    editorTitle.textContent = 'Nuevo producto';
    submit.textContent = 'Crear producto';
    cancel.hidden = true;
    setStatus(editorStatus, '');
  }

  function editProduct(product: CatalogProduct) {
    if (editorFields.disabled) return;
    resetEditor();
    editingId = product.id;
    editorTitle.textContent = 'Editar producto';
    submit.textContent = 'Guardar cambios';
    cancel.hidden = false;
    input('name').value = product.name;
    category.value = product.category;
    input('price').value = String(product.price);
    input('label').value = product.label;
    input('material').value = product.material;
    input('image').value = product.image;
    input('colors').value = product.colors.join(', ');
    input('sizes').value = product.sizes.join(', ');
    input('published').checked = product.published;
    input('name').focus();
  }

  function renderProducts(products: CatalogProduct[]) {
    const rows = document.createDocumentFragment();
    for (const product of products) {
      const row = rowTemplate.content.cloneNode(true) as DocumentFragment;
      const image = row.querySelector('img')!;
      if (validImage(product.image)) image.src = product.image;
      row.querySelector('[data-name]')!.textContent = product.name;
      row.querySelector('[data-details]')!.textContent = formatPrice(product.price);
      const badge = row.querySelector<HTMLElement>('[data-publication]')!;
      badge.textContent = product.published ? 'Publicado' : 'Borrador';
      badge.classList.toggle('is-published', product.published);
      const edit = row.querySelector<HTMLButtonElement>('[data-edit]')!;
      edit.setAttribute('aria-label', `Editar ${product.name}`);
      edit.addEventListener('click', () => editProduct(product));
      rows.append(row);
    }
    inventory.replaceChildren(rows);
    setStatus(inventoryStatus, products.length
      ? `${products.length} ${products.length === 1 ? 'producto' : 'productos'}`
      : 'Aún no hay productos guardados.');
  }

  async function loadProducts() {
    if (!adminId) return;
    const version = ++inventoryVersion;
    refresh.disabled = true;
    setStatus(inventoryStatus, 'Cargando productos…');
    try {
      const products: CatalogProduct[] = [];
      const pageSize = 100;
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await client!.from('trama_products')
          .select('id,name,category,label,material,image,price,colors,sizes,published')
          .order('sort_order').order('id').range(offset, offset + pageSize - 1);
        if (version !== inventoryVersion) return;
        if (error) throw error;
        products.push(...data);
        if (data.length < pageSize) break;
      }
      renderProducts(products);
    } catch {
      if (version === inventoryVersion) {
        setStatus(inventoryStatus, 'No se pudo cargar el catálogo. Intenta actualizar.', true);
      }
    } finally {
      if (version === inventoryVersion) refresh.disabled = false;
    }
  }

  function updateSession(session: Session | null) {
    const isAdmin = session?.user.app_metadata.trama_admin === true;
    const nextAdminId = isAdmin ? session.user.id : null;
    const adminChanged = adminId !== nextAdminId;
    if (adminChanged) {
      adminId = nextAdminId;
      sessionVersion++;
      inventoryVersion++;
      resetEditor();
      inventory.replaceChildren();
      setStatus(inventoryStatus, '');
    }
    authView.hidden = isAdmin;
    panel.hidden = !isAdmin;
    login.hidden = Boolean(session);
    loginFields.disabled = Boolean(session);
    signoutButtons[0].hidden = !session;

    if (!isAdmin) {
      editorFields.disabled = true;
      setStatus(authStatus, session ? 'Esta cuenta no tiene acceso al catálogo de Trama.' : '', Boolean(session));
      return;
    }

    account.textContent = session.user.email ?? '';
    if (adminChanged) {
      panelTitle.focus();
      editorFields.disabled = false;
      const version = sessionVersion;
      // Supabase auth callbacks run while the client updates its session.
      window.setTimeout(() => {
        if (version === sessionVersion) void loadProducts();
      }, 0);
    }
  }

  client.auth.onAuthStateChange((_event, session) => updateSession(session));

  login.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (loginFields.disabled) return;
    const form = new FormData(login);
    loginFields.disabled = true;
    setStatus(authStatus, 'Iniciando sesión…');
    try {
      const { error } = await client.auth.signInWithPassword({
        email: String(form.get('email')).trim(),
        password: String(form.get('password')),
      });
      if (error) throw error;
      login.reset();
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = code === 'invalid_credentials'
        ? 'Revisa el correo y la contraseña.'
        : 'No se pudo iniciar sesión. Intenta nuevamente.';
      setStatus(authStatus, message, true);
      loginFields.disabled = false;
    }
  });

  for (const button of signoutButtons) {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const { error } = await client.auth.signOut({ scope: 'local' });
        if (error) throw error;
        login.querySelector('input')?.focus();
      } catch {
        setStatus(adminId ? editorStatus : authStatus, 'No se pudo cerrar sesión. Intenta nuevamente.', true);
      } finally {
        button.disabled = false;
      }
    });
  }

  cancel.addEventListener('click', () => {
    resetEditor();
    input('name').focus();
  });
  refresh.addEventListener('click', () => void loadProducts());
  photoFile.addEventListener('change', () => {
    updatePhotoFile();
    photoFile.reportValidity();
  });
  clearPhoto.addEventListener('click', () => {
    photoFile.value = '';
    updatePhotoFile();
    photoFile.focus();
  });

  editor.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!adminId || editorFields.disabled) return;
    const photo = photoFile.files?.[0];
    const product = {
      name: input('name').value.trim(),
      category: category.value,
      label: input('label').value.trim(),
      material: input('material').value.trim(),
      image: input('image').value.trim(),
      price: input('price').valueAsNumber,
      colors: variants(input('colors').value),
      sizes: variants(input('sizes').value),
      published: input('published').checked,
    };
    if (!product.name || !product.label || !product.material) {
      setStatus(editorStatus, 'Completa el nombre, la etiqueta y el material.', true);
      return;
    }
    if (!photo && !validImage(product.image)) {
      setStatus(editorStatus, 'Sube una foto o pega una URL pública que empiece por https://.', true);
      input('image').focus();
      return;
    }
    if (!product.colors.length || !product.sizes.length) {
      setStatus(editorStatus, 'Añade al menos un color y una talla.', true);
      return;
    }

    const version = sessionVersion;
    const isEditing = Boolean(editingId);
    let uploadingPhoto = Boolean(photo);
    editorFields.disabled = true;
    try {
      if (photo) {
        setStatus(editorStatus, 'Subiendo foto…');
        const images = client.storage.from(photoBucket);
        const path = uploadPath ??= `${crypto.randomUUID()}.${photoExtensions.get(photo.type)}`;
        const { error } = await images.upload(path, photo, { contentType: photo.type, upsert: false });
        if (version !== sessionVersion) return;
        // A retry can find the same object if the previous response was lost.
        if (error && error.status !== 409 && error.statusCode !== '409') throw error;
        product.image = images.getPublicUrl(path).data.publicUrl;
        input('image').value = product.image;
        photoFile.value = '';
        updatePhotoFile();
        uploadingPhoto = false;
      }
      setStatus(editorStatus, 'Guardando producto…');
      const table = client.from('trama_products');
      const { error } = editingId
        ? await table.update(product).eq('id', editingId).select('id').single()
        : await table.insert({ ...product, id: draftId ??= newId(product.name) }).select('id').single();
      if (version !== sessionVersion) return;
      if (error) throw error;
      resetEditor();
      setStatus(editorStatus, isEditing ? 'Cambios guardados.' : 'Producto creado.');
      void loadProducts();
    } catch (error) {
      if (version !== sessionVersion) return;
      if (uploadingPhoto) {
        setStatus(editorStatus, 'No se pudo subir la foto. Intenta nuevamente.', true);
        return;
      }
      const code = (error as { code?: string }).code;
      const message = code === '23505'
        ? 'Ya se guardó este producto. Actualiza la lista para editarlo.'
        : photo
          ? 'La foto se subió. Vuelve a guardar el producto.'
          : 'No se pudo guardar el producto. Revisa los datos e intenta nuevamente.';
      setStatus(editorStatus, message, true);
    } finally {
      if (version === sessionVersion) editorFields.disabled = false;
    }
  });
}

start();
