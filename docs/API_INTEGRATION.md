# API Integration Documentation

## Overview

The Online Grocery Store application now has full API integration between the React frontend and Node.js backend, with PostgreSQL database and Redis caching support.

## Architecture

```
Frontend (React + Vite) → API Services → Backend (Node.js + Express) → Database (PostgreSQL)
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Categories
- **GET** `/api/categories` - Get all categories with subcategories
- Returns database-integrated category data

### Products
- **GET** `/api/products` - Get all products (with filtering)
  - Query params: `category`, `subcategory`, `search`, `limit`, `offset`, `featured`
- **GET** `/api/products/search?q={query}` - Search products
- **GET** `/api/products/featured` - Get featured products
- **GET** `/api/products/:id` - Get single product
- **GET** `/api/products/category/:categoryId` - Get products by category
- **GET** `/api/products/availability/:id` - Check product availability

### Cart (Enhanced)
- **GET** `/api/cart` - Get user's cart
- **POST** `/api/cart/items` - Add item to cart
- **PUT** `/api/cart/items/:itemId` - Update cart item quantity
- **DELETE** `/api/cart/items/:itemId` - Remove item from cart
- **DELETE** `/api/cart/clear` - Clear entire cart
- **POST** `/api/cart/coupon` - Apply coupon code
- **DELETE** `/api/cart/coupon` - Remove coupon
- **POST** `/api/cart/checkout` - Checkout cart

## Configuration System

### Environment Variables
The app uses Vite environment variables for configuration:

```bash
# Development (.env.development)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_USE_API_DATA=true
VITE_ENABLE_DEBUG=true
```

### Centralized Config
All configuration is managed through `app/src/config/index.ts`:

```typescript
import { config } from './config';

// Access API configuration
config.api.baseUrl // http://localhost:5000/api
config.features.useApiData // true/false
config.app.environment // development/production
```

## API Service Layer

### Enhanced HTTP Client
- **Retry Logic**: Automatic retries with exponential backoff
- **Timeout Handling**: Configurable request timeouts
- **Error Handling**: Consistent error response format
- **Type Safety**: Full TypeScript support

### Service Modules
- `categoryService.ts` - Category management
- `productService.ts` - Product operations
- `cartService.ts` - Shopping cart functionality
- `api.ts` - Base HTTP client with retry/timeout logic

## Frontend Integration

### Features
- **Fallback Strategy**: Graceful degradation to local data if API fails
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages
- **Real-time Updates**: Cart synchronization with API
- **Search Integration**: API-powered product search
- **Category Filtering**: Dynamic product filtering by category

### State Management
- Local state for immediate UI updates
- API synchronization for persistence
- Error boundary for API failures
- Optimistic updates for better UX

## Database Integration

### Current Status
- ✅ **Categories**: Fully database-integrated
- ⚠️ **Products**: Using mock data (ready for database migration)
- ⚠️ **Cart**: Using mock data (API structure ready)
- ⚠️ **Orders**: Using mock data (API structure ready)

### Database Schema
- Categories with subcategories (hierarchical)
- Products with inventory tracking
- Users and authentication
- Orders and order items
- Cart items with user sessions

## Running the Application

### Start Backend Services
```bash
docker-compose up -d app postgres redis
```

### Start Frontend Development
```bash
cd app
npm run dev
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Database: PostgreSQL on port 5432
- Redis: Port 6379

## Testing API Integration

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test categories (database-integrated)
curl http://localhost:5000/api/categories

# Test products with filtering
curl "http://localhost:5000/api/products?category=frutas&limit=5"

# Test search
curl "http://localhost:5000/api/products/search?q=naranja"

# Test featured products
curl http://localhost:5000/api/products/featured
```

### Frontend Features
1. **Category Navigation**: Click categories to filter products
2. **Search**: Use search bar for product lookup
3. **Cart Management**: Add/remove items with API sync
4. **Server Status**: Visual indicators for API connectivity
5. **Fallback Mode**: Automatic fallback to local data

## Next Steps

1. **Complete Database Migration**:
   - Migrate products endpoint to use Prisma/PostgreSQL
   - Implement cart database operations
   - Add orders database integration

2. **Authentication System**:
   - User registration/login
   - Session management with Redis
   - Protected routes

3. **Advanced Features**:
   - Product inventory management
   - Order tracking
   - Payment integration
   - Admin dashboard

## Configuration Options

### Feature Flags
```typescript
// Enable/disable API usage
VITE_USE_API_DATA=true

// Debug mode for development
VITE_ENABLE_DEBUG=true

// Analytics tracking
VITE_ENABLE_ANALYTICS=false
```

### API Configuration
```typescript
// API base URL
VITE_API_BASE_URL=http://localhost:5000/api

// Request timeout (ms)
config.api.timeout = 10000

// Retry attempts
config.api.retries = 3
```

The application now provides a robust, scalable foundation for an e-commerce grocery store with full API integration, proper error handling, and modern development practices.
