import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  UserIcon, 
  ShoppingBagIcon, 
  EditIcon, 
  SaveIcon, 
  XIcon,
  CalendarIcon,
  DollarSignIcon,
  PackageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../services/api';

// Types
interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[]; // Changed from 'items' to 'orderItems'
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product: {
    id: string;
    name: string;
    imageUrl?: string;
    unit: string;
  };
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export const UserPage: React.FC = () => {
  const { user, isLoading, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  } | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Determine active tab based on URL
  const getActiveTab = () => {
    if (location.pathname === '/profile/orders') {
      return 'orders';
    }
    return 'profile';
  };

  const handleTabChange = (value: string) => {
    if (value === 'orders') {
      navigate('/profile/orders');
    } else {
      navigate('/profile');
    }
  };

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || ''
      });
    }
  }, [user]);

  const fetchOrders = useCallback(async (page = 1) => {
    try {
      setOrdersLoading(true);
      // Server now returns: { success: true, data: { orders: Order[], pagination: {...} } }
      const response = await apiClient.get<{ orders: Order[]; pagination: any }>(`/orders?page=${page}&limit=10`);
      
      if (response.success && response.data) {
        // Ensure numeric values are properly converted
        const ordersWithNumbers = (response.data.orders || []).map(order => ({
          ...order,
          total: Number(order.total) || 0,
          subtotal: Number(order.subtotal) || 0,
          deliveryFee: Number(order.deliveryFee) || 0,
          orderItems: (order.orderItems || []).map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,
          }))
        }));
        
        setOrders(ordersWithNumbers);
        setOrdersPagination(response.data.pagination || null);
        setOrdersPage(page);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load order history');
      setOrders([]); // Set empty array on error to prevent undefined issues
      setOrdersPagination(null);
    } finally {
      setOrdersLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Fetch user orders
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      const response = await apiClient.put('/users/profile', profileData);
      
      if (response.success) {
        toast.success('Perfil actualizado correctamente');
        setIsEditingProfile(false);
        await refreshUser(); // Refresh user data in context
      } else {
        toast.error('No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleProfileCancel = () => {
    // Reset to original user data
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || ''
      });
    }
    setIsEditingProfile(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready_for_delivery':
        return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading state while authentication is being verified
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Cargando...</h3>
              <p className="mt-1 text-sm text-gray-500">Verificando la información de su cuenta.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Not logged in</h3>
              <p className="mt-1 text-sm text-gray-500">Please log in to view your profile.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile information and view your order history
          </p>
        </div>

        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="flex w-full">
            <TabsTrigger value="profile" className="flex items-center gap-2 flex-1">
              <UserIcon className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 flex-1">
              <ShoppingBagIcon className="h-4 w-4" />
              Historial de Pedidos
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      disabled={!isEditingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      disabled={!isEditingProfile}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditingProfile}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Número de Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditingProfile}
                    placeholder="Optional"
                  />
                </div>

                {isEditingProfile && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                    >
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {profileSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleProfileCancel}
                      disabled={profileSaving}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pedidos</CardTitle>
                <CardDescription>
                  View all your past orders and their details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Cargando pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aún no hay pedidos</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Comienza a comprar para ver tus pedidos aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <Card key={order.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">Pedido #{order.id.slice(-8)}</h3>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  {formatDate(order.createdAt)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSignIcon className="h-4 w-4" />
                                  ${(Number(order.total) || 0).toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <PackageIcon className="h-4 w-4" />
                                  {order.orderItems && Array.isArray(order.orderItems) ? order.orderItems.length : 0} artículo{(order.orderItems && Array.isArray(order.orderItems) ? order.orderItems.length : 0) !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-4" />

                          {/* Order Items */}
                          <div className="space-y-3">
                            <h4 className="font-medium">Artículos Pedidos:</h4>
                            {order.orderItems && Array.isArray(order.orderItems) && order.orderItems.length > 0 ? (
                              order.orderItems.map((item: OrderItem) => (
                                <div key={item.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {item.product?.imageUrl && (
                                      <img 
                                        src={item.product.imageUrl} 
                                        alt={item.product.name}
                                        className="h-10 w-10 rounded object-cover"
                                      />
                                    )}
                                    <div>
                                      <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                                      <p className="text-sm text-gray-500">
                                        {item.quantity} × ${item.unitPrice?.toFixed(2) || '0.00'} {item.product?.unit || ''}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="font-medium">${item.total?.toFixed(2) || '0.00'}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500">No se encontraron artículos en este pedido.</p>
                            )}
                          </div>

                          <Separator className="my-4" />

                          {/* Order Total */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Subtotal:</span>
                              <span>${(Number(order.subtotal) || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Delivery Fee:</span>
                              <span>${(Number(order.deliveryFee) || 0).toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>${(Number(order.total) || 0).toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Delivery Address */}
                          {order.deliveryAddress && (
                            <>
                              <Separator className="my-4" />
                              <div>
                                <h4 className="font-medium mb-2">Delivery Address:</h4>
                                <p className="text-sm text-gray-600">
                                  {order.deliveryAddress.street}<br />
                                  {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                                </p>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {ordersPagination && ordersPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="text-sm text-gray-500">
                      Mostrando {((ordersPagination.page - 1) * ordersPagination.limit) + 1} a{' '}
                      {Math.min(ordersPagination.page * ordersPagination.limit, ordersPagination.total)} de{' '}
                      {ordersPagination.total} pedidos
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrders(ordersPagination.page - 1)}
                        disabled={ordersPagination.page <= 1 || ordersLoading}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {ordersPagination.page} de {ordersPagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchOrders(ordersPagination.page + 1)}
                        disabled={!ordersPagination.hasMore || ordersLoading}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </div>
  );
};