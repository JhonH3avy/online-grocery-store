# 🛒 Online Grocery Store

A full-stack e-commerce application for online grocery shopping built with React, Node.js, PostgreSQL, and Docker.

## 🏗️ Project Structure

```
online-grocery-store/
├── 📁 app/                    # React Frontend Application
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── 📁 server/                 # Node.js Backend API
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── package.json
├── 📁 docs/                   # Project Documentation
│   └── feat/
├── docker-compose.yml         # Multi-service container orchestration
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd online-grocery-store
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000
   - **API Health Check**: http://localhost:5000/api/health

### Development Mode

**Frontend (React)**
```bash
cd app
npm install
npm run dev
# Runs on http://localhost:3000
```

**Backend (Node.js)**
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:5000
```

## 🐳 Docker Services

| Service    | Container Name     | Port | Description                    |
|------------|-------------------|------|--------------------------------|
| frontend   | grocery-frontend  | 3000 | React app with nginx           |
| app        | grocery-app       | 5000 | Node.js Express API server     |
| postgres   | grocery-postgres  | 5432 | PostgreSQL database            |
| redis      | grocery-redis     | 6379 | Redis cache (optional)         |

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Redis** - Caching (optional)

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 📊 API Endpoints

### Core Endpoints
- `GET /api/health` - Health check ✅
- `GET /api/products` - Get products (coming soon)
- `GET /api/categories` - Get categories (coming soon)
- `POST /api/cart/items` - Add to cart (coming soon)
- `POST /api/orders` - Create order (coming soon)

*Full API documentation available in `/docs/feat/create-initial-server-implementation/`*

## 🗃️ Database Schema

The application uses PostgreSQL with Prisma ORM:
- **Users** - Customer accounts and authentication
- **Products** - Product catalog with categories
- **Categories** - Product organization
- **Cart Items** - Shopping cart management
- **Orders** - Order processing and history
- **Inventory** - Stock management

## 🔧 Environment Variables

Create `.env` files in respective directories:

**Server (.env)**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/grocery_store_db
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here
```

## 📝 Available Scripts

### Root Level
```bash
docker-compose up --build    # Start all services
docker-compose down         # Stop all services
docker-compose logs         # View logs
```

### Frontend (app/)
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### Backend (server/)
```bash
npm run dev        # Start development server
npm run build      # Build TypeScript
npm run start      # Start production server
npm run db:migrate # Run database migrations
npm run db:studio  # Open Prisma Studio
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for fresh grocery delivery
