import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { ShoppingCart, Leaf, Apple, Carrot, Flower, Sparkles, AlertCircle, Wifi, WifiOff, RefreshCw, UserIcon } from 'lucide-react'
import { ProductGrid } from '../components/ProductGrid'
import { CartDrawer } from '../components/CartDrawer'
import { Product } from '../components/ProductCard'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { config } from '../config'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../contexts/CartContext'

// API Services
import { healthCheck } from '../services/api'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { cartService } from '../services/cartService'
import { AuthModal } from '../components/auth'
import { CheckoutModal } from '../components/CheckoutModal'

// HomePage component
export function HomePage() {
  const { user, isAuthenticated } = useAuth()
  const { cartState, cartHandlers } = useCart()
  
  // HomePage-specific state (non-cart related)
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSubcategory, setActiveSubcategory] = useState('')
  
  // API data state
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Extract cart state and handlers from useCart hook
  const cartItems = cartState.cartItems
  const cart = cartState.cart
  const cartProducts = cartState.cartProducts
  const weightUnit = cartState.weightUnit
  const cartDrawerOpen = cartState.cartDrawerOpen
  const showAuthModal = cartState.showAuthModal
  const showCheckoutModal = cartState.showCheckoutModal
  const serverStatus = cartState.serverStatus
  
  const addToCart = cartHandlers.handleAddToCart
  const quantityChange = cartHandlers.handleQuantityChange
  const removeItem = cartHandlers.handleRemoveItem
  const setWeightUnit = cartHandlers.setWeightUnit
  const setCartDrawerOpen = cartHandlers?.setCartDrawerOpen ?? (() => {})
  const setShowAuthModal = cartHandlers?.setShowAuthModal ?? (() => {})
  const setShowCheckoutModal = cartHandlers?.setShowCheckoutModal ?? (() => {})
  const checkout = cartHandlers?.handleCheckout ?? (async () => {
    toast.error('Funcionalidad de pago no disponible')
  })
  const checkoutSuccess = cartHandlers?.handleCheckoutSuccess ?? (async () => {})
  
  // Load categories from API
  const loadCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const response = await categoryService.getCategories()
      if (response.success && response.data) {
        setCategories(response.data)
        // Set first category as active if none selected
        if (!activeCategory && response.data.length > 0) {
          const firstCategory = response.data[0]
          setActiveCategory(firstCategory.id)
          if (firstCategory.subcategories && firstCategory.subcategories.length > 0) {
            setActiveSubcategory(firstCategory.subcategories[0].id)
          }
        }
      } else {
        throw new Error('Failed to load categories')
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategoriesError('Error al cargar categorías')
      toast.error('Error al cargar categorías')
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Load products from API
  const loadProducts = async (categoryFilter?: string, subcategoryFilter?: string) => {
    setProductsLoading(true)
    setProductsError(null)
    try {
      const filters: any = { limit: 20 }
      
      // Convert category ID to category name for API
      const categoryToUse = categoryFilter || activeCategory
      if (categoryToUse && categories.length > 0) {
        const category = categories.find(cat => cat.id === categoryToUse)
        if (category) {
          filters.category = category.name.toLowerCase()
        }
      }
      
      // Convert subcategory ID to subcategory name for API
      const subcategoryToUse = subcategoryFilter || activeSubcategory
      if (subcategoryToUse && categories.length > 0) {
        const category = categories.find(cat => cat.id === (categoryFilter || activeCategory))
        if (category?.subcategories) {
          const subcategory = category.subcategories.find((sub: any) => sub.id === subcategoryToUse)
          if (subcategory) {
            filters.subcategory = subcategory.name.toLowerCase()
          }
        }
      }

      console.log('Loading products with filters:', filters) // Debug log

      const response = await productService.getProducts(filters)
      if (response.success && response.data) {
        setProducts(response.data.products)
        console.log('Products loaded:', response.data.products.length) // Debug log
      } else {
        throw new Error('Failed to load products')
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setProductsError('Error al cargar productos')
      toast.error('Error al cargar productos')
    } finally {
      setProductsLoading(false)
    }
  }

  // Initialize data on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  // Reload products when category/subcategory changes
  useEffect(() => {
    if (categories.length > 0) {
      loadProducts()
    }
  }, [activeCategory, activeSubcategory, categories])

  const retryConnection = async () => {
    toast.info('Reconectando al servidor...')
    
    try {
      const healthResponse = await healthCheck()
      if (healthResponse.success) {
        toast.success('Reconectado al servidor')
        await loadCategories()
        await loadProducts()
      } else {
        throw new Error('Health check failed')
      }
    } catch (error) {
      toast.error('Aún no se puede conectar al servidor')
    }
  }

  // Get total items count for cart badge
  const totalCartItems = Object.values(cartItems).reduce((sum: number, quantity: unknown) => sum + (quantity as number), 0)

  const categoryIcon = {
    frutas: Apple,
    vegetables: Carrot,
    verduras: Carrot,
    dairy: Flower,
    lacteos: Flower,
    beverages: Sparkles,
    bebidas: Sparkles
  }  // Show loading screen while initializing
  if (serverStatus === 'checking' && categoriesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conectando al servidor...</h2>
          <p className="text-gray-600">Cargando tu tienda de comestibles</p>
        </div>
      </div>
    )
  }

  // Show error screen if server is offline
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <WifiOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Servidor No Disponible</h2>
          <p className="text-gray-600 mb-6">
            No se puede conectar al servidor de la tienda. Por favor verifique su conexión a internet e intente nuevamente.
          </p>
          <Button onClick={retryConnection} className="bg-green-600 hover:bg-green-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar Conexión
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 via-orange-50 to-white">
      
      {/* Server Status Alert */}
      {serverStatus === 'online' && (
        <Alert className="m-4 border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Conectado al servidor - Todos los datos están en vivo desde la base de datos
          </AlertDescription>
        </Alert>
      )}

      {/* Loading indicator for data fetching */}
      {(categoriesLoading || productsLoading) && (
        <Alert className="m-4 border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Cargando datos frescos del servidor...
          </AlertDescription>
        </Alert>
      )}

      {/* Error alerts */}
      {categoriesError && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {categoriesError}
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-red-600 underline"
              onClick={loadCategories}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {productsError && (
        <Alert className="m-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {productsError}
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-red-600 underline"
              onClick={() => loadProducts()}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="bg-gradient-to-r from-green-700 to-orange-600 bg-clip-text text-transparent mb-3">Productos Frescos y Naturales</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra selección de frutas, verduras, lácteos y bebidas. 
            Todo fresco, natural y entregado directamente a tu puerta.
          </p>
        </div>

        {categories.length > 0 && (
          <Tabs value={activeCategory} onValueChange={(value: string) => {
            setActiveCategory(value)
            const category = categories.find(cat => cat.id === value)
            if (category?.subcategories?.[0]) {
              setActiveSubcategory(category.subcategories[0].id)
            } else {
              setActiveSubcategory('')
            }
          }}>
            {/* Category Tabs */}
            <TabsList className="grid w-full grid-cols-4 mb-8">
              {categories.slice(0, 4).map((category) => {
                const Icon = categoryIcon[category.name.toLowerCase() as keyof typeof categoryIcon] || Sparkles
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {/* Content for each category */}
            {categories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-orange-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-100 to-orange-100 rounded-full flex items-center justify-center">
                      {React.createElement(categoryIcon[category.name.toLowerCase() as keyof typeof categoryIcon] || Sparkles, {
                        className: "w-5 h-5 text-green-600"
                      })}
                    </div>
                    <h3 className="bg-gradient-to-r from-green-700 to-orange-600 bg-clip-text text-transparent">{category.name}</h3>
                  </div>

                  {/* Subcategory Badges */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {category.subcategories.map((subcategory: any) => (
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
                  )}

                  <Separator className="mb-6" />

                  {/* Current subcategory title and product count */}
                  <div className="mb-6">
                    <h4 className="mb-2">
                      {category.subcategories?.find((sub: any) => sub.id === activeSubcategory)?.name || category.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {products.length} productos disponibles
                      {serverStatus === 'online' && (
                        <span className="ml-2 text-green-600">• API conectado</span>
                      )}
                    </p>
                  </div>

                  {/* Products Grid */}
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 text-green-600 animate-spin mx-auto mb-2" />
                      <p className="text-gray-600">Cargando productos...</p>
                    </div>
                  ) : products.length > 0 ? (
                    <ProductGrid
                      products={products}
                      cartItems={cartItems}
                      onAddToCart={addToCart}
                      onQuantityChange={quantityChange}
                    />
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos disponibles</h3>
                      <p className="text-gray-600 mb-4">
                        No se encontraron productos en esta categoría.
                      </p>
                      <Button onClick={() => loadProducts()} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Recargar productos
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* No categories available */}
        {!categoriesLoading && categories.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No hay categorías disponibles</h3>
            <p className="text-gray-600 mb-4">No se pueden cargar las categorías de productos del servidor.</p>
            <Button onClick={loadCategories} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar Carga de Categorías
            </Button>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        cartItems={cartItems}
        products={cartProducts}
        weightUnit={weightUnit}
        onWeightUnitChange={setWeightUnit}
        onQuantityChange={quantityChange}
        onRemoveItem={removeItem}
        onCheckout={checkout}
        open={cartDrawerOpen}
        onOpenChange={setCartDrawerOpen}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode="login"
        onSuccess={() => {
          setShowAuthModal(false);
          toast.success('Successfully signed in! You can now proceed with checkout.');
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        open={showCheckoutModal}
        onOpenChange={setShowCheckoutModal}
        cartItems={cartItems}
        cartProducts={cartProducts}
        weightUnit={weightUnit}
        onCheckoutSuccess={checkoutSuccess}
      />
    </div>
  )
}