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
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const [cart, setCart] = useState<any>(null)
  const [cartProducts, setCartProducts] = useState<Product[]>([]) // Products in cart from all categories
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg')
  const [activeCategory, setActiveCategory] = useState('')
  const [activeSubcategory, setActiveSubcategory] = useState('')
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [hasInitializedCart, setHasInitializedCart] = useState(false)
  const [lastAuthState, setLastAuthState] = useState<boolean | null>(null)
  
  // API data state
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Check server health and initialize data
  useEffect(() => {
    const initializeApp = async () => {
      setServerStatus('checking')
      try {
        // Check server health
        const healthResponse = await healthCheck()
        if (!healthResponse.success) {
          throw new Error('Server health check failed')
        }
        
        setServerStatus('online')
        toast.success('Connected to server')
        
        // Load initial data
        await loadCategories()
        await loadProducts() // Load all products initially
        await loadCart()
        setHasInitializedCart(true)
        
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setServerStatus('offline')
        setCategoriesError('Failed to connect to server')
        setProductsError('Failed to connect to server')
        toast.error('Server unavailable - please check your connection')
      }
    }

    initializeApp()
  }, [])

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
      setCategoriesError('Failed to load categories')
      toast.error('Failed to load categories')
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
      setProductsError('Failed to load products')
      toast.error('Failed to load products')
    } finally {
      setProductsLoading(false)
    }
  }

  // Load cart from API or localStorage
  const loadCart = async () => {
    try {
      // Always try to get cart from server first (works for both authenticated and anonymous users)
      const response = await cartService.getCart()
      if (response.success && response.data) {
        setCart(response.data)
        // Update cart items from API response
        const newCartItems: Record<string, number> = {}
        const newCartProducts: Product[] = []
        
        // Add null/undefined checks for items array
        if (response.data.items && Array.isArray(response.data.items)) {
          response.data.items.forEach((item: any) => {
            if (item && item.productId) {
              newCartItems[item.productId] = item.quantity || 0
              if (item.product) {
                newCartProducts.push(item.product)
              }
            }
          })
        }
        
        setCartItems(newCartItems)
        setCartProducts(newCartProducts)
      } else if (!isAuthenticated) {
        // If server call failed and user is anonymous, fallback to localStorage
        const localCartItems = cartService.getLocalCartItems()
        const newCartItems: Record<string, number> = {}
        
        if (Array.isArray(localCartItems)) {
          localCartItems.forEach(item => {
            if (item && item.productId) {
              newCartItems[item.productId] = item.quantity || 0
            }
          })
        }
        
        setCartItems(newCartItems)
        
        // Fetch product details for items in cart
        if (localCartItems && localCartItems.length > 0) {
          try {
            const productIds = localCartItems.map(item => item.productId).filter(Boolean)
            // We need to fetch products by IDs - this would require a new API endpoint
            // For now, we'll keep the existing products in the cart
            setCartProducts(cartProducts.filter(product => productIds.includes(product.id)))
          } catch (error) {
            console.error('Failed to fetch cart product details:', error)
          }
        } else {
          setCartProducts([])
        }
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      // Cart errors are non-critical, just log them
      // Set empty cart state to prevent undefined errors
      setCartItems({})
      setCartProducts([])
    }
  }

  // Reload cart when authentication status changes
  useEffect(() => {
    // Skip if this is the initial render or we haven't done the initial cart load yet
    if (serverStatus === 'checking' || !hasInitializedCart) {
      return
    }
    
    // Check if authentication state actually changed
    if (lastAuthState === null) {
      // First time setting the authentication state after initialization
      setLastAuthState(isAuthenticated)
      return
    }
    
    if (lastAuthState === isAuthenticated) {
      // No actual change in authentication state
      return
    }
    
    // Authentication state actually changed - update cart
    setLastAuthState(isAuthenticated)
    
    if (isAuthenticated) {
      cartService.migrateLocalCart().then(() => {
        // Reload cart after migration
        loadCart()
      }).catch(error => {
        console.error('Failed to migrate local cart:', error)
        // Still load cart even if migration fails
        loadCart()
      })
    } else {
      // User logged out, just load cart normally (anonymous cart)
      loadCart()
    }
  }, [isAuthenticated, serverStatus, hasInitializedCart])

  // Reload products when category/subcategory changes
  useEffect(() => {
    if (serverStatus === 'online' && categories.length > 0) {
      loadProducts()
    }
  }, [activeCategory, activeSubcategory, categories])

  const handleAddToCart = async (product: Product, quantity: number) => {
    if (serverStatus !== 'online') {
      toast.error('Cannot add to cart - server offline')
      return
    }

    try {
      const response = await cartService.addToCart({ 
        productId: product.id, 
        quantity 
      })
      
      if (response.success) {
        // Update local state
        setCartItems(prev => ({
          ...prev,
          [product.id]: (prev[product.id] || 0) + quantity
        }))

        // Add product to cart products if not already there
        setCartProducts(prev => {
          const existingProduct = prev.find(p => p.id === product.id)
          if (!existingProduct) {
            return [...prev, product]
          }
          return prev
        })

        toast.success(`${product.name} agregado al carrito`)
        
        // Reload cart for authenticated users to get server state
        if (isAuthenticated) {
          loadCart()
        }
      } else {
        throw new Error(response.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add item to cart')
    }
  }

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (serverStatus !== 'online') {
      toast.error('Cannot update cart - server offline')
      return
    }

    try {
      if (quantity <= 0) {
        await handleRemoveItem(productId)
        return
      }

      // Update local state immediately for better UX
      setCartItems(prev => ({
        ...prev,
        [productId]: quantity
      }))

      if (isAuthenticated) {
        // Find cart item and update via API
        const cartItem = cart?.items?.find((item: any) => item.productId === productId)
        if (cartItem) {
          const response = await cartService.updateCartItem(cartItem.id, { quantity })
          if (response.success) {
            loadCart() // Reload cart from server
          }
        }
      } else {
        // For anonymous users, update local storage
        const response = await cartService.updateCartItem(productId, { quantity })
        if (response.success) {
          // Local storage already updated by cartService
        }
      }
    } catch (error) {
      console.error('Failed to update cart item:', error)
      toast.error('Failed to update cart')
      // Revert local state on error
      await loadCart()
    }
  }

  const handleRemoveItem = async (productId: string) => {
    if (serverStatus !== 'online') {
      toast.error('Cannot remove item - server offline')
      return
    }

    try {
      // Update local state immediately
      setCartItems(prev => {
        const newItems = { ...prev }
        delete newItems[productId]
        return newItems
      })

      // Remove from cart products
      setCartProducts(prev => prev.filter(product => product.id !== productId))

      if (isAuthenticated) {
        // Find cart item and remove via API
        const cartItem = cart?.items?.find((item: any) => item.productId === productId)
        if (cartItem) {
          const response = await cartService.removeFromCart(cartItem.id)
          if (response.success) {
            loadCart() // Reload cart from server
          }
        }
      } else {
        // For anonymous users, remove from local storage
        const response = await cartService.removeFromCart(productId)
        if (response.success) {
          // Local storage already updated by cartService
        }
      }

      const product = cartProducts.find(p => p.id === productId)
      if (product) {
        toast.success(`${product.name} eliminado del carrito`)
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error)
      toast.error('Failed to remove item')
      // Revert local state on error
      await loadCart()
    }
  }

  const handleCheckout = async () => {
    if (Object.keys(cartItems).length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please sign in to proceed with checkout');
      setShowAuthModal(true);
      return;
    }

  // Open checkout modal
  setShowCheckoutModal(true);
  setCartDrawerOpen(false);
}

const handleCheckoutSuccess = async () => {
  // Clear local cart state
  setCartItems({});
  setCartProducts([]);
  setCart(null);
  
  // Reload cart from server to confirm it's empty
  await loadCart();
}

const retryConnection = async () => {
    toast.info('Reconnecting to server...')
    setServerStatus('checking')
    
    try {
      const healthResponse = await healthCheck()
      if (healthResponse.success) {
        setServerStatus('online')
        toast.success('Reconnected to server')
        await loadCategories()
        await loadProducts()
        await loadCart()
      } else {
        throw new Error('Health check failed')
      }
    } catch (error) {
      setServerStatus('offline')
      toast.error('Still unable to connect to server')
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting to server...</h2>
          <p className="text-gray-600">Loading your grocery store</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Server Unavailable</h2>
          <p className="text-gray-600 mb-6">
            Unable to connect to the grocery store server. Please check your internet connection and try again.
          </p>
          <Button onClick={retryConnection} className="bg-green-600 hover:bg-green-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Connection
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
            Connected to server - All data is live from database
          </AlertDescription>
        </Alert>
      )}

      {/* Loading indicator for data fetching */}
      {(categoriesLoading || productsLoading) && (
        <Alert className="m-4 border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Loading fresh data from server...
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
              Retry
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
              Retry
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
                      onAddToCart={handleAddToCart}
                      onQuantityChange={handleQuantityChange}
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
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories available</h3>
            <p className="text-gray-600 mb-4">Unable to load product categories from the server.</p>
            <Button onClick={loadCategories} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Categories
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
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
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
        onCheckoutSuccess={handleCheckoutSuccess}
      />
    </div>
  )
}