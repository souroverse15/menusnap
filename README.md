# MenuSnap 🍽️

A modern MERN-stack SaaS platform for cafés to create beautiful digital menus and manage orders seamlessly.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### 🔧 Setup (2 minutes)

1. **Get your database ready**:

   - Create a [Supabase](https://supabase.com) project
   - Copy your connection string

2. **Configure database**:

   ```bash
   # Update /backend/.env with your DATABASE_URL
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. **Start the application**:

   ```bash
   # Backend (Terminal 1)
   cd backend
   npm install
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm install
   npm run dev
   ```

4. **Visit**: `http://localhost:5173` 🎉

> **Note**: Clerk credentials are already configured! Database schema auto-initializes on first run.

## ✨ Features

### 🎯 MVP Ready

- **Google OAuth**: Seamless sign-in via Clerk
- **Café Onboarding**: Multi-step application wizard with logo & social links
- **Real-time Approvals**: Instant notifications via Socket.io
- **Role-Based Access**: 6 different user roles with proper permissions
- **Admin Dashboard**: Application management and user controls
- **Modern UI**: ShadCN components with rose theme
- **Analytics**: PostgreSQL views for KPIs and revenue tracking

### 👥 User Roles

- **ADMIN** (souroveahmed15@gmail.com): Full system access
- **DEV**: Admin features, cannot edit roles
- **MOD**: Café management + support only
- **CAFE_OWNER**: Approved café dashboard
- **USER**: Customer ordering interface
- **PENDING_CAFE**: Application status tracking

### 💰 Plans

- **FREE**: 5 orders/month
- **PLUS**: 10 orders/month ($29)
- **PRO**: 25 orders/month ($79)

## 🏗️ Architecture

**Strict MVC Pattern**:

```
├── backend/
│   ├── models/          # Database layer
│   ├── controllers/     # Business logic
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation, errors
│   └── sockets/         # Real-time handlers
├── frontend/
│   ├── pages/           # Route components (Views)
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   └── constants/       # Shared constants
```

## 📊 Database

### Auto-Initialization

The database schema automatically sets up when you first run the backend:

- ✅ All tables with relationships
- ✅ Performance indexes
- ✅ Analytics views for reporting
- ✅ Super admin user creation

### Analytics Views

```sql
-- Real-time KPIs ready for admin dashboard
v_cafe_counts_by_plan  -- Café distribution
v_mrr                  -- Monthly Recurring Revenue
v_system_metrics       -- Overall system stats
mv_daily_metrics       -- Daily metrics (materialized)
```

## 🔐 Authentication Flow

1. **User signs in** with Google → Clerk handles OAuth
2. **Backend syncs** user data → Creates database record
3. **Role assignment**: Super admin gets ADMIN, others get USER
4. **Application flow**: USER → applies → PENDING_CAFE → approved → CAFE_OWNER

## 🌐 API Endpoints

### Core APIs

```
POST /api/cafe/apply              # Submit café application
GET  /api/cafe/application        # Get application status
GET  /api/admin/applications      # List all applications (admin)
POST /api/admin/applications/:id/approve  # Approve application
GET  /api/admin/dashboard         # Admin analytics
PUT  /api/admin/users/:id/role    # Update user role
```

## ⚡ Real-time Features

Socket.io events for instant updates:

- `application:new` → Admin gets notified
- `application:approved` → User auto-redirects to dashboard
- `notification:new` → General system notifications
- `support:message` → Live chat functionality

## 🎨 UI Components

Built with **ShadCN** + **Tailwind** (Rose theme):

- Responsive design for all devices
- Accessible components
- Consistent design system
- Loading states and error handling
- Real-time status updates

## 🔧 Development

### Folder Structure

```
menusnap/
├── backend/              # Node.js + Express API
│   ├── constants/        # Shared constants (roles, plans)
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth, validation, errors
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── sockets/         # Socket.io handlers
├── frontend/            # React + Vite SPA
│   ├── src/pages/       # Route components
│   ├── src/components/  # UI components
│   ├── src/hooks/       # Custom hooks
│   └── src/constants/   # Frontend constants
└── database-schema.sql  # Complete PostgreSQL schema
```

### Key Technologies

- **Backend**: Express, Socket.io, PostgreSQL, Clerk
- **Frontend**: React, Vite, ShadCN, Tailwind, React Query
- **Database**: PostgreSQL with analytics views
- **Auth**: Clerk with Google OAuth + RBAC
- **Real-time**: Socket.io with authentication

## 📈 Production Ready

✅ **Security**: Rate limiting, CORS, helmet, input validation  
✅ **Performance**: Connection pooling, materialized views, indexes  
✅ **Monitoring**: Comprehensive logging and error handling  
✅ **Scalability**: Modular architecture, environment configs  
✅ **Real-time**: Socket.io with authentication and room management

## 🛣️ Roadmap

### Phase 2 (Post-MVP)

- Menu CRUD with image uploads
- Live order processing
- QR code generation
- Payment integration (Stripe)
- Advanced analytics dashboard
- Multi-location support

### Phase 3 (Scale)

- Mobile app (React Native)
- API marketplace
- Third-party integrations
- Advanced reporting (PostHog)
- Multi-tenant architecture

## 📝 Notes

- **Super Admin**: souroveahmed15@gmail.com gets ADMIN role automatically
- **Database**: Schema auto-initializes, no manual setup needed
- **Clerk**: Pre-configured with Google OAuth
- **Socket.io**: Real-time notifications work out of the box
- **Analytics**: PostgreSQL views provide instant KPIs

## 🎉 That's It!

Your MenuSnap SaaS is ready to go! The complete café onboarding flow, admin management, real-time notifications, and analytics are all working. Just update your database URL and start coding! 🚀
