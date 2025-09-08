# Online Grocery Store - API Endpoints Specification

## Overview
This document outlines the complete API specification for the Online Grocery Store backend server. The backend will be built using Node.js + TypeScript with PostgreSQL database and Docker support.

## Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma (recommended)
- **Authentication**: JWT
- **Containerization**: Docker & Docker Compose
- **API Documentation**: OpenAPI/Swagger

## Database Design

### Core Entities
1. **Users** - Customer information and authentication
2. **Products** - Product catalog with details
3. **Categories** - Product categories and subcategories
4. **Cart Items** - Shopping cart sessions
5. **Orders** - Order information
6. **Order Items** - Products in each order
7. **Inventory** - Stock levels and availability
8. **Addresses** - Customer delivery addresses
9. **Reviews** - Product reviews and ratings

## API Endpoints Specification

### 1. Authentication & Authorization (4 endpoints)

#### POST /api/auth/register
**Purpose**: User registration
**Body**:
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string"
}
```
**Response**: 
```json
{
  "user": { "id": "string", "email": "string", "firstName": "string" },
  "token": "string"
}
```

#### POST /api/auth/login
**Purpose**: User login
**Body**:
```json
{
  "email": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "user": { "id": "string", "email": "string", "firstName": "string" },
  "token": "string"
}
```

#### POST /api/auth/logout
**Purpose**: User logout (blacklist token)
**Headers**: `Authorization: Bearer <token>`
**Response**: `{ "message": "Logged out successfully" }`

#### POST /api/auth/refresh
**Purpose**: Refresh JWT token
**Body**: `{ "refreshToken": "string" }`
**Response**: `{ "token": "string" }`

### 2. User Management (4 endpoints)

#### GET /api/users/profile
**Purpose**: Get user profile
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "id": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "phone": "string",
  "createdAt": "date"
}
```

#### PUT /api/users/profile
**Purpose**: Update user profile
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "firstName": "string",
  "lastName": "string",
  "phone": "string"
}
```

#### GET /api/users/addresses
**Purpose**: Get user addresses
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
[
  {
    "id": "string",
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "isDefault": "boolean"
  }
]
```

#### POST /api/users/addresses
**Purpose**: Add new address
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "street": "string",
  "city": "string",
  "state": "string",
  "zipCode": "string",
  "isDefault": "boolean"
}
```

### 3. Product Management (6 endpoints)

#### GET /api/products
**Purpose**: Get all products with filtering
**Query Parameters**:
- `category`: string (optional)
- `subcategory`: string (optional)
- `search`: string (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `sortBy`: string (price, name, createdAt)
- `sortOrder`: string (asc, desc)

**Response**:
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "price": "number",
      "unit": "string",
      "description": "string",
      "imageUrl": "string",
      "category": "string",
      "subcategory": "string",
      "inStock": "boolean",
      "stockQuantity": "number"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

#### GET /api/products/:id
**Purpose**: Get single product details
**Response**: Single product object with reviews

#### GET /api/products/category/:categoryId
**Purpose**: Get products by category
**Response**: Array of products in the category

#### GET /api/products/search
**Purpose**: Search products
**Query**: `q` (search term)
**Response**: Array of matching products

#### GET /api/products/featured
**Purpose**: Get featured products
**Response**: Array of featured products

#### GET /api/products/availability/:id
**Purpose**: Check product availability
**Response**: `{ "inStock": "boolean", "quantity": "number" }`

### 4. Category Management (3 endpoints)

#### GET /api/categories
**Purpose**: Get all categories with subcategories
**Response**:
```json
[
  {
    "id": "string",
    "name": "string",
    "subcategories": [
      {
        "id": "string",
        "name": "string"
      }
    ]
  }
]
```

#### GET /api/categories/:id
**Purpose**: Get specific category
**Response**: Single category object

#### GET /api/categories/:id/subcategories
**Purpose**: Get subcategories
**Response**: Array of subcategories

### 5. Shopping Cart Management (5 endpoints)

#### GET /api/cart
**Purpose**: Get user's cart
**Headers**: `Authorization: Bearer <token>`
**Response**:
```json
{
  "items": [
    {
      "id": "string",
      "productId": "string",
      "product": {
        "id": "string",
        "name": "string",
        "price": "number",
        "imageUrl": "string",
        "unit": "string"
      },
      "quantity": "number",
      "subtotal": "number"
    }
  ],
  "total": "number",
  "itemCount": "number"
}
```

#### POST /api/cart/items
**Purpose**: Add item to cart
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "productId": "string",
  "quantity": "number"
}
```

#### PUT /api/cart/items/:id
**Purpose**: Update cart item quantity
**Headers**: `Authorization: Bearer <token>`
**Body**: `{ "quantity": "number" }`

#### DELETE /api/cart/items/:id
**Purpose**: Remove item from cart
**Headers**: `Authorization: Bearer <token>`

#### DELETE /api/cart
**Purpose**: Clear entire cart
**Headers**: `Authorization: Bearer <token>`

### 6. Order Management (4 endpoints)

#### POST /api/orders
**Purpose**: Create new order (checkout)
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "deliveryAddressId": "string",
  "paymentMethod": "string",
  "notes": "string"
}
```

#### GET /api/orders
**Purpose**: Get user's order history
**Headers**: `Authorization: Bearer <token>`
**Response**: Array of orders

#### GET /api/orders/:id
**Purpose**: Get specific order details
**Headers**: `Authorization: Bearer <token>`
**Response**: Complete order object with items

#### PUT /api/orders/:id/status
**Purpose**: Update order status (admin only)
**Headers**: `Authorization: Bearer <token>`
**Body**: `{ "status": "string" }`

### 7. Inventory Management (2 endpoints)

#### GET /api/inventory/:productId
**Purpose**: Check product stock
**Response**: `{ "productId": "string", "quantity": "number", "lastUpdated": "date" }`

#### PUT /api/inventory/:productId
**Purpose**: Update stock levels (admin only)
**Headers**: `Authorization: Bearer <token>`
**Body**: `{ "quantity": "number" }`

### 8. Additional Features (4 endpoints)

#### GET /api/health
**Purpose**: Health check
**Response**: `{ "status": "ok", "timestamp": "date" }`

#### POST /api/contact
**Purpose**: Contact form submission
**Body**:
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

#### GET /api/delivery-areas
**Purpose**: Get available delivery areas
**Response**: Array of delivery areas with zones and pricing

#### POST /api/reviews
**Purpose**: Submit product review
**Headers**: `Authorization: Bearer <token>`
**Body**:
```json
{
  "productId": "string",
  "rating": "number",
  "comment": "string"
}
```

## Authentication & Security

### JWT Token Structure
- **Access Token**: 15 minutes expiration
- **Refresh Token**: 7 days expiration
- **Token Storage**: HTTP-only cookies (recommended) or local storage

### Security Measures
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Environment variables for secrets

## Database Schema

### Key Tables Structure

#### users
```sql
id: UUID PRIMARY KEY
email: VARCHAR UNIQUE NOT NULL
password_hash: VARCHAR NOT NULL
first_name: VARCHAR NOT NULL
last_name: VARCHAR NOT NULL
phone: VARCHAR
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### products
```sql
id: UUID PRIMARY KEY
name: VARCHAR NOT NULL
price: DECIMAL NOT NULL
unit: VARCHAR NOT NULL
description: TEXT
image_url: VARCHAR
category_id: UUID REFERENCES categories(id)
subcategory_id: UUID REFERENCES subcategories(id)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

#### categories
```sql
id: UUID PRIMARY KEY
name: VARCHAR NOT NULL
created_at: TIMESTAMP
```

#### subcategories
```sql
id: UUID PRIMARY KEY
name: VARCHAR NOT NULL
category_id: UUID REFERENCES categories(id)
created_at: TIMESTAMP
```

## Integration with Current Frontend

### Priority Endpoints for Current App
1. `GET /api/categories` - For category tabs
2. `GET /api/products` - For product grid with filtering
3. `POST /api/cart/items` - For "Add to Cart" functionality
4. `GET /api/cart` - For cart drawer display
5. `PUT /api/cart/items/:id` - For quantity changes
6. `POST /api/orders` - For checkout process

### Required Frontend Changes
- Replace static `productsData` with API calls
- Add authentication state management
- Implement cart persistence with backend
- Add error handling for API calls
- Add loading states for better UX

## Development Phases

### Phase 1: Core Setup
- [ ] Project structure setup
- [ ] Database setup with Docker
- [ ] Basic authentication endpoints
- [ ] Product and category endpoints

### Phase 2: Cart & Orders
- [ ] Cart management endpoints
- [ ] Order processing
- [ ] Inventory management

### Phase 3: Additional Features
- [ ] User management
- [ ] Search functionality
- [ ] Reviews system
- [ ] Admin features

## Next Steps
1. Create server project structure
2. Set up Docker Compose with PostgreSQL
3. Initialize Prisma with database schema
4. Implement core authentication
5. Create product and category endpoints
6. Test integration with frontend app
