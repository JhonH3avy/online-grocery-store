import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { MapPin, Plus, CreditCard, Truck, Check, X, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Product } from './ProductCard'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { cartService } from '../services/cartService'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../services/api'

interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
  createdAt: string
}

interface CheckoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cartItems: Record<string, number>
  cartProducts: Product[]
  weightUnit: 'kg' | 'lb'
  onCheckoutSuccess: () => void
}

export function CheckoutModal({
  open,
  onOpenChange,
  cartItems,
  cartProducts,
  weightUnit,
  onCheckoutSuccess
}: CheckoutModalProps) {
  const { token, isAuthenticated } = useAuth()
  const [step, setStep] = useState<'review' | 'address' | 'payment' | 'processing'>('review')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  
  // New address form data
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Colombia',
    isDefault: false
  })

  // Payment form data
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'credit_card' as const,
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  })

  const [notes, setNotes] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

  // Load user addresses when modal opens
  useEffect(() => {
    if (open && step === 'address' && token) {
      loadAddresses()
    }
  }, [open, step, token])

  // Load addresses immediately when modal opens if user is authenticated
  useEffect(() => {
    if (open && token && isAuthenticated) {
      loadAddresses()
    }
  }, [open, token, isAuthenticated])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setStep('review')
      setShowAddressForm(false)
      setEditingAddress(null)
      setSelectedAddressId('')
      setAddresses([]) // Clear addresses to prevent stale data
      setNewAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Colombia',
        isDefault: false
      })
      setPaymentMethod({
        type: 'credit_card',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: ''
      })
      setNotes('')
    }
  }, [open])

  const loadAddresses = async () => {
    if (!token) {
      console.log('No auth token available')
      return
    }
    
    console.log('Loading addresses with token:', token.substring(0, 20) + '...')
    setLoadingAddresses(true)
    try {
      const response = await fetch('/api/users/addresses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('Addresses response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Addresses data received:', data)
        
        // Deduplicate addresses by ID to prevent duplicates
        const uniqueAddresses = Array.isArray(data.data) 
          ? data.data.filter((address: Address, index: number, arr: Address[]) => 
              arr.findIndex(a => a.id === address.id) === index
            )
          : [];
        
        console.log('Unique addresses after deduplication:', uniqueAddresses)
        setAddresses(uniqueAddresses)
        
        // Select default address if available
        const defaultAddress = uniqueAddresses.find((addr: Address) => addr.isDefault)
        if (defaultAddress && !selectedAddressId) {
          setSelectedAddressId(defaultAddress.id)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to load addresses:', response.status, errorText)
        throw new Error('Failed to load addresses')
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
      toast.error('Failed to load addresses')
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleSaveAddress = async () => {
    if (!token) {
      toast.error('You must be logged in to add addresses')
      return
    }
    
    if (!newAddress.street || !newAddress.city || !newAddress.state || !newAddress.zipCode) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const url = editingAddress 
        ? `/api/users/addresses/${editingAddress.id}`
        : '/api/users/addresses'
      
      const method = editingAddress ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAddress)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(editingAddress ? 'Address updated successfully' : 'Address added successfully')
        
        // Reload addresses
        await loadAddresses()
        
        // Select the new/updated address
        if (data.address) {
          setSelectedAddressId(data.address.id)
        }
        
        // Reset form
        setShowAddressForm(false)
        setEditingAddress(null)
        setNewAddress({
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Colombia',
          isDefault: false
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save address')
      }
    } catch (error) {
      console.error('Error saving address:', error)
      toast.error('Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    setAddressToDelete(addressId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return

    if (!token) {
      toast.error('You must be logged in to delete addresses')
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.delete(`/users/addresses/${addressToDelete}`)
      
      if (response.success) {
        toast.success('Address deleted successfully')
        await loadAddresses()
        
        // Clear selection if deleted address was selected
        if (selectedAddressId === addressToDelete) {
          setSelectedAddressId('')
        }
      } else {
        throw new Error(response.error || 'Failed to delete address')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
      setAddressToDelete(null)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setNewAddress({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      isDefault: address.isDefault
    })
    setShowAddressForm(true)
  }

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address')
      return
    }

    setStep('processing')
    setLoading(true)

    try {
      // Find the selected address
      const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)
      if (!selectedAddress) {
        throw new Error('Selected address not found')
      }

      const checkoutData = {
        deliveryAddressId: selectedAddress.id,
        paymentMethod: paymentMethod,
        notes: notes.trim() || undefined
      }

      const response = await cartService.checkout(checkoutData)
      
      if (response.success) {
        toast.success(`Order placed successfully! Order ID: ${response.data?.orderId}`)
        onCheckoutSuccess()
        onOpenChange(false)
      } else {
        throw new Error(response.error || 'Checkout failed')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to complete checkout. Please try again.')
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const convertedPrice = (price: number) => {
    if (weightUnit === 'lb') {
      return price * 2.20462
    }
    return price
  }

  const getDisplayUnit = (originalUnit: string) => {
    if (originalUnit === 'kg' && weightUnit === 'lb') return 'lb'
    if (originalUnit === 'lb' && weightUnit === 'kg') return 'kg' 
    return originalUnit
  }

  const itemsInCart = Object.entries(cartItems).filter(([_, quantity]) => quantity > 0)
  const totalPrice = itemsInCart.reduce((sum, [productId, quantity]) => {
    const product = cartProducts.find(p => p.id === productId)
    if (!product) return sum
    return sum + (convertedPrice(product.price) * quantity)
  }, 0)

  const deliveryFee = 5000 // Fixed delivery fee
  const finalTotal = totalPrice + deliveryFee

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        {step === 'review' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Order Review</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {itemsInCart.map(([productId, quantity]) => {
                  const product = cartProducts.find(p => p.id === productId)
                  if (!product) return null

                  return (
                    <div key={productId} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 overflow-hidden rounded">
                        <ImageWithFallback
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-gray-600">
                          {quantity} {getDisplayUnit(product.unit)} × ${convertedPrice(product.price).toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="text-orange-600 font-medium">
                        ${(convertedPrice(product.price) * quantity).toLocaleString('es-CO')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${totalPrice.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>${deliveryFee.toLocaleString('es-CO')}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-orange-600">${finalTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep('address')} className="bg-green-600 hover:bg-green-700">
                Continue to Delivery
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'address' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Delivery Address</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddressForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Address
              </Button>
            </div>

            {showAddressForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Bogotá"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Bogotá D.C."
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                      <Input
                        id="zipCode"
                        value={newAddress.zipCode}
                        onChange={(e) => setNewAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                        placeholder="110111"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={newAddress.country}
                        onValueChange={(value: string) => setNewAddress(prev => ({ ...prev, country: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Colombia">Colombia</SelectItem>
                          <SelectItem value="Mexico">Mexico</SelectItem>
                          <SelectItem value="Argentina">Argentina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={newAddress.isDefault}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="isDefault">Set as default address</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveAddress} disabled={loading}>
                      {loading ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddressForm(false)
                        setEditingAddress(null)
                        setNewAddress({
                          street: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          country: 'Colombia',
                          isDefault: false
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingAddresses ? (
              <div className="text-center py-8">
                <p>Loading addresses...</p>
              </div>
            ) : addresses.length > 0 ? (
              <RadioGroup
                value={selectedAddressId}
                onValueChange={setSelectedAddressId}
                className="space-y-3"
              >
                {addresses.map((address) => (
                  <div key={address.id} className="relative">
                    <RadioGroupItem
                      value={address.id}
                      id={address.id}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={address.id}
                      className="block cursor-pointer"
                    >
                      <Card
                        className={`transition-colors border-2 ${
                          selectedAddressId === address.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{address.street}</span>
                                {address.isDefault && (
                                  <Badge variant="secondary" className="text-xs">Default</Badge>
                                )}
                                {selectedAddressId === address.id && (
                                  <Badge className="text-xs bg-green-600 text-white">Selected</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {address.city}, {address.state} {address.zipCode}
                              </p>
                              <p className="text-sm text-gray-600">{address.country}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleEditAddress(address)
                                }}
                                className="cursor-pointer"
                                disabled={loading}
                                type="button"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e: React.MouseEvent) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteAddress(address.id)
                                }}
                                className="text-red-500 hover:text-red-700 cursor-pointer"
                                disabled={loading}
                                type="button"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No addresses found. Please add an address to continue.</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('review')}>
                Back
              </Button>
              <Button
                onClick={() => setStep('payment')}
                disabled={!selectedAddressId}
                className="bg-green-600 hover:bg-green-700"
              >
                Continue to Payment
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Payment Information</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Credit Card Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    value={paymentMethod.cardholderName}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardholderName: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={paymentMethod.cardNumber}
                    onChange={(e) => setPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      value={paymentMethod.expiryDate}
                      onChange={(e) => setPaymentMethod(prev => ({ ...prev, expiryDate: e.target.value }))}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={paymentMethod.cvv}
                      onChange={(e) => setPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="notes">Order Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions for delivery..."
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${totalPrice.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span>${deliveryFee.toLocaleString('es-CO')}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-orange-600">${finalTotal.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('address')}>
                Back
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={!paymentMethod.cardholderName || !paymentMethod.cardNumber || !paymentMethod.expiryDate || !paymentMethod.cvv}
                className="bg-green-600 hover:bg-green-700"
              >
                Place Order
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Your Order</h3>
            <p className="text-gray-600">Please wait while we process your order...</p>
          </div>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this address? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteConfirm(false)
                setAddressToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteAddress}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}