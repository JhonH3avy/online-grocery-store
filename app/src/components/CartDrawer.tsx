import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from './ui/sheet'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { Product } from './ProductCard'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Separator } from './ui/separator'

interface CartDrawerProps {
  cartItems: Record<string, number>
  products: Product[]
  weightUnit: 'kg' | 'lb'
  onWeightUnitChange: (unit: 'kg' | 'lb') => void
  onQuantityChange: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onCheckout: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CartDrawer({ 
  cartItems, 
  products, 
  weightUnit, 
  onWeightUnitChange,
  onQuantityChange,
  onRemoveItem,
  onCheckout,
  open = false,
  onOpenChange
}: CartDrawerProps) {
  const itemsInCart = Object.entries(cartItems).filter(([_, quantity]) => quantity > 0)
  const totalItems = itemsInCart.reduce((sum, [_, quantity]) => sum + quantity, 0)
  
  const convertedPrice = (price: number) => {
    if (weightUnit === 'lb') {
      return price * 2.20462 // Convert kg to lb price
    }
    return price
  }

  const getDisplayUnit = (originalUnit: string) => {
    if (originalUnit === 'kg' && weightUnit === 'lb') return 'lb'
    if (originalUnit === 'lb' && weightUnit === 'kg') return 'kg' 
    return originalUnit
  }

  const totalPrice = itemsInCart.reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === productId)
    if (!product) return sum
    return sum + (convertedPrice(product.price) * quantity)
  }, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>

        <div className="py-4 px-4">
          <div className="flex items-center justify-between mb-4">
            <span>Unidad de peso:</span>
            <Select value={weightUnit} onValueChange={(value: 'kg' | 'lb') => onWeightUnitChange(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lb">lb</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
        </div>

        <div className="flex-1 space-y-4 max-h-[60vh] overflow-y-auto">
          {itemsInCart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tu carrito está vacío
            </div>
          ) : (
            itemsInCart.map(([productId, quantity]) => {
              const product = products.find(p => p.id === productId)
              if (!product) return null

              return (
                <div key={productId} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-16 h-16 overflow-hidden rounded">
                    <ImageWithFallback
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate">{product.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuantityChange(productId, quantity - 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm min-w-[3rem] text-center">
                        {quantity} {getDisplayUnit(product.unit)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuantityChange(productId, quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm text-orange-600 mt-1">
                      ${(convertedPrice(product.price) * quantity).toLocaleString('es-CO')}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveItem(productId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })
          )}
        </div>

        {itemsInCart.length > 0 && (
          <SheetFooter className="mt-6 pt-4 border-t">
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span>Total:</span>
                <span className="text-orange-600">${totalPrice.toLocaleString('es-CO')}</span>
              </div>
              <Button onClick={onCheckout} className="w-full bg-green-600 hover:bg-green-700">
                Proceder al Pago
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}