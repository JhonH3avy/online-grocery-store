import { ProductCard, Product } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  cartItems: Record<string, number>
  onAddToCart: (product: Product, quantity: number) => void
  onQuantityChange: (productId: string, quantity: number) => void
}

export function ProductGrid({ products, cartItems, onAddToCart, onQuantityChange }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          quantity={cartItems[product.id] || 0}
          onAddToCart={onAddToCart}
          onQuantityChange={onQuantityChange}
        />
      ))}
    </div>
  )
}