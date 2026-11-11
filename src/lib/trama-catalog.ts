import type { TramaProduct } from '../data/trama';
import { createTramaClient } from './trama-supabase';

export async function loadTramaCatalog(): Promise<TramaProduct[]> {
  const client = createTramaClient(false);
  if (!client) throw new Error('Falta configurar Supabase para Trama.');

  const catalog: TramaProduct[] = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await client.from('trama_products')
      .select('id, name, category, label, material, image, price, colors, color_hexes, sizes')
      .eq('published', true)
      .order('sort_order').order('id')
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    catalog.push(...data.map((product) => ({ ...product, price: Number(product.price) })));
    if (data.length < pageSize) return catalog;
  }
}
