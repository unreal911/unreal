import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateOrder, addOrderSelection, summarizeOrder, buildOrderText, buildOrderWhatsAppUrl } from '../src/lib/trama-order.ts';

const polo = (qty, color = 'Crudo', size = 'M') => ({ id: 'polo-esencial', color, size, qty });
const camisa = (qty) => ({ id: 'camisa-lino', color: 'Arena', size: 'L', qty });

test('mixes colors, sizes and models by unit and keeps the exact breakdown in the export', () => {
  let order = addOrderSelection([], [polo(2), polo(1, 'Crudo', 'L'), polo(2, 'Negro', 'S')]);
  assert.throws(() => buildOrderText(order), /mínimo de 6/);
  order = addOrderSelection(order, [camisa(1)]);
  assert.equal(summarizeOrder(order).quantity, 6);
  const text = buildOrderText(order);
  assert.match(text, /2 × Polo esencial \| Crudo \| Talla M/);
  assert.match(text, /1 × Polo esencial \| Crudo \| Talla L/);
  assert.match(text, /2 × Polo esencial \| Negro \| Talla S/);
  assert.match(text, /1 × Camisa de lino \| Arena \| Talla L/);
  assert.match(text, /Cantidad: 6 prendas/);
  assert.match(text, /no confirma una compra/);
});

test('global price tiers apply to every model at both thresholds and recalculate when quantity decreases', () => {
  const cases = [
    { quantity: 23, subtotal: 576, total: 576, discount: 0 },
    { quantity: 24, subtotal: 600, total: 540, discount: 60 },
    { quantity: 47, subtotal: 1152, total: 1036.8, discount: 115.2 },
    { quantity: 48, subtotal: 1176, total: 999.6, discount: 176.4 },
    { quantity: 24, subtotal: 600, total: 540, discount: 60 },
    { quantity: 23, subtotal: 576, total: 576, discount: 0 },
  ];
  for (const expected of cases) {
    assert.deepEqual(summarizeOrder([polo(expected.quantity - 1), camisa(1)]), expected);
  }
});

test('restores legacy packs and new unit quantities, merges duplicates and rejects corrupt saved variants', () => {
  const restored = validateOrder(JSON.parse(JSON.stringify([
    polo(6), polo(1), polo(2, 'Negro', 'L'), camisa(3),
    polo(0), polo(-1), polo(1.5), polo(601), polo('6'), polo(Infinity),
    polo(1, 'Inventado'), polo(1, 'Crudo', 'XXXL'), { ...polo(1), id: 'missing' }, null,
  ])));
  assert.deepEqual(restored, [polo(7), polo(2, 'Negro', 'L'), camisa(3)]);
  assert.deepEqual(validateOrder({}), []);
  assert.deepEqual(validateOrder([polo(600), polo(1)]), [polo(600)]);
});

test('adds to existing variants atomically and rejects overflow or invalid quantities without mutating the order', () => {
  const order = [polo(599)];
  assert.deepEqual(addOrderSelection(order, [polo(1)]), [polo(600)]);
  assert.throws(() => addOrderSelection(order, [camisa(2), polo(2)]), /600 unidades/);
  assert.deepEqual(order, [polo(599)]);
  for (const qty of [-1, 0, 1.2, 601, NaN, Infinity]) {
    assert.throws(() => addOrderSelection(order, [polo(qty)]), /cantidades enteras/);
  }
  assert.throws(() => addOrderSelection(order, []), /cantidades enteras/);
});

test('an empty or incomplete draft cannot be exported and non-multiple-of-six orders are accepted', () => {
  assert.deepEqual(summarizeOrder([]), { quantity: 0, subtotal: 0, total: 0, discount: 0 });
  assert.throws(() => buildOrderText([]), /mínimo/);
  assert.throws(() => buildOrderText([polo(5)]), /mínimo/);
  assert.match(buildOrderText([polo(7)]), /Cantidad: 7 prendas/);
});

test('WhatsApp prepares the approved recipient and preserves the complete 41-garment order', () => {
  const order = [
    { id: 'pantalon-relaxed', color: 'Arena', size: '28', qty: 6 },
    { id: 'pantalon-relaxed', color: 'Negro', size: '28', qty: 30 },
    { id: 'camisa-lino', color: 'Arena', size: 'S', qty: 2 },
    { id: 'camisa-lino', color: 'Azul', size: 'S', qty: 2 },
    { id: 'camisa-lino', color: 'Azul', size: 'M', qty: 1 },
  ];
  const url = new URL(buildOrderWhatsAppUrl(order));
  const text = url.searchParams.get('text');
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/51980904787');
  assert.equal(text, buildOrderText(order));
  assert.ok(text.startsWith('Hola, quiero estos productos:\n'));
  assert.match(text, /PEDIDO DE DEMOSTRACIÓN/);
  assert.match(text, /30 × Pantalón relaxed \| Negro \| Talla 28/);
  assert.match(text, /Cantidad: 41 prendas/);
  assert.ok(text.replaceAll('\u00a0', ' ').includes('Total referencial: S/ 1,900.80'));
  assert.equal((text.match(/ × /g) || []).length, 5);
  assert.match(text, /no confirma una compra/);
});

test('incomplete orders and incorrectly formatted store contacts cannot create a WhatsApp draft', () => {
  assert.throws(() => buildOrderWhatsAppUrl([polo(5)]), /mínimo/);
  assert.throws(() => buildOrderWhatsAppUrl([]), /mínimo/);
  for (const number of ['', '+51980904787', '980904787 text', 'https://example.com', '5198?text=other']) {
    assert.throws(() => buildOrderWhatsAppUrl([polo(6)], number), /WhatsApp de la tienda/);
  }
  assert.equal(new URL(buildOrderWhatsAppUrl([polo(6)], '51999999999')).pathname, '/51999999999');
});
