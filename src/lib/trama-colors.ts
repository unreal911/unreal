const defaultSwatches = new Map([
  ['Crudo', '#e7dfce'],
  ['Negro', '#292725'],
  ['Oliva', '#717551'],
  ['Arena', '#c8b697'],
  ['Blanco', '#ffffff'],
  ['Azul', '#7594ae'],
  ['Tierra', '#9e7052'],
  ['Gris', '#a3a19c'],
  ['Azul lavado', '#7a94ae'],
  ['Índigo', '#384e70'],
]);

export function isTramaColorHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function tramaColorHex(name: string, colorHexes?: Record<string, string>): string {
  const customHex = colorHexes?.[name];
  return isTramaColorHex(customHex) ? customHex.toLowerCase() : defaultSwatches.get(name) ?? '#b4a291';
}
