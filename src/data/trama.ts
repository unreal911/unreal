export type TramaCategory = 'polos' | 'camisas' | 'abrigos' | 'pantalones';

export interface TramaProduct {
  id: string;
  name: string;
  category: TramaCategory;
  label: string;
  material: string;
  image: string;
  price: number;
  colors: string[];
  sizes: string[];
}

export const products: TramaProduct[] = [
  {
    id: 'polo-esencial',
    name: 'Polo esencial',
    category: 'polos',
    label: 'BÁSICOS',
    material: 'Algodón jersey · 180 g/m²',
    image: '/images/trama/polo-basico.jpg',
    price: 24,
    colors: ['Crudo', 'Negro', 'Oliva'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'camisa-lino',
    name: 'Camisa de lino',
    category: 'camisas',
    label: 'LÍNEA NATURAL',
    material: 'Mezcla de lino · corte relajado',
    image: '/images/trama/camisa-lino.jpg',
    price: 48,
    colors: ['Arena', 'Blanco', 'Azul'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'sobrecamisa',
    name: 'Sobrecamisa utility',
    category: 'abrigos',
    label: 'NUEVA COLECCIÓN',
    material: 'Drill de algodón · textura suave',
    image: '/images/trama/sobrecamisa-tierra.jpg',
    price: 59,
    colors: ['Tierra', 'Arena', 'Negro'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'hoodie',
    name: 'Polera essential',
    category: 'abrigos',
    label: 'URBAN ESSENTIALS',
    material: 'French terry · 320 g/m²',
    image: '/images/trama/polera-essential.jpg',
    price: 56,
    colors: ['Crudo', 'Gris', 'Negro'],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'pantalon-relaxed',
    name: 'Pantalón relaxed',
    category: 'pantalones',
    label: 'EVERYDAY WEAR',
    material: 'Gabardina de algodón · fit recto',
    image: '/images/trama/pantalon-arena.jpg',
    price: 52,
    colors: ['Arena', 'Oliva', 'Negro'],
    sizes: ['28', '30', '32', '34', '36'],
  },
  {
    id: 'denim-recto',
    name: 'Denim recto',
    category: 'pantalones',
    label: 'DENIM COLLECTION',
    material: 'Denim de algodón · 12 oz',
    image: '/images/trama/denim-clasico.jpg',
    price: 65,
    colors: ['Azul lavado', 'Índigo', 'Negro'],
    sizes: ['28', '30', '32', '34', '36'],
  },
];

export function getDiscountRate(totalQuantity: number): number {
  return totalQuantity >= 48 ? 0.15 : totalQuantity >= 24 ? 0.1 : 0;
}

export function getUnitPrice(basePrice: number, totalQuantity: number): number {
  return Math.round(basePrice * (1 - getDiscountRate(totalQuantity)) * 100) / 100;
}

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return currency.format(value);
}
