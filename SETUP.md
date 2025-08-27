# MenuSnap Setup Guide

## 🔧 Environment Setup

### 1. Clerk Configuration ✅ (Done)

Your Clerk credentials have been integrated:

- **Frontend**: `VITE_CLERK_PUBLISHABLE_KEY` configured
- **Backend**: `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` configured

### 2. Database Setup (Required Action)

#### What I've Done:

- ✅ Created complete PostgreSQL schema (`database-schema.sql`)
- ✅ Added analytics views for KPIs and reporting
- ✅ Configured database connection logic
- ✅ Set up automatic schema initialization

#### What You Need to Do:

**Option A: Use Supabase (Recommended)**

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Get your connection string from Settings > Database
3. Update `DATABASE_URL` in `/backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. The schema will auto-initialize when you first run the backend

**Option B: Local PostgreSQL**

1. Install PostgreSQL locally
2. Create database: `createdb menusnap`
3. Update `DATABASE_URL` in `/backend/.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/menusnap
   ```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
# Update .env with your database URL
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🔑 Clerk Configuration in Dashboard

### Required Clerk Settings:

1. **OAuth Providers**: Enable Google OAuth
2. **Redirect URLs**:
   - Sign-in: `http://localhost:5173/sign-in`
   - Sign-up: `http://localhost:5173/sign-up`
   - After sign-in: `http://localhost:5173/dashboard`
3. **Webhooks** (Optional for advanced features):
   - Endpoint: `http://localhost:5000/api/auth/webhook`
   - Events: `user.created`, `user.updated`, `user.deleted`

## 📊 Database Schema Explanation

### Core Tables:

- **users**: Stores user data synced from Clerk (id = Clerk user ID)
- **cafes**: Café information with social links, plan, and status
- **cafe_applications**: Application workflow data
- **notifications**: Real-time notification system
- **support_tickets**: Customer support system

### Analytics Views:

- **v_cafe_counts_by_plan**: Café distribution by plan type
- **v_mrr**: Monthly Recurring Revenue calculations
- **v_system_metrics**: Overall system KPIs
- **mv_daily_metrics**: Materialized view for daily metrics (auto-refreshed)

### Auto-Initialization:

The database schema automatically initializes when the backend starts:

1. Creates all tables and indexes
2. Sets up analytics views
3. Creates the super admin user when they first sign in

## 🎯 User Flow

### 1. Authentication Flow:

- User signs in with Google via Clerk
- Backend automatically creates user record with appropriate role
- Super admin (souroveahmed15@gmail.com) gets ADMIN role
- Others get USER role initially

### 2. Café Application Flow:

- User applies via `/apply` → role changes to PENDING_CAFE
- Admin approves → role changes to CAFE_OWNER + café record created
- Real-time notifications via Socket.io

### 3. Role-Based Access:

- **ADMIN**: Full system access
- **DEV**: Admin features, cannot edit roles
- **MOD**: Café management + support only
- **CAFE_OWNER**: Café dashboard access
- **USER**: Customer features
- **PENDING_CAFE**: Application status page only

## 🔧 Development Notes

### Database Connection:

The app uses connection pooling and automatically handles:

- Schema initialization
- Connection health checks
- Graceful shutdowns

### Real-time Features:

- Socket.io authentication via Clerk tokens
- Role-based room joining
- Real-time application status updates

### Security:

- All routes protected with Clerk middleware
- Role-based access control
- Input validation with Zod schemas
- Rate limiting and CORS configured

## 🚨 Important: First Run

1. **Update Database URL**: Replace the placeholder in `/backend/.env`
2. **Start Backend First**: This initializes the database schema
3. **Check Logs**: Verify database connection and schema creation
4. **Test Sign-in**: Sign in with your super admin email to verify role assignment

## 📝 Next Steps After Setup

1. **Test the full application flow**:

   - Sign in with Google
   - Submit a café application
   - Approve it from admin dashboard
   - Verify real-time notifications

2. **Customize as needed**:
   - Update super admin email in `.env`
   - Modify plan pricing in constants
   - Add additional social media platforms

The application is production-ready with proper error handling, logging, and scalable architecture!
