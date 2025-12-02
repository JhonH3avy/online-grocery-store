import { ImageWithFallback } from './figma/ImageWithFallback'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter } from './ui/card'
import { ShoppingCart, Plus, Minus } from 'lucide-react'

export interface Product {
  id: string
  name: string
  price: number
  unit: string
  description: string
  imageUrl: string
  category: string
  subcategory: string
}

interface ProductCardProps {
  product: Product
  quantity: number
  onAddToCart: (product: Product, quantity: number) => void
  onQuantityChange: (productId: string, quantity: number) => void
}

export function ProductCard({ product, quantity, onAddToCart, onQuantityChange }: ProductCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <div className="aspect-square overflow-hidden rounded-t-lg">
        <ImageWithFallback
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      
      <CardContent className="flex-1 p-4">
        <h3 className="mb-2">{product.name}</h3>
        <p className="text-muted-foreground mb-3">{product.description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-green-600">${product.price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">/ {product.unit}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {quantity === 0 ? (
          <Button 
            onClick={() => onAddToCart(product, 1)}
            className="w-full bg-green-800 hover:bg-green-900"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Agregar al Carrito
          </Button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuantityChange(product.id, quantity - 1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="min-w-[3rem] text-center">{quantity} {product.unit}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onQuantityChange(product.id, quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <span className="text-green-600">
              ${(product.price * quantity).toFixed(2)}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}