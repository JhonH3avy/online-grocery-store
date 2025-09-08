import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { ShoppingCart, Leaf, Apple, Carrot, Flower, Sparkles, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { ProductGrid } from './components/ProductGrid'
import { CartDrawer } from './components/CartDrawer'
import { Product } from './components/ProductCard'
import { productsData, categories } from './data/products'
import { toast, Toaster } from 'sonner'
import { Alert, AlertDescription } from './components/ui/alert'
import { Button } from './components/ui/button'
import { config } from './config'

// API Services
import { healthCheck } from './services/api'
import { productService } from './services/productService'
import { categoryService } from './services/categoryService'
import { cartService } from './services/cartService'
import { useApi } from './hooks/useApi'

export default function App() {
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const [cart, setCart] = useState<any>(null)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [activeCategory, setActiveCategory] = useState('frutas')
  const [activeSubcategory, setActiveSubcategory] = useState('citricas')
  const [useLocalData, setUseLocalData] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  // API data fetching with proper error handling
  const { data: apiCategories, loading: categoriesLoading, error: categoriesError } = useApi(
    () => config.features.useApiData ? categoryService.getCategories() : Promise.resolve({ success: false, data: [] }),
    []
  )

  const { data: apiProducts, loading: productsLoading, error: productsError, refetch: refetchProducts } = useApi(
    () => {
      if (!config.features.useApiData) return Promise.resolve({ success: false, data: { products: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0, hasMore: false } } })
      
      // The API uses string category names, not UUIDs
      return productService.getProducts({ 
        category: activeCategory, // Use the activeCategory directly since it matches the API
        limit: 20
      })
    },
    [activeCategory, activeSubcategory]
  )

  // Load cart if API is enabled
  useEffect(() => {
    const loadCart = async () => {
      if (config.features.useApiData && serverStatus === 'online') {
        try {
          const response = await cartService.getCart()
          if (response.success) {
            setCart(response.data)
          }
        } catch (err) {
          console.error('Failed to load cart:', err)
        }
      }
    }

    if (serverStatus === 'online') {
      loadCart()
    }
  }, [serverStatus])

  // Check server health on component mount
  useEffect(() => {
    const checkServerHealth = async () => {
      setServerStatus('checking')
      try {
        const response = await healthCheck()
        if (response.success) {
          setServerStatus('online')
          setUseLocalData(false)
        } else {
          setServerStatus('offline')
          setUseLocalData(true)
          toast.warning('Server offline - using local data')
        }
      } catch (error) {
        setServerStatus('offline')
        setUseLocalData(true)
        toast.warning('Server offline - using local data')
      }
    }

    checkServerHealth()
  }, [])

  // Determine which data to use
  const currentCategories = useLocalData || categoriesError ? categories : (apiCategories || categories)
  const currentProducts = useLocalData || productsError ? 
    productsData.filter(p => p.category === activeCategory && p.subcategory === activeSubcategory) :
    (apiProducts?.products || [])

  const handleAddToCart = async (product: Product, quantity: number) => {
    // Update local cart state immediately for better UX
    setCartItems(prev => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + quantity
    }))

    // Try to sync with API if enabled
    if (config.features.useApiData && serverStatus === 'online') {
      try {
        const response = await cartService.addToCart({ 
          productId: product.id, 
          quantity 
        })
        if (response.success && response.data) {
          setCart(response.data)
          // Update cart items from API response
          const newCartItems: Record<string, number> = {}
          response.data.items.forEach((item: any) => {
            newCartItems[item.productId] = item.quantity
          })
          setCartItems(newCartItems)
        }
      } catch (err) {
        console.error('Failed to sync cart with API:', err)
        // Keep local cart state as fallback
      }
    }

    toast.success(`${product.name} agregado al carrito`)
  }

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await handleRemoveItem(productId)
      return
    }

    // Update local state immediately
    setCartItems(prev => ({
      ...prev,
      [productId]: quantity
    }))

    // Sync with API if enabled
    if (config.features.useApiData && serverStatus === 'online' && cart) {
      try {
        const cartItem = cart.items.find((item: any) => item.productId === productId)
        if (cartItem) {
          const response = await cartService.updateCartItem(cartItem.id, { quantity })
          if (response.success && response.data) {
            setCart(response.data)
            // Update cart items from API response
            const newCartItems: Record<string, number> = {}
            response.data.items.forEach((item: any) => {
              newCartItems[item.productId] = item.quantity
            })
            setCartItems(newCartItems)
          }
        }
      } catch (err) {
        console.error('Failed to update cart item:', err)
      }
    }
  }

  const handleRemoveItem = async (productId: string) => {
    // Update local state immediately
    setCartItems(prev => {
      const newItems = { ...prev }
      delete newItems[productId]
      return newItems
    })

    // Sync with API if enabled
    if (config.features.useApiData && serverStatus === 'online' && cart) {
      try {
        const cartItem = cart.items.find((item: any) => item.productId === productId)
        if (cartItem) {
          const response = await cartService.removeFromCart(cartItem.id)
          if (response.success && response.data) {
            setCart(response.data)
            // Update cart items from API response
            const newCartItems: Record<string, number> = {}
            response.data.items.forEach((item: any) => {
              newCartItems[item.productId] = item.quantity
            })
            setCartItems(newCartItems)
          }
        }
      } catch (err) {
        console.error('Failed to remove cart item:', err)
      }
    }

    const product = (useLocalData ? productsData : apiProducts?.products || productsData).find(p => p.id === productId)
    if (product) {
      toast.success(`${product.name} eliminado del carrito`)
    }
  }

  const handleCheckout = () => {
    toast.success('¡Gracias por tu compra! Te contactaremos pronto.')
    setCartItems({})
  }

  // Toggle between API and local data
  const handleToggleDataSource = () => {
    setUseLocalData(!useLocalData)
    toast.info(useLocalData ? 'Using API data' : 'Using local data')
  }

  // Get total items count for cart badge
  const totalCartItems = Object.values(cartItems).reduce((sum: number, quantity: unknown) => sum + (quantity as number), 0)

  const categoryIcon = {
    frutas: Apple,
    verduras: Carrot,
    hierbas: Flower,
    organicos: Sparkles
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-white">
      <Toaster position="top-center" />
      
      {/* Server Status Alert */}
      {serverStatus === 'offline' && (
        <Alert className="m-4 border-orange-200 bg-orange-50">
          <WifiOff className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Server is offline. Using local data. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-orange-600 underline"
              onClick={handleToggleDataSource}
            >
              {useLocalData ? 'Try API again' : 'Use local data'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading indicator for API data */}
      {(categoriesLoading || productsLoading) && serverStatus === 'online' && (
        <Alert className="m-4 border-blue-200 bg-blue-50">
          <Wifi className="h-4 w-4 text-blue-600 animate-pulse" />
          <AlertDescription className="text-blue-800">
            Loading fresh data from server...
          </AlertDescription>
        </Alert>
      )}
      
      {/* Header */}
      <header className="bg-[rgba(0,0,0,1)] shadow-sm border-b border-orange-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-orange-100 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">MercaFacil</h1>
                <p className="text-sm text-[rgba(255,255,255,1)]">Tu mercado online, fácil y rápido</p>
              </div>
            </div>
            
            <CartDrawer
              cartItems={cartItems}
              products={useLocalData ? productsData : (apiProducts?.products || productsData)}
              weightUnit={weightUnit}
              onWeightUnitChange={setWeightUnit}
              onQuantityChange={handleQuantityChange}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="bg-gradient-to-r from-green-700 to-orange-600 bg-clip-text text-transparent mb-3">Productos Frescos y Naturales</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra selección de frutas, verduras, hierbas y productos orgánicos. 
            Todo fresco, natural y entregado directamente a tu puerta.
          </p>
        </div>

        <Tabs value={activeCategory} onValueChange={(value) => {
          setActiveCategory(value)
          const category = currentCategories.find(cat => cat.id === value)
          if (category?.subcategories[0]) {
            setActiveSubcategory(category.subcategories[0].id)
          }
        }}>
          {/* Category Tabs */}
          <TabsList className="grid w-full grid-cols-4 mb-8">
            {currentCategories.map((category) => {
              const Icon = categoryIcon[category.id as keyof typeof categoryIcon]
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Content for each category */}
          {currentCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-orange-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-orange-100 rounded-full flex items-center justify-center">
                    {React.createElement(categoryIcon[category.id as keyof typeof categoryIcon], {
                      className: "w-5 h-5 text-green-600"
                    })}
                  </div>
                  <h3 className="bg-gradient-to-r from-green-700 to-orange-600 bg-clip-text text-transparent">{category.name}</h3>
                </div>

                {/* Subcategory Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {category.subcategories.map((subcategory) => (
                    <Badge
                      key={subcategory.id}
                      variant={activeSubcategory === subcategory.id ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        activeSubcategory === subcategory.id 
                          ? "bg-gradient-to-r from-green-600 to-orange-600 hover:from-green-700 hover:to-orange-700 text-white" 
                          : "hover:bg-gradient-to-r hover:from-green-50 hover:to-orange-50"
                      }`}
                      onClick={() => setActiveSubcategory(subcategory.id)}
                    >
                      {subcategory.name}
                    </Badge>
                  ))}
                </div>

                <Separator className="mb-6" />

                {/* Current subcategory title and product count */}
                <div className="mb-6">
                  <h4 className="mb-2">
                    {category.subcategories.find(sub => sub.id === activeSubcategory)?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {currentProducts.length} productos disponibles
                    {serverStatus === 'online' && !useLocalData && (
                      <span className="ml-2 text-green-600">• API conectado</span>
                    )}
                  </p>
                </div>

                {/* Products Grid */}
                <ProductGrid
                  products={currentProducts}
                  cartItems={cartItems}
                  onAddToCart={handleAddToCart}
                  onQuantityChange={handleQuantityChange}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-green-800 to-orange-800 text-white mt-16 bg-[rgba(0,130,27,0.92)]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg">MercaFacil</span>
              </div>
              <p className="text-white/80">
                Tu tienda online de confianza para frutas y verduras frescas. 
                Productos naturales, entrega rápida.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 text-white">Categorías</h4>
              <ul className="space-y-2 text-white/80">
                <li>Frutas Cítricas</li>
                <li>Frutas Tropicales</li>
                <li>Verduras Frescas</li>
                <li>Productos Orgánicos</li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-white">Contacto</h4>
              <div className="space-y-2 text-white/80">
                <p>📱 WhatsApp: +57 300 123 4567</p>
                <p>📧 info@mercafacil.com</p>
                <p>🚚 Entrega en Bogotá y alrededores</p>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-white/20" />
          
          <div className="text-center text-white/80">
            <p>&copy; 2024 MercaFacil. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}