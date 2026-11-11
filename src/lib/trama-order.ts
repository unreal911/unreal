import { products, getDiscountRate, getUnitPrice, formatPrice, tramaStoreContact } from '../data/trama.ts';
import type { TramaProduct } from '../data/trama.ts';

export interface OrderLine {
  id: string;
  size: string;
  color: string;
  qty: number;
}

export const MIN_ORDER_QUANTITY = 6;
export const MAX_LINE_QUANTITY = 600;
export const MAX_ORDER_LINES = 100;
const localCatalog = new Map(products.map((product) => [product.id, product]));
type Catalog = ReadonlyMap<string, TramaProduct>;

function isOrderLine(value: unknown, catalog: Catalog): value is OrderLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Record<string, unknown>;
  if (typeof line.id !== 'string' || typeof line.size !== 'string' || typeof line.color !== 'string') return false;
  const product = catalog.get(line.id);
  return Boolean(product?.sizes.includes(line.size) && product.colors.includes(line.color)
    && typeof line.qty === 'number' && Number.isInteger(line.qty) && line.qty >= 1 && line.qty <= MAX_LINE_QUANTITY);
}

const sameVariant = (a: OrderLine, b: OrderLine) => a.id === b.id && a.size === b.size && a.color === b.color;

// Keep the existing storage key: saved packs of six are valid unit quantities too.
export function validateOrder(value: unknown, catalog: Catalog = localCatalog): OrderLine[] {
  if (!Array.isArray(value)) return [];
  const valid: OrderLine[] = [];
  for (const item of value.slice(0, MAX_ORDER_LINES)) {
    if (!isOrderLine(item, catalog)) continue;
    const duplicate = valid.find((line) => sameVariant(line, item));
    if (duplicate) duplicate.qty = Math.min(MAX_LINE_QUANTITY, duplicate.qty + item.qty);
    else valid.push({ id: item.id, size: item.size, color: item.color, qty: item.qty });
  }
  return valid;
}

export function addOrderSelection(order: OrderLine[], selection: OrderLine[], catalog: Catalog = localCatalog): OrderLine[] {
  if (!selection.length || !selection.every((line) => isOrderLine(line, catalog))) throw new Error('Elige cantidades enteras entre 1 y 600 por talla y color.');
  const next = order.map((line) => ({ ...line }));
  for (const line of selection) {
    const existing = next.find((entry) => sameVariant(entry, line));
    if (existing) {
      if (existing.qty + line.qty > MAX_LINE_QUANTITY) throw new Error('Máximo de 600 unidades por combinación, incluyendo las que ya tienes en el pedido.');
      existing.qty += line.qty;
    } else {
      if (next.length >= MAX_ORDER_LINES) throw new Error('Tu pedido alcanzó el límite de combinaciones. Quita una para agregar otra.');
      next.push({ ...line });
    }
  }
  return next;
}

export function summarizeOrder(order: OrderLine[], catalog: Catalog = localCatalog) {
  const quantity = order.reduce((sum, line) => sum + line.qty, 0);
  const subtotalCents = order.reduce((sum, line) => sum + Math.round(catalog.get(line.id)!.price * 100) * line.qty, 0);
  const totalCents = order.reduce((sum, line) => sum + Math.round(getUnitPrice(catalog.get(line.id)!.price, quantity) * 100) * line.qty, 0);
  return { quantity, subtotal: subtotalCents / 100, total: totalCents / 100, discount: (subtotalCents - totalCents) / 100 };
}

export function buildOrderText(order: OrderLine[], catalog: Catalog = localCatalog): string {
  const { quantity, subtotal, total, discount } = summarizeOrder(order, catalog);
  if (quantity < MIN_ORDER_QUANTITY) throw new Error(`Completa un mínimo de ${MIN_ORDER_QUANTITY} prendas para copiar tu pedido.`);
  const lines = order.map((line) => {
    const product = catalog.get(line.id)!;
    const price = getUnitPrice(product.price, quantity);
    return `${line.qty} × ${product.name} | ${line.color} | Talla ${line.size} | ${formatPrice(price)} c/u | ${formatPrice(price * line.qty)}`;
  });
  return [
    'Hola, quiero estos productos:', '',
    'TRAMA MAYORISTA · PEDIDO DE DEMOSTRACIÓN', '', ...lines, '',
    `Cantidad: ${quantity} prendas`, `Subtotal: ${formatPrice(subtotal)}`,
    `Descuento (${getDiscountRate(quantity) * 100}%): ${formatPrice(discount)}`,
    `Total referencial: ${formatPrice(total)}`, '',
    'Demo de catálogo. Este resumen no confirma una compra ni realiza un pago.',
  ].join('\n');
}

export function buildOrderWhatsAppUrl(order: OrderLine[], number = tramaStoreContact.whatsappNumber, catalog: Catalog = localCatalog): string {
  if (!/^[1-9]\d{7,14}$/.test(number)) throw new Error('Configura el WhatsApp de la tienda con código de país y solo dígitos.');
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set('text', buildOrderText(order, catalog));
  return url.href;
}
