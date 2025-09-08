import { Product } from '../components/ProductCard'

export const productsData: Product[] = [
  // Frutas Cítricas
  {
    id: 'citrus-1',
    name: 'Naranjas Frescas',
    price: 3.50,
    unit: 'kg',
    description: 'Naranjas jugosas y dulces, perfectas para jugos frescos o consumo directo. Ricas en vitamina C y antioxidantes.',
    imageUrl: 'https://images.unsplash.com/photo-1661669273498-ee01566be6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMG9yYW5nZXMlMjBjaXRydXMlMjBmcnVpdHN8ZW58MXx8fHwxNzU3MzQyMTA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'citricas'
  },
  {
    id: 'citrus-2',
    name: 'Limones Frescos',
    price: 4.20,
    unit: 'kg',
    description: 'Limones ácidos y aromáticos, ideales para aderezos, bebidas y cocina. Excelente fuente de vitamina C.',
    imageUrl: 'https://images.unsplash.com/photo-1718196917011-801cddb84334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGxlbW9ucyUyMGNpdHJ1c3xlbnwxfHx8fDE3NTczNDQ5NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'citricas'
  },
  {
    id: 'citrus-3',
    name: 'Limas Verdes',
    price: 5.80,
    unit: 'kg',
    description: 'Limas verdes intensas y jugosas, perfectas para cocteles, marinadas y platos asiáticos.',
    imageUrl: 'https://images.unsplash.com/photo-1739355991517-3845f81f6b06?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGxpbWVzJTIwZ3JlZW4lMjBjaXRydXN8ZW58MXx8fHwxNzU3MzQ0OTYwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'citricas'
  },

  // Frutas Tropicales
  {
    id: 'tropical-1',
    name: 'Piña Dorada',
    price: 2.80,
    unit: 'kg',
    description: 'Piña madura y dulce, con pulpa jugosa y aromática. Rica en bromelina y vitaminas. Perfecta para postres.',
    imageUrl: 'https://images.unsplash.com/photo-1618434025772-961657d649d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHBpbmVhcHBsZSUyMHRyb3BpY2FsJTIwZnJ1aXR8ZW58MXx8fHwxNzU3MzM1Njc4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'tropicales'
  },
  {
    id: 'tropical-2',
    name: 'Mango Maduro',
    price: 4.50,
    unit: 'kg',
    description: 'Mangos maduros y cremosos, con sabor dulce tropical. Ideales para batidos, postres o consumo fresco.',
    imageUrl: 'https://images.unsplash.com/photo-1734163075572-8948e799e42c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMG1hbmdvJTIwdHJvcGljYWx8ZW58MXx8fHwxNzU3MzAyODI0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'tropicales'
  },
  {
    id: 'tropical-3',
    name: 'Coco Fresco',
    price: 3.20,
    unit: 'kg',
    description: 'Cocos frescos con agua natural y pulpa blanca. Perfectos para bebidas refrescantes y cocina asiática.',
    imageUrl: 'https://images.unsplash.com/photo-1551117281-9ebf84f8bec9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNvY29udXQlMjB0cm9waWNhbHxlbnwxfHx8fDE3NTczMDI4MjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'frutas',
    subcategory: 'tropicales'
  },

  // Hojas Verdes
  {
    id: 'greens-1',
    name: 'Lechuga Romana',
    price: 2.50,
    unit: 'kg',
    description: 'Lechuga romana fresca y crujiente, ideal para ensaladas césar y sandwiches. Rica en folatos y vitamina K.',
    imageUrl: 'https://images.unsplash.com/photo-1720456764346-1abff7d43efe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGxldHR1Y2UlMjBncmVlbiUyMGxlYWZ5fGVufDF8fHx8MTc1NzM0NDk2Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'hojas-verdes'
  },
  {
    id: 'greens-2',
    name: 'Espinaca Tierna',
    price: 3.80,
    unit: 'kg',
    description: 'Espinaca fresca de hojas tiernas, perfecta para ensaladas, batidos verdes y salteados. Alta en hierro.',
    imageUrl: 'https://images.unsplash.com/photo-1634731201932-9bd92839bea2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHNwaW5hY2glMjBsZWF2ZXN8ZW58MXx8fHwxNzU3MjQwODU0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'hojas-verdes'
  },
  {
    id: 'greens-3',
    name: 'Kale Rizado',
    price: 4.20,
    unit: 'kg',
    description: 'Kale fresco y rizado, superfood rico en vitaminas A, C y K. Ideal para chips, ensaladas y batidos.',
    imageUrl: 'https://images.unsplash.com/photo-1586683728245-4680613c11b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGthbGUlMjBsZWFmeSUyMGdyZWVuc3xlbnwxfHx8fDE3NTczNDQ5NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'hojas-verdes'
  },

  // Raíces y Tubérculos
  {
    id: 'roots-1',
    name: 'Zanahoria Baby',
    price: 2.80,
    unit: 'kg',
    description: 'Zanahorias tiernas y dulces, perfectas para snacks saludables, ensaladas y cocción. Ricas en betacaroteno.',
    imageUrl: 'https://images.unsplash.com/photo-1744659749905-471decea0ea7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNhcnJvdHMlMjBvcmFuZ2UlMjB2ZWdldGFibGVzfGVufDF8fHx8MTc1NzM0NDk2M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'raices'
  },
  {
    id: 'roots-2',
    name: 'Papas Criollas',
    price: 1.80,
    unit: 'kg',
    description: 'Papas criollas frescas y versátiles, ideales para guisos, frituras y asados. Fuente de carbohidratos saludables.',
    imageUrl: 'https://images.unsplash.com/photo-1594885270227-c61f9bc1383d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHBvdGF0b2VzJTIwdmVnZXRhYmxlc3xlbnwxfHx8fDE3NTcyNzI2ODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'raices'
  },
  {
    id: 'roots-3',
    name: 'Remolacha Roja',
    price: 3.20,
    unit: 'kg',
    description: 'Remolachas frescas y nutritivas, perfectas para ensaladas, jugos y asados. Ricas en nitratos naturales.',
    imageUrl: 'https://images.unsplash.com/photo-1571581280132-23b60a0a8e3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGJlZXRzJTIwYmVldHJvb3R8ZW58MXx8fHwxNzU3MzQ0OTY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'verduras',
    subcategory: 'raices'
  },

  // Hierbas Aromáticas
  {
    id: 'herbs-1',
    name: 'Albahaca Fresca',
    price: 8.50,
    unit: 'kg',
    description: 'Albahaca aromática y fresca, esencial para la cocina italiana. Perfecta para pestos, pizzas y ensaladas.',
    imageUrl: 'https://images.unsplash.com/photo-1662422325326-19089df23d98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGJhc2lsJTIwaGVyYnN8ZW58MXx8fHwxNzU3MzQ0OTY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'hierbas',
    subcategory: 'aromaticas'
  },
  {
    id: 'herbs-2',
    name: 'Perejil Liso',
    price: 6.80,
    unit: 'kg',
    description: 'Perejil fresco de hoja lisa, ideal para salsas, guisos y como guarnición. Rico en vitamina C y antioxidantes.',
    imageUrl: 'https://images.unsplash.com/photo-1666283331315-2eecb3330799?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHBhcnNsZXklMjBoZXJic3xlbnwxfHx8fDE3NTczNDQ5NjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'hierbas',
    subcategory: 'aromaticas'
  },
  {
    id: 'herbs-3',
    name: 'Cilantro Fresco',
    price: 7.20,
    unit: 'kg',
    description: 'Cilantro aromático y fresco, indispensable en la cocina latinoamericana y asiática. Sabor único e intenso.',
    imageUrl: 'https://images.unsplash.com/photo-1734771308348-ad90bf5835ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNpbGFudHJvJTIwaGVyYnN8ZW58MXx8fHwxNzU3MzQ0OTY1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'hierbas',
    subcategory: 'aromaticas'
  },

  // Hierbas Medicinales
  {
    id: 'medicinal-1',
    name: 'Jengibre Fresco',
    price: 12.50,
    unit: 'kg',
    description: 'Raíz de jengibre fresca y picante, excelente para tés, infusiones y cocina asiática. Propiedades antiinflamatorias.',
    imageUrl: 'https://images.unsplash.com/photo-1634612828694-8988aa4254df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGdpbmdlciUyMHJvb3QlMjBzcGljZXxlbnwxfHx8fDE3NTczNDQ5NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'hierbas',
    subcategory: 'medicinales'
  },
  {
    id: 'medicinal-2',
    name: 'Cúrcuma Fresca',
    price: 15.80,
    unit: 'kg',
    description: 'Raíz de cúrcuma fresca, conocida por sus propiedades antioxidantes y antiinflamatorias. Ideal para tés y curry.',
    imageUrl: 'https://images.unsplash.com/photo-1666370182138-1943009fae51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHR1cm1lcmljJTIwcm9vdHxlbnwxfHx8fDE3NTczNDQ5NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'hierbas',
    subcategory: 'medicinales'
  },
  {
    id: 'medicinal-3',
    name: 'Ajo Morado',
    price: 9.50,
    unit: 'kg',
    description: 'Ajos morados frescos y aromáticos, con propiedades antibacterianas naturales. Esenciales en cualquier cocina.',
    imageUrl: 'https://images.unsplash.com/photo-1741518077910-d5449aaa1636?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGdhcmxpYyUyMGJ1bGJzfGVufDF8fHx8MTc1NzM0NDk2N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'hierbas',
    subcategory: 'medicinales'
  },

  // Frutas Orgánicas
  {
    id: 'organic-fruits-1',
    name: 'Fresas Orgánicas',
    price: 8.90,
    unit: 'kg',
    description: 'Fresas orgánicas dulces y jugosas, cultivadas sin pesticidas. Perfectas para postres y consumo directo.',
    imageUrl: 'https://images.unsplash.com/photo-1589533610925-1cffc309ebaa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwc3RyYXdiZXJyaWVzJTIwZnJlc2h8ZW58MXx8fHwxNzU3MzQ0OTY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'organicos',
    subcategory: 'frutas'
  },
  {
    id: 'organic-fruits-2',
    name: 'Bananos Orgánicos',
    price: 3.80,
    unit: 'kg',
    description: 'Bananos orgánicos maduros y cremosos, ricos en potasio. Ideales para batidos, cereales y snacks saludables.',
    imageUrl: 'https://images.unsplash.com/photo-1745488791982-92e422ca5290?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwYmFuYW5hcyUyMGZyZXNofGVufDF8fHx8MTc1NzM0NDk2Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'organicos',
    subcategory: 'frutas'
  },
  {
    id: 'organic-fruits-3',
    name: 'Manzanas Orgánicas',
    price: 5.20,
    unit: 'kg',
    description: 'Manzanas rojas orgánicas crujientes y dulces, cultivadas naturalmente. Perfectas para snacks y jugos naturales.',
    imageUrl: 'https://images.unsplash.com/photo-1683688684067-b87a189c7503?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwYXBwbGVzJTIwcmVkJTIwZnJlc2h8ZW58MXx8fHwxNzU3MzQ0OTY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'organicos',
    subcategory: 'frutas'
  },

  // Verduras Orgánicas
  {
    id: 'organic-vegetables-1',
    name: 'Brócoli Orgánico',
    price: 6.50,
    unit: 'kg',
    description: 'Brócoli orgánico fresco y verde, rico en vitaminas y minerales. Ideal para vapores, salteados y ensaladas.',
    imageUrl: 'https://images.unsplash.com/photo-1742970520195-bcf1261033eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwYnJvY2NvbGklMjBmcmVzaHxlbnwxfHx8fDE3NTczNDQ5NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'organicos',
    subcategory: 'verduras'
  },
  {
    id: 'organic-vegetables-2',
    name: 'Tomates Orgánicos',
    price: 7.20,
    unit: 'kg',
    description: 'Tomates orgánicos maduros y jugosos, cultivados sin químicos. Perfectos para salsas, ensaladas y cocina.',
    imageUrl: 'https://images.unsplash.com/photo-1643926544872-dbcd8805e870?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdG9tYXRvZXMlMjBmcmVzaHxlbnwxfHx8fDE3NTcyNzk1MzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'organicos',
    subcategory: 'verduras'
  },
  {
    id: 'organic-vegetables-3',
    name: 'Pimientos Orgánicos',
    price: 8.80,
    unit: 'kg',
    description: 'Pimientos coloridos orgánicos, dulces y crujientes. Ideales para asados, salteados y ensaladas mediterráneas.',
    imageUrl: 'https://images.unsplash.com/photo-1647136849038-7cc19628983a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwYmVsbCUyMHBlcHBlcnN8ZW58MXx8fHwxNzU3MzQ0OTY3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'organicos',
    subcategory: 'verduras'
  }
]

export const categories = [
  {
    id: 'frutas',
    name: 'Frutas Frescas',
    subcategories: [
      { id: 'citricas', name: 'Cítricas' },
      { id: 'tropicales', name: 'Tropicales' }
    ]
  },
  {
    id: 'verduras',
    name: 'Verduras',
    subcategories: [
      { id: 'hojas-verdes', name: 'Hojas Verdes' },
      { id: 'raices', name: 'Raíces y Tubérculos' }
    ]
  },
  {
    id: 'hierbas',
    name: 'Hierbas y Especias',
    subcategories: [
      { id: 'aromaticas', name: 'Aromáticas' },
      { id: 'medicinales', name: 'Medicinales' }
    ]
  },
  {
    id: 'organicos',
    name: 'Productos Orgánicos',
    subcategories: [
      { id: 'frutas', name: 'Frutas Orgánicas' },
      { id: 'verduras', name: 'Verduras Orgánicas' }
    ]
  }
]